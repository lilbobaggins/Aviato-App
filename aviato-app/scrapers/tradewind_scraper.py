#!/usr/bin/env python3
"""
Tradewind Aviation Flight Scraper for Aviato
Scrapes the PUBLIC flight calendar at booking.flytradewind.com/VARS
No login required — this page is publicly accessible.

Routes:
  - ACK (Nantucket) <-> HPN (Westchester County)
  - MVY (Martha's Vineyard) <-> HPN (Westchester County)

Period: today through ~4 months out

Requirements:
    pip install selenium beautifulsoup4 webdriver-manager

Usage:
    python3 tradewind_scraper.py              # headless
    python3 tradewind_scraper.py --visible    # watch the browser

Outputs:
  - tradewind_flights.json  (consumed by update_flights.py)
"""

import sys
import time
import json
import re
from datetime import datetime, timedelta

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from bs4 import BeautifulSoup


# ── Configuration ──────────────────────────────────────────────────────────

BASE_URL = "https://booking.flytradewind.com/VARS/Public/b/flightCal.aspx"

ROUTES = [
    {"from_code": "HPN", "from_city": "Westchester County (New York)",
     "to_code":   "ACK", "to_city":   "Nantucket"},
    {"from_code": "ACK", "from_city": "Nantucket",
     "to_code":   "HPN", "to_city":   "Westchester County (New York)"},
    {"from_code": "HPN", "from_city": "Westchester County (New York)",
     "to_code":   "MVY", "to_city":   "Martha's Vineyard"},
    {"from_code": "MVY", "from_city": "Martha's Vineyard",
     "to_code":   "HPN", "to_city":   "Westchester County (New York)"},
]

# Real durations from flytradewind.com destination pages
ROUTE_DURATIONS = {
    ("ACK", "HPN"): "0h 45m",
    ("HPN", "ACK"): "0h 45m",
    ("MVY", "HPN"): "0h 40m",
    ("HPN", "MVY"): "0h 40m",
}

DAYS_TO_SCRAPE = 120
WAIT_SECONDS = 4
BETWEEN_DAYS_S = 1.5
OUTPUT_JSON = "tradewind_flights.json"


# ── Selenium Setup ─────────────────────────────────────────────────────────

def create_driver(headless=True):
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1280,900")
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


# ── Date Helpers ───────────────────────────────────────────────────────────

def date_range(start, end):
    cur = start
    while cur <= end:
        yield cur
        cur += timedelta(days=1)


def fmt_search_date(d):
    """01-Jun-2026"""
    return d.strftime("%d-%b-%Y")


def fmt_change_day(d):
    """25 May 2026"""
    try:
        return d.strftime("%-d %b %Y")
    except ValueError:
        return d.strftime("%#d %b %Y")  # Windows


def booking_url(origin, destination, date):
    d = fmt_search_date(date)
    return (
        f"https://booking.flytradewind.com/VARS/Public/b/flightCal.aspx"
        f"?Origin={origin}&Destination={destination}"
        f"&departuredate={d}&ReturnTrip=chkJourneyTypeOneWay&Adults=1"
    )


# ── Parse Flights from HTML ───────────────────────────────────────────────

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


# ── AJAX Day Navigation ───────────────────────────────────────────────────

def change_day_ajax(driver, session_id, day):
    """Call the ChangeDay AJAX endpoint to navigate to a new date."""
    day_str = fmt_change_day(day)
    try:
        result = driver.execute_async_script(
            """
            const done       = arguments[arguments.length - 1];
            const sessionId  = arguments[0];
            const dayStr     = arguments[1];
            const xhr = new XMLHttpRequest();
            xhr.open('POST',
                '/VARS/WebServices/AvailabilityWS.asmx/ChangeDay?VarsSessionID=' + sessionId);
            xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.onload  = () => done({ ok: xhr.status === 200, html: xhr.responseText });
            xhr.onerror = () => done({ ok: false, html: '' });
            xhr.send(JSON.stringify({
                ChangeDayRequest: {
                    VarsSessionID: sessionId,
                    Zone: 'PUBLIC',
                    NewDay: dayStr,
                    PanelIndex: 0,
                    JustDayBar: false
                }
            }));
            """,
            session_id, day_str
        )
        if result and result.get("ok"):
            return result.get("html", "")
    except Exception as e:
        print(f"    [AJAX ERROR] {e}")
    return None


