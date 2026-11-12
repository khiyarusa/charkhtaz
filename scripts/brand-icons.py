#!/usr/bin/env python3
"""Deterministic brand-icon generator for CHARKHTAZ.

The vector emblem in public/brand/ is the single source of truth. This script
rasterises the primary badge with Pillow only (no cairosvg, no network), then
exports the web sizes, the Android launcher PNGs and a QA preview sheet.

Usage
    python scripts/brand-icons.py                 # write every PNG export
    python scripts/brand-icons.py --check         # verify exports exist + sizes
    python scripts/brand-icons.py --preview DIR   # QA contact sheet into DIR

Requires Python 3.11+ and Pillow 10+ (tested: 3.14 / Pillow 13.0). Output is
byte-deterministic: no timestamps, no randomness, fixed shape order.
"""

from __future__ import annotations

import argparse
import math
import os
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SVG_PRIMARY = ROOT / "public" / "brand" / "pumpkin-emblem.svg"
SVG_DARK = ROOT / "public" / "brand" / "pumpkin-emblem-dark.svg"
SVG_LIGHT = ROOT / "public" / "brand" / "pumpkin-emblem-light.svg"
SVG_MONO = ROOT / "public" / "brand" / "pumpkin-emblem-mono.svg"
SVG_FAVICON = ROOT / "public" / "favicon.svg"

VB = 512.0  # every emblem file uses a 512-unit coordinate system
SS = 4  # supersampling factor

WEB_SIZES = (512, 192, 96, 32)
ANDROID = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}
PALETTE = {
    "graphite": "#0D0F13",
    "graphite_raise": "#171B21",
    "pumpkin": "#D2561A",
    "pumpkin_deep": "#9E370C",
    "pumpkin_light": "#E96B27",
    "stem": "#4F7440",
    "stem_deep": "#35502C",
    "cream": "#F2EFE6",
}

NUM = re.compile(r"[MmLlHhVvCcSsQqTtZz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?")
TAG = re.compile(r"\{[^}]*\}")


def _tag(node: ET.Element) -> str:
    return TAG.sub("", node.tag)


def hex_rgba(value: str | None, opacity: float = 1.0) -> tuple[int, int, int, int]:
    if not value or value == "none":
        return (0, 0, 0, 0)
    value = value.strip().lower()
    if value.startswith("#"):
        h = value[1:]
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
        return (r, g, b, round(255 * opacity))
    named = {
        "white": (255, 255, 255),
        "black": (0, 0, 0),
        "currentcolor": (13, 15, 19),
    }
    r, g, b = named.get(value, (0, 0, 0))
    return (r, g, b, round(255 * opacity))


# --------------------------------------------------------------------------- #
# Path parsing and flattening
# --------------------------------------------------------------------------- #

def parse_path(d: str) -> list[list[tuple[float, float]]]:
    """Parse an SVG path into flattened subpaths of absolute points."""
    tokens = NUM.findall(d)
    subpaths: list[list[tuple[float, float]]] = []
    current: list[tuple[float, float]] = []
    x = y = 0.0
    start = (0.0, 0.0)
    cmd = ""
    i = 0

    def num() -> float:
        nonlocal i
        val = float(tokens[i])
        i += 1
        return val

    def curve_to(p1, p2, p3) -> None:
        nonlocal x, y
        p0 = (x, y)
        span = math.dist(p0, p1) + math.dist(p1, p2) + math.dist(p2, p3)
        steps = max(8, min(96, int(span / 2.5)))
        for s in range(1, steps + 1):
            t = s / steps
            u = 1.0 - t
            bx = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]
            by = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
            current.append((bx, by))
        x, y = p3

    while i < len(tokens):
        tok = tokens[i]
        if tok.isalpha():
            cmd = tok
            i += 1
            if cmd in "Zz":
                if current:
                    subpaths.append(current)
                    current = []
                x, y = start
                continue
        elif not cmd:
            raise ValueError("path starts without a command")
        rel = cmd.islower()
        c = cmd.upper()
        ox, oy = (x, y) if rel else (0.0, 0.0)

        if c == "M":
            if current:
                subpaths.append(current)
            x, y = num() + ox, num() + oy
            start = (x, y)
            current = [(x, y)]
            cmd = "l" if rel else "L"
        elif c == "L":
            x, y = num() + ox, num() + oy
            current.append((x, y))
        elif c == "H":
            x = num() + (x if rel else 0.0)
            current.append((x, y))
        elif c == "V":
            y = num() + (y if rel else 0.0)
            current.append((x, y))
        elif c == "C":
            p1 = (num() + ox, num() + oy)
            p2 = (num() + ox, num() + oy)
            p3 = (num() + ox, num() + oy)
            curve_to(p1, p2, p3)
        elif c == "Q":
            q = (num() + ox, num() + oy)
            p3 = (num() + ox, num() + oy)
            curve_to((x + 2 / 3 * (q[0] - x), y + 2 / 3 * (q[1] - y)),
                     (p3[0] + 2 / 3 * (q[0] - p3[0]), p3[1] + 2 / 3 * (q[1] - p3[1])), p3)
        else:
            raise ValueError(f"unsupported path command: {cmd}")

    if current:
        subpaths.append(current)
    return subpaths


