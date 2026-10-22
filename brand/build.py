"""Generate Olaz AI brand assets as SVG, with all type converted to outlines.

Fonts (OFL, from Google Fonts) are read from brand/.fonts: Gloock-Regular.ttf and static
Inter Tight instances InterTight-300/500/600.ttf (see README.md). Run: python3 brand/build.py
"""

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
NIGHT = '#111315'

DISPLAY = 'Gloock-Regular.ttf'
MARK = 'OLAZ'  # the wordmark: ola, Spanish for wave
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


def svg(w, h, body, bg=None, title='Olaz AI'):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:g}" width="{w:g}" height="{h:g}">'
        f'<title>{title}</title>{rect}{body}</svg>\n'
    )


# ---------- The mark ----------
# "OLAZ" in Gloock (ola: Spanish for wave) at the waterline: solid above a gentle wave, tinted below.
# The same dot is the brand's status dot on the website.


def sine(xa, xb, y, amp, crests):
    """A smooth sine-like wave from xa to xb centred on y, drawn with cubic curves."""
    seg = (xb - xa) / (crests * 2)
    k = seg * 0.3642  # control-point offset that approximates a sine half-period
    d, x = f'M{xa:.2f} {y:.2f}', xa
    for i in range(crests * 2):
        py = y - amp if i % 2 == 0 else y + amp
        d += f' C{x + k:.2f} {py:.2f} {x + seg - k:.2f} {py:.2f} {x + seg:.2f} {y:.2f}'
        x += seg
    return d


_clip_ids = iter(range(1, 10_000))


def wordmark(x, baseline, size, color, water=None):
    """OLAZ at the waterline: above a gentle wave the letters are solid, below it they sit
    in the water as a pale tint (of `water`, else the letter colour).

    Returns (svg, bounds) with bounds as (x0, top, x1, baseline)."""
    path, _ = text(DISPLAY, MARK, size, x, baseline, color, tracking=-0.01)
    x0, _, x1, cap = ink_bounds(DISPLAY, MARK, size, tracking=-0.01)
    left, right = x + x0, x + x1
    pad = size * 0.2
    line = sine(left - pad, right + pad, baseline - cap * 0.3, size * 0.045, 2)
    n = next(_clip_ids)
    above = f'{line} L{right + pad:.2f} {baseline - cap - pad:.2f} L{left - pad:.2f} {baseline - cap - pad:.2f} Z'
    below = f'{line} L{right + pad:.2f} {baseline + pad:.2f} L{left - pad:.2f} {baseline + pad:.2f} Z'
    under = text(DISPLAY, MARK, size, x, baseline, water or color, tracking=-0.01)[0].replace('<path ', '<path fill-opacity=".3" ')
    body = (
        f'<defs><clipPath id="up{n}"><path d="{above}"/></clipPath>'
        f'<clipPath id="dn{n}"><path d="{below}"/></clipPath></defs>'
        f'<g clip-path="url(#up{n})">{path}</g><g clip-path="url(#dn{n})">{under}</g>'
    )
    return body, (left, baseline - cap, right, baseline)


def logo_wordmark(color, bg=None, water=None):
    size, pad = 200, 24
    _, (x0, top, x1, base) = wordmark(0, 0, size, color)
    w, h = x1 - x0 + pad * 2, base - top + pad * 2
    body, _ = wordmark(pad - x0, pad - top, size, color, water)
    return svg(w, h, body, bg)


def logo_stacked(color, bg=None, sub=None, water=None):
    """OLAZ over AI."""
    size, pad = 200, 28
    _, (x0, top, x1, base) = wordmark(0, 0, size, color)
    sub_size = size * 0.34
    gap = size * 0.1
    sub_cap = cap_height(SEMIBOLD, sub_size)
    w = x1 - x0 + pad * 2
    h = (base - top) + gap + sub_cap + pad * 2
    body, _ = wordmark(pad - x0, pad - top, size, color, water)
    word_left = pad - x0 + ink_bounds(DISPLAY, MARK, size, -0.01)[0]
    sub_path, _ = text(SEMIBOLD, 'AI', sub_size, word_left, pad + (base - top) + gap + sub_cap, sub or color, 0.04)
    return svg(w, h, body + sub_path, bg)


def logo_horizontal(color, bg=None, sub=None, water=None):
    """OLAZ | AI on one line."""
    size, pad = 200, 28
    _, (x0, top, x1, base) = wordmark(0, 0, size, color)
    ion_h = base - top
    sub_size = size * 0.4
    gap = size * 0.16
    rule_x = pad + (x1 - x0) + gap
    sub_x = rule_x + gap
    _, sub_w = shape(SEMIBOLD, 'AI', sub_size, 0.04)
    w = sub_x + sub_w + pad
    h = ion_h + pad * 2
    body, _ = wordmark(pad - x0, pad - top, size, color, water)
    rule = f'<rect x="{rule_x:.2f}" y="{pad:.2f}" width="{size * 0.012:.2f}" height="{-top:.2f}" fill="{sub or color}"/>'
    sub_cap = cap_height(SEMIBOLD, sub_size)
    cap_h = -top
    sub_path, _ = text(SEMIBOLD, 'AI', sub_size, sub_x, pad + cap_h / 2 + sub_cap / 2, sub or color, 0.04)
    return svg(w, h, body + rule + sub_path, bg)


