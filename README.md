# SehatFlow AI — Smart Health & Medicine Supply Chain Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Pytest](https://img.shields.io/badge/Tests-14%20Passed-4CAF50?style=flat&logo=pytest)](https://pytest.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **DEMO ENVIRONMENT — SYNTHETIC DATA DISCLAIMER**
> SehatFlow AI is a functional engineering prototype designed for the Smart Health AI Hackathon. All facility names, patient tokens, doctor attendance records, and inventory figures are synthetically generated for demonstration. No real personal health information (PHI) is processed or retained.

---

## 1. Executive Summary & Problem Statement

### The Problem
Primary Health Centres (PHCs) and Community Health Centres (CHCs) frequently experience:
- **Unpredicted medicine stock-outs**: Clinicians and patients only discover a shortage when dispensing shelves are completely empty.
- **Siloed resource visibility**: Nearby facilities often have surplus quantities of medicines that expire on shelves while a neighboring center suffers a shortage.
- **Queue and wait-time bottlenecks**: Unmonitored patient arrivals cause severe waiting room surges.
- **Bed availability uncertainty**: Inpatient wards lack real-time occupancy and sanitation status.
- **Clinician absenteeism blindspots**: Uncoordinated shift attendance delays emergency response.

### Our Solution
**SehatFlow AI** is a proactive healthcare resource intelligence and medicine supply chain management platform. It shifts healthcare administrators from **reactive firefighting** to **proactive decision support**:
1. **Explainable Demand Forecasting**: Uses weighted moving average heuristics and replenishment lead times to calculate exact days-until-stockout and recommend reorder quantities before stockouts occur.
2. **Atomic Inter-Facility Redistribution**: Enables district coordinators to transfer surplus medicines between facilities in three clicks with atomic double-entry ledger verification.
3. **Operational Command Cockpit**: Real-time telemetry across anonymized patient queues, interactive ward bed maps, and clinician duty rosters.

---

## 2. Key Platform Features

| Module | Core Functionality | Proactive Benefit |
|---|---|---|
| **1. Overview Dashboard** | District-wide & facility-level KPIs, 7-day consumption chart, hourly patient curves, priority alerts. | Single-pane operational visibility for facility superintendents. |
| **2. Medicine Inventory** | Searchable formulary, receipt check-in, adjustment with audit reasons, immutable stock ledger. | Prevents silent inventory leakage and tracks batch expiration. |
| **3. AI Demand Forecasting** | 7-day & 30-day demand estimates, stockout horizon in days, suggested reorder math, parameter sliders. | 100% explainable, transparent decision support for pharmacists. |
| **4. Patient Queue Flow** | Anonymous token tracking (`T-1021`), department queues, priority categories, wait-time estimation. | Identifies peak arrival surges without compromising privacy. |
| **5. Bed Management** | Interactive ward map, occupancy rates, one-tap status cycling (`Available` → `Occupied` → `Cleaning`). | Accelerates bed sanitization turnaround and prevents admission gridlock. |
| **6. Doctor Attendance** | Specialty rosters, shift tracking, on-duty toggles, staffing coverage deficit alerts. | Ensures required clinical specialties are present on duty. |
| **7. Multi-Facility Supply** | Cross-facility transfers with atomic source deduction and destination crediting. | Eliminates medicine wastage by redistributing near-expiry surpluses. |
| **8. Reports & Analytics** | Tabular summaries for all operational modules, date/facility filters, CSV export, print styling. | One-click reporting for district healthcare review meetings. |
| **9. Settings & System** | API latency diagnostics, network facility directory, and one-click demo data reset. | Easy evaluation and testing for judges and reviewers. |

---

## 3. Technology Stack

- **Frontend**:
  - React 18 & TypeScript
  - Vite 5 build tool
  - Tailwind CSS 3 for responsive healthcare SaaS styling
  - Lucide React for consistent icons
  - Recharts for interactive operational data visualization
