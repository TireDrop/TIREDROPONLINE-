#!/usr/bin/env python3
"""Rebuild the self-hosted web fonts in src/fonts/ from the fontsource packages.

    npm install            # fetches @fontsource-variable/archivo and /instrument-sans (dev only)
    pip install fonttools brotli
    python3 scripts/subset-fonts.py

Both fonts are SIL OFL 1.1 (the fontsource packages carry the licence files).
Each file is cut down twice, from the full latin variable font fontsource ships:

  - axes limited to the ranges the site uses: Archivo wght 500-900 and
    wdth 100-125, Instrument Sans wght 400-700 (italic 400-600). The wght and
    wdth axes stay variable, so any weight or width in range still works.
  - glyphs limited to the set below: Basic Latin, Latin-1, the typographic
    punctuation, arrows and symbols the copy uses. Anything else falls through
    to the system font, as it did with Google's `latin` subset. KEEP THIS LIST
    IN SYNC with the unicode-range in src/index.css.

Vite fingerprints the output (dist/assets/*.woff2), so a changed file is a new
URL and the long cache in vercel.json never serves a stale font.
"""
import os
import sys

try:
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
    from fontTools import subset
except ImportError:
    sys.exit("pip install fonttools brotli")

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
NM = os.path.join(ROOT, "node_modules", "@fontsource-variable")
OUT = os.path.join(ROOT, "src", "fonts")

UNICODES = (
    "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DC,U+2013-2014,"
    "U+2018-201E,U+2020-2022,U+2026,U+2030,U+2032-2033,U+2039-203A,U+20AC,"
    "U+2122,U+2190-2193,U+2212"
)

FONTS = [
    ("archivo", "archivo-latin-wdth-normal.woff2", "archivo-latin-wdth-wght.woff2",
     {"wght": (500, 900), "wdth": (100, 125)}),
    ("instrument-sans", "instrument-sans-latin-wght-normal.woff2", "instrument-sans-latin-normal.woff2",
     {"wght": (400, 700)}),
    ("instrument-sans", "instrument-sans-latin-wght-italic.woff2", "instrument-sans-latin-italic.woff2",
     {"wght": (400, 600)}),
]

os.makedirs(OUT, exist_ok=True)
total = 0
for pkg, src, dst, limits in FONTS:
    font = instancer.instantiateVariableFont(
        TTFont(os.path.join(NM, pkg, "files", src)), limits
    )
    opts = subset.Options()
    opts.layout_features = ["*"]
    opts.name_IDs = [0, 1, 2, 13, 14]  # keep the copyright and OFL notices
    opts.hinting = False
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=subset.parse_unicodes(UNICODES))
    sub.subset(font)
    font.flavor = "woff2"
    path = os.path.join(OUT, dst)
    font.save(path)
    size = os.path.getsize(path)
    total += size
    print(f"{dst}: {size} bytes")
print(f"total: {total} bytes")
