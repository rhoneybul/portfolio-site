# Fohm AI brand kit

The logo is **fohm** (*foam*, respelled) in DM Sans Bold, lower case, with the **symbol** as its o:
a round of sea, solid below a rising swell, three bubbles lifting off it. The symbol alone is the
icon. Lockups add **AI**. It shares the website's design language: paper background, one
signal-orange ink, and one typeface, DM Sans, for the logo and everything else.

Live guide with downloads: `/brand/index.html` on the website.

| Folder / file | What |
| --- | --- |
| `svg/` | Every asset as SVG, type converted to outlines (no fonts needed) |
| `png/` | The same, rasterised (logos at 2x, icons at their sizes) |
| `index.html` | Brand guidelines: logo, icon, colour, type, applications, usage |
| `email-signature.html` | Email signature; open in a browser, copy, paste into your mail app |
| `build.py` / `render.mjs` / `sync.sh` | Generators (below) |

## Palette

| Name | Hex |
| --- | --- |
| Signal | `#F4401B` |
| Paper | `#F6F6F6` |
| Ink | `#161616` |

## Rebuilding

```bash
# fonts (OFL, Google Fonts) into brand/.fonts, static instances of DMSans[opsz,wght].ttf made with
# fontTools' instancer: DMSans-{500,700}.ttf at opsz 40, DMSans-{300,600}-text.ttf at opsz 14
pip install fonttools uharfbuzz
python3 brand/build.py            # SVGs
node brand/render.mjs             # PNGs (needs playwright)
brand/sync.sh                     # copies the kit to web/public/brand
```

The website's favicon (`web/src/app/icon.svg`), Apple icon and social image
(`web/src/app/opengraph-image.png`, `twitter-image.png`) are copies of
`fohm-favicon.svg`, `fohm-app-icon-180.png` and `fohm-og-image.png`.
