#!/usr/bin/env python3
"""
check_price_drops.py — Compares current flight prices in flights.ts against
previous_prices.json. If any route's cheapest price has dropped, sends an
email alert to Buttondown subscribers.

Run from the scrapers/ directory:
    BUTTONDOWN_API_KEY=xxx python check_price_drops.py
"""

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

FLIGHTS_TS = Path(__file__).parent.parent / "app" / "data" / "flights.ts"
PREV_PRICES = Path(__file__).parent / "previous_prices.json"

# Friendly route names for email
AIRPORT_NAMES = {
    "HPN": "White Plains, NY",
    "TEB": "Teterboro, NJ",
    "MMU": "Morristown, NJ",
    "FRG": "Farmingdale, NY",
    "ACK": "Nantucket, MA",
    "MVY": "Martha's Vineyard, MA",
    "BUR": "Burbank, LA",
    "SMO": "Santa Monica, LA",
    "SNA": "Orange County, CA",
    "LAX": "Los Angeles",
    "LAS": "Las Vegas",
    "OAK": "Oakland, CA",
    "CCR": "Concord, CA",
    "SCF": "Scottsdale, AZ",
    "RNO": "Reno, NV",
    "SLC": "Salt Lake City",
    "MRY": "Monterey, CA",
    "APC": "Napa, CA",
    "TSM": "Taos, NM",
    "APA": "Denver, CO",
    "CLD": "Carlsbad, CA",
    "CSW": "Cabo San Lucas",
    "TRM": "Palm Springs, CA",
    "DAL": "Dallas",
    "DSI": "Destin, FL",
    "HOU": "Houston",
    "OPF": "Miami",
    "SAF": "Santa Fe, NM",
    "HOB": "Hobbs, NM",
    "EDC": "Austin, TX",
    "PBI": "Palm Beach, FL",
    "APF": "Naples, FL",
    "BCT": "Boca Raton, FL",
    "FLL": "Fort Lauderdale",
    "MIA": "Miami",
    "VNY": "Van Nuys, LA",
    "ASE": "Aspen, CO",
    "SUN": "Sun Valley, ID",
    "SJD": "San Jose del Cabo",
    "OGG": "Maui, HI",
    "KOA": "Kona, HI",
    "SEA": "Seattle",
    "SJC": "San Jose, CA",
    "LTN": "London",
    "LBG": "Paris",
    "MAD": "Madrid",
    "LIS": "Lisbon",
    "BER": "Berlin",
    "DUB": "Dublin",
    "ATH": "Athens",
    "ARN": "Stockholm",
    "NRT": "Tokyo",
    # K9 Jets airports
    "DWC": "Dubai",
    "FXE": "Fort Lauderdale",
    "NCE": "Nice",
    "AGP": "Malaga",
    "FRA": "Frankfurt",
    "GVA": "Geneva",
    "MXP": "Milan",
    "YYZ": "Toronto",
    "BHX": "Birmingham, UK",
    "HNL": "Honolulu",
    "HCR": "Park City, UT",
    # Boutique Air / misc
    "PDX": "Portland, OR",
    "BOS": "Boston",
    "DFW": "Dallas/Fort Worth",
    "IAD": "Washington, DC",
    "PIT": "Pittsburgh",
    "MEM": "Memphis",
    "BNA": "Nashville",
    "STL": "St. Louis",
}


def route_display(origin: str, dest: str) -> str:
    """Convert airport codes to friendly route name."""
    orig_name = AIRPORT_NAMES.get(origin, origin)
    dest_name = AIRPORT_NAMES.get(dest, dest)
    return f"{orig_name} → {dest_name}"


def parse_flights_ts() -> dict[str, dict]:
    """
    Parse flights.ts to extract cheapest price per route.
    Returns: { "HPN-ACK": {"price": 795, "airline": "Tradewind"}, ... }
    """
    content = FLIGHTS_TS.read_text()

    # Match flight entries: { id:'...', airline:'...', ... price:123, ... dc:'ABC', ac:'XYZ', ... }
    pattern = re.compile(
        r"\{\s*id:'[^']*',\s*airline:'([^']*)'.*?"
        r"dc:'([A-Z]+)',\s*ac:'([A-Z]+)'.*?"
        r"price:(\d+)",
        re.DOTALL,
    )

    route_prices: dict[str, dict] = {}

    for match in pattern.finditer(content):
        airline = match.group(1)
        dc = match.group(2)
        ac = match.group(3)
        price = int(match.group(4))
        route = f"{dc}-{ac}"

        if route not in route_prices or price < route_prices[route]["price"]:
            route_prices[route] = {"price": price, "airline": airline}

    return route_prices


def load_previous_prices() -> dict:
    """Load previous prices from JSON file."""
    if not PREV_PRICES.exists():
        return {}
    try:
        return json.loads(PREV_PRICES.read_text())
    except (json.JSONDecodeError, ValueError):
        return {}


