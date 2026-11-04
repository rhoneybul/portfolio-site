# Fohm AI quotes

Client quotes in the Fohm AI brand (paper, signal orange, DM Sans, the logo from `brand/svg`).

| File | What |
| --- | --- |
| `quotes.mjs` | Each quote as data: who it's for, scope, exclusions, price lines, terms |
| `build.mjs` | Lays each quote out as a two-page A4 HTML page and renders it to PDF |
| `dist/` | The built HTML and PDFs |

```bash
NODE_PATH=$(npm root -g) node quotes/build.mjs   # needs playwright
```

The build fails if either page of a quote overflows A4.
