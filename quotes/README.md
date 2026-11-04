# Fohm AI quotes

Client quotes in the Fohm AI brand (paper, signal orange, DM Sans, the logo from `brand/svg`).

| File | What |
| --- | --- |
| `quotes.mjs` | Each quote as data: who it's for, scope, exclusions, price lines, terms |
| `build.mjs` | Lays each quote out as a branded HTML page and renders it to a paginated A4 PDF, with the logo, page numbers and contact line in the footer |
| `dist/` | The built HTML and PDFs |

```bash
NODE_PATH=$(npm root -g) node quotes/build.mjs   # needs playwright
```

The wording is kept in step with the Docs versions on claude.ai. Bracketed values (addresses, company and VAT numbers, bank details) are placeholders to fill in before sending.