def scaled(subpaths, size: int, vb: float = VB) -> list[list[tuple[float, float]]]:
    f = size / vb
    return [[(px * f, py * f) for px, py in sp] for sp in subpaths]


# --------------------------------------------------------------------------- #
# Minimal SVG renderer (paths, rects, ellipses, groups, masks)
# --------------------------------------------------------------------------- #

IDENTITY = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def _mat_mul(m, n):
    a1, b1, c1, d1, e1, f1 = m
    a2, b2, c2, d2, e2, f2 = n
    return (a1 * a2 + c1 * b2, b1 * a2 + d1 * b2,
            a1 * c2 + c1 * d2, b1 * c2 + d1 * d2,
            a1 * e2 + c1 * f2 + e1, b1 * e2 + d1 * f2 + f1)


def _apply(m, x, y):
    a, b, c, d, e, f = m
    return (a * x + c * y + e, b * x + d * y + f)


def _parse_transform(text: str):
    m = IDENTITY
    for name, args in re.findall(r"(matrix|translate|scale|rotate)\(([^)]*)\)", text or ""):
        vals = [float(v) for v in re.split(r"[\s,]+", args.strip()) if v]
        if not vals:
            continue
        if name == "scale":
            sx = vals[0]
            sy = vals[1] if len(vals) > 1 else sx
            t = (sx, 0.0, 0.0, sy, 0.0, 0.0)
        elif name == "translate":
            t = (1.0, 0.0, 0.0, 1.0, vals[0], vals[1] if len(vals) > 1 else 0.0)
        elif name == "rotate":
            a = math.radians(vals[0])
            ca, sa = math.cos(a), math.sin(a)
            cx, cy = (vals[1], vals[2]) if len(vals) > 2 else (0.0, 0.0)
            t = (ca, sa, -sa, ca, cx - ca * cx + sa * cy, cy - sa * cx - ca * cy)
        else:
            t = tuple(vals[:6])
        m = _mat_mul(t, m)
    return m


