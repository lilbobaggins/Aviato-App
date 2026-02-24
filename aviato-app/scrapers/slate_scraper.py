#!/usr/bin/env python3
"""
Slate Aviation Flight Scraper for Aviato
Scrapes flight data from app.flyslate.com using their public APIs.

APIs used:
  - GET  /getAirportsAndMa       → metro areas + airport codes
  - POST /getCalendarSeatsPrices  → calendar of dates with prices per route

The search results page is a Next.js SPA that loads flight cards via client-side
JavaScript, so we cannot scrape seat reservation IDs from the raw HTML.
Instead, we build flight entries directly from the calendar API data which gives
us dates + starting prices for each route.

Output: slate_flights.json (flat list of flight dicts)
"""

import requests
import json
import time
import os
from datetime import datetime

BASE_URL = "https://app.flyslate.com"
API_URL = "https://api.app.flyslate.com"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Origin": BASE_URL,
    "Referer": f"{BASE_URL}/",
    "Content-Type": "application/json",
}

# Map Slate metro IDs to their primary IATA airport codes for Aviato
# These are the main departure/arrival airports Slate actually uses
METRO_PRIMARY_AIRPORTS = {
    218: "FLL",   # South Florida → Fort Lauderdale-Hollywood
    252: "TEB",   # New York → Teterboro
    255: "ACK",   # Nantucket → Nantucket Memorial
    384: "AGS",   # Augusta, GA → Augusta Regional
}

# Estimated flight duration in minutes for known routes
ROUTE_DURATIONS = {
    "FLL-TEB": 170,  # ~2h 50m
    "TEB-FLL": 180,  # ~3h 00m
    "FLL-ACK": 195,  # ~3h 15m
    "ACK-FLL": 200,  # ~3h 20m
    "TEB-ACK": 50,   # ~50m
    "ACK-TEB": 50,   # ~50m
}
DEFAULT_DURATION = 180  # 3 hours for unknown routes

# Rate limiting
BETWEEN_REQUESTS_S = 0.5


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


def resolve_iata(icao_code: str, airports: dict) -> str:
    """Convert ICAO airport code to IATA code."""
    ap = airports.get(icao_code, {})
    iata = ap.get("iata") or ap.get("faa")
    if iata:
        return iata
    # Strip leading K from US ICAO codes
    if icao_code.startswith("K") and len(icao_code) == 4:
        return icao_code[1:]
    return icao_code


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


def build_flights_from_calendar(
    from_metro_id: int,
    to_metro_id: int,
    calendar_entries: list[dict],
    metros: dict,
    airports: dict,
) -> list[dict]:
    """Build Aviato-compatible flight entries from calendar date+price data.

    Since we can't get individual flight details from the SPA, we create
    one flight entry per date using the calendar's starting price.
    """
    # Resolve origin/destination airports
    from_main = metros[from_metro_id]["main_ap"]
    to_main = metros[to_metro_id]["main_ap"]
    dep_code = resolve_iata(from_main, airports)
    arr_code = resolve_iata(to_main, airports)

    # Override with our known primary airports if available
    dep_code = METRO_PRIMARY_AIRPORTS.get(from_metro_id, dep_code)
    arr_code = METRO_PRIMARY_AIRPORTS.get(to_metro_id, arr_code)

    route_key = f"{dep_code}-{arr_code}"
    duration_min = ROUTE_DURATIONS.get(route_key, DEFAULT_DURATION)

    flights = []
    for entry in calendar_entries:
        date_str = entry["date"]  # "2026-02-25"
        price = entry.get("price", 0)

        if not price or price <= 0:
            continue

        date_compact = date_str.replace("-", "")

        # Build booking deeplink to Slate search page
        deeplink = (
            f"{BASE_URL}/search/points/{from_metro_id}-{to_metro_id}"
            f"/dates/{date_compact}/ft/1/c/USD/"
        )

        flights.append({
            "airline": "Slate",
            "origin_code": dep_code,
            "destination_code": arr_code,
            "date": date_str,
            "departure_time": "",      # Not available from calendar API
            "arrival_time": "",        # Not available from calendar API
            "duration_minutes": duration_min,
            "price": price,
            "available_seats": 5,      # Slate CRJ-200 typically has ~10 seats
            "aircraft": "CRJ-200",
            "deeplink": deeplink,
        })

    return flights


def scrape_all_flights():
    """Main scraping function — collects all flights across all routes."""
    print("=" * 60)
    print("Slate Aviation Flight Scraper")
    print("=" * 60)

    # Step 1: Get airport/metro data
    print("\n[1/2] Fetching airports and metropolitan areas...")
    ref_data = get_airports_and_metros()
    metros = ref_data["metros"]
    airports = ref_data["airports"]
    print(f"  Found {len(metros)} metro areas, {len(airports)} airports")
    for mid, m in metros.items():
        iata = resolve_iata(m["main_ap"], airports)
        override = METRO_PRIMARY_AIRPORTS.get(mid, iata)
        print(f"    - {m['name']} (ID: {mid}, Main: {m['main_ap']} → {override})")

    # Step 2: Discover active routes and build flights from calendar data
    print("\n[2/2] Discovering routes and building flight entries...")
    metro_ids = list(metros.keys())
    all_flights = []
    routes_found = 0

    for from_id in metro_ids:
        for to_id in metro_ids:
            if from_id == to_id:
                continue
            try:
                prices = get_calendar_prices(from_id, to_id)
                if prices:
                    routes_found += 1
                    from_name = metros[from_id]["name"]
                    to_name = metros[to_id]["name"]
                    print(
                        f"    {from_name} -> {to_name}"
                        f"  ({len(prices)} dates)"
                    )

                    flights = build_flights_from_calendar(
                        from_id, to_id, prices, metros, airports
                    )
                    all_flights.extend(flights)
                    print(f"      → {len(flights)} flight entries created")

            except Exception as e:
                print(f"    Error checking {from_id}->{to_id}: {e}")
            time.sleep(BETWEEN_REQUESTS_S)

    if not all_flights:
        print("  No flights found!")

    # Save output
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "slate_flights.json")

    with open(json_path, "w") as f:
        json.dump(all_flights, f, indent=2)
    print(f"\nSaved {len(all_flights)} flights to {json_path}")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print(f"  Routes found: {routes_found}")
    print(f"  Total flights: {len(all_flights)}")
    if all_flights:
        prices = [fl["price"] for fl in all_flights if fl["price"]]
        if prices:
            print(f"  Price range:   ${min(prices):,} - ${max(prices):,}")
        dates = sorted(set(fl["date"] for fl in all_flights))
        print(f"  Date range:    {dates[0]} to {dates[-1]}")
    print("=" * 60)


if __name__ == "__main__":
    scrape_all_flights()
