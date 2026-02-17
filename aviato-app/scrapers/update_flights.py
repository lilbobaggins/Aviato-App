#!/usr/bin/env python3
"""
update_flights.py — Reads scraped JSON from JSX, Tradewind + BARK Air scrapers,
then updates app/data/flights.ts with fresh flight entries.

Strategy: For each airline's routes, REPLACE all existing entries in the
route arrays with fresh scraped data. Preserves entries from other airlines
in shared route arrays.

Run from the scrapers/ directory:
    python update_flights.py
"""

import json
import re
import os
import sys
from datetime import datetime
from pathlib import Path

FLIGHTS_TS = Path(__file__).parent.parent / "app" / "data" / "flights.ts"

# ── JSX config ────────────────────────────────────────────────────────
JSX_ROUTES = [
    "BUR-LAS", "LAS-BUR", "SMO-LAS", "LAS-SMO", "SNA-LAS", "LAS-SNA",
    "SMO-SCF", "SCF-SMO", "SNA-SCF", "SCF-SNA", "BUR-CCR", "CCR-BUR",
    "SNA-OAK", "OAK-SNA", "HPN-PBI", "PBI-HPN", "HPN-OPF", "OPF-HPN",
    "DAL-LAS", "LAS-DAL", "DAL-DSI", "DSI-DAL", "DAL-HOU", "HOU-DAL",
    "SMO-TRM", "TRM-SMO",
]
JSX_CRAFT = "ERJ-135"
JSX_SEATS_DEFAULT = 2
JSX_AMEN = "['WiFi','Snacks']"
JSX_LINK = "jsx.com"

# ── Tradewind config ──────────────────────────────────────────────────
TRADEWIND_ROUTES = ["ACK-HPN", "HPN-ACK", "HPN-MVY", "MVY-HPN"]
TRADEWIND_CRAFT = "Pilatus PC-12"
TRADEWIND_SEATS = 6
TRADEWIND_AMEN = "['WiFi','Snacks']"
TRADEWIND_LINK = "flytradewind.com"

# ── BARK Air config ───────────────────────────────────────────────────
BARK_ROUTES = [
    "HPN-VNY", "VNY-HPN", "HPN-SJC", "SJC-HPN", "VNY-KOA", "KOA-VNY",
    "HPN-FXE", "FXE-HPN",
]
BARK_CRAFT = "Bombardier Challenger 601"
BARK_AMEN = "['WiFi','Gourmet Catering','Champagne','Calming Treats','Vet Tech On Board']"
BARK_LINK = "air.bark.co"

BARK_DURATIONS = {
    "HPN-FXE": "3h 15m", "FXE-HPN": "3h 15m",
    "HPN-VNY": "5h 30m", "VNY-HPN": "5h 30m",
    "HPN-SJC": "5h 45m", "SJC-HPN": "5h 45m",
    "VNY-KOA": "5h 30m", "KOA-VNY": "5h 30m",
}


def load_tradewind_flights(json_path: str) -> dict[str, list[dict]]:
    """Load Tradewind JSON and group by route key."""
    if not os.path.exists(json_path):
        print(f"  [skip] {json_path} not found")
        return {}

    with open(json_path) as f:
        data = json.load(f)

    # The Tradewind JSON is a flat list of flight dicts
    flights = data if isinstance(data, list) else data.get("flights", data)

    routes: dict[str, list[dict]] = {}
    for fl in flights:
        origin = fl.get("origin_code", "")
        dest = fl.get("destination_code", "")
        key = f"{origin}-{dest}"
        if key in TRADEWIND_ROUTES:
            routes.setdefault(key, []).append(fl)

    # Sort each route by date then time
    for key in routes:
        routes[key].sort(key=lambda f: (f.get("date_iso", ""), f.get("departure_time", "")))

    return routes


