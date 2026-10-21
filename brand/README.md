# ION Consulting brand kit

The logo is **ION** in Gloock with a solid **charge dot** at its top right (an ion is an atom
with a charge). It shares the website's design language: paper background, one signal-orange
ink, Gloock for display and Inter Tight for everything else.

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
| Night | `#111315` |

## Rebuilding

```bash
# fonts (OFL, Google Fonts) into brand/.fonts: Gloock-Regular.ttf and InterTight-{300,500,600}.ttf,
# the static weights made from InterTight[wght].ttf with fontTools' instancer
pip install fonttools uharfbuzz
python3 brand/build.py            # SVGs
node brand/render.mjs             # PNGs (needs playwright)
brand/sync.sh                     # copies the kit to web/public/brand
```

The website's favicon (`web/src/app/icon.svg`), Apple icon and social image
(`web/src/app/opengraph-image.png`, `twitter-image.png`) are copies of
`ion-monogram-signal-on-paper.svg`, `ion-app-icon-180.png` and `ion-og-image.png`.
