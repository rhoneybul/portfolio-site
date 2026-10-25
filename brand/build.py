"""Generate Fohm AI brand assets as SVG, with all type converted to outlines.

Fonts (OFL, from Google Fonts) are read from brand/.fonts: DMSans-500/700.ttf and static
Inter Tight instances InterTight-300/500/600.ttf (see README.md). Run: python3 brand/build.py
"""

import math
from functools import lru_cache
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).parent
FONTS = ROOT / '.fonts'
OUT = ROOT / 'svg'

# Palette (matches web/src/app/globals.css)
SIGNAL = '#F4401B'  # signal orange, the one ink of the brand
PAPER = '#F6F6F6'
INK = '#161616'

LOGO = 'DMSans-700.ttf'  # DM Sans Bold, at its largest optical size
LOGO_TRACKING = -0.02
LOGO_SUB = 'DMSans-500.ttf'  # the AI in the lockups
WORD = 'fohm'  # foam, respelled
LIGHT, MEDIUM, SEMIBOLD = 'InterTight-300.ttf', 'InterTight-500.ttf', 'InterTight-600.ttf'


@lru_cache
def _font(name):
    path = str(FONTS / name)
    face = hb.Face(hb.Blob.from_file_path(path))
    tt = TTFont(path)
    return face, hb.Font(face), tt, tt.getGlyphSet(), tt.getGlyphOrder()


def cap_height(name, size):
    face, _, tt, *_ = _font(name)
    return tt['OS/2'].sCapHeight * size / face.upem


def shape(name, text, size, tracking=0.0):
    """Shape text; returns [(glyph, x)] in font units scaled to size, and the advance width."""
    face, font, _, _, order = _font(name)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {'kern': True, 'liga': True})
    scale = size / face.upem
    x, glyphs = 0.0, []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        glyphs.append((order[info.codepoint], x + pos.x_offset * scale))
        x += pos.x_advance * scale + tracking * size
    return glyphs, x - tracking * size if glyphs else 0.0


def text(name, s, size, x, y, fill, tracking=0.0, anchor='start'):
    """SVG <path> for text with its baseline at y. Returns (svg, width)."""
    _, _, _, gs, _ = _font(name)
    face = _font(name)[0]
    scale = size / face.upem
    glyphs, width = shape(name, s, size, tracking)
    if anchor == 'end':
        x -= width
    elif anchor == 'middle':
        x -= width / 2
    pen = SVGPathPen(gs)
    for gname, gx in glyphs:
        gs[gname].draw(TransformPen(pen, (scale, 0, 0, -scale, x + gx, y)))
    return f'<path fill="{fill}" d="{pen.getCommands()}"/>', width


def ink_bounds(name, s, size, tracking=0.0):
    """Tight bounds of the drawn glyphs (xMin, yMin, xMax, yMax), y up, baseline at 0."""
    _, _, _, gs, _ = _font(name)
    scale = size / _font(name)[0].upem
    glyphs, _ = shape(name, s, size, tracking)
    pen = BoundsPen(gs)
    for gname, gx in glyphs:
        gs[gname].draw(TransformPen(pen, (scale, 0, 0, scale, gx, 0)))
    return pen.bounds


def tracking_to_fit(name, s, size, width):
    """Letter-spacing (in em) that makes s exactly `width` wide."""
    _, natural = shape(name, s, size)
    return (width - natural) / (size * (len(s) - 1))


def svg(w, h, body, bg=None, title='Fohm AI'):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:g}" width="{w:g}" height="{h:g}">'
        f'<title>{title}</title>{rect}{body}</svg>\n'
    )


_clip_ids = iter(range(1, 10_000))


# ---------- The symbol ----------
# A round of sea at the waterline: the water solid below a rising swell, clipped to a circle,
# three bubbles lifting off it. Drawn in a 400 box; SYMBOL_BOX is its ink bounds there.


def _swell(u):
    return 0.44 + 0.07 * math.sin(2 * math.pi * u * 0.85) - 0.30 * u ** 2.4


def _symbol_parts():
    x, y, w, h = 56, 56, 288, 288
    pts = [(x + w * i / 80, y + h * _swell(i / 80)) for i in range(81)]
    water = 'M' + ' L'.join(f'{a:.2f} {b:.2f}' for a, b in pts) + f' L{x + w} {y + h + 10} L{x} {y + h + 10} Z'
    ax, ay = x + w * 0.18, y + h * _swell(0.18)
    bubbles = [(ax, ay - 58, 18), (ax + 54, ay - 82, 11), (ax + 96, ay - 58, 7)]
    return water, bubbles


