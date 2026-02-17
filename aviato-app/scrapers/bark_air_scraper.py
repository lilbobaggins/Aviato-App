#!/usr/bin/env python3
"""
BARK Air Flight Scraper
=======================
Scrapes flight availability from air.bark.co (Shopify-based store).
Outputs both CSV and a TypeScript snippet that can be merged into Aviato's flights.ts.

Target Routes:
  - New York (HPN) ↔ Fort Lauderdale (FXE)
  - New York (HPN) ↔ Los Angeles (VNY)
  - New York (HPN) ↔ San Francisco (SJC)
  - Los Angeles (VNY) ↔ Kona, Hawaii (KOA)

Usage:
  pip install requests beautifulsoup4
  python bark_air_scraper.py
"""
import requests
import json
import csv
import time
import re
import sys
from datetime import datetime
from bs4 import BeautifulSoup
from typing import Optional
from dataclasses import dataclass, asdict

# ─── Configuration ───────────────────────────────────────────────────────────

BASE_URL = "https://air.bark.co"
COLLECTION_API = f"{BASE_URL}/collections/bookings/products.json"
PRODUCTS_PER_PAGE = 250
REQUEST_DELAY = 0.5  # seconds between requests to be polite

# Route names as they appear in the Shopify product data
TARGET_ROUTES = [
    "New York To Fort Lauderdale",
    "Fort Lauderdale To New York",
    "New York To Los Angeles",
    "Los Angeles To New York",
    "New York To San Francisco",
    "San Francisco To New York",
    "Los Angeles To Kailua-Kona",
    "Kailua-Kona To Los Angeles",
]

AIRPORT_CODES = {
    "New York": "HPN",
    "Los Angeles": "VNY",
    "San Francisco": "SJC",
    "Fort Lauderdale": "FXE",
    "Kailua-Kona": "KOA",
}

HEADERS = {
    "User-Agent": "BarkAirFlightScraper/1.0",
    "Accept": "application/json",
}

# ─── Data Model ──────────────────────────────────────────────────────────────

@dataclass
class Flight:
    product_id: int
    variant_id: int
    handle: str
    title: str
    route: str
    origin: str
    destination: str
    origin_code: str
    destination_code: str
    month: str
    price: str
    available: bool
    date: Optional[str] = None
    takeoff: Optional[str] = None
    aircraft: Optional[str] = None
    tickets_remaining: Optional[int] = None
    product_url: Optional[str] = None
    scraped_at: Optional[str] = None


# ─── Step 1: Fetch all flights from the Shopify Collection JSON API ──────────

def fetch_all_products() -> list:
    """
    Fetches ALL flight products from the Shopify collection API.
    Paginates through all pages (250 products per page).
    """
    all_products = []
    page = 1

    while True:
        url = f"{COLLECTION_API}?limit={PRODUCTS_PER_PAGE}&page={page}"
        print(f"  Fetching page {page}... ", end="", flush=True)

        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            data = resp.json()
        except requests.RequestException as e:
            print(f"ERROR: {e}")
            break

        products = data.get("products", [])
        if not products:
            print("no more products.")
            break

        all_products.extend(products)
        print(f"got {len(products)} products (total: {len(all_products)})")

        page += 1
        time.sleep(REQUEST_DELAY)

    return all_products


# ─── Step 2: Filter for target routes ────────────────────────────────────────

def filter_target_flights(products: list) -> list:
    """
    Filters products to only include our target routes.
    Extracts basic flight info from the Shopify product JSON.
    """
    flights = []

    for product in products:
        options = {opt["name"]: opt["values"] for opt in product.get("options", [])}
        location_values = options.get("Location", [])
        month_values = options.get("Month", [])

        if not location_values:
            continue

        route = location_values[0]
        if route not in TARGET_ROUTES:
            continue

        # Parse origin and destination from route string
        parts = route.split(" To ")
        if len(parts) != 2:
            continue

        origin, destination = parts
        variant = product["variants"][0] if product.get("variants") else {}

        flight = Flight(
            product_id=product["id"],
            variant_id=variant.get("id", 0),
            handle=product["handle"],
            title=product["title"],
            route=route,
            origin=origin,
            destination=destination,
            origin_code=AIRPORT_CODES.get(origin, "???"),
            destination_code=AIRPORT_CODES.get(destination, "???"),
            month=month_values[0] if month_values else "Unknown",
            price=variant.get("price", "0.00"),
            available=variant.get("available", False),
            product_url=f"{BASE_URL}/products/{product['handle']}",
        )
        flights.append(flight)

    return flights


# ─── Step 3: Scrape detailed flight info from product pages ──────────────────

