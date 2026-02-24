#!/usr/bin/env python3
"""
Slate Aviation Flight Scraper for Aviato

Strategy:
  1. GET  /getAirportsAndMa        → metro areas + airport codes
  2. POST /getCalendarSeatsPrices   → calendar of dates with prices per route
  3. Use Playwright to render each search page and extract SR IDs from the DOM
     (the search page is a Next.js SPA; raw HTML has no flight data)
  4. POST /getPlaneBySeatInfo       → full flight detail per SR ID

Output: slate_flights.json (flat list of flight dicts)
"""

import requests
import json
import time
import re
import os
from datetime import datetime, timedelta
from typing import Optional

BASE_URL = "https://app.flyslate.com"
API_URL = "https://api.app.flyslate.com"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Origin": BASE_URL,
    "Referer": f"{BASE_URL}/",
    "Content-Type": "application/json",
}

# Map ICAO codes to IATA for codes not in the API airport data
ICAO_TO_IATA_FALLBACK = {
    "NYC": "TEB",  # Slate uses "NYC" as a generic destination — map to Teterboro
}

# Rate limiting
BETWEEN_REQUESTS_S = 0.3
BETWEEN_DATES_S = 1.0
MAX_CONSECUTIVE_ERRORS = 5


def get_airports_and_metros() -> dict:
    """Fetch all metropolitan areas and airport codes."""
    resp = requests.get(f"{API_URL}/getAirportsAndMa", headers=HEADERS, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if not data.get("status"):
        raise Exception(f"API error: {data.get('message')}")
    metros = {m["metropolitan_area_id"]: m for m in data["ma"]}
    airports = {a["code"]: a for a in data["ap"]}
    return {"metros": metros, "airports": airports}


def get_calendar_prices(from_metro: int, to_metro: int) -> list[dict]:
    """Get all available dates with prices for a route."""
    payload = {"directions": [{"from": from_metro, "to": to_metro}]}
    resp = requests.post(
        f"{API_URL}/getCalendarSeatsPrices", headers=HEADERS, json=payload, timeout=30
    )
    resp.raise_for_status()
    data = resp.json()
    if not data.get("status"):
        return []
    return data.get("seats", [])


def get_sr_ids_playwright(page, from_metro: int, to_metro: int, date_compact: str) -> list[str]:
    """Use Playwright to render a search page and extract SR IDs from the DOM."""
    url = f"{BASE_URL}/search/points/{from_metro}-{to_metro}/dates/{date_compact}/ft/1/c/USD/"
    try:
        page.goto(url, wait_until="networkidle", timeout=20000)
        # Wait for flight cards to appear (they are <a> tags with /sr/ in href)
        page.wait_for_selector('a[href*="/sr/"]', timeout=10000)
        # Extract SR IDs
        links = page.query_selector_all('a[href*="/sr/"]')
        sr_ids = set()
        for link in links:
            href = link.get_attribute("href") or ""
            match = re.search(r"/sr/(\d+)/", href)
            if match:
                sr_ids.add(match.group(1))
        return list(sr_ids)
    except Exception as e:
        # Timeout or no flights found — return empty
        # Check if page loaded but has no flights (vs. error)
        try:
            page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        return []


def get_flight_detail(seat_reservation_id: int) -> Optional[dict]:
    """Get full flight details from getPlaneBySeatInfo API."""
    payload = {"id": seat_reservation_id}
    resp = requests.post(
        f"{API_URL}/getPlaneBySeatInfo", headers=HEADERS, json=payload, timeout=30
    )
    resp.raise_for_status()
    data = resp.json()
    if not data.get("status") or not data.get("charter"):
        return None
    return data["charter"]


def resolve_iata(slate_code: str, airports: dict) -> str:
    """Convert Slate's internal airport code to IATA code."""
    # Check fallback mapping first
    if slate_code in ICAO_TO_IATA_FALLBACK:
        return ICAO_TO_IATA_FALLBACK[slate_code]
    # Check the airports data from API
    ap = airports.get(slate_code, {})
    iata = ap.get("iata") or ap.get("faa")
    if iata:
        return iata
    # Strip leading K from ICAO codes (US airports)
    if slate_code.startswith("K") and len(slate_code) == 4:
        return slate_code[1:]
    return slate_code


def parse_flights(
    charter_data: dict,
    from_metro_id: int,
    to_metro_id: int,
    airports: dict,
) -> list[dict]:
    """Parse a charter/flight response into Aviato-compatible flight dicts."""
    short = charter_data.get("short", {})
    itinerary = charter_data.get("itinerary", [])
    flights = []

    for leg in itinerary:
        dep_code = resolve_iata(leg["from"], airports)
        arr_code = resolve_iata(leg["to"], airports)

        dep_local = leg.get("departureLocal", "")  # "2026-02-25 13:00"
        if not dep_local:
            continue

        dep_dt = datetime.strptime(dep_local, "%Y-%m-%d %H:%M")
        flight_time_min = leg.get("flightTime", 0)
        arr_dt = dep_dt + timedelta(minutes=flight_time_min)

        flight_date = dep_dt.strftime("%Y-%m-%d")
        date_compact = dep_dt.strftime("%Y%m%d")

        # Format times as "1:00 PM"
        dep_time = dep_dt.strftime("%-I:%M %p")
        arr_time = arr_dt.strftime("%-I:%M %p")

        # Price and seats
        price = leg.get("seatPrice", 0)
        seats = leg.get("maxPax", 0) - leg.get("alreadyTakenSeats", 0)
        if seats < 0:
            seats = 0

        # Aircraft name — clean up double spaces
        aircraft = short.get("name", "CRJ-200").strip()
        aircraft = re.sub(r"\s+", " ", aircraft)

        # Build booking deeplink
        sr_id = short.get("id", "")
        deeplink = (
            f"{BASE_URL}/search/points/{from_metro_id}-{to_metro_id}"
            f"/dates/{date_compact}/ft/1/c/USD/sr/{sr_id}/"
        )

        flights.append({
            "airline": "Slate",
            "origin_code": dep_code,
            "destination_code": arr_code,
            "date": flight_date,
            "departure_time": dep_time,
            "arrival_time": arr_time,
            "duration_minutes": flight_time_min,
            "price": price,
            "available_seats": max(seats, 1),
            "aircraft": aircraft,
            "seat_reservation_id": sr_id,
            "deeplink": deeplink,
        })

    return flights


def scrape_all_flights():
    """Main scraping function — uses Playwright to get SR IDs, then API for details."""
    from playwright.sync_api import sync_playwright

    print("=" * 60)
    print("Slate Aviation Flight Scraper (Playwright)")
    print("=" * 60)

    # Step 1: Get airport/metro data
    print("\n[1/4] Fetching airports and metropolitan areas...")
    ref_data = get_airports_and_metros()
    metros = ref_data["metros"]
    airports = ref_data["airports"]
    print(f"  Found {len(metros)} metro areas, {len(airports)} airports")
    for mid, m in metros.items():
        iata = resolve_iata(m["main_ap"], airports)
        print(f"    - {m['name']} (ID: {mid}, Main: {m['main_ap']} → {iata})")

    # Step 2: Discover active routes via calendar API
    print("\n[2/4] Discovering active routes...")
    metro_ids = list(metros.keys())
    active_routes = []

    for from_id in metro_ids:
        for to_id in metro_ids:
            if from_id == to_id:
                continue
            try:
                prices = get_calendar_prices(from_id, to_id)
                if prices:
                    active_routes.append((from_id, to_id, prices))
                    print(
                        f"    {metros[from_id]['name']} -> {metros[to_id]['name']}"
                        f"  ({len(prices)} dates)"
                    )
            except Exception as e:
                print(f"    Error checking {from_id}->{to_id}: {e}")
            time.sleep(BETWEEN_REQUESTS_S)

    if not active_routes:
        print("  No active routes found!")
        _save_empty()
        return

    # Step 3: Use Playwright to get SR IDs for each date
    print("\n[3/4] Loading search pages to find flight IDs (Playwright)...")
    all_flights = []
    consecutive_errors = 0

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        )
        page = context.new_page()

        for from_id, to_id, dates in active_routes:
            from_name = metros[from_id]["name"]
            to_name = metros[to_id]["name"]
            print(f"\n  Route: {from_name} -> {to_name} ({len(dates)} dates)")

            for date_entry in dates:
                date_str = date_entry["date"]
                date_compact = date_str.replace("-", "")
                print(f"    {date_str}...", end=" ", flush=True)

                try:
                    sr_ids = get_sr_ids_playwright(page, from_id, to_id, date_compact)
                except Exception as e:
                    print(f"page error: {e}")
                    consecutive_errors += 1
                    if consecutive_errors >= MAX_CONSECUTIVE_ERRORS:
                        print(f"    Skipping rest of route after {MAX_CONSECUTIVE_ERRORS} consecutive errors")
                        break
                    time.sleep(2)
                    continue

                if not sr_ids:
                    print("(no flights)")
                    continue

                consecutive_errors = 0
                print(f"({len(sr_ids)} flights)", end=" ", flush=True)

                # Step 4: Get details for each flight via API
                for sr_id in sr_ids:
                    try:
                        detail = get_flight_detail(int(sr_id))
                        if detail:
                            flights = parse_flights(detail, from_id, to_id, airports)
                            all_flights.extend(flights)
                    except Exception as e:
                        print(f"\n      Error on SR {sr_id}: {e}", end="")
                    time.sleep(BETWEEN_REQUESTS_S)

                print("done")
                time.sleep(BETWEEN_DATES_S)

        browser.close()

    _save_and_summarize(all_flights, active_routes)


