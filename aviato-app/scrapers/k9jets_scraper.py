#!/usr/bin/env python3
"""
K9 Jets Flight Scraper — WooCommerce Store API
================================================
Uses the public WooCommerce Store API at k9jets.com/wp-json/wc/store/v1/products
to fetch ALL flight listings with structured data (prices, airports, dates, aircraft).

This is far more reliable than HTML scraping because the data comes as structured JSON
with explicit fields for departure/arrival airports (IATA codes), prices, dates,
operators, and aircraft type.

The Store API returns WooCommerce products (each flight is a product) with attributes:
  - Departure Airport (IATA code)
  - Arrival Airport (IATA code)
  - Flight date (MM/DD/YYYY)
  - Departure time
  - Arrival Time
  - Operator
  - Aircraft
  - Route (city pair)
  - Route type (Direct / Via)

Prices are in cents (USD) with currency_minor_unit=2, so 992500 = $9,925.00

Usage:
  pip install requests
  python k9jets_scraper.py
"""
import requests
import json
import csv
import sys
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, asdict

# ─── Configuration ───────────────────────────────────────────────────────────

API_BASE = "https://www.k9jets.com/wp-json/wc/store/v1/products"
PER_PAGE = 100  # max allowed by WooCommerce Store API

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json",
}

# Estimated flight durations (used for display only — not from the API)
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
    ("LTN", "MAD"): "2h 30m", ("MAD", "LTN"): "2h 30m",
    ("DWC", "MAD"): "7h 30m", ("MAD", "DWC"): "7h 00m",
    ("LTN", "NCE"): "2h 00m", ("NCE", "LTN"): "2h 00m",
    ("LTN", "YVR"): "9h 30m", ("YVR", "LTN"): "9h 00m",
    ("DWC", "NCE"): "7h 00m", ("NCE", "DWC"): "6h 30m",
    ("YYZ", "DWC"): "12h 00m", ("DWC", "YYZ"): "14h 00m",
}