def scrape_flight_details(flight: Flight) -> Flight:
    """
    Scrapes the individual product page to get detailed flight info:
    - Exact date
    - Takeoff time
    - Aircraft type
    - Tickets remaining
    """
    url = f"{BASE_URL}/products/{flight.handle}"

    try:
        resp = requests.get(url, headers={**HEADERS, "Accept": "text/html"}, timeout=30)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"    WARNING: Could not fetch {flight.handle}: {e}")
        return flight

    soup = BeautifulSoup(resp.text, "html.parser")

    # Extract flight detail rows from the ticket summary
    detail_rows = soup.select(".ticket-summary-listrow")
    for row in detail_rows:
        title_el = row.select_one(".ticket-summary-title")
        value_el = row.select_one(".ticket-summary-details")
        if not title_el or not value_el:
            continue

        key = title_el.get_text(strip=True)
        value = value_el.get_text(strip=True)

        if key == "Date":
            flight.date = value
        elif key == "Takeoff":
            flight.takeoff = value
        elif key == "Aircraft":
            flight.aircraft = value

    # Extract tickets remaining — look for "X tickets" or "X left" pattern
    tickets_col = soup.select_one(".row-right-col")
    if tickets_col:
        text = tickets_col.get_text()
        match = re.search(r"(\d+)\s*(?:tickets?|left|remaining|seats?)", text, re.IGNORECASE)
        if match:
            flight.tickets_remaining = int(match.group(1))
        else:
            # Fallback: look for standalone number if "tickets" text is nearby
            match = re.search(r"(\d+)", text)
            if match:
                flight.tickets_remaining = int(match.group(1))

    flight.scraped_at = datetime.utcnow().isoformat() + "Z"
    return flight


# ─── Output ──────────────────────────────────────────────────────────────────

def save_json(flights: list, filename: str = "bark_air_flights.json"):
    """Save flights to JSON file."""
    data = {
        "scraped_at": datetime.utcnow().isoformat() + "Z",
        "total_flights": len(flights),
        "routes": list(set(f.route for f in flights)),
        "flights": [asdict(f) for f in flights],
    }
    with open(filename, "w") as fp:
        json.dump(data, fp, indent=2)
    print(f"\n  Saved JSON → {filename}")


def save_csv(flights: list, filename: str = "bark_air_flights.csv"):
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