def load_bark_flights(json_path: str) -> dict[str, list[dict]]:
    """Load BARK Air JSON and group by route key."""
    if not os.path.exists(json_path):
        print(f"  [skip] {json_path} not found")
        return {}

    with open(json_path) as f:
        data = json.load(f)

    flights = data.get("flights", []) if isinstance(data, dict) else data

    routes: dict[str, list[dict]] = {}
    for fl in flights:
        if not fl.get("available", True):
            continue
        origin = fl.get("origin_code", "")
        dest = fl.get("destination_code", "")
        key = f"{origin}-{dest}"
        if key in BARK_ROUTES:
            routes.setdefault(key, []).append(fl)

    # Sort each route by date
    for key in routes:
        routes[key].sort(key=lambda f: (f.get("date", ""), f.get("takeoff", "")))

    return routes


def load_jsx_flights(json_path: str) -> dict[str, list[dict]]:
    """Load JSX JSON and group by route key. Deduplicate to cheapest fare per flight."""
    if not os.path.exists(json_path):
        print(f"  [skip] {json_path} not found")
        return {}

    with open(json_path) as f:
        data = json.load(f)

    flights = data if isinstance(data, list) else data.get("flights", data)

    # Group all fares by route
    routes_raw: dict[str, list[dict]] = {}
    for fl in flights:
        origin = fl.get("origin_code", "")
        dest = fl.get("destination_code", "")
        key = f"{origin}-{dest}"
        if key in JSX_ROUTES:
            routes_raw.setdefault(key, []).append(fl)

    # Deduplicate: keep only cheapest fare per (date, departure_time) combo
    routes: dict[str, list[dict]] = {}
    for key, fares in routes_raw.items():
        best: dict[str, dict] = {}
        for fl in fares:
            combo = f"{fl.get('date', '')}|{fl.get('departure_time', '')}"
            if combo not in best or fl.get("price", 9999) < best[combo].get("price", 9999):
                best[combo] = fl
        routes[key] = sorted(best.values(), key=lambda f: (f.get("date", ""), f.get("departure_time", "")))

    return routes


def jsx_to_ts(route_key: str, flights: list[dict]) -> list[str]:
    """Convert JSX flight dicts to TypeScript entry lines."""
    fr, to = route_key.split("-")
    prefix = f"jsx-{fr.lower()}-{to.lower()}"
    lines = []

    for i, fl in enumerate(flights, 1):
        dep = fl.get("departure_time", "")
        arr = fl.get("arrival_time", "")
        date = fl.get("date", "")
        price = fl.get("price", 0)
        seats = fl.get("seats_available", JSX_SEATS_DEFAULT) or JSX_SEATS_DEFAULT

        # Calculate duration from ISO times if available
        dur = _calc_duration(fl.get("departure_iso", ""), fl.get("arrival_iso", ""))

        price_str = str(int(price)) if isinstance(price, float) and price == int(price) else str(price)

        line = (
            f"    {{ id:'{prefix}-{i}', airline:'JSX', "
            f"dep:'{dep}', arr:'{arr}', dc:'{fr}', ac:'{to}', "
            f"dur:'{dur}', price:{price_str}, craft:'{JSX_CRAFT}', "
            f"seats:{seats}, amen:{JSX_AMEN}, "
            f"link:'{JSX_LINK}', date:'{date}' }},"
        )
        lines.append(line)

    return lines


def _calc_duration(dep_iso: str, arr_iso: str) -> str:
    """Calculate duration string from ISO departure and arrival times."""
    if not dep_iso or not arr_iso:
        return "1h 30m"
    try:
        dep_dt = datetime.fromisoformat(dep_iso)
        arr_dt = datetime.fromisoformat(arr_iso)
        diff = arr_dt - dep_dt
        total_min = int(diff.total_seconds() / 60)
        if total_min <= 0:
            return "1h 30m"
        hours = total_min // 60
        mins = total_min % 60
        return f"{hours}h {mins:02d}m"
    except (ValueError, TypeError):
        return "1h 30m"


def tradewind_to_ts(route_key: str, flights: list[dict]) -> list[str]:
    """Convert Tradewind flight dicts to TypeScript entry lines."""
    fr, to = route_key.split("-")
    prefix = f"tw-{fr.lower()}-{to.lower()}"
    lines = []

    for i, fl in enumerate(flights, 1):
        dep = fl.get("departure_time", "")
        arr = fl.get("arrival_time", "")
        dur = fl.get("duration", "1h 05m")
        price = fl.get("price_numeric", 0)
        date = fl.get("date_iso", "")
        price_str = str(int(price)) if price == int(price) else str(price)

        line = (
            f"    {{ id:'{prefix}-{i}', airline:'Tradewind', "
            f"dep:'{dep}', arr:'{arr}', dc:'{fr}', ac:'{to}', "
            f"dur:'{dur}', price:{price_str}, craft:'{TRADEWIND_CRAFT}', "
            f"seats:{TRADEWIND_SEATS}, amen:{TRADEWIND_AMEN}, "
            f"link:'{TRADEWIND_LINK}', date:'{date}' }},"
        )
        lines.append(line)

    return lines


