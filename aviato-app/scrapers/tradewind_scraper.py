#!/usr/bin/env python3
"""
Tradewind Aviation Flight Scraper for Aviato
Scrapes scheduled flight data for routes:
  - ACK (Nantucket) <-> HPN (Westchester County)
  - MVY (Martha's Vineyard) <-> HPN (Westchester County)

Strategy:
  1. Try live scraping via Selenium on mytradewind.flytradewind.com
     (real browser can navigate the Kendo UI widget + handle JS)
  2. If login is required or site is blocked, output nothing
     (flights.ts already has undated fallback entries)

Requirements:
    pip install selenium beautifulsoup4 webdriver-manager

Usage:
    python3 tradewind_scraper.py              # headless
    python3 tradewind_scraper.py --visible     # watch the browser

Outputs:
  - tradewind_flights.json  (consumed by update_flights.py)
"""

import sys
import time
import json
import re
from datetime import datetime, timedelta
from urllib.parse import urlencode

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    HAS_SELENIUM = True
except ImportError:
    HAS_SELENIUM = False

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False


# ── Configuration ──────────────────────────────────────────────────────────

ROUTES = [
    {"origin": "ACK", "destination": "HPN", "label": "Nantucket → Westchester"},
    {"origin": "HPN", "destination": "ACK", "label": "Westchester → Nantucket"},
    {"origin": "MVY", "destination": "HPN", "label": "Martha's Vineyard → Westchester"},
    {"origin": "HPN", "destination": "MVY", "label": "Westchester → Martha's Vineyard"},
]

DAYS_TO_SCRAPE = 120
REQUEST_DELAY = 2.0

# New booking system
WIDGET_URL = "https://mytradewind.flytradewind.com/widget?tripType=1"

# Real durations from flytradewind.com destination pages
ROUTE_DURATIONS = {
    ("ACK", "HPN"): "0h 45m",
    ("HPN", "ACK"): "0h 45m",
    ("MVY", "HPN"): "0h 40m",
    ("HPN", "MVY"): "0h 40m",
}

# Real full-rate pricing from flytradewind.com (non-ticketbook)
ROUTE_PRICES = {
    ("ACK", "HPN"): 1120,
    ("HPN", "ACK"): 1120,
    ("MVY", "HPN"): 1010,
    ("HPN", "MVY"): 1010,
}

# Airport IDs used by the widget's Kendo ViewModel
AIRPORT_DATA = {
    "ACK": {"id": 5588, "name": "Nantucket", "location": "Nantucket, MA"},
    "HPN": {"id": 9230, "name": "Westchester County", "location": "White Plains, NY"},
    "MVY": {"id": 5596, "name": "Martha's Vineyard", "location": "Vineyard Haven, MA"},
    "TEB": {"id": 8129, "name": "Teterboro", "location": "Teterboro, NJ"},
}


# ── Selenium Setup ─────────────────────────────────────────────────────────

def create_driver(headless=True):
    """Create a Chrome WebDriver instance."""
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1440,900")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])

    try:
        from webdriver_manager.chrome import ChromeDriverManager
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    except Exception:
        driver = webdriver.Chrome(options=options)

    driver.implicitly_wait(5)
    return driver


# ── Helpers ────────────────────────────────────────────────────────────────

def add_duration(dep_time_str, duration_str):
    """Calculate arrival time from departure + duration."""
    dep = datetime.strptime(dep_time_str.strip(), "%I:%M %p")
    hours, mins = 0, 0
    h_match = re.search(r'(\d+)h', duration_str)
    m_match = re.search(r'(\d+)m', duration_str)
    if h_match:
        hours = int(h_match.group(1))
    if m_match:
        mins = int(m_match.group(1))
    arr = dep + timedelta(hours=hours, minutes=mins)
    return arr.strftime("%-I:%M %p")


# ── Scraper Class ──────────────────────────────────────────────────────────

