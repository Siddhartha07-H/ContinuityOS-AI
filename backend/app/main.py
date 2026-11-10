import os
import json
import shutil
import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config import settings
from app.database import engine, Base, get_db
from app.models import User, Document, Analysis, HandoverReport, ChatMessage, AuditLog
from app.schemas import (
    UserRegister, UserLogin, UserOut, TokenResponse,
    DocumentOut, DocumentDetail,
    AnalysisResponse,
    HandoverReportCreate, HandoverReportOut,
    ChatAskRequest, ChatAnswerResponse, ChatMessageOut,
    AuditLogOut, StatsOverviewResponse, SystemStatusResponse
)
from app.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_optional_current_user
)
from app.document_parser import validate_uploaded_file, parse_document, MAX_FILE_BYTES
from app.ai_service import (
    analyze_document_with_gemini, answer_question_from_documents,
    is_gemini_configured, heuristic_analysis
)
from app.report_generator import generate_handover_pdf
from app.sample_data import seed_database, DEMO_USER_EMAIL, DEMO_USER_PASSWORD

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ContinuityOS AI API",
    description="Intelligent Knowledge Continuity and Employee Handover Platform",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all local dev origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to ensure directories and seed initial demo data
@app.on_event("startup")
def startup_event():
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    db = next(get_db())
    try:
        seed_database(db)
    except Exception as e:
        print(f"Warning during seed: {e}")
    finally:
        db.close()

# Helper for logging audit events
def log_audit(db: Session, user_id: Optional[int], email: str, action: str, entity_type: str, entity_id: str, details: str):
    audit = AuditLog(
        user_id=user_id,
        user_email=email or "system",
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        details=details
    )
    db.add(audit)
    db.commit()

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.post("/api/auth/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password),
        role=user_in.role or "Engineering Lead",
        department=user_in.department or "Technology"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit(db, new_user.id, new_user.email, "USER_REGISTER", "auth", str(new_user.id), "New account registered")
    
    token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
    return {"access_token": token, "token_type": "bearer", "user": new_user}

@app.post("/api/auth/login", response_model=TokenResponse)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password.")

    log_audit(db, user.id, user.email, "USER_LOGIN", "auth", str(user.id), "User logged in")
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}

@app.post("/api/auth/demo-login", response_model=TokenResponse)
def demo_login(db: Session = Depends(get_db)):
    """One-click demo login for rapid testing & evaluation."""
    demo_user = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
    if not demo_user:
        seed_database(db)
        demo_user = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()

    token = create_access_token({"sub": str(demo_user.id), "email": demo_user.email})
    log_audit(db, demo_user.id, demo_user.email, "DEMO_LOGIN", "auth", str(demo_user.id), "Demo login accessed")
    return {"access_token": token, "token_type": "bearer", "user": demo_user}

@app.get("/api/auth/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

# ============================================================================
# DOCUMENT MANAGEMENT ENDPOINTS
# ============================================================================

@app.post("/api/documents/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    auto_analyze: bool = Query(True, description="Automatically analyze with AI upon upload"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user)
):
    ext = validate_uploaded_file(file)

    # Sanitize and unique filename
    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_name = f"{Path(file.filename).stem}_{timestamp}{ext}"
    saved_path = settings.UPLOAD_DIR / safe_name

    # Save to disk
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
        )

    with open(saved_path, "wb") as f:
        f.write(file_bytes)

    # Parse document text
    try:
        parsed_data = parse_document(saved_path, ext)
    except Exception as e:
        if saved_path.exists():
            saved_path.unlink()
        raise HTTPException(status_code=422, detail=f"Failed to extract text: {str(e)}")

    doc_record = Document(
        user_id=current_user.id if current_user else None,
        filename=file.filename,
        file_type=ext.replace(".", ""),
        file_size=len(file_bytes),
        file_path=str(saved_path),
        extracted_text=parsed_data["extracted_text"],
        char_count=parsed_data["char_count"],
        word_count=parsed_data["word_count"],
        status="analyzed" if auto_analyze else "uploaded"
    )
    db.add(doc_record)
    db.commit()
    db.refresh(doc_record)

    # Auto analyze if requested
    if auto_analyze:
        try:
            analysis_dict, provider = analyze_document_with_gemini(
                doc_record.filename, doc_record.extracted_text
            )
            analysis = Analysis(
                document_id=doc_record.id,
                user_id=doc_record.user_id,
                project_overview=json.dumps(analysis_dict.get("project_overview", {})),
                important_decisions=json.dumps(analysis_dict.get("important_decisions", [])),
                pending_tasks=json.dumps(analysis_dict.get("pending_tasks", [])),
                responsibilities=json.dumps(analysis_dict.get("responsibilities", [])),
                risks_and_challenges=json.dumps(analysis_dict.get("risks_and_challenges", [])),
                recommended_next_steps=json.dumps(analysis_dict.get("recommended_next_steps", [])),
                knowledge_gaps=json.dumps(analysis_dict.get("knowledge_gaps", [])),
                completeness_score=analysis_dict.get("handover_completeness_score", 70),
                ai_provider=provider
            )
            db.add(analysis)
            db.commit()
        except Exception as e:
            doc_record.status = "error"
            db.commit()

    user_email = current_user.email if current_user else "anonymous"
    log_audit(db, doc_record.user_id, user_email, "DOC_UPLOAD", "document", str(doc_record.id), f"Uploaded {doc_record.filename} ({doc_record.word_count} words)")

    return DocumentOut(
        id=doc_record.id,
        filename=doc_record.filename,
        file_type=doc_record.file_type,
        file_size=doc_record.file_size,
        char_count=doc_record.char_count,
        word_count=doc_record.word_count,
        status=doc_record.status,
        created_at=doc_record.created_at,
        has_analysis=bool(doc_record.analysis)
    )

