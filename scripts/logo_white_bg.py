#!/usr/bin/env python3
"""Replace black/dark background with white in the logo. Run from repo root."""
from PIL import Image
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "logo.png")
# Pixels with R,G,B all <= this become white (keeps dark blue/orange)
THRESHOLD = 12

def main():
    if not os.path.isfile(SRC):
        print("Logo not found at public/logo.png")
        return 1
    img = Image.open(SRC).convert("RGB")
    w, h = img.size
    pixels = img.load()
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            if r <= THRESHOLD and g <= THRESHOLD and b <= THRESHOLD:
                pixels[x, y] = (255, 255, 255)
    img.save(SRC, "PNG")
    print("Saved public/logo.png with white background.")
    return 0

if __name__ == "__main__":
    exit(main())
