import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(100), default="Engineering Lead")
    department = Column(String(100), default="Technology")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("HandoverReport", back_populates="creator", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # 'pdf', 'docx', 'txt'
    file_size = Column(Integer, nullable=False) # bytes
    file_path = Column(String(500), nullable=False)
    extracted_text = Column(Text, nullable=False, default="")
    char_count = Column(Integer, default=0)
    word_count = Column(Integer, default=0)
    status = Column(String(50), default="processed") # 'uploaded', 'processed', 'analyzed', 'error'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="documents")
    analysis = relationship("Analysis", back_populates="document", uselist=False, cascade="all, delete-orphan")

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Structured JSON-serialized columns
    project_overview = Column(Text, nullable=False, default="{}")
    important_decisions = Column(Text, nullable=False, default="[]")
    pending_tasks = Column(Text, nullable=False, default="[]")
    responsibilities = Column(Text, nullable=False, default="[]")
    risks_and_challenges = Column(Text, nullable=False, default="[]")
    recommended_next_steps = Column(Text, nullable=False, default="[]")
    knowledge_gaps = Column(Text, nullable=False, default="[]")
    
    completeness_score = Column(Integer, default=70) # 0 to 100
    ai_provider = Column(String(50), default="gemini") # 'gemini' or 'heuristic_engine'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="analysis")
    user = relationship("User", back_populates="analyses")

class HandoverReport(Base):
    __tablename__ = "handover_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(255), nullable=False)
    target_role = Column(String(255), default="Successor / Incoming Lead")
    departing_employee = Column(String(255), default="Staff Member")
    successor_name = Column(String(255), default="TBD / Incoming Team")
    document_ids = Column(Text, default="[]") # JSON list of document IDs included
    summary = Column(Text, default="")
    sections_json = Column(Text, default="{}") # Full composite structured report
    pdf_path = Column(String(500), nullable=True)
    status = Column(String(50), default="ready") # 'ready', 'generating', 'archived'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    creator = relationship("User", back_populates="reports")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    role = Column(String(20), nullable=False) # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    document_ids = Column(Text, default="[]") # JSON list of IDs referenced
    citations = Column(Text, default="[]") # JSON list of citations
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(255), default="system")
    action = Column(String(100), nullable=False) # e.g., 'DOC_UPLOAD', 'AI_ANALYZE', 'REPORT_EXPORT'
    entity_type = Column(String(50), nullable=False) # 'document', 'analysis', 'report', 'auth'
    entity_id = Column(String(100), default="")
    details = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

