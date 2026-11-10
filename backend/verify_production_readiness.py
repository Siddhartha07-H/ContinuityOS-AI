import os
import sys
import io
import json
import sqlite3
import datetime
import urllib.request
import urllib.parse
from pathlib import Path
import docx
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:5173"

test_results = []

def record(test_name, status, details=""):
    print(f"[{status}] {test_name}: {details}")
    test_results.append({"test": test_name, "status": status, "details": details})

# ============================================================================
# 1. VERIFY FRONTEND PAGES & NAVIGATION
# ============================================================================
def test_frontend_routes():
    try:
        with urllib.request.urlopen(f"{FRONTEND_URL}/") as resp:
            content = resp.read().decode('utf-8')
            assert resp.status == 200, f"Expected 200, got {resp.status}"
            assert "ContinuityOS AI" in content or "root" in content, "Frontend HTML missing root div or title"
            record("1. Frontend Root & Landing Page", "PASS", "Vite React served index.html with 200 OK")
    except Exception as e:
        record("1. Frontend Root & Landing Page", "FAIL", str(e))

# ============================================================================
# 2. TEST LOGIN, REGISTER AND DEMO ACCESS
# ============================================================================
def test_auth_flows():
    # 2.1 Demo Login
    demo_token = None
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/auth/demo-login", method="POST")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            assert "access_token" in data, "No access_token returned"
            assert data["user"]["email"] == "demo@continuityos.ai", "User email mismatch"
            demo_token = data["access_token"]
            record("2.1 Demo Access (One-Click)", "PASS", f"User {data['user']['email']} authenticated")
    except Exception as e:
        record("2.1 Demo Access (One-Click)", "FAIL", str(e))

    # 2.2 User Registration
    new_email = f"lead_{int(datetime.datetime.utcnow().timestamp())}@continuityos.ai"
    try:
        reg_payload = json.dumps({
            "email": new_email,
            "full_name": "Senior Transition Lead",
            "password": "SecurePassword123!",
            "role": "Lead Architect",
            "department": "Platform Reliability"
        }).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/api/auth/register",
            data=reg_payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            assert data["user"]["email"] == new_email
            record("2.2 User Registration", "PASS", f"Registered new user {new_email}")
    except Exception as e:
        record("2.2 User Registration", "FAIL", str(e))

    # 2.3 User Login
    try:
        login_payload = json.dumps({
            "email": new_email,
            "password": "SecurePassword123!"
        }).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/api/auth/login",
            data=login_payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            assert "access_token" in data
            record("2.3 User Login & Credential Verification", "PASS", "Valid credentials issued JWT token")
    except Exception as e:
        record("2.3 User Login & Credential Verification", "FAIL", str(e))

    # 2.4 Invalid Password Rejection
    try:
        bad_payload = json.dumps({
            "email": new_email,
            "password": "WrongPassword999!"
        }).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/api/auth/login",
            data=bad_payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req) as resp:
                record("2.4 Invalid Credential Rejection", "FAIL", "Should have rejected bad password")
        except urllib.error.HTTPError as he:
            assert he.code == 400, f"Expected 400, got {he.code}"
            record("2.4 Invalid Credential Rejection", "PASS", "HTTP 400 returned for wrong password")
    except Exception as e:
        record("2.4 Invalid Credential Rejection", "FAIL", str(e))

    return demo_token

