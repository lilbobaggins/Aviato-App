#!/usr/bin/env python3
"""
Tradewind Aviation Flight Scraper for Aviato
Scrapes the PUBLIC flight calendar at booking.flytradewind.com/VARS
using the deeplink.aspx endpoint to bootstrap sessions — no browser needed.

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
CHANGEDAY_URL = "https://booking.flytradewind.com/VARS/WebServices/AvailabilityWS.asmx/ChangeDay"

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
BETWEEN_DAYS_S = 1.0
OUTPUT_JSON = "tradewind_flights.json"


# ── Session Bootstrap via deeplink.aspx ───────────────────────────────────

def create_vars_session(origin, destination, departure_date):
    """
    Hit deeplink.aspx with route params to create a VARS session.
    Returns (session_id, initial_html) or (None, None) on failure.
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
        "DepartureDate1": departure_date.strftime("%Y-%m-%d"),
        "Origin1": origin,
        "Destination1": destination,
    }

    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    })

    try:
        resp = session.get(DEEPLINK_URL, params=params, allow_redirects=True, timeout=30)
        resp.raise_for_status()

        # Extract VarsSessionID from the final URL after redirect
        m = re.search(r"VarsSessionID=([a-f0-9\-]+)", resp.url, re.I)
        if not m:
            # Also try extracting from a hidden input in the HTML
            soup = BeautifulSoup(resp.text, "html.parser")
            sid_el = soup.find("input", {"id": "VarsSessionID"})
            if sid_el and sid_el.get("value"):
                return sid_el["value"], resp.text, session
            print(f"    [WARN] No VarsSessionID in redirect URL: {resp.url[:100]}")
            return None, None, None

        session_id = m.group(1)
        return session_id, resp.text, session

    except Exception as e:
        print(f"    [ERROR] deeplink.aspx failed: {e}")
        return None, None, None


# ── AJAX Day Navigation ──────────────────────────────────────────────────

def change_day(http_session, session_id, day):
    """Call the ChangeDay AJAX endpoint to get flights for a new date."""
    try:
        day_str = day.strftime("%-d %b %Y")
    except ValueError:
        day_str = day.strftime("%#d %b %Y")  # Windows

    url = f"{CHANGEDAY_URL}?VarsSessionID={session_id}"
    payload = {
        "ChangeDayRequest": {
            "VarsSessionID": session_id,
            "Zone": "PUBLIC",
            "NewDay": day_str,
            "PanelIndex": 0,
            "JustDayBar": False,
        }
    }

    try:
        resp = http_session.post(
            url,
            json=payload,
            headers={
                "Content-Type": "application/json; charset=utf-8",
                "X-Requested-With": "XMLHttpRequest",
            },
            timeout=20,
        )
        resp.raise_for_status()

        # The response is JSON with a "d" key containing the HTML
        data = resp.json()
        html = data.get("d", "")
        if not html:
            # Sometimes the response is just the HTML directly
            html = resp.text
        return html

    except Exception as e:
        print(f"    [AJAX ERROR] {day.strftime('%Y-%m-%d')}: {e}")
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
    """Scrape flights for a single route using deeplink.aspx + ChangeDay."""
    all_flights = []

    print(f"\n{'=' * 60}")
    print(f"  {route['from_code']} -> {route['to_code']}  "
          f"({route['from_city']} -> {route['to_city']})")
    print(f"{'=' * 60}")

    # Step 1: Create a VARS session via deeplink.aspx
    session_id, initial_html, http_session = create_vars_session(
        route["from_code"], route["to_code"], start
    )

    if not session_id:
        print(f"  [ERROR] Could not create VARS session for "
              f"{route['from_code']}->{route['to_code']}")
        return all_flights

    print(f"  Session: {session_id[:12]}...")

    # Step 2: Parse the initial page (day 1)
    for i, day in enumerate(date_range(start, end)):
        day_label = day.strftime("%Y-%m-%d")

        if i == 0:
            html = initial_html
        else:
            html = change_day(http_session, session_id, day)
            if html is None:
                time.sleep(BETWEEN_DAYS_S)
                continue

        flights = parse_flights_from_html(html, route, day)
        if flights:
            print(f"  {day_label}: {len(flights)} flight(s)")
            for f in flights:
                print(f"    {f['departure_time']} -> {f['arrival_time']}"
                      f"  ${f['price_numeric']}  {f['flight_number']}")
            all_flights.extend(flights)
        else:
            print(f"  {day_label}: no flights")

        time.sleep(BETWEEN_DAYS_S)

    return all_flights


# ── Main ─────────────────────────────────────────────────────────────────

def main():
    start_date = datetime.today().replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = start_date + timedelta(days=DAYS_TO_SCRAPE)

    print("=" * 60)
    print("  Tradewind Aviation Flight Scraper (HTTP)")
    print(f"  Period : {start_date.date()} -> {end_date.date()}")
    print(f"  Routes : {len(ROUTES)}")
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
