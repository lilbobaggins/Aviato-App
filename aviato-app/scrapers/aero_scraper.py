#!/usr/bin/env python3
"""
Aero.com Flight Scraper
Uses Aero's GraphQL API at membrane.aero.com/api/v2
Covers 16 routes (8 bidirectional) from/to VNY
No auth required.

Usage:
    pip install requests
    python aero_scraper.py
"""
import requests
import json
import csv
import io
from datetime import datetime

GRAPHQL_URL = "https://membrane.aero.com/api/v2"
BASE_URL = "https://aero.com"

ROUTES = [
    {"origin": "VNY", "destination": "LAS", "origin_city": "Los Angeles", "dest_city": "Las Vegas"},
    {"origin": "LAS", "destination": "VNY", "origin_city": "Las Vegas", "dest_city": "Los Angeles"},
    {"origin": "VNY", "destination": "ASE", "origin_city": "Los Angeles", "dest_city": "Aspen"},
    {"origin": "ASE", "destination": "VNY", "origin_city": "Aspen", "dest_city": "Los Angeles"},
    {"origin": "VNY", "destination": "SUN", "origin_city": "Los Angeles", "dest_city": "Sun Valley"},
    {"origin": "SUN", "destination": "VNY", "origin_city": "Sun Valley", "dest_city": "Los Angeles"},
    {"origin": "VNY", "destination": "TRM", "origin_city": "Los Angeles", "dest_city": "Coachella Valley"},
    {"origin": "TRM", "destination": "VNY", "origin_city": "Coachella Valley", "dest_city": "Los Angeles"},
    {"origin": "VNY", "destination": "APC", "origin_city": "Los Angeles", "dest_city": "Napa Valley"},
    {"origin": "APC", "destination": "VNY", "origin_city": "Napa Valley", "dest_city": "Los Angeles"},
    {"origin": "VNY", "destination": "SJD", "origin_city": "Los Angeles", "dest_city": "Cabo"},
    {"origin": "SJD", "destination": "VNY", "origin_city": "Cabo", "dest_city": "Los Angeles"},
    {"origin": "VNY", "destination": "OGG", "origin_city": "Los Angeles", "dest_city": "Maui"},
    {"origin": "OGG", "destination": "VNY", "origin_city": "Maui", "dest_city": "Los Angeles"},
    {"origin": "VNY", "destination": "TEB", "origin_city": "Los Angeles", "dest_city": "New York"},
    {"origin": "TEB", "destination": "VNY", "origin_city": "New York", "dest_city": "Los Angeles"},
]

FLIGHT_SEARCH_QUERY = """
{
  flightSearch(
    originIata: "%s"
    destinationIata: "%s"
    minimumAdultSeatsAvailable: 1
    minimumInfantSeatsAvailable: 0
    minimumPetInSeatAvailable: 0
    minimumServiceAnimalSpacesAvailable: 0
    showSoldOut: false
  ) {
    departureFlights {
      originIata
      destinationIata
      departureAt
      arrivalAt
      price
      currency
      fare
      fareBrandName
      flightNumber
      marketingCarrierCode
      isSoldOut
      duration
      availableAdultSeats
      cartKey
    }
  }
}
"""


def format_time(dt_str: str) -> str:
    """Convert '2026-03-06 16:00:00' -> '4:00 PM'"""
    try:
        dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
        h = dt.hour % 12 or 12
        ampm = "AM" if dt.hour < 12 else "PM"
        return f"{h}:{dt.minute:02d} {ampm}"
    except Exception:
        return dt_str


def format_date(dt_str: str) -> str:
    return dt_str[:10] if dt_str else ""


def fetch_flights(origin: str, destination: str) -> list[dict]:
    response = requests.post(
        GRAPHQL_URL,
        json={"query": FLIGHT_SEARCH_QUERY % (origin, destination)},
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()
    if "errors" in data:
        raise RuntimeError(f"GraphQL errors for {origin}->{destination}: {data['errors']}")
    return data.get("data", {}).get("flightSearch", {}).get("departureFlights", [])


def scrape_all_routes() -> list[dict]:
    all_flights = []
    for route in ROUTES:
        origin = route["origin"]
        dest = route["destination"]
        print(f"  Fetching {origin} -> {dest} ...", end=" ", flush=True)
        try:
            raw = fetch_flights(origin, dest)
        except Exception as e:
            print(f"ERROR: {e}")
            continue
        print(f"{len(raw)} flights found")

        for f in raw:
            if f.get("isSoldOut"):
                continue
            price = f.get("price")
            record = {
                "airline": "Aero",
                "origin_code": origin,
                "destination_code": dest,
                "date": format_date(f.get("departureAt", "")),
                "departure_time": format_time(f.get("departureAt", "")),
                "arrival_time": format_time(f.get("arrivalAt", "")),
                "duration_minutes": f.get("duration"),
                "price": round(float(price), 2) if price else 0,
                "available_seats": f.get("availableAdultSeats", 0),
                "flight_number": f"5E{f.get('flightNumber', '')}",
                "fare_brand": f.get("fareBrandName", ""),
            }
            all_flights.append(record)

    return all_flights


if __name__ == "__main__":
    print("=" * 60)
    print("Aero Flight Scraper")
    print(f"Routes: {len(ROUTES)}")
    print("=" * 60 + "\n")

    flights = scrape_all_routes()

    # Save JSON
    with open("aero_flights.json", "w") as f:
        json.dump(flights, f, indent=2)
    print(f"\nSaved JSON -> aero_flights.json")

    # Save CSV
    if flights:
        with open("aero_flights.csv", "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=list(flights[0].keys()))
            writer.writeheader()
            writer.writerows(flights)
        print(f"Saved CSV  -> aero_flights.csv")

    print(f"\nDone! {len(flights)} flights across {len(ROUTES)} routes")
