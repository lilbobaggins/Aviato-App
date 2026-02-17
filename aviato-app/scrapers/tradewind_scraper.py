#!/usr/bin/env python3
"""
Tradewind Aviation Flight Scraper for Aviato
Scrapes scheduled flight data for routes:
  - ACK (Nantucket) <-> HPN (Westchester County)
  - MVY (Martha's Vineyard) <-> HPN (Westchester County)
Uses the public VARS booking system at booking.flytradewind.com

Usage:
  python3 tradewind_scraper.py

Outputs:
  - tradewind_flights.csv
  - tradewind_flights.json
  - tradewind_flights_typescript.txt  (paste into Aviato flights.ts)
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import json
import csv
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

# How many days forward to scrape (Tradewind summer schedules go out far)
DAYS_TO_SCRAPE = 120

# Delay between requests (be respectful but not too slow — 120 days × 4 routes is a lot)
REQUEST_DELAY = 1.0

BASE_URL = "https://booking.flytradewind.com"
DEEPLINK_URL = f"{BASE_URL}/VARS/Public/deeplink.aspx"
CHANGE_DAY_URL = f"{BASE_URL}/VARS/Public/WebServices/AvailabilityWS.asmx/ChangeDay"
FLIGHT_CAL_URL = f"{BASE_URL}/VARS/Public/b/FlightCal.aspx"

# Duration estimates for routes (used when scraper can't parse duration)
ROUTE_DURATIONS = {
    ("ACK", "HPN"): "1h 10m",
    ("HPN", "ACK"): "1h 10m",
    ("MVY", "HPN"): "1h 05m",
    ("HPN", "MVY"): "1h 05m",
}


class TradewindScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        })
        self.vars_session_id = None
        self.all_flights = []

    def _build_deeplink_url(self, origin: str, destination: str, date: str) -> str:
        """
        Build the deeplink URL that initializes a search session.
        Date format: YYYY-MM-DD
        """
        date_obj = datetime.strptime(date, "%Y-%m-%d")
        date_div = date_obj.strftime("%m/%d/%Y")

        params = {
            "way": "one-way",
            "TripType": "Single",
            "type": "scheduled",
            "Slice1": "1",
            "Slice2": "2",
            "Slice3": "3",
            "Slice4": "4",
            "Cabin1": "Economy",
            "Cabin2": "Economy",
            "Cabin3": "Economy",
            "Cabin4": "Economy",
            "Carrier1": "TJ",
            "Carrier2": "TJ",
            "Carrier3": "TJ",
            "Carrier4": "TJ",
            "BookingCode1": "E",
            "BookingCode2": "E",
            "BookingCode3": "E",
            "BookingCode4": "E",
            "Adult": "1",
            "InfantLap": "0",
            "DepartureDate1_div": date_div,
            "DepartureDate1_time_div": "",
            "DepartureDate1": date,
            "Origin1": origin,
            "Destination1": destination,
        }
        return f"{DEEPLINK_URL}?{urlencode(params)}"

    def _extract_session_id(self, url: str):
        """Extract VarsSessionID from a redirect URL."""
        match = re.search(r"VarsSessionID=([a-f0-9\-]+)", url)
        return match.group(1) if match else None

    def _parse_date_to_iso(self, date_text: str, year: int = None) -> str:
        """
        Parse date text like 'Mon, 23 Jun' or 'Jun 23, 2026' to ISO format.
        If no year, assumes current/next occurrence.
        """
        if not date_text:
            return ""

        if year is None:
            year = datetime.now().year

        # Try various formats
        for fmt in ["%b %d, %Y", "%B %d, %Y", "%a, %d %b", "%a, %d %b %Y",
                     "%m/%d/%Y", "%d %b %Y", "%d %B %Y"]:
            try:
                dt = datetime.strptime(date_text.strip(), fmt)
                if dt.year < 2000:
                    dt = dt.replace(year=year)
                # If date is in the past, bump to next year
                if dt < datetime.now() - timedelta(days=1):
                    dt = dt.replace(year=year + 1)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue

        # Try extracting month and day manually
        match = re.search(r"(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)", date_text, re.IGNORECASE)
        if not match:
            match = re.search(r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(\d{1,2})", date_text, re.IGNORECASE)
            if match:
                month_str, day_str = match.group(1), match.group(2)
            else:
                return ""
        else:
            day_str, month_str = match.group(1), match.group(2)

        try:
            month = datetime.strptime(month_str, "%b").month
            day = int(day_str)
            dt = datetime(year, month, day)
            if dt < datetime.now() - timedelta(days=1):
                dt = dt.replace(year=year + 1)
            return dt.strftime("%Y-%m-%d")
        except (ValueError, TypeError):
            return ""

    def _clean_time(self, time_str: str) -> str:
        """Normalize time to format like '3:00 PM'."""
        if not time_str:
            return ""
        t = time_str.strip().upper()
        # Handle formats like "3:00PM" -> "3:00 PM"
        t = re.sub(r'(\d)(AM|PM)', r'\1 \2', t)
        return t

    def _parse_flights_from_html(self, html: str, origin: str, destination: str) -> list:
        """Parse flight information from the Flight Calendar HTML."""
        soup = BeautifulSoup(html, "html.parser")
        flights = []

        # Find all flight rows (exclude fare-class detail rows)
        flight_rows = soup.select(".flt-row:not(.flt-classes)")

        for row in flight_rows:
            try:
                flight = {}

                # Departure info
                depart_div = row.select_one(".cal-Depart-time")
                if depart_div:
                    time_span = depart_div.select_one(".time span")
                    ampm_span = depart_div.select_one(".time .ampm")
                    date_div = depart_div.select_one(".flightDate")
                    city_div = depart_div.select_one(".city")

                    depart_time = ""
                    if time_span:
                        depart_time = time_span.get_text(strip=True)
                    if ampm_span:
                        depart_time += ampm_span.get_text(strip=True)

                    flight["departure_time"] = self._clean_time(depart_time)
                    flight["departure_date"] = date_div.get_text(strip=True) if date_div else ""
                    flight["departure_city"] = city_div.get_text(strip=True) if city_div else ""

                # Arrival info
                arrive_div = row.select_one(".cal-Arrive-time")
                if arrive_div:
                    time_span = arrive_div.select_one(".time span")
                    ampm_span = arrive_div.select_one(".time .ampm")
                    date_div = arrive_div.select_one(".flightDate")
                    city_div = arrive_div.select_one(".city")

                    arrive_time = ""
                    if time_span:
                        arrive_time = time_span.get_text(strip=True)
                    if ampm_span:
                        arrive_time += ampm_span.get_text(strip=True)

                    flight["arrival_time"] = self._clean_time(arrive_time)
                    flight["arrival_date"] = date_div.get_text(strip=True) if date_div else ""
                    flight["arrival_city"] = city_div.get_text(strip=True) if city_div else ""

                # Flight duration and number
                duration_div = row.select_one(".flightDuration")
                flight["duration"] = duration_div.get_text(strip=True) if duration_div else ""

                flight_num_div = row.select_one(".flightnumber")
                flight["flight_number"] = flight_num_div.get_text(strip=True) if flight_num_div else ""

                # Stops
                legs_div = row.select_one(".flightLegs")
                if legs_div:
                    legs_text = legs_div.get_text(strip=True)
                    flight["stops"] = "Non-stop" if "Non-stop" in legs_text else legs_text

                # Price (lowest fare shown)
                fare_div = row.select_one(".cal-fare")
                if fare_div:
                    price_match = re.search(r"\$([\d,]+\.?\d*)", fare_div.get_text())
                    flight["price"] = price_match.group(0) if price_match else ""
                    flight["price_numeric"] = float(price_match.group(1).replace(",", "")) if price_match else 0
                else:
                    flight["price"] = ""
                    flight["price_numeric"] = 0

                # Route metadata
                flight["origin_code"] = origin
                flight["destination_code"] = destination

                # Parse date to ISO format
                flight["date_iso"] = self._parse_date_to_iso(flight.get("departure_date", ""))

                flights.append(flight)

            except Exception as e:
                print(f"  Warning: Error parsing flight row: {e}")
                continue

        return flights

    def _parse_calendar_dates(self, html: str) -> list:
        """Parse the available dates and prices from the calendar tabs."""
        soup = BeautifulSoup(html, "html.parser")
        dates = []

        col_tabs = soup.select("a[href*='colTab']")
        for tab in col_tabs:
            tab_text = tab.get_text(strip=True)
            date_match = re.search(r"(\w+,\d+\s\w+)", tab_text)
            price_match = re.search(r"\$([\d,]+\.?\d*)", tab_text)
            tab_index = re.search(r"colTab(\d+)", tab.get("href", ""))

            if date_match:
                dates.append({
                    "date_text": date_match.group(1),
                    "lowest_price": f"${price_match.group(1)}" if price_match else "No flights",
                    "tab_index": int(tab_index.group(1)) if tab_index else -1,
                    "has_flights": price_match is not None,
                })

        return dates

    def _change_day(self, tab_index: int, direction: str = "outbound"):
        """
        Call the ChangeDay web service to switch to a different date tab.
        Returns the updated HTML content.
        """
        if not self.vars_session_id:
            return None

        url = f"{CHANGE_DAY_URL}?VarsSessionID={self.vars_session_id}"
        payload = {
            "DayNo": str(tab_index),
            "Journey": "0" if direction == "outbound" else "1",
        }
        headers = {
            "Content-Type": "application/json; charset=utf-8",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": f"{FLIGHT_CAL_URL}?VarsSessionID={self.vars_session_id}",
        }

        try:
            resp = self.session.post(url, json=payload, headers=headers, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("d", "")
        except Exception as e:
            print(f"  Warning: ChangeDay request failed: {e}")

        return None

    def scrape_route(self, origin: str, destination: str, start_date: str, days: int) -> list:
        """
        Scrape flights for a single route starting from start_date for N days.
        Queries each individual day via deeplink to ensure we don't miss any day of the week.
        Skips days where we already have flights (from calendar tab navigation).
        """
        route_flights = []
        scraped_dates = set()  # Track which dates we already have flights for

        print(f"\n{'=' * 60}")
        print(f"  Scraping: {origin} -> {destination}")
        print(f"  Start date: {start_date}, Days: {days}")
        print(f"  (Checking every day to catch all days of the week)")
        print(f"{'=' * 60}")

        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        current_date = start_dt
        end_date = start_dt + timedelta(days=days)

        while current_date < end_date:
            date_str = current_date.strftime("%Y-%m-%d")

            # Skip if we already scraped this date via calendar tab navigation
            if date_str in scraped_dates:
                current_date += timedelta(days=1)
                continue

            print(f"\n  Searching {date_str}...")

            deeplink = self._build_deeplink_url(origin, destination, date_str)

            try:
                resp = self.session.get(deeplink, timeout=30, allow_redirects=True)
                time.sleep(REQUEST_DELAY)

                self.vars_session_id = self._extract_session_id(resp.url)
                if not self.vars_session_id:
                    print(f"  Warning: Could not get session ID for {date_str}")
                    current_date += timedelta(days=1)
                    continue

                # Parse flights from the initial page
                flights = self._parse_flights_from_html(resp.text, origin, destination)
                scraped_dates.add(date_str)

                if flights:
                    print(f"  Found {len(flights)} flights on {date_str}")
                    # Deduplicate before adding
                    for f in flights:
                        if not any(
                            existing["flight_number"] == f["flight_number"]
                            and existing.get("date_iso") == f.get("date_iso")
                            for existing in route_flights
                        ):
                            route_flights.append(f)
                else:
                    print(f"  No flights on {date_str}")

                # Also check calendar tabs for nearby days (saves future requests)
                calendar_dates = self._parse_calendar_dates(resp.text)
                for cal_date in calendar_dates:
                    if not cal_date["has_flights"]:
                        continue

                    tab_idx = cal_date["tab_index"]
                    tab_date_iso = self._parse_date_to_iso(cal_date["date_text"])

                    # Skip if already scraped
                    if tab_date_iso in scraped_dates:
                        continue

                    print(f"    -> Tab {tab_idx}: {cal_date['date_text']} "
                          f"(lowest: {cal_date['lowest_price']})")

                    time.sleep(REQUEST_DELAY)
                    day_html = self._change_day(tab_idx)

                    if day_html:
                        day_flights = self._parse_flights_from_html(day_html, origin, destination)
                        if day_flights:
                            for f in day_flights:
                                if not any(
                                    existing["flight_number"] == f["flight_number"]
                                    and existing.get("date_iso") == f.get("date_iso")
                                    for existing in route_flights
                                ):
                                    route_flights.append(f)
                            print(f"      Found {len(day_flights)} flights")

                    if tab_date_iso:
                        scraped_dates.add(tab_date_iso)

                # Move forward by 1 day (not 7!) to catch every day of the week
                current_date += timedelta(days=1)

            except requests.RequestException as e:
                print(f"  Warning: Request error for {date_str}: {e}")
                current_date += timedelta(days=1)
                continue

        print(f"\n  Total flights found for {origin}->{destination}: {len(route_flights)}")
        print(f"  Days checked: {len(scraped_dates)}")
        return route_flights

    def scrape_all_routes(self, start_date: str = None, days: int = DAYS_TO_SCRAPE):
        """Scrape all configured routes."""
        if start_date is None:
            start_date = datetime.now().strftime("%Y-%m-%d")

        print("=" * 55)
        print("  Tradewind Aviation Flight Scraper for Aviato")
        print(f"  Start: {start_date}  |  Days: {days}")
        print("=" * 55)

        for route in ROUTES:
            flights = self.scrape_route(
                origin=route["origin"],
                destination=route["destination"],
                start_date=start_date,
                days=days,
            )
            self.all_flights.extend(flights)
            time.sleep(2)

        print(f"\n\n{'=' * 60}")
        print(f"  TOTAL FLIGHTS SCRAPED: {len(self.all_flights)}")
        print(f"{'=' * 60}")

        return self.all_flights

    def to_csv(self, filename: str = "tradewind_flights.csv"):
        """Export scraped flights to CSV."""
        if not self.all_flights:
            print("No flights to export.")
            return

        fieldnames = [
            "origin_code", "destination_code",
            "departure_date", "date_iso",
            "departure_time", "departure_city",
            "arrival_date", "arrival_time", "arrival_city",
            "flight_number", "duration", "stops", "price", "price_numeric",
        ]

        with open(filename, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(self.all_flights)

        print(f"\nSaved {len(self.all_flights)} flights to {filename}")

    def to_json(self, filename: str = "tradewind_flights.json"):
        """Export scraped flights to JSON."""
        if not self.all_flights:
            print("No flights to export.")
            return

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(self.all_flights, f, indent=2, ensure_ascii=False)

        print(f"\nSaved {len(self.all_flights)} flights to {filename}")

    def save_typescript(self, filename: str = "tradewind_flights_typescript.txt"):
        """
        Generate Aviato-compatible TypeScript flight entries.
        These entries can be pasted into flights.ts to REPLACE existing
        Tradewind placeholder flights on the ACK-HPN, HPN-ACK, MVY-HPN, HPN-MVY routes.

        IMPORTANT: Only replaces the 4 scraped routes. Does NOT touch Caribbean
        Tradewind routes (SJU, EIS, SBH, FLL, etc.) which remain as-is.
        """
        if not self.all_flights:
            print("No flights to export.")
            return

        # Group by route
        routes = {}
        for f in self.all_flights:
            key = f"{f['origin_code']}-{f['destination_code']}"
            routes.setdefault(key, []).append(f)

        lines = []
        lines.append("// ═══════════════════════════════════════════════════════")
        lines.append("// Tradewind Aviation - Real Scraped Flights for Aviato")
        lines.append(f"// Scraped at: {datetime.utcnow().isoformat()}Z")
        lines.append(f"// Total flights: {len(self.all_flights)}")
        lines.append("// Routes: ACK<->HPN, MVY<->HPN")
        lines.append("// NOTE: Only replace these 4 routes in flights.ts.")
        lines.append("//        Do NOT touch Caribbean routes (SJU, EIS, FLL, etc.)")
        lines.append("// ═══════════════════════════════════════════════════════")
        lines.append("")

        for route_key in sorted(routes.keys()):
            route_flights = routes[route_key]
            origin, dest = route_key.split("-")

            # Sort by date
            route_flights.sort(key=lambda f: f.get("date_iso", "") or "9999-99-99")

            lines.append(f"  // === Tradewind: {route_key} ({len(route_flights)} flights) ===")
            lines.append(f"  // Replace the existing Tradewind entry/entries in the '{route_key}' array")

            for i, f in enumerate(route_flights, 1):
                dep = f.get("departure_time", "") or "TBD"
                arr = f.get("arrival_time", "") or "TBD"
                dur = f.get("duration", "") or ROUTE_DURATIONS.get((origin, dest), "1h 10m")
                price = int(f.get("price_numeric", 0)) or 895
                date_iso = f.get("date_iso", "")
                flight_num = f.get("flight_number", "")

                # Clean up duration format if needed
                dur = dur.strip()
                if not dur or dur == "0":
                    dur = ROUTE_DURATIONS.get((origin, dest), "1h 10m")

                # Build the entry
                date_part = f", date:'{date_iso}'" if date_iso else ""
                flight_num_part = f"  // {flight_num}" if flight_num else ""

                entry = (
                    f"    {{ id:'tw-{route_key.lower()}-{i}', "
                    f"airline:'Tradewind', dep:'{dep}', arr:'{arr}', "
                    f"dc:'{origin}', ac:'{dest}', dur:'{dur}', "
                    f"price:{price}, craft:'Pilatus PC-12', seats:6, "
                    f"amen:['WiFi','Snacks'], "
                    f"link:'flytradewind.com'{date_part} }},{flight_num_part}"
                )
                lines.append(entry)

            lines.append("")

        with open(filename, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

        print(f"\nSaved TypeScript entries to {filename}")
        print("Instructions:")
        print("  1. Open aviato-app/app/data/flights.ts")
        print("  2. Find each route key (ACK-HPN, HPN-ACK, MVY-HPN, HPN-MVY)")
        print("  3. Replace ONLY the Tradewind entries in those arrays")
        print("  4. Do NOT touch Caribbean Tradewind routes (SJU, EIS, FLL, etc.)")


# ── Main ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    scraper = TradewindScraper()

    # Scrape the next 120 days (covers summer season well)
    flights = scraper.scrape_all_routes(days=120)

    # Export results
    scraper.to_csv("tradewind_flights.csv")
    scraper.to_json("tradewind_flights.json")
    scraper.save_typescript("tradewind_flights_typescript.txt")

    # Print summary
    print("\n\nSummary by route:")
    for route in ROUTES:
        route_flights = [
            f for f in flights
            if f["origin_code"] == route["origin"]
            and f["destination_code"] == route["destination"]
        ]
        print(f"  {route['label']}: {len(route_flights)} flights")

    print(f"\nScraped at: {datetime.utcnow().isoformat()}Z")