def _symbol_box():
    water, bubbles = _symbol_parts()
    # the water's ink: points of the swell inside the circle, and the circle below them
    inside = [(200 + 144 * math.cos(t), 200 + 144 * math.sin(t)) for t in [i * math.pi / 180 for i in range(360)]]
    xs, ys = [], []
    for px, py in inside:
        u = (px - 56) / 288
        if 0 <= u <= 1 and py >= 56 + 288 * _swell(u):
            xs.append(px); ys.append(py)
    xs += [bx - r for bx, by, r in bubbles] + [bx + r for bx, by, r in bubbles]
    ys += [by - r for bx, by, r in bubbles]
    return min(xs), min(ys), max(xs), max(ys)


SYMBOL_BOX = _symbol_box()


def symbol(x, y, width, color):
    """The symbol with its ink box's top left at (x, y), `width` wide. Returns (svg, height)."""
    x0, y0, x1, y1 = SYMBOL_BOX
    k = width / (x1 - x0)
    water, bubbles = _symbol_parts()
    n = next(_clip_ids)
    dots = ''.join(f'<circle cx="{bx:.2f}" cy="{by:.2f}" r="{r}"/>' for bx, by, r in bubbles)
    body = (f'<g transform="translate({x - x0 * k:.2f} {y - y0 * k:.2f}) scale({k:.5f})" fill="{color}">'
            f'<defs><clipPath id="sym{n}"><circle cx="200" cy="200" r="144"/></clipPath></defs>'
            f'<path clip-path="url(#sym{n})" d="{water}"/>{dots}</g>')
    return body, (y1 - y0) * k


def symbol_at(cx, cy, d, color):
    """The symbol with its circle, diameter d, centred on (cx, cy)."""
    k = d / 288
    water, bubbles = _symbol_parts()
    n = next(_clip_ids)
    dots = ''.join(f'<circle cx="{bx:.2f}" cy="{by:.2f}" r="{r}"/>' for bx, by, r in bubbles)
    return (f'<g transform="translate({cx - 200 * k:.2f} {cy - 200 * k:.2f}) scale({k:.5f})" fill="{color}">'
            f'<defs><clipPath id="sym{n}"><circle cx="200" cy="200" r="144"/></clipPath></defs>'
            f'<path clip-path="url(#sym{n})" d="{water}"/>{dots}</g>')


# ---------- The logo ----------
# fohm in DM Sans Bold, lower case, with the symbol standing in for the o: its bubbles
# rise into the space above the x-height.


def wordmark(x, baseline, size, color, word=WORD):
    """The logo with its baseline at y. Returns (svg, bounds) with bounds as (x0, top, x1, baseline)."""
    glyphs, _ = shape(LOGO, word, size, LOGO_TRACKING)
    o = word.index('o')
    room = size * 0.05  # a little air either side of the symbol
    out = ''
    for j, ch in enumerate(word):
        gx = x + glyphs[j][1] + (room if j == o else 2 * room if j > o else 0)
        if j == o:
            ox0, oy0, ox1, oy1 = ink_bounds(LOGO, ch, size)
            out += symbol_at(gx + (ox0 + ox1) / 2, baseline - (oy0 + oy1) / 2, (oy1 - oy0) * 1.04, color)
        else:
            out += text(LOGO, ch, size, gx, baseline, color)[0]
    x0, _, x1, top = ink_bounds(LOGO, word, size, LOGO_TRACKING)
    return out, (x + x0, baseline - top, x + x1 + 2 * room, baseline)


def logo_symbol(color, bg=None, size=400, fill=0.8):
    x0, y0, x1, y1 = SYMBOL_BOX
    w = size * fill
    h = w * (y1 - y0) / (x1 - x0)
    body, _ = symbol((size - w) / 2, (size - h) / 2, w, color)
    return svg(size, size, body, bg)


def logo_wordmark(color, bg=None, pad=24):
    size = 200
    _, (x0, top, x1, base) = wordmark(0, 0, size, color)
    w, h = x1 - x0 + pad * 2, base - top + pad * 2
    body, _ = wordmark(pad - x0, pad - top, size, color)
    return svg(w, h, body, bg)


