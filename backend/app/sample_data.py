import os
import json
import datetime
from pathlib import Path
from sqlalchemy.orm import Session
import docx
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.config import settings
from app.models import User, Document, Analysis, HandoverReport, AuditLog
from app.auth import hash_password
from app.ai_service import heuristic_analysis
from app.report_generator import generate_handover_pdf

DEMO_USER_EMAIL = "demo@continuityos.ai"
DEMO_USER_PASSWORD = "Password123!"

SAMPLE_DOC_1_TEXT = """# Cloud Platform Migration & Core API Handover Notes
Author: Alex Vance (Lead Platform Architect)
Date: October 2024
Role Transition: Staff Platform Architect to Incoming Lead
Department: Core Infrastructure Engineering

## 1. Project Overview & Current State
The Cloud Migration initiative migrated 42 legacy microservices from on-premise VMware to AWS Kubernetes (EKS).
The project is currently 90% complete. Phase 1 (Ingestion & Billing APIs) is in full production.
Phase 2 (Reporting & Analytics) is in staging with load testing underway.
Key Technologies: AWS EKS, Terraform, Go, FastAPI, PostgreSQL (Aurora), Redis, Kafka, Datadog.

## 2. Key Architectural Decisions
- Decision: Adopted Terraform workspaces over Terragrunt.
  Rationale: Reduced third-party dependency surface and allowed unified CI/CD integration with GitHub Actions. Status: Approved.
- Decision: Event-driven pub/sub messaging moved to Managed Kafka (Amazon MSK).
  Rationale: Avoided maintaining in-house Zookeeper clusters and simplified partition scaling.
- Decision: Secrets transitioned to AWS Secrets Manager.
  Rationale: Centralized audit trail and automatic rotation for RDS master credentials.

## 3. Pending Tasks & Outstanding Deliverables
- [High] Finalize Aurora PostgreSQL read-replica failover test in Staging (Target: Sprint 24).
- [High] Deprecate legacy Redis cluster `redis-prod-01.internal` by end of quarter.
- [Medium] Migrate lingering cron jobs from Celery worker nodes to Kubernetes CronJobs.
- [Medium] Update Terraform modules to version 1.8.x.
- [Low] Archive obsolete S3 buckets from the 2022 proof-of-concept.

## 4. Operational Roles & Responsibilities
- Core Cluster SRE: Alex Vance (Primary). Backup Person: Not Found in Documents.
- Database Administration: Rachel Chen (Aurora DB Admin).
- Monitoring & Alerting: Platform Ops Team via Slack #platform-alerts.
- Dependencies: Payment Team (billing webhooks) and Data Science (Kafka stream consumer).

## 5. Transition Risks & Single Points of Failure
- Risk: The Kafka consumer offset rebalancing script is custom-built and only Alex has run it during cluster restarts. Single point of failure.
- Risk: Production TLS certificates for internal gRPC mesh renew manually every 90 days. Next renewal is Nov 28.
- Risk: Staging database replica has a known memory leak under synthetic spike tests (>15,000 req/sec).

## 6. Recommended Next Steps for Successor
1. Perform a simulated read-replica failover test with Rachel Chen before Nov 15.
2. Review the Datadog dashboard 'Core Infrastructure - Executive Health'.
3. Join the weekly Platform Architecture Sync every Tuesday at 10:00 AM UTC.
"""