def parse_date_to_iso(date_str: str) -> Optional[str]:
    """Convert BARK Air date format to YYYY-MM-DD."""
    if not date_str:
        return None
    # Try common formats: "Saturday, March 8, 2026", "Mar 8, 2026", etc.
    for fmt in ["%A, %B %d, %Y", "%B %d, %Y", "%b %d, %Y", "%m/%d/%Y"]:
        try:
            return datetime.strptime(date_str.strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def estimate_duration(origin_code: str, dest_code: str) -> str:
    """Estimate flight duration based on route."""
    durations = {
        ("HPN", "FXE"): "3h 15m", ("FXE", "HPN"): "3h 15m",
        ("HPN", "VNY"): "5h 30m", ("VNY", "HPN"): "5h 30m",
        ("HPN", "SJC"): "5h 45m", ("SJC", "HPN"): "5h 45m",
        ("VNY", "KOA"): "5h 30m", ("KOA", "VNY"): "5h 30m",
    }
    return durations.get((origin_code, dest_code), "5h 00m")


def estimate_arrival(takeoff: str, origin_code: str, dest_code: str) -> str:
    """Estimate arrival time based on takeoff and duration."""
    if not takeoff:
        return "TBD"
    # Parse duration
    dur = estimate_duration(origin_code, dest_code)
    hours = int(dur.split("h")[0])
    mins = int(dur.split("h ")[1].replace("m", ""))

    # Parse takeoff time
    try:
        t = datetime.strptime(takeoff.strip(), "%I:%M %p")
    except ValueError:
        try:
            t = datetime.strptime(takeoff.strip(), "%I:%M%p")
        except ValueError:
            return "TBD"

    from datetime import timedelta
    arr = t + timedelta(hours=hours, minutes=mins)
    return arr.strftime("%-I:%M %p")


def save_typescript(flights: list, filename: str = "bark_air_flights_ts.txt"):
    """
    Generate TypeScript flight entries for Aviato's flights.ts.
    Groups by route key (e.g., 'HPN-VNY') and outputs entries
    that can be MERGED into existing route arrays.
    """
    # Group flights by route key
    routes = {}
    for f in flights:
        if not f.available:
            continue
        key = f"{f.origin_code}-{f.destination_code}"
        routes.setdefault(key, []).append(f)

    lines = []
    lines.append("// ═══ BARK Air flights — scraped from air.bark.co ═══")
    lines.append(f"// Scraped at: {datetime.utcnow().isoformat()}Z")
    lines.append(f"// Total available flights: {sum(len(v) for v in routes.values())}")
    lines.append("")

    flight_idx = 0
    for route_key, route_flights in sorted(routes.items()):
        origin_code = route_flights[0].origin_code
        dest_code = route_flights[0].destination_code
        lines.append(f"  // ── BARK Air: {route_flights[0].origin} → {route_flights[0].destination} ({route_key}) ──")
        lines.append(f"  // MERGE these into the existing '{route_key}' array in FLIGHTS")
        lines.append(f"  // (or create the key if it doesn't exist)")

        for f in sorted(route_flights, key=lambda x: x.date or ""):
            flight_idx += 1
            iso_date = parse_date_to_iso(f.date)
            takeoff = f.takeoff or "TBD"
            arrival = estimate_arrival(f.takeoff, origin_code, dest_code)
            dur = estimate_duration(origin_code, dest_code)
            price = int(float(f.price)) if f.price else 0
            seats = f.tickets_remaining or 8
            aircraft = f.aircraft or "CRJ-200"

            date_part = f", date:'{iso_date}'" if iso_date else ""

            lines.append(
                f"    {{ id:'bark-{route_key.lower().replace('-','')}-{flight_idx}', "
                f"airline:'BARK Air', dep:'{takeoff}', arr:'{arrival}', "
                f"dc:'{origin_code}', ac:'{dest_code}', dur:'{dur}', "
                f"price:{price}, craft:'{aircraft}', seats:{seats}, "
                f"amen:['WiFi','Gourmet Catering','Champagne','Calming Treats','Vet Tech On Board'], "
                f"link:'air.bark.co'{date_part} }},"
            )

        lines.append("")

    with open(filename, "w") as fp:
        fp.write("\n".join(lines))
    print(f"  Saved TypeScript snippet → {filename}")
    print(f"  (Merge these entries into your flights.ts FLIGHTS object)")


def print_summary(flights: list):
    """Print a summary table to the console."""
    print("\n" + "=" * 90)
    print("BARK AIR — FLIGHT AVAILABILITY SUMMARY")
    print("=" * 90)

    routes = {}
    for f in flights:
        routes.setdefault(f.route, []).append(f)

    for route, route_flights in sorted(routes.items()):
        origin_code = route_flights[0].origin_code
        dest_code = route_flights[0].destination_code
        available = [f for f in route_flights if f.available]
        sold_out = [f for f in route_flights if not f.available]

        print(f"\n  {route} ({origin_code} → {dest_code})")
        print(f"  {'─' * 80}")
        print(f"  {'Date':<22} {'Takeoff':<15} {'Price':>10} {'Tickets':>8} {'Status':<10} {'Aircraft'}")
        print(f"  {'─' * 80}")

        for f in sorted(route_flights, key=lambda x: x.date or ""):
            date = f.date or "N/A"
            takeoff = f.takeoff or "N/A"
            price = f"${float(f.price):,.0f}" if f.price else "N/A"
            tickets = str(f.tickets_remaining) if f.tickets_remaining is not None else "N/A"
            status = "Available" if f.available else "SOLD OUT"
            aircraft = (f.aircraft or "N/A")[:40]
            print(f"  {date:<22} {takeoff:<15} {price:>10} {tickets:>8}   {status:<10} {aircraft}")

        print(f"  Available: {len(available)} | Sold out: {len(sold_out)}")

    print(f"\n{'=' * 90}")
    total_available = sum(1 for f in flights if f.available)
    print(f"Total flights: {len(flights)} ({total_available} available, {len(flights) - total_available} sold out)")
    print(f"Scraped at: {datetime.utcnow().isoformat()}Z")
    print("=" * 90)


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  BARK Air Flight Scraper")
    print("  Target: air.bark.co (Shopify Store)")
    print("=" * 60)

    # Step 1: Fetch all products
    print("\n[1/3] Fetching all flight products from collection API...")
    all_products = fetch_all_products()
    print(f"  Total products in collection: {len(all_products)}")

    # Step 2: Filter for target routes
    print("\n[2/3] Filtering for target routes...")
    flights = filter_target_flights(all_products)
    print(f"  Found {len(flights)} flights on target routes:")

    route_counts = {}
    for f in flights:
        route_counts[f.route] = route_counts.get(f.route, 0) + 1
    for route, count in sorted(route_counts.items()):
        print(f"    • {route}: {count} flights")

    if not flights:
        print("\n  No flights found for target routes!")
        return

    # Step 3: Scrape detailed flight info from each product page
    print(f"\n[3/3] Scraping detailed flight info from {len(flights)} product pages...")
    for i, flight in enumerate(flights, 1):
        print(f"  [{i}/{len(flights)}] {flight.title}...", end=" ", flush=True)
        scrape_flight_details(flight)
        status = "✓" if flight.available else "✗ SOLD OUT"
        print(f"{status} {flight.date or 'no date'} | ${flight.price}")
        time.sleep(REQUEST_DELAY)

    # Output results
    print("\n" + "─" * 60)
    print("Saving results...")
    save_json(flights)
    save_csv(flights)
    save_typescript(flights)
    print_summary(flights)


if __name__ == "__main__":
    main()