def logo_stacked(color, bg=None, sub=None):
    """The logo over AI."""
    size, pad = 200, 28
    _, (x0, top, x1, base) = wordmark(0, 0, size, color)
    sub_size = size * 0.34
    gap = size * 0.1
    sub_cap = cap_height(LOGO_SUB, sub_size)
    w = x1 - x0 + pad * 2
    h = (base - top) + gap + sub_cap + pad * 2
    body, _ = wordmark(pad - x0, pad - top, size, color)
    word_left = pad
    sub_path, _ = text(LOGO_SUB, 'AI', sub_size, word_left, pad + (base - top) + gap + sub_cap, sub or color, 0.04)
    return svg(w, h, body + sub_path, bg)


def logo_horizontal(color, bg=None, sub=None):
    """The logo, a rule, then AI, on one line."""
    size, pad = 200, 28
    _, (x0, top, x1, base) = wordmark(0, 0, size, color)
    ion_h = base - top
    sub_size = size * 0.4
    gap = size * 0.16
    rule_x = pad + (x1 - x0) + gap
    sub_x = rule_x + gap
    _, sub_w = shape(LOGO_SUB, 'AI', sub_size, 0.04)
    w = sub_x + sub_w + pad
    h = ion_h + pad * 2
    body, _ = wordmark(pad - x0, pad - top, size, color)
    rule = f'<rect x="{rule_x:.2f}" y="{pad:.2f}" width="{size * 0.012:.2f}" height="{-top:.2f}" fill="{sub or color}"/>'
    sub_cap = cap_height(LOGO_SUB, sub_size)
    cap_h = -top
    sub_path, _ = text(LOGO_SUB, 'AI', sub_size, sub_x, pad + cap_h / 2 + sub_cap / 2, sub or color, 0.04)
    return svg(w, h, body + rule + sub_path, bg)


def icon(fg, bg, rounded=False, size=512, fill=0.74):
    """The symbol centred in a square: favicons, avatars, app icons."""
    x0, y0, x1, y1 = SYMBOL_BOX
    w = size * fill
    h = w * (y1 - y0) / (x1 - x0)
    mark, _ = symbol((size - w) / 2, (size - h) / 2, w, fg)
    rx = size * 0.18 if rounded else 0
    return svg(size, size, f'<rect width="{size}" height="{size}" rx="{rx:g}" fill="{bg}"/>{mark}')


# ---------- Applications ----------


def label(x, y, s, size, color, weight=SEMIBOLD, tracking=0.02, anchor='start'):
    return text(weight, s.upper(), size, x, y, color, tracking, anchor)[0]


def dot(cx, cy, r, color):
    return f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}" fill="{color}"/>'


def og_image(bg=PAPER, fg=SIGNAL):
    W, H, m = 1200, 630, 64
    b = symbol(m, m - 2, 22, fg)[0]
    b += label(m + 32, m + 16, 'Fohm AI', 22, fg)
    b += label(m, m + 46, 'Rob Honeybul · London', 22, fg, MEDIUM)
    b += label(W - m, m + 16, 'Make your vision', 22, fg, MEDIUM, anchor='end')
    b += label(W - m, m + 46, 'a reality', 22, fg, MEDIUM, anchor='end')
    mark, _ = wordmark(m + 26, 420, 290, fg)
    b += mark
    b += label(m, H - m, 'Free 30-minute intro call', 22, fg)
    b += label(W - m, H - m, 'Ideas to products · AI enablement', 22, fg, MEDIUM, anchor='end')
    return svg(W, H, b, bg)


def linkedin_banner():
    # LinkedIn's profile photo covers the lower left, so the type sits right.
    W, H, m = 1584, 396, 56
    b = ''
    mark, (x0, top, x1, base) = wordmark(0, 0, 250, SIGNAL)
    mw = x1 - x0
    mark, _ = wordmark(W - m - mw - x0, 66 - top, 250, SIGNAL)
    b += mark
    b += text(LIGHT, 'MAKE YOUR VISION A REALITY', 40, W - m, 66 + (base - top) + 64, SIGNAL, -0.01, 'end')[0]
    b += symbol(W - m - 20, 30, 20, SIGNAL)[0]
    b += label(W - m - 30, 47, 'Fohm AI · London · Free 30-minute intro call', 18, SIGNAL, anchor='end')
    return svg(W, H, b, PAPER)


def linkedin_logo(fg, bg, size=400):
    """The whole logo centred in a square, for a LinkedIn company page."""
    _, (x0, top, x1, base) = wordmark(0, 0, 100, fg)
    k = size * 0.72 / (x1 - x0)
    w, h = (x1 - x0) * k, (base - top) * k
    mark, _ = wordmark((size - w) / 2 - x0 * k, (size + h) / 2, 100 * k, fg)
    return svg(size, size, mark, bg)