- **Backend**:
  - Python 3.11+ / FastAPI
  - Pydantic v2 validation models
  - SQLAlchemy 2.0 ORM
  - SQLite (WAL Mode enabled for local dev / demo) with seamless PostgreSQL support
- **Testing**:
  - Pytest 9 for comprehensive backend API and business logic verification (14 tests passed)
- **Deployment**:
  - Render blueprint (`render.yaml`) for unified web service
  - Vercel (`vercel.json`) and Netlify (`netlify.toml`) configurations for static hosting with API rewrites

---

## 4. System Architecture

```
sehatflow-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app, static mount, CORS, 24 REST routes
│   │   ├── database.py        # SQLAlchemy engine and session dependency
│   │   ├── models.py          # Database models (Facility, Medicine, Bed, Doctor, etc.)
│   │   ├── schemas.py         # Pydantic validation schemas
│   │   ├── crud.py            # Database queries and business logic
│   │   ├── forecasting.py     # AI demand forecasting engine
│   │   └── seed_data.py       # Multi-facility synthetic demonstration dataset
│   ├── tests/
│   │   └── test_api.py        # 14 Pytest integration and unit tests
│   └── requirements.txt       # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # Sidebar, Header, StatCard, StatusBadge, Modal
│   │   ├── pages/             # 9 Complete functional application pages
│   │   ├── services/          # Typed API client with fallback simulation
│   │   ├── types/             # TypeScript interfaces
│   │   ├── App.tsx            # Root application with routing and toast system
│   │   ├── main.tsx           # Entry point
│   │   └── index.css          # Tailwind CSS and print media queries
│   ├── public/                # Favicon and branding assets
│   ├── package.json
│   ├── vite.config.ts         # Vite build configuration with /api proxy
│   └── tailwind.config.js
├── docs/
│   ├── architecture.md        # Technical architecture and Mermaid sequence diagrams
│   ├── api.md                 # Full REST API endpoint reference
│   └── presentation.md        # 90-second pitch, 3-minute demo flow, and math formula
├── render.yaml                # Render deployment blueprint
├── vercel.json                # Vercel deployment configuration
├── netlify.toml               # Netlify deployment configuration
├── .env.example
├── .gitignore
├── LICENSE                    # MIT Open Source License
└── README.md
```

---

## 5. Local Setup & Running Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Step 1: Clone or Open the Repository
```bash
git clone https://github.com/your-username/sehatflow-ai.git
cd sehatflow-ai
```

### Step 2: Set Up Backend
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run the backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend initializes the SQLite database and seeds it automatically.
- Swagger API Docs: `http://localhost:8000/api/docs`
- Health Endpoint: `http://localhost:8000/api/health`

### Step 3: Set Up Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. All requests to `/api` proxy automatically to the FastAPI backend.

### Full-Stack Single Server Mode (Alternative)
The FastAPI backend is pre-configured to serve the compiled frontend:
```bash
# In frontend:
cd frontend
npm run build

# In root:
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
Open `http://localhost:8000` to access both the frontend application and the API on a single port.

---

## 6. Running Automated Tests

Run the complete backend test suite using Pytest:
```bash
pytest backend/tests/test_api.py -v
```

### Verified Test Suite Results:
- `test_health_check`: PASSED
- `test_list_facilities`: PASSED
- `test_add_medicine_valid`: PASSED (Initial stock receipt ledger entry created)
- `test_add_medicine_reject_negative_stock`: PASSED (422 Unprocessable Entity)
- `test_receive_stock`: PASSED (Stock incremented and movement recorded)
- `test_adjust_stock_with_reason`: PASSED (Reconciliation audit reason logged)
- `test_low_stock_detection`: PASSED (Status transition to Low Stock/Critical)
- `test_forecasting_calculation`: PASSED (WMA 7-day demand and stockout days computed)
- `test_forecasting_zero_consumption_safety`: PASSED (Handles zero run-rate safely)
- `test_forecasting_recalculate_action`: PASSED (Recalculation endpoint triggers threshold alerts)
- `test_patient_queue_flow`: PASSED (Token registration, In Consultation, Completed)
- `test_bed_status_transitions`: PASSED (Valid transitions allowed, invalid rejected)
- `test_doctor_attendance_toggle`: PASSED (Attendance timestamped and dashboard updated)
- `test_stock_transfer_workflow`: PASSED (Atomic source deduction, destination crediting, idempotency verified)

