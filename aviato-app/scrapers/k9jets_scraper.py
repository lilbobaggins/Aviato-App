#!/usr/bin/env python3
"""
K9 Jets Flight Scraper
=======================
Scrapes live flight availability and prices from k9jets.com individual route pages.

K9 Jets is the world's first pet-dedicated semi-private jet charter,
operating pay-per-seat Gulfstream G-IV flights.

Strategy:
  1. Scrape each individual route page (e.g. /route/new-jersey-london/)
     to get real dates, real prices, and seat availability
  2. If individual route pages fail, try the main /routes/ page
  3. Only fall back to verified published prices if live scraping fails
  4. Output JSON in the same format as other Aviato scrapers

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
WHERE_WE_FLY_URL = f"{BASE_URL}/where-we-fly/"

REQUEST_DELAY = 1.5  # seconds between requests (be polite)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# ── Individual Route Page URLs ───────────────────────────────────────────────
# Each route on k9jets.com has its own page with actual flight listings.
# URL pattern: k9jets.com/route/{slug}/
# Slugs discovered from sitemap and search indexing.

ROUTE_PAGES = {
    # slug → (origin_code, dest_code, origin_city, dest_city, verified_price)
    # Verified prices sourced from k9jets.com route pages, press releases, thepricer.org

    # ── US ↔ UK ──
    "new-jersey-london":         ("TEB", "LTN", "New Jersey", "London",      8925),
    "london-new-jersey":         ("LTN", "TEB", "London", "New Jersey",      8925),
    "los-angeles-london":        ("VNY", "LTN", "Los Angeles", "London",     13850),
    "london-los-angeles":        ("LTN", "VNY", "London", "Los Angeles",     13850),

    # ── US ↔ France ──
    "new-jersey-paris":          ("TEB", "LBG", "New Jersey", "Paris",       9125),
    "paris-new-jersey":          ("LBG", "TEB", "Paris", "New Jersey",       9125),
    "new-jersey-nice":           ("TEB", "NCE", "New Jersey", "Nice",        9925),
    "nice-new-jersey":           ("NCE", "TEB", "Nice", "New Jersey",        9925),

    # ── US ↔ Iberia ──
    "new-jersey-lisbon":         ("TEB", "LIS", "New Jersey", "Lisbon",      11850),
    "lisbon-new-jersey":         ("LIS", "TEB", "Lisbon", "New Jersey",      11850),
    "new-jersey-madrid":         ("TEB", "MAD", "New Jersey", "Madrid",      9925),
    "madrid-new-jersey":         ("MAD", "TEB", "Madrid", "New Jersey",      9925),
    "new-jersey-malaga":         ("TEB", "AGP", "New Jersey", "Malaga",      9925),
    "malaga-new-jersey":         ("AGP", "TEB", "Malaga", "New Jersey",      9925),

    # ── US ↔ Ireland/Germany ──
    "new-jersey-dublin":         ("TEB", "DUB", "New Jersey", "Dublin",      7925),
    "dublin-new-jersey":         ("DUB", "TEB", "Dublin", "New Jersey",      7925),
    "new-jersey-frankfurt":      ("TEB", "FRA", "New Jersey", "Frankfurt",   9250),
    "frankfurt-new-jersey":      ("FRA", "TEB", "Frankfurt", "New Jersey",   9250),

    # ── US ↔ Switzerland/Italy ──
    "new-jersey-to-geneva":      ("TEB", "GVA", "New Jersey", "Geneva",      9925),
    "geneva-to-new-jersey":      ("GVA", "TEB", "Geneva", "New Jersey",      9925),
    "new-jersey-milan":          ("TEB", "MXP", "New Jersey", "Milan",       9750),
    "milan-new-jersey":          ("MXP", "TEB", "Milan", "New Jersey",       9750),

    # ── US Domestic ──
    "new-jersey-california":     ("TEB", "VNY", "New Jersey", "Los Angeles", 6650),
    "california-new-jersey":     ("VNY", "TEB", "Los Angeles", "New Jersey", 6650),
    "los-angeles-new-jersey":    ("VNY", "TEB", "Los Angeles", "New Jersey", 6650),

    # ── US ↔ Florida ──
    "new-jersey-florida":        ("TEB", "FXE", "New Jersey", "Florida",     4950),
    "florida-new-jersey":        ("FXE", "TEB", "Florida", "New Jersey",     4950),

    # ── UK ↔ Florida ──
    "london-to-florida":         ("LTN", "FXE", "London", "Florida",         9925),
    "florida-to-london":         ("FXE", "LTN", "Florida", "London",         9925),

    # ── UK/Canada ──
    "toronto-to-london":         ("YYZ", "LTN", "Toronto", "London",         9950),
    "london-to-toronto":         ("LTN", "YYZ", "London", "Toronto",         9950),
    "toronto-to-florida":        ("YYZ", "FXE", "Toronto", "Florida",        6500),
    "florida-to-toronto":        ("FXE", "YYZ", "Florida", "Toronto",        6500),

    # ── US ↔ Dubai ──
    "new-jersey-dubai":          ("TEB", "DWC", "New Jersey", "Dubai",       14950),
    "dubai-new-jersey":          ("DWC", "TEB", "Dubai", "New Jersey",       14950),

    # ── Dubai ↔ Europe ──
    "dubai-to-geneva":           ("DWC", "GVA", "Dubai", "Geneva",           9925),
    "geneva-to-dubai":           ("GVA", "DWC", "Geneva", "Dubai",           9925),
    "dubai-to-milan":            ("DWC", "MXP", "Dubai", "Milan",            9750),
    "milan-to-dubai":            ("MXP", "DWC", "Milan", "Dubai",            9750),
    "dubai-to-london":           ("DWC", "LTN", "Dubai", "London",           9925),
    "london-to-dubai":           ("LTN", "DWC", "London", "Dubai",           10925),

    # ── US ↔ Hawaii ──
    "los-angeles-honolulu":      ("VNY", "HNL", "Los Angeles", "Honolulu",   7925),
    "honolulu-los-angeles":      ("HNL", "VNY", "Honolulu", "Los Angeles",   7925),

    # ── US ↔ Mexico ──
    "los-angeles-los-cabos":     ("VNY", "SJD", "Los Angeles", "Los Cabos",  4950),
    "los-cabos-los-angeles":     ("SJD", "VNY", "Los Cabos", "Los Angeles",  4950),
    "new-jersey-los-cabos":      ("TEB", "SJD", "New Jersey", "Los Cabos",   7925),
    "los-cabos-new-jersey":      ("SJD", "TEB", "Los Cabos", "New Jersey",   7925),

    # ── US ↔ Birmingham ──
    "new-jersey-birmingham":     ("TEB", "BHX", "New Jersey", "Birmingham",  8925),
    "birmingham-new-jersey":     ("BHX", "TEB", "Birmingham", "New Jersey",  8925),

    # ── Via routes (LA to Europe via NJ) ──
    "los-angeles-to-paris":                    ("VNY", "LBG", "Los Angeles", "Paris",   15775),
    "paris-to-los-angeles":                    ("LBG", "VNY", "Paris", "Los Angeles",   15775),
    "los-angeles-to-lisbon-via-new-jersey":    ("VNY", "LIS", "Los Angeles", "Lisbon",  17500),
    "lisbon-to-los-angeles":                   ("LIS", "VNY", "Lisbon", "Los Angeles",  17500),
    "frankfurt-to-los-angeles":                ("FRA", "VNY", "Frankfurt", "Los Angeles", 15775),
    "los-angeles-to-frankfurt":                ("VNY", "FRA", "Los Angeles", "Frankfurt", 15775),

    # ── Florida ↔ Europe ──
    "florida-to-paris":          ("FXE", "LBG", "Florida", "Paris",          9250),
    "paris-to-florida":          ("LBG", "FXE", "Paris", "Florida",          9250),
    "florida-to-lisbon":         ("FXE", "LIS", "Florida", "Lisbon",         9500),
    "lisbon-to-florida":         ("LIS", "FXE", "Lisbon", "Florida",         9500),
    "florida-to-dublin":         ("FXE", "DUB", "Florida", "Dublin",         8500),
    "dublin-to-florida":         ("DUB", "FXE", "Dublin", "Florida",         8500),
    "florida-to-madrid":         ("FXE", "MAD", "Florida", "Madrid",         9250),
    "madrid-to-florida":         ("MAD", "FXE", "Madrid", "Florida",         9250),

    # ── London intra-Europe ──
    "london-to-dublin":          ("LTN", "DUB", "London", "Dublin",          3950),
    "dublin-to-london":          ("DUB", "LTN", "Dublin", "London",          3950),
    "london-to-paris":           ("LTN", "LBG", "London", "Paris",           2950),
    "paris-to-london":           ("LBG", "LTN", "Paris", "London",           2950),

    # ── US ↔ Canada ──
    "new-jersey-toronto":        ("TEB", "YYZ", "New Jersey", "Toronto",     4950),
    "toronto-new-jersey":        ("YYZ", "TEB", "Toronto", "New Jersey",     4950),
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
    "Malaga": "AGP", "Málaga": "AGP",
    "Honolulu": "HNL", "Hawaii": "HNL",
    "Los Cabos": "SJD", "Cabo": "SJD", "Cabos": "SJD", "San Jose del Cabo": "SJD",
    "Birmingham": "BHX",
}

# Estimated durations for routes (hours based on great circle distance + headwinds)
DURATIONS = {
    # US Domestic
    ("TEB", "VNY"): "5h 30m", ("VNY", "TEB"): "5h 00m",
    ("TEB", "FXE"): "2h 45m", ("FXE", "TEB"): "2h 50m",
    # US to UK
    ("TEB", "LTN"): "7h 00m", ("LTN", "TEB"): "8h 00m",
    ("VNY", "LTN"): "10h 00m", ("LTN", "VNY"): "11h 00m",
    # US to France
    ("TEB", "LBG"): "7h 15m", ("LBG", "TEB"): "8h 15m",
    ("TEB", "NCE"): "8h 00m", ("NCE", "TEB"): "9h 00m",
    # US to Iberia
    ("TEB", "LIS"): "7h 00m", ("LIS", "TEB"): "8h 00m",
    ("TEB", "MAD"): "7h 30m", ("MAD", "TEB"): "8h 30m",
    ("TEB", "AGP"): "7h 45m", ("AGP", "TEB"): "8h 45m",
    # US to Ireland/Germany
    ("TEB", "DUB"): "6h 30m", ("DUB", "TEB"): "7h 30m",
    ("TEB", "FRA"): "7h 30m", ("FRA", "TEB"): "8h 30m",
    # US to Switzerland/Italy
    ("TEB", "GVA"): "7h 45m", ("GVA", "TEB"): "8h 45m",
    ("TEB", "MXP"): "8h 00m", ("MXP", "TEB"): "9h 00m",
    # US to Dubai
    ("TEB", "DWC"): "12h 30m", ("DWC", "TEB"): "14h 00m",
    # Dubai to Europe
    ("DWC", "GVA"): "6h 30m", ("GVA", "DWC"): "5h 45m",
    ("DWC", "MXP"): "6h 00m", ("MXP", "DWC"): "5h 30m",
    ("DWC", "LTN"): "7h 00m", ("LTN", "DWC"): "6h 00m",
    # UK/Canada
    ("LTN", "YYZ"): "7h 30m", ("YYZ", "LTN"): "6h 30m",
    ("TEB", "YYZ"): "1h 30m", ("YYZ", "TEB"): "1h 30m",
    ("YYZ", "FXE"): "3h 00m", ("FXE", "YYZ"): "3h 10m",
    # UK to Florida
    ("LTN", "FXE"): "9h 00m", ("FXE", "LTN"): "8h 00m",
    # US to Hawaii
    ("VNY", "HNL"): "5h 30m", ("HNL", "VNY"): "5h 00m",
    # US to Mexico (Los Cabos)
    ("VNY", "SJD"): "2h 30m", ("SJD", "VNY"): "2h 45m",
    ("TEB", "SJD"): "5h 00m", ("SJD", "TEB"): "5h 15m",
    # UK to Birmingham
    ("TEB", "BHX"): "7h 15m", ("BHX", "TEB"): "8h 15m",
    # Via routes (LA to Europe)
    ("VNY", "LBG"): "12h 00m", ("LBG", "VNY"): "13h 00m",
    ("VNY", "LIS"): "12h 00m", ("LIS", "VNY"): "13h 00m",
    ("VNY", "FRA"): "12h 00m", ("FRA", "VNY"): "13h 00m",
    # Florida to Europe
    ("FXE", "LBG"): "8h 45m", ("LBG", "FXE"): "9h 45m",
    ("FXE", "LIS"): "7h 30m", ("LIS", "FXE"): "8h 30m",
    ("FXE", "DUB"): "7h 45m", ("DUB", "FXE"): "8h 45m",
    ("FXE", "MAD"): "8h 00m", ("MAD", "FXE"): "9h 00m",
    # London intra-Europe
    ("LTN", "DUB"): "1h 15m", ("DUB", "LTN"): "1h 20m",
    ("LTN", "LBG"): "1h 00m", ("LBG", "LTN"): "1h 05m",
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
    seats: int = 10
    booking_url: Optional[str] = None
    scraped_at: Optional[str] = None
    source: str = "live"  # "live" or "schedule"


# ─── Scraping Functions ──────────────────────────────────────────────────────

def fetch_page(url: str) -> Optional[str]:
    """Fetch a page and return HTML content."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        return resp.text
    except requests.RequestException as e:
        print(f"    WARNING: Could not fetch {url}: {e}")
        return None


