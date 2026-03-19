"""
JSX Flight Scraper for Aviato
Uses the JSX v4 availability API (the v2 lowfare endpoint is defunct).

Includes a time budget to avoid GitHub Actions timeout.

Usage:
    pip install requests
    python jsx_scraper.py
"""

import requests
import csv
import json
import time
import os
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

# ── API config ──────────────────────────────────────────────
SEARCH_URL = "https://api.jsx.com/api/nsk/v4/availability/search/simple"

# Static public JWT for JSX Internet Booking Engine (no expiry, no user data)
V4_TOKEN = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJzdWIiOiJJQkUiLCJqdGkiOiI1MTMwMmM2Yi1lNTRlLWM1NjQtNGJjMy1iODkx"
    "N2IyYmNmOTUiLCJpc3MiOiJkb3RSRVogQVBJIn0."
    "3yif42MVO7gxHWAXnbDtowjfLk8MnM4Qa169WB3Qxf8"
)

# Time budget in seconds (default 20 min; leave room for other scrapers in CI)
TIME_BUDGET = int(os.environ.get("JSX_TIME_BUDGET", 1200))

# Dynamic date range: today + 90 days (was 150 — reduced for speed)
START_DATE = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
END_DATE = START_DATE + timedelta(days=90)

STATION_NAMES = {
    "BUR": "Burbank", "LAS": "Las Vegas", "SMO": "Santa Monica",
    "SNA": "Orange County", "SCF": "Scottsdale", "CCR": "Concord",
    "OAK": "Oakland", "HPN": "White Plains", "PBI": "West Palm Beach",
    "OPF": "Miami", "DAL": "Dallas", "DSI": "Destin",
    "HOU": "Houston", "TRM": "Coachella Valley",
    "LAX": "Los Angeles", "CSW": "Cabo San Lucas",
    "APA": "Denver", "RNO": "Reno", "SLC": "Salt Lake City",
    "CLD": "Carlsbad", "TSM": "Taos", "EDC": "Austin",
    "SAF": "Santa Fe", "HOB": "Hobbs",
    "APF": "Naples", "MMU": "Morristown", "TEB": "Teterboro",
    "BCT": "Boca Raton", "MRY": "Monterey", "APC": "Napa",
}

ROUTES = [
    # LA area to Las Vegas
    ("BUR", "LAS"), ("LAS", "BUR"),
    ("SMO", "LAS"), ("LAS", "SMO"),
    ("SNA", "LAS"), ("LAS", "SNA"),
    ("LAX", "LAS"), ("LAS", "LAX"),
    # LA area to Scottsdale
    ("SMO", "SCF"), ("SCF", "SMO"),
    ("SNA", "SCF"), ("SCF", "SNA"),
    ("BUR", "SCF"), ("SCF", "BUR"),
    # LA area to Bay Area
    ("BUR", "CCR"), ("CCR", "BUR"),
    ("BUR", "OAK"), ("OAK", "BUR"),
    ("SNA", "OAK"), ("OAK", "SNA"),
    # LA area to Reno / SLC
    ("BUR", "RNO"), ("RNO", "BUR"),
    ("SNA", "RNO"), ("RNO", "SNA"),
    ("BUR", "SLC"), ("SLC", "BUR"),
    ("SNA", "SLC"), ("SLC", "SNA"),
    # LA area to Monterey / Napa / Taos / Denver
    ("BUR", "MRY"), ("MRY", "BUR"),
    ("SNA", "MRY"), ("MRY", "SNA"),
    ("BUR", "APC"), ("APC", "BUR"),
    ("BUR", "TSM"), ("TSM", "BUR"),
    ("BUR", "APA"), ("APA", "BUR"),
    # LA area to Carlsbad
    ("BUR", "CLD"), ("CLD", "BUR"),
    # LA / Cabo
    ("LAX", "CSW"), ("CSW", "LAX"),
    ("DAL", "CSW"), ("CSW", "DAL"),
    # LA area misc
    ("SMO", "TRM"), ("TRM", "SMO"),
    # Las Vegas to other destinations
    ("LAS", "SCF"), ("SCF", "LAS"),
    ("LAS", "OAK"), ("OAK", "LAS"),
    ("LAS", "CLD"), ("CLD", "LAS"),
    ("LAS", "SLC"), ("SLC", "LAS"),
    ("LAS", "APA"), ("APA", "LAS"),
    ("LAS", "RNO"), ("RNO", "LAS"),
    # Dallas hub
    ("DAL", "LAS"), ("LAS", "DAL"),
    ("DAL", "DSI"), ("DSI", "DAL"),
    ("DAL", "HOU"), ("HOU", "DAL"),
    ("DAL", "OPF"), ("OPF", "DAL"),
    ("DAL", "APA"), ("APA", "DAL"),
    ("DAL", "TSM"), ("TSM", "DAL"),
    ("DAL", "SCF"), ("SCF", "DAL"),
    ("DAL", "BUR"), ("BUR", "DAL"),
    ("DAL", "SAF"), ("SAF", "DAL"),
    ("DAL", "HOB"), ("HOB", "DAL"),
    ("DAL", "EDC"), ("EDC", "DAL"),
    # SNA to Napa / Denver
    ("SNA", "APC"), ("APC", "SNA"),
    ("SNA", "APA"), ("APA", "SNA"),
    # East Coast — White Plains / Morristown / Teterboro to Florida
    ("HPN", "PBI"), ("PBI", "HPN"),
    ("HPN", "OPF"), ("OPF", "HPN"),
    ("HPN", "APF"), ("APF", "HPN"),
    ("MMU", "PBI"), ("PBI", "MMU"),
    ("MMU", "APF"), ("APF", "MMU"),
    ("MMU", "BCT"), ("BCT", "MMU"),
    ("TEB", "OPF"), ("OPF", "TEB"),
    ("TEB", "PBI"), ("PBI", "TEB"),
    # Scottsdale hub
    ("SCF", "APA"), ("APA", "SCF"),
    ("SCF", "SLC"), ("SLC", "SCF"),
    ("SCF", "CLD"), ("CLD", "SCF"),
]

