"""Cut the fox poses out of their magenta background.

Only background that touches the image edge is removed, so pink marks inside the outline stay.
Edge pixels are un-mixed from the background color to remove the magenta fringe.
Output: public/fox/<name>.webp (max 512 px, alpha) and design/fox/cut/<name>.png (full size).
Usage: python3 design/cutout.py
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'fox'
NAMES = 'smile wave point think laugh cheer oops sleep study thumbs surprised sign head'.split()
OUT_WEB = ROOT.parent / 'public' / 'fox'
OUT_FULL = SRC / 'cut'
T_LO, T_HI = 45.0, 110.0  # colour distance: below LO = background, above HI = character


def cut(name: str) -> None:
    rgb = np.asarray(Image.open(SRC / f'{name}.png').convert('RGB')).astype(np.float32)
    h, w, _ = rgb.shape
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.linalg.norm(rgb - bg, axis=2)

    # Background candidates, then keep only the part connected to the image edge.
    cand = Image.fromarray(np.where(dist < T_HI, 255, 0).astype(np.uint8))
    draw = ImageDraw.Draw(cand)
    arr = np.asarray(cand)
    for x, y in [(x, 0) for x in range(0, w, 8)] + [(x, h - 1) for x in range(0, w, 8)] + \
                [(0, y) for y in range(0, h, 8)] + [(w - 1, y) for y in range(0, h, 8)]:
        if cand.getpixel((x, y)) == 255:
            ImageDraw.floodfill(cand, (x, y), 128)
    outside = np.asarray(cand) == 128
    # Pockets enclosed by the outline (between arms, under a raised paw): strong magenta plus a 2 px ring.
    # Blush marks are far from magenta, so they stay.
    core = Image.fromarray(np.where(dist < T_LO, 255, 0).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))
    outside |= np.asarray(core) == 255

    # Alpha: 0 in clear background, ramps up across the anti-aliased edge, 1 inside.
    ramp = np.clip((dist - T_LO) / (T_HI - T_LO), 0, 1)
    alpha = np.where(outside, ramp, 1.0)
    alpha[(dist < T_LO) & outside] = 0
    a = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3))
    alpha = np.asarray(a).astype(np.float32) / 255

    # Un-mix edge colours: C = (P - (1 - a) * B) / a
    safe = np.maximum(alpha, 1e-3)[..., None]
    fg = np.clip((rgb - (1 - alpha[..., None]) * bg) / safe, 0, 255)
    fg = np.where(alpha[..., None] > 0.98, rgb, fg)

    rgba = Image.fromarray(np.dstack([fg, alpha * 255]).astype(np.uint8), 'RGBA')
    box = rgba.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox()
    pad = 16
    rgba = rgba.crop((max(box[0] - pad, 0), max(box[1] - pad, 0), min(box[2] + pad, w), min(box[3] + pad, h)))
    OUT_FULL.mkdir(exist_ok=True)
    rgba.save(OUT_FULL / f'{name}.png')
    small = rgba.copy()
    small.thumbnail((512, 512), Image.LANCZOS)
    OUT_WEB.mkdir(parents=True, exist_ok=True)
    small.save(OUT_WEB / f'{name}.webp', 'WEBP', quality=88, method=6)
    print(f'{name:10s} {small.size} {(OUT_WEB / f"{name}.webp").stat().st_size // 1024} KB')


if __name__ == '__main__':
    for n in NAMES:
        cut(n)
