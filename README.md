# ContinuityOS AI — Intelligent Knowledge Continuity & Employee Handover Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.115-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite_8-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![PyMuPDF](https://img.shields.io/badge/Document_Parsing-PyMuPDF_+_python--docx-FF6F00?style=for-the-badge)](https://pymupdf.readthedocs.io/)

ContinuityOS AI is an intelligent knowledge continuity and employee handover platform designed to prevent institutional knowledge loss during employee offboarding, team re-organizations, and leadership transitions.

---

## 🌟 Key Capabilities & Features

1. **Multiformat Document Ingestion (PDF, Word DOCX, TXT)**
   - High-fidelity text and table extraction powered by **PyMuPDF (`fitz`)**, **python-docx**, and plain text decoders.
   - Enforces strict file validation (.pdf, .docx, .txt) and file size limits (up to 25MB).
   - Real-time word count, character count, and structural metadata parsing.

2. **Handover Intelligence & Analysis Engine**
   - Automatically processes raw transition notes, architecture specs, and runbooks.
   - Built to support **Google Gemini API (`gemini-1.5-flash`)** when configured with an API key, with seamless out-of-the-box operation via our built-in deterministic heuristic transition analyzer.
   - Produces structured 6-pillar handover intelligence:
     - **Project & Role Overview**: Scope, domain, current state, key technologies.
     - **Important Decisions**: Decision records, rationale, architectural trade-offs, and context.
     - **Pending Tasks & Deliverables**: Priority matrix (High/Medium/Low), assigned owners, blockers, target dates.
     - **Roles & Responsibilities Matrix**: Functional areas, primary owners, designated backup personnel.
     - **Risks & Challenges**: Severity ratings (Critical/High/Medium), organizational consequences, mitigations.
     - **Recommended Next Steps**: Numbered immediate successor milestones for weeks 1–2.
   - **Zero-Hallucination Grounding**: The AI strictly marks absent facts as `"Not Found in Documents"`.

3. **Knowledge Gap & Single Point of Failure (SPOF) Detection**
   - Automatically flags unwritten procedures, missing credentials, unassigned backup owners, and unlisted vendor contacts.
   - Includes a one-click **"Copy Offboarding Inquiry"** button to send targeted questions to the departing employee on Slack or Email.

4. **Grounded AI Knowledge Assistant (Chat)**
   - Conversational question answering strictly constrained to facts in uploaded documents.
   - Never invents answers—clearly outputs `"Not Found in Documents"` for unverified queries.
   - Provides verified document citations with excerpts.

5. **Executive PDF Handover Report Generation**
   - Assembles multi-document transition packages into executive-grade downloadable PDFs using **ReportLab**.
   - Features structured tables, colored severity badges, page numbers, and a mutual sign-off acceptance section.

6. **Audit History & Compliance Tracking**
   - Immutable audit trail recording every document upload, AI analysis execution, and report export.

7. **Out-of-the-Box Preloaded Sample Data**
   - Automatically seeds realistic sample handover documents on first launch:
     - `Cloud_Platform_Migration_Handover.docx`
     - `Payment_Gateway_Architecture_Runbook.pdf`
     - `Senior_DevOps_Engineer_Transition_Notes.txt`
   - Instant one-click demo access with pre-calculated knowledge gap radar.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Lucide React Icons |
| **Backend** | Python 3.13, FastAPI, Uvicorn, SQLAlchemy, Pydantic v2 |
| **AI / LLM** | Google Gemini API (`gemini-1.5-flash` supported) / Built-in Heuristic Transition Engine |
| **Document Processing** | PyMuPDF (`fitz`), `python-docx`, `pypdf` |
| **PDF Generation** | ReportLab |
| **Database** | SQLite (Thread-safe, zero configuration) |
| **Authentication** | JWT (JSON Web Tokens), Bcrypt password hashing |

---

## 📁 Project Structure

