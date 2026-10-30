#!/usr/bin/env python3
"""Генерирует иконку ОбедКласс (launcher, legacy PNG) для APK."""
from PIL import Image, ImageDraw
import os

OUT = "/home/z/my-project/scripts/android/res"
FG = (255, 255, 255, 255)
BG = (234, 88, 12, 255)          # #EA580C
BG_DARK = (194, 65, 12, 255)     # #C2410C

def make_icon(size: int) -> Image.Image:
    S = 4  # суперсемплинг
    px = size * S
    img = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # фон — скруглённый квадрат с вертикальным градиентом
    grad = Image.new("RGBA", (px, px))
    gd = ImageDraw.Draw(grad)
    for y in range(px):
        t = y / px
        c = tuple(int(BG[i] + (BG_DARK[i] - BG[i]) * t) for i in range(4))
        gd.line([(0, y), (px, y)], fill=c)
    mask = Image.new("L", (px, px), 0)
    md = ImageDraw.Draw(mask)
    r = int(px * 0.22)
    md.rounded_rectangle([0, 0, px - 1, px - 1], radius=r, fill=255)
    img.paste(grad, (0, 0), mask)

    cx = px / 2
    # пар — три дуги
    steam_w = max(2, int(px * 0.035))
    for dx, h in ((-0.16, 0.16), (0.0, 0.22), (0.16, 0.16)):
        x0 = cx + dx * px
        top = px * (0.16 + (0.22 - h) / 2)
        d.arc([x0 - px * 0.05, top, x0 + px * 0.05, top + px * 0.16],
              start=300, end=240, fill=FG, width=steam_w)
    # тарелка-полукруг (чаша)
    bw = px * 0.52            # ширина чаши
    bh = px * 0.30            # высота чаши
    bx0, by0 = cx - bw / 2, px * 0.36
    d.pieslice([bx0, by0, bx0 + bw, by0 + bh * 2], start=0, end=180, fill=FG)
    # подставка
    lw = max(2, int(px * 0.045))
    y_base = by0 + bh
    d.line([cx - bw * 0.60, y_base, cx + bw * 0.60, y_base], fill=FG, width=lw)
    d.line([cx - bw * 0.34, y_base + px * 0.055, cx + bw * 0.34, y_base + px * 0.055],
           fill=FG, width=lw)
    return img.resize((size, size), Image.LANCZOS)

sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
for dpi, s in sizes.items():
    pdir = os.path.join(OUT, f"mipmap-{dpi}")
    os.makedirs(pdir, exist_ok=True)
    make_icon(s).save(os.path.join(pdir, "ic_launcher.png"))
    print("ok", dpi, s)
