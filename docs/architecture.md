# SehatFlow AI — Technical Architecture & System Design

SehatFlow AI is designed as a modular, responsive healthcare resource intelligence and medicine supply chain management platform. It addresses the critical operational friction experienced by primary, community, and district healthcare facilities.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Presentation Layer (React 18 + Vite + Tailwind CSS)"]
        UI_Dash["Overview Dashboard"]
        UI_Inv["Medicine Inventory & Ledger"]
        UI_Fore["Explainable Demand Forecast"]
        UI_Queue["Anonymous Patient Queue"]
        UI_Bed["Interactive Bed Map"]
        UI_Roster["Clinician Duty Roster"]
        UI_Trans["Inter-Facility Transfers"]
        UI_Rep["Reports & CSV Exports"]
    end

    subgraph API ["REST API Layer (Python FastAPI)"]
        CORS["CORS & Request Security"]
        Router["FastAPI Application Routers"]
        Schemas["Pydantic Validation Schemas"]
        StaticServe["SPA Static Assets Handler"]
    end

    subgraph Engine ["Proactive Intelligence & Business Rules"]
        Forecaster["AI Forecasting Engine (WMA + Safety Buffer)"]
        AlertGen["Deterministic Alert Generator"]
        Ledger["Double-Entry Stock Ledger Engine"]
    end

    subgraph Data ["Data Persistence Layer (SQLAlchemy ORM)"]
        SQLite["SQLite (Local/Dev WAL Mode)"]
        Postgres["PostgreSQL (Production Cloud Ready)"]
    end

    Client -->|HTTPS REST API / JSON| CORS
    CORS --> Router
    Router --> Schemas
    Router --> Forecaster
    Router --> AlertGen
    Router --> Ledger
    Forecaster --> Data
    AlertGen --> Data
    Ledger --> Data
    Data --> SQLite
    Data -.-> Postgres
    StaticServe --> UI_Dash
```

---

## 2. Inter-Facility Stock Redistribution Sequence

The inter-facility stock transfer workflow ensures atomic consistency across health centers so medicines cannot be duplicated or lost in transit.

```mermaid
sequenceDiagram
    autonumber
    actor Officer as District Supply Coordinator
    participant Web as SehatFlow UI
    participant API as FastAPI Router
    participant CRUD as Transfer Service
    participant DB as Database Transaction
    participant Alerts as Alert Engine

    Officer->>Web: Select Source (e.g. CHC Balrampur) & Destination (PHC Ramgarh)
    Officer->>Web: Enter Quantity (e.g. 50 Capsules Amoxicillin) & Reason
    Web->>API: POST /api/transfers
    API->>CRUD: Validate Source Stock >= 50 & Source != Destination
    CRUD->>DB: INSERT INTO stock_transfers (Status: 'Pending')
    CRUD->>Alerts: Trigger 'Inbound Transfer Pending' for Destination
    DB-->>Web: 201 Created (Transfer TRF-1001)

    Officer->>Web: Click 'Authorize Transfer'
    Web->>API: POST /api/transfers/TRF-1001/approve
    API->>CRUD: Execute Atomic Transfer Transaction
    activate DB
    CRUD->>DB: Lock Source Medicine Row (SELECT FOR UPDATE)
    CRUD->>DB: Deduct 50 from Source Stock
    CRUD->>DB: INSERT INTO stock_movements (TRANSFER_OUT, -50)
    CRUD->>DB: Add 50 to Destination Stock
    CRUD->>DB: INSERT INTO stock_movements (TRANSFER_IN, +50)
    CRUD->>DB: UPDATE stock_transfers SET Status = 'Approved'
    CRUD->>DB: INSERT INTO activity_logs ('Transfer Approved')
    CRUD->>Alerts: Resolve Pending Alert & Re-evaluate Stock Thresholds
    DB-->>CRUD: Commit Transaction
    deactivate DB
    API-->>Web: 200 OK (Updated Transfer & Balances)
    Web-->>Officer: Display Instant Stock Update on Both Facilities
```

---

## 3. Entity Relationship Diagram

```mermaid
erDiagram
    FACILITY ||--o{ MEDICINE : stocks
    FACILITY ||--o{ BED : operates
    FACILITY ||--o{ DOCTOR : employs
    FACILITY ||--o{ PATIENT_QUEUE : treats
    FACILITY ||--o{ ALERT : triggers
    
    MEDICINE ||--o{ STOCK_MOVEMENT : records
    MEDICINE ||--o{ CONSUMPTION_HISTORY : tracks
    MEDICINE ||--o{ STOCK_TRANSFER : dispatches

    FACILITY {
        string id PK
        string name
        string facility_type
        string district
        int total_beds
    }

    MEDICINE {
        string id PK
        string facility_id FK
        string name
        string generic_name
        string category
        int current_stock
        int min_threshold
        float avg_daily_consumption
        int lead_time_days
        date expiry_date
    }

    STOCK_MOVEMENT {
        int id PK
        string medicine_id FK
        string movement_type
        int quantity
        int previous_stock
        int new_stock
        string reason
        datetime timestamp
    }

    PATIENT_QUEUE {
        string id PK
        string token
        string department
        string queue_status
        string priority
        int estimated_wait_minutes
        datetime arrival_time
    }

    BED {
        string id PK
        string facility_id FK
        string bed_number
        string ward
        string status
        datetime last_updated
    }

    DOCTOR {
        string id PK
        string facility_id FK
        string name
        string department
        string shift
        boolean is_present
    }
```