```
ContinuityOS AI/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI routes, CORS, middleware, startup
│   │   ├── config.py              # Environment settings (PORT, GEMINI_API_KEY, etc.)
│   │   ├── database.py            # SQLite engine, session maker, Base
│   │   ├── models.py              # SQLAlchemy DB models (User, Document, Analysis, etc.)
│   │   ├── schemas.py             # Pydantic validation schemas
│   │   ├── auth.py                # JWT auth, bcrypt hashing, dependencies
│   │   ├── document_parser.py     # PyMuPDF, python-docx, and TXT extractors
│   │   ├── ai_service.py          # Gemini AI integration + grounded fallback analyzer
│   │   ├── report_generator.py    # ReportLab executive PDF generator
│   │   └── sample_data.py         # Demo users, sample .docx/.pdf/.txt generator
│   ├── requirements.txt           # Python backend dependencies
│   ├── .env.example               # Template environment configuration
│   └── .env                       # Local secrets (Ignored by Git)
├── frontend/
│   ├── index.html                 # Entry HTML
│   ├── package.json               # Frontend dependencies & scripts
│   ├── vite.config.js             # Vite 8 config with Tailwind v4 & proxy
│   └── src/
│       ├── index.css              # Dark theme styling & animations
│       ├── main.jsx               # React entry point
│       ├── App.jsx                # Main coordinator component
│       ├── context/
│       │   └── AuthContext.jsx    # Authentication & demo session state
│       ├── services/
│       │   └── api.js             # REST API client
│       └── components/
│           ├── Sidebar.jsx        # Responsive navigation sidebar
│           ├── Header.jsx         # Status bar with Gemini status indicator
│           ├── LandingPage.jsx    # Public product landing page
│           ├── AuthModal.jsx      # Login & Registration modal
│           ├── DashboardOverview.jsx # Handover health score & KPI cards
│           ├── DocumentHub.jsx    # Ingestion, drag-drop, text inspector
│           ├── HandoverAnalysis.jsx  # 6-pillar structured summary cards
│           ├── KnowledgeGapDetector.jsx # SPOF & missing info radar
│           ├── AiKnowledgeAssistant.jsx # Grounded Q&A assistant
│           ├── HandoverReports.jsx # PDF generator & report manager
│           ├── AuditHistory.jsx   # Immutable activity log
│           ├── SettingsModal.jsx  # Gemini API Key dynamic configurator
│           └── Toast.jsx          # Feedback toasts & loading spinners
├── .gitignore                     # Git ignore rules for secrets, DB, and builds
└── README.md
```

---

## ⚙️ Environment Variables Setup

The backend configuration is managed through environment variables. A template is provided in `backend/.env.example`.

### Setting Up Local Environment

In your terminal:

```bash
# Navigate to the backend directory
cd backend

# Copy the example environment file
cp .env.example .env
# On Windows PowerShell:
# Copy-Item .env.example .env
```

### Configuration Variables (`backend/.env`)

```ini
PORT=8000
HOST=0.0.0.0

# Google Gemini AI Configuration (Optional - fallback engine used if omitted)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Authentication & Security
SECRET_KEY=your_secret_key_here
JWT_SECRET=your_jwt_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database Configuration (SQLite)
DATABASE_URL=sqlite:///./continuityos.db

# Storage Directories
UPLOAD_DIR=./uploads
REPORTS_DIR=./generated_reports
MAX_FILE_SIZE_MB=25

# CORS Allowed Origins
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000
```

> **Security Note**: `backend/.env` is ignored by `.gitignore` and must never be committed to Git. If `GEMINI_API_KEY` is not provided, ContinuityOS AI runs on its built-in deterministic heuristic fallback analyzer.

---

## 🚀 Installation & Running Instructions

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** & **npm 9+** (Tested on Node 26.13)

---

### 2. Backend Setup & Run

Open a terminal in the project root:

```bash
# 1. Navigate to the backend directory
cd backend

# 2. (Optional) Create and activate a Python virtual environment:
# python -m venv .venv
# .venv\Scripts\activate      # Windows
# source .venv/bin/activate   # Linux / macOS

# 3. Install required Python packages
pip install -r requirements.txt

# 4. Initialize environment configuration
cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env

# 5. Start the FastAPI development server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend endpoints:
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup & Run

Open a second terminal in the project root:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install Node.js dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

Frontend application:
- **Web App**: `http://localhost:5173`

---

## 👤 Demo Login Credentials

On first launch, the database automatically pre-seeds realistic enterprise transition data and a demo user:

- **Email**: `demo@continuityos.ai`
- **Password**: `Password123!`
- Or simply click **"One-Click Demo Access"** on the landing page or login modal to enter immediately.

---

## 🔐 Google Gemini AI Integration & Fallback Behavior

- **Out-of-the-Box Mode**: By default (without an API key set), ContinuityOS AI operates on its local deterministic heuristic transition analyzer. The UI indicates `Heuristic Engine Active` in the header and analysis badges.
- **Activating Google Gemini**: To enable live Gemini generation, configure your key:
  1. **Via `.env` file**: Add your key to `backend/.env` (`GEMINI_API_KEY=AIzaSy...`).
  2. **In-App Dynamic Configuration**: In the dashboard header, click the **"Gemini AI / Heuristic"** status pill, paste your API key, and click **Connect Key**. It activates immediately without needing a server restart.
- **Strict Grounding**: Under both Gemini AI and heuristic mode, information not found in the documents is strictly marked as `"Not Found in Documents"`.