@app.get("/api/documents", response_model=List[DocumentOut])
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    results = []
    for d in docs:
        results.append(DocumentOut(
            id=d.id,
            filename=d.filename,
            file_type=d.file_type,
            file_size=d.file_size,
            char_count=d.char_count,
            word_count=d.word_count,
            status=d.status,
            created_at=d.created_at,
            has_analysis=bool(d.analysis)
        ))
    return results

@app.get("/api/documents/{doc_id}", response_model=DocumentDetail)
def get_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return DocumentDetail(
        id=doc.id,
        filename=doc.filename,
        file_type=doc.file_type,
        file_size=doc.file_size,
        char_count=doc.char_count,
        word_count=doc.word_count,
        status=doc.status,
        created_at=doc.created_at,
        has_analysis=bool(doc.analysis),
        extracted_text=doc.extracted_text
    )

@app.get("/api/documents/{doc_id}/download")
def download_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found on disk.")
    return FileResponse(
        path=doc.file_path,
        filename=doc.filename,
        media_type="application/octet-stream"
    )

@app.delete("/api/documents/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    filename = doc.filename
    # Delete from disk
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()

    user_email = current_user.email if current_user else "anonymous"
    log_audit(db, current_user.id if current_user else None, user_email, "DOC_DELETE", "document", str(doc_id), f"Deleted document {filename}")

    return {"message": f"Document '{filename}' successfully deleted."}

# ============================================================================
# STRUCTURED ANALYSIS ENDPOINTS
# ============================================================================

@app.post("/api/analysis/analyze/{doc_id}", response_model=AnalysisResponse)
def trigger_analysis(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    analysis_data, provider = analyze_document_with_gemini(doc.filename, doc.extracted_text)

    # Check if analysis already exists
    analysis = db.query(Analysis).filter(Analysis.document_id == doc_id).first()
    if not analysis:
        analysis = Analysis(document_id=doc_id, user_id=current_user.id if current_user else None)
        db.add(analysis)

    analysis.project_overview = json.dumps(analysis_data.get("project_overview", {}))
    analysis.important_decisions = json.dumps(analysis_data.get("important_decisions", []))
    analysis.pending_tasks = json.dumps(analysis_data.get("pending_tasks", []))
    analysis.responsibilities = json.dumps(analysis_data.get("responsibilities", [])),
    analysis.risks_and_challenges = json.dumps(analysis_data.get("risks_and_challenges", []))
    analysis.recommended_next_steps = json.dumps(analysis_data.get("recommended_next_steps", []))
    analysis.knowledge_gaps = json.dumps(analysis_data.get("knowledge_gaps", []))
    analysis.completeness_score = analysis_data.get("handover_completeness_score", 70)
    analysis.ai_provider = provider

    doc.status = "analyzed"
    db.commit()
    db.refresh(analysis)

    user_email = current_user.email if current_user else "anonymous"
    log_audit(db, current_user.id if current_user else None, user_email, "AI_ANALYZE", "analysis", str(analysis.id), f"Generated structured analysis for {doc.filename} via {provider}")

    return format_analysis_response(analysis, doc.filename)

def format_analysis_response(analysis: Analysis, filename: str) -> AnalysisResponse:
    # Helper to unpack json columns safely
    def safe_loads(val, default):
        if not val:
            return default
        if isinstance(val, tuple):
            val = val[0]
        try:
            return json.loads(val)
        except Exception:
            return default

    return AnalysisResponse(
        id=analysis.id,
        document_id=analysis.document_id,
        document_name=filename,
        project_overview=safe_loads(analysis.project_overview, {}),
        important_decisions=safe_loads(analysis.important_decisions, []),
        pending_tasks=safe_loads(analysis.pending_tasks, []),
        responsibilities=safe_loads(analysis.responsibilities, []),
        risks_and_challenges=safe_loads(analysis.risks_and_challenges, []),
        recommended_next_steps=safe_loads(analysis.recommended_next_steps, []),
        knowledge_gaps=safe_loads(analysis.knowledge_gaps, []),
        completeness_score=analysis.completeness_score,
        ai_provider=analysis.ai_provider,
        created_at=analysis.created_at
    )

@app.get("/api/analysis/document/{doc_id}", response_model=AnalysisResponse)
def get_analysis_by_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    analysis = db.query(Analysis).filter(Analysis.document_id == doc_id).first()
    if not analysis:
        # Generate on the fly
        analysis_data, provider = analyze_document_with_gemini(doc.filename, doc.extracted_text)
        analysis = Analysis(
            document_id=doc.id,
            user_id=doc.user_id,
            project_overview=json.dumps(analysis_data.get("project_overview", {})),
            important_decisions=json.dumps(analysis_data.get("important_decisions", [])),
            pending_tasks=json.dumps(analysis_data.get("pending_tasks", [])),
            responsibilities=json.dumps(analysis_data.get("responsibilities", [])),
            risks_and_challenges=json.dumps(analysis_data.get("risks_and_challenges", [])),
            recommended_next_steps=json.dumps(analysis_data.get("recommended_next_steps", [])),
            knowledge_gaps=json.dumps(analysis_data.get("knowledge_gaps", [])),
            completeness_score=analysis_data.get("handover_completeness_score", 70),
            ai_provider=provider
        )
        db.add(analysis)
        doc.status = "analyzed"
        db.commit()
        db.refresh(analysis)

    return format_analysis_response(analysis, doc.filename)

@app.get("/api/analysis/all", response_model=List[AnalysisResponse])
def get_all_analyses(db: Session = Depends(get_db)):
    analyses = db.query(Analysis).join(Document).order_by(Analysis.created_at.desc()).all()
    results = []
    for a in analyses:
        doc_name = a.document.filename if a.document else f"Document #{a.document_id}"
        results.append(format_analysis_response(a, doc_name))
    return results

# ============================================================================
# KNOWLEDGE GAPS & RISK AUDIT ENDPOINTS
# ============================================================================

@app.get("/api/gaps/summary")
def get_knowledge_gaps_summary(db: Session = Depends(get_db)):
    analyses = db.query(Analysis).join(Document).all()
    all_gaps = []
    for a in analyses:
        doc_name = a.document.filename if a.document else "Unknown Document"
        try:
            gaps_list = json.loads(a.knowledge_gaps) if a.knowledge_gaps else []
            for idx, g in enumerate(gaps_list):
                all_gaps.append({
                    "id": f"{a.id}-{idx}",
                    "document_id": a.document_id,
                    "document_name": doc_name,
                    "gap_category": g.get("gap_category", "General"),
                    "description": g.get("description", ""),
                    "impact_level": g.get("impact_level", "Medium"),
                    "recommended_action": g.get("recommended_action", ""),
                    "status": g.get("status", "Open")
                })
        except Exception:
            pass

    critical_count = sum(1 for g in all_gaps if g["impact_level"] == "Critical")
    high_count = sum(1 for g in all_gaps if g["impact_level"] == "High")
    open_count = sum(1 for g in all_gaps if g["status"] == "Open")

    return {
        "total_gaps": len(all_gaps),
        "critical_count": critical_count,
        "high_count": high_count,
        "open_count": open_count,
        "gaps": all_gaps
    }

# ============================================================================
# AI KNOWLEDGE ASSISTANT (CHAT) ENDPOINTS
# ============================================================================

@app.post("/api/chat/ask", response_model=ChatAnswerResponse)
def ask_knowledge_assistant(
    request: ChatAskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user)
):
    # Retrieve documents to search
    query = db.query(Document)
    if request.document_ids:
        query = query.filter(Document.id.in_(request.document_ids))
    
    docs = query.all()
    if not docs:
        docs = db.query(Document).all()

    docs_payload = [
        {"id": d.id, "filename": d.filename, "extracted_text": d.extracted_text}
        for d in docs
    ]

    # Run AI answer generation
    result = answer_question_from_documents(request.question, docs_payload)

    # Save to chat history
    user_msg = ChatMessage(
        user_id=current_user.id if current_user else None,
        role="user",
        content=request.question,
        document_ids=json.dumps(request.document_ids or [d.id for d in docs]),
        citations="[]"
    )
    db.add(user_msg)

    asst_msg = ChatMessage(
        user_id=current_user.id if current_user else None,
        role="assistant",
        content=result["answer"],
        document_ids=json.dumps(request.document_ids or [d.id for d in docs]),
        citations=json.dumps(result.get("citations", []))
    )
    db.add(asst_msg)
    db.commit()

    return ChatAnswerResponse(
        answer=result["answer"],
        citations=result.get("citations", []),
        found_in_docs=result["found_in_docs"],
        ai_provider=result.get("ai_provider", "system")
    )

@app.get("/api/chat/history", response_model=List[ChatMessageOut])
def get_chat_history(limit: int = 50, db: Session = Depends(get_db)):
    msgs = db.query(ChatMessage).order_by(ChatMessage.created_at.asc()).limit(limit).all()
    out = []
    for m in msgs:
        def safe_json(val, default):
            try:
                return json.loads(val) if val else default
            except Exception:
                return default
        out.append(ChatMessageOut(
            id=m.id,
            role=m.role,
            content=m.content,
            document_ids=safe_json(m.document_ids, []),
            citations=safe_json(m.citations, []),
            created_at=m.created_at
        ))
    return out

@app.delete("/api/chat/clear")
def clear_chat_history(db: Session = Depends(get_db)):
    db.query(ChatMessage).delete()
    db.commit()
    return {"message": "Chat conversation cleared."}

# ============================================================================
# HANDOVER REPORT & PDF EXPORT ENDPOINTS
# ============================================================================

@app.post("/api/reports/generate", response_model=HandoverReportOut)
def generate_report(
    req: HandoverReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user)
):
    # Collect requested documents (or all if none specified)
    if req.document_ids:
        docs = db.query(Document).filter(Document.id.in_(req.document_ids)).all()
    else:
        docs = db.query(Document).all()

    if not docs:
        raise HTTPException(status_code=400, detail="Cannot generate handover report without documents. Please upload documents first.")

    # Aggregate document contents and analyses
    combined_texts = []
    composite_decisions = []
    composite_tasks = []
    composite_resps = []
    composite_risks = []
    composite_steps = []
    composite_gaps = []
    tech_set = set()

    for d in docs:
        combined_texts.append(f"--- Document: {d.filename} ---\n{d.extracted_text}")
        if d.analysis:
            def get_json(col, default):
                try:
                    val = col[0] if isinstance(col, tuple) else col
                    return json.loads(val) if val else default
                except Exception:
                    return default

            composite_decisions.extend(get_json(d.analysis.important_decisions, []))
            composite_tasks.extend(get_json(d.analysis.pending_tasks, []))
            composite_resps.extend(get_json(d.analysis.responsibilities, []))
            composite_risks.extend(get_json(d.analysis.risks_and_challenges, []))
            composite_steps.extend(get_json(d.analysis.recommended_next_steps, []))
            composite_gaps.extend(get_json(d.analysis.knowledge_gaps, []))
            ov = get_json(d.analysis.project_overview, {})
            for t in ov.get("key_technologies", []):
                if t != "Not Found in Documents":
                    tech_set.add(t)

    # Synthesize composite sections
    doc_titles = ", ".join([d.filename for d in docs])
    summary_text = (
        f"Executive Handover Package synthesized across {len(docs)} transition documents ({doc_titles}). "
        f"Covers key architectural decisions, unresolved tasks, risk exposures, and open knowledge transfer items."
    )

    composite_sections = {
        "project_overview": {
            "summary": summary_text,
            "domain": "Cross-System Architecture & Engineering Operations",
            "current_status": "Knowledge Transition in Progress",
            "key_technologies": list(tech_set)[:8] or ["Python", "FastAPI", "React", "PostgreSQL", "AWS"]
        },
        "important_decisions": composite_decisions[:6],
        "pending_tasks": composite_tasks[:10],
        "responsibilities": composite_resps[:6],
        "risks_and_challenges": composite_risks[:8],
        "recommended_next_steps": composite_steps[:5],
        "knowledge_gaps": composite_gaps[:8]
    }

    report = HandoverReport(
        user_id=current_user.id if current_user else None,
        title=req.title,
        target_role=req.target_role or "Incoming Lead / Successor",
        departing_employee=req.departing_employee or (current_user.full_name if current_user else "Outgoing Staff"),
        successor_name=req.successor_name or "Designated Team",
        document_ids=json.dumps([d.id for d in docs]),
        summary=summary_text,
        sections_json=json.dumps(composite_sections),
        status="ready"
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Generate PDF export
    try:
        pdf_path = generate_handover_pdf(
            report_id=report.id,
            title=report.title,
            target_role=report.target_role,
            departing_employee=report.departing_employee,
            successor_name=report.successor_name,
            sections=composite_sections
        )
        report.pdf_path = pdf_path
        db.commit()
    except Exception as e:
        print(f"PDF generation error: {e}")

    user_email = current_user.email if current_user else "anonymous"
    log_audit(db, current_user.id if current_user else None, user_email, "REPORT_GENERATE", "report", str(report.id), f"Generated report '{report.title}' with PDF export")

    return HandoverReportOut(
        id=report.id,
        title=report.title,
        target_role=report.target_role,
        departing_employee=report.departing_employee,
        successor_name=report.successor_name,
        document_ids=[d.id for d in docs],
        summary=report.summary,
        sections_json=composite_sections,
        pdf_path=report.pdf_path,
        status=report.status,
        created_at=report.created_at
    )

@app.get("/api/reports", response_model=List[HandoverReportOut])
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(HandoverReport).order_by(HandoverReport.created_at.desc()).all()
    results = []
    for r in reports:
        def safe_json(val, default):
            try:
                return json.loads(val) if val else default
            except Exception:
                return default
        results.append(HandoverReportOut(
            id=r.id,
            title=r.title,
            target_role=r.target_role,
            departing_employee=r.departing_employee,
            successor_name=r.successor_name,
            document_ids=safe_json(r.document_ids, []),
            summary=r.summary,
            sections_json=safe_json(r.sections_json, {}),
            pdf_path=r.pdf_path,
            status=r.status,
            created_at=r.created_at
        ))
    return results

@app.get("/api/reports/{report_id}", response_model=HandoverReportOut)
def get_report(report_id: int, db: Session = Depends(get_db)):
    r = db.query(HandoverReport).filter(HandoverReport.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Handover report not found.")
    def safe_json(val, default):
        try:
            return json.loads(val) if val else default
        except Exception:
            return default
    return HandoverReportOut(
        id=r.id,
        title=r.title,
        target_role=r.target_role,
        departing_employee=r.departing_employee,
        successor_name=r.successor_name,
        document_ids=safe_json(r.document_ids, []),
        summary=r.summary,
        sections_json=safe_json(r.sections_json, {}),
        pdf_path=r.pdf_path,
        status=r.status,
        created_at=r.created_at
    )

@app.get("/api/reports/{report_id}/pdf")
def download_report_pdf(report_id: int, db: Session = Depends(get_db)):
    r = db.query(HandoverReport).filter(HandoverReport.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Handover report not found.")

    # Re-generate if file missing on disk
    if not r.pdf_path or not os.path.exists(r.pdf_path):
        try:
            sections = json.loads(r.sections_json) if r.sections_json else {}
            pdf_path = generate_handover_pdf(
                report_id=r.id,
                title=r.title,
                target_role=r.target_role,
                departing_employee=r.departing_employee,
                successor_name=r.successor_name,
                sections=sections
            )
            r.pdf_path = pdf_path
            db.commit()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

    clean_filename = f"{r.title.replace(' ', '_')}_Handover.pdf"
    return FileResponse(
        path=r.pdf_path,
        filename=clean_filename,
        media_type="application/pdf"
    )

# ============================================================================
# AUDIT LOGS & DASHBOARD STATS
# ============================================================================

@app.get("/api/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return logs

@app.get("/api/analysis/stats", response_model=StatsOverviewResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_docs = db.query(Document).count()
    analyzed_docs = db.query(Document).filter(Document.status == "analyzed").count()
    total_reports = db.query(HandoverReport).count()

    analyses = db.query(Analysis).all()
    scores = [a.completeness_score for a in analyses if a.completeness_score]
    avg_score = int(sum(scores) / len(scores)) if scores else 70

    total_gaps = 0
    critical_risks = 0
    pending_tasks = 0

    for a in analyses:
        def safe_json(val):
            try:
                v = val[0] if isinstance(val, tuple) else val
                return json.loads(v) if v else []
            except Exception:
                return []

        gaps = safe_json(a.knowledge_gaps)
        total_gaps += len(gaps)

        risks = safe_json(a.risks_and_challenges)
        critical_risks += sum(1 for r in risks if r.get("severity") in ["Critical", "High"])

        tasks = safe_json(a.pending_tasks)
        pending_tasks += len(tasks)

    # Determine knowledge risk score
    if critical_risks > 3 or total_gaps > 6:
        risk_level = "High"
    elif critical_risks > 1 or total_gaps > 2:
        risk_level = "Moderate"
    else:
        risk_level = "Low"

    recent_docs_records = db.query(Document).order_by(Document.created_at.desc()).limit(5).all()
    recent_docs = [
        DocumentOut(
            id=d.id,
            filename=d.filename,
            file_type=d.file_type,
            file_size=d.file_size,
            char_count=d.char_count,
            word_count=d.word_count,
            status=d.status,
            created_at=d.created_at,
            has_analysis=bool(d.analysis)
        )
        for d in recent_docs_records
    ]

    return StatsOverviewResponse(
        total_documents=total_docs,
        analyzed_documents=analyzed_docs,
        total_gaps_detected=total_gaps,
        critical_risks_count=critical_risks,
        pending_tasks_count=pending_tasks,
        average_completeness_score=avg_score,
        reports_generated=total_reports,
        recent_documents=recent_docs,
        knowledge_risk_score=risk_level
    )

# ============================================================================
# SYSTEM STATUS & DYNAMIC CONFIGURATION
# ============================================================================

@app.get("/api/system/status", response_model=SystemStatusResponse)
def get_system_status(db: Session = Depends(get_db)):
    gemini_ok = is_gemini_configured()
    doc_count = db.query(Document).count()
    rep_count = db.query(HandoverReport).count()

    # Calculate storage size
    storage_bytes = 0
    if settings.UPLOAD_DIR.exists():
        storage_bytes += sum(f.stat().st_size for f in settings.UPLOAD_DIR.glob("**/*") if f.is_file())
    if settings.REPORTS_DIR.exists():
        storage_bytes += sum(f.stat().st_size for f in settings.REPORTS_DIR.glob("**/*") if f.is_file())

    return SystemStatusResponse(
        status="operational",
        gemini_connected=gemini_ok,
        gemini_model=settings.GEMINI_MODEL,
        database_connected=True,
        documents_count=doc_count,
        reports_count=rep_count,
        storage_used_bytes=storage_bytes
    )

@app.post("/api/system/seed")
def trigger_seed(db: Session = Depends(get_db)):
    """Allows manual trigger to restore demo files & analysis."""
    seed_database(db)
    return {"message": "Demo sample documents and handover data seeded successfully."}

@app.post("/api/system/update-api-key")
def update_gemini_key(api_key: str = Form(...)):
    """Enables setting the Gemini API Key from the frontend UI without restart."""
    clean_key = api_key.strip()
    settings.GEMINI_API_KEY = clean_key
    os.environ["GEMINI_API_KEY"] = clean_key

    # Also update backend/.env
    env_file = Path(__file__).resolve().parent.parent / ".env"
    if env_file.exists():
        try:
            content = env_file.read_text()
            if "GEMINI_API_KEY=" in content:
                import re
                new_content = re.sub(r"GEMINI_API_KEY=.*", f"GEMINI_API_KEY={clean_key}", content)
                env_file.write_text(new_content)
        except Exception:
            pass

    return {
        "message": "Gemini API key updated successfully.",
        "gemini_connected": is_gemini_configured()
    }