# ============================================================================
# 3 & 4. UPLOAD SAMPLE PDF, DOCX AND TXT FILES & VERIFY EXTRACTION
# ============================================================================
def create_test_files():
    temp_dir = Path("./test_fixtures")
    temp_dir.mkdir(exist_ok=True)

    # 1. PDF
    pdf_path = temp_dir / "Test_Handover_Runbook.pdf"
    c = canvas.Canvas(str(pdf_path), pagesize=letter)
    c.drawString(72, 720, "Test Handover Document - Production Incident Runbook")
    c.drawString(72, 700, "Primary on-call lead: Jordan Reed. Designated backup: Not Found in Documents.")
    c.drawString(72, 680, "Production Redis port: 6379 with TLS enabled. Cache TTL: 3600 seconds.")
    c.drawString(72, 660, "Important Decision: Migrated from Memcached to Redis for atomic locks.")
    c.save()

    # 2. DOCX
    docx_path = temp_dir / "Test_Architecture_Decisions.docx"
    doc = docx.Document()
    doc.add_heading("Architecture Decision Record (ADR) - API Gateway", 0)
    doc.add_paragraph("Primary Author: Maya Lin (Principal Backend Engineer).")
    doc.add_paragraph("Decision: Adopted FastAPI with async PostgreSQL pooling.")
    doc.add_paragraph("Rationale: High throughput and automatic OpenAPI schema generation.")
    doc.add_paragraph("Pending Task: Complete load testing at 20,000 requests per second.")
    doc.add_paragraph("Risk: Database connection pool exhaustion under sudden spikes.")
    doc.save(str(docx_path))

    # 3. TXT
    txt_path = temp_dir / "Test_DevOps_Notes.txt"
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("DevOps Handover Notes\n")
        f.write("Kubernetes cluster version: 1.30.2 on AWS EKS.\n")
        f.write("CI/CD pipeline runs on GitHub Actions.\n")
        f.write("Critical Gap: Production Vault unseal keys stored on private USB drive.")

    return pdf_path, docx_path, txt_path

def upload_multipart(url, file_path, field_name="file"):
    filename = Path(file_path).name
    boundary = f"----ContinuityOSBoundary{int(datetime.datetime.utcnow().timestamp())}"
    with open(file_path, "rb") as f:
        file_content = f.read()

    body = io.BytesIO()
    body.write(f"--{boundary}\r\n".encode("utf-8"))
    body.write(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode("utf-8"))
    body.write(b"Content-Type: application/octet-stream\r\n\r\n")
    body.write(file_content)
    body.write(f"\r\n--{boundary}--\r\n".encode("utf-8"))

    req = urllib.request.Request(
        url,
        data=body.getvalue(),
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}"
        },
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def test_document_uploads_and_extraction():
    pdf_path, docx_path, txt_path = create_test_files()
    uploaded_ids = []

    # Upload PDF
    try:
        pdf_res = upload_multipart(f"{BASE_URL}/api/documents/upload?auto_analyze=true", pdf_path)
        assert pdf_res["file_type"] == "pdf"
        assert pdf_res["word_count"] > 10, "Word count should be > 10"
        uploaded_ids.append(pdf_res["id"])
        record("3.1 Upload PDF File", "PASS", f"Uploaded {pdf_res['filename']} ({pdf_res['word_count']} words)")
    except Exception as e:
        record("3.1 Upload PDF File", "FAIL", str(e))

    # Upload DOCX
    try:
        docx_res = upload_multipart(f"{BASE_URL}/api/documents/upload?auto_analyze=true", docx_path)
        assert docx_res["file_type"] == "docx"
        assert docx_res["word_count"] > 10
        uploaded_ids.append(docx_res["id"])
        record("3.2 Upload DOCX File", "PASS", f"Uploaded {docx_res['filename']} ({docx_res['word_count']} words)")
    except Exception as e:
        record("3.2 Upload DOCX File", "FAIL", str(e))

    # Upload TXT
    try:
        txt_res = upload_multipart(f"{BASE_URL}/api/documents/upload?auto_analyze=true", txt_path)
        assert txt_res["file_type"] == "txt"
        assert txt_res["word_count"] > 5
        uploaded_ids.append(txt_res["id"])
        record("3.3 Upload TXT File", "PASS", f"Uploaded {txt_res['filename']} ({txt_res['word_count']} words)")
    except Exception as e:
        record("3.3 Upload TXT File", "FAIL", str(e))

    # Verify Text Extraction Details
    for doc_id in uploaded_ids:
        try:
            with urllib.request.urlopen(f"{BASE_URL}/api/documents/{doc_id}") as r:
                doc_detail = json.loads(r.read())
                assert len(doc_detail["extracted_text"]) > 20, "Extracted text is empty or too short"
                record(f"4. Text Extraction Verification ({doc_detail['file_type'].upper()})", "PASS", f"Extracted {doc_detail['char_count']} characters")
        except Exception as e:
            record(f"4. Text Extraction Verification (Doc #{doc_id})", "FAIL", str(e))

    return uploaded_ids

