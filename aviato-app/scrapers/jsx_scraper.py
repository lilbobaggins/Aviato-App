"""
JSX Flight Scraper for Aviato
Uses the JSX v2 lowfare (batch) + v4 availability (per-day) APIs.

Usage:
    pip install requests
    python jsx_scraper.py
"""

import requests
import csv
import json
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

# ── API config ──────────────────────────────────────────────
SEARCH_URL = "https://api.jsx.com/api/nsk/v4/availability/search/simple"

# Also keep the old v2 lowfare endpoint as a fallback/batch option
LOWFARE_URL = "https://api.jsx.com/api/nsk/v2/availability/lowfare"
TOKEN_URL = "https://api.jsx.com/api/nsk/v2/token"

# Static public JWT for JSX Internet Booking Engine (no expiry, no user data)
V4_TOKEN = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJzdWIiOiJJQkUiLCJqdGkiOiI1MTMwMmM2Yi1lNTRlLWM1NjQtNGJjMy1iODkx"
    "N2IyYmNmOTUiLCJpc3MiOiJkb3RSRVogQVBJIn0."
    "3yif42MVO7gxHWAXnbDtowjfLk8MnM4Qa169WB3Qxf8"
)

# Dynamic date range: today + 90 days
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
    # East Coast
    ("HPN", "PBI"), ("PBI", "HPN"),
    ("HPN", "OPF"), ("OPF", "HPN"),
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
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
}


# ── v2 lowfare API (batch dates, works for original routes) ──

def get_v2_session():
    """Get a v2 session with dynamic token."""
    session = requests.Session()
    session.headers.update(BASE_HEADERS)
    try:
        resp = session.post(TOKEN_URL, json={}, timeout=15)
        resp.raise_for_status()
        token = resp.json()["data"]["token"]
        session.headers["Authorization"] = token
        return session
    except Exception as e:
        print(f"  v2 token failed: {e}")
        return None


def search_lowfare(session, origin, destination, begin_date, end_date):
    """Batch search using the v2 lowfare API (up to 31 days at once)."""
    payload = {
        "criteria": [{
            "originStationCodes": [origin],
            "destinationStationCodes": [destination],
            "beginDate": begin_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
        }],
        "passengers": {"types": [{"count": 1, "type": "ADT"}]},
        "codes": {"currencyCode": "USD"},
        "taxesAndFees": 2,
    }
    try:
        resp = session.post(LOWFARE_URL, json=payload, timeout=30)
    except requests.exceptions.Timeout:
        return []
    if resp.status_code in (400, 401, 404):
        return []
    resp.raise_for_status()
    return resp.json().get("data", {}).get("lowFareDateMarkets", [])


def parse_lowfare(markets, origin_code, dest_code):
    """Parse the v2 lowfare response."""
    rows = []
    if not markets:
        return rows
    for market in markets:
        if market.get("noFlights"):
            continue
        dep_date = market["departureDate"][:10]
        for fare in market.get("lowFares", []):
            if fare.get("soldOut"):
                continue
            leg = fare["legs"][0]
            fare_amount = fare["passengers"]["ADT"]["fareAmount"]
            taxes = fare["passengers"]["ADT"].get("taxesAndFeesAmount", 0)
            total_price = fare_amount + taxes
            dep_time = datetime.fromisoformat(fare["departureTime"]).strftime("%I:%M %p").lstrip("0")
            arr_time = datetime.fromisoformat(fare["arrivalTime"]).strftime("%I:%M %p").lstrip("0")
            product_class = fare.get("productClass", "")
            fare_label = "Hop On" if product_class == "HO" else "All In" if product_class == "AI" else product_class

            rows.append({
                "airline": "JSX",
                "origin_code": origin_code,
                "destination_code": dest_code,
                "origin_city": STATION_NAMES.get(origin_code, origin_code),
                "destination_city": STATION_NAMES.get(dest_code, dest_code),
                "date": dep_date,
                "price": round(total_price, 2),
                "fare_class": fare_label,
                "flight_number": f"XE{leg['flightNumber']}",
                "departure_time": dep_time,
                "arrival_time": arr_time,
                "seats_available": fare.get("availableCount", 0),
                "departure_iso": fare["departureTime"],
                "arrival_iso": fare["arrivalTime"],
                "equipment": "",
            })
    return rows


