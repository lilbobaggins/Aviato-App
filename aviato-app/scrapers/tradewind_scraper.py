#!/usr/bin/env python3
"""
Tradewind Aviation Flight Scraper for Aviato
Scrapes the PUBLIC flight calendar at booking.flytradewind.com/VARS
using the deeplink.aspx endpoint — no browser needed.

Each date+route gets its own deeplink request, which creates a fresh
VARS session and returns the flight calendar HTML directly.

Routes:
  - ACK (Nantucket) <-> HPN (Westchester County)
  - MVY (Martha's Vineyard) <-> HPN (Westchester County)

Period: today through ~4 months out

Requirements:
    pip install requests beautifulsoup4

Usage:
    python3 tradewind_scraper.py

Outputs:
  - tradewind_flights.json  (consumed by update_flights.py)
"""

import json
import re
import time
from datetime import datetime, timedelta

import requests
from bs4 import BeautifulSoup


# ── Configuration ──────────────────────────────────────────────────────────

DEEPLINK_URL = "https://booking.flytradewind.com/VARS/Public/deeplink.aspx"

ROUTES = [
    {"from_code": "HPN", "from_city": "Westchester County",
     "to_code":   "ACK", "to_city":   "Nantucket"},
    {"from_code": "ACK", "from_city": "Nantucket",
     "to_code":   "HPN", "to_city":   "Westchester County"},
    {"from_code": "HPN", "from_city": "Westchester County",
     "to_code":   "MVY", "to_city":   "Martha's Vineyard"},
    {"from_code": "MVY", "from_city": "Martha's Vineyard",
     "to_code":   "HPN", "to_city":   "Westchester County"},
]

# Real durations from flytradewind.com destination pages
ROUTE_DURATIONS = {
    ("ACK", "HPN"): "0h 45m",
    ("HPN", "ACK"): "0h 45m",
    ("MVY", "HPN"): "0h 40m",
    ("HPN", "MVY"): "0h 40m",
}

DAYS_TO_SCRAPE = 120
BETWEEN_REQUESTS_S = 0.8   # polite delay between requests
OUTPUT_JSON = "tradewind_flights.json"


# ── Fetch one day via deeplink.aspx ──────────────────────────────────────