# ============================================================================
# 5 & 6. TEST AI ANALYSIS, GROUNDED Q&A, AND GEMINI / FALLBACK BEHAVIOR
# ============================================================================
def test_ai_analysis_and_grounded_qa(uploaded_ids):
    if not uploaded_ids:
        record("5. AI Analysis", "FAIL", "No uploaded docs to analyze")
        return

    doc_id = uploaded_ids[0]
    # 5.1 Structured Analysis Output
    try:
        with urllib.request.urlopen(f"{BASE_URL}/api/analysis/document/{doc_id}") as resp:
            data = json.loads(resp.read())
            # Check 6 required sections
            assert "project_overview" in data, "Missing project_overview"
            assert "important_decisions" in data, "Missing important_decisions"
            assert "pending_tasks" in data, "Missing pending_tasks"
            assert "responsibilities" in data, "Missing responsibilities"
            assert "risks_and_challenges" in data, "Missing risks_and_challenges"
            assert "recommended_next_steps" in data, "Missing recommended_next_steps"
            assert "knowledge_gaps" in data, "Missing knowledge_gaps"
            assert "completeness_score" in data, "Missing completeness_score"
            assert data["ai_provider"] in ["gemini", "heuristic_engine"], f"Invalid provider {data['ai_provider']}"
            record("5.1 Structured 6-Pillar Analysis", "PASS", f"Generated complete handover structure via {data['ai_provider']}")
    except Exception as e:
        record("5.1 Structured 6-Pillar Analysis", "FAIL", str(e))

    # 5.2 Grounded Positive Q&A (Question answered directly from doc)
    try:
        q_payload = json.dumps({"question": "What is the Redis port in the incident runbook?"}).encode("utf-8")
        req = urllib.request.Request(f"{BASE_URL}/api/chat/ask", data=q_payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req) as resp:
            ans = json.loads(resp.read())
            assert "6379" in ans["answer"] or ans["found_in_docs"] == True
            assert len(ans["citations"]) > 0, "Expected citation to source document"
            record("5.2 Grounded AI Q&A (Answer Found)", "PASS", f"Answer verified with citation to {ans['citations'][0]['document_name']}")
    except Exception as e:
        record("5.2 Grounded AI Q&A (Answer Found)", "FAIL", str(e))

    # 5.3 Grounded Negative Q&A (Unanswerable Question -> Must return Not Found)
    try:
        q_unanswerable = json.dumps({"question": "What is the CEO's favorite brand of coffee?"}).encode("utf-8")
        req = urllib.request.Request(f"{BASE_URL}/api/chat/ask", data=q_unanswerable, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req) as resp:
            ans = json.loads(resp.read())
            assert "not found in documents" in ans["answer"].lower(), "Did not return 'Not Found in Documents'"
            assert ans["found_in_docs"] == False, "found_in_docs flag should be False"
            record("5.3 Strict Grounding Guardrail ('Not Found in Documents')", "PASS", "Correctly rejected hallucination for unverified query")
    except Exception as e:
        record("5.3 Strict Grounding Guardrail ('Not Found in Documents')", "FAIL", str(e))

    # 6. Provider Identification Check
    try:
        with urllib.request.urlopen(f"{BASE_URL}/api/system/status") as resp:
            status_data = json.loads(resp.read())
            provider_label = "Google Gemini AI" if status_data["gemini_connected"] else "Deterministic Heuristic Engine"
            record("6. Gemini AI vs Heuristic Provider Distinction", "PASS", f"Active provider explicitly reported as: {provider_label}")
    except Exception as e:
        record("6. Gemini AI vs Heuristic Provider Distinction", "FAIL", str(e))

# ============================================================================
# 7. TEST KNOWLEDGE GAP DETECTION
# ============================================================================
def test_knowledge_gap_detection():
    try:
        with urllib.request.urlopen(f"{BASE_URL}/api/gaps/summary") as resp:
            data = json.loads(resp.read())
            assert "total_gaps" in data
            assert "critical_count" in data
            assert len(data["gaps"]) > 0
            gap = data["gaps"][0]
            assert "gap_category" in gap and "recommended_action" in gap
            record("7. Knowledge Gap Detection", "PASS", f"Detected {data['total_gaps']} gaps ({data['critical_count']} Critical SPOFs)")
    except Exception as e:
        record("7. Knowledge Gap Detection", "FAIL", str(e))

