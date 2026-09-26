# SiteLedger — Frontend

[![Next.js](https://img.shields.io/badge/Next.js-15.5.15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-RTK_Query-764abc?style=flat&logo=redux)](https://redux-toolkit.js.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Connect_Payouts-635bff?style=flat&logo=stripe)](https://stripe.com/)

> **"The site office, with a clearer line of sight."**  
> Coordinate projects, workforce, attendance, daily site logs, inventory, expenses, and automated payroll payouts from one unified workspace.

---

## 📌 Overview

**SiteLedger** is an enterprise-grade construction and job site management frontend designed to streamline communication, operational workflows, and financial accountability between company administrators, field site managers, and on-site workers.

Built on the **Next.js 15 App Router**, **React 19**, and **Redux Toolkit (RTK Query)**, the platform provides real-time state synchronization, robust role-based route protection, automated daily logs, inventory tracking, and seamless worker payouts via **Stripe Connect**.

---

## 👥 Role-Based Architecture & Portals

SiteLedger includes dedicated interfaces and permissions tailored specifically for three key stakeholders, strictly enforced via Next.js Server Middleware:

```
                  ┌──────────────────────────────┐
                  │    SiteLedger Middleware     │
                  │   (JWT / Cookie Inspection)  │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Administrator   │    │   Site Manager   │    │      Worker      │
│     (/admin)     │    │  (/site-manager) │    │    (/worker)     │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

### 1. 🛡️ Administrator (`/admin`)
- **Operations Control:** Comprehensive dashboard tracking active projects, global workforce headcount, and company-wide financial movements.
- **Project Oversight:** Create, configure, edit, or archive construction sites with budget limits and assigned Site Managers.
- **Workforce & Invites:** Invite team members (Managers and Workers) via tokenized email invitations, assign base daily rates, and manage personnel categories.
- **Financial & Payroll Control:** Review and approve project expense reports, audit material purchase receipts, and approve/reject worker withdrawal requests.
- **Global Activity Audit:** Live audit log of site events, status updates, and transactions across all locations.

### 2. 👷 Site Manager (`/site-manager`)
- **Site Command:** Manage day-to-day operations for assigned job sites.
- **Attendance Management:** Bulk mark or individually verify daily attendance records (Present, Absent, Half Day, Leave, Holiday) with shift notes.
- **Task Management:** Create, delegate, and monitor work packages on an interactive Kanban board with priority flags and due dates.
- **Daily Progress Reports:** Submit daily site logs capturing weather conditions, active worker headcount, work completed, ongoing tasks, delays, and safety notes.
- **Materials & Inventory:** Monitor site stock levels, log material consumption, submit purchase logs, and request supplies with threshold alerts.
- **Expense Logging:** Record on-site operational expenses (Labor, Fuel, Transportation, Equipment Rental, Food, etc.) with proof-of-purchase attachments.

### 3. 🔨 Worker (`/worker`)
- **Workday Portal:** Mobile-first dashboard displaying assigned job sites, active daily tasks, and shifts.
- **Self Check-In / Check-Out:** Log daily site entry and exit times with shift notes and status confirmations.
- **Task Board:** Visual board to view assigned tasks, update work statuses (*To Do*, *In Progress*, *Completed*), and flag blockers.
- **Earnings & Stripe Payouts:** Real-time earnings calculation based on attendance and daily rates, with one-click withdrawal requests transferred directly via **Stripe Connect**.
- **Leave Requests:** Apply for planned leave with date range selection and reasoning, accompanied by real-time status tracking.

---

## ⚡ Key Modules & Features

| Module | Features & Capabilities |
| :--- | :--- |
| **📁 Project Management** | Multi-project workspace, site addresses, manager delegation, budget ceilings, custom worker daily rate overrides, and project health indicators. |
| **⏱️ Attendance Tracking** | Self check-in/out for workers, bulk manager entry, verification workflows, and shift attendance summaries. |
| **📋 Kanban & Tasks** | Drag-and-style Kanban columns (*To Do*, *In Progress*, *Blocked*, *Completed*, *Cancelled*), list view mode, priority badges, worker assignment, and milestone deadlines. |
| **📝 Daily Site Reports** | Weather condition tracking, worker attendance headcounts, daily completed work logs, work-in-progress notes, blockers/delays, and job site safety records. |
| **📦 Materials & Inventory** | Multi-category inventory (Cement, Steel, Brick, Sand, Paint, Electrical, etc.) with standard units, stock reorder alerts, usage logs, purchase receipts, and manager approvals. |
| **💰 Expenses & Budgeting** | Categorized expense tracking (Labor, Materials, Rental, Transportation, etc.), vendor references, receipt attachments, and real-time budget depletion summaries. |
| **💳 Payroll & Stripe Connect** | Automated worker earnings ledger, automated payouts, Stripe Connect Express onboarding flow, and admin review for withdrawals. |
| **🏖️ Leave Management** | Worker leave submission, date interval calculations, manager review/approval system, and automatic attendance synchronization. |
| **📨 Team Invitations** | Tokenized invite links with expiration dates, customizable roles, and automated onboarding pages (`/accept-invite`). |
| **💬 Collaboration & Chat** | Project-specific discussion boards, direct 1-on-1 team chat, and activity timelines. |

---

## 🛠️ Tech Stack

- **Core Framework:** [Next.js 15](https://nextjs.org/) (App Router, Turbopack enabled)
- **UI Library & Language:** [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/)
- **State Management & Data Fetching:**
  - [Redux Toolkit](https://redux-toolkit.js.org/) & [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) (tag-based cache invalidation: `projects`, `attendance`, `materials`, `expenses`, `payments`, `tasks`, etc.)
  - [Redux Persist](https://github.com/rt2zz/redux-persist) for client state persistence
- **Styling & Design System:**
  - [Tailwind CSS 3.4](https://tailwindcss.com/) with custom slate & amber palette
  - [Radix UI](https://www.radix-ui.com/) (Dialogs, Alert Dialogs, Select, Checkbox)
  - [Lucide React](https://lucide.dev/) icons
  - [Framer Motion](https://www.framer.com/motion/) for fluid transitions
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) schema validation
- **Authentication & Security:**
  - JWT authentication stored in HTTP cookies (`js-cookie`, `jwt-decode`)
  - Route protection & role redirection via Next.js Server Middleware (`src/middleware.ts`)
  - Optional OAuth integration via [NextAuth.js](https://next-auth.js.org/) / Google OAuth
- **Payments:** [Stripe.js](https://stripe.com/docs/js) & Stripe Connect Express onboarding

---

## 📂 Project Structure

```
siteledger-frontend/
├── public/                     # Static media and brand assets
├── src/
│   ├── app/                    # Next.js App Router routes & layouts
│   │   ├── (auth)/             # Authentication routes
│   │   │   ├── login/          # User sign-in
│   │   │   ├── forgot-password/# Password recovery request
│   │   │   ├── reset-password/ # Password reset with token
│   │   │   └── accept-invite/  # Team invitation onboarding
│   │   ├── admin/              # Administrator portal routes
│   │   │   ├── projects/       # Projects list, creation & editor
│   │   │   ├── attendance/     # Site attendance overview
│   │   │   ├── tasks/          # Company-wide task tracking
│   │   │   ├── daily-reports/  # Daily site reports
│   │   │   ├── expenses/       # Expense management & audits
│   │   │   ├── materials/      # Materials catalog & purchases
│   │   │   ├── payments/       # Payroll, earnings & Stripe payouts
│   │   │   ├── people/         # User invitations & team registry
│   │   │   ├── workers/        # Worker database & rate overrides
│   │   │   ├── leave/          # Leave requests & approvals
│   │   │   ├── activity/       # Global system audit trail
│   │   │   └── settings/       # Profile & account settings
│   │   ├── site-manager/       # Site Manager portal routes
│   │   ├── worker/             # Field Worker portal routes
│   │   ├── globals.css         # Global Tailwind CSS definitions
│   │   ├── layout.tsx          # Root application layout & providers
│   │   └── page.tsx            # Route redirector
│   ├── components/             # Reusable UI components by feature
│   │   ├── collaboration/      # Chat and activity workspaces
│   │   ├── finance/            # Expense tracking, budget summary & materials
│   │   ├── operations/         # Attendance, Daily Reports & Task Board
│   │   ├── payroll/            # Payments, Stripe payouts & Leave manager
│   │   ├── people/             # Team invitations & member tables
│   │   ├── projects/           # Project forms, rate settings & cards
│   │   ├── settings/           # Profile and password update forms
│   │   ├── shared/             # Header, navbar, modals, and sign-out controls
│   │   ├── shell/              # AppShell navigation & RoleOverview widgets
│   │   ├── ui/                 # Primitives (Dialog, Alert-Dialog, Button, etc.)
│   │   └── workers/            # Worker management workspace
│   ├── redux/                  # Application state management
│   │   ├── api/
│   │   │   └── baseApi.ts      # RTK Query root baseApi with auto-tagging
│   │   ├── features/           # Feature slices & API endpoints
│   │   │   ├── auth/           # Login, profile, OTP, password reset
│   │   │   ├── projects/       # Projects, tasks, rates & worker assignment
│   │   │   ├── operations/     # Attendance & daily progress reports
│   │   │   ├── finance/        # Expenses, materials, purchases & requests
│   │   │   ├── payroll/        # Payments, earnings, leaves & Stripe payouts
│   │   │   ├── invites/        # Invite creation & verification
│   │   │   └── collaboration/  # Chat rooms & activity logs
│   │   ├── hooks.ts            # Typed Redux hooks (`useAppDispatch`, `useAppSelector`)
│   │   └── store.ts            # Store configuration with redux-persist
│   ├── utils/                  # JWT decoder, cookie helpers & layouts
│   └── middleware.ts           # Role-based route guard & redirect logic
├── .env.example                # Template for environment configuration
├── next.config.ts              # Next.js build and image optimization settings
├── package.json                # Project dependencies and script commands
├── tailwind.config.js          # Tailwind theme and custom styling tokens
└── tsconfig.json               # TypeScript compiler configuration
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local environment:
- [Node.js](https://nodejs.org/) (`v18.18+` or `v20+` recommended)
- [npm](https://www.npmjs.com/) (bundled with Node) or [yarn](https://yarnpkg.com/) / [pnpm](https://pnpm.io/)
- A running **SiteLedger Backend API** instance

---

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mirhasankhan/site_ledger_frontend.git
   cd site_ledger_frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to create `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

4. **Update environment values:**
   Edit `.env.local` to point to your backend API server:
   ```env
   # Backend API Endpoint
   NEXT_PUBLIC_BASE_URL=http://localhost:5000/api/v1

   # Google OAuth Client ID (Optional, for Google Sign-in)
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open the application:**
   Navigate in your browser to:
   ```
   http://localhost:3000
   ```

---

## ⚙️ Environment Variables Reference

| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_BASE_URL` | **Yes** | Fully qualified URL for the SiteLedger Express backend API | `http://localhost:5000/api/v1` or `https://siteledger-bice.vercel.app/api/v1` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Google Cloud Console OAuth 2.0 Client ID for Google login | `your-app-id.apps.googleusercontent.com` |

---

## 📜 Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with Turbopack at `http://localhost:3000` |
| `npm run build` | Compiles and builds the production application bundle |
| `npm run start` | Boots the compiled production server on custom port `3060` (`http://localhost:3060`) |
| `npm run lint` | Runs ESLint to identify code issues and style inconsistencies |

---

## 🔒 Authentication & Access Flow

1. **Authentication Token:** On successful sign-in (`/login`), the JWT `accessToken` is stored in the browser cookie (`token`).
2. **Middleware Guarding (`src/middleware.ts`):**
   - Automatically decodes the user's role (`ADMIN`, `SITE_MANAGER`, `WORKER`) from the token payload.
   - Redirects unauthenticated visitors attempting to access protected routes to `/login`.
   - Prevents authenticated users on `/login` from re-authenticating, automatically redirecting them to their respective role dashboard.
   - Restricts cross-role access (e.g., workers attempting to view `/admin` are immediately rerouted to `/worker`).
3. **Session Persistence:** Redux Persist maintains user details across page refreshes, and the RTK Query `baseApi` injects the `Authorization: Bearer <token>` header on every outbound request.

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software belonging to the SiteLedger organization. All rights reserved.
