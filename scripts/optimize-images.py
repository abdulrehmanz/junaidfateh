#!/usr/bin/env python3
"""Convert photos to web-friendly WebP files.

Usage:
    python3 scripts/optimize-images.py <image-or-folder> [more ...]

Every .jpg/.jpeg/.png found is resized (longest side max 1600px) and saved next
to the original as .webp. Originals are left untouched so you can delete them
once you are happy. Requires Pillow:  pip3 install pillow
"""
import sys
from pathlib import Path

from PIL import Image, ImageOps

MAX_SIDE = 1600
QUALITY = 80


def convert(src: Path) -> None:
    dst = src.with_suffix(".webp")
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGB")
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        im.save(dst, "WEBP", quality=QUALITY, method=6)
    print(f"{src} -> {dst} ({dst.stat().st_size // 1024} KB)")


def main(args):
    if not args:
        print(__doc__)
        return 1
    for arg in args:
        p = Path(arg)
        files = [p] if p.is_file() else [f for f in p.rglob("*") if f.suffix.lower() in (".jpg", ".jpeg", ".png")]
        for f in files:
            convert(f)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
