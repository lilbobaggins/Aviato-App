#!/usr/bin/env python3
"""
Slate Aviation Flight Scraper for Aviato

Strategy:
  1. POST /getAirportsAndMa         -> airport ICAO-to-IATA mapping
    2. POST /getCalendarSeatsPrices    -> all dates with available flights
      3. POST /getPlaneBySeatList        -> actual flights per date (times, prices, airports)

      Output: slate_flights.json (flat list of flight dicts for Aviato)
      """

import requests
import json
import time
import os
from datetime import datetime, timedelta

BASE_URL = "https://app.flyslate.com"
API_URL = "https://api.app.flyslate.com"

HEADERS = {
      "accept": "application/json",
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "origin": BASE_URL,
      "referer": f"{BASE_URL}/",
}

CURRENCY = "USD"
LANG = "en-US"

# Route directions to scrape: (from_metro_id, to_metro_id)
DIRECTIONS = [
      ("252", "218"),  # New York -> South Florida
      ("218", "252"),  # South Florida -> New York
]

# Date range
START_DATE = datetime.today().strftime("%Y-%m-%d")
END_DATE = (datetime.today() + timedelta(days=270)).strftime("%Y-%m-%d")

DELAY = 0.3  # seconds between requests

# Typical flight duration in minutes
FLIGHT_DURATION = 180  # NY <-> SFL: ~3h


def get_airport_map() -> dict:
      """Fetch airport data and return {ICAO_code: {name, city, state, iata}}."""
      for attempt in range(3):
                try:
                              resp = requests.post(
                                                f"{API_URL}/getAirportsAndMa",
                                                headers=HEADERS,
                                                json={},
                                                timeout=30,
                              )
                              resp.raise_for_status()
                              data = resp.json()
                              ap_map = {}
                              for ap in data.get("ap", []):
                                                code = ap["code"]
                                                iata = ap.get("iata") or ap.get("faa") or code
                                                if not ap.get("iata") and code.startswith("K") and len(code) == 4:
                                                                      iata = code[1:]
                                                                  ap_map[code] = {
                                                    "name": ap.get("name", ""),
                                                    "city": ap.get("city", ""),
                                                    "state": ap.get("state", ""),
                                                    "iata": iata,
                                                }
                                            ap_map["NYC"] = {"name": "New York Area", "city": "New York", "state": "NY", "iata": "TEB"}
                              return ap_map
except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
            if attempt < 2:
                              print(f"  airport map timeout, retry {attempt+1}...")
                              time.sleep(2 ** attempt)
else:
                  raise


def get_calendar_dates(from_ma: str, to_ma: str, retries: int = 3) -> list[dict]:
      """Get all available dates with starting prices for a route direction."""
      payload = {
          "directions": [{"from": from_ma, "to": to_ma}],
          "currentLeg": 0,
          "prevSelectedDates": [],
          "visibleDates": {"startDate": START_DATE, "endDate": END_DATE},
          "lang": LANG,
          "webapp": True,
      }
      for attempt in range(retries):
                try:
                              resp = requests.post(
                                                f"{API_URL}/getCalendarSeatsPrices",
                                                headers=HEADERS,
                                                json=payload,
                                                timeout=30,
                              )
                              resp.raise_for_status()
                              data = resp.json()
                              if not data.get("status"):
                                                return []
                                            return data.get("seats", [])
except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
            if attempt < retries - 1:
                              wait = 2 ** attempt
                              print(f"  calendar timeout, retry {attempt+1}...")
                              time.sleep(wait)
else:
                  raise


def get_flights_for_date(date_str: str, from_ma: str, to_ma: str, retries: int = 3) -> list[dict]:
      """Get all flights for a specific date and direction, with retries."""
      payload = {
          "currency": CURRENCY,
          "flightType": 1,
          "prevSelectedDates": [date_str],
          "directions": [{"from": from_ma, "to": to_ma}],
          "currentLeg": "0",
          "lang": LANG,
          "webapp": True,
      }
      for attempt in range(retries):
                try:
                              resp = requests.post(
                                                f"{API_URL}/getPlaneBySeatList",
                                                headers=HEADERS,
                                                json=payload,
                                                timeout=30,
                              )
                              resp.raise_for_status()
                              data = resp.json()
                              if not data.get("status"):
                                                return []
                                            return [flight for group in data.get("charters", []) for flight in group]
except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
            if attempt < retries - 1:
                              wait = 2 ** attempt
                              print(f"timeout, retry {attempt+1}...", end=" ")
                              time.sleep(wait)
else:
                  raise


def scrape_all_flights():
      """Main scraper -- pulls all flights from all directions."""
      print("=" * 60)
      print("Slate Aviation Flight Scraper")
      print("=" * 60)

    print("\n[1/3] Loading airport data...")
    ap_map = get_airport_map()
    print(f"  {len(ap_map)} airports loaded")

    all_flights = []

    for from_ma, to_ma in DIRECTIONS:
              print(f"\n[2/3] Route {from_ma} -> {to_ma}")
              print("  Loading calendar...")

        try:
                      calendar = get_calendar_dates(from_ma, to_ma)
except Exception as e:
              print(f"  Calendar failed after retries: {e}")
              continue

        if not calendar:
                      print("  No dates available")
                      continue
                  print(f"  {len(calendar)} dates with flights")

        for idx, day in enumerate(calendar):
                      date_str = day["date"]
                      print(f"  [{idx+1}/{len(calendar)}] {date_str}...", end=" ")

            try:
                              flights = get_flights_for_date(date_str, from_ma, to_ma)
except Exception as e:
                  print(f"SKIP ({e})")
                  time.sleep(DELAY)
                  continue

            print(f"{len(flights)} flight(s)")

            for flight in flights:
                              flight_id = flight["id"]
                              dep_code = flight["from"]
                              arr_code = flight["to"]
                              dep_dt_str = flight["departureTime"]
                              price = flight["priceBlock"]["price"]
                              aircraft = flight.get("name", "CRJ-200").strip()
                              seats_left = flight.get("seatsLeft", 1)

                dep_dt = datetime.strptime(dep_dt_str, "%Y-%m-%d %H:%M")

                # Resolve IATA codes
                dep_ap = ap_map.get(dep_code, {"iata": dep_code})
                arr_ap = ap_map.get(arr_code, {"iata": arr_code})
                dep_iata = dep_ap["iata"]
                arr_iata = arr_ap["iata"]

                # Estimate arrival time (~3h for all NY<->SFL flights)
                arr_dt = dep_dt + timedelta(minutes=FLIGHT_DURATION)
                arr_time_str = arr_dt.strftime("%-I:%M %p")

                dep_time_str = dep_dt.strftime("%-I:%M %p")
                date_compact = date_str.replace("-", "")

                deeplink = (
                                      f"{BASE_URL}/search/points/{from_ma}-{to_ma}"
                                      f"/dates/{date_compact}/ft/1/c/{CURRENCY}/sr/{flight_id}/"
                )

                all_flights.append({
                                      "airline": "Slate",
                                      "origin_code": dep_iata,
                                      "destination_code": arr_iata,
                                      "date": date_str,
                                      "departure_time": dep_time_str,
                                      "arrival_time": arr_time_str,
                                      "duration_minutes": FLIGHT_DURATION,
                                      "price": price,
                                      "available_seats": max(seats_left, 1),
                                      "aircraft": aircraft,
                                      "seat_reservation_id": flight_id,
                                      "deeplink": deeplink,
                })

            time.sleep(DELAY)

    # Sort by date then time
    all_flights.sort(key=lambda f: (f["date"], f["departure_time"]))

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
