"""
JSX Flight Scraper for Aviato
Scrapes the JSX lowfare API for all routes and outputs JSON + CSV.

Usage:
    pip install requests
    python jsx_scraper.py
"""

import requests
import csv
import json
import time
from datetime import datetime, timedelta

BASE_URL = "https://api.jsx.com/api"
TOKEN_URL = f"{BASE_URL}/nsk/v2/token"
LOWFARE_URL = f"{BASE_URL}/nsk/v2/availability/lowfare"
CULTURE_URL = f"{BASE_URL}/v2/graph/setCulture"

# Dynamic date range: today + 120 days
START_DATE = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
END_DATE = START_DATE + timedelta(days=120)

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
    ("DAL", "CSW"), ("CSW", "DAL"),
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
    "Accept": "application/json",
    "Origin": "https://www.jsx.com",
    "Referer": "https://www.jsx.com/",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
}


def get_session():
    session = requests.Session()
    session.headers.update(BASE_HEADERS)

    # Step 1: Get token
    resp = session.post(TOKEN_URL, json={}, timeout=15)
    resp.raise_for_status()
    token = resp.json()["data"]["token"]
    session.headers["Authorization"] = token

    # Step 2: Set culture (initializes the session)
    session.post(CULTURE_URL, json={
        "query": "mutation setCulture($cultureCode: String, $currencyCode: String) { setCulture(cultureCode: $cultureCode, currencyCode: $currencyCode) { cultureCode currencyCode } }",
        "variables": {"cultureCode": "en-US", "currencyCode": "USD"}
    }, timeout=15)

    return session


def get_date_ranges(start, end, max_days=31):
    ranges = []
    current = start
    while current < end:
        chunk_end = min(current + timedelta(days=max_days - 1), end)
        ranges.append((current, chunk_end))
        current = chunk_end + timedelta(days=1)
    return ranges


def search_lowfare(session, origin, destination, begin_date, end_date):
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
        print("TIMEOUT", end=" ")
        return []

    if resp.status_code == 401:
        return None
    if resp.status_code == 400:
        return []

    resp.raise_for_status()
    data = resp.json()
    return data.get("data", {}).get("lowFareDateMarkets", [])


def parse_flights(markets, origin_code, dest_code):
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
            dep_time = datetime.fromisoformat(fare["departureTime"]).strftime("%I:%M %p")
            arr_time = datetime.fromisoformat(fare["arrivalTime"]).strftime("%I:%M %p")
            product_class = fare.get("productClass", "")
            fare_label = "Hop On" if product_class == "HO" else "All In" if product_class == "AI" else product_class

            # Strip leading zeros from times (e.g., "09:00 AM" -> "9:00 AM")
            dep_time = dep_time.lstrip("0") if dep_time.startswith("0") else dep_time
            arr_time = arr_time.lstrip("0") if arr_time.startswith("0") else arr_time

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
            })
    return rows


def main():
    print("=" * 60)
    print("JSX Flight Scraper")
    print(f"Date range: {START_DATE.strftime('%Y-%m-%d')} to {END_DATE.strftime('%Y-%m-%d')}")
    print(f"Routes: {len(ROUTES)}")
    print("=" * 60)

    print("\nConnecting to JSX API...")
    session = get_session()
    session_time = time.time()
    print("Connected!\n")

    all_flights = []
    date_ranges = get_date_ranges(START_DATE, END_DATE)

    for route_idx, (origin, dest) in enumerate(ROUTES, 1):
        route_label = f"{STATION_NAMES.get(origin, origin)} ({origin}) -> {STATION_NAMES.get(dest, dest)} ({dest})"
        print(f"[{route_idx}/{len(ROUTES)}] {route_label}")

        route_flights = 0
        for begin, end in date_ranges:
            if time.time() - session_time > 600:
                print("  Refreshing session...")
                session = get_session()
                session_time = time.time()

            print(f"  {begin.strftime('%b %d')} - {end.strftime('%b %d')}...", end=" ", flush=True)

            markets = search_lowfare(session, origin, dest, begin, end)
            if markets is None:
                session = get_session()
                session_time = time.time()
                markets = search_lowfare(session, origin, dest, begin, end)
            if markets is None:
                print("FAILED")
                continue

            flights = parse_flights(markets, origin, dest)
            all_flights.extend(flights)
            route_flights += len(flights)
            print(f"{len(flights)} flights")
            time.sleep(0.3)

        print(f"  -> {route_flights} total\n")

    # Save JSON
    with open("jsx_flights.json", "w") as f:
        json.dump(all_flights, f, indent=2)
    print(f"Saved JSON -> jsx_flights.json")

    # Save CSV
    csv_file = "jsx_flights.csv"
    fieldnames = [
        "airline", "origin_code", "destination_code", "origin_city",
        "destination_city", "date", "price", "fare_class", "flight_number",
        "departure_time", "arrival_time", "seats_available",
        "departure_iso", "arrival_iso",
    ]
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_flights)

    print(f"Saved CSV  -> {csv_file}")
    print("=" * 60)
    print(f"DONE! {len(all_flights)} flights across {len(ROUTES)} routes")
    print("=" * 60)


if __name__ == "__main__":
    main()