def linkedin_cover():
    # A company page cover (1128 x 191): the logo square covers the lower left, so the type sits right.
    W, H, m = 1128, 191, 40
    b = text(LIGHT, 'MAKE YOUR VISION A REALITY', 34, W - m, 92, SIGNAL, -0.01, 'end')[0]
    b += label(W - m, 132, 'Ideas to products, fast · AI enablement · Fractional CTO', 15, SIGNAL, MEDIUM, anchor='end')
    return svg(W, H, b, PAPER)


def card_front():
    # 85 x 55 mm at 10 units per mm
    W, H, m = 850, 550, 50
    b = symbol(m - 2, m - 2, 18, SIGNAL)[0]
    b += label(m + 22, m + 13, 'Rob Honeybul', 18, SIGNAL)
    b += label(m, m + 38, 'Director, Fohm AI', 18, SIGNAL, MEDIUM)
    b += label(m, m + 63, 'Make your vision a reality', 18, SIGNAL, MEDIUM)
    mark, _ = wordmark(m + 14, H - m - 200 * 0.16, 200, SIGNAL)
    return svg(W, H, b + mark, PAPER)


def card_back():
    W, H, m = 850, 550, 50
    rows = [
        ('Email', 'honeybulr@gmail.com'),
        ('WhatsApp', '+44 7432 590745'),
        ('LinkedIn', '/in/robert-honeybul'),
        ('Book', 'cal.com/robert-honeybul-priy5n'),
    ]
    b = ''
    y = H - m - (len(rows) - 1) * 52
    for k, v in rows:
        b += label(m, y, k, 17, PAPER, SEMIBOLD, 0.04)
        b += text(MEDIUM, v, 24, W - m, y, PAPER, 0, 'end')[0]
        b += f'<rect x="{m}" y="{y + 16}" width="{W - 2 * m}" height="1.2" fill="{PAPER}" opacity=".35"/>'
        y += 52
    mark, (x0, top, x1, base) = wordmark(0, 0, 120, PAPER)
    mark, _ = wordmark(m - x0, m - top, 120, PAPER)
    b += mark
    b += label(W - m, m + 16, 'Let’s talk', 18, PAPER, anchor='end')
    return svg(W, H, b, SIGNAL)


def build():
    OUT.mkdir(exist_ok=True)
    files = {
        # logos
        'fohm-wordmark-signal.svg': logo_wordmark(SIGNAL),
        'fohm-wordmark-paper.svg': logo_wordmark(PAPER),
        'fohm-wordmark-tight.svg': logo_wordmark(SIGNAL, pad=4),  # edge to edge, for inline use
        'fohm-logo-stacked-signal.svg': logo_stacked(SIGNAL),
        'fohm-logo-stacked-paper.svg': logo_stacked(PAPER),
        'fohm-logo-horizontal-signal.svg': logo_horizontal(SIGNAL),
        'fohm-logo-horizontal-paper.svg': logo_horizontal(PAPER),
        # the symbol, alone and beside the wordmark
        'fohm-symbol-signal.svg': logo_symbol(SIGNAL),
        'fohm-symbol-paper.svg': logo_symbol(PAPER),
        # icons: the symbol in a square
        'fohm-icon-signal-on-paper.svg': icon(SIGNAL, PAPER, fill=0.6),
        'fohm-icon-paper-on-signal.svg': icon(PAPER, SIGNAL, fill=0.6),
        'fohm-favicon.svg': icon(SIGNAL, PAPER, fill=0.86),
        'fohm-app-icon.svg': icon(PAPER, SIGNAL, rounded=True, fill=0.56),
        'fohm-linkedin-avatar.svg': icon(PAPER, SIGNAL, size=400, fill=0.5),
        # applications
        'fohm-og-image.svg': og_image(),
        'fohm-linkedin-banner.svg': linkedin_banner(),
        'fohm-linkedin-logo-paper.svg': linkedin_logo(SIGNAL, PAPER),
        'fohm-linkedin-logo-signal.svg': linkedin_logo(PAPER, SIGNAL),
        'fohm-linkedin-cover.svg': linkedin_cover(),
        'fohm-business-card-front.svg': card_front(),
        'fohm-business-card-back.svg': card_back(),
    }
    for name, content in files.items():
        (OUT / name).write_text(content)
    print(f'wrote {len(files)} SVGs to {OUT}')


if __name__ == '__main__':
    build()