def save_current_prices(prices: dict[str, dict]):
    """Save current prices to JSON file for tomorrow's comparison."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    data = {}
    for route, info in prices.items():
        data[route] = {
            "price": info["price"],
            "airline": info["airline"],
            "date": today,
        }
    PREV_PRICES.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n")
    print(f"Saved {len(data)} route prices to {PREV_PRICES}")


def find_drops(
    current: dict[str, dict], previous: dict[str, dict]
) -> list[dict]:
    """
    Compare current vs previous prices, return list of drops.
    Each drop: {"route": "HPN-ACK", "airline": "Tradewind",
                "old_price": 795, "new_price": 695, "savings": 100}
    """
    drops = []
    for route, curr_info in current.items():
        if route not in previous:
            continue  # New route, no comparison possible
        old_price = previous[route]["price"]
        new_price = curr_info["price"]
        if new_price < old_price:
            drops.append({
                "route": route,
                "airline": curr_info["airline"],
                "old_price": old_price,
                "new_price": new_price,
                "savings": old_price - new_price,
            })

    # Sort by savings descending (biggest deals first)
    drops.sort(key=lambda d: d["savings"], reverse=True)
    return drops


def build_email(drops: list[dict]) -> tuple[str, str]:
    """Build email subject and Markdown body from price drops."""
    # Subject: list the top routes
    route_names = []
    for d in drops[:3]:
        origin, dest = d["route"].split("-")
        short = f"{AIRPORT_NAMES.get(origin, origin).split(',')[0]} → {AIRPORT_NAMES.get(dest, dest).split(',')[0]}"
        route_names.append(short)
    subject_routes = ", ".join(route_names)
    if len(drops) > 3:
        subject_routes += f" + {len(drops) - 3} more"
    subject = f"Price Drop Alert: {subject_routes}"

    # Body
    lines = [
        "# ✈️ Flight Price Drops\n",
        "Great news! We found lower prices on these semi-private routes:\n",
    ]

    for d in drops:
        origin, dest = d["route"].split("-")
        display = route_display(origin, dest)
        lines.append(f"### {display}")
        lines.append(
            f"**{d['airline']}** dropped from ${d['old_price']:,} → "
            f"**${d['new_price']:,}** (save ${d['savings']:,})\n"
        )

    lines.append("---\n")
    lines.append("[Search flights on Aviato](https://aviatoair.com)\n")
    lines.append(
        "*You're receiving this because you signed up for route alerts on Aviato. "
        "[Unsubscribe](https://buttondown.com/aviatoair/unsubscribe)*"
    )

    body = "\n".join(lines)
    return subject, body


def send_email(subject: str, body: str):
    """Send email via Buttondown API."""
    api_key = os.environ.get("BUTTONDOWN_API_KEY", "")
    if not api_key:
        print("WARNING: BUTTONDOWN_API_KEY not set. Skipping email send.")
        print(f"Would have sent:\nSubject: {subject}\n\n{body}")
        return False

    resp = requests.post(
        "https://api.buttondown.com/v1/emails",
        headers={"Authorization": f"Token {api_key}"},
        json={
            "subject": subject,
            "body": body,
            "status": "about_to_send",
        },
        timeout=30,
    )

    if resp.status_code in (200, 201):
        print(f"Email sent successfully! Subject: {subject}")
        return True
    else:
        print(f"ERROR sending email: {resp.status_code} {resp.text}")
        return False


def main():
    print("=" * 60)
    print("Aviato Price Drop Checker")
    print("=" * 60)

    # 1. Parse current prices from flights.ts
    print(f"\nParsing {FLIGHTS_TS}...")
    current_prices = parse_flights_ts()
    print(f"Found cheapest prices for {len(current_prices)} routes")

    # 2. Load previous prices
    print(f"\nLoading previous prices from {PREV_PRICES}...")
    previous_prices = load_previous_prices()
    if not previous_prices:
        print("No previous prices found (first run). Saving current prices.")
        save_current_prices(current_prices)
        print("Done! Price drops will be detected starting tomorrow.")
        return

    print(f"Loaded previous prices for {len(previous_prices)} routes")

    # 3. Find drops
    drops = find_drops(current_prices, previous_prices)

    if not drops:
        print("\nNo price drops detected today.")
    else:
        print(f"\n Found {len(drops)} price drop(s)!")
        for d in drops:
            print(f"  {d['route']} ({d['airline']}): ${d['old_price']} → ${d['new_price']} (save ${d['savings']})")

        # 4. Build and send email
        subject, body = build_email(drops)
        print(f"\nSending email: {subject}")
        send_email(subject, body)

    # 5. Save current prices for tomorrow
    save_current_prices(current_prices)
    print("\nDone!")


if __name__ == "__main__":
    main()
