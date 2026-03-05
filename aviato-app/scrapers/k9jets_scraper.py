#!/usr/bin/env python3
"""
K9 Jets Flight Scraper
=======================
Scrapes REAL flight listings from k9jets.com.

K9 Jets publishes individual flight pages at k9jets.com/flight/{date-slug}/
and route listing pages at k9jets.com/route/{route-slug}/.

Unlike JSX/Aero which have API endpoints, K9 Jets uses a WordPress site
with individual pages per flight. This scraper:
  1. Fetches the main /routes/ page to discover linked flights
  2. Fetches each known route page (e.g. /route/new-jersey-london/)
  3. Fetches discovered individual flight pages (e.g. /flight/april-1-2026-2/)
  4. Extracts real dates, prices, routes, and availability
  5. Outputs ONLY verified flights — never generates fake dates

Usage:
  pip install requests beautifulsoup4
  python k9jets_scraper.py
"""
import requests
import json
import csv
import time
import re
import sys
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from typing import Optional
from dataclasses import dataclass, asdict

# ─── Configuration ───────────────────────────────────────────────────────────

BASE_URL = "https://www.k9jets.com"
ROUTES_URL = f"{BASE_URL}/routes/"

REQUEST_DELAY = 1.5
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# ── Known Route Page Slugs ───────────────────────────────────────────────────
# Each route on k9jets.com has a page that lists upcoming flights for that route.
# These are the confirmed slugs from their sitemap/search indexing.

ROUTE_SLUGS = {
    # slug → (origin_code, dest_code, origin_city, dest_city)
    "new-jersey-london":       ("TEB", "LTN", "New Jersey", "London"),
    "london-new-jersey":       ("LTN", "TEB", "London", "New Jersey"),
    "los-angeles-london":      ("VNY", "LTN", "Los Angeles", "London"),
    "london-los-angeles":      ("LTN", "VNY", "London", "Los Angeles"),
    "new-jersey-paris":        ("TEB", "LBG", "New Jersey", "Paris"),
    "paris-new-jersey":        ("LBG", "TEB", "Paris", "New Jersey"),
    "new-jersey-lisbon":       ("TEB", "LIS", "New Jersey", "Lisbon"),
    "lisbon-new-jersey":       ("LIS", "TEB", "Lisbon", "New Jersey"),
    "new-jersey-dublin":       ("TEB", "DUB", "New Jersey", "Dublin"),
    "dublin-new-jersey":       ("DUB", "TEB", "Dublin", "New Jersey"),
    "new-jersey-california":   ("TEB", "VNY", "New Jersey", "Los Angeles"),
    "los-angeles-new-jersey":  ("VNY", "TEB", "Los Angeles", "New Jersey"),
    "new-jersey-florida":      ("TEB", "FXE", "New Jersey", "Florida"),
    "florida-new-jersey":      ("FXE", "TEB", "Florida", "New Jersey"),
    "london-to-florida":       ("LTN", "FXE", "London", "Florida"),
    "florida-to-london":       ("FXE", "LTN", "Florida", "London"),
    "london-dubai":            ("LTN", "DWC", "London", "Dubai"),
    "dubai-london":            ("DWC", "LTN", "Dubai", "London"),
    "new-jersey-to-geneva":    ("TEB", "GVA", "New Jersey", "Geneva"),
    "geneva-to-new-jersey":    ("GVA", "TEB", "Geneva", "New Jersey"),
    "toronto-to-london":       ("YYZ", "LTN", "Toronto", "London"),
    "london-to-toronto":       ("LTN", "YYZ", "London", "Toronto"),
    "toronto-to-florida":      ("YYZ", "FXE", "Toronto", "Florida"),
    "florida-to-toronto":      ("FXE", "YYZ", "Florida", "Toronto"),
    "new-jersey-frankfurt":    ("TEB", "FRA", "New Jersey", "Frankfurt"),
    "frankfurt-new-jersey":    ("FRA", "TEB", "Frankfurt", "New Jersey"),
    "new-jersey-milan":        ("TEB", "MXP", "New Jersey", "Milan"),
    "milan-new-jersey":        ("MXP", "TEB", "Milan", "New Jersey"),
    "dubai-to-geneva":         ("DWC", "GVA", "Dubai", "Geneva"),
    "geneva-to-dubai":         ("GVA", "DWC", "Geneva", "Dubai"),
    "dubai-to-milan":          ("DWC", "MXP", "Dubai", "Milan"),
    "milan-to-dubai":          ("MXP", "DWC", "Milan", "Dubai"),
    "los-angeles-to-paris":    ("VNY", "LBG", "Los Angeles", "Paris"),
    "paris-to-los-angeles":    ("LBG", "VNY", "Paris", "Los Angeles"),
    "frankfurt-to-los-angeles": ("FRA", "VNY", "Frankfurt", "Los Angeles"),
    "los-angeles-to-lisbon-via-new-jersey": ("VNY", "LIS", "Los Angeles", "Lisbon"),
    "new-jersey-birmingham":   ("TEB", "BHX", "New Jersey", "Birmingham"),
    "birmingham-new-jersey":   ("BHX", "TEB", "Birmingham", "New Jersey"),
}