def icon(fg, bg, rounded=False, size=512, fill=0.74):
    """The logo, OLAZ at its waterline, centred in a square: favicons, avatars, app icons."""
    _, (x0, top, x1, base) = wordmark(0, 0, 100, fg)
    scale = size * fill / (x1 - x0)
    w, h = (x1 - x0) * scale, (base - top) * scale
    left = (size - w) / 2 - x0 * scale
    baseline = (size + h) / 2
    mark, _ = wordmark(left, baseline, 100 * scale, fg)
    rx = size * 0.18 if rounded else 0
    return svg(size, size, f'<rect width="{size}" height="{size}" rx="{rx:g}" fill="{bg}"/>{mark}')


# ---------- Applications ----------


def label(x, y, s, size, color, weight=SEMIBOLD, tracking=0.02, anchor='start'):
    return text(weight, s.upper(), size, x, y, color, tracking, anchor)[0]


def dot(cx, cy, r, color):
    return f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}" fill="{color}"/>'


def og_image(bg=PAPER, fg=SIGNAL):
    W, H, m = 1200, 630, 64
    b = dot(m + 9, m + 9, 9, fg)
    b += label(m + 28, m + 16, 'Olaz AI', 22, fg)
    b += label(m, m + 46, 'Rob Honeybul · London', 22, fg, MEDIUM)
    b += label(W - m, m + 16, 'Technical leadership', 22, fg, MEDIUM, anchor='end')
    b += label(W - m, m + 46, '& AI engineering', 22, fg, MEDIUM, anchor='end')
    mark, _ = wordmark(m + 26, 420, 290, fg)
    b += mark
    b += label(m, H - m, 'Free 30-minute intro call', 22, fg)
    b += label(W - m, H - m, 'Fractional CTO · AI strategy · Platforms', 22, fg, MEDIUM, anchor='end')
    return svg(W, H, b, bg)


def linkedin_banner():
    # LinkedIn's profile photo covers the lower left, so the type sits right.
    W, H, m = 1584, 396, 56
    b = ''
    mark, (x0, top, x1, base) = wordmark(0, 0, 250, SIGNAL)
    mw = x1 - x0
    mark, _ = wordmark(W - m - mw - x0, 66 - top, 250, SIGNAL)
    b += mark
    tag, tw = text(LIGHT, 'TECHNICAL LEADERSHIP & AI ENGINEERING', 40, 0, 0, SIGNAL, -0.01)
    b += text(LIGHT, 'TECHNICAL LEADERSHIP & AI ENGINEERING', 40, W - m, 66 + (base - top) + 64, SIGNAL, -0.01, 'end')[0]
    b += dot(W - m - 9, 40, 8, SIGNAL)
    b += label(W - m - 26, 47, 'Olaz AI · London · Free 30-minute intro call', 18, SIGNAL, anchor='end')
    return svg(W, H, b, PAPER)


def card_front():
    # 85 x 55 mm at 10 units per mm
    W, H, m = 850, 550, 50
    b = dot(m + 7, m + 7, 7, SIGNAL)
    b += label(m + 22, m + 13, 'Rob Honeybul', 18, SIGNAL)
    b += label(m, m + 38, 'Director, Olaz AI', 18, SIGNAL, MEDIUM)
    b += label(m, m + 63, 'Technical leadership & AI engineering', 18, SIGNAL, MEDIUM)
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
        'olaz-wordmark-signal.svg': logo_wordmark(SIGNAL),
        'olaz-wordmark-ink.svg': logo_wordmark(INK, water=SIGNAL),
        'olaz-wordmark-paper.svg': logo_wordmark(PAPER),
        'olaz-logo-stacked-signal.svg': logo_stacked(SIGNAL),
        'olaz-logo-stacked-ink.svg': logo_stacked(INK, sub=INK, water=SIGNAL),
        'olaz-logo-stacked-paper.svg': logo_stacked(PAPER),
        'olaz-logo-horizontal-signal.svg': logo_horizontal(SIGNAL),
        'olaz-logo-horizontal-ink.svg': logo_horizontal(INK, water=SIGNAL),
        'olaz-logo-horizontal-paper.svg': logo_horizontal(PAPER),
        # icons: the logo in a square
        'olaz-icon-signal-on-paper.svg': icon(SIGNAL, PAPER),
        'olaz-icon-paper-on-signal.svg': icon(PAPER, SIGNAL),
        'olaz-icon-signal-on-night.svg': icon(SIGNAL, NIGHT),
        'olaz-favicon.svg': icon(SIGNAL, PAPER, fill=0.9),
        'olaz-app-icon.svg': icon(PAPER, SIGNAL, rounded=True),
        'olaz-linkedin-avatar.svg': icon(PAPER, SIGNAL, size=400, fill=0.62),
        # applications
        'olaz-og-image.svg': og_image(),
        'olaz-og-image-night.svg': og_image(NIGHT, SIGNAL),
        'olaz-linkedin-banner.svg': linkedin_banner(),
        'olaz-business-card-front.svg': card_front(),
        'olaz-business-card-back.svg': card_back(),
    }
    for name, content in files.items():
        (OUT / name).write_text(content)
    print(f'wrote {len(files)} SVGs to {OUT}')


if __name__ == '__main__':
    build()