def _save_empty():
    """Save an empty flights file."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "slate_flights.json")
    with open(json_path, "w") as f:
        json.dump([], f)
    print(f"Saved 0 flights to {json_path}")


def _save_and_summarize(all_flights: list[dict], active_routes: list):
    """Save flight data and print summary."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "slate_flights.json")

    with open(json_path, "w") as f:
        json.dump(all_flights, f, indent=2)
    print(f"\nSaved {len(all_flights)} flights to {json_path}")

    print("\n" + "=" * 60)
    print("SUMMARY")
    print(f"  Routes scraped: {len(active_routes)}")
    print(f"  Total flights:  {len(all_flights)}")
    if all_flights:
        prices = [fl["price"] for fl in all_flights if fl["price"]]
        if prices:
            print(f"  Price range:    ${min(prices):,} - ${max(prices):,}")
        dates = sorted(set(fl["date"] for fl in all_flights))
        print(f"  Date range:     {dates[0]} to {dates[-1]}")
        # Route breakdown
        route_counts: dict[str, int] = {}
        for fl in all_flights:
            key = f"{fl['origin_code']}-{fl['destination_code']}"
            route_counts[key] = route_counts.get(key, 0) + 1
        print("  Routes found:")
        for route, count in sorted(route_counts.items()):
            print(f"    {route}: {count} flights")
    print("=" * 60)


if __name__ == "__main__":
    scrape_all_flights()
