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
from datetime import datetime, timedelta
from pathlib import Path


def _parse_date_to_iso(date_str: str) -> str:
    """Convert various date formats to ISO YYYY-MM-DD."""
    if not date_str:
        return ""
    # Already ISO?
    if re.match(r"^\d{4}-\d{2}-\d{2}$", date_str.strip()):
        return date_str.strip()
    # Try common formats: "April 06, 2026", "Apr 06, 2026", "06 Apr 2026", etc.
    for fmt in ["%B %d, %Y", "%b %d, %Y", "%d %B %Y", "%d %b %Y", "%m/%d/%Y"]:
        try:
            return datetime.strptime(date_str.strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return date_str.strip()

FLIGHTS_TS = Path(__file__).parent.parent / "app" / "data" / "flights.ts"

# ── JSX config ────────────────────────────────────────────────────────
JSX_ROUTES = [
    # LA area to Las Vegas
    "BUR-LAS", "LAS-BUR", "SMO-LAS", "LAS-SMO", "SNA-LAS", "LAS-SNA",
    "LAX-LAS", "LAS-LAX",
    # LA area to Scottsdale
    "SMO-SCF", "SCF-SMO", "SNA-SCF", "SCF-SNA", "BUR-SCF", "SCF-BUR",
    # LA area to Bay Area
    "BUR-CCR", "CCR-BUR", "BUR-OAK", "OAK-BUR", "SNA-OAK", "OAK-SNA",
    # LA area to Reno / SLC
    "BUR-RNO", "RNO-BUR", "SNA-RNO", "RNO-SNA",
    "BUR-SLC", "SLC-BUR", "SNA-SLC", "SLC-SNA",
    # LA area to Monterey / Napa / Taos / Denver
    "BUR-MRY", "MRY-BUR", "BUR-APC", "APC-BUR",
    "BUR-TSM", "TSM-BUR", "BUR-APA", "APA-BUR",
    # LA area to Carlsbad
    "BUR-CLD", "CLD-BUR",
    # LA / Cabo (scraper tries both CSW and CSL, normalizes to CSW)
    "LAX-CSW", "CSW-LAX",
    # LA area misc
    "SMO-TRM", "TRM-SMO",
    # Las Vegas to other destinations
    "LAS-SCF", "SCF-LAS", "LAS-OAK", "OAK-LAS",
    "LAS-CLD", "CLD-LAS", "LAS-SLC", "SLC-LAS",
    "LAS-APA", "APA-LAS", "LAS-RNO", "RNO-LAS",
    # Dallas hub
    "DAL-LAS", "LAS-DAL", "DAL-DSI", "DSI-DAL", "DAL-HOU", "HOU-DAL",
    "DAL-OPF", "OPF-DAL", "DAL-CSW", "CSW-DAL",
    "DAL-APA", "APA-DAL", "DAL-TSM", "TSM-DAL",
    "DAL-SCF", "SCF-DAL", "DAL-BUR", "BUR-DAL",
    "DAL-SAF", "SAF-DAL", "DAL-HOB", "HOB-DAL",
    "DAL-EDC", "EDC-DAL",
    # East Coast
    "HPN-PBI", "PBI-HPN", "HPN-OPF", "OPF-HPN",
    # Scottsdale hub
    "SCF-APA", "APA-SCF", "SCF-SLC", "SLC-SCF", "SCF-CLD", "CLD-SCF",
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

# ── Aero config ──────────────────────────────────────────────────────
AERO_ROUTES = [
    "VNY-LAS", "LAS-VNY", "VNY-ASE", "ASE-VNY", "VNY-SUN", "SUN-VNY",
    "VNY-TRM", "TRM-VNY", "VNY-APC", "APC-VNY", "VNY-SJD", "SJD-VNY",
    "VNY-OGG", "OGG-VNY", "VNY-TEB", "TEB-VNY",
]
AERO_CRAFT = "ERJ-135"
AERO_AMEN = "['WiFi','Gourmet Catering','Champagne']"
AERO_LINK = "aero.com"

# ── BARK Air config ───────────────────────────────────────────────────
BARK_ROUTES = [
    # Domestic
    "HPN-VNY", "VNY-HPN", "HPN-SJC", "SJC-HPN", "VNY-KOA", "KOA-VNY",
    "SEA-HPN", "HPN-SEA",
    # Europe
    "HPN-LTN", "LTN-HPN", "HPN-LBG", "LBG-HPN",
    "HPN-MAD", "MAD-HPN", "HPN-LIS", "LIS-HPN",
    "HPN-BER", "BER-HPN", "HPN-DUB", "DUB-HPN",
    "HPN-ATH", "ATH-HPN", "HPN-ARN", "ARN-HPN",
    # Asia
    "VNY-NRT", "NRT-VNY",
]
BARK_CRAFT = "Bombardier Challenger 601"
BARK_AMEN = "['WiFi','Gourmet Catering','Champagne','Calming Treats','Vet Tech On Board']"
BARK_LINK = "air.bark.co"

BARK_DURATIONS = {
    "HPN-VNY": "5h 30m", "VNY-HPN": "5h 30m",
    "HPN-SJC": "5h 45m", "SJC-HPN": "5h 45m",
    "VNY-KOA": "5h 30m", "KOA-VNY": "5h 30m",
    "SEA-HPN": "5h 15m", "HPN-SEA": "5h 45m",
    "HPN-LTN": "7h 30m", "LTN-HPN": "8h 00m",
    "HPN-LBG": "7h 45m", "LBG-HPN": "8h 15m",
    "HPN-MAD": "8h 00m", "MAD-HPN": "8h 30m",
    "HPN-LIS": "7h 30m", "LIS-HPN": "8h 00m",
    "HPN-BER": "8h 30m", "BER-HPN": "9h 00m",
    "HPN-DUB": "7h 00m", "DUB-HPN": "7h 30m",
    "HPN-ATH": "10h 00m", "ATH-HPN": "10h 30m",
    "HPN-ARN": "8h 30m", "ARN-HPN": "9h 00m",
    "VNY-NRT": "11h 30m", "NRT-VNY": "10h 00m",
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
        routes[key].sort(key=lambda f: (f.get("date_iso") or "", f.get("departure_time") or ""))

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
        routes[key].sort(key=lambda f: (f.get("date") or "", f.get("takeoff") or ""))

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

        price_str = str(round(price))

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


def load_aero_flights(json_path: str) -> dict[str, list[dict]]:
    """Load Aero JSON and group by route key."""
    if not os.path.exists(json_path):
        print(f"  [skip] {json_path} not found")
        return {}

    with open(json_path) as f:
        data = json.load(f)

    flights = data if isinstance(data, list) else data.get("flights", data)

    routes: dict[str, list[dict]] = {}
    for fl in flights:
        origin = fl.get("origin_code", "")
        dest = fl.get("destination_code", "")
        key = f"{origin}-{dest}"
        if key in AERO_ROUTES:
            routes.setdefault(key, []).append(fl)

    for key in routes:
        routes[key].sort(key=lambda f: (f.get("date") or "", f.get("departure_time") or ""))

    return routes


def aero_to_ts(route_key: str, flights: list[dict]) -> list[str]:
    """Convert Aero flight dicts to TypeScript entry lines."""
    fr, to = route_key.split("-")
    prefix = f"aero-{fr.lower()}-{to.lower()}"
    lines = []

    for i, fl in enumerate(flights, 1):
        dep = fl.get("departure_time", "")
        arr = fl.get("arrival_time", "")
        date = fl.get("date", "")
        price = fl.get("price", 0)
        seats = fl.get("available_seats", 4) or 4
        dur_min = fl.get("duration_minutes", 0)

        # Format duration
        if dur_min and dur_min > 0:
            dur = f"{dur_min // 60}h {dur_min % 60:02d}m"
        else:
            dur = "1h 30m"

        price_str = str(int(price)) if isinstance(price, float) and price == int(price) else str(round(price))

        line = (
            f"    {{ id:'{prefix}-{i}', airline:'Aero', "
            f"dep:'{dep}', arr:'{arr}', dc:'{fr}', ac:'{to}', "
            f"dur:'{dur}', price:{price_str}, craft:'{AERO_CRAFT}', "
            f"seats:{seats}, amen:{AERO_AMEN}, "
            f"link:'{AERO_LINK}', date:'{date}' }},"
        )
        lines.append(line)

    return lines


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
        raw_date = fl.get("date", "")
        date = _parse_date_to_iso(raw_date)  # Convert to ISO format
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
    tz = {
        'HPN': 0, 'FXE': 0,
        'VNY': -3, 'SJC': -3, 'KOA': -5, 'SEA': -3,
        # Europe (ahead of ET)
        'LTN': 5, 'LBG': 6, 'MAD': 6, 'LIS': 5,
        'BER': 6, 'DUB': 5, 'ATH': 7, 'ARN': 6,
        # Asia
        'NRT': 14,
    }
    offset = tz.get(dest, 0) - tz.get(origin, 0)

    total_min = h * 60 + mn + dh * 60 + dmn + offset * 60
    arr_h = (total_min // 60) % 24
    arr_m = total_min % 60
    arr_ampm = 'AM' if arr_h < 12 else 'PM'
    arr_h12 = arr_h % 12 or 12
    return f"{arr_h12}:{arr_m:02d} {arr_ampm}"


def _build_new_route_arrays(
    replacements: list[tuple[str, str, list[str]]],
    placed_routes: set[str],
) -> list[str]:
    """Build new route array blocks for routes that don't exist in flights.ts yet."""
    # Group unplaced replacements by route key
    unplaced: dict[str, list[str]] = {}
    for route_key, airline, ts_lines in replacements:
        if route_key not in placed_routes:
            unplaced.setdefault(route_key, []).extend(ts_lines)

    if not unplaced:
        return []

    lines = []
    for route_key in sorted(unplaced.keys()):
        entries = unplaced[route_key]
        print(f"  [NEW] Creating route array '{route_key}' with {len(entries)} flights")
        lines.append(f"  '{route_key}': [")
        for entry in entries:
            lines.append(entry)
        lines.append("  ],")

    return lines


def update_flights_ts(
    jsx_routes: dict[str, list[dict]],
    aero_routes: dict[str, list[dict]],
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

    for route_key, flights in aero_routes.items():
        ts_lines = aero_to_ts(route_key, flights)
        if ts_lines:
            replacements.append((route_key, "Aero", ts_lines))

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

    # Track which route keys have been placed into existing arrays
    placed_routes: set[str] = set()

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
            # Before closing the FLIGHTS object, insert any NEW route arrays
            # that didn't have existing arrays in the file
            new_route_lines = _build_new_route_arrays(replacements, placed_routes)
            if new_route_lines:
                for nrl in new_route_lines:
                    new_lines.append(nrl)
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

            # Mark these routes as placed
            for rk, airline, ts_lines in replacements:
                if rk == route_key:
                    placed_routes.add(rk)

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

    # Now update SEASONAL_DATES for Bark Air and Tradewind routes
    _update_seasonal_dates(bark_routes, tradewind_routes)


def _update_seasonal_dates(
    bark_routes: dict[str, list[dict]],
    tradewind_routes: dict[str, list[dict]],
):
    """Update SEASONAL_DATES in flights.ts for Bark Air and Tradewind routes."""
    # Collect ISO dates per route from Bark Air flights
    bark_dates: dict[str, list[str]] = {}
    for route_key, flights in bark_routes.items():
        dates = set()
        for fl in flights:
            raw_date = fl.get("date", "")
            iso = _parse_date_to_iso(raw_date)
            if iso and re.match(r"\d{4}-\d{2}-\d{2}", iso):
                dates.add(iso)
        if dates:
            bark_dates[route_key] = sorted(dates)

    # Collect ISO dates per route from Tradewind flights
    # SKIP year-round routes (ACK↔HPN) — they should NOT be in SEASONAL_DATES
    # because the calendar should allow picking any date for daily service.
    # Only add seasonal routes (MVY↔HPN: May-Nov only).
    TRADEWIND_YEAR_ROUND = {"ACK-HPN", "HPN-ACK"}
    tw_dates: dict[str, list[str]] = {}
    for route_key, flights in tradewind_routes.items():
        if route_key in TRADEWIND_YEAR_ROUND:
            continue  # Daily service, no date restriction needed
        dates = set()
        for fl in flights:
            iso = fl.get("date_iso", "")
            if iso and re.match(r"\d{4}-\d{2}-\d{2}", iso):
                dates.add(iso)
        if dates:
            tw_dates[route_key] = sorted(dates)

    all_new_dates = {**bark_dates, **tw_dates}

    if not all_new_dates:
        return

    # Read the current file
    with open(FLIGHTS_TS, "r") as f:
        content = f.read()

    # For each route with dates, update or add to SEASONAL_DATES
    for route_key, dates in sorted(all_new_dates.items()):
        dates_str = ",".join(f"'{d}'" for d in dates)
        new_entry = f"  '{route_key}': [{dates_str}],"

        # Check if this route already exists in SEASONAL_DATES
        pattern = rf"  '{re.escape(route_key)}':\s*\[.*?\],"
        if re.search(pattern, content):
            # Replace existing entry
            content = re.sub(pattern, new_entry, content)
            print(f"  [SEASONAL] Updated '{route_key}' ({len(dates)} dates)")
        else:
            # Add new entry before the closing '};' of SEASONAL_DATES
            # Find SEASONAL_DATES closing bracket
            sd_match = re.search(r"(export const SEASONAL_DATES.*?\n)(.*?)(^\};)", content, re.MULTILINE | re.DOTALL)
            if sd_match:
                insertion_point = sd_match.end(2)
                content = content[:insertion_point] + new_entry + "\n" + content[insertion_point:]
                print(f"  [SEASONAL] Added '{route_key}' ({len(dates)} dates)")

    with open(FLIGHTS_TS, "w") as f:
        f.write(content)


def main():
    print("=" * 60)
    print("Aviato Flight Data Updater")
    print("=" * 60)

    # Load scraped data
    script_dir = os.path.dirname(__file__)
    jsx_json = os.path.join(script_dir, "jsx_flights.json")
    aero_json = os.path.join(script_dir, "aero_flights.json")
    tw_json = os.path.join(script_dir, "tradewind_flights.json")
    bark_json = os.path.join(script_dir, "bark_air_flights.json")

    print("\nLoading JSX data...")
    jsx_routes = load_jsx_flights(jsx_json)
    for route, flights in sorted(jsx_routes.items()):
        print(f"  {route}: {len(flights)} flights")

    print("\nLoading Aero data...")
    aero_routes = load_aero_flights(aero_json)
    for route, flights in sorted(aero_routes.items()):
        print(f"  {route}: {len(flights)} flights")

    print("\nLoading Tradewind data...")
    tw_routes = load_tradewind_flights(tw_json)
    for route, flights in sorted(tw_routes.items()):
        print(f"  {route}: {len(flights)} flights")

    print("\nLoading BARK Air data...")
    bark_routes = load_bark_flights(bark_json)
    for route, flights in sorted(bark_routes.items()):
        print(f"  {route}: {len(flights)} flights")

    if not jsx_routes and not aero_routes and not tw_routes and not bark_routes:
        print("\nNo data to update. Exiting.")
        sys.exit(0)

    print(f"\nUpdating {FLIGHTS_TS}...")
    update_flights_ts(jsx_routes, aero_routes, tw_routes, bark_routes)

    # Count total entries written
    all_routes = [jsx_routes, aero_routes, tw_routes, bark_routes]
    total = sum(len(f) for r in all_routes for f in r.values())
    n_routes = sum(len(r) for r in all_routes)
    print(f"\nDone! Replaced {total} flight entries across {n_routes} routes.")


if __name__ == "__main__":
    main()
