"""Renders the installable-app icons from the existing logo.

  python3 scripts/make-app-icons.py

Source: public/brand/tiredrop-full.webp (the full mark, transparent, 440 px).
Every icon is that mark centred on the flat brand ink (#070E1A, the site's
`ink` token and the manifest's background_color), because iOS and Android both
fill transparency with a colour of their own choosing.

  icon-192.png / icon-512.png                 purpose "any": mark at ~82% of the
                                               height, room to breathe but big
                                               enough to read on a home screen
  icon-maskable-192.png / icon-maskable-512.png  purpose "maskable": Android crops
                                               these to a circle, squircle or
                                               teardrop, keeping only the centre
                                               80% circle. The mark's corners are
                                               kept inside that circle (the
                                               bounding box's half-diagonal is
                                               under 0.4 of the canvas width), and the
                                               ink runs to the very edge.
  apple-touch-icon.png (180)                  iOS rounds the corners itself and
                                               rejects transparency; ~80% mark.
"""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "public" / "brand"
INK = (7, 14, 26, 255)

logo = Image.open(BRAND / "tiredrop-full.webp").convert("RGBA")
# Trim fully transparent margins so the fit below is to the artwork itself.
logo = logo.crop(logo.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())


def render(size, mark_height_ratio=None, safe_circle=None):
    """mark_height_ratio: mark height as a share of the canvas. safe_circle:
    instead, the share of the canvas half-width the mark's corners may reach."""
    if safe_circle is not None:
        half_diag = (logo.width ** 2 + logo.height ** 2) ** 0.5 / 2
        scale = safe_circle * (size / 2) / half_diag
    else:
        scale = mark_height_ratio * size / logo.height
    w, h = round(logo.width * scale), round(logo.height * scale)
    mark = logo.resize((w, h), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), INK)
    canvas.alpha_composite(mark, ((size - w) // 2, (size - h) // 2))
    return canvas.convert("RGB")


for size in (192, 512):
    render(size, mark_height_ratio=0.82).save(BRAND / f"icon-{size}.png", optimize=True)
    # Corners land at 0.78 of the half-width: inside the 0.80 the platform keeps.
    render(size, safe_circle=0.78).save(BRAND / f"icon-maskable-{size}.png", optimize=True)
render(180, mark_height_ratio=0.80).save(BRAND / "apple-touch-icon.png", optimize=True)
print("icons written to", BRAND)