def fetch_day(origin, destination, date):
    """
    Hit deeplink.aspx for a specific date+route.
    Returns the HTML of the VARS flight calendar page, or None on failure.
    """
    params = {
        "way": "oneway",
        "TripType": "OneWay",
        "type": "scheduled",
        "Slice1": "1",
        "Cabin1": "Economy",
        "Carrier1": "TJ",
        "BookingCode1": "E",
        "Adult": "1",
        "InfantLap": "0",
        "DepartureDate1": date.strftime("%Y-%m-%d"),
        "Origin1": origin,
        "Destination1": destination,
    }

    try:
        resp = requests.get(
            DEEPLINK_URL,
            params=params,
            headers={
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                              "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
            allow_redirects=True,
            timeout=30,
        )
        resp.raise_for_status()

        # Verify we landed on the VARS page (not the homepage)
        if "VARS" not in resp.url and "FlightCal" not in resp.url:
            return None

        return resp.text

    except Exception as e:
        print(f"    [ERROR] {date.strftime('%Y-%m-%d')}: {e}")
        return None


# ── Parse Flights from HTML ──────────────────────────────────────────────

def clean_time(t):
    """Normalize time string to '7:30 AM' format."""
    m = re.match(r"(\d{1,2}:\d{2})\s*(AM|PM|am|pm)", t.replace(" ", ""), re.I)
    return f"{m.group(1)} {m.group(2).upper()}" if m else t


def parse_price(text):
    """Extract numeric price from text like '$1,120' or 'from $795'."""
    if not text or "sold" in text.lower():
        return 0
    m = re.search(r"\$?([\d,]+)", text.replace(",", ""))
    return int(m.group(1)) if m else 0


def parse_flights_from_html(html, route, date):
    """Parse flight panels from the VARS calendar page."""
    soup = BeautifulSoup(html, "html.parser")
    flights = []
    duration = ROUTE_DURATIONS.get(
        (route["from_code"], route["to_code"]), "0h 45m"
    )

    for panel in soup.select(".flt-panel"):
        # Departure time
        depart_el = panel.select_one(".cal-Depart-time")
        if not depart_el:
            continue

        time_spans = depart_el.select(".time span")
        if len(time_spans) >= 2:
            dep_time = time_spans[0].get_text(strip=True) + time_spans[1].get_text(strip=True)
        else:
            time_el = depart_el.select_one(".time") or depart_el
            dep_time = time_el.get_text(strip=True)

        # Arrival time
        arrive_el = panel.select_one(".cal-Arrive-time")
        if arrive_el:
            arr_spans = arrive_el.select(".time span")
            if len(arr_spans) >= 2:
                arr_time = arr_spans[0].get_text(strip=True) + arr_spans[1].get_text(strip=True)
            else:
                arr_el = arrive_el.select_one(".time") or arrive_el
                arr_time = arr_el.get_text(strip=True)
        else:
            arr_time = ""

        # Price
        price_el = panel.select_one(".fare-price-small")
        fare_el = panel.select_one(".cal-fare")
        if price_el:
            price_text = price_el.get_text(strip=True)
        elif fare_el:
            price_text = fare_el.get_text(strip=True)
        else:
            price_text = ""

        price = parse_price(price_text)
        if price == 0:
            continue  # Skip sold-out flights

        # Flight number
        flt_el = panel.select_one(".flightnumber")
        flt_num = flt_el.get_text(strip=True) if flt_el else ""

        # Build flight dict in the format update_flights.py expects
        flights.append({
            "origin_code": route["from_code"],
            "destination_code": route["to_code"],
            "departure_time": clean_time(dep_time),
            "arrival_time": clean_time(arr_time),
            "date_iso": date.strftime("%Y-%m-%d"),
            "price_numeric": price,
            "duration": duration,
            "flight_number": flt_num,
            "source": "live",
        })

    return flights


# ── Date Helpers ─────────────────────────────────────────────────────────

def date_range(start, end):
    cur = start
    while cur <= end:
        yield cur
        cur += timedelta(days=1)


# ── Scrape One Route ─────────────────────────────────────────────────────

def scrape_route(route, start, end):
    """Scrape flights for a single route, one deeplink request per day."""
    all_flights = []
    errors = 0

    print(f"\n{'=' * 60}")
    print(f"  {route['from_code']} -> {route['to_code']}  "
          f"({route['from_city']} -> {route['to_city']})")
    print(f"{'=' * 60}")

    for day in date_range(start, end):
        day_label = day.strftime("%Y-%m-%d")

        html = fetch_day(route["from_code"], route["to_code"], day)
        if html is None:
            errors += 1
            # If we get too many consecutive errors, the endpoint may be down
            if errors >= 5:
                print(f"  [WARN] 5 consecutive errors — skipping rest of route")
                break
            time.sleep(BETWEEN_REQUESTS_S)
            continue

        errors = 0  # reset consecutive error count on success

        flights = parse_flights_from_html(html, route, day)
        if flights:
            print(f"  {day_label}: {len(flights)} flight(s)")
            for f in flights:
                print(f"    {f['departure_time']} -> {f['arrival_time']}"
                      f"  ${f['price_numeric']}  {f['flight_number']}")
            all_flights.extend(flights)

        time.sleep(BETWEEN_REQUESTS_S)

    return all_flights


# ── Main ─────────────────────────────────────────────────────────────────

def main():
    start_date = datetime.today().replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = start_date + timedelta(days=DAYS_TO_SCRAPE)

    print("=" * 60)
    print("  Tradewind Aviation Flight Scraper (HTTP)")
    print(f"  Period : {start_date.date()} -> {end_date.date()}")
    print(f"  Routes : {len(ROUTES)}")
    print(f"  Requests: ~{DAYS_TO_SCRAPE * len(ROUTES)} "
          f"(~{DAYS_TO_SCRAPE * len(ROUTES) * BETWEEN_REQUESTS_S / 60:.0f} min)")
    print("=" * 60)

    all_flights = []
    for route in ROUTES:
        try:
            flights = scrape_route(route, start_date, end_date)
            all_flights.extend(flights)
        except Exception as e:
            print(f"  [ERROR] {route['from_code']}->{route['to_code']}: {e}")
            import traceback
            traceback.print_exc()

    print(f"\n{'=' * 60}")
    print(f"  Total flights collected: {len(all_flights)}")

    # Save JSON for update_flights.py
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(all_flights, f, indent=2, ensure_ascii=False)
    print(f"  Saved -> {OUTPUT_JSON}")

    # Summary
    print("\n  Summary by route:")
    for route in ROUTES:
        key = f"{route['from_code']}-{route['to_code']}"
        count = sum(
            1 for fl in all_flights
            if fl["origin_code"] == route["from_code"]
            and fl["destination_code"] == route["to_code"]
        )
        print(f"    {key}: {count} flights")

    print(f"\n  Scraped at: {datetime.utcnow().isoformat()}Z")
    print("=" * 60)


if __name__ == "__main__":
    main()