def bark_to_ts(route_key: str, flights: list[dict]) -> list[str]:
    """Convert BARK Air flight dicts to TypeScript entry lines."""
    fr, to = route_key.split("-")
    prefix = f"bark-{fr.lower()}-{to.lower()}"
    dur = BARK_DURATIONS.get(route_key, "5h 00m")
    lines = []

    for i, fl in enumerate(flights, 1):
        takeoff = fl.get("takeoff", "9:00 AM")
        # Calculate arrival from takeoff + duration
        arr = _calc_arrival(takeoff, dur, fr, to)
        price_raw = fl.get("price", "$6725")
        price = int(float(str(price_raw).replace("$", "").replace(",", "")))
        date = fl.get("date", "")
        seats = fl.get("tickets_remaining", 5) or 5

        line = (
            f"    {{ id:'{prefix}-{i}', airline:'BARK Air', "
            f"dep:'{takeoff}', arr:'{arr}', dc:'{fr}', ac:'{to}', "
            f"dur:'{dur}', price:{price}, craft:'{BARK_CRAFT}', "
            f"seats:{seats}, amen:{BARK_AMEN}, "
            f"link:'{BARK_LINK}', date:'{date}' }},"
        )
        lines.append(line)

    return lines


def _calc_arrival(takeoff: str, dur: str, origin: str, dest: str) -> str:
    """Calculate arrival time from takeoff + duration + timezone offset."""
    import re as _re
    # Parse takeoff time
    m = _re.match(r'(\d{1,2}):(\d{2})\s*(AM|PM)', takeoff, _re.IGNORECASE)
    if not m:
        return takeoff
    h, mn, ampm = int(m.group(1)), int(m.group(2)), m.group(3).upper()
    if ampm == 'PM' and h != 12:
        h += 12
    if ampm == 'AM' and h == 12:
        h = 0

    # Parse duration
    dm = _re.match(r'(\d+)h\s*(\d+)m', dur)
    if not dm:
        return takeoff
    dh, dmn = int(dm.group(1)), int(dm.group(2))

    # Timezone offsets (relative to ET)
    tz = {'HPN': 0, 'FXE': 0, 'VNY': -3, 'SJC': -3, 'KOA': -5}
    offset = tz.get(dest, 0) - tz.get(origin, 0)

    total_min = h * 60 + mn + dh * 60 + dmn + offset * 60
    arr_h = (total_min // 60) % 24
    arr_m = total_min % 60
    arr_ampm = 'AM' if arr_h < 12 else 'PM'
    arr_h12 = arr_h % 12 or 12
    return f"{arr_h12}:{arr_m:02d} {arr_ampm}"


def update_flights_ts(
    jsx_routes: dict[str, list[dict]],
    tradewind_routes: dict[str, list[dict]],
    bark_routes: dict[str, list[dict]],
):
    """Read flights.ts, replace airline entries in route arrays, write back."""
    with open(FLIGHTS_TS, "r") as f:
        content = f.read()

    # Build replacement map: route_key -> (airline_marker, new_lines)
    replacements: list[tuple[str, str, list[str]]] = []

    for route_key, flights in jsx_routes.items():
        ts_lines = jsx_to_ts(route_key, flights)
        if ts_lines:
            replacements.append((route_key, "JSX", ts_lines))

    for route_key, flights in tradewind_routes.items():
        ts_lines = tradewind_to_ts(route_key, flights)
        if ts_lines:
            replacements.append((route_key, "Tradewind", ts_lines))

    for route_key, flights in bark_routes.items():
        ts_lines = bark_to_ts(route_key, flights)
        if ts_lines:
            replacements.append((route_key, "BARK Air", ts_lines))

    if not replacements:
        print("  No replacements to make.")
        return

    # Process the file line by line
    # IMPORTANT: Only process inside the FLIGHTS object, stop at '};'
    # This avoids touching SEASONAL_DATES which has duplicate route keys
    lines = content.split("\n")
    new_lines = []
    i = 0
    inside_flights = False

    while i < len(lines):
        line = lines[i]

        # Track when we enter/exit the FLIGHTS object
        if "export const FLIGHTS" in line:
            inside_flights = True
        elif inside_flights and re.match(r"^\};", line):
            inside_flights = False

        # Only process route arrays inside the FLIGHTS object
        route_match = re.match(r"^\s+'([A-Z]+-[A-Z]+)':\s*\[", line) if inside_flights else None
        if route_match:
            route_key = route_match.group(1)

            # Check if we have replacements for this route
            route_replacements = [
                (airline, ts_lines)
                for rk, airline, ts_lines in replacements
                if rk == route_key
            ]

            if not route_replacements:
                new_lines.append(line)
                i += 1
                continue

            # We need to process this route array
            # Collect all lines until the closing '],'
            array_lines = [line]  # The opening line
            i += 1
            bracket_depth = 1

            while i < len(lines) and bracket_depth > 0:
                l = lines[i]
                # Count brackets (simple approach for our known format)
                bracket_depth += l.count("[") - l.count("]")
                array_lines.append(l)
                i += 1

            # Now we have the full array. Separate entries by airline.
            # Keep entries NOT belonging to replaced airlines, add new ones.
            airlines_to_replace = {a for a, _ in route_replacements}

            # Parse: first line is opening, last line is closing
            opening = array_lines[0]
            closing = array_lines[-1]
            existing_entries = array_lines[1:-1]

            # Filter out entries from airlines we're replacing
            kept_entries = []
            for entry in existing_entries:
                skip = False
                for airline in airlines_to_replace:
                    if f"airline:'{airline}'" in entry:
                        skip = True
                        break
                if not skip:
                    kept_entries.append(entry)

            # Build new array
            new_lines.append(opening)

            # Add kept entries first (other airlines)
            for entry in kept_entries:
                new_lines.append(entry)

            # Add new entries for each replaced airline
            for airline, ts_lines in route_replacements:
                for ts_line in ts_lines:
                    new_lines.append(ts_line)

            new_lines.append(closing)
            continue

        new_lines.append(line)
        i += 1

    # Write back
    with open(FLIGHTS_TS, "w") as f:
        f.write("\n".join(new_lines))


def main():
    print("=" * 60)
    print("Aviato Flight Data Updater")
    print("=" * 60)

    # Load scraped data
    script_dir = os.path.dirname(__file__)
    jsx_json = os.path.join(script_dir, "jsx_flights.json")
    tw_json = os.path.join(script_dir, "tradewind_flights.json")
    bark_json = os.path.join(script_dir, "bark_air_flights.json")

    print("\nLoading JSX data...")
    jsx_routes = load_jsx_flights(jsx_json)
    for route, flights in sorted(jsx_routes.items()):
        print(f"  {route}: {len(flights)} flights")

    print("\nLoading Tradewind data...")
    tw_routes = load_tradewind_flights(tw_json)
    for route, flights in sorted(tw_routes.items()):
        print(f"  {route}: {len(flights)} flights")

    print("\nLoading BARK Air data...")
    bark_routes = load_bark_flights(bark_json)
    for route, flights in sorted(bark_routes.items()):
        print(f"  {route}: {len(flights)} flights")

    if not jsx_routes and not tw_routes and not bark_routes:
        print("\nNo data to update. Exiting.")
        sys.exit(0)

    print(f"\nUpdating {FLIGHTS_TS}...")
    update_flights_ts(jsx_routes, tw_routes, bark_routes)

    # Count total entries written
    total = sum(len(f) for f in jsx_routes.values()) + sum(len(f) for f in tw_routes.values()) + sum(len(f) for f in bark_routes.values())
    n_routes = len(jsx_routes) + len(tw_routes) + len(bark_routes)
    print(f"\nDone! Replaced {total} flight entries across {n_routes} routes.")


if __name__ == "__main__":
    main()