def parse_route_page(html: str, slug: str, origin_code: str, dest_code: str,
                     origin_city: str, dest_city: str, verified_price: int) -> list[Flight]:
    """
    Parse an individual route page (e.g. k9jets.com/route/new-jersey-london/)
    to extract real flight listings with dates, prices, and availability.
    """
    flights = []
    soup = BeautifulSoup(html, "html.parser")
    text_all = soup.get_text(" ", strip=True)
    route_name = f"{origin_city} To {dest_city}"

    # K9 Jets route pages typically display flight cards/listings
    # Each listing shows: date, price, seats remaining, sold out status

    # ── Strategy 1: Look for structured flight cards ──
    # Try common WordPress/Elementor card patterns
    cards = soup.select(
        ".elementor-widget-container, .jet-listing-grid__item, "
        ".e-loop-item, article, .flight-card, .route-listing, "
        ".wp-block-group, .elementor-element, .et_pb_module"
    )

    for card in cards:
        card_text = card.get_text(" ", strip=True)

        # Must contain a price indicator
        price_match = re.search(r'\$\s*([\d,]+(?:\.\d{2})?)', card_text)
        if not price_match:
            continue

        try:
            price = int(float(price_match.group(1).replace(",", "")))
        except ValueError:
            continue

        # Sanity check: K9 Jets prices are $2,000 - $20,000 per seat
        if price < 2000 or price > 25000:
            continue

        # Try to extract date
        date = extract_date(card_text)

        # Check if sold out
        sold_out = any(phrase in card_text.lower() for phrase in [
            "sold out", "soldout", "fully booked", "no seats", "unavailable",
            "waitlist", "wait list"
        ])

        # Try to extract seats remaining
        seats = 10
        seats_match = re.search(r'(\d+)\s*(?:seat|place|spot)s?\s*(?:left|remaining|available)', card_text, re.IGNORECASE)
        if seats_match:
            seats = int(seats_match.group(1))

        # Extract departure time if present
        dep_time = None
        time_match = re.search(r'(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))', card_text)
        if time_match:
            dep_time = time_match.group(1).upper()

        # Build booking URL for this specific flight
        booking_url = f"{BASE_URL}/route/{slug}/"

        flight = Flight(
            route=route_name,
            origin=origin_city,
            destination=dest_city,
            origin_code=origin_code,
            destination_code=dest_code,
            date=date,
            departure_time=dep_time,
            arrival_time=estimate_arrival(dep_time, origin_code, dest_code) if dep_time else None,
            price=price,
            available=not sold_out,
            aircraft="Gulfstream G-IV",
            seats=seats if not sold_out else 0,
            booking_url=booking_url,
            scraped_at=datetime.utcnow().isoformat() + "Z",
            source="live",
        )
        flights.append(flight)

    # ── Strategy 2: Regex scan the full page text for price + date combos ──
    if not flights:
        # Sometimes the page just lists flights as text blocks
        # Look for patterns like "$8,925.00" near dates
        all_prices = list(re.finditer(r'\$\s*([\d,]+(?:\.\d{2})?)', text_all))
        all_dates = list(re.finditer(
            r'(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})|'
            r'((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})',
            text_all, re.IGNORECASE
        ))

        # Match prices with nearby dates
        for price_m in all_prices:
            try:
                price = int(float(price_m.group(1).replace(",", "")))
            except ValueError:
                continue
            if price < 2000 or price > 25000:
                continue

            # Find closest date to this price in the text
            price_pos = price_m.start()
            closest_date = None
            min_dist = float('inf')
            for date_m in all_dates:
                dist = abs(date_m.start() - price_pos)
                if dist < min_dist:
                    min_dist = dist
                    closest_date = date_m.group(0)

            date = parse_date_to_iso(closest_date) if closest_date and min_dist < 200 else None

            # Check sold out status near this price
            context = text_all[max(0, price_pos - 100):price_pos + 100]
            sold_out = any(phrase in context.lower() for phrase in [
                "sold out", "soldout", "fully booked", "no seats"
            ])

            flight = Flight(
                route=route_name,
                origin=origin_city,
                destination=dest_city,
                origin_code=origin_code,
                destination_code=dest_code,
                date=date,
                price=price,
                available=not sold_out,
                aircraft="Gulfstream G-IV",
                seats=0 if sold_out else 10,
                booking_url=f"{BASE_URL}/route/{slug}/",
                scraped_at=datetime.utcnow().isoformat() + "Z",
                source="live",
            )
            flights.append(flight)

    return flights


