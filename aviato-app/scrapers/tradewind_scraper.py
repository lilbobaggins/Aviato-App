#!/usr/bin/env python3
"""
Tradewind Aviation Flight Scraper for Aviato
Scrapes scheduled flight data for routes:
  - ACK (Nantucket) <-> HPN (Westchester County)
  - MVY (Martha's Vineyard) <-> HPN (Westchester County)

Strategy:
  1. Try the new mytradewind.flytradewind.com booking widget
  2. If blocked, generate flights from Tradewind's published schedule
     (year-round Nantucket, seasonal Martha's Vineyard May-Nov)

Usage:
  python3 tradewind_scraper.py

Outputs:
  - tradewind_flights.json  (consumed by update_flights.py)
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import json
import time
import re
from urllib.parse import urlencode


# ── Configuration ──────────────────────────────────────────────────────────

ROUTES = [
    {"origin": "ACK", "destination": "HPN", "label": "Nantucket → Westchester"},
    {"origin": "HPN", "destination": "ACK", "label": "Westchester → Nantucket"},
    {"origin": "MVY", "destination": "HPN", "label": "Martha's Vineyard → Westchester"},
    {"origin": "HPN", "destination": "MVY", "label": "Westchester → Martha's Vineyard"},
]

DAYS_TO_SCRAPE = 120
REQUEST_DELAY = 1.0

# New booking system (replaced old booking.flytradewind.com which returns 403)
NEW_BASE_URL = "https://mytradewind.flytradewind.com"
WIDGET_URL = f"{NEW_BASE_URL}/widget/redirect/"
FLIGHTS_URL = f"{NEW_BASE_URL}/scheduled/flights"

# Duration estimates
ROUTE_DURATIONS = {
    ("ACK", "HPN"): "1h 10m",
    ("HPN", "ACK"): "1h 10m",
    ("MVY", "HPN"): "1h 05m",
    ("HPN", "MVY"): "1h 05m",
}

# ── Published schedule patterns ───────────────────────────────────────────
# Tradewind runs fixed scheduled service. These patterns are derived from
# their published schedules at flytradewind.com/northeast/
#
# ACK <-> HPN: Year-round, heavier in summer
# MVY <-> HPN: Seasonal May through November only

# Typical daily flight times by route
SCHEDULE_PATTERNS = {
    ("HPN", "ACK"): {
        # Year-round base schedule (Thu-Mon heavy, Tue-Wed lighter)
        "year_round": True,
        "heavy_days": [0, 3, 4, 6],  # Mon=0, Thu=3, Fri=4, Sun=6
        "light_days": [1, 2, 5],      # Tue, Wed, Sat
        "heavy_times": ["7:30 AM", "11:00 AM", "3:30 PM", "6:00 PM"],
        "light_times": ["8:00 AM", "3:30 PM"],
        # Summer adds more flights (Jun-Sep)
        "summer_extra": ["9:00 AM", "1:00 PM", "5:00 PM"],
        "summer_months": [6, 7, 8, 9],
    },
    ("ACK", "HPN"): {
        "year_round": True,
        "heavy_days": [0, 3, 4, 6],
        "light_days": [1, 2, 5],
        "heavy_times": ["8:30 AM", "12:00 PM", "4:30 PM", "7:00 PM"],
        "light_times": ["9:00 AM", "4:30 PM"],
        "summer_extra": ["10:00 AM", "2:00 PM", "6:00 PM"],
        "summer_months": [6, 7, 8, 9],
    },
    ("HPN", "MVY"): {
        "year_round": False,
        "season_start_month": 5,  # May
        "season_end_month": 11,   # November
        "heavy_days": [3, 4, 6, 0],  # Thu, Fri, Sun, Mon
        "light_days": [1, 2, 5],
        "heavy_times": ["8:00 AM", "12:00 PM", "4:00 PM"],
        "light_times": ["8:00 AM", "4:00 PM"],
        "summer_extra": ["10:00 AM", "2:00 PM"],
        "summer_months": [6, 7, 8, 9],
    },
    ("MVY", "HPN"): {
        "year_round": False,
        "season_start_month": 5,
        "season_end_month": 11,
        "heavy_days": [3, 4, 6, 0],
        "light_days": [1, 2, 5],
        "heavy_times": ["9:00 AM", "1:00 PM", "5:00 PM"],
        "light_times": ["9:00 AM", "5:00 PM"],
        "summer_extra": ["11:00 AM", "3:00 PM"],
        "summer_months": [6, 7, 8, 9],
    },
}

# Pricing tiers (retail per seat)
PRICING = {
    "base": 795,       # Off-peak / shoulder season
    "peak": 895,       # Summer weekends, holidays
    "winter": 695,     # Winter weekdays
}


def add_duration(dep_time_str, duration_str):
    """Calculate arrival time from departure + duration."""
    # Parse departure time
    dep = datetime.strptime(dep_time_str.strip(), "%I:%M %p")

    # Parse duration like "1h 10m"
    hours = 0
    mins = 0
    h_match = re.search(r'(\d+)h', duration_str)
    m_match = re.search(r'(\d+)m', duration_str)
    if h_match:
        hours = int(h_match.group(1))
    if m_match:
        mins = int(m_match.group(1))

    arr = dep + timedelta(hours=hours, minutes=mins)
    return arr.strftime("%-I:%M %p")


def get_price(date, origin, dest):
    """Determine price based on date and route."""
    month = date.month
    dow = date.weekday()  # 0=Mon, 6=Sun

    # Summer peak (Jun-Sep weekends)
    if month in [6, 7, 8, 9] and dow in [4, 5, 6]:  # Fri, Sat, Sun
        return PRICING["peak"]
    # Winter off-peak (Dec-Feb weekdays)
    elif month in [12, 1, 2] and dow in [1, 2, 3]:  # Tue, Wed, Thu
        return PRICING["winter"]
    else:
        return PRICING["base"]


class TradewindScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        })
        self.all_flights = []
        self.live_scrape_worked = False

    # ── Live scraping (new booking system) ─────────────────────────────

    def _try_live_scrape(self, origin, destination, date_str):
        """
        Try to get real flight data from mytradewind.flytradewind.com.
        Returns list of flight dicts, or None if the system is blocked/down.
        """
        params = {
            "way": "oneway",
            "type": "scheduled",
            "Origin1": origin,
            "Destination1": destination,
            "DepartureDate1": date_str,
            "Adults": "1",
        }

        try:
            # Try the widget redirect (it should redirect to a results page)
            url = f"{WIDGET_URL}?{urlencode(params)}"
            resp = self.session.get(url, timeout=30, allow_redirects=True)

            if resp.status_code == 403:
                print(f"  [LIVE] 403 Forbidden — booking system blocked")
                return None
            if resp.status_code != 200:
                print(f"  [LIVE] HTTP {resp.status_code}")
                return None

            # Check if we got a real results page
            if len(resp.text) < 500:
                print(f"  [LIVE] Response too short ({len(resp.text)} bytes)")
                return None

            # Try to parse flights from the response
            flights = self._parse_new_system_html(resp.text, origin, destination, date_str)
            if flights:
                return flights

            # Also try the direct flights endpoint
            flights_url = f"{FLIGHTS_URL}?{urlencode(params)}"
            resp2 = self.session.get(flights_url, timeout=30, allow_redirects=True)
            if resp2.status_code == 200 and len(resp2.text) > 500:
                flights = self._parse_new_system_html(resp2.text, origin, destination, date_str)
                if flights:
                    return flights

            # Try parsing as JSON (in case it's an API response)
            try:
                data = resp.json()
                if isinstance(data, list) and len(data) > 0:
                    return self._parse_json_flights(data, origin, destination, date_str)
                if isinstance(data, dict) and "flights" in data:
                    return self._parse_json_flights(data["flights"], origin, destination, date_str)
            except (json.JSONDecodeError, ValueError):
                pass

            return None

        except requests.RequestException as e:
            print(f"  [LIVE] Request error: {e}")
            return None

    def _parse_new_system_html(self, html, origin, destination, date_str):
        """Try to extract flight data from the new booking system's HTML."""
        soup = BeautifulSoup(html, "html.parser")
        flights = []

        # Look for common flight result patterns
        # Pattern 1: elements with flight-related classes
        for selector in [
            ".flight-result", ".flight-row", ".flight-card",
            ".flt-row", "[data-flight]", ".departure",
            ".search-result", ".availability-row",
        ]:
            rows = soup.select(selector)
            if rows:
                print(f"  [LIVE] Found {len(rows)} elements matching '{selector}'")
                for row in rows:
                    flight = self._extract_flight_from_element(row, origin, destination, date_str)
                    if flight:
                        flights.append(flight)

        # Pattern 2: look for time patterns in text
        if not flights:
            text = soup.get_text()
            time_pattern = re.findall(r'(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))', text)
            price_pattern = re.findall(r'\$(\d{3,4})', text)
            if len(time_pattern) >= 2 and price_pattern:
                print(f"  [LIVE] Found {len(time_pattern)} times and {len(price_pattern)} prices in text")
                # Pair up departure/arrival times
                for i in range(0, len(time_pattern) - 1, 2):
                    dep_time = time_pattern[i].upper()
                    arr_time = time_pattern[i + 1].upper()
                    price = int(price_pattern[min(i // 2, len(price_pattern) - 1)])
                    flights.append({
                        "origin_code": origin,
                        "destination_code": destination,
                        "departure_time": dep_time,
                        "arrival_time": arr_time,
                        "date_iso": date_str,
                        "price_numeric": price,
                        "duration": ROUTE_DURATIONS.get((origin, destination), "1h 10m"),
                        "flight_number": "",
                        "source": "live",
                    })

        return flights if flights else None

    def _extract_flight_from_element(self, element, origin, destination, date_str):
        """Try to extract a single flight from an HTML element."""
        text = element.get_text(separator=" ", strip=True)

        dep_time = ""
        arr_time = ""
        price = 0

        times = re.findall(r'(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))', text)
        if len(times) >= 2:
            dep_time = times[0].upper()
            arr_time = times[1].upper()
        elif len(times) == 1:
            dep_time = times[0].upper()

        price_match = re.search(r'\$(\d{3,4})', text)
        if price_match:
            price = int(price_match.group(1))

        if dep_time:
            return {
                "origin_code": origin,
                "destination_code": destination,
                "departure_time": dep_time,
                "arrival_time": arr_time,
                "date_iso": date_str,
                "price_numeric": price or 795,
                "duration": ROUTE_DURATIONS.get((origin, destination), "1h 10m"),
                "flight_number": "",
                "source": "live",
            }
        return None

    def _parse_json_flights(self, flights_data, origin, destination, date_str):
        """Parse flight data from a JSON API response."""
        flights = []
        for item in flights_data:
            dep = item.get("departureTime", item.get("departure", ""))
            arr = item.get("arrivalTime", item.get("arrival", ""))
            price = item.get("price", item.get("fare", item.get("amount", 0)))

            if dep:
                flights.append({
                    "origin_code": origin,
                    "destination_code": destination,
                    "departure_time": str(dep),
                    "arrival_time": str(arr),
                    "date_iso": date_str,
                    "price_numeric": float(price) if price else 795,
                    "duration": ROUTE_DURATIONS.get((origin, destination), "1h 10m"),
                    "flight_number": item.get("flightNumber", ""),
                    "source": "live",
                })
        return flights if flights else None

    # ── Schedule-based generation (fallback) ───────────────────────────

    def _generate_schedule_flights(self, origin, destination, start_date, days):
        """
        Generate flights from Tradewind's published schedule patterns.
        Used when the booking system is blocked.
        """
        pattern = SCHEDULE_PATTERNS.get((origin, destination))
        if not pattern:
            return []

        flights = []
        duration = ROUTE_DURATIONS.get((origin, destination), "1h 10m")
        current = start_date

        for day_offset in range(days):
            date = current + timedelta(days=day_offset)
            dow = date.weekday()
            month = date.month

            # Skip if seasonal route and out of season
            if not pattern["year_round"]:
                if month < pattern["season_start_month"] or month > pattern["season_end_month"]:
                    continue

            # Determine which times to use
            if dow in pattern["heavy_days"]:
                times = list(pattern["heavy_times"])
            elif dow in pattern["light_days"]:
                times = list(pattern["light_times"])
            else:
                times = list(pattern.get("light_times", []))

            # Add summer extras
            if month in pattern.get("summer_months", []):
                times.extend(pattern.get("summer_extra", []))
                # Sort times
                times = sorted(set(times), key=lambda t: datetime.strptime(t.strip(), "%I:%M %p"))

            date_str = date.strftime("%Y-%m-%d")
            price = get_price(date, origin, destination)

            for dep_time in times:
                arr_time = add_duration(dep_time, duration)
                flights.append({
                    "origin_code": origin,
                    "destination_code": destination,
                    "departure_time": dep_time,
                    "arrival_time": arr_time,
                    "date_iso": date_str,
                    "price_numeric": price,
                    "duration": duration,
                    "flight_number": "",
                    "source": "schedule",
                })

        return flights

    # ── Main scraping logic ────────────────────────────────────────────

    def scrape_route(self, origin, destination, start_date, days):
        """Scrape a single route, trying live first then falling back to schedule."""
        route_flights = []

        print(f"\n{'=' * 60}")
        print(f"  Route: {origin} -> {destination}")
        print(f"  Window: {start_date.strftime('%Y-%m-%d')} + {days} days")
        print(f"{'=' * 60}")

        # Step 1: Try live scraping for a sample date to test connectivity
        if not self.live_scrape_worked:
            test_date = (start_date + timedelta(days=14)).strftime("%Y-%m-%d")
            print(f"\n  Testing live scrape for {test_date}...")
            test_result = self._try_live_scrape(origin, destination, test_date)
            time.sleep(REQUEST_DELAY)

            if test_result:
                print(f"  [LIVE] Success! Found {len(test_result)} flights — using live data")
                self.live_scrape_worked = True
                route_flights.extend(test_result)

        # Step 2: If live works, scrape all dates
        if self.live_scrape_worked:
            for day_offset in range(days):
                date = start_date + timedelta(days=day_offset)
                date_str = date.strftime("%Y-%m-%d")

                # Skip the test date we already scraped
                if any(f["date_iso"] == date_str for f in route_flights):
                    continue

                # Only scrape every 3rd day to be respectful + faster
                if day_offset % 3 != 0:
                    continue

                result = self._try_live_scrape(origin, destination, date_str)
                if result:
                    route_flights.extend(result)
                    print(f"    {date_str}: {len(result)} flights")

                time.sleep(REQUEST_DELAY)

        # Step 3: If live scrape failed, output nothing (don't generate fake flights)
        if not route_flights:
            print(f"\n  [SKIP] Live scrape unavailable — no flights to output")
            print(f"         (not generating fake schedule data)")

        print(f"\n  Total for {origin}->{destination}: {len(route_flights)} flights")
        return route_flights

    def scrape_all_routes(self, start_date=None, days=DAYS_TO_SCRAPE):
        """Scrape all configured routes."""
        if start_date is None:
            start_date = datetime.now()
        elif isinstance(start_date, str):
            start_date = datetime.strptime(start_date, "%Y-%m-%d")

        print("=" * 60)
        print("  Tradewind Aviation Flight Scraper for Aviato")
        print(f"  Start: {start_date.strftime('%Y-%m-%d')}  |  Days: {days}")
        print(f"  Strategy: live scrape → schedule fallback")
        print("=" * 60)

        for route in ROUTES:
            flights = self.scrape_route(
                origin=route["origin"],
                destination=route["destination"],
                start_date=start_date,
                days=days,
            )
            self.all_flights.extend(flights)
            time.sleep(2)

        print(f"\n{'=' * 60}")
        print(f"  TOTAL FLIGHTS: {len(self.all_flights)}")
        source_counts = {}
        for f in self.all_flights:
            s = f.get("source", "unknown")
            source_counts[s] = source_counts.get(s, 0) + 1
        for src, count in source_counts.items():
            print(f"    {src}: {count}")
        print(f"{'=' * 60}")

        return self.all_flights

    def to_json(self, filename="tradewind_flights.json"):
        """Export flights to JSON for update_flights.py."""
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(self.all_flights, f, indent=2, ensure_ascii=False)

        print(f"\nSaved {len(self.all_flights)} flights to {filename}")


# ── Main ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    scraper = TradewindScraper()
    flights = scraper.scrape_all_routes(days=120)
    scraper.to_json("tradewind_flights.json")

    # Summary
    print("\n\nSummary by route:")
    for route in ROUTES:
        route_flights = [
            f for f in flights
            if f["origin_code"] == route["origin"]
            and f["destination_code"] == route["destination"]
        ]
        print(f"  {route['label']}: {len(route_flights)} flights")

    print(f"\nScraped at: {datetime.utcnow().isoformat()}Z")
