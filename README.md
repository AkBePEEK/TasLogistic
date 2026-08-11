# 🚚 TasLogistic

A comprehensive, full-stack logistics and parcel tracking platform built with **React**, **TypeScript**, **Node.js**, **Express**, **Prisma ORM**, **PostgreSQL**, **Socket.io**, and **Docker**.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## 🌟 Key Features

- 📦 **Real-Time Parcel Tracking**: Live tracking of shipments and items via tracking codes powered by WebSockets (`Socket.io`).
- 👥 **Role-Based Access Control (RBAC)**: Tailored dashboards for **Admin**, **Seller**, and **Customer** roles (`RequireRole`).
- 🔐 **Multi-Factor Auth**: Secure authentication featuring JWT tokens, Refresh Token rotation, and SMS OTP verification.
- 🌐 **Internationalization (i18n)**: Native multi-language support for **Kazakh (KZ)** and **Russian (RU)**.
- 🧾 **Receipt & PDF Generation**: Automated receipt PDF export for sellers and shipment records.
- 📊 **Admin Analytics & Management**: Complete carrier routing, item management, and system report generation.

---

## 🏗️ Full Project Architecture

```
TasLogistic/
├── 📁 backend/                        # Node.js & TypeScript REST API & WebSocket Server
│   ├── 📁 prisma/                      # Database Schema & Migrations
│   │   ├── 📄 schema.prisma            # Prisma ORM Data Models (User, Item, Shipment, Carrier, OTP)
│   │   ├── 📄 seed.ts                  # Database Seeding Script
│   │   └── 📁 migrations/              # SQL Migration History
│   ├── 📁 src/
│   │   ├── 📄 app.ts                   # Express Application Setup
│   │   ├── 📄 socket.ts                # Real-Time WebSocket Server Setup
│   │   ├── 📁 config/                  # Database Connections & Prisma Client
│   │   ├── 📁 controllers/             # Request Handlers (Admin, Auth, Carrier, Customer, Profile, Seller, Track)
│   │   ├── 📁 middleware/              # JWT Auth, Role Authorization, Ownership, OTP Rate Limits, Error Handler
│   │   ├── 📁 routes/                  # Express API Route Definitions
│   │   ├── 📁 schemas/                 # Zod Request Validation Schemas
│   │   ├── 📁 types/                   # Backend TypeScript Interfaces
│   │   └── 📁 utils/                   # Tracking Code Generator, OTP Helper, Token Helpers, Response Formatter
│   ├── 📄 Dockerfile                   # Production Docker Container Setup
│   ├── 📄 Dockerfile.dev               # Development Docker Container Setup
│   └── 📄 package.json                 # Backend Dependencies
│
├── 📁 frontend/                       # Vite + React + TypeScript Single Page Application
│   ├── 📄 index.html                   # HTML Entry Point
│   ├── 📄 vite.config.ts               # Vite Build Configuration
│   ├── 📄 tailwind.config.js           # Tailwind CSS Design System Configuration
│   ├── 📄 nginx.conf                  # Production Web Server Reverse Proxy Config
│   ├── 📁 src/
│   │   ├── 📄 main.tsx                 # React App Entry Point
│   │   ├── 📄 App.tsx                  # Router & App Route Definitions
│   │   ├── 📁 api/                     # Axios API Clients (Admin, Auth, Carrier, Customer, Profile, Seller)
│   │   ├── 📁 components/              # Shared Components (LanguageSwitcher, LogoLink, RequireRole, UI Skeletons)
│   │   ├── 📁 contexts/                # React Contexts (AuthContext)
│   │   ├── 📁 hooks/                   # Custom React Hooks (useAuth, useSocket)
│   │   ├── 📁 i18n/                    # Localization Translations (kz.ts, ru.ts)
│   │   ├── 📁 layouts/                 # Page Layouts (DashboardLayout)
│   │   ├── 📁 pages/                   # Public Pages (LoginPage, RegisterPage, TrackPage, NotFoundPage)
│   │   │   └── 📁 dashboard/           # Role Dashboards (Admin, Customer, Seller views & ItemDetail)
│   │   ├── 📁 schemas/                 # Frontend Validation Schemas
│   │   ├── 📁 types/                   # Frontend TypeScript Interfaces
│   │   └── 📁 utils/                   # Date Formatting & PDF Receipt Generation Helpers
│   ├── 📄 Dockerfile                   # Production Frontend Container Setup
│   └── 📄 package.json                 # Frontend Dependencies
│
├── 📁 .github/workflows/               # Database Backup CI/CD Workflows
├── 📄 docker-compose.yml              # Production Multi-Container Docker Orchestration
├── 📄 docker-compose.dev.yml          # Development Docker Orchestration
└── 📄 README.md                        # Documentation
```

---

## 🚀 Getting Started

### Option 1: Running with Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AkBePEEK/TasLogistic.git
   cd TasLogistic
   ```

2. **Start all services (Database, Backend, Frontend):**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

---

### Option 2: Manual Development Setup

#### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env

# Run database migrations & seed data
npx prisma migrate dev
npx prisma db seed

# Start API server in dev mode
npm run start:dev
```

#### 2. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env

# Start Vite dev server
npm run dev
```

---

## 📝 License
Distributed under the MIT License.
