# Swastik Health — Hackathon Presentation & Demonstration Dossier

---

## 1. Project Overview & Pitch

**Problem Statement:** Smart Health — AI-Driven Health Center and Supply Chain Management.

**Value Proposition:** Primary and Community Health Centres (PHCs and CHCs) frequently suffer from avoidable medicine stock-outs, uncoordinated patient queues, unknown bed capacities, and doctor attendance blindspots. Existing systems are reactive—staff only notice a stockout when a patient is standing in front of an empty pharmacy shelf.

**Our Solution:** **Swastik Health** shifts health operations from **reactive crisis firefighting** to **proactive decision support**. It continuously monitors multi-facility inventory, predicts consumption rates weeks ahead, detects impending shortages before lead times expire, and automates atomic inter-facility stock redistribution.

---

## 2. The 90-Second Judging Pitch Script

> *"Good morning, judges. Imagine a mother bringing her sick child to a rural Primary Health Centre, only to be told that essential antibiotics ran out yesterday, and the next shipment won't arrive for a week.*
>
> *This happens every single day in public healthcare not because medicines don't exist in the district, but because of poor visibility, zero demand forecasting, and siloed facilities.*
>
> *Meet **Swastik Health**—an AI-powered healthcare management platform.*
>
> *Instead of waiting for shelves to empty, Swastik Health continuously monitors dispensing velocity, applies an explainable weighted moving-average demand model, and flags critical stockouts days before replenishment lead times run out.*
>
> *When PHC Ramgarh faces a shortage of Amoxicillin, Swastik Health detects that nearby CHC Balrampur has surplus stock. In just three clicks, a transfer request is created, verified, and approved with atomic double-entry ledger security.*
>
> *Beyond supply chain, Swastik Health gives facility administrators a real-time operational cockpit: anonymized patient queues, live ward bed status with one-tap turnaround, clinician attendance tracking, and downloadable audit reports.*
>
> *Everything you see today is a fully working, tested full-stack web application—built with FastAPI, SQLAlchemy, React, Vite, and Tailwind CSS—with 14 automated backend tests passing.*
>
> *Swastik Health: saving lives by delivering the right medicine to the right health center before the shelf goes empty. Thank you."*

---

## 3. The 3-Minute Live Demonstration Walkthrough

| Step | Time | What to Show | Key Talking Point |
|---|---|---|---|
| **1. Overview Dashboard** | 0:00 - 0:30 | Open Overview page. Point to the KPI cards: Medicines Tracked, Bed Capacity, Doctors On Duty, Patients Waiting. Switch from "District View" to "PHC Ramgarh". | *"Notice how the operational pulse immediately reflects PHC Ramgarh's specific telemetry. We see a critical stockout alert right on the dashboard."* |
| **2. Inventory & Low Stock** | 0:30 - 1:00 | Navigate to **Medicine Inventory**. Filter by "Critical" or search "Amoxicillin". Show current stock (24 units) vs threshold (80 units). Click "+ Restock" or "Adjust" to demonstrate real-time ledger updates. | *"Every stock adjustment requires a mandatory audit reason. The immutable movement ledger records the exact timestamp and user."* |
| **3. AI Demand Forecasting** | 1:00 - 1:35 | Navigate to **AI Demand Forecast**. Show 7-day and 30-day projected demand. Highlight the Amoxicillin card: `Days Remaining: ~1.7 days < Lead Time: 5 days`. Click **Recalculate Forecast**. Slide the **Safety Buffer** to 5 days. | *"Our forecasting model is 100% explainable. It calculates daily run-rate from multi-week dispensing history and shows the clinical officer the exact rationale: 24 capsules will run out in 1.7 days, but delivery takes 5 days."* |
| **4. Inter-Facility Transfer** | 1:35 - 2:15 | Navigate to **Multi-Facility Supply**. Show pending transfer `TRF-1001` for Amoxicillin from CHC Balrampur to PHC Ramgarh. Click **Authorize Transfer**. Show both facilities' balances updated atomically. | *"Watch this: with atomic database transactions, CHC Balrampur is debited 50 units and PHC Ramgarh is credited 50 units instantly. The stockout risk is neutralized without waiting for central factory procurement."* |
| **5. Ward Beds & Doctors** | 2:15 - 2:40 | Navigate to **Bed Management**. Click bed `B-01` to cycle `Available` → `Occupied` → `Cleaning`. Navigate to **Doctor Attendance** and toggle `Dr. Meera Joshi` on duty. | *"Ward cleaning turnaround and doctor availability update the live dashboard in real time with zero delay."* |
| **6. Reports & Export** | 2:40 - 3:00 | Navigate to **Reports & Analytics**. Switch between Inventory, Bed Occupancy, and Transfer reports. Click **Export CSV** (show file downloading) and **Print Report**. | *"District health officers can generate downloadable CSV audit trails and print-ready dossiers with one click."* |

