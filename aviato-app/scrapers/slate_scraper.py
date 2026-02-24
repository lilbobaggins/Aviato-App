#!/usr/bin/env python3
"""
Slate Aviation Flight Scraper for Aviato

Strategy:
  1. GET  /getAirportsAndMa        → metro areas + airport codes
  2. POST /getCalendarSeatsPrices   → calendar dates (to find date range)
  3. Scan sequential seat reservation IDs via POST /getPlaneBySeatInfo
     (this API requires no authentication and returns full flight details)

The search page requires auth to display flights, but the getPlaneBySeatInfo
API is public. SR IDs are roughly sequential (~3-5 per day), so we scan a
range of IDs to discover all flights.

Output: slate_flights.json (flat list of flight dicts)
"""

import requests
import json
import time
import re
import os
import sys
from datetime import datetime, timedelta
from typing import Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "https://app.flyslate.com"
API_URL = "https://api.app.flyslate.com"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Origin": BASE_URL,
    "Referer": f"{BASE_URL}/",
    "Content-Type": "application/json",
}

# Map codes to IATA — Slate uses "NYC" as a generic destination
ICAO_TO_IATA_FALLBACK = {
    "NYC": "TEB",
}

# Scan config
SCAN_START = 900000500       # Start scanning from here
SCAN_END = 900002000         # End scanning here
SCAN_THREADS = 5             # Keep low to avoid rate limiting / IP blocking
SCAN_BATCH_SIZE = 20         # IDs per batch
SCAN_BATCH_DELAY = 1.0       # Delay between batches to avoid triggering blocks


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
    """Get available dates with prices for a route (used to verify route is active)."""
    payload = {"directions": [{"from": from_metro, "to": to_metro}]}
    resp = requests.post(
        f"{API_URL}/getCalendarSeatsPrices", headers=HEADERS, json=payload, timeout=30
    )
    resp.raise_for_status()
    data = resp.json()
    if not data.get("status"):
        return []
    return data.get("seats", [])


def probe_sr_id(sr_id: int, retries: int = 3) -> Optional[dict]:
    """Check if a seat reservation ID is valid and return flight details."""
    for attempt in range(retries):
        try:
            resp = requests.post(
                f"{API_URL}/getPlaneBySeatInfo",
                headers=HEADERS,
                json={"id": sr_id},
                timeout=15,
            )
            if resp.status_code == 429:
                # Rate limited — back off and retry
                wait = 2 ** attempt
                print(f"    [RATE LIMITED] SR {sr_id}, retrying in {wait}s...")
                time.sleep(wait)
                continue
            if resp.status_code >= 400:
                if attempt == 0:  # Only log first attempt
                    print(f"    [HTTP {resp.status_code}] SR {sr_id}: {resp.text[:100]}")
                time.sleep(1)
                continue
            resp.raise_for_status()
            data = resp.json()
            if not data.get("status") or not data.get("charter"):
                return None
            return data["charter"]
        except requests.exceptions.ConnectionError:
            wait = 2 ** attempt
            if attempt == 0:
                print(f"    [CONN ERROR] SR {sr_id}, retrying in {wait}s...")
            time.sleep(wait)
            continue
        except Exception as e:
            if attempt == 0:
                print(f"    [ERROR] SR {sr_id}: {type(e).__name__}: {e}")
            time.sleep(1)
            continue
    return None


def resolve_iata(slate_code: str, airports: dict) -> str:
    """Convert Slate's internal airport code to IATA code."""
    if slate_code in ICAO_TO_IATA_FALLBACK:
        return ICAO_TO_IATA_FALLBACK[slate_code]
    ap = airports.get(slate_code, {})
    iata = ap.get("iata") or ap.get("faa")
    if iata:
        return iata
    if slate_code.startswith("K") and len(slate_code) == 4:
        return slate_code[1:]
    return slate_code