class TradewindScraper:
    def __init__(self, headless=True):
        self.headless = headless
        self.driver = None
        self.all_flights = []
        self.login_required = False

    def _ensure_driver(self):
        if self.driver is None:
            print("  Starting Chrome...")
            self.driver = create_driver(headless=self.headless)
        return self.driver

    def _quit_driver(self):
        if self.driver:
            self.driver.quit()
            self.driver = None

    # ── Widget-based scraping via Selenium ──────────────────────────

    def _scrape_via_widget(self, origin, destination, date):
        """
        Use Selenium to navigate the Tradewind booking widget:
        1. Load the widget page
        2. Click "Scheduled" tab
        3. Set origin/destination airports via the Kendo ViewModel
        4. Set departure date
        5. Click SEARCH
        6. Extract flight results from the results page

        Returns list of flight dicts, or None if it fails.
        """
        driver = self._ensure_driver()
        date_str = date.strftime("%Y-%m-%d")
        date_fmt = date.strftime("%m/%d/%Y")

        try:
            # Load widget
            driver.get(WIDGET_URL)
            time.sleep(3)

            # Click "Scheduled" tab
            try:
                buttons = driver.find_elements(By.CSS_SELECTOR, "button[type='button']")
                for btn in buttons:
                    if btn.text.strip() == "Scheduled":
                        btn.click()
                        time.sleep(1)
                        break
            except Exception as e:
                print(f"    [WARN] Could not click Scheduled tab: {e}")

            # Set airports and date via the Kendo ViewModel
            orig_data = AIRPORT_DATA.get(origin, {})
            dest_data = AIRPORT_DATA.get(destination, {})

            setup_js = f"""
                // Set airports on the widget viewmodel
                var legs = vm.widget.get('legs');
                legs[0].set('departureAirport', {{
                    id: {orig_data.get('id', -1)},
                    iataCode: '{origin}',
                    icaoCode: null,
                    name: '{orig_data.get("name", origin)}',
                    location: '{orig_data.get("location", "")}'
                }});
                legs[0].set('destinationAirport', {{
                    id: {dest_data.get('id', -1)},
                    iataCode: '{destination}',
                    icaoCode: null,
                    name: '{dest_data.get("name", destination)}',
                    location: '{dest_data.get("location", "")}'
                }});
                // One way
                vm.widget.set('tripLength', 1);
                // Set departure date
                legs[0].set('departureDate', new Date('{date_str}T10:00:00'));
                return 'ok';
            """

            try:
                result = driver.execute_script(setup_js)
            except Exception as e:
                print(f"    [WARN] Could not set ViewModel: {e}")
                return None

            time.sleep(1)

            # Click SEARCH button
            try:
                search_btn = driver.find_element(
                    By.CSS_SELECTOR, "button.widget__search-btn, .widget__search-btn"
                )
                search_btn.click()
            except Exception:
                # Try clicking any button that says SEARCH
                try:
                    buttons = driver.find_elements(By.CSS_SELECTOR, "button")
                    for btn in buttons:
                        if btn.text.strip().upper() == "SEARCH":
                            btn.click()
                            break
                except Exception:
                    # Last resort: call vm.submit()
                    try:
                        driver.execute_script("vm.submit()")
                    except Exception as e:
                        print(f"    [ERROR] Could not submit search: {e}")
                        return None

            time.sleep(5)

            # Check if we got redirected to login
            current_url = driver.current_url
            if "/login" in current_url:
                print(f"    [LOGIN] Redirected to login — flight results require authentication")
                self.login_required = True
                return None

            # Try to extract flight data from the results page
            return self._extract_results(driver, origin, destination, date_str)

        except Exception as e:
            print(f"    [ERROR] Widget scrape failed: {e}")
            return None

    def _extract_results(self, driver, origin, destination, date_str):
        """Extract flight results from whatever page we landed on."""
        flights = []
        html = driver.page_source

        if HAS_BS4:
            soup = BeautifulSoup(html, "html.parser")

            # Look for flight result elements (various selectors)
            for selector in [
                ".flight-result", ".flight-row", ".flight-card",
                ".shuttle-flight", ".schedule-flight", "[data-flight]",
                ".departure-flight", ".availability",
                "tr[data-uid]", ".k-listview-content > div",
            ]:
                rows = soup.select(selector)
                if rows:
                    print(f"    Found {len(rows)} elements: '{selector}'")
                    for row in rows:
                        flight = self._parse_flight_element(
                            row, origin, destination, date_str
                        )
                        if flight:
                            flights.append(flight)

        # Also try extracting via JavaScript
        if not flights:
            try:
                js_flights = driver.execute_script("""
                    // Try to find flight data in page state
                    var results = [];

                    // Check for Kendo data sources
                    if (typeof kendo !== 'undefined') {
                        var widgets = document.querySelectorAll('[data-role]');
                        for (var w of widgets) {
                            var inst = kendo.widgetInstance($(w));
                            if (inst && inst.dataSource) {
                                var data = inst.dataSource.data();
                                for (var i = 0; i < data.length; i++) {
                                    var item = data[i];
                                    if (item.departureTime || item.departure || item.dep) {
                                        results.push({
                                            dep: item.departureTime || item.departure || item.dep || '',
                                            arr: item.arrivalTime || item.arrival || item.arr || '',
                                            price: item.price || item.fare || item.amount || 0,
                                            flight: item.flightNumber || item.flight || '',
                                            seats: item.seats || item.available || 0
                                        });
                                    }
                                }
                            }
                        }
                    }

                    // Check for global flight data
                    if (window.flightData) results = results.concat(window.flightData);
                    if (window.flights) results = results.concat(window.flights);

                    return results;
                """)

                if js_flights:
                    duration = ROUTE_DURATIONS.get((origin, destination), "0h 45m")
                    price = ROUTE_PRICES.get((origin, destination), 1120)
                    for jf in js_flights:
                        dep = str(jf.get("dep", ""))
                        arr = str(jf.get("arr", ""))
                        p = jf.get("price", 0) or price
                        if dep:
                            flights.append({
                                "origin_code": origin,
                                "destination_code": destination,
                                "departure_time": dep,
                                "arrival_time": arr,
                                "date_iso": date_str,
                                "price_numeric": int(p),
                                "duration": duration,
                                "flight_number": jf.get("flight", ""),
                                "source": "live",
                            })

            except Exception as e:
                print(f"    [WARN] JS extraction failed: {e}")

        # Try scraping time/price patterns from page text
        if not flights and HAS_BS4:
            text = soup.get_text() if soup else ""
            time_pattern = re.findall(
                r'(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))', text
            )
            price_pattern = re.findall(r'\$(\d{3,4})', text)
            if len(time_pattern) >= 2 and price_pattern:
                duration = ROUTE_DURATIONS.get((origin, destination), "0h 45m")
                for i in range(0, len(time_pattern) - 1, 2):
                    dep_time = time_pattern[i].strip().upper()
                    arr_time = time_pattern[i + 1].strip().upper()
                    pidx = min(i // 2, len(price_pattern) - 1)
                    price = int(price_pattern[pidx])
                    flights.append({
                        "origin_code": origin,
                        "destination_code": destination,
                        "departure_time": dep_time,
                        "arrival_time": arr_time,
                        "date_iso": date_str,
                        "price_numeric": price,
                        "duration": duration,
                        "flight_number": "",
                        "source": "live",
                    })

        return flights if flights else None

    def _parse_flight_element(self, element, origin, destination, date_str):
        """Parse a single flight from an HTML element."""
        text = element.get_text(separator=" ", strip=True)
        times = re.findall(r'(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))', text)
        price_match = re.search(r'\$(\d{3,4})', text)
        duration = ROUTE_DURATIONS.get((origin, destination), "0h 45m")
        default_price = ROUTE_PRICES.get((origin, destination), 1120)

        if times:
            dep_time = times[0].strip().upper()
            arr_time = times[1].strip().upper() if len(times) >= 2 else ""
            price = int(price_match.group(1)) if price_match else default_price
            return {
                "origin_code": origin,
                "destination_code": destination,
                "departure_time": dep_time,
                "arrival_time": arr_time,
                "date_iso": date_str,
                "price_numeric": price,
                "duration": duration,
                "flight_number": "",
                "source": "live",
            }
        return None

    # ── Main scraping logic ────────────────────────────────────────────

    def scrape_route(self, origin, destination, start_date, days):
        """Scrape a single route via Selenium."""
        route_flights = []

        print(f"\n{'=' * 60}")
        print(f"  Route: {origin} -> {destination}")
        print(f"  Window: {start_date.strftime('%Y-%m-%d')} + {days} days")
        print(f"{'=' * 60}")

        if self.login_required:
            print(f"  [SKIP] Login required — cannot scrape without credentials")
            return []

        # Test with a date ~2 weeks out first
        test_date = start_date + timedelta(days=14)
        print(f"\n  Testing search for {test_date.strftime('%Y-%m-%d')}...")

        test_result = self._scrape_via_widget(origin, destination, test_date)

        if self.login_required:
            print(f"  [SKIP] Login wall detected — stopping")
            return []

        if test_result:
            print(f"  [LIVE] Found {len(test_result)} flights!")
            route_flights.extend(test_result)

            # Scrape remaining dates (sample every few days to be respectful)
            for day_offset in range(0, days, 3):
                date = start_date + timedelta(days=day_offset)
                if any(f["date_iso"] == date.strftime("%Y-%m-%d") for f in route_flights):
                    continue

                result = self._scrape_via_widget(origin, destination, date)
                if result:
                    route_flights.extend(result)
                    print(f"    {date.strftime('%Y-%m-%d')}: {len(result)} flights")

                time.sleep(REQUEST_DELAY)
        else:
            print(f"  [SKIP] No flight data returned")

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
        print(f"  Method: Selenium (real browser)")
        print("=" * 60)

        if not HAS_SELENIUM:
            print("\n  [ERROR] selenium not installed.")
            print("  Install with: pip install selenium webdriver-manager")
            return []

        try:
            for route in ROUTES:
                flights = self.scrape_route(
                    origin=route["origin"],
                    destination=route["destination"],
                    start_date=start_date,
                    days=days,
                )
                self.all_flights.extend(flights)
                time.sleep(2)
        finally:
            self._quit_driver()

        print(f"\n{'=' * 60}")
        print(f"  TOTAL FLIGHTS: {len(self.all_flights)}")
        if self.all_flights:
            source_counts = {}
            for f in self.all_flights:
                s = f.get("source", "unknown")
                source_counts[s] = source_counts.get(s, 0) + 1
            for src, count in source_counts.items():
                print(f"    {src}: {count}")
        if self.login_required:
            print(f"\n  NOTE: Flight results require Tradewind account login.")
            print(f"  The undated fallback flights in flights.ts will be used instead.")
            print(f"  (Real pricing: ACK $1,120 | MVY $1,010 per seat, Pilatus PC-12)")
        print(f"{'=' * 60}")

        return self.all_flights

    def to_json(self, filename="tradewind_flights.json"):
        """Export flights to JSON for update_flights.py."""
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(self.all_flights, f, indent=2, ensure_ascii=False)
        print(f"\nSaved {len(self.all_flights)} flights to {filename}")


# ── Main ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    headless = "--visible" not in sys.argv

    scraper = TradewindScraper(headless=headless)
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
