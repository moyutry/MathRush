"""
Dev-only helper: generates all PWA icon PNGs from the project's mathrush.ico.
Not shipped/cached by the app itself - run manually with:
    python generate-icons.py
"""
import os
from PIL import Image, ImageFilter, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC_ICO = os.path.join(PROJECT_ROOT, "mathrush.ico")
OUT_DIR = os.path.abspath(os.path.join(HERE, "..", "icons"))

# Background used behind the maskable icon and as a fallback square bg.
# Matches the default "Colorful" theme's bg color.
BG_COLOR = (230, 245, 255, 255)


def load_source():
    im = Image.open(SRC_ICO)
    im = im.convert("RGBA")
    return im


def upscale(im, size):
    resized = im.resize((size, size), Image.LANCZOS)
    # light unsharp mask to counter upscale softness
    resized = resized.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    return resized


def make_plain(im, size, path):
    out = upscale(im, size)
    out.save(path, "PNG")
    print("wrote", path)


def make_maskable(im, size, path):
    # Safe zone ~80% of canvas, centered, on a solid theme-colored square,
    # per the maskable icon spec (Android adaptive icon masking).
    canvas = Image.new("RGBA", (size, size), BG_COLOR)
    inner = int(size * 0.8)
    icon = upscale(im, inner)
    offset = (size - inner) // 2
    canvas.alpha_composite(icon, (offset, offset))
    canvas.save(path, "PNG")
    print("wrote", path)


def make_favicon_ico(im, path):
    sizes = [16, 32, 48]
    imgs = [upscale(im, s) for s in sizes]
    imgs[0].save(path, format="ICO", sizes=[(s, s) for s in sizes])
    print("wrote", path)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    src = load_source()

    make_plain(src, 192, os.path.join(OUT_DIR, "icon-192.png"))
    make_plain(src, 512, os.path.join(OUT_DIR, "icon-512.png"))
    make_maskable(src, 512, os.path.join(OUT_DIR, "icon-512-maskable.png"))
    make_plain(src, 180, os.path.join(OUT_DIR, "apple-touch-icon-180.png"))
    make_plain(src, 32, os.path.join(OUT_DIR, "favicon-32.png"))
    make_favicon_ico(src, os.path.join(OUT_DIR, "favicon.ico"))

    print("Done. Note: source .ico is only 32x32, so icons above that size are")
    print("upscaled (Lanczos + light unsharp mask). Swap mathrush.ico for a")
    print("higher-res logo later and re-run this script if you want crisper icons.")


if __name__ == "__main__":
    main()
