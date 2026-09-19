# Flowboard — Frontend

A modern task and project management client built with Next.js 15, React 19, TypeScript, Tailwind CSS, and Redux Toolkit.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19, Tailwind CSS, Radix UI, Lucide React, Framer Motion
- **State Management:** Redux Toolkit & Redux Persist
- **Forms & Validation:** React Hook Form, Zod
- **Authentication & API:** Axios, js-cookie, Google OAuth

---

## Prerequisites

Before starting, ensure you have:

- [Node.js](https://nodejs.org/) (v18 or v20+)
- [npm](https://www.npmjs.com/)
- Running backend API (via Docker Compose or manual setup on port `4078`)

---

## How to Run Locally

Follow these steps to run the frontend application on your local machine:

### 1. Navigate to the Frontend Directory

```bash
cd flowboard-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file by copying the example:

```bash
cp .env.example .env.local
```

*(See the [Environment Variables](#environment-variables-envlocal-instructions) section below for details)*

### 4. Start the Development Server

```bash
npm run dev
```

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

> **Note:** Ensure your backend server is running (e.g. `http://localhost:4078`) so that authentication, board management, and task updates can communicate properly.

---

## Environment Variables (`.env.local`) Instructions

Create a `.env.local` (or `.env`) file in the `flowboard-frontend` directory:

```bash
cp .env.example .env.local
```

### Example `.env.local` File

```env
# Backend API Base URL (points to your Express backend)
NEXT_PUBLIC_BASE_URL=http://localhost:4078/api/v1

# Google OAuth Client ID (Optional / for Google login)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Environment Variable Reference

| Variable | Required | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_BASE_URL` | **Yes** | The base URL of the Flowboard Express backend API | `http://localhost:4078/api/v1` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Google OAuth Client ID for social sign-in | `your-id.apps.googleusercontent.com` |

---

## Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server with Turbopack (`http://localhost:3000`) |
| `npm run build` | Builds the optimized production application |
| `npm run start` | Runs the production server build (configured on port `3060`) |
| `npm run lint` | Runs ESLint to check for code issues |

---

## Project Structure

```
flowboard-frontend/
├── public/                 # Static assets (images, icons, etc.)
├── src/
│   ├── app/                # Next.js App Router pages and layouts
│   ├── components/         # Reusable UI components
│   ├── redux/              # Redux slices, store configuration & hooks
│   ├── types/              # TypeScript interfaces and types
│   ├── utils/              # Helper functions, api client, and cookies
│   └── styles/             # Global CSS and Tailwind configurations
├── .env.example            # Example environment variables
├── package.json            # Project dependencies and scripts
├── tailwind.config.js      # Tailwind CSS theme configuration
├── tsconfig.json           # TypeScript configuration
└── README.md
```

---

## Troubleshooting

- **API Requests Failing (`ERR_CONNECTION_REFUSED` / CORS error):**
  - Verify that the backend server is running at `http://localhost:4078`.
  - Check `NEXT_PUBLIC_BASE_URL` in `.env.local` to ensure it matches the backend route prefix (default: `http://localhost:4078/api/v1`).
  - Verify `CORS_ORIGINS` in your backend `.env` includes `http://localhost:3000`.
- **Google Sign-In Issues:**
  - Ensure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` matches your authorized Google Cloud Console OAuth 2.0 Client credentials with `http://localhost:3000` added as an authorized Javascript origin.