# Verified per-seat prices from k9jets.com route pages (USD, one-way)
VERIFIED_PRICES = {
    ("TEB", "LTN"): 8925, ("LTN", "TEB"): 8925,
    ("VNY", "LTN"): 13850, ("LTN", "VNY"): 13850,
    ("TEB", "LBG"): 9125, ("LBG", "TEB"): 9125,
    ("TEB", "LIS"): 11850, ("LIS", "TEB"): 11850,
    ("TEB", "DUB"): 7925, ("DUB", "TEB"): 7925,
    ("TEB", "VNY"): 6650, ("VNY", "TEB"): 6650,
    ("TEB", "FXE"): 4950, ("FXE", "TEB"): 4950,
    ("LTN", "FXE"): 11495, ("FXE", "LTN"): 11495,
    ("LTN", "DWC"): 10925, ("DWC", "LTN"): 10925,
    ("TEB", "GVA"): 9925, ("GVA", "TEB"): 9925,
    ("TEB", "FRA"): 9250, ("FRA", "TEB"): 9250,
    ("TEB", "MXP"): 9750, ("MXP", "TEB"): 9750,
    ("YYZ", "LTN"): 9950, ("LTN", "YYZ"): 9950,
    ("TEB", "BHX"): 8925, ("BHX", "TEB"): 8925,
    ("DWC", "GVA"): 9925, ("GVA", "DWC"): 9925,
    ("DWC", "MXP"): 9750, ("MXP", "DWC"): 9750,
    ("VNY", "LBG"): 15775, ("LBG", "VNY"): 15775,
    ("FRA", "VNY"): 15775, ("VNY", "FRA"): 15775,
    ("FRA", "DWC"): 10925, ("DWC", "FRA"): 10925,
    ("YYZ", "FXE"): 6500, ("FXE", "YYZ"): 6500,
    ("TEB", "DWC"): 14950, ("DWC", "TEB"): 14950,
    ("VNY", "LIS"): 17500, ("LIS", "VNY"): 17500,
}

