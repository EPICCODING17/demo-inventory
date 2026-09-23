# Demo Inventory — draft

Static, read-only catalog built from the inventory and recheck workbooks and the supplied photo workbooks. Open `index.html` in a browser, or publish this directory with GitHub Pages. The page uses HTML, CSS, vanilla JavaScript, Tailwind CSS CDN, and the Prompt font. It can display and search the included snapshot without a server. Equipment photos are bundled locally in `photos/`. CDN styling and font require internet access; core layout has local CSS.

## Features

- Cards for 86 equipment groups; drill into 181 subitems. One additional DS-3000 unit (Asset 41-020) comes from the photo book and `All List`; it is separate from DS-3104 (Asset 41-024).
- A separate VW-3100 demo kit with 23 checklist items and 5 photographs. Its table has no checked status. S/N 250701285T was read from the label photograph; the table's serial field is blank.
- 98 equipment photos in 17 groups. Card previews, detail galleries, image enlargement, and an image filter.
- Search group and subitem names, models, serial numbers, asset numbers, owner, and location.
- Filter by year/group, status, and owner; mobile layout and keyboard shortcut `/` for search.
- Original worksheet and row are included in details. Ledger status and inspection status remain separate.

## Data refresh

1. Place the two inventory Excel files, `DemoUnit Pic  Update 2023.11.08.xlsx`, and `VW-3100 Demo-unit List.xlsx` in a sibling `upload/` directory (relative to this project).
2. Run `python build_data.py`, `python attach_photos.py`, then `python attach_vw3100.py` (requires `openpyxl` and `Pillow`). Run in this order once per refresh. The picture books from 2017 and 2023 have identical embedded photos; use only the 2023 copy.
3. Commit `data/inventory.json`, `data/inventory.js`, and `photos/`.

The builder excludes blank 2024/2025 sheets, groups decimal subitem numbers under their integer parent, and matches inspection data using the section and group number. Photo matching uses verified model/serial/asset relations; the picture book's 2016 numbering does not match the main ledger. Matching remains a draft and should be reviewed against the source workbooks before operational use. The check sheet has 2023–2024 dates in its headers even though the filename says 2025. A public GitHub repository exposes the inventory, serial numbers, and equipment photos to anyone; use a private repository unless the records are approved for publication.