# ── v4 search API (single date, works for ALL routes) ──

def get_v4_session():
    """Get a v4 session with the static public token."""
    session = requests.Session()
    session.headers.update(BASE_HEADERS)
    session.headers["Authorization"] = V4_TOKEN
    return session


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
    if resp.status_code in (400, 404):
        return None
    if resp.status_code == 401:
        return "AUTH_FAIL"
    resp.raise_for_status()
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


# ── Date range helpers ──

def get_date_ranges(start, end, max_days=31):
    """Split a date range into chunks of max_days."""
    ranges = []
    current = start
    while current < end:
        chunk_end = min(current + timedelta(days=max_days - 1), end)
        ranges.append((current, chunk_end))
        current = chunk_end + timedelta(days=1)
    return ranges


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
    print("=" * 60)
    print("JSX Flight Scraper (dual API: v2 lowfare + v4 search)")
    print(f"Date range: {START_DATE.strftime('%Y-%m-%d')} to {END_DATE.strftime('%Y-%m-%d')}")
    print(f"Routes: {len(ROUTES)}")
    print("=" * 60)

    # ── Phase 1: Try v2 lowfare for all routes (batch, fast) ──
    print("\n--- Phase 1: v2 lowfare API (batch queries) ---")
    v2_session = get_v2_session()
    v2_flights = []
    v2_failed_routes = []
    date_ranges = get_date_ranges(START_DATE, END_DATE)

    if v2_session:
        v2_session_time = time.time()
        for route_idx, (origin, dest) in enumerate(ROUTES, 1):
            label = f"{STATION_NAMES.get(origin, origin)} ({origin}) -> {STATION_NAMES.get(dest, dest)} ({dest})"
            print(f"[{route_idx}/{len(ROUTES)}] {label}", end=" ", flush=True)

            route_flights = 0
            route_empty = True

            for begin, end in date_ranges:
                if time.time() - v2_session_time > 600:
                    v2_session = get_v2_session()
                    if not v2_session:
                        break
                    v2_session_time = time.time()

                markets = search_lowfare(v2_session, origin, dest, begin, end)
                flights = parse_lowfare(markets, origin, dest)
                if flights:
                    route_empty = False
                v2_flights.extend(flights)
                route_flights += len(flights)
                time.sleep(0.15)

            if route_empty:
                v2_failed_routes.append((origin, dest))
                print(f"-> 0 (will try v4)")
            else:
                print(f"-> {route_flights}")
    else:
        print("v2 token failed, all routes go to v4")
        v2_failed_routes = list(ROUTES)

    print(f"\nPhase 1 done: {len(v2_flights)} flights, {len(v2_failed_routes)} routes need v4")

    # ── Phase 2: v4 search for routes that v2 missed (parallel) ──
    v4_flights = []
    if v2_failed_routes:
        print(f"\n--- Phase 2: v4 search API ({len(v2_failed_routes)} routes, parallel) ---")

        for route_idx, (origin, dest) in enumerate(v2_failed_routes, 1):
            label = f"{STATION_NAMES.get(origin, origin)} ({origin}) -> {STATION_NAMES.get(dest, dest)} ({dest})"
            print(f"[{route_idx}/{len(v2_failed_routes)}] {label}", end=" ", flush=True)

            flights = v4_scrape_route(origin, dest, START_DATE, END_DATE, max_workers=10)
            v4_flights.extend(flights)
            print(f"-> {len(flights)}")

    # ── Combine and deduplicate ──
    all_flights = v2_flights + v4_flights

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

    print(f"Saved CSV  -> {csv_file}")
    print("=" * 60)
    print(f"DONE! {len(all_flights)} flights ({len(v2_flights)} from v2 + {len(v4_flights)} from v4)")
    print(f"Routes: {len(ROUTES)} total, {len(v2_failed_routes)} used v4 fallback")
    print("=" * 60)


if __name__ == "__main__":
    main()