DURATIONS = {
    ("TEB", "LTN"): "7h 00m", ("LTN", "TEB"): "8h 00m",
    ("VNY", "LTN"): "10h 00m", ("LTN", "VNY"): "11h 00m",
    ("TEB", "LBG"): "7h 15m", ("LBG", "TEB"): "8h 15m",
    ("TEB", "LIS"): "7h 00m", ("LIS", "TEB"): "8h 00m",
    ("TEB", "DUB"): "6h 30m", ("DUB", "TEB"): "7h 30m",
    ("TEB", "VNY"): "5h 30m", ("VNY", "TEB"): "5h 00m",
    ("TEB", "FXE"): "2h 45m", ("FXE", "TEB"): "2h 50m",
    ("LTN", "FXE"): "9h 00m", ("FXE", "LTN"): "8h 00m",
    ("LTN", "DWC"): "7h 00m", ("DWC", "LTN"): "6h 00m",
    ("TEB", "GVA"): "7h 45m", ("GVA", "TEB"): "8h 45m",
    ("TEB", "FRA"): "7h 30m", ("FRA", "TEB"): "8h 30m",
    ("TEB", "MXP"): "8h 00m", ("MXP", "TEB"): "9h 00m",
    ("YYZ", "LTN"): "7h 30m", ("LTN", "YYZ"): "6h 30m",
    ("TEB", "BHX"): "7h 15m", ("BHX", "TEB"): "8h 15m",
    ("DWC", "GVA"): "6h 30m", ("GVA", "DWC"): "5h 45m",
    ("DWC", "MXP"): "6h 00m", ("MXP", "DWC"): "5h 30m",
    ("VNY", "LBG"): "12h 00m", ("LBG", "VNY"): "13h 00m",
    ("FRA", "VNY"): "13h 00m", ("VNY", "FRA"): "12h 00m",
    ("FRA", "DWC"): "6h 30m", ("DWC", "FRA"): "7h 00m",
    ("YYZ", "FXE"): "3h 00m", ("FXE", "YYZ"): "3h 10m",
    ("TEB", "DWC"): "12h 30m", ("DWC", "TEB"): "14h 00m",
    ("VNY", "LIS"): "12h 00m", ("LIS", "VNY"): "13h 00m",
    ("TEB", "YYZ"): "1h 30m", ("YYZ", "TEB"): "1h 30m",
}

AIRPORT_CODES = {
    "New Jersey": "TEB", "Teterboro": "TEB", "New York": "TEB",
    "London": "LTN", "Luton": "LTN",
    "Paris": "LBG", "Le Bourget": "LBG",
    "Lisbon": "LIS",
    "Los Angeles": "VNY", "Van Nuys": "VNY", "LA": "VNY", "California": "VNY",
    "Dubai": "DWC", "Al Maktoum": "DWC",
    "Dublin": "DUB",
    "Frankfurt": "FRA",
    "Geneva": "GVA",
    "Milan": "MXP", "Malpensa": "MXP",
    "Toronto": "YYZ",
    "Florida": "FXE", "Fort Lauderdale": "FXE", "Miami": "FXE",
    "Nice": "NCE",
    "Madrid": "MAD",
    "Birmingham": "BHX",
    "Vancouver": "YVR",
    "Honolulu": "HNL", "Hawaii": "HNL",
}


# ─── Data Model ──────────────────────────────────────────────────────────────

@dataclass
class Flight:
    route: str
    origin: str
    destination: str
    origin_code: str
    destination_code: str
    date: Optional[str] = None
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    price: Optional[int] = None
    available: bool = True
    aircraft: str = "Gulfstream G-IV"
    seats: int = 9
    booking_url: Optional[str] = None
    scraped_at: Optional[str] = None


# ─── Scraping Functions ──────────────────────────────────────────────────────

