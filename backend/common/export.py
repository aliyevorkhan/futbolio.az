"""CSV/XLSX export helpers shared by any admin export endpoint. Centralizes
the formula-injection guard spec section 7/15 names explicitly: a cell
value starting with =, +, -, or @ gets a leading apostrophe so Excel/Sheets
never interprets candidate-supplied text as a formula.
"""

import csv
import io

import openpyxl

FORMULA_TRIGGER_CHARS = ("=", "+", "-", "@")


def sanitize_cell(value) -> str:
    text = "" if value is None else str(value)
    if text and text[0] in FORMULA_TRIGGER_CHARS:
        return f"'{text}"
    return text


def rows_to_csv_bytes(header: list[str], rows: list[list]) -> bytes:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(header)
    for row in rows:
        writer.writerow([sanitize_cell(cell) for cell in row])
    return buffer.getvalue().encode("utf-8-sig")


def rows_to_xlsx_bytes(header: list[str], rows: list[list]) -> bytes:
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.append(header)
    for row in rows:
        sheet.append([sanitize_cell(cell) for cell in row])
    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()
