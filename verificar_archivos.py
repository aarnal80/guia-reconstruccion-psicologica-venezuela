from pathlib import Path
import hashlib
import re
import zipfile
import xml.etree.ElementTree as ET

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parent
STEM = "Guia_reconstruccion_psicologica_Indira_Parra_Antonio_Arnal"
pdf_path = ROOT / f"{STEM}_KDP_6x9.pdf"
docx_path = ROOT / f"{STEM}.docx"
epub_path = ROOT / f"{STEM}.epub"
html_path = ROOT / f"{STEM}_web.html"
md_path = ROOT / "manuscrito_guia.md"
front_cover_path = ROOT / "Portada_frontal_6x9.pdf"
wrap_cover_path = ROOT / "Portada_KDP_crema.pdf"
public_pdf_path = ROOT / "web" / "public" / "guia-reconstruccion-psicologica.pdf"
title = "Guía de reconstrucción psicológica de una catástrofe"
isbn = "9798190186116"

reader = PdfReader(pdf_path)
assert len(reader.pages) == 100, len(reader.pages)
font_names = set()
low_text_pages = []
for idx, page in enumerate(reader.pages, 1):
    box = page.mediabox
    assert round(float(box.width)) == 432
    assert round(float(box.height)) == 648
    text = page.extract_text() or ""
    words = len(text.split())
    if words < 12:
        low_text_pages.append((idx, words, text.strip().replace("\n", " ")[:80]))
    resources = page.get("/Resources")
    if resources and resources.get("/Font"):
        fonts = resources["/Font"].get_object()
        for font_ref in fonts.values():
            font = font_ref.get_object()
            base = font.get("/BaseFont")
            if base:
                font_names.add(str(base))

assert any("Georgia" in name for name in font_names), font_names
assert all(item[1] > 0 for item in low_text_pages), low_text_pages
title_text = reader.pages[0].extract_text() or ""
assert title.upper() in re.sub(r"\s+", " ", title_text), title_text
assert "Venezuela" in title_text, title_text
assert isbn in (reader.pages[2].extract_text() or ""), reader.pages[2].extract_text()
notes_pages = [
    idx for idx, page in enumerate(reader.pages, 1)
    if "Mis notas" in (page.extract_text() or "")
]
assert notes_pages == [11, 22, 34, 48, 58, 69, 77, 87], notes_pages
toc_text = reader.pages[5].extract_text() or ""
for expected in ("Introducción", "Guía 1", "Guía 7", "Sobre los autores"):
    assert expected in toc_text, (expected, toc_text)
assert "[[TOC_STATIC]]" not in toc_text

with zipfile.ZipFile(docx_path) as zf:
    assert zf.testzip() is None
    document_xml = zf.read("word/document.xml").decode("utf-8")
    styles_xml = zf.read("word/styles.xml").decode("utf-8")
    settings_xml = zf.read("word/settings.xml").decode("utf-8")
    assert '<w:pgSz w:w="8640" w:h="12960"' in document_xml
    assert 'w:left="1181"' in document_xml or 'w:left="1180"' in document_xml
    assert 'w:right="1181"' in document_xml or 'w:right="1180"' in document_xml
    assert "Georgia" in styles_xml
    assert 'w:val="both"' in styles_xml
    worksheet_style = re.search(
        r'<w:style[^>]*w:styleId="Worksheet"[^>]*>.*?</w:style>',
        styles_xml,
    )
    assert worksheet_style and 'w:jc w:val="left"' in worksheet_style.group(0)
    assert document_xml.count("Mis notas") == 8
    assert isbn in document_xml
    assert "autoHyphenation" in settings_xml
    assert "PAGE" in b"".join(zf.read(n) for n in zf.namelist() if n.startswith("word/footer")).decode("utf-8")
    assert "[[TOC_STATIC]]" not in document_xml

with zipfile.ZipFile(epub_path) as zf:
    assert zf.testzip() is None
    assert zf.namelist()[0] == "mimetype"
    assert zf.read("mimetype") == b"application/epub+zip"
    for name in (
        "META-INF/container.xml",
        "OEBPS/content.opf",
        "OEBPS/nav.xhtml",
        "OEBPS/book.xhtml",
    ):
        ET.fromstring(zf.read(name))
    epub_book = zf.read("OEBPS/book.xhtml").decode("utf-8")
    assert title.upper() in epub_book
    assert epub_book.count('class="notes-page"') == 8
    assert 'class="worksheet"' in epub_book
    assert isbn in epub_book

md = md_path.read_text(encoding="utf-8")
web = html_path.read_text(encoding="utf-8")
assert "\ufffd" not in md
assert "<!-- PAGEBREAK -->" not in web
assert "[[TOC_STATIC]]" not in web
assert "<nav" in web and 'lang="es"' in web
assert 'class="editorial-toc"' in web
assert title.upper() in web
assert web.count('class="notes-page"') == 8
assert 'class="worksheet"' in web
assert isbn in web and isbn in md
assert len(re.findall(r"(?m)^# ", md)) >= 12
assert md.count("[[NOTES_PAGE]]") == 8
assert "Ruben" not in md and "Denise" not in md and "Jeannina" not in md
assert "No inicies, suspendas, compartas ni cambies medicamentos" in md

front_cover = PdfReader(front_cover_path)
assert len(front_cover.pages) == 1
assert round(float(front_cover.pages[0].mediabox.width), 1) == 432.0
assert round(float(front_cover.pages[0].mediabox.height), 1) == 648.0
assert "PROVISIONAL" not in (front_cover.pages[0].extract_text() or "").upper()

wrap_cover = PdfReader(wrap_cover_path)
assert len(wrap_cover.pages) == 1
assert round(float(wrap_cover.pages[0].mediabox.width), 1) == 900.0
assert round(float(wrap_cover.pages[0].mediabox.height), 1) == 666.0
assert "PROVISIONAL" not in (wrap_cover.pages[0].extract_text() or "").upper()

assert public_pdf_path.exists()
assert hashlib.sha256(pdf_path.read_bytes()).digest() == hashlib.sha256(public_pdf_path.read_bytes()).digest()

print("PDF_OK", len(reader.pages), "pages")
print("PDF_FONTS", sorted(font_names))
print("LOW_TEXT_PAGES", low_text_pages)
print("NOTES_PAGES", notes_pages)
print("DOCX_OK", docx_path.stat().st_size, "bytes")
print("EPUB_OK", epub_path.stat().st_size, "bytes")
print("HTML_OK", html_path.stat().st_size, "bytes")
print("FRONT_COVER_OK", front_cover_path.stat().st_size, "bytes")
print("WRAP_COVER_OK", wrap_cover_path.stat().st_size, "bytes")
print("SOURCE_WORDS", len(md.split()))
