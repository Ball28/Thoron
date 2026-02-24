# 🦅 Thoron TMS

**Thoron** is an enterprise-grade Transport Management System (TMS) built for freight and logistics operations. Named after *Thorondor*, the great eagle of Middle-earth, it embodies speed, precision, and strength.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Backend | Express.js + TypeScript |
| Database | SQLite via `sqlite3` |
| Styling | Vanilla CSS (custom design system) |
| Icons | `lucide-react` |

---

## Getting Started

### Prerequisites

- **Node.js** v18+ (v20+ recommended)
- **npm** v9+

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Thoron
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Start the Backend

```bash
cd backend
npm run dev
```

> The API server starts on **http://localhost:3001**. A fresh `thoron.db` SQLite file is created automatically on first run with all tables initialized.

### 5. Seed Demo Carriers (First Run Only)

After starting the backend for the first time, call the seed endpoint once:

```bash
curl -X POST http://localhost:3001/api/carriers/reset
```

This drops and re-creates the carriers table and inserts 6 demo carriers.

### 6. Start the Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

> The UI is served at **http://localhost:5173**

---

## Project Structure

```
Thoron/
├── backend/
│   ├── src/
│   │   ├── database.ts       # SQLite connection, schema init, and carrier seeder
│   │   └── index.ts          # Express server + all REST API routes
│   ├── thoron.db             # Auto-generated SQLite database (gitignore this)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   │   └── logo.png          # Thorondor eagle logo (amber/gold)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx / .css    # Navigation sidebar with eagle logo
│   │   │   ├── Header.tsx / .css     # Top bar with search and notifications
│   │   │   ├── Shipments.tsx / .css  # Shipment Management module
│   │   │   ├── RateQuoting.tsx / .css # Rate Shopping & Quoting module
│   │   │   └── Carriers.tsx / .css   # Carrier Management module
│   │   ├── App.tsx           # Root layout; tab routing between modules
│   │   ├── App.css           # App-level layout styles
│   │   ├── index.css         # Global design system (CSS variables, utilities)
│   │   └── main.tsx          # Vite entry point
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## File Reference

### Backend

#### `backend/src/database.ts`
- Opens (or creates) the SQLite database at `backend/thoron.db`
- Initializes all tables with `CREATE TABLE IF NOT EXISTS`
- Runs `ALTER TABLE` migrations for schema updates on existing DBs
- Seeds 6 demo carriers on first run if the `carriers` table is empty

#### `backend/src/index.ts`
- Express app with CORS and JSON body parsing
- Mounts all REST API routes:

| Method | Route | Description |
|---|---|---|
| GET | `/api/shipments` | List all shipments |
| POST | `/api/shipments` | Create a new shipment |
| POST | `/api/quotes` | Get carrier rate quotes (simulated) |
| GET | `/api/carriers` | List all carriers (sorted by rating) |
| GET | `/api/carriers/:id` | Get a single carrier by ID |
| POST | `/api/carriers` | Create a new carrier |
| PUT | `/api/carriers/:id` | Update a carrier |
| DELETE | `/api/carriers/:id` | Remove a carrier |
| POST | `/api/carriers/reset` | Drop + recreate + seed the carriers table |
| POST | `/api/tracking/reset` | Drop + recreate + seed tracking, orders, and users tables |
| GET | `/api/tracking/:number` | Get shipment details timeline by tracking number |
| GET | `/api/stats` | Get top-level dashboard metrics |
| GET | `/api/documents` | List uploaded documents |
| POST | `/api/documents` | Upload a document |
| DELETE| `/api/documents/:id` | Delete a document |
| GET | `/api/invoices` | List carrier invoices |
| PUT | `/api/invoices/:id/status`| Update invoice status |
| GET | `/api/orders` | List unassigned orders |
| POST | `/api/orders/plan` | Plan orders into a single shipment |
| GET | `/api/users` | List system users |
| PUT | `/api/users/:id/role` | Update user access role |

---

### Frontend

#### `src/index.css`
The global design system. All visual tokens are defined here as CSS variables:
- **Colors**: `--color-primary` (amber `#FFC107`), background layers, text, borders
- **Spacing**: `--spacing-xs` through `--spacing-4xl`
- **Typography**: `--font-size-xs` through `--font-size-4xl`
- **Utilities**: `.card`, `.btn`, `.btn-primary`, `.badge`, `.table-container`, etc.

#### `src/App.tsx`
Root component. Holds `activeTab` state and renders `<Sidebar>`, `<Header>`, and the active module component via a `switch` statement.

