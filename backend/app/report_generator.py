import os
import datetime
from pathlib import Path
from typing import Dict, Any, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.pdfgen import canvas
from app.config import settings

class NumberedCanvas(canvas.Canvas):
    """Adds running header and footer with total page counts."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages after page 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "ContinuityOS AI — Knowledge Continuity & Handover Report")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)

        # Footer
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        
        timestamp_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        self.drawString(54, 32, f"Confidential & Proprietary • Generated on {timestamp_str}")
        self.drawRightString(558, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def generate_handover_pdf(
    report_id: int,
    title: str,
    target_role: str,
    departing_employee: str,
    successor_name: str,
    sections: Dict[str, Any]
) -> str:
    """
    Generates an executive-grade PDF handover document using ReportLab.
    Returns the absolute path to the generated PDF.
    """
    settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    pdf_filename = f"ContinuityOS_Report_{report_id}_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    output_path = settings.REPORTS_DIR / pdf_filename

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    brand_navy = colors.HexColor("#0F172A")
    brand_blue = colors.HexColor("#2563EB")
    brand_dark_blue = colors.HexColor("#1E40AF")
    text_dark = colors.HexColor("#1E293B")
    text_muted = colors.HexColor("#475569")
    bg_light = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#CBD5E1")
    risk_high = colors.HexColor("#EF4444")
    risk_med = colors.HexColor("#F59E0B")
    risk_low = colors.HexColor("#10B981")

    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=brand_navy
    )

    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=brand_blue
    )

    h1_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=brand_dark_blue,
        spaceBefore=14,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=text_dark
    )

    bold_body_style = ParagraphStyle(
        "BoldBodyDark",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=14,
        textColor=text_dark
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=text_dark
    )

    story = []

    # Title & Metadata Banner
    story.append(Paragraph("ContinuityOS AI", subtitle_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 10))

    meta_data = [
        [
            Paragraph("<b>Target Role:</b>", bold_body_style), Paragraph(target_role, body_style),
            Paragraph("<b>Departing Member:</b>", bold_body_style), Paragraph(departing_employee, body_style)
        ],
        [
            Paragraph("<b>Successor:</b>", bold_body_style), Paragraph(successor_name, body_style),
            Paragraph("<b>Handover Date:</b>", bold_body_style), Paragraph(datetime.datetime.utcnow().strftime("%B %d, %Y"), body_style)
        ]
    ]

    meta_table = Table(meta_data, colWidths=[90, 160, 110, 144])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_light),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))

    # 1. Project & Role Overview
    story.append(Paragraph("1. Project & Role Overview", h1_style))
    overview_data = sections.get("project_overview", {})
    summary_text = overview_data.get("summary", "No overview provided.")
    domain = overview_data.get("domain", "Enterprise Systems")
    status_val = overview_data.get("current_status", "Active Transition")
    tech_stack = ", ".join(overview_data.get("key_technologies", [])) or "None specified"

    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 6))

    ov_bullets = [
        [Paragraph("<b>Domain:</b>", bold_body_style), Paragraph(domain, body_style)],
        [Paragraph("<b>Status:</b>", bold_body_style), Paragraph(status_val, body_style)],
        [Paragraph("<b>Core Stack:</b>", bold_body_style), Paragraph(tech_stack, body_style)]
    ]
    ov_table = Table(ov_bullets, colWidths=[80, 424])
    ov_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(ov_table)
    story.append(Spacer(1, 12))

    # 2. Key Decisions
    story.append(Paragraph("2. Important Architectural & Operational Decisions", h1_style))
    decisions = sections.get("important_decisions", [])
    if decisions:
        dec_rows = [[
            Paragraph("Decision", table_header_style),
            Paragraph("Rationale", table_header_style),
            Paragraph("Status / Context", table_header_style)
        ]]
        for d in decisions:
            dec_rows.append([
                Paragraph(f"<b>{d.get('title', '')}</b><br/>{d.get('decision', '')}", table_cell_style),
                Paragraph(d.get("rationale", ""), table_cell_style),
                Paragraph(f"{d.get('status', 'Approved')}<br/><font color='#64748B'>{d.get('date_or_context', '')}</font>", table_cell_style)
            ])
        dec_table = Table(dec_rows, colWidths=[184, 200, 120])
        dec_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), brand_navy),
            ('BOX', (0, 0), (-1, -1), 1, border_color),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(dec_table)
    else:
        story.append(Paragraph("No critical decisions recorded in documents.", body_style))
    story.append(Spacer(1, 12))

    # 3. Pending Tasks
    story.append(Paragraph("3. Pending Tasks & Outstanding Deliverables", h1_style))
    tasks = sections.get("pending_tasks", [])
    if tasks:
        task_rows = [[
            Paragraph("Priority", table_header_style),
            Paragraph("Task & Description", table_header_style),
            Paragraph("Owner", table_header_style),
            Paragraph("Target Timeline", table_header_style)
        ]]
        for t in tasks:
            task_rows.append([
                Paragraph(f"<b>{t.get('priority', 'Medium')}</b>", table_cell_style),
                Paragraph(f"<b>{t.get('title', '')}</b><br/>{t.get('description', '')}", table_cell_style),
                Paragraph(t.get("owner", "Unassigned"), table_cell_style),
                Paragraph(t.get("due_or_timeline", "Next Sprint"), table_cell_style)
            ])
        task_table = Table(task_rows, colWidths=[65, 239, 100, 100])
        task_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), brand_dark_blue),
            ('BOX', (0, 0), (-1, -1), 1, border_color),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(task_table)
    else:
        story.append(Paragraph("No pending tasks recorded.", body_style))
    story.append(Spacer(1, 12))

    # 4. Responsibilities Matrix
    story.append(Paragraph("4. Roles & Responsibilities Matrix", h1_style))
    resps = sections.get("responsibilities", [])
    if resps:
        resp_rows = [[
            Paragraph("Role / Functional Domain", table_header_style),
            Paragraph("Primary Lead", table_header_style),
            Paragraph("Backup Person", table_header_style),
            Paragraph("Key Duties & Dependencies", table_header_style)
        ]]
        for r in resps:
            duties = "<br/>• " + "<br/>• ".join(r.get("key_duties", [])) if r.get("key_duties") else "General oversight"
            resp_rows.append([
                Paragraph(f"<b>{r.get('role_or_area', '')}</b>", table_cell_style),
                Paragraph(r.get("primary_owner", ""), table_cell_style),
                Paragraph(f"<font color='{'#EF4444' if r.get('backup_person') == 'Not Found in Documents' else '#10B981'}'>{r.get('backup_person', 'Not Found in Documents')}</font>", table_cell_style),
                Paragraph(f"{duties}<br/><b>Deps:</b> {r.get('dependencies', 'None')}", table_cell_style)
            ])
        resp_table = Table(resp_rows, colWidths=[120, 94, 110, 180])
        resp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), brand_navy),
            ('BOX', (0, 0), (-1, -1), 1, border_color),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(resp_table)
    story.append(Spacer(1, 12))

    # 5. Risks and Mitigation
    story.append(Paragraph("5. Critical Risks & Challenges", h1_style))
    risks = sections.get("risks_and_challenges", [])
    if risks:
        risk_rows = [[
            Paragraph("Severity", table_header_style),
            Paragraph("Risk Item & Impact", table_header_style),
            Paragraph("Mitigation Strategy", table_header_style)
        ]]
        for rk in risks:
            sev = rk.get("severity", "Medium")
            risk_rows.append([
                Paragraph(f"<b>{sev}</b>", table_cell_style),
                Paragraph(f"<b>{rk.get('risk_title', '')}</b><br/>{rk.get('impact', '')}", table_cell_style),
                Paragraph(rk.get("mitigation_plan", ""), table_cell_style)
            ])
        risk_table = Table(risk_rows, colWidths=[65, 239, 200])
        risk_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#991B1B")), # Burgundy red header for risks
            ('BOX', (0, 0), (-1, -1), 1, border_color),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(risk_table)
    story.append(Spacer(1, 12))

    # 6. Recommended Next Steps
    story.append(Paragraph("6. Recommended Next Steps for Successor", h1_style))
    steps = sections.get("recommended_next_steps", [])
    if steps:
        step_rows = [[
            Paragraph("#", table_header_style),
            Paragraph("Milestone & Immediate Action", table_header_style),
            Paragraph("Owner", table_header_style),
            Paragraph("Expected Deliverable", table_header_style)
        ]]
        for s in steps:
            step_rows.append([
                Paragraph(str(s.get("step_number", "")), table_cell_style),
                Paragraph(f"<b>{s.get('title', '')}</b><br/>{s.get('immediate_action', '')}", table_cell_style),
                Paragraph(s.get("owner", "Successor"), table_cell_style),
                Paragraph(s.get("expected_outcome", ""), table_cell_style)
            ])
        step_table = Table(step_rows, colWidths=[30, 264, 90, 120])
        step_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), brand_dark_blue),
            ('BOX', (0, 0), (-1, -1), 1, border_color),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(step_table)
    story.append(Spacer(1, 12))

    # 7. Knowledge Gap Detection (Highlighting missing info)
    story.append(Paragraph("7. Knowledge Gap & Single Point of Failure (SPOF) Analysis", h1_style))
    gaps = sections.get("knowledge_gaps", [])
    if gaps:
        gap_rows = [[
            Paragraph("Impact", table_header_style),
            Paragraph("Identified Documentation Gap", table_header_style),
            Paragraph("Mandatory Action Before Departure", table_header_style)
        ]]
        for g in gaps:
            gap_rows.append([
                Paragraph(f"<b>{g.get('impact_level', 'High')}</b>", table_cell_style),
                Paragraph(f"<b>{g.get('gap_category', '')}:</b><br/>{g.get('description', '')}", table_cell_style),
                Paragraph(g.get("recommended_action", ""), table_cell_style)
            ])
        gap_table = Table(gap_rows, colWidths=[65, 239, 200])
        gap_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#334155")),
            ('BOX', (0, 0), (-1, -1), 1, border_color),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(gap_table)
    story.append(Spacer(1, 16))

    # Sign-off & Handover Acceptance
    sign_off_content = [
        Paragraph("8. Handover Sign-Off & Acceptance", h1_style),
        Spacer(1, 4),
        Paragraph("Both parties acknowledge that the handover assets and documentation detailed above have been transferred, reviewed, and all open questions identified.", body_style),
        Spacer(1, 12),
        Table([
            [
                Paragraph("<b>Departing Employee Signature:</b> ____________________", body_style),
                Paragraph("<b>Date:</b> ______________", body_style)
            ],
            [
                Paragraph("<b>Successor / Lead Signature:</b> ____________________", body_style),
                Paragraph("<b>Date:</b> ______________", body_style)
            ]
        ], colWidths=[340, 164], style=[
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8)
        ])
    ]
    story.append(KeepTogether(sign_off_content))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    return str(output_path)