SAMPLE_DOC_2_TEXT = """# Payment Gateway Integration Runbook & Service Architecture
Author: Sarah Jenkins (Senior FinTech Engineer)
Role Transition: Staff FinTech Engineer to Platform SRE
Date: November 2024

## System Summary
The Payment Gateway service (PayCore-v3) coordinates card payments, recurring subscriptions, and ACH settlements through Stripe and Adyen.
Current monthly processed volume: $14.2M across 6 currencies (USD, EUR, GBP, CAD, AUD, JPY).
Tech Stack: Python FastAPI, Stripe SDK, Adyen HPP, PostgreSQL, Redis idempotency cache.

## Architectural Decisions
- Dual Gateway Strategy: All transactions > $500 route to Adyen for reduced interchange fees; all micropayments route to Stripe.
- Idempotency Keys: Enforced 24-hour TTL on Redis payment tokens to prevent double-charging during network drops.
- Webhook Replay Protection: HMAC-SHA256 signatures validated at API Gateway edge before invoking worker services.

## Pending Items
- Complete 3DS 2.2 authentication upgrade for UK debit cards before mandatory banking deadline. Owner: Payment Squad.
- Resolve webhook timeout bug on refund triggers (ticket FIN-4091). Priority: High.
- Clean up inactive merchant accounts in test sandbox.

## Identified Gaps & Missing Documentation
- Production encryption keys for PCI-DSS token storage are held in HSM; runbook for key rotation is unwritten.
- Emergency contact for Adyen account manager is missing from documentation.
- No automated disaster recovery failover drill has been conducted for the ACH settlement pipeline.
"""

SAMPLE_DOC_3_TEXT = """# Senior DevOps Engineer Transition Notes
Departing Engineer: Marcus Brody
Transition Lead: Incoming DevOps Staff
Created: November 2024

Summary of Responsibilities:
Marcus maintains our CI/CD pipelines, Docker container base images, and Helm charts for all 18 production microservices.

Core Responsibilities:
- Helm Chart repository management (hosted on internal Harbor registry).
- GitHub Actions shared workflow maintenance.
- Zero-downtime deployment orchestration using ArgoCD.
- Primary on-call rotation lead for tier-1 infrastructure alerts.
- Designated Backup Engineer: Not Found in Documents.

Immediate Action Items & Next Steps:
1. Transfer ownership of the Docker Hub corporate organization and GitHub team admin privileges.
2. Review ArgoCD sync policies: auto-prune is currently disabled on production namespaces.
3. Conduct dry-run rollback for the user-auth service using Helm rollback command.

Knowledge Gaps Identified:
- Root VPN and firewall credentials are only stored in Marcus's local passkey vault. Not found in team password manager.
- External vendor contract for Datadog log retention expires next month; point of contact is not documented.
"""

def create_sample_files(upload_dir: Path):
    """Creates physical .docx, .pdf, and .txt files in the upload directory."""
    upload_dir.mkdir(parents=True, exist_ok=True)

    # 1. DOCX
    docx_path = upload_dir / "Cloud_Platform_Migration_Handover.docx"
    if not docx_path.exists():
        doc = docx.Document()
        doc.add_heading("Cloud Platform Migration & Core API Handover Notes", 0)
        for line in SAMPLE_DOC_1_TEXT.split("\n"):
            if line.startswith("## "):
                doc.add_heading(line.replace("## ", ""), level=1)
            elif line.startswith("# "):
                pass
            elif line.strip():
                doc.add_paragraph(line)
        doc.save(str(docx_path))

    # 2. PDF
    pdf_path = upload_dir / "Payment_Gateway_Architecture_Runbook.pdf"
    if not pdf_path.exists():
        c = canvas.Canvas(str(pdf_path), pagesize=letter)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(54, 750, "Payment Gateway Integration Runbook & Service Architecture")
        c.setFont("Helvetica", 10)
        y = 720
        for line in SAMPLE_DOC_2_TEXT.split("\n"):
            if y < 60:
                c.showPage()
                c.setFont("Helvetica", 10)
                y = 750
            if line.startswith("## "):
                c.setFont("Helvetica-Bold", 12)
                y -= 10
                c.drawString(54, y, line.replace("## ", ""))
                c.setFont("Helvetica", 10)
                y -= 16
            elif line.startswith("# "):
                pass
            elif line.strip():
                # Simple line wrap
                c.drawString(54, y, line[:90])
                y -= 14
        c.save()

    # 3. TXT
    txt_path = upload_dir / "Senior_DevOps_Engineer_Transition_Notes.txt"
    if not txt_path.exists():
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(SAMPLE_DOC_3_TEXT)

    return [
        ("Cloud_Platform_Migration_Handover.docx", "docx", docx_path, SAMPLE_DOC_1_TEXT),
        ("Payment_Gateway_Architecture_Runbook.pdf", "pdf", pdf_path, SAMPLE_DOC_2_TEXT),
        ("Senior_DevOps_Engineer_Transition_Notes.txt", "txt", txt_path, SAMPLE_DOC_3_TEXT)
    ]