#### `src/components/Sidebar.tsx`
- Navigation sidebar with the Thorondor eagle logo image
- `navItems` array drives all sidebar links
- Accepts `activeItem` and `setActiveItem` props from `App.tsx`

#### `src/components/Header.tsx`
- Top bar with page title, search bar, and notification bell
- Accepts `title` prop from `App.tsx`

#### `src/components/Shipments.tsx`
Shipment Management module:
- Fetches all shipments from `GET /api/shipments` on mount
- Displays a searchable table with ID, lane, weight, status
- **New Shipment** inline form for creating entries (persisted to DB)

#### `src/components/RateQuoting.tsx`
Rate Shopping & Quoting module:
- Input form: origin, destination, weight, freight class
- Posts to `POST /api/quotes` and displays simulated carrier quotes
- Results ranked by **Thoron Score** with the top recommendation highlighted
- Loading animation while fetching

#### `src/components/Carriers.tsx`
Carrier Management module:
- Stats bar: active count, avg on-time rate, pending, avg rating
- Two-panel layout: directory table (left) + scorecard detail (right)
- Click any carrier row to open its scorecard (on-time %, claim rate, rating, insurance, MC/DOT, contact info)
- **Add Carrier** modal form with company info and contact fields
- **Remove Carrier** with confirmation prompt

#### Additional Modules Included:
- **Tracking & Visibility**: Real-time shipment event timelines.
- **Reporting & Analytics**: Recharts visualizations for freight spend and SLA adherence.
- **Document Management**: Centralized repository for BOLs, PODs, and Customs paperwork.
- **Freight Audit & Payment**: Interactive invoice discrepancy resolution (Approve vs Dispute).
- **Order & Load Planning**: Dual-pane drag/drop consolidation of LTL orders into Full Truckload shipments.
- **User Management**: Inline status and role access controller.

---

## Database Schema

### `carriers`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| name | TEXT | Carrier legal name |
| mcNumber | TEXT | FMCSA Motor Carrier number |
| dotNumber | TEXT | USDOT number |
| contactName | TEXT | Primary contact |
| contactEmail | TEXT | |
| contactPhone | TEXT | |
| insuranceLimit | REAL | Cargo liability in USD |
| serviceLevel | TEXT | Priority / Standard / Guaranteed / Spot |
| modes | TEXT | Comma-separated: LTL, FTL, Intermodal, etc. |
| onTimeRate | REAL | 0.0–1.0 decimal |
| claimRate | REAL | 0.0–1.0 decimal |
| rating | REAL | 0.0–5.0 |
| status | TEXT | Active / Inactive / Pending |
| createdAt | DATETIME | Auto-set |

### `shipments`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| origin | TEXT | City, ST or address |
| destination | TEXT | |
| weight | REAL | lbs |
| dimensions | TEXT | e.g. `48x40x42` |
| freightClass | TEXT | NMFC class (50–500) |
| status | TEXT | Pending / Dispatched / In Transit / Delivered / Exception |
| carrierId | INTEGER | FK → carriers |
| trackingNumber | TEXT | |
| estimatedDelivery | TEXT | |
| createdAt | DATETIME | Auto-set |

### `lanes` / `rates`
Supporting tables for carrier lane coverage and tariff rate data. Currently scaffold-only; will be fully implemented in a future sprint.

---

## Design System

Thoron uses a custom "Thorondor" theme:

| Token | Value |
|---|---|
| Background | `#0B1120` (deep slate) |
| Surface | `#111827` |
| Primary (accent) | `#FFC107` (amber gold) |
| Success | `#00E676` |
| Warning | `#FFC107` |
| Error | `#FF1744` |
| Font | System sans-serif stack |

All color and spacing values are defined as CSS variables in `frontend/src/index.css` and consumed throughout the component stylesheets.

---

## Modules Roadmap

| Module | Status |
|---|---|
| Shipment Management | ✅ Complete |
| Rate Shopping & Quoting | ✅ Complete |
| Carrier Management | ✅ Complete |
| Tracking & Visibility Dashboard | ✅ Complete |
| Reporting & Analytics | ✅ Complete |
| Document Management | ✅ Complete |
| Freight Audit & Payment | ✅ Complete |
| Order & Load Planning | ✅ Complete |
| User & Role Management | ✅ Complete |

---

## Environment Notes

- The backend uses **ES Modules** (`"type": "module"` in `package.json`) with `ts-node/esm` for TypeScript compilation at runtime via nodemon.
- `__dirname` is polyfilled in `database.ts` using `fileURLToPath(import.meta.url)`.
- The SQLite database file (`thoron.db`) is created automatically and should be added to `.gitignore`.
