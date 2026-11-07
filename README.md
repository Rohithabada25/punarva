# Punarva (పునర్వ / पुनर्व)
> **"Give every material a second life."**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](#)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB.svg)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](#)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-orange.svg)](#)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](#)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC.svg)](#)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-RAG-purple.svg)](#)

---

## 🌿 Brand & Meaning
The name **Punarva** originates from the Sanskrit prefix **"punar" (पुनर् / పునర్)**, meaning *again*, *anew*, or *renewal*. 

In construction, industrial development, and everyday renovation, vast quantities of high-grade surplus materials—cured bricks, cut timber, unbroken vitrified tiles, structural steel, electrical wiring, PVC conduits, and functioning electronics—are treated as debris and dumped into landfills. **Punarva** turns this linear waste pipeline into a continuous circular loop: identifying unused materials with vision AI, retrieving certified reuse guides via RAG, matching local builders, colleges, and NGOs, ranking fair offers, arranging transparent offline pickups, and calculating audited carbon metrics.

> **Reuse Certificate Spec:**  
> Upon dual confirmation, both seller and buyer receive an authentic:  
> **"Certificate of Reuse, issued by Punarva"** (printable and verifiable).

---

## 🧠 Multi-Agent Architecture & LangGraph Pipeline

Punarva is powered by a team of specialized AI agents coordinated by **LangGraph**:

```mermaid
flowchart TD
    Photo["Seller Uploads Photo (JPEG/PNG)"] --> Vision["1. Vision Agent (Gemini Vision)\n• Identifies material & condition\n• Probable quantity estimate\n• Flags safety & hazard notes"]
    Vision --> Reuse["2. Reuse Agent (ChromaDB RAG)\n• Embeds query with gemini-embedding-001\n• Retrieves top-k reuse guides & standards\n• Cites formal circular economy sources"]
    Reuse --> Pricing["3. Pricing Agent\n• Valuation tables & condition multipliers\n• Suggests fair market price & range\n• Generates multilingual explanation"]
    
    Pricing --> Publish["Seller Verifies / Adjusts & Publishes"]
    
    Publish --> Matching{"4. Matching Agent\n(Semantic Match + Distance + Budget)"}
    Matching -- "Matches Found" --> Buyers["Ranked Local Buyers & Colleges\n(Haversine Distance + Quantity Fit)"]
    Matching -- "No Matches" --> Fallback["5. Fallback Agent\n• Certified AP Recyclers & Scrap Depots\n• Creative DIY Reuse Ideas"]
    
    Buyers --> Offers["Buyers Submit Offers"]
    Offers --> Negotiation["6. Negotiation Agent\n• Ranks offers by price & proximity\n• Designates 'Best Offer' badge"]
    
    Negotiation --> Accept["Seller Accepts Offer\n(Other offers auto-declined)"]
    Accept --> Pickup["Offline Handover Arranged\n(Exact address revealed to buyer)"]
    
    Pickup --> DualConfirm{"Dual Confirmation\n(Buyer & Seller confirm separately)"}
    DualConfirm -- "Problem Reported or 48h Timeout" --> Dispute["Admin Mediation Review\n(Audit events & dispute resolution)"]
    DualConfirm -- "Both Confirmed" --> Impact["7. Impact Agent (Deterministic)\n• Calculates kg diverted & CO2 saved\n• Tags verified vs estimated metrics\n• Issues Certificate of Reuse"]
```

### Specialized Agents:
1. **Vision Agent (`backend/agents/vision_agent.py`)**: Surveys photos via Gemini Vision (`gemini-3.5-flash-lite`). Automatically downscales large images to ~1024px, applies SHA-256 caching to respect API quotas, and marks all quantities as **PROBABLE ESTIMATES**.
2. **Reuse Agent (`backend/agents/reuse_agent.py`)**: Performs semantic similarity retrieval against a ChromaDB persistent vector database (20 reuse guides, 8 Bureau of Indian Standards, 8 regional recycling depots) and returns structured recommendations with citation sources.
3. **Pricing Agent (`backend/agents/pricing_agent.py`)**: Combines a regional material baseline table with condition multipliers (`new: 0.90`, `good: 0.65`, `fair: 0.45`, `poor: 0.20`) and produces price ranges with multilingual justifications.
4. **Matching Agent (`backend/agents/matching_agent.py`)**: Uses 3072-dimensional Gemini embeddings to match listings against buyer wanted requests, applying hard filters for budget and Haversine distance, and formatting natural-language match reasons.
5. **Negotiation Agent (`backend/agents/negotiation_agent.py`)**: Evaluates incoming offers using a multi-factor score (70% price ratio, 30% pickup proximity) and tags the top offer with a **Best Offer** badge.
6. **Fallback Agent (`backend/agents/fallback_agent.py`)**: Activates when zero buyer requests match, recommending nearby certified recycling facilities across Andhra Pradesh (Bapatla, Guntur, Vijayawada) and DIY repurposing guides.
7. **Impact Agent (`backend/agents/impact_agent.py`)**: 100% deterministic Python calculation using material-specific lifecycle CO2 factors (e.g. Red clay bricks: 0.35 kg CO2/kg; Steel: 1.82 kg CO2/kg; Teak: 0.45 kg CO2/kg). Strictly awards impact only upon dual confirmation, separating verified metrics from unverified AI estimates.

---

## 🌐 Multilingual Support (Telugu, Hindi, English)

All user-facing workflows and AI agent explanations support three languages:
- **English (`en`)**
- **Telugu (`te`)** — *తెలుగు*
- **Hindi (`hi`)** — *हिन्दी*

### Implementation:
- **Frontend:** Handled by `react-i18next` with complete translation files in `frontend/src/locales/en.json`, `te.json`, and `hi.json`. Persistent language switcher in both Navbar and Login screens.
- **Backend:** `users.preferred_language` stored in MySQL. Agent pipelines accept a `language` parameter and prompt Gemini to generate human-readable explanations in that language while preserving English enum keys.
- **In-App Notifications:** Stored as structured translation keys + dynamic parameters (`params`) so notifications display in the reader's preferred language.

> *Note on Translations:* Initial translations were generated with AI assistance. In accordance with platform standards, translations should be reviewed by a native speaker before production release.

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Recharts, Lucide Icons, Canvas Confetti, react-i18next |
| **Backend** | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, PyMySQL, Cryptography, Python-Dotenv |
| **AI & Vector DB**| Google GenAI SDK (`gemini-3.5-flash-lite`, `gemini-embedding-001`), LangGraph, ChromaDB, Pillow, Truststore |
| **Database** | MySQL (Port 3306, database `punarva`) |

---

## 🛠️ Windows Setup Instructions

### 1. Prerequisites
- **OS:** Windows 10 or 11
- **Python:** Python 3.12 (with virtual environment support)
- **Node.js:** Node.js v20+ or v24+ and npm 10+
- **MySQL:** MySQL Server running on `localhost:3306` with database `punarva` created:
  ```sql
  CREATE DATABASE IF NOT EXISTS punarva;
  ```

---

### 2. Backend Setup
1. Open PowerShell and navigate to the `backend` directory:
   ```powershell
   cd c:\Users\ROHITHA\OneDrive\Desktop\punarva\backend
   ```
2. Activate the pre-configured virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```
3. Configure `.env` (copy from `.env.example`):
   ```powershell
   cp .env.example .env
   ```
   *Ensure `.env` contains your Gemini API key and MySQL connection string:*
   ```env
   GEMINI_API_KEY=AQ.your_valid_gemini_key
   GEMINI_MODEL=gemini-3.5-flash-lite
   GEMINI_EMBED_MODEL=gemini-embedding-001
   DATABASE_URL=mysql+pymysql://root:password@localhost:3306/punarva
   PORT=8000
   HOST=0.0.0.0
   UPLOAD_DIR=uploads
   CHROMA_DIR=chroma_db
   TIMEOUT_HOURS=48
   ```

4. Populate ChromaDB Vector Store:
   ```powershell
   python rag\ingest.py
   ```

5. Seed Database with Demo Personas and Materials:
   ```powershell
   python seed.py
   ```

---

### 3. Frontend Setup
1. Open a new PowerShell window and navigate to the `frontend` directory:
   ```powershell
   cd c:\Users\ROHITHA\OneDrive\Desktop\punarva\frontend
   ```
2. Dependencies are already installed in `node_modules`. If reinstalling:
   ```powershell
   npm install
   ```

---

## 🚀 Running the Application

### Start Backend API Server:
In `backend/` with venv activated:
```powershell
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*API will run at:* `http://localhost:8000` (Docs: `http://localhost:8000/docs`)

### Start Frontend Dev Server:
In `frontend/`:
```powershell
npm run dev
```
*Vite frontend will launch at:* `http://localhost:5173` (proxies `/api` and `/uploads` to backend)

---

## 🧪 Running Automated Tests

Run the full end-to-end integration test suite:
```powershell
cd c:\Users\ROHITHA\OneDrive\Desktop\punarva
backend\venv\Scripts\python.exe backend\test_e2e_full.py
```
*All 12 workflow stages pass with 100% green assertions!*

---

## 🎬 3-Minute Hackathon Demo Script

Follow this step-by-step walkthrough to demonstrate every capability of Punarva:

### Step 1: Login & Branding (30 seconds)
1. Open `http://localhost:5173/login`.
2. Point out the **origin of the name** (*"From Sanskrit 'punar' (again) — renewal & resource rebirth"*).
3. Click the language toggle to switch between **English**, **తెలుగు (Telugu)**, and **हिन्दी (Hindi)**.
4. Click **Rajesh Sharma (Seller - Bapatla)** to log in.

### Step 2: AI Photo Upload & Multi-Agent Trace (45 seconds)
1. Click **"Sell / Donate Material"** or navigate to `/upload`.
2. Click the sample shortcut **"Red Clay Bricks"** (or upload your own photo).
3. Watch the live **Agent Trace Widget** execute in real time:
   - **Vision Agent**: Surveys photo, estimates quantity (e.g. 500 pieces), marks it as a **PROBABLE ESTIMATE** with 95% confidence.
   - **Reuse Agent**: Retrieves BIS standards from ChromaDB and recommends cleaning and reclaimed masonry with citations.
   - **Pricing Agent**: Valuates market price at ₹1,300 with condition-adjusted price range.
4. Edit the quantity to 250 pieces, check **"I have verified the count/weight"** to convert the estimate to a verified manual entry.
5. Click **"Publish Listing"**.

### Step 3: Matching Agent vs Fallback Agent (45 seconds)
1. The app automatically lands on `/matches/:id`.
2. Notice the **Matching Agent** results:
   - **Ananya Reddy** (1.5 km away) — Courtyard paving need.
   - **Bapatla Engineering College** (1.1 km away) — Concrete lab testing need.
   - Explanations render in the active language with distance and budget fit.
3. *Alternative:* Show how a rare or obsolete listing (e.g. industrial inverter PCB) seamlessly engages the **Fallback Agent**, displaying authorized AP e-waste recyclers and DIY capacitor reconditioning instructions.

### Step 4: Offers, Negotiation Agent & Pickup Arrangement (30 seconds)
1. Navigate to `/offers` to inspect received bids.
2. Observe the **Negotiation Agent**:
   - Offer #1 (Suresh, 45 km, ₹1,600) vs Offer #2 (Ananya, 1.5 km, ₹1,950).
   - Ananya's offer is highlighted with the glowing **"Best Offer"** badge.
3. Click **"Accept Offer"**: Notice Suresh's competing bid is automatically marked declined and notified.
4. Fill in the **Offline Pickup** form: Date `2026-11-12`, Time Window `10:00 AM - 1:00 PM`.
5. Switch persona to **Ananya Reddy (Buyer)** via `/login`:
   - Go to `/my-offers`.
   - The listing now shows **Exact Pickup Location Revealed**: Near GBC Road, Bapatla!

### Step 5: Dual Confirmation, Impact Analytics & Certificate (30 seconds)
1. In Ananya's view, click **"Confirm Handover Completed"**.
2. Switch to Rajesh Sharma and click **"Confirm Handover Completed"**.
3. Both parties have now confirmed! Confetti fires and the **"Certificate of Reuse, issued by Punarva"** appears with exact kg diverted, CO2 avoided, recipient name, and certificate ID.
4. Navigate to `/impact` to inspect:
   - Cumulative KPI cards (kg diverted, CO2 avoided, ₹ saved).
   - Strict separation of **Confirmed (100% Verified)** vs **Estimated Impact**.
   - Interactive Recharts area chart of CO2 avoided over time.

### Step 6: Dispute Mediation & Simulated 48h SLA Timeout (Optional)
1. Switch to **K. V. Subba Rao (Admin)**.
2. Navigate to `/admin`.
3. View active dispute reports with buyer and seller statements side by side.
4. Demonstrate the **"Simulate 48-Hour Timeout"** button on pending pickups to show automatic escalation to mediation.
5. Click **"Mark Completed"** to mediate and credit impact, or **"Cancel Exchange"** to revoke without penalty.

---

## 📋 Assumptions & Real-World Considerations

1. **Offline Settlements:** Punarva deliberately excludes online payment gateway credentials (e.g. Razorpay, Stripe) to avoid financial friction and fraud during informal surplus exchanges. Parties settle directly in cash or UPI at pickup.
2. **Privacy Boundary:** A seller's precise residential or construction address is masked from the public browse catalog and only revealed to the buyer after the seller accepts their offer.
3. **Quantity Verification:** AI Vision estimates are strictly tagged as approximations. Environmental impact is flagged as `is_estimated = True` unless the seller manually enters a confirmed weight or verified count.
4. **Fallback Recycler Directory:** Geocoded for Coastal Andhra Pradesh (Bapatla, Chirala, Guntur, Vijayawada) to provide genuine local value during hackathon evaluation.

---

## 👥 Seed Personas (Bapatla / Guntur Corridor)

| Name | Role | Email | Location | Specialty |
| :--- | :--- | :--- | :--- | :--- |
| **Rajesh Sharma** | Seller | `rajesh@punarva.demo` | Bapatla | Residential Contractor (Bricks, Tiles) |
| **Suresh Kumar** | Buyer | `suresh@punarva.demo` | Guntur | Home Builder & Mason |
| **Ananya Reddy** | Buyer | `ananya@punarva.demo` | Bapatla | Sustainable Architecture Student |
| **Bapatla Eng College** | Organization | `civil.lab@bec.edu` | Bapatla | Concrete & Materials Testing Lab |
| **K. V. Subba Rao** | Administrator | `admin@punarva.demo` | Guntur | Dispute Arbitrator & Registry Auditor |

---

## 📄 License
This project is open-source under the MIT License. Built with passion for circular economy and zero-waste resource rebirth.