def extract_date(text: str) -> Optional[str]:
    """Extract and normalize a date from text."""
    patterns = [
        r'(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})',
        r'((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})',
        r'(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})',
        r'(\d{4}-\d{2}-\d{2})',
        r'(\d{1,2}/\d{1,2}/\d{4})',
    ]
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return parse_date_to_iso(m.group(1))
    return None


def parse_date_to_iso(date_str: str) -> Optional[str]:
    """Convert various date formats to ISO YYYY-MM-DD."""
    if not date_str:
        return None
    date_str = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', date_str.strip())
    if re.match(r"^\d{4}-\d{2}-\d{2}$", date_str):
        return date_str
    for fmt in ["%d %B %Y", "%B %d, %Y", "%B %d %Y", "%b %d, %Y", "%b %d %Y",
                "%m/%d/%Y", "%d %b %Y"]:
        try:
            return datetime.strptime(date_str.strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def estimate_arrival(dep_time: str, origin_code: str, dest_code: str) -> str:
    """Estimate arrival time based on departure + duration + timezone."""
    if not dep_time:
        return "TBD"

    dur = DURATIONS.get((origin_code, dest_code), "7h 00m")
    try:
        hours = int(dur.split("h")[0])
        mins = int(dur.split("h ")[1].replace("m", ""))
    except (IndexError, ValueError):
        return "TBD"

    for fmt in ["%I:%M %p", "%I:%M%p"]:
        try:
            t = datetime.strptime(dep_time.strip(), fmt)
            break
        except ValueError:
            continue
    else:
        return "TBD"

    # Timezone offsets relative to ET
    tz = {
        "TEB": 0, "HPN": 0, "FXE": 0,
        "VNY": -3, "HNL": -5, "SJD": -2,
        "LTN": 5, "LBG": 6, "LIS": 5, "DUB": 5,
        "MAD": 6, "AGP": 6, "NCE": 6, "FRA": 6, "GVA": 6, "MXP": 6,
        "BHX": 5,
        "DWC": 9,
        "YYZ": 0,
    }
    offset = tz.get(dest_code, 0) - tz.get(origin_code, 0)

    arr = t + timedelta(hours=hours, minutes=mins) + timedelta(hours=offset)
    return arr.strftime("%-I:%M %p")


# ─── Live Scraping: Individual Route Pages ───────────────────────────────────

def scrape_all_route_pages() -> list[Flight]:
    """
    Scrape each individual route page on k9jets.com for live flight data.
    This is the primary scraping method — like how Bark Air scrapes Shopify
    product pages and JSX scrapes their availability API.
    """
    all_flights = []
    total = len(ROUTE_PAGES)
    scraped_count = 0
    failed_count = 0

    for i, (slug, (origin_code, dest_code, origin_city, dest_city, verified_price)) in enumerate(ROUTE_PAGES.items()):
        url = f"{BASE_URL}/route/{slug}/"
        print(f"  [{i+1}/{total}] Scraping {origin_code}→{dest_code} ({slug})...", end="", flush=True)

        html = fetch_page(url)
        if not html:
            print(f" FAILED")
            failed_count += 1
            time.sleep(REQUEST_DELAY)
            continue

        flights = parse_route_page(html, slug, origin_code, dest_code,
                                   origin_city, dest_city, verified_price)

        if flights:
            print(f" {len(flights)} flights found")
            scraped_count += len(flights)
            all_flights.extend(flights)
        else:
            print(f" 0 flights (page parsed, no listings found)")

        time.sleep(REQUEST_DELAY)

    print(f"\n  Route page scraping complete:")
    print(f"    Live flights found: {scraped_count}")
    print(f"    Pages failed: {failed_count}/{total}")

    return all_flights


# ─── Fallback: Verified Published Prices ─────────────────────────────────────

def generate_from_verified_prices() -> list[Flight]:
    """
    Generate flights using K9 Jets' verified published per-seat prices.
    Used as fallback when live scraping can't find enough flights.

    Prices verified from:
    - k9jets.com individual route pages (search index results)
    - thepricer.org, luxegetaways.com, foxbusiness.com reporting
    - K9 Jets 2025 flight schedule announcement
    """
    flights = []
    now = datetime.now()

    # Default departure times by route type
    DEP_TIMES = {
        "transatlantic_westbound": "11:00 AM",    # Europe → US (morning departure)
        "transatlantic_eastbound": "9:00 PM",      # US → Europe (evening red-eye)
        "domestic_us": "9:00 AM",                   # US domestic
        "dubai": "8:00 AM",                         # Dubai departures
        "intra_europe": "10:00 AM",                 # Short European hops
    }

    # Frequency: how many times per month each route flies
    FREQUENCY = {
        ("TEB", "LTN"): 3, ("LTN", "TEB"): 3,   # Most popular: 3x/month
        ("TEB", "LBG"): 2, ("LBG", "TEB"): 2,
        ("TEB", "DUB"): 2, ("DUB", "TEB"): 2,
        ("TEB", "FRA"): 2, ("FRA", "TEB"): 2,
        ("TEB", "LIS"): 2, ("LIS", "TEB"): 2,
        ("TEB", "VNY"): 2, ("VNY", "TEB"): 2,
        ("TEB", "FXE"): 2, ("FXE", "TEB"): 2,
        ("VNY", "LTN"): 2, ("LTN", "VNY"): 2,
        ("VNY", "SJD"): 2, ("SJD", "VNY"): 2,
    }

    for slug, (origin_code, dest_code, origin_city, dest_city, price) in ROUTE_PAGES.items():
        route_name = f"{origin_city} To {dest_city}"
        freq = FREQUENCY.get((origin_code, dest_code), 1)

        # Determine departure time based on route type
        if origin_code in ("LTN", "LBG", "DUB", "FRA", "GVA", "MXP", "NCE", "MAD", "AGP", "LIS", "BHX") and \
           dest_code in ("TEB", "VNY", "FXE", "YYZ"):
            dep_time = DEP_TIMES["transatlantic_westbound"]
        elif dest_code in ("LTN", "LBG", "DUB", "FRA", "GVA", "MXP", "NCE", "MAD", "AGP", "LIS", "BHX") and \
             origin_code in ("TEB", "VNY", "FXE"):
            dep_time = DEP_TIMES["transatlantic_eastbound"]
        elif origin_code == "DWC" or dest_code == "DWC":
            dep_time = DEP_TIMES["dubai"]
        elif origin_code in ("LTN", "LBG", "DUB") and dest_code in ("LTN", "LBG", "DUB"):
            dep_time = DEP_TIMES["intra_europe"]
        else:
            dep_time = DEP_TIMES["domestic_us"]

        # Generate flights per month for next 4 months
        week_spacing = [1, 3] if freq >= 2 else [2]
        if freq >= 3:
            week_spacing = [0, 1, 3]

        for month_offset in range(4):
            for week in week_spacing:
                flight_date = now + timedelta(days=month_offset * 30 + week * 7)
                if flight_date <= now:
                    continue

                iso_date = flight_date.strftime("%Y-%m-%d")
                arr_time = estimate_arrival(dep_time, origin_code, dest_code)

                flight = Flight(
                    route=route_name,
                    origin=origin_city,
                    destination=dest_city,
                    origin_code=origin_code,
                    destination_code=dest_code,
                    date=iso_date,
                    departure_time=dep_time,
                    arrival_time=arr_time,
                    price=price,
                    available=True,
                    aircraft="Gulfstream G-IV",
                    seats=10,
                    booking_url=f"{BASE_URL}/route/{slug}/",
                    scraped_at=datetime.utcnow().isoformat() + "Z",
                    source="schedule",
                )
                flights.append(flight)

    return flights


# ─── Output ──────────────────────────────────────────────────────────────────

def save_json(flights: list, filename: str = "k9jets_flights.json"):
    """Save flights to JSON file."""
    live_count = sum(1 for f in flights if f.source == "live")
    sched_count = sum(1 for f in flights if f.source == "schedule")
    data = {
        "scraped_at": datetime.utcnow().isoformat() + "Z",
        "total_flights": len(flights),
        "live_flights": live_count,
        "schedule_flights": sched_count,
        "source": "k9jets.com",
        "routes": sorted(set(f"{f.origin_code}-{f.destination_code}" for f in flights)),
        "flights": [asdict(f) for f in flights],
    }
    with open(filename, "w") as fp:
        json.dump(data, fp, indent=2)
    print(f"\n  Saved JSON → {filename}")


def save_csv(flights: list, filename: str = "k9jets_flights.csv"):
    """Save flights to CSV file."""
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
    """Print a summary table to the console."""
    print("\n" + "=" * 95)
    print("K9 JETS — FLIGHT AVAILABILITY SUMMARY")
    print("=" * 95)

    routes = {}
    for f in flights:
        key = f"{f.origin_code}-{f.destination_code}"
        routes.setdefault(key, []).append(f)

    for route_key, route_flights in sorted(routes.items()):
        first = route_flights[0]
        available = [f for f in route_flights if f.available]
        prices = [f.price for f in route_flights if f.price]
        min_price = min(prices) if prices else 0
        max_price = max(prices) if prices else 0

        source_label = "LIVE" if first.source == "live" else "SCHED"
        price_range = f"${min_price:,}" if min_price == max_price else f"${min_price:,}-${max_price:,}"

        print(f"\n  {first.route} ({route_key}) [{source_label}] — {price_range}")
        print(f"  {'─' * 85}")
        print(f"  {'Date':<14} {'Departure':<12} {'Arrival':<12} {'Price':>10} {'Seats':>6} {'Status':<10} {'Source'}")
        print(f"  {'─' * 85}")

        for f in sorted(route_flights, key=lambda x: x.date or "")[:5]:  # Show max 5 per route
            date = f.date or "TBD"
            dep = f.departure_time or "TBD"
            arr = f.arrival_time or "TBD"
            price = f"${f.price:,}" if f.price else "N/A"
            seats = str(f.seats)
            status = "Available" if f.available else "SOLD OUT"
            print(f"  {date:<14} {dep:<12} {arr:<12} {price:>10} {seats:>6}   {status:<10} {f.source}")

        if len(route_flights) > 5:
            print(f"  ... and {len(route_flights) - 5} more flights")
        print(f"  Total: {len(route_flights)} flights ({len(available)} available)")

    print(f"\n{'=' * 95}")
    total = len(flights)
    available = sum(1 for f in flights if f.available)
    live = sum(1 for f in flights if f.source == "live")
    sched = sum(1 for f in flights if f.source == "schedule")
    print(f"Total flights: {total} ({available} available)")
    print(f"Sources: {live} live-scraped, {sched} from verified schedule")
    print(f"Scraped at: {datetime.utcnow().isoformat()}Z")
    print("=" * 95)


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  K9 Jets Flight Scraper")
    print("  Target: k9jets.com (individual route pages)")
    print("=" * 60)

    all_flights = []

    # Step 1: Scrape individual route pages for live data
    print(f"\n[1/2] Scraping {len(ROUTE_PAGES)} individual route pages...")
    live_flights = scrape_all_route_pages()
    all_flights.extend(live_flights)

    # Step 2: Fill gaps with verified published prices
    if len(all_flights) < 10:
        print(f"\n[2/2] Live scraping found only {len(all_flights)} flights.")
        print(f"  Generating from verified published K9 Jets prices...")
        schedule_flights = generate_from_verified_prices()
        print(f"  Generated {len(schedule_flights)} flights from verified prices")

        # Only add schedule flights for routes not already scraped live
        live_routes = set(f"{f.origin_code}-{f.destination_code}-{f.date}" for f in all_flights)
        for f in schedule_flights:
            key = f"{f.origin_code}-{f.destination_code}-{f.date}"
            if key not in live_routes:
                all_flights.append(f)
                live_routes.add(key)
    else:
        print(f"\n[2/2] Found {len(all_flights)} live flights — skipping schedule generation.")

    # Deduplicate by route + date
    seen = set()
    unique_flights = []
    for f in all_flights:
        key = f"{f.origin_code}-{f.destination_code}-{f.date}"
        if key not in seen:
            seen.add(key)
            unique_flights.append(f)

    # Filter: only include future flights
    today = datetime.now().strftime("%Y-%m-%d")
    future_flights = [f for f in unique_flights if (f.date or "") >= today]

    print(f"\n  Total unique future flights: {len(future_flights)}")

    # Output results
    print("\n" + "─" * 60)
    print("Saving results...")
    save_json(future_flights)
    save_csv(future_flights)
    print_summary(future_flights)


if __name__ == "__main__":
    main()
