# Fohm AI quotes

Client quotes in the Fohm AI brand (paper, signal orange, DM Sans, the logo from `brand/svg`).

| File | What |
| --- | --- |
| `quotes.mjs` | Each quote as data: who it's for, scope, exclusions, price lines, terms |
| `build.mjs` | Lays each quote out as a branded HTML page and renders it to a paginated A4 PDF, with the logo, page numbers and contact line in the footer |
| `build-docx.mjs` | Builds each quote as an editable Word file, DM Sans embedded from `fonts/` (OFL) |
| `build-artifact.mjs`, `artifact/` | Builds each quote as a claude.ai artifact page whose copy is edited in place (Edit, Save republishes the page; Download PDF exports it). Publish with capabilities `{artifact: {}, downloads: true}` |
| `dist/` | The built HTML, PDFs and Word files |

```bash
NODE_PATH=$(npm root -g) node quotes/build.mjs        # HTML + PDF, needs playwright
NODE_PATH=$(npm root -g) node quotes/build-docx.mjs   # Word, needs docx
```

The wording is kept in step with the Docs versions on claude.ai.
