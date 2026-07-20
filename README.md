# 🚚 TasLogistic

A full-stack logistics and shipment tracking platform built with **TypeScript**, **Node.js**, **Prisma ORM**, and **PostgreSQL**.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## 🌟 Features

- 📦 **Shipment & Parcel Tracking**: Real-time tracking of packages and carrier delivery statuses.
- 🔐 **Authentication & Security**: Multi-factor auth supporting JWT refresh tokens and SMS phone verification.
- 🚚 **Carrier Integration**: Multi-carrier management and automated delivery type routing.
- 💾 **Database & Migrations**: Strongly-typed schema powered by Prisma ORM and PostgreSQL migrations.
- 🐳 **Dockerization**: Containerized backend services with Docker Compose support for development and production.

---

## 🏗️ Project Architecture

```
TasLogistic/
├── backend/
│   ├── prisma/             # Prisma schema & SQL migrations
│   ├── Dockerfile          # Production container setup
│   ├── Dockerfile.dev      # Development container setup
│   └── package.json        # Backend dependencies
├── .github/
│   └── workflows/          # Automated database backup workflows
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL or Docker

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AkBePEEK/TasLogistic.git
   cd TasLogistic/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Set your `DATABASE_URL` and `JWT_SECRET` in `.env`.

4. **Run Database Migrations:**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server:**
   ```bash
   npm run start:dev
   ```

---

## 📝 License
Distributed under the MIT License.
