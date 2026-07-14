"""Parse the Lucky 8 catalog PDF into data/catalog.json + public/products/<sku>.<ext>.

Usage: .venv/bin/python scripts/import_catalog.py "<path-to-catalog.pdf>" [--start-sort N]

Layout assumption (verified on Part 1): grid of products, each cell =
photo, SKU code under it, Chinese name line(s), English name line(s),
pack spec line ("380g x 10bags/cs"). Idempotent: re-running or running
later catalog parts merges by SKU (seed upserts).
"""

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "public" / "products"
DATA_FILE = ROOT / "data" / "catalog.json"
REPORT_FILE = ROOT / "data" / "import_report.txt"

SKU_RE = re.compile(r"^([A-Z]{1,6}-?[A-Z]?\d{2,5}[A-Z]?|\d{4,6}[A-Z]?)$")
CJK_RE = re.compile(r"[㐀-鿿]")
PACK_RE = re.compile(
    r"/cs\b|/case\b|\bx\s*\d+\s*(bags?|boxes?|pcs?|cans?|btls?|rolls?|packs?|ct)\b", re.I
)
WEIGHT_X_RE = re.compile(r"\d+(\.\d+)?\s*(g|oz|kg|ml|lbs?|l)\b.{0,12}x", re.I)
HAS_LETTER_RE = re.compile(r"[A-Za-z]")
HEADER_Y = 45  # ignore words above this (company header / page number zone)


def line_kind(text: str) -> str:
    if CJK_RE.search(text):
        return "zh"
    if PACK_RE.search(text) or WEIGHT_X_RE.search(text):
        return "pack"
    return "en"


def group_lines(words):
    """words: (x0, y0, x1, y1, text) -> list of (y, text) lines."""
    lines = defaultdict(list)
    for x0, y0, x1, y1, txt in words:
        key = round(y0 / 4)  # 4pt vertical tolerance
        lines[key].append((x0, txt))
    out = []
    for key in sorted(lines):
        parts = [t for _, t in sorted(lines[key])]
        out.append((key * 4, " ".join(parts)))
    return out


def derive_brand(name_zh: str, name_en: str) -> str:
    brand_zh = ""
    if name_zh:
        first = name_zh.split()[0]
        if CJK_RE.search(first):
            brand_zh = first
    brand_en = ""
    if "-" in name_en:
        left = name_en.split("-", 1)[0].strip()
        if 0 < len(left) <= 20 and not left[0].isdigit():
            brand_en = left
    return f"{brand_zh} {brand_en}".strip()


def save_image(doc, xref: int, sku: str) -> str | None:
    try:
        info = doc.extract_image(xref)
        ext = info["ext"].lower()
        if ext not in ("jpeg", "jpg", "png"):
            pix = fitz.Pixmap(doc, xref)
            if pix.colorspace and pix.colorspace.n > 3:
                pix = fitz.Pixmap(fitz.csRGB, pix)
            data, ext = pix.tobytes("png"), "png"
        else:
            data = info["image"]
            ext = "jpg" if ext == "jpeg" else ext
        fname = f"{sku}.{ext}"
        (IMG_DIR / fname).write_bytes(data)
        return f"/products/{fname}"
    except Exception as e:
        print(f"  image extract failed for {sku}: {e}", file=sys.stderr)
        return None


