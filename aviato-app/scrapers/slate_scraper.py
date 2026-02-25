#!/usr/bin/env python3
"""
Slate Aviation Flight Scraper for Aviato

Strategy (Calendar API):
  1. GET  /getAirportsAndMa        → metro areas + airport codes
  2. POST /getCalendarSeatsPrices   → available dates with starting prices

Uses the calendar API which works from GitHub Actions (datacenter IPs).
Gets dates and starting prices per route direction.

Output: slate_flights.json (flat list of flight dicts)
"""

import requests
import json
import time
import os
from datetime import datetime

BASE_URL = "https://app.flyslate.com"
API_URL = "https://api.app.flyslate.com"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Origin": BASE_URL,
    "Referer": f"{BASE_URL}/",
    "Content-Type": "application/json",
}

# Metro area definitions with main IATA airports
METROS = {
    218: {"name": "South Florida", "iata": "FLL"},
    252: {"name": "New York", "iata": "TEB"},
    255: {"name": "Nantucket", "iata": "ACK"},
    384: {"name": "Augusta, GA", "iata": "AGS"},
}

# Route pairs to check
ROUTE_PAIRS = [
    (218, 252),  # South Florida -> New York
    (252, 218),  # New York -> South Florida
    (252, 255),  # New York -> Nantucket
    (255, 252),  # Nantucket -> New York
    (252, 384),  # New York -> Augusta
    (384, 252),  # Augusta -> New York
]


def get_calendar_prices(from_metro: int, to_metro: int) -> list[dict]:
    """Get available dates with prices for a route."""
    payload = {"directions": [{"from": from_metro, "to": to_metro}]}
    resp = requests.post(
        f"{API_URL}/getCalendarSeatsPrices", headers=HEADERS, json=payload, timeout=30
    )
    resp.raise_for_status()
    data = resp.json()
    if not data.get("status"):
        return []
    return data.get("seats", [])


def build_flights_from_calendar(
    calendar_entries: list[dict],
    from_metro_id: int,
    to_metro_id: int,
) -> list[dict]:
    """Build Aviato-compatible flight dicts from calendar data."""
    from_iata = METROS[from_metro_id]["iata"]
    to_iata = METROS[to_metro_id]["iata"]

    flights = []
    for entry in calendar_entries:
        flight_date = entry["date"]
        price = entry["price"]
        date_compact = flight_date.replace("-", "")

        deeplink = (
            f"{BASE_URL}/search/points/{from_metro_id}-{to_metro_id}"
            f"/dates/{date_compact}/ft/1/c/USD/"
        )

        flights.append({
            "airline": "Slate",
            "origin_code": from_iata,
            "destination_code": to_iata,
            "date": flight_date,
            "departure_time": "— —",
            "arrival_time": "— —",
            "duration_minutes": 0,
            "price": price,
            "available_seats": 1,
            "aircraft": "CRJ-200",
            "deeplink": deeplink,
        })

    return flights


def scrape_all_flights():
    """Main scraping function."""
    print("=" * 60)
    print("Slate Aviation Flight Scraper (Calendar API)")
    print("=" * 60)

    all_flights = []

    print("\nFetching calendar data for all routes...")
    for from_id, to_id in ROUTE_PAIRS:
        from_name = METROS[from_id]["name"]
        to_name = METROS[to_id]["name"]
        from_iata = METROS[from_id]["iata"]
        to_iata = METROS[to_id]["iata"]

        try:
            entries = get_calendar_prices(from_id, to_id)
            if entries:
                flights = build_flights_from_calendar(entries, from_id, to_id)
                all_flights.extend(flights)
                print(f"  {from_name} -> {to_name} ({from_iata}-{to_iata}): {len(flights)} flights")
            else:
                print(f"  {from_name} -> {to_name} ({from_iata}-{to_iata}): no flights")
        except Exception as e:
            print(f"  {from_name} -> {to_name}: ERROR - {e}")
        time.sleep(0.5)

    all_flights.sort(key=lambda f: (f["date"], f["origin_code"], f["destination_code"]))

    _save_and_summarize(all_flights)


def _save_and_summarize(all_flights: list[dict]):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "slate_flights.json")

    with open(json_path, "w") as f:
        json.dump(all_flights, f, indent=2)
    print(f"\nSaved {len(all_flights)} flights to {json_path}")

    print("\n" + "=" * 60)
    print("SUMMARY")
    print(f"  Total flights: {len(all_flights)}")
    if all_flights:
        prices = [fl["price"] for fl in all_flights if fl["price"]]
        if prices:
            print(f"  Price range:   ${min(prices):,} - ${max(prices):,}")
        dates = sorted(set(fl["date"] for fl in all_flights))
        print(f"  Date range:    {dates[0]} to {dates[-1]}")
        print(f"  Unique dates:  {len(dates)}")
        route_counts: dict[str, int] = {}
        for fl in all_flights:
            key = f"{fl['origin_code']}-{fl['destination_code']}"
            route_counts[key] = route_counts.get(key, 0) + 1
        print("  Route breakdown:")
        for route, count in sorted(route_counts.items(), key=lambda x: -x[1]):
            print(f"    {route}: {count} flights")
    print("=" * 60)


if __name__ == "__main__":
    scrape_all_flights()