**Result: 14 passed in 3.23s (100% pass rate).**

---

## 7. Hackathon Judge Walkthrough Guide (3 Minutes)

1. **Dashboard & Facility Filter (0:00 - 0:30)**:
   - Notice the high-level KPI cards and consumption trend chart.
   - Switch the top dropdown from "District Network" to **"PHC Ramgarh"**.
   - Observe how the cards and priority action center update specifically for that health center.
2. **Medicine Inventory (0:30 - 1:00)**:
   - Navigate to **Medicine Inventory**. Filter by **"Critical"** to spot *Amoxicillin 500mg* (24 units left).
   - Click **Adjust** to record a physical audit correction, or **History** to view the immutable double-entry ledger.
3. **AI Demand Forecasting (1:00 - 1:35)**:
   - Navigate to **AI Demand Forecast**.
   - Note the transparent explanation: *Amoxicillin has ~1.7 days remaining, but supplier replenishment lead time is 5 days*.
   - Click **Recalculate Forecast** to rerun the time-series model. Adjust the **Safety Buffer slider** to watch suggested quantities update.
4. **Supply Chain Redistribution (1:35 - 2:15)**:
   - Navigate to **Multi-Facility Supply**.
   - Inspect pending transfer `TRF-1001` requesting 50 capsules of Amoxicillin from CHC Balrampur to PHC Ramgarh.
   - Click **Authorize Transfer ✓**.
   - Check the medicine inventory: CHC Balrampur's stock is immediately debited, PHC Ramgarh is credited, and the stockout risk is neutralized.
5. **Bed Capacity & Doctor Roster (2:15 - 2:40)**:
   - Navigate to **Bed Management**. Click any bed to cycle its status: `Available` → `Occupied` → `Cleaning`.
   - Navigate to **Doctor Attendance** and click the attendance pill to toggle a doctor on/off duty.
6. **Reports & CSV Export (2:40 - 3:00)**:
   - Navigate to **Reports & Analytics**.
   - Click **Export Active CSV** to download verifiable operational data.
   - Click **Print Report** to view the clean print dossier.

---

## 8. Deployment Guide

### Deploying on Render (Unified Full-Stack)
1. Fork or push this repository to GitHub.
2. Create a new **Blueprint** on [Render.com](https://render.com).
3. Connect your repository. Render automatically reads `render.yaml` and deploys:
   - The FastAPI backend service with automatic database migrations.
   - The React static site with API environment variable injection.

### Deploying Frontend on Vercel or Netlify
- **Vercel**: Import repository root, set framework preset to `Vite`. Vercel automatically uses `vercel.json` for routing.
- **Netlify**: Set base directory to `frontend`, build command to `npm run build`, and publish directory to `dist`. Netlify uses `netlify.toml` for single-page rewrites.

---

## 9. Ethical Principles & Privacy Safeguards

- **No Medical Advice**: Forecasts and suggested quantities are strictly operational inventory estimates, not clinical prescription advice.
- **Privacy by Design**: Patient flow records use anonymous demonstration tokens (e.g. `T-1021`). No patient names, phone numbers, addresses, or diagnoses are stored.
- **Human in the Loop**: Inter-facility transfers require explicit authorization by a district officer; the system never moves stock without confirmation.

---

## 10. License

This project is open-source and released under the [MIT License](LICENSE).