# Map city names to IATA codes (fallback if API attributes are missing)
CITY_TO_IATA = {
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
    aircraft: str = ""
    seats: int = 9
    booking_url: Optional[str] = None
    scraped_at: Optional[str] = None


# ─── API Functions ───────────────────────────────────────────────────────────

def get_attr(product: dict, attr_name: str) -> Optional[str]:
    """Extract an attribute value from a WooCommerce Store API product."""
    for attr in product.get("attributes", []):
        if attr.get("name", "").lower() == attr_name.lower():
            terms = attr.get("terms", [])
            if terms:
                return terms[0].get("name", "")
    return None


def fetch_all_products() -> list[dict]:
    """Fetch all products (flights) from the WooCommerce Store API."""
    all_products = []
    page = 1

    while True:
        url = f"{API_BASE}?per_page={PER_PAGE}&page={page}"
        print(f"    Fetching page {page}...", end="", flush=True)

        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            resp.raise_for_status()
        except requests.RequestException as e:
            print(f" ERROR: {e}")
            break

        products = resp.json()
        if not products:
            print(" (empty)")
            break

        all_products.extend(products)
        total = resp.headers.get("X-WP-Total", "?")
        total_pages = resp.headers.get("X-WP-TotalPages", "?")
        print(f" got {len(products)} (total: {total}, page {page}/{total_pages})")

        # Check if we've reached the last page
        try:
            if page >= int(total_pages):
                break
        except (ValueError, TypeError):
            if len(products) < PER_PAGE:
                break

        page += 1

    return all_products


def parse_product(product: dict) -> Optional[Flight]:
    """Parse a single WooCommerce product into a Flight object."""

    # Extract attributes
    dep_code = get_attr(product, "Departure Airport (IATA code)")
    arr_code = get_attr(product, "Arrival Airport (IATA code)")
    flight_date = get_attr(product, "Flight date")
    dep_time = get_attr(product, "Departure time")
    arr_time = get_attr(product, "Arrival Time")
    operator = get_attr(product, "Operator")
    aircraft = get_attr(product, "Aircraft")
    route_name = get_attr(product, "Route")
    route_type = get_attr(product, "Route type")
    dep_location = get_attr(product, "Departure location")
    arr_location = get_attr(product, "Arrival location")

    # Must have airport codes
    if not dep_code or not arr_code:
        # Try to get from category name as fallback
        cats = product.get("categories", [])
        if cats:
            cat_name = cats[0].get("name", "")
            parts = cat_name.split(" to ")
            if len(parts) == 2:
                dep_city = parts[0].strip().split(" (")[0].strip()
                arr_city = parts[1].strip().split(" (")[0].strip()
                dep_code = dep_code or CITY_TO_IATA.get(dep_city)
                arr_code = arr_code or CITY_TO_IATA.get(arr_city)

    if not dep_code or not arr_code:
        return None

    # Parse price (in minor units, divide by 100)
    price = None
    prices = product.get("prices", {})
    raw_price = prices.get("price")
    if raw_price:
        try:
            minor_unit = prices.get("currency_minor_unit", 2)
            price = int(int(raw_price) / (10 ** minor_unit))
        except (ValueError, TypeError):
            pass

    # Parse date to ISO format
    iso_date = None
    if flight_date:
        for fmt in ["%m/%d/%Y", "%d/%m/%Y", "%Y-%m-%d", "%B %d, %Y", "%B %d %Y"]:
            try:
                iso_date = datetime.strptime(flight_date.strip(), fmt).strftime("%Y-%m-%d")
                break
            except ValueError:
                continue

    # Skip past flights
    if iso_date:
        today = datetime.now().strftime("%Y-%m-%d")
        if iso_date < today:
            return None

    # Check availability
    is_purchasable = product.get("is_purchasable", True)
    is_in_stock = product.get("is_in_stock", True)
    available = is_purchasable and is_in_stock

    # Build origin/destination city names
    origin_city = dep_location or dep_code
    dest_city = arr_location or arr_code
    # Clean up city names (remove country suffix like "Dubai, UAE")
    if "," in origin_city:
        origin_city = origin_city.split(",")[0].strip()
    if "," in dest_city:
        dest_city = dest_city.split(",")[0].strip()

    # Route display name
    if route_name:
        display_route = route_name
    else:
        display_route = f"{origin_city} To {dest_city}"

    # Duration
    dur = DURATIONS.get((dep_code, arr_code), "")

    permalink = product.get("permalink", "")

    return Flight(
        route=display_route,
        origin=origin_city,
        destination=dest_city,
        origin_code=dep_code,
        destination_code=arr_code,
        date=iso_date,
        departure_time=dep_time,
        arrival_time=arr_time,
        price=price,
        available=available,
        aircraft=aircraft or "",
        seats=0 if not available else 9,
        booking_url=permalink,
        scraped_at=datetime.utcnow().isoformat() + "Z",
    )


# ─── Output ──────────────────────────────────────────────────────────────────

def save_json(flights: list, filename: str = "k9jets_flights.json"):
    data = {
        "scraped_at": datetime.utcnow().isoformat() + "Z",
        "total_flights": len(flights),
        "source": "k9jets.com (WooCommerce Store API)",
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
    print("K9 JETS — SCRAPED FLIGHT DATA (via WooCommerce Store API)")
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

        print(f"\n  {first.route} ({rk}) — from {price_str}")
        for f in sorted(rflights, key=lambda x: x.date or ""):
            status = "Available" if f.available else "SOLD OUT"
            date = f.date or "TBD"
            dep = f.departure_time or ""
            price = f"${f.price:,}" if f.price else "N/A"
            print(f"    {date}  {dep:<10} {price:>10}  {status}  [{f.aircraft}]")
        print(f"  ({avail}/{len(rflights)} available)")

    print(f"\n{'=' * 90}")
    print(f"Total: {len(flights)} flights across {len(routes)} routes")
    print(f"  Available: {sum(1 for f in flights if f.available)}")
    print(f"  Sold out:  {sum(1 for f in flights if not f.available)}")
    print(f"Scraped at: {datetime.utcnow().isoformat()}Z")
    print("=" * 90)


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  K9 Jets Flight Scraper")
    print("  Using WooCommerce Store API (structured JSON)")
    print("=" * 60)

    # Fetch all products from the API
    print("\n  Fetching flights from WooCommerce Store API...")
    products = fetch_all_products()
    print(f"\n  Fetched {len(products)} total products")

    # Parse each product into a Flight
    flights = []
    skipped = 0
    for p in products:
        flight = parse_product(p)
        if flight:
            flights.append(flight)
        else:
            skipped += 1

    print(f"  Parsed {len(flights)} valid future flights ({skipped} skipped: past or incomplete)")

    # Deduplicate by route + date + price
    seen = set()
    unique = []
    for f in flights:
        key = f"{f.origin_code}-{f.destination_code}-{f.date}-{f.price}"
        if key not in seen:
            seen.add(key)
            unique.append(f)

    print(f"  After dedup: {len(unique)} unique flights")

    if not unique:
        print("\n  WARNING: No flights found from API.")
        print("  The API may be down or the products may have changed.")
        print("  No fake data will be generated.")

    save_json(unique)
    save_csv(unique)
    if unique:
        print_summary(unique)


if __name__ == "__main__":
    main()