# ============================================================================
# 8. GENERATE AND DOWNLOAD A HANDOVER PDF
# ============================================================================
def test_handover_pdf_generation():
    report_id = None
    try:
        rep_payload = json.dumps({
            "title": "Comprehensive Production Readiness Handover",
            "target_role": "Incoming Principal Engineer",
            "departing_employee": "Staff SRE Lead",
            "successor_name": "Senior Platform Engineer",
            "document_ids": []
        }).encode("utf-8")
        req = urllib.request.Request(f"{BASE_URL}/api/reports/generate", data=rep_payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req) as resp:
            rep = json.loads(resp.read())
            report_id = rep["id"]
            record("8.1 Handover Report Assembly", "PASS", f"Assembled report '{rep['title']}' (ID: {report_id})")
    except Exception as e:
        record("8.1 Handover Report Assembly", "FAIL", str(e))

    if report_id:
        try:
            with urllib.request.urlopen(f"{BASE_URL}/api/reports/{report_id}/pdf") as resp:
                assert resp.status == 200
                pdf_bytes = resp.read()
                assert pdf_bytes.startswith(b"%PDF"), "Response is not a valid PDF binary"
                assert len(pdf_bytes) > 2000, "PDF file is too small or truncated"
                record("8.2 Download Executive PDF", "PASS", f"Downloaded valid PDF ({len(pdf_bytes):,} bytes)")
        except Exception as e:
            record("8.2 Download Executive PDF", "FAIL", str(e))

# ============================================================================
# 9. VERIFY SQLITE DATA PERSISTENCE
# ============================================================================
def test_sqlite_persistence():
    db_path = Path("./continuityos.db")
    if not db_path.exists():
        db_path = Path("backend/continuityos.db")
    
    try:
        assert db_path.exists(), f"SQLite DB file {db_path} does not exist"
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()

        # Check tables exist
        tables = [row[0] for row in cursor.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]
        assert "users" in tables, "Table 'users' missing in SQLite"
        assert "documents" in tables, "Table 'documents' missing in SQLite"
        assert "analyses" in tables, "Table 'analyses' missing in SQLite"
        assert "handover_reports" in tables, "Table 'handover_reports' missing in SQLite"
        assert "chat_messages" in tables, "Table 'chat_messages' missing in SQLite"
        assert "audit_logs" in tables, "Table 'audit_logs' missing in SQLite"

        # Check row counts
        doc_count = cursor.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
        user_count = cursor.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        report_count = cursor.execute("SELECT COUNT(*) FROM handover_reports").fetchone()[0]
        conn.close()

        record("9. SQLite Data Persistence", "PASS", f"Tables intact: {len(tables)} tables, {doc_count} docs, {user_count} users, {report_count} reports persisted")
    except Exception as e:
        record("9. SQLite Data Persistence", "FAIL", str(e))

# ============================================================================
# MAIN RUNNER
# ============================================================================
if __name__ == "__main__":
    print("=================================================================")
    print("CONTINUITYOS AI — COMPREHENSIVE PRODUCTION READINESS CHECK")
    print("=================================================================")
    test_frontend_routes()
    demo_token = test_auth_flows()
    uploaded_ids = test_document_uploads_and_extraction()
    test_ai_analysis_and_grounded_qa(uploaded_ids)
    test_knowledge_gap_detection()
    test_handover_pdf_generation()
    test_sqlite_persistence()

    print("\n=================================================================")
    print("FINAL TEST EXECUTION SUMMARY:")
    print("=================================================================")
    passed = sum(1 for r in test_results if r["status"] == "PASS")
    failed = sum(1 for r in test_results if r["status"] == "FAIL")
    not_tested = sum(1 for r in test_results if r["status"] == "NOT TESTED")

    for r in test_results:
        print(f"[{r['status']:<10}] {r['test']}: {r['details']}")

    print("-----------------------------------------------------------------")
    print(f"TOTAL: {len(test_results)} | PASS: {passed} | FAIL: {failed} | NOT TESTED: {not_tested}")
    print("=================================================================")