---

## 4. Forecasting Algorithm Mechanics & Explainability

Traditional black-box machine learning models fail in public health deployments because doctors and supply officers do not trust unexplainable predictions. Swastik Health uses a **transparent, calibrated heuristic engine**:

$$R_{\text{daily}} = 0.50 \cdot \bar{D}_{\text{week 1}} + 0.30 \cdot \bar{D}_{\text{week 2}} + 0.20 \cdot \bar{D}_{\text{week 3}}$$

$$\text{Horizon (days)} = \frac{\text{Current Stock}}{\max(0.01, R_{\text{daily}})}$$

$$\text{Suggested Reorder} = \max\left(0, \lceil R_{\text{daily}} \cdot (L + H) \rceil + S_{\text{buffer}} - (I_{\text{current}} + T_{\text{inbound}})\right)$$

Where:
- $R_{\text{daily}}$ = Weighted daily consumption velocity
- $L$ = Replenishment lead time in days (e.g. 4–7 days)
- $H$ = Planning horizon (7 or 30 days)
- $S_{\text{buffer}} = \lceil R_{\text{daily}} \cdot \text{Safety Buffer Days} \rceil$
- $I_{\text{current}}$ = Current verified stock on hand
- $T_{\text{inbound}}$ = Pending inbound inter-facility transfers

### Risk Level Decision Boundary:
- **CRITICAL**: Days remaining $\le L$ (Stock will deplete before a new order can arrive).
- **HIGH**: Days remaining $\le 1.5 \times L$.
- **MEDIUM**: Current stock $\le$ Minimum threshold.
- **LOW**: Stock coverage $> 1.5 \times L$ and above reorder threshold.

---

## 5. Verified Measurable Technical Achievements

- **Full-Stack Implementation**: 24 REST API endpoints implemented in FastAPI, validated with Pydantic schemas, and backed by SQLAlchemy ORM.
- **Frontend SPA**: React 18 with TypeScript, Vite, Tailwind CSS, Lucide icons, and Recharts data visualizations.
- **Automated Test Coverage**: **14 automated backend unit and integration tests written and passed in Pytest**, verifying stock receipt, negative quantity rejection, days-until-stockout math, queue transitions, bed states, and atomic transfer idempotency.
- **Production Asset Compilation**: Frontend bundle built cleanly into minified static assets (`dist/`), directly servable by FastAPI or static CDNs.
- **Resilience Design**: Client API service handles network failures smoothly with optimistic UI updates and instant feedback.
- **Privacy by Design**: Anonymized patient tokens (`T-1021`) ensure zero personal health identifier (PHI) leakage.

---

## 6. Limitations & Future Roadmap

### Current Prototype Scope:
- Synthetic demonstration data calibrated to typical Indian Primary and Community Health Centre formularies.
- Fictional district health facilities for illustrative cross-facility transfers.
- Single-process SQLite local database with seamless migration path to PostgreSQL for multi-region clustering.

### Future Production Roadmap:
1. **ABHA / Ayushman Bharat Digital Mission (ABDM) Integration**: Connect with official patient identity tokens and M3 EHR specifications.
2. **e-Aushadhi Procurement Integration**: Direct bidirectional API sync with State Drug Warehouses and Central Medical Stores Services (CMSS).
3. **Seasonal Epidemiology Surge Modeling**: Incorporate monsoon malaria/dengue spikes and winter respiratory trends into the forecasting weight matrix.
4. **Offline PWA & Low-Bandwidth Synchronization**: Allow rural health workers in remote sub-centers to record dispensing offline and sync when 4G connectivity returns.
