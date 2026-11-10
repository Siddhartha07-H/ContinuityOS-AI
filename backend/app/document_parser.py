import os
import re
from pathlib import Path
from typing import Tuple, Dict, Any
from fastapi import HTTPException, UploadFile
import docx
from app.config import settings

# Attempt import of PyMuPDF (fitz) and pypdf
try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

try:
    import pypdf
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_FILE_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024

def validate_uploaded_file(file: UploadFile) -> str:
    """Validates file extension and filename."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file has no filename.")
    
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: PDF (.pdf), Word (.docx), Plain Text (.txt)"
        )
    return ext

def clean_extracted_text(text: str) -> str:
    """Removes null bytes, normalizes whitespace and line breaks."""
    if not text:
        return ""
    # Strip null characters
    text = text.replace("\x00", "")
    # Normalize carriage returns
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Collapse multiple consecutive blank lines into double newline
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def extract_text_from_pdf(file_path: Path) -> str:
    """Extracts text from a PDF file using PyMuPDF (fitz) with fallback to pypdf."""
    extracted_text = ""

    # Primary method: PyMuPDF
    if HAS_PYMUPDF:
        try:
            doc = fitz.open(str(file_path))
            pages = []
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                page_text = page.get_text("text")
                if page_text.strip():
                    pages.append(f"--- Page {page_num + 1} ---\n{page_text}")
            doc.close()
            extracted_text = "\n\n".join(pages)
        except Exception as e:
            extracted_text = ""

    # Fallback method: pypdf if PyMuPDF returned empty or had an issue
    if not extracted_text.strip() and HAS_PYPDF:
        try:
            reader = pypdf.PdfReader(str(file_path))
            pages = []
            for idx, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    pages.append(f"--- Page {idx + 1} ---\n{page_text}")
            extracted_text = "\n\n".join(pages)
        except Exception as e:
            pass

    return clean_extracted_text(extracted_text)

def extract_text_from_docx(file_path: Path) -> str:
    """Extracts text from a Word (.docx) document using python-docx."""
    try:
        doc = docx.Document(str(file_path))
        full_text = []

        # Read paragraphs
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())

        # Read tables
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    full_text.append(" | ".join(row_text))

        return clean_extracted_text("\n\n".join(full_text))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to extract text from DOCX file: {str(e)}")

def extract_text_from_txt(file_path: Path) -> str:
    """Extracts text from a plain text file trying multiple common encodings."""
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252", "iso-8859-1"]
    content = None

    for enc in encodings:
        try:
            with open(file_path, "r", encoding=enc) as f:
                content = f.read()
            break
        except (UnicodeDecodeError, Exception):
            continue

    if content is None:
        # Final fallback binary decode with replacement
        with open(file_path, "rb") as f:
            content = f.read().decode("utf-8", errors="replace")

    return clean_extracted_text(content)

def parse_document(file_path: Path, file_type: str) -> Dict[str, Any]:
    """
    Parses an uploaded document based on its extension and returns extracted text and metadata.
    """
    ext = file_type.lower().replace(".", "")
    if ext == "pdf":
        text = extract_text_from_pdf(file_path)
    elif ext == "docx":
        text = extract_text_from_docx(file_path)
    elif ext == "txt":
        text = extract_text_from_txt(file_path)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    if not text:
        text = "(Document contains no extractable text or is a scanned image without OCR text layers)"

    words = text.split()
    return {
        "extracted_text": text,
        "char_count": len(text),
        "word_count": len(words)
    }