BASE_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://www.jsx.com",
    "Referer": "https://www.jsx.com/",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
}


# ── v4 search API ──

def search_v4(session, origin, destination, date):
    """Search for flights on a single date using the v4 API."""
    payload = {
        "beginDate": date.strftime("%Y-%m-%d"),
        "destination": destination,
        "origin": origin,
        "passengers": {"types": [{"count": 1, "type": "ADT"}]},
        "taxesAndFees": 2,
        "filters": {
            "maxConnections": 4,
            "compressionType": 1,
            "sortOptions": [4],
            "fareTypes": ["R"],
            "exclusionType": 2,
        },
        "numberOfFaresPerJourney": 10,
        "codes": {"currencyCode": "USD"},
        "ssrCollectionsMode": 1,
    }
    try:
        resp = session.post(SEARCH_URL, json=payload, timeout=30)
    except requests.exceptions.Timeout:
        return None
    except requests.exceptions.ConnectionError:
        return None
    if resp.status_code in (400, 404):
        return None
    if resp.status_code == 401:
        return "AUTH_FAIL"
    try:
        resp.raise_for_status()
    except Exception:
        return None
    return resp.json()


def parse_v4(data, origin_code, dest_code):
    """Parse the v4 API response into flat flight rows."""
    rows = []
    if not data or "data" not in data:
        return rows

    results = data["data"].get("results", [])
    fares_available = data["data"].get("faresAvailable", {})

    for result in results:
        for trip in result.get("trips", []):
            markets = trip.get("journeysAvailableByMarket", {})
            market_key = f"{origin_code}|{dest_code}"
            journeys = markets.get(market_key, [])

            for journey in journeys:
                designator = journey.get("designator", {})
                dep_str = designator.get("departure", "")
                arr_str = designator.get("arrival", "")
                if not dep_str or not arr_str:
                    continue

                dep_dt = datetime.fromisoformat(dep_str)
                arr_dt = datetime.fromisoformat(arr_str)

                # Flight number and equipment from segment
                segments = journey.get("segments", [])
                flight_num = ""
                equipment = ""
                if segments:
                    seg = segments[0]
                    ident = seg.get("identifier", {})
                    flight_num = f"{ident.get('carrierCode', 'XE')}{ident.get('identifier', '')}"
                    legs = seg.get("legs", [])
                    if legs:
                        equipment = legs[0].get("legInfo", {}).get("equipmentType", "")

                # Fares
                for jfare in journey.get("fares", []):
                    fare_key = jfare.get("fareAvailabilityKey", "")
                    fare_details = jfare.get("details", [])
                    seats = fare_details[0].get("availableCount", 0) if fare_details else 0

                    fare_info = fares_available.get(fare_key, {})
                    fare_total = fare_info.get("totals", {}).get("fareTotal", 0)
                    if fare_total <= 0:
                        continue

                    product_class = ""
                    fare_entries = fare_info.get("fares", [])
                    if fare_entries:
                        product_class = fare_entries[0].get("productClass", "")

                    fare_label = (
                        "Hop On" if product_class == "HO"
                        else "All In" if product_class == "AI"
                        else product_class
                    )

                    rows.append({
                        "airline": "JSX",
                        "origin_code": origin_code,
                        "destination_code": dest_code,
                        "origin_city": STATION_NAMES.get(origin_code, origin_code),
                        "destination_city": STATION_NAMES.get(dest_code, dest_code),
                        "date": dep_dt.strftime("%Y-%m-%d"),
                        "price": round(fare_total, 2),
                        "fare_class": fare_label,
                        "flight_number": flight_num,
                        "departure_time": dep_dt.strftime("%I:%M %p").lstrip("0"),
                        "arrival_time": arr_dt.strftime("%I:%M %p").lstrip("0"),
                        "seats_available": seats,
                        "departure_iso": dep_str,
                        "arrival_iso": arr_str,
                        "equipment": equipment,
                    })
    return rows