class Emblem:
    def __init__(self, path: Path):
        self.path = Path(path)
        self.root = ET.parse(self.path).getroot()
        self.viewbox = self._viewbox()
        self.defs = {n.get("id"): n for n in self.root.iter() if n.get("id")}
        self.width = float(self.viewbox.split()[2])
        self.height = float(self.viewbox.split()[3])
        self.scale = 1.0

    def _viewbox(self) -> str:
        vb = self.root.get("viewBox")
        if not vb:
            raise ValueError(f"{self.path.name}: missing viewBox")
        return vb

    # -- public ------------------------------------------------------------- #

    def render(self, size: int, background: str | None = None,
               circle: bool = False, ss: int = SS) -> Image.Image:
        full = size * ss
        self.scale = full / self.width
        canvas = Image.new("RGBA", (full, full), (0, 0, 0, 0))
        if background:
            ImageDraw.Draw(canvas).rectangle((0, 0, full, full), fill=hex_rgba(background))
        for child in self.root:
            if _tag(child) in ("defs", "title", "desc"):
                continue
            self._draw(child, canvas, 1.0, None, 1.0, IDENTITY)
        if circle:
            mask = Image.new("L", (full, full), 0)
            ImageDraw.Draw(mask).ellipse((0, 0, full, full), fill=255)
            canvas.putalpha(ImageChops.multiply(canvas.getchannel("A"), mask))
        return canvas.resize((size, size), Image.LANCZOS)

    # -- drawing ------------------------------------------------------------ #

    def _draw(self, node: ET.Element, target: Image.Image, inherit: float,
              fill_ref: str | None, fill_alpha: float, matrix=IDENTITY) -> None:
        tag = _tag(node)
        opacity = inherit * float(node.get("opacity", 1))
        fill_ref = node.get("fill", fill_ref)
        fill_alpha *= float(node.get("fill-opacity", 1))
        if tag in ("title", "desc", "defs", "mask", "clipPath"):
            return
        if tag == "g":
            matrix = _mat_mul(_parse_transform(node.get("transform", "")), matrix)
            mask_id = node.get("mask", "")
            if mask_id:
                layer = Image.new("RGBA", target.size, (0, 0, 0, 0))
                for child in node:
                    self._draw(child, layer, opacity, fill_ref, fill_alpha, matrix)
                layer.putalpha(ImageChops.multiply(layer.getchannel("A"),
                                                   self._mask(mask_id, matrix)))
                target.alpha_composite(layer)
            else:
                for child in node:
                    self._draw(child, target, opacity, fill_ref, fill_alpha, matrix)
            return
        if tag == "rect":
            self._rect(node, target, opacity * fill_alpha, fill_ref)
        elif tag == "ellipse":
            cx, cy = self._xy(node, "cx", "cy")
            rx, ry = self._xy(node, "rx", "ry")
            colour = hex_rgba(fill_ref, opacity * fill_alpha)
            box = (cx - rx, cy - ry, cx + rx, cy + ry)
            self._solid(target, colour, lambda d, f: d.ellipse(box, fill=f))
        elif tag == "path":
            d = node.get("d", "")
            if not d:
                return
            subs = [[_apply(matrix, x, y) for x, y in sp] for sp in parse_path(d)]
            if (fill_ref or "").startswith("url(#"):
                self._gradient(node, target, opacity * fill_alpha, fill_ref, matrix)
                return
            colour = hex_rgba(fill_ref, opacity * fill_alpha)
            subs = [s for s in scaled(subs, target.width, self.width) if len(s) >= 3]
            self._solid(target, colour, lambda dr, f: [dr.polygon(s, fill=f) for s in subs])

    @staticmethod
    def _solid(target: Image.Image, colour, paint) -> None:
        """Paint through a mask so semi-transparent fills blend correctly."""
        if colour[3] == 0:
            return
        if colour[3] == 255:
            paint(ImageDraw.Draw(target), colour)
            return
        mask = Image.new("L", target.size, 0)
        paint(ImageDraw.Draw(mask), 255)
        layer = Image.new("RGBA", target.size, colour[:3] + (255,))
        layer.putalpha(mask.point(lambda v: v * colour[3] // 255))
        target.alpha_composite(layer)

    def _gradient(self, node: ET.Element, target: Image.Image, opacity: float,
                  fill_ref: str | None, matrix=IDENTITY) -> None:
        ref = fill_ref or ""
        ref = ref[ref.find("#") + 1:].rstrip(")")
        grad = self.defs.get(ref)
        if grad is None:
            return
        stops = []
        for stop in grad:
            if _tag(stop) != "stop":
                continue
            offset = float(stop.get("offset", 0))
            colour = hex_rgba(stop.get("stop-color", "#000000"),
                              float(stop.get("stop-opacity", 1)))
            stops.append((offset, colour))
        stops.sort()
        if len(stops) < 2:
            return
        p1 = _apply(matrix, float(grad.get("x1", 0)), float(grad.get("y1", 0)))
        p2 = _apply(matrix, float(grad.get("x2", 1)), float(grad.get("y2", 0)))
        p1 = (p1[0] * self.scale, p1[1] * self.scale)
        p2 = (p2[0] * self.scale, p2[1] * self.scale)
        size = target.size[0]
        mask = Image.new("L", target.size, 0)
        subs = [[_apply(matrix, x, y) for x, y in sp]
                for sp in parse_path(node.get("d", ""))]
        for sub in scaled(subs, size, self.width):
            if len(sub) >= 3:
                ImageDraw.Draw(mask).polygon(sub, fill=255)
        layer = self._grad_image(size, stops, p1, p2, opacity)
        layer.putalpha(ImageChops.multiply(layer.getchannel("A"), mask))
        target.alpha_composite(layer)

    @staticmethod
    def _grad_image(size: int, stops, p1, p2, opacity: float) -> Image.Image:
        """Render a linear gradient at low res, then upscale for smoothness."""
        n = 256
        dx, dy = p2[0] - p1[0], p2[1] - p1[1]
        den = dx * dx + dy * dy or 1.0
        small = Image.new("RGBA", (n, n))
        px = small.load()
        for j in range(n):
            y = (j + 0.5) * size / n
            for i in range(n):
                x = (i + 0.5) * size / n
                t = ((x - p1[0]) * dx + (y - p1[1]) * dy) / den
                t = 0.0 if t < 0 else (1.0 if t > 1 else t)
                lo, hi = stops[0], stops[-1]
                for k in range(len(stops) - 1):
                    if stops[k][0] <= t <= stops[k + 1][0]:
                        lo, hi = stops[k], stops[k + 1]
                        break
                span = hi[0] - lo[0] or 1.0
                f = (t - lo[0]) / span
                r = round(lo[1][0] + (hi[1][0] - lo[1][0]) * f)
                g = round(lo[1][1] + (hi[1][1] - lo[1][1]) * f)
                b = round(lo[1][2] + (hi[1][2] - lo[1][2]) * f)
                a = round(lo[1][3] + (hi[1][3] - lo[1][3]) * f)
                px[i, j] = (r, g, b, a)
        img = small.resize((size, size), Image.BICUBIC)
        if opacity < 1:
            alpha = img.getchannel("A").point(lambda v: round(v * opacity))
            img.putalpha(alpha)
        return img

    def _mask(self, ref: str, matrix=IDENTITY) -> Image.Image:
        mask_id = ref[ref.find("#") + 1:].rstrip(")")
        node = self.defs.get(mask_id)
        if node is None:
            raise KeyError(f"missing mask #{mask_id}")
        out = Image.new("L", (int(self.width * self.scale), int(self.height * self.scale)), 0)
        for child in node:
            if _tag(child) in ("rect", "path"):
                self._paint_mask(child, out, matrix)
        return out

    def _paint_mask(self, node: ET.Element, out: Image.Image, matrix=IDENTITY) -> None:
        fill = hex_rgba(node.get("fill"))
        lum = round(0.2126 * fill[0] + 0.7152 * fill[1] + 0.0722 * fill[2])
        if _tag(node) == "rect" and matrix == IDENTITY:
            x, y = self._xy(node, "x", "y")
            w, h = self._xy(node, "width", "height")
            rx = float(node.get("rx", 0)) * self.scale
            draw = ImageDraw.Draw(out)
            box = (x, y, x + w, y + h)
            if rx > 0:
                draw.rounded_rectangle(box, radius=rx, fill=lum)
            else:
                draw.rectangle(box, fill=lum)
        else:
            subs = [[_apply(matrix, x, y) for x, y in sp]
                    for sp in parse_path(node.get("d", ""))]
            for sub in scaled(subs, out.width, self.width):
                if len(sub) >= 3:
                    ImageDraw.Draw(out).polygon(sub, fill=lum)

    def _rect(self, node: ET.Element, target: Image.Image, opacity: float,
              fill_ref: str | None) -> None:
        x, y = self._xy(node, "x", "y")
        w, h = self._xy(node, "width", "height")
        rx = float(node.get("rx", 0)) * self.scale
        fill = hex_rgba(fill_ref, opacity)
        box = (x, y, x + w, y + h)
        if rx > 0:
            self._solid(target, fill, lambda d, f: d.rounded_rectangle(box, radius=rx, fill=f))
        else:
            self._solid(target, fill, lambda d, f: d.rectangle(box, fill=f))

    def _xy(self, node: ET.Element, a: str, b: str) -> tuple[float, float]:
        return (float(node.get(a, 0)) * self.scale, float(node.get(b, 0)) * self.scale)


def write_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)


def export_web() -> list[Path]:
    emblem = Emblem(SVG_PRIMARY)
    written = []
    for size in WEB_SIZES:
        out = ROOT / "public" / "brand" / f"pumpkin-{size}.png"
        write_png(emblem.render(size), out)
        written.append(out)
    return written


def export_android() -> list[Path]:
    emblem = Emblem(SVG_PRIMARY)
    res = ROOT / "android" / "app" / "src" / "main" / "res"
    written = []
    for density, px in ANDROID.items():
        square = emblem.render(px)
        circle = emblem.render(px, circle=True)
        for name, img in (("ic_launcher.png", square), ("ic_launcher_round.png", circle)):
            out = res / f"mipmap-{density}" / name
            write_png(img, out)
            written.append(out)
    return written


def export_all() -> list[Path]:
    return export_web() + export_android()


def check() -> int:
    expected = [
        (ROOT / "public" / "brand" / f"pumpkin-{s}.png", s, s) for s in WEB_SIZES
    ] + [
        (ROOT / "android" / "app" / "src" / "main" / "res" / f"mipmap-{d}" / n, p, p)
        for d, p in ANDROID.items()
        for n in ("ic_launcher.png", "ic_launcher_round.png")
    ]
    bad = 0
    for path, w, h in expected:
        if not path.exists():
            print(f"MISSING  {path.relative_to(ROOT)}")
            bad += 1
            continue
        with Image.open(path) as im:
            if im.size != (w, h):
                print(f"BAD SIZE {path.relative_to(ROOT)}: {im.size} != {(w, h)}")
                bad += 1
            elif im.mode != "RGBA":
                print(f"BAD MODE {path.relative_to(ROOT)}: {im.mode}")
                bad += 1
    print(f"checked {len(expected)} PNGs, {bad} problem(s)")
    return 1 if bad else 0


# --------------------------------------------------------------------------- #
# QA preview sheet
# --------------------------------------------------------------------------- #

def preview(directory: Path) -> list[Path]:
    directory.mkdir(parents=True, exist_ok=True)
    out = []
    primary = Emblem(SVG_PRIMARY)
    badge = primary.render(512)
    write_png(badge, directory / "01-primary-512.png")
    out.append(directory / "01-primary-512.png")

    write_png(primary.render(512, background=PALETTE["cream"]),
              directory / "02-primary-on-cream.png")
    out.append(directory / "02-primary-on-cream.png")

    for px in (16, 32, 48, 64, 96):
        zoom = primary.render(px).resize((px * 8, px * 8), Image.NEAREST)
        write_png(zoom, directory / f"03-size-{px}-zoom.png")
        out.append(directory / f"03-size-{px}-zoom.png")

    fav = Emblem(SVG_FAVICON)
    for px in (16, 32, 64):
        write_png(fav.render(px).resize((px * 8, px * 8), Image.NEAREST),
                  directory / f"05-favicon-{px}.png")
        out.append(directory / f"05-favicon-{px}.png")

    for label, svg, bg in (
        ("dark", SVG_DARK, "#101318"),
        ("light", SVG_LIGHT, "#FBFAF7"),
        ("mono", SVG_MONO, "#8FA0B4"),
    ):
        doc = Emblem(svg)
        img = doc.render(384, background=bg)
        p = directory / f"04-{label}.png"
        write_png(img, p)
        out.append(p)

    sheet = Image.new("RGBA", (1720, 1180), hex_rgba("#20252C"))
    sheet.alpha_composite(badge, (24, 24))
    sheet.alpha_composite(primary.render(384, background=PALETTE["cream"]), (560, 24))
    sheet.alpha_composite(Emblem(SVG_MONO).render(384, background="#8FA0B4"), (980, 24))
    sheet.alpha_composite(fav.render(384, background="#101318"), (1400, 24))
    for i, px in enumerate((16, 32, 48, 64, 96)):
        img = primary.render(px)
        sheet.alpha_composite(img.resize((px * 4, px * 4), Image.NEAREST),
                              (30 + i * 330, 560))
    for i, px in enumerate((16, 32, 64)):
        img = fav.render(px)
        sheet.alpha_composite(img.resize((px * 8, px * 8), Image.NEAREST),
                              (30 + i * 330, 880))
    path = directory / "00-sheet.png"
    write_png(sheet, path)
    out.append(path)
    return out


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="CHARKHTAZ brand icon generator")
    ap.add_argument("--check", action="store_true", help="verify PNG exports")
    ap.add_argument("--preview", metavar="DIR", help="write a QA sheet into DIR")
    args = ap.parse_args(argv)

    if args.check:
        return check()
    if args.preview:
        files = preview(Path(args.preview))
        print(f"{len(files)} preview file(s) in {args.preview}")
        return 0
    if not SVG_PRIMARY.exists():
        print(f"missing primary SVG: {SVG_PRIMARY}", file=sys.stderr)
        return 2
    files = export_all()
    for p in files:
        print(p.relative_to(ROOT))
    print(f"{len(files)} PNG(s) written")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
