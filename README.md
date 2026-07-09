# Grid: Academic Networking and Proof of Work Platform

Grid is a scalable, Next.js based platform engineered for academic networking, portfolio verification, and hyper-local community management. The system leverages AI driven KYC (Know Your Customer) processes to verify student identities and isolates user bases into verified, college specific networks.

## System Architecture

The application follows a modern serverless architecture pattern, utilizing Next.js App Router for server side rendering and API route handling, backed by a MongoDB cluster.

```mermaid
graph TD
    Client[Client Browser]
    NextJS[Next.js Application]
    Auth[NextAuth / Google OAuth]
    DB[(MongoDB Atlas)]
    Gemini[Google Gemini API]

    Client -->|HTTP/WebSocket| NextJS
    Client -->|OAuth/Token| Auth
    NextJS -->|Mongoose ODM| DB
    NextJS -->|Image Processing| Gemini
    Auth -->|Token Verification| NextJS
```

## Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| Framework | Next.js 16 (App Router) | Server-side rendering, routing, API endpoints |
| Language | TypeScript | Static typing, interface definitions |
| Database | MongoDB & Mongoose | Document storage, schema validation |
| Authentication | NextAuth (Google OAuth) | Secure session management & OAuth |
| Styling | CSS Modules | Scoped component styling, custom design system |
| AI Integration | Google Gemini Vision | Automated student ID OCR and verification |

## Core Modules

### 1. Identity and Verification Pipeline
The verification system ensures a high trust environment by algorithmically confirming student enrollment.
* Users upload institutional ID cards.
* Images are processed via Google Gemini Vision API.
* Extracted text is cross referenced against user profile data (Name, College).
* Successful validation modifies the user schema `verified` boolean, unlocking protected application tiers.

### 2. Community Routing System
Users are dynamically partitioned into micro-communities based on their institutional affiliation.
* Centralized dataset of 200+ Indian academic institutions.
* Dedicated database indexing on the `college` field for O(1) query performance on community feeds.
* Segregated project boards and discussion forums per institution.

### 3. Proof of Work (PoW) Infrastructure
Grid replaces conventional resumes with a verifiable project portfolio.
* Users log technical projects and deployments.
* Peer endorsement system validates technical claims.
* AI driven resume analysis module parses and critiques uploaded documents for actionable improvement.

## Directory Structure

```text
camp/
  ├── public/              # Static assets and images
  ├── src/
  │   ├── app/             # Next.js App Router directory
  │   │   ├── api/         # Serverless API endpoints
  │   │   ├── community/   # College specific community feeds
  │   │   ├── profile/     # User profile management and verification
  │   │   └── roast/       # AI resume analysis module
  │   ├── components/      # Reusable React components (Navbar, Modals)
  │   ├── data/            # Static datasets (Colleges, States)
  │   ├── lib/             # Utility functions and database connectors
  │   └── models/          # Mongoose schema definitions
  ├── .env.local           # Environment configuration (git ignored)
  ├── next.config.ts       # Framework configuration
  └── package.json         # Dependency management
```

## Environment Configuration

Create a `.env.local` file in the project root with the following keys.

| Variable Name | Required | Description |
| :--- | :--- | :--- |
| NEXTAUTH_SECRET | Yes | Secret key for signing NextAuth sessions |
| GOOGLE_CLIENT_ID | Yes | Google Cloud OAuth Client ID |
| GOOGLE_CLIENT_SECRET | Yes | Google Cloud OAuth Client Secret |
| MONGODB_URI | Yes | Connection string for MongoDB instance |
| GEMINI_API_KEY | Yes | Google GenAI API key for OCR operations |

## Installation and Build Pipeline

1. Clone the repository and install dependencies.
```bash
git clone https://github.com/tanushbhootra576/camp.git
cd camp
npm install
```

2. Initialize the development server.
```bash
npm run dev
```

3. Execute the production build process.
```bash
npm run build
npm start
```

## Deployment Notes

This repository is optimized for deployment via Vercel. Ensure all environment variables listed in the configuration table are mapped exactly within the Vercel project settings prior to triggering a build. The default Next.js build command (`npm run build`) is automatically detected.

Developed by Tanush Bhootra.