def parse_charter(charter_data: dict, sr_id: int, airports: dict) -> list[dict]:
    """Parse a charter response into Aviato-compatible flight dicts."""
    short = charter_data.get("short", {})
    itinerary = charter_data.get("itinerary", [])
    flights = []

    for leg in itinerary:
        dep_code = resolve_iata(leg["from"], airports)
        arr_code = resolve_iata(leg["to"], airports)

        dep_local = leg.get("departureLocal", "")
        if not dep_local:
            continue

        dep_dt = datetime.strptime(dep_local, "%Y-%m-%d %H:%M")
        flight_time_min = leg.get("flightTime", 0)
        arr_dt = dep_dt + timedelta(minutes=flight_time_min)

        flight_date = dep_dt.strftime("%Y-%m-%d")
        date_compact = dep_dt.strftime("%Y%m%d")

        dep_time = dep_dt.strftime("%-I:%M %p")
        arr_time = arr_dt.strftime("%-I:%M %p")

        price = leg.get("seatPrice", 0)
        seats = leg.get("maxPax", 0) - leg.get("alreadyTakenSeats", 0)
        if seats < 0:
            seats = 0

        aircraft = re.sub(r"\s+", " ", short.get("name", "CRJ-200")).strip()

        # Figure out metro IDs for deeplink (SFL=218, NY=252)
        sfl_codes = {"FLL", "PBI", "MIA", "OPF", "BCT", "FXE", "TMB"}
        ny_codes = {"TEB", "HPN", "FRG", "MMU", "JFK", "LGA", "EWR"}
        if dep_code in sfl_codes:
            from_metro, to_metro = 218, 252
        elif dep_code in ny_codes:
            from_metro, to_metro = 252, 218
        else:
            from_metro, to_metro = 218, 252  # default

        deeplink = (
            f"{BASE_URL}/search/points/{from_metro}-{to_metro}"
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



def scan_sr_ids(start: int, end: int, airports: dict) -> list[dict]:
    """Scan the full range of SR IDs in batches to avoid rate limiting.

    Uses small batches with delays between them to stay under API limits.
    IDs are sparse (gaps of 30-80 between valid ones) so we scan everything.
    """
    all_ids = list(range(start, end))
    total = len(all_ids)
    print(f"  Scanning SR IDs {start} to {end} ({total} IDs)")
    print(f"  Config: {SCAN_THREADS} threads, batch size {SCAN_BATCH_SIZE}, {SCAN_BATCH_DELAY}s delay")

    all_flights = []
    found = 0
    errors_seen = 0

    for batch_start in range(0, total, SCAN_BATCH_SIZE):
        batch_ids = all_ids[batch_start:batch_start + SCAN_BATCH_SIZE]

        with ThreadPoolExecutor(max_workers=SCAN_THREADS) as executor:
            futures = {executor.submit(probe_sr_id, sid): sid for sid in batch_ids}
            for future in as_completed(futures):
                sid = futures[future]
                charter = future.result()
                if charter:
                    flights = parse_charter(charter, sid, airports)
                    all_flights.extend(flights)
                    found += len(flights)
                    print(f"    SR {sid}: +{len(flights)} flights (total: {found})")

        checked = batch_start + len(batch_ids)
        pct = int(checked / total * 100)
        if checked % 100 == 0 or checked == total:
            print(f"    [{pct}%] {checked}/{total} IDs checked, {found} flights found")

        time.sleep(SCAN_BATCH_DELAY)

    print(f"  Scan complete — {found} flights found from {total} IDs checked")
    return all_flights


def scrape_all_flights():
    """Main scraping function — scans SR IDs to find all flights."""
    print("=" * 60)
    print("Slate Aviation Flight Scraper (ID Scan)")
    print("=" * 60)

    # Step 1: Get airport/metro data
    print("\n[1/3] Fetching airports and metropolitan areas...")
    ref_data = get_airports_and_metros()
    metros = ref_data["metros"]
    airports = ref_data["airports"]
    print(f"  Found {len(metros)} metro areas, {len(airports)} airports")
    for mid, m in metros.items():
        iata = resolve_iata(m["main_ap"], airports)
        print(f"    - {m['name']} (ID: {mid}, Main: {m['main_ap']} → {iata})")

    # Step 2: Verify active routes exist via calendar API
    print("\n[2/3] Checking active routes via calendar API...")
    metro_ids = list(metros.keys())
    active_routes = 0
    total_dates = 0

    for from_id in metro_ids:
        for to_id in metro_ids:
            if from_id == to_id:
                continue
            try:
                prices = get_calendar_prices(from_id, to_id)
                if prices:
                    active_routes += 1
                    total_dates += len(prices)
                    print(
                        f"    {metros[from_id]['name']} -> {metros[to_id]['name']}"
                        f"  ({len(prices)} dates)"
                    )
            except Exception as e:
                print(f"    Error: {e}")
            time.sleep(0.3)

    if active_routes == 0:
        print("  No active routes found!")
        _save_empty()
        return

    print(f"  Active routes: {active_routes}, Total dates: {total_dates}")

    # Step 3: Sanity check — test a single known ID to verify API access
    print("\n[3/4] Testing API access with a known SR ID...")
    test_id = 900000690
    try:
        resp = requests.post(
            f"{API_URL}/getPlaneBySeatInfo",
            headers=HEADERS,
            json={"id": test_id},
            timeout=15,
        )
        print(f"  Test ID {test_id}: HTTP {resp.status_code}")
        print(f"  Response: {resp.text[:300]}")
        data = resp.json()
        if data.get("status") and data.get("charter"):
            print(f"  ✓ API accessible — flight data returned")
        elif data.get("message") == "Flight not found":
            print(f"  ✓ API accessible — ID expired (normal)")
        else:
            print(f"  ⚠ Unexpected response — API may be blocking this IP")
    except Exception as e:
        print(f"  ✗ API test failed: {e}")
        print(f"  The API may be blocking datacenter IPs.")

    # Step 4: Scan SR IDs to find all flights
    print(f"\n[4/4] Scanning seat reservation IDs ({SCAN_START}-{SCAN_END})...")
    all_flights = scan_sr_ids(SCAN_START, SCAN_END, airports)

    # Deduplicate by SR ID (in case of overlapping scans)
    seen_sr = set()
    unique_flights = []
    for fl in all_flights:
        sr = fl.get("seat_reservation_id")
        if sr not in seen_sr:
            seen_sr.add(sr)
            unique_flights.append(fl)

    # Sort by date then departure time
    unique_flights.sort(key=lambda f: (f["date"], f["departure_time"]))

    _save_and_summarize(unique_flights)


def _save_empty():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "slate_flights.json")
    with open(json_path, "w") as f:
        json.dump([], f)
    print(f"Saved 0 flights to {json_path}")


def _save_and_summarize(all_flights: list[dict]):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "slate_flights.json")

    with open(json_path, "w") as f:
        json.dump(all_flights, f, indent=2)
    print(f"\nSaved {len(all_flights)} flights to {json_path}")

    print("\n" + "=" * 60)
    print("SUMMARY")
    print(f"  Total flights: {len(all_flights)}")
    if all_flights:
        prices = [fl["price"] for fl in all_flights if fl["price"]]
        if prices:
            print(f"  Price range:   ${min(prices):,} - ${max(prices):,}")
        dates = sorted(set(fl["date"] for fl in all_flights))
        print(f"  Date range:    {dates[0]} to {dates[-1]}")
        print(f"  Unique dates:  {len(dates)}")
        # Route breakdown
        route_counts: dict[str, int] = {}
        for fl in all_flights:
            key = f"{fl['origin_code']}-{fl['destination_code']}"
            route_counts[key] = route_counts.get(key, 0) + 1
        print("  Route breakdown:")
        for route, count in sorted(route_counts.items(), key=lambda x: -x[1]):
            print(f"    {route}: {count} flights")
    print("=" * 60)


if __name__ == "__main__":
    scrape_all_flights()
