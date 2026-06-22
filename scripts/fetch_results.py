#!/usr/bin/env python3
"""
Fetch MIT Cycling race results from the BikeReg team results page.
Requires: playwright (pip install playwright && playwright install chromium)

Writes: data/race_results_live.json
Run:    python3 scripts/fetch_results.py
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

TEAM_URL = "https://results.bikereg.com/team/40588"
OUTPUT = Path(__file__).parent.parent / "data" / "race_results_live.json"


def fetch_html() -> str:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            ),
            extra_http_headers={"Accept-Language": "en-US,en;q=0.9"},
        )
        page = ctx.new_page()
        page.goto(TEAM_URL, timeout=45_000)
        try:
            page.wait_for_selector("table.datatable1", timeout=45_000)
        except PlaywrightTimeoutError:
            pass  # fall through to the content check below for a clearer error
        page.wait_for_timeout(5_000)
        html = page.content()
        browser.close()
    if "datatable1" not in html:
        raise RuntimeError("Did not receive expected page content — Cloudflare may have blocked the request")
    return html


def strip_tags(html: str) -> str:
    return re.sub(r"<[^>]+>", "", html).strip()


def parse_results(html: str) -> list:
    # The results table is the 4th datatable1 on the page (index 3)
    tables = re.findall(
        r'<table[^>]*class="datatable1"[^>]*>(.*?)</table>',
        html,
        re.DOTALL | re.IGNORECASE,
    )
    if len(tables) < 4:
        raise RuntimeError(f"Expected at least 4 datatable1 tables, found {len(tables)}")

    results_table = tables[3]
    rows = re.findall(r'(<tr[^>]*>.*?</tr>)', results_table, re.DOTALL | re.IGNORECASE)

    results = []
    current_race = ""
    current_date = ""
    current_date_iso = ""

    for row_html in rows:
        if 'class="headerrow"' in row_html:
            # Race header: <h2>Race Name (Mon DD YYYY)</h2>
            h2 = re.search(r'<h2[^>]*>(.*?)</h2>', row_html, re.DOTALL | re.IGNORECASE)
            if not h2:
                continue
            text = strip_tags(h2.group(1))
            # Split "Race Name (Jun 9 2026)" into name and date
            m = re.match(r'^(.*?)\s*\(([^)]+)\)\s*$', text)
            if m:
                current_race = m.group(1).strip()
                current_date = m.group(2).strip()
                try:
                    dt = datetime.strptime(current_date, "%b %d %Y")
                    current_date_iso = dt.strftime("%Y-%m-%d")
                except ValueError:
                    current_date_iso = ""
            else:
                current_race = text
                current_date = ""
                current_date_iso = ""

        elif 'class="datarow' in row_html:
            # Result row: first name | last name | category | place / field
            cells = re.findall(r'<td[^>]*>(.*?)</td>', row_html, re.DOTALL | re.IGNORECASE)
            if len(cells) < 4:
                continue

            first = strip_tags(cells[0])
            last = strip_tags(cells[1])
            category = strip_tags(cells[2])
            place_text = strip_tags(cells[3])  # e.g. "27 / 48"

            place = 0
            field = 0
            pm = re.match(r'(\d+)\s*/\s*(\d+)', place_text)
            if pm:
                place = int(pm.group(1))
                field = int(pm.group(2))

            if place == 999:
                continue

            results.append({
                "date": current_date,
                "date_iso": current_date_iso,
                "race": current_race,
                "race_url": TEAM_URL,
                "rider": f"{first} {last}".strip(),
                "place": place,
                "category": category,
                "finish": f"{place} of {field}" if field else "",
            })

    return results


def result_key(r: dict) -> tuple:
    return (r["date_iso"], r["race"], r["rider"], r["category"])


def main():
    existing = []
    if OUTPUT.exists():
        existing = json.loads(OUTPUT.read_text())

    existing_keys = {result_key(r) for r in existing}

    print("Fetching BikeReg team results page…", file=sys.stderr)
    html = fetch_html()
    print("Parsing results…", file=sys.stderr)
    scraped = parse_results(html)

    new_results = [r for r in scraped if result_key(r) not in existing_keys]

    if not new_results:
        print("No new results.", file=sys.stderr)
        return

    merged = new_results + existing
    OUTPUT.write_text(json.dumps(merged, indent=2, ensure_ascii=False))
    print(f"Added {len(new_results)} new results ({len(merged)} total) to {OUTPUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
