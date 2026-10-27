#!/usr/bin/env python3
"""Convert the dark-theme CSS files to the soft light (neumorphic) palette.
Usage: soften.py <dark_dir> <out_dir>
Colors are mapped per property class (text / background / border / shadow) by luminance."""
import re, sys, os, glob

HEX = re.compile(r'#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{4}\b|#[0-9a-fA-F]{3}\b')
RGB = re.compile(r'rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)')

def parse_hex(h):
    h = h[1:]
    if len(h) in (3, 4):
        h = ''.join(c * 2 for c in h)
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    a = int(h[6:8], 16) / 255 if len(h) == 8 else 1.0
    return r, g, b, a

def fmt(r, g, b, a):
    r, g, b = [max(0, min(255, int(round(x)))) for x in (r, g, b)]
    if a >= 0.995:
        return '#%02x%02x%02x' % (r, g, b)
    return 'rgba(%d,%d,%d,%.2f)' % (r, g, b, a)

def lum(r, g, b):
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

def sat(r, g, b):
    mx, mn = max(r, g, b), min(r, g, b)
    return 0 if mx == 0 else (mx - mn) / mx

def interp(points, x):
    if x <= points[0][0]:
        return points[0][1]
    for (x0, c0), (x1, c1) in zip(points, points[1:]):
        if x <= x1:
            t = (x - x0) / (x1 - x0)
            return tuple(c0[i] + (c1[i] - c0[i]) * t for i in range(3))
    return points[-1][1]

BG = [(0.0, (234, 240, 249)), (0.07, (234, 240, 249)), (0.12, (246, 249, 253)), (0.20, (255, 255, 255)),
      (0.28, (238, 243, 250)), (0.40, (219, 226, 239)), (0.55, (200, 209, 226))]
TX = [(0.45, (122, 132, 158)), (0.60, (100, 111, 140)), (0.75, (70, 82, 112)), (0.88, (40, 52, 84)), (0.97, (23, 32, 58))]
BORDER = (221, 228, 241)
SHADOW = (112, 130, 172)
INK = (30, 45, 90)

def map_bg(r, g, b, a):
    l, s = lum(r, g, b), sat(r, g, b)
    if s > 0.28 and 0.06 < l < 0.92:
        return r, g, b, a            # colored accent surface
    if a < 0.95 and l < 0.12:
        return r, g, b, a            # dark overlay / scrim
    if a < 0.5 and l > 0.7:
        return INK[0], INK[1], INK[2], a * 0.9   # white veil on dark -> dark veil on light
    if l >= 0.55:
        return r, g, b, a            # already light
    c = interp(BG, l)
    return c[0], c[1], c[2], a

def map_text(r, g, b, a):
    l, s = lum(r, g, b), sat(r, g, b)
    if s > 0.35:
        k = 0.78 if l > 0.55 else 1.0
        return r * k, g * k, b * k, a   # accent text: deepen for contrast
    if l < 0.40:
        return r, g, b, a            # already dark text
    c = interp(TX, l)
    return c[0], c[1], c[2], a

def map_border(r, g, b, a):
    l, s = lum(r, g, b), sat(r, g, b)
    if s > 0.28 and l > 0.1:
        return r, g, b, a
    if l > 0.7 and a < 0.5:
        return INK[0], INK[1], INK[2], a * 0.8
    if l < 0.6:
        return BORDER[0], BORDER[1], BORDER[2], 1.0 if a >= 0.9 else max(a, 0.6)
    return r, g, b, a

def map_shadow(r, g, b, a):
    l, s = lum(r, g, b), sat(r, g, b)
    if s > 0.3 and l > 0.15:
        return r, g, b, a            # colored glow
    if l < 0.25:
        return SHADOW[0], SHADOW[1], SHADOW[2], min(0.55, a * 0.6)
    return r, g, b, a

def recolor(value, fn):
    def h(m):
        r, g, b, a = parse_hex(m.group(0))
        return fmt(*fn(r, g, b, a))
    def rg(m):
        r, g, b = float(m.group(1)), float(m.group(2)), float(m.group(3))
        a = float(m.group(4)) if m.group(4) is not None else 1.0
        return fmt(*fn(r, g, b, a))
    return RGB.sub(rg, HEX.sub(h, value))

TEXT_PROPS = {'color', 'caret-color', 'fill', 'stroke', '-webkit-text-fill-color', 'text-decoration-color'}
BG_PROPS = {'background', 'background-color', 'background-image'}

def has_accent_bg(decls):
    for p, v in decls:
        if p in BG_PROPS:
            if 'url(' in v:
                return True
            for m in HEX.finditer(v):
                r, g, b, a = parse_hex(m.group(0))
                if sat(r, g, b) > 0.28 and 0.06 < lum(r, g, b) < 0.92 and a > 0.4:
                    return True
            for m in RGB.finditer(v):
                r, g, b = float(m.group(1)), float(m.group(2)), float(m.group(3))
                a = float(m.group(4)) if m.group(4) is not None else 1.0
                if sat(r, g, b) > 0.28 and 0.06 < lum(r, g, b) < 0.92 and a > 0.4:
                    return True
    return False

def transform_block(body, selector):
    decls = []
    for part in body.split(';'):
        if ':' not in part:
            decls.append((None, part))
            continue
        p, v = part.split(':', 1)
        decls.append((p.strip().lstrip('‎'), v))
    accent = has_accent_bg([(p, v) for p, v in decls if p])
    out = []
    for p, v in decls:
        if p is None:
            out.append(v)
            continue
        nv = v
        if p in BG_PROPS:
            nv = recolor(v, map_bg)
        elif p in TEXT_PROPS:
            if not accent:
                nv = recolor(v, map_text)
        elif p.startswith('border') or p.startswith('outline'):
            nv = recolor(v, map_border)
        elif p == 'box-shadow':
            nv = recolor(v, map_shadow)
        elif p.startswith('--'):
            name = p.lower()
            if any(k in name for k in ('surface', 'bg', 'panel')):
                nv = recolor(v, map_bg)
            elif any(k in name for k in ('muted', 'text', 'ink', 'fg')):
                nv = recolor(v, map_text)
        out.append(p + ':' + nv)
    return ';'.join(out)

BLOCK = re.compile(r'([^{}]+)\{([^{}]*)\}')

def transform(css):
    def b(m):
        sel, body = m.group(1), m.group(2)
        if sel.strip().startswith('@keyframes') or sel.strip().startswith('@font-face'):
            return m.group(0)
        # keyframe steps look like "0%{...}" inside @keyframes; recolor them as backgrounds/text too
        return sel + '{' + transform_block(body, sel) + '}'
    return BLOCK.sub(b, css)

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    for f in glob.glob(os.path.join(src, '*.css')):
        css = open(f, encoding='utf-8').read()
        open(os.path.join(dst, os.path.basename(f)), 'w', encoding='utf-8').write(transform(css))
        print('softened', os.path.basename(f))
