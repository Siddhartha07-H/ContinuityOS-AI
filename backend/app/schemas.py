from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(..., min_length=6)
    role: Optional[str] = "Engineering Lead"
    department: Optional[str] = "Technology"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    department: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# --- Document Schemas ---
class DocumentOut(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    char_count: int
    word_count: int
    status: str
    created_at: datetime
    has_analysis: bool = False

    class Config:
        from_attributes = True

class DocumentDetail(DocumentOut):
    extracted_text: str

# --- Structured Analysis Schemas ---
class DecisionItem(BaseModel):
    title: str
    decision: str
    rationale: str
    status: Optional[str] = "Approved"
    date_or_context: Optional[str] = "Current Architecture"

class TaskItem(BaseModel):
    title: str
    description: str
    priority: str = "Medium" # High, Medium, Low
    owner: str = "Unassigned"
    due_or_timeline: Optional[str] = "Next Sprint"
    blocker: Optional[str] = "None"

class ResponsibilityItem(BaseModel):
    role_or_area: str
    primary_owner: str
    backup_person: Optional[str] = "Not Found in Documents"
    key_duties: List[str] = []
    dependencies: Optional[str] = "None"

class RiskItem(BaseModel):
    risk_title: str
    severity: str = "Medium" # Critical, High, Medium, Low
    impact: str
    mitigation_plan: str

class NextStepItem(BaseModel):
    step_number: int
    title: str
    immediate_action: str
    owner: Optional[str] = "Successor"
    expected_outcome: str

class KnowledgeGapItem(BaseModel):
    gap_category: str # "Credentials / Access", "Architecture / Runbook", "Contacts", "Code Repositories", "Deployment Process"
    description: str
    impact_level: str = "Medium" # Critical, High, Medium
    recommended_action: str
    status: str = "Open" # Open, Resolved

class ProjectOverviewData(BaseModel):
    summary: str
    domain: Optional[str] = "Enterprise Software"
    current_status: Optional[str] = "Active / Transitioning"
    key_technologies: List[str] = []

class AnalysisPayload(BaseModel):
    project_overview: ProjectOverviewData
    important_decisions: List[DecisionItem]
    pending_tasks: List[TaskItem]
    responsibilities: List[ResponsibilityItem]
    risks_and_challenges: List[RiskItem]
    recommended_next_steps: List[NextStepItem]
    knowledge_gaps: List[KnowledgeGapItem]
    completeness_score: int = 70
    ai_provider: str = "gemini"

class AnalysisResponse(BaseModel):
    id: int
    document_id: int
    document_name: str
    project_overview: Dict[str, Any]
    important_decisions: List[Dict[str, Any]]
    pending_tasks: List[Dict[str, Any]]
    responsibilities: List[Dict[str, Any]]
    risks_and_challenges: List[Dict[str, Any]]
    recommended_next_steps: List[Dict[str, Any]]
    knowledge_gaps: List[Dict[str, Any]]
    completeness_score: int
    ai_provider: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Handover Report Schemas ---
class HandoverReportCreate(BaseModel):
    title: str
    target_role: Optional[str] = "Successor / Incoming Lead"
    departing_employee: Optional[str] = "Outgoing Engineer"
    successor_name: Optional[str] = "Incoming Team"
    document_ids: List[int] = []

class HandoverReportOut(BaseModel):
    id: int
    title: str
    target_role: str
    departing_employee: str
    successor_name: str
    document_ids: List[int]
    summary: str
    sections_json: Dict[str, Any]
    pdf_path: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- AI Knowledge Assistant / Chat Schemas ---
class ChatAskRequest(BaseModel):
    question: str
    document_ids: Optional[List[int]] = None # If None/empty, searches all uploaded documents

class ChatCitation(BaseModel):
    document_name: str
    document_id: int
    excerpt: str

class ChatAnswerResponse(BaseModel):
    answer: str
    citations: List[ChatCitation] = []
    found_in_docs: bool
    ai_provider: str

class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    document_ids: List[int]
    citations: List[Dict[str, Any]]
    created_at: datetime

# --- Audit Log Schema ---
class AuditLogOut(BaseModel):
    id: int
    user_email: str
    action: str
    entity_type: str
    entity_id: str
    details: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Dashboard & System Schemas ---
class StatsOverviewResponse(BaseModel):
    total_documents: int
    analyzed_documents: int
    total_gaps_detected: int
    critical_risks_count: int
    pending_tasks_count: int
    average_completeness_score: int
    reports_generated: int
    recent_documents: List[DocumentOut]
    knowledge_risk_score: str # "Low", "Moderate", "High", "Critical"

class SystemStatusResponse(BaseModel):
    status: str = "operational"
    gemini_connected: bool
    gemini_model: str
    database_connected: bool
    documents_count: int
    reports_count: int
    storage_used_bytes: int