# ── v4 concurrent helper ──

def _v4_fetch_one(origin, dest, date_str):
    """Fetch a single date for a route via v4 (for use with ThreadPoolExecutor)."""
    session = requests.Session()
    session.headers.update(BASE_HEADERS)
    session.headers["Authorization"] = V4_TOKEN
    date = datetime.strptime(date_str, "%Y-%m-%d")
    data = search_v4(session, origin, dest, date)
    if data is None or data == "AUTH_FAIL":
        return []
    return parse_v4(data, origin, dest)


def v4_scrape_route(origin, dest, start, end, max_workers=10):
    """Scrape an entire route via v4 using parallel requests."""
    days = []
    day = start
    while day <= end:
        days.append(day.strftime("%Y-%m-%d"))
        day += timedelta(days=1)

    all_flights = []

    # First, probe day 0 and day 7 to see if this route even exists
    probe_days = [days[0], days[min(7, len(days) - 1)]]
    found_any = False
    for pd in probe_days:
        result = _v4_fetch_one(origin, dest, pd)
        if result:
            all_flights.extend(result)
            found_any = True

    if not found_any:
        return []

    # Route exists — scrape remaining days in parallel
    remaining = [d for d in days if d not in probe_days]
    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {pool.submit(_v4_fetch_one, origin, dest, d): d for d in remaining}
        for future in as_completed(futures):
            try:
                flights = future.result()
                all_flights.extend(flights)
            except Exception:
                pass

    return all_flights


# ── Main ──

def main():
    script_start = time.time()

    print("=" * 60)
    print("JSX Flight Scraper (v4 API)")
    print(f"Date range: {START_DATE.strftime('%Y-%m-%d')} to {END_DATE.strftime('%Y-%m-%d')}")
    print(f"Routes: {len(ROUTES)}")
    print(f"Time budget: {TIME_BUDGET}s")
    print("=" * 60)

    all_flights = []
    routes_scraped = 0
    routes_skipped = 0

    for route_idx, (origin, dest) in enumerate(ROUTES, 1):
        # Check time budget before starting a new route
        elapsed = time.time() - script_start
        if elapsed > TIME_BUDGET:
            routes_skipped = len(ROUTES) - route_idx + 1
            print(f"\n⏰ Time budget reached ({int(elapsed)}s). Skipping remaining {routes_skipped} routes.")
            break

        label = f"{STATION_NAMES.get(origin, origin)} ({origin}) -> {STATION_NAMES.get(dest, dest)} ({dest})"
        print(f"[{route_idx}/{len(ROUTES)}] {label}", end=" ", flush=True)

        try:
            flights = v4_scrape_route(origin, dest, START_DATE, END_DATE, max_workers=10)
            all_flights.extend(flights)
            routes_scraped += 1
            print(f"-> {len(flights)}")
        except Exception as e:
            print(f"-> ERROR: {e}")

    # ── Deduplicate ──
    seen = set()
    deduped = []
    for f in all_flights:
        key = (f["origin_code"], f["destination_code"], f["date"],
               f["departure_time"], f["fare_class"])
        if key not in seen:
            seen.add(key)
            deduped.append(f)
    all_flights = deduped

    # Save JSON
    with open("jsx_flights.json", "w") as f:
        json.dump(all_flights, f, indent=2)
    print(f"\nSaved JSON -> jsx_flights.json")

    # Save CSV
    csv_file = "jsx_flights.csv"
    fieldnames = [
        "airline", "origin_code", "destination_code", "origin_city",
        "destination_city", "date", "price", "fare_class", "flight_number",
        "departure_time", "arrival_time", "seats_available",
        "departure_iso", "arrival_iso", "equipment",
    ]
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_flights)

    elapsed = time.time() - script_start
    print(f"Saved CSV  -> {csv_file}")
    print("=" * 60)
    print(f"DONE in {int(elapsed)}s! {len(all_flights)} flights from {routes_scraped} routes")
    if routes_skipped:
        print(f"  ({routes_skipped} routes skipped due to time budget)")
    print("=" * 60)


if __name__ == "__main__":
    main()