def fetch_page(url: str) -> Optional[str]:
    """Fetch a page and return HTML content."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        return resp.text
    except requests.RequestException as e:
        print(f"    WARN: Could not fetch {url}: {e}")
        return None


def discover_flight_urls(html: str) -> set[str]:
    """Find all links to individual flight pages in an HTML page."""
    soup = BeautifulSoup(html, "html.parser")
    urls = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        # Match /flight/some-date-slug/ pattern
        if "/flight/" in href and href != "/flight/":
            if href.startswith("/"):
                urls.add(BASE_URL + href)
            elif href.startswith("http"):
                urls.add(href)
    return urls


def parse_flight_page(html: str, url: str) -> list[Flight]:
    """
    Parse an individual flight page (e.g. k9jets.com/flight/april-1-2026-2/).
    These pages show multi-leg journeys with dates, times, prices, and routes.
    """
    flights = []
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ", strip=True)

    # Extract all legs from this flight page
    # K9 Jets flight pages often show multiple legs (e.g. NJ→London→Dubai)

    # Find all price entries on the page
    prices = list(re.finditer(r'\$\s*([\d,]+(?:\.\d{2})?)', text))

    # Find all dates
    dates = list(re.finditer(
        r'((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})|'
        r'(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})',
        text, re.IGNORECASE
    ))

    # Find city/airport pairs
    # K9 Jets shows legs as "City1, Country → City2, Country"
    legs = list(re.finditer(
        r'(\w[\w\s]*?)(?:,\s*\w[\w\s]*)?\s*'
        r'(?:to|→|➜|->|►)\s*'
        r'(\w[\w\s]*?)(?:,\s*\w[\w\s]*)?(?:\s|$)',
        text, re.IGNORECASE
    ))

    # Find departure/arrival times
    times = list(re.finditer(r'(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM))', text))

    # Find "sold out" or availability indicators
    sold_out_global = any(p in text.lower() for p in ["sold out", "soldout", "fully booked"])

    # Extract structured flight data
    # Strategy: look for price + city pair combinations
    for price_m in prices:
        try:
            price = int(float(price_m.group(1).replace(",", "")))
        except ValueError:
            continue

        if price < 2000 or price > 25000:
            continue

        # Find the closest city names to this price
        price_pos = price_m.start()
        context = text[max(0, price_pos - 300):price_pos + 300]

        # Try to identify origin/destination from context
        origin_code = None
        dest_code = None
        origin_city = None
        dest_city = None

        for city, code in AIRPORT_CODES.items():
            if city.lower() in context.lower():
                if origin_code is None:
                    origin_code = code
                    origin_city = city
                elif dest_code is None and code != origin_code:
                    dest_code = code
                    dest_city = city

        if not origin_code or not dest_code:
            continue

        # Find closest date
        closest_date = None
        min_dist = float('inf')
        for date_m in dates:
            dist = abs(date_m.start() - price_pos)
            if dist < min_dist:
                min_dist = dist
                closest_date = date_m.group(0)

        iso_date = parse_date_to_iso(closest_date) if closest_date else None

        # Skip past dates
        if iso_date and iso_date < datetime.now().strftime("%Y-%m-%d"):
            continue

        # Check sold out near this price
        local_context = text[max(0, price_pos - 100):price_pos + 100].lower()
        sold_out = any(p in local_context for p in ["sold out", "soldout", "fully booked", "waitlist"])

        # Find departure time
        dep_time = None
        for tm in times:
            if abs(tm.start() - price_pos) < 200:
                dep_time = tm.group(1).upper()
                break

        route_name = f"{origin_city} To {dest_city}"
        dur = DURATIONS.get((origin_code, dest_code), "")

        flight = Flight(
            route=route_name,
            origin=origin_city,
            destination=dest_city,
            origin_code=origin_code,
            destination_code=dest_code,
            date=iso_date,
            departure_time=dep_time,
            price=price,
            available=not sold_out,
            aircraft="Gulfstream G-IV",
            seats=0 if sold_out else 9,
            booking_url=url,
            scraped_at=datetime.utcnow().isoformat() + "Z",
        )
        flights.append(flight)

    return flights


def parse_route_page(html: str, slug: str, origin_code: str, dest_code: str,
                     origin_city: str, dest_city: str) -> list[Flight]:
    """Parse a route page for flight listings with prices and dates."""
    flights = []
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ", strip=True)
    route_name = f"{origin_city} To {dest_city}"
    verified_price = VERIFIED_PRICES.get((origin_code, dest_code))

    # Find all prices
    prices = list(re.finditer(r'\$\s*([\d,]+(?:\.\d{2})?)', text))

    # Find all dates
    dates = list(re.finditer(
        r'((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})|'
        r'(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})',
        text, re.IGNORECASE
    ))

    today = datetime.now().strftime("%Y-%m-%d")

    for price_m in prices:
        try:
            price = int(float(price_m.group(1).replace(",", "")))
        except ValueError:
            continue
        if price < 2000 or price > 25000:
            continue

        price_pos = price_m.start()

        # Find closest date
        closest_date = None
        min_dist = float('inf')
        for date_m in dates:
            dist = abs(date_m.start() - price_pos)
            if dist < min_dist and dist < 300:
                min_dist = dist
                closest_date = date_m.group(0)

        iso_date = parse_date_to_iso(closest_date) if closest_date else None
        if iso_date and iso_date < today:
            continue

        # Check sold out near price
        ctx = text[max(0, price_pos - 100):price_pos + 100].lower()
        sold_out = any(p in ctx for p in ["sold out", "soldout", "fully booked", "waitlist"])

        # Departure time
        dep_time = None
        time_m = re.search(r'(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM))',
                           text[max(0, price_pos - 150):price_pos + 150])
        if time_m:
            dep_time = time_m.group(1).upper()

        flight = Flight(
            route=route_name,
            origin=origin_city,
            destination=dest_city,
            origin_code=origin_code,
            destination_code=dest_code,
            date=iso_date,
            departure_time=dep_time,
            price=price,
            available=not sold_out,
            aircraft="Gulfstream G-IV",
            seats=0 if sold_out else 9,
            booking_url=f"{BASE_URL}/route/{slug}/",
            scraped_at=datetime.utcnow().isoformat() + "Z",
        )
        flights.append(flight)

    return flights


def parse_date_to_iso(date_str: str) -> Optional[str]:
    """Convert date string to ISO YYYY-MM-DD."""
    if not date_str:
        return None
    date_str = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', date_str.strip())
    if re.match(r"^\d{4}-\d{2}-\d{2}$", date_str):
        return date_str
    for fmt in ["%B %d, %Y", "%B %d %Y", "%d %B %Y", "%b %d, %Y", "%b %d %Y",
                "%d %b %Y", "%m/%d/%Y"]:
        try:
            return datetime.strptime(date_str.strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


# ─── Main Scraping Logic ─────────────────────────────────────────────────────

def scrape_live() -> list[Flight]:
    """
    Scrape real K9 Jets flights from their website.

    Step 1: Fetch /routes/ page and discover individual flight page URLs
    Step 2: Fetch each route page for flight listings
    Step 3: Fetch each discovered flight page for detailed data
    """
    all_flights = []
    flight_urls = set()

    # Step 1: Main routes page — discover flight page links
    print("\n  [1/3] Fetching main routes page...")
    html = fetch_page(ROUTES_URL)
    if html:
        urls = discover_flight_urls(html)
        flight_urls.update(urls)
        print(f"    Found {len(urls)} flight page links")
    else:
        print("    Could not fetch routes page")

    # Step 2: Scrape each route page
    print(f"\n  [2/3] Scraping {len(ROUTE_SLUGS)} route pages...")
    for slug, (oc, dc, ocity, dcity) in ROUTE_SLUGS.items():
        url = f"{BASE_URL}/route/{slug}/"
        print(f"    {oc}→{dc} ({slug})...", end="", flush=True)

        rhtml = fetch_page(url)
        if not rhtml:
            print(" FAILED")
            time.sleep(REQUEST_DELAY)
            continue

        # Also discover flight page links from route pages
        new_urls = discover_flight_urls(rhtml)
        flight_urls.update(new_urls)

        flights = parse_route_page(rhtml, slug, oc, dc, ocity, dcity)
        if flights:
            print(f" {len(flights)} flights")
            all_flights.extend(flights)
        else:
            print(f" 0 flights")

        time.sleep(REQUEST_DELAY)

    # Step 3: Scrape individual flight pages
    print(f"\n  [3/3] Scraping {len(flight_urls)} individual flight pages...")
    for furl in sorted(flight_urls):
        print(f"    {furl.split('/')[-2]}...", end="", flush=True)

        fhtml = fetch_page(furl)
        if not fhtml:
            print(" FAILED")
            time.sleep(REQUEST_DELAY)
            continue

        flights = parse_flight_page(fhtml, furl)
        if flights:
            print(f" {len(flights)} legs")
            all_flights.extend(flights)
        else:
            print(f" 0")

        time.sleep(REQUEST_DELAY)

    return all_flights


# ─── Output ──────────────────────────────────────────────────────────────────

def save_json(flights: list, filename: str = "k9jets_flights.json"):
    data = {
        "scraped_at": datetime.utcnow().isoformat() + "Z",
        "total_flights": len(flights),
        "source": "k9jets.com",
        "routes": sorted(set(f"{f.origin_code}-{f.destination_code}" for f in flights)),
        "flights": [asdict(f) for f in flights],
    }
    with open(filename, "w") as fp:
        json.dump(data, fp, indent=2)
    print(f"\n  Saved JSON → {filename}")


def save_csv(flights: list, filename: str = "k9jets_flights.csv"):
    if not flights:
        return
    fieldnames = list(asdict(flights[0]).keys())
    with open(filename, "w", newline="") as fp:
        writer = csv.DictWriter(fp, fieldnames=fieldnames)
        writer.writeheader()
        for f in flights:
            writer.writerow(asdict(f))
    print(f"  Saved CSV  → {filename}")


def print_summary(flights: list):
    print("\n" + "=" * 90)
    print("K9 JETS — SCRAPED FLIGHT DATA")
    print("=" * 90)

    routes = {}
    for f in flights:
        key = f"{f.origin_code}-{f.destination_code}"
        routes.setdefault(key, []).append(f)

    for rk, rflights in sorted(routes.items()):
        first = rflights[0]
        prices = [f.price for f in rflights if f.price]
        price_str = f"${min(prices):,}" if prices else "N/A"
        avail = sum(1 for f in rflights if f.available)

        print(f"\n  {first.route} ({rk}) — {price_str}")
        for f in sorted(rflights, key=lambda x: x.date or ""):
            status = "Available" if f.available else "SOLD OUT"
            date = f.date or "TBD"
            dep = f.departure_time or ""
            price = f"${f.price:,}" if f.price else "N/A"
            print(f"    {date}  {dep:<10} {price:>10}  {status}")
        print(f"  ({avail}/{len(rflights)} available)")

    print(f"\n{'=' * 90}")
    print(f"Total: {len(flights)} flights, {sum(1 for f in flights if f.available)} available")
    print(f"Scraped at: {datetime.utcnow().isoformat()}Z")
    print("=" * 90)


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  K9 Jets Flight Scraper")
    print("  Scraping LIVE data from k9jets.com")
    print("=" * 60)

    flights = scrape_live()

    # Deduplicate by route + date + price
    seen = set()
    unique = []
    for f in flights:
        key = f"{f.origin_code}-{f.destination_code}-{f.date}-{f.price}"
        if key not in seen:
            seen.add(key)
            unique.append(f)

    # Only keep future flights
    today = datetime.now().strftime("%Y-%m-%d")
    future = [f for f in unique if not f.date or f.date >= today]

    if not future:
        print("\n  WARNING: No flights found from live scraping.")
        print("  This may be because k9jets.com is not accessible from this environment.")
        print("  The scraper will produce an empty result — no fake data will be generated.")

    print(f"\n  Total unique future flights: {len(future)}")

    save_json(future)
    save_csv(future)
    if future:
        print_summary(future)


if __name__ == "__main__":
    main()