def parse_page(doc, page, sort_base: int, report: list[str]):
    words = [w[:5] for w in page.get_text("words") if w[1] > HEADER_Y]
    images = [
        im
        for im in page.get_image_info(xrefs=True)
        if (im["bbox"][2] - im["bbox"][0]) > 30 and (im["bbox"][3] - im["bbox"][1]) > 30
    ]

    skus = [w for w in words if SKU_RE.match(w[4])]
    if not skus:
        return []

    # group SKUs into rows by y
    rows = defaultdict(list)
    for w in skus:
        rows[round(w[1] / 30)].append(w)
    row_list = [sorted(v, key=lambda w: w[0]) for _, v in sorted(rows.items())]

    # Product rows are ~250pt apart. A "SKU" within 80pt of the previous row
    # is a false positive (a SKU-shaped word inside a product name, e.g. "M-150").
    kept: list[list] = []
    for row in row_list:
        row_y = min(w[1] for w in row)
        if kept and row_y - min(w[1] for w in kept[-1]) < 80:
            continue
        kept.append(row)
    row_list = kept

    products = []
    for ri, row in enumerate(row_list):
        row_y = min(w[1] for w in row)
        next_row_img_top = None
        if ri + 1 < len(row_list):
            next_y = min(w[1] for w in row_list[ri + 1])
            tops = [im["bbox"][1] for im in images if row_y < im["bbox"][1] < next_y]
            next_row_img_top = min(tops) if tops else next_y - 5
        col_centers = [(w[0] + w[2]) / 2 for w in row]

        # text region below this SKU row, above next row's images
        region_words = [
            w
            for w in words
            if w[1] > row_y + 8
            and (next_row_img_top is None or w[1] < next_row_img_top - 2)
        ]
        col_words = defaultdict(list)
        for w in region_words:
            cx = (w[0] + w[2]) / 2
            ci = min(range(len(col_centers)), key=lambda i: abs(col_centers[i] - cx))
            col_words[ci].append(w)

        # claim images: for each SKU, nearest image whose bottom sits just above
        used = set()
        for ci, w in enumerate(row):
            sku = w[4]
            scx = (w[0] + w[2]) / 2
            best, best_d = None, 1e9
            for ii, im in enumerate(images):
                if ii in used:
                    continue
                bx0, by0, bx1, by1 = im["bbox"]
                if not (-160 < w[1] - by1 < 40):  # image bottom near/above SKU top
                    continue
                d = abs((bx0 + bx1) / 2 - scx)
                if d < best_d:
                    best, best_d = ii, d
            image_path = None
            if best is not None and best_d < 80:
                used.add(best)
                image_path = save_image(doc, images[best]["xref"], sku)
            else:
                report.append(f"NO IMAGE: {sku} (page {page.number + 1})")

            zh_parts, en_parts, pack_parts = [], [], []
            for y, text in group_lines(col_words.get(ci, [])):
                kind = line_kind(text)
                if kind == "zh":
                    zh_parts.append(text)
                elif kind == "pack":
                    pack_parts.append(text)
                elif HAS_LETTER_RE.search(text):
                    en_parts.append(text)
                # digits-only stray tokens (column bleed) are dropped
            name_zh = " ".join(zh_parts).strip()
            name_en = " ".join(en_parts).strip()
            pack = "; ".join(pack_parts).strip()
            if not name_en and not name_zh:
                report.append(f"NO NAME: {sku} (page {page.number + 1})")
            products.append(
                {
                    "sku": sku,
                    "nameEn": name_en,
                    "nameZh": name_zh,
                    "brand": derive_brand(name_zh, name_en),
                    "category": "",
                    "packSize": pack,
                    "imagePath": image_path,
                    "sortOrder": sort_base + len(products),
                }
            )
    return products


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: import_catalog.py <catalog.pdf> [--start-sort N]")
    pdf_path = sys.argv[1]
    start_sort = 0
    if "--start-sort" in sys.argv:
        start_sort = int(sys.argv[sys.argv.index("--start-sort") + 1])

    IMG_DIR.mkdir(parents=True, exist_ok=True)
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

    existing = []
    if DATA_FILE.exists():
        existing = json.loads(DATA_FILE.read_text())

    doc = fitz.open(pdf_path)
    report: list[str] = []
    products = []
    for page in doc:
        products.extend(parse_page(doc, page, start_sort + len(products), report))

    by_sku = {p["sku"]: p for p in existing}
    dupes_in_run = len(products) - len({p["sku"] for p in products})
    for p in products:
        by_sku[p["sku"]] = p
    merged = sorted(by_sku.values(), key=lambda p: p["sortOrder"])

    DATA_FILE.write_text(json.dumps(merged, ensure_ascii=False, indent=1))
    REPORT_FILE.write_text(
        "\n".join(report) + f"\n\nparsed {len(products)} entries "
        f"({dupes_in_run} duplicate SKUs in this run), "
        f"{len(merged)} total in catalog.json, {len(report)} issues\n"
    )
    print(f"parsed {len(products)} products from {pdf_path}")
    print(f"issues: {len(report)} (see data/import_report.txt)")
    print(f"catalog.json now has {len(merged)} products")


if __name__ == "__main__":
    main()