# ── Scrape One Route ──────────────────────────────────────────────────────

def scrape_route(driver, route, start, end):
    all_flights = []

    print(f"\n{'=' * 60}")
    print(f"  {route['from_code']} → {route['to_code']}  "
          f"({route['from_city']} → {route['to_city']})")
    print(f"{'=' * 60}")

    # Load first date via form submission
    driver.get(BASE_URL)
    wait = WebDriverWait(driver, 20)

    try:
        wait.until(EC.presence_of_element_located((By.ID, "Origin")))
    except Exception:
        print("  [ERROR] Page did not load — booking.flytradewind.com may be down")
        return all_flights

    try:
        Select(driver.find_element(By.ID, "Origin")).select_by_value(route["from_code"])
        time.sleep(0.5)
        Select(driver.find_element(By.ID, "Destination")).select_by_value(route["to_code"])

        # One-way
        ow = driver.find_element(By.ID, "ReturnTrip2")
        if not ow.is_selected():
            ow.click()

        # Date
        df = driver.find_element(By.ID, "departuredate")
        df.clear()
        df.send_keys(fmt_search_date(start))

        # Search
        driver.find_element(
            By.CSS_SELECTOR, "button.fa-search, button[class*='btn-next']"
        ).click()

        try:
            wait.until(EC.presence_of_element_located(
                (By.CSS_SELECTOR, ".flt-cal-panel, .calDiv")
            ))
        except Exception:
            pass
        time.sleep(WAIT_SECONDS)

    except Exception as e:
        print(f"  [ERROR] Form submission failed: {e}")
        return all_flights

    # Get session ID for AJAX navigation
    try:
        session_id = driver.find_element(By.ID, "VarsSessionID").get_attribute("value")
    except Exception:
        session_id = ""
        print("  [WARN] No session ID — AJAX navigation may fail")

    # Iterate over every date
    for i, day in enumerate(date_range(start, end)):
        day_label = day.strftime("%Y-%m-%d")

        if i == 0:
            html = driver.page_source
        else:
            html = change_day_ajax(driver, session_id, day)
            if html is None:
                # Fallback: reload via form
                try:
                    df = driver.find_element(By.ID, "departuredate")
                    df.clear()
                    df.send_keys(fmt_search_date(day))
                    driver.find_element(
                        By.CSS_SELECTOR, "button.fa-search, button[class*='btn-next']"
                    ).click()
                    time.sleep(WAIT_SECONDS)
                    html = driver.page_source
                except Exception as e:
                    print(f"  [ERROR] {day_label}: {e}")
                    time.sleep(BETWEEN_DAYS_S)
                    continue

        flights = parse_flights_from_html(html, route, day)
        if flights:
            print(f"  {day_label}: {len(flights)} flight(s)")
            for f in flights:
                print(f"    {f['departure_time']} → {f['arrival_time']}"
                      f"  ${f['price_numeric']}  {f['flight_number']}")
            all_flights.extend(flights)
        else:
            print(f"  {day_label}: no flights")

        time.sleep(BETWEEN_DAYS_S)

    return all_flights


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    headless = "--visible" not in sys.argv
    start_date = datetime.today().replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = start_date + timedelta(days=DAYS_TO_SCRAPE)

    print("=" * 60)
    print("  Tradewind Aviation Flight Scraper (VARS Public Calendar)")
    print(f"  Period : {start_date.date()} → {end_date.date()}")
    print(f"  Routes : {len(ROUTES)}")
    print(f"  Mode   : {'headless' if headless else 'visible'}")
    print("=" * 60)

    driver = create_driver(headless=headless)

    try:
        all_flights = []
        for route in ROUTES:
            try:
                flights = scrape_route(driver, route, start_date, end_date)
                all_flights.extend(flights)
            except Exception as e:
                print(f"  [ERROR] {route['from_code']}→{route['to_code']}: {e}")
                import traceback
                traceback.print_exc()

        print(f"\n{'=' * 60}")
        print(f"  Total flights collected: {len(all_flights)}")

        # Save JSON for update_flights.py
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(all_flights, f, indent=2, ensure_ascii=False)
        print(f"  Saved → {OUTPUT_JSON}")

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

    finally:
        driver.quit()


if __name__ == "__main__":
    main()
