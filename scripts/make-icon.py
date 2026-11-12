"""Generates the CHARKHTAZ launcher icon (original geometric mark, no text)."""
from PIL import Image, ImageDraw
import os

S = 1024
AMBER = (217, 164, 65, 255)
AMBER_DIM = (217, 164, 65, 150)
INK = (242, 239, 230, 230)
BG = (22, 24, 28, 255)


def draw_mark(round_mask: bool) -> Image.Image:
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if round_mask:
        d.ellipse((0, 0, S - 1, S - 1), fill=BG)
    else:
        r = int(S * 0.22)
        d.rounded_rectangle((0, 0, S - 1, S - 1), radius=r, fill=BG)

    # subtle inner glow ring
    d.ellipse((S * 0.14, S * 0.14, S * 0.86, S * 0.86), outline=(217, 164, 65, 40), width=8)

    cx = cy = S / 2
    outer = S * 0.30
    inner = S * 0.085

    d.ellipse((cx - outer, cy - outer, cx + outer, cy + outer), outline=AMBER, width=int(S * 0.038))
    d.ellipse((cx - inner, cy - inner, cx + inner, cy + inner), fill=AMBER)

    spoke_w = int(S * 0.030)
    for ang in (0, 90, 180, 270):
        import math
        rad = math.radians(ang)
        x1 = cx + math.cos(rad) * outer * 0.42
        y1 = cy + math.sin(rad) * outer * 0.42
        x2 = cx + math.cos(rad) * outer * 0.86
        y2 = cy + math.sin(rad) * outer * 0.86
        d.line((x1, y1, x2, y2), fill=AMBER, width=spoke_w)

    # road dashes under the wheel
    y = S * 0.865
    dash_w = S * 0.075
    gap = S * 0.045
    x = S * 0.11
    while x + dash_w < S * 0.89:
        d.rounded_rectangle((x, y, x + dash_w, y + S * 0.028), radius=S * 0.014, fill=INK)
        x += dash_w + gap

    # thin outer edge so the icon reads on light backgrounds
    if not round_mask:
        r = int(S * 0.22)
        d.rounded_rectangle((0, 0, S - 1, S - 1), radius=r, outline=(255, 255, 255, 26), width=10)

    return img


square = draw_mark(False)
circle = draw_mark(True)

out_dir = "android/app/src/main/res"
sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
for density, px in sizes.items():
    folder = os.path.join(out_dir, f"mipmap-{density}")
    os.makedirs(folder, exist_ok=True)
    square.resize((px, px), Image.LANCZOS).save(os.path.join(folder, "ic_launcher.png"))
    circle.resize((px, px), Image.LANCZOS).save(os.path.join(folder, "ic_launcher_round.png"))

os.makedirs("docs", exist_ok=True)
square.resize((512, 512), Image.LANCZOS).save("docs/app-icon-512.png")
print("icons written")