def seed_database(db: Session):
    """Seeds demo user, sample documents, analyses, and handover report."""
    # 1. Demo User
    demo_user = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
    if not demo_user:
        demo_user = User(
            email=DEMO_USER_EMAIL,
            full_name="Alex Vance",
            hashed_password=hash_password(DEMO_USER_PASSWORD),
            role="Principal Platform Architect",
            department="Cloud & Infrastructure"
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

    # 2. Sample Documents
    sample_files = create_sample_files(settings.UPLOAD_DIR)
    created_docs = []

    for filename, file_type, file_path, text in sample_files:
        existing_doc = db.query(Document).filter(Document.filename == filename).first()
        if not existing_doc:
            doc_record = Document(
                user_id=demo_user.id,
                filename=filename,
                file_type=file_type,
                file_size=os.path.getsize(file_path) if file_path.exists() else len(text),
                file_path=str(file_path),
                extracted_text=text,
                char_count=len(text),
                word_count=len(text.split()),
                status="analyzed"
            )
            db.add(doc_record)
            db.commit()
            db.refresh(doc_record)

            # Analyze document
            analysis_data = heuristic_analysis(filename, text)
            analysis_record = Analysis(
                document_id=doc_record.id,
                user_id=demo_user.id,
                project_overview=json.dumps(analysis_data.get("project_overview", {})),
                important_decisions=json.dumps(analysis_data.get("important_decisions", [])),
                pending_tasks=json.dumps(analysis_data.get("pending_tasks", [])),
                responsibilities=json.dumps(analysis_data.get("responsibilities", [])),
                risks_and_challenges=json.dumps(analysis_data.get("risks_and_challenges", [])),
                recommended_next_steps=json.dumps(analysis_data.get("recommended_next_steps", [])),
                knowledge_gaps=json.dumps(analysis_data.get("knowledge_gaps", [])),
                completeness_score=analysis_data.get("handover_completeness_score", 75),
                ai_provider="heuristic_engine"
            )
            db.add(analysis_record)
            db.commit()

            # Audit log
            audit = AuditLog(
                user_id=demo_user.id,
                user_email=demo_user.email,
                action="DOC_SEEDED",
                entity_type="document",
                entity_id=str(doc_record.id),
                details=f"Seeded sample document: {filename}"
            )
            db.add(audit)
            db.commit()
            created_docs.append(doc_record)
        else:
            created_docs.append(existing_doc)

    # 3. Sample Handover Report
    existing_report = db.query(HandoverReport).first()
    if not existing_report and created_docs:
        doc_ids = [d.id for d in created_docs]
        # Aggregate analysis
        composite_analysis = heuristic_analysis("Enterprise Cloud & Platform Transition", SAMPLE_DOC_1_TEXT + "\n\n" + SAMPLE_DOC_2_TEXT)
        
        report = HandoverReport(
            user_id=demo_user.id,
            title="Q4 Platform Architecture & Core Infrastructure Executive Handover",
            target_role="Incoming Principal Platform Lead",
            departing_employee="Alex Vance (Principal Architect)",
            successor_name="Jordan Reed (Incoming Tech Lead)",
            document_ids=json.dumps(doc_ids),
            summary="Comprehensive organizational and technical handover covering cloud migration (90% complete), payment gateway runbooks, and DevOps CI/CD pipeline ownership.",
            sections_json=json.dumps(composite_analysis),
            status="ready"
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        # Generate sample PDF
        try:
            pdf_path = generate_handover_pdf(
                report_id=report.id,
                title=report.title,
                target_role=report.target_role,
                departing_employee=report.departing_employee,
                successor_name=report.successor_name,
                sections=composite_analysis
            )
            report.pdf_path = pdf_path
            db.commit()
        except Exception as e:
            pass

