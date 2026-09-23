# Demo Inventory — draft

Static, read-only catalog built from the two supplied Excel workbooks. Open `index.html` in a browser, or publish this directory with GitHub Pages. The page uses HTML, CSS, vanilla JavaScript, Tailwind CSS CDN, and the Prompt font. It can display and search the included snapshot without a server. CDN styling and font require internet access; core layout has local CSS.

## Features

- Cards for 84 equipment groups; drill into 150 subitems.
- Search group and subitem names, models, serial numbers, asset numbers, owner, and location.
- Filter by year/group, status, and owner; mobile layout and keyboard shortcut `/` for search.
- Original worksheet and row are included in details. Ledger status and inspection status remain separate.

## Data refresh

1. Place the two Excel files in a sibling `upload/` directory (relative to this project).
2. Run `python build_data.py` (requires `openpyxl`).
3. Commit the regenerated `data/inventory.json` and `data/inventory.js`.

The builder excludes blank 2024/2025 sheets, groups decimal subitem numbers under their integer parent, and matches inspection data using the section and group number. Matching is a draft approximation and should be reviewed against the source workbook before operational use. The check sheet has 2023–2024 dates in its headers even though the filename says 2025. A public GitHub repository exposes the inventory and serial numbers to anyone; use a private repository unless the records are approved for publication.
