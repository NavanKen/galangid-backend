# 🏗 GalangID Backend

![NestJS](https://img.shields.io/badge/NestJS-11-red?style=for-the-badge&logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7.8-teal?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)
![Zod](https://img.shields.io/badge/Zod-4-purple?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-black?style=for-the-badge)

**Backend API** untuk platform crowdfunding **GalangID**.

Backend ini menangani seluruh business logic platform donasi, termasuk autentikasi, manajemen campaign, pembayaran, dan integrasi AI Moderation Service untuk menganalisis campaign sebelum dipublikasikan.

---

## ✨ Features

- 🔐 **Authentication** — JWT Authentication & Role Based Access Control
- 📋 **Campaign Management** — CRUD campaign, submit, approval workflow
- 🤖 **AI Moderation Integration** — analisis campaign otomatis via FastAPI AI service
- 💰 **Donation System** — donasi dengan berbagai metode pembayaran
- 💳 **Payment Gateway** — integrasi Midtrans
- 👤 **User Management** — profil, verifikasi KTP, role-based access
- 📊 **Admin Dashboard API** — manajemen platform oleh admin
- ✅ **Input Validation** — Zod schema validation via `nestjs-zod`

---

## 🛠 Tech Stack

| Technology           | Deskripsi                      |
| -------------------- | ------------------------------ |
| **NestJS 11**        | Backend framework              |
| **TypeScript**       | Language                       |
| **Prisma 7**         | ORM & database toolkit         |
| **PostgreSQL**       | Database                       |
| **Zod + nestjs-zod** | DTO validation                 |
| **Passport + JWT**   | Authentication                 |
| **Axios**            | HTTP client (AI service calls) |
| **Slugify**          | URL slug generation            |
| **Bcrypt**           | Password hashing               |

---

## 📂 Project Structure

```
backend/
│
├── prisma/
│   └── schema.prisma                # Database schema & models
│
├── src/
│   ├── ai-moderation/               # 🤖 AI Moderation integration module
│   │   ├── dto/
│   │   │   └── ai-moderation.dto.ts  # Request/Response DTO untuk FastAPI
│   │   ├── ai-moderation.module.ts   # Module definition
│   │   ├── ai-moderation.service.ts  # Service: panggil AI, simpan hasil
│   │   └── index.ts                  # Barrel export
│   │
│   ├── auth/                         # 🔐 Authentication module
│   │   ├── decorators/               # @Auth(), @CurrentUser()
│   │   ├── guards/                   # JWT guard
│   │   ├── strategies/               # Passport JWT strategy
│   │   ├── dto/                      # Login, Register DTOs
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   │
│   ├── campaign/                     # 📋 Campaign module
│   │   ├── dto/                      # Create, Update, Query DTOs
│   │   ├── campaign.controller.ts    # REST endpoints
│   │   ├── campaign.service.ts       # Business logic + AI integration
│   │   └── campaign.module.ts
│   │
│   ├── donation/                     # 💰 Donation module
│   ├── payment/                      # 💳 Payment module
│   ├── user/                         # 👤 User management module
│   │
│   ├── common/                       # 🧰 Shared utilities
│   │   ├── config/                   # Role config, JWT config
│   │   ├── dto/                      # Shared DTOs
│   │   ├── interceptors/             # Response interceptors
│   │   ├── pipes/                    # Validation pipes
│   │   └── utils/                    # Pagination, helpers
│   │
│   ├── prisma/                       # 🗄️ Prisma service module
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   │
│   ├── app.module.ts                 # Root module
│   └── main.ts                       # Entry point
│
├── .env                              # Environment variables
├── package.json
├── tsconfig.json
└── vercel.json                       # Vercel deployment config
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- GalangID AI Moderation Service (FastAPI) running

### Clone Repository

```bash
git clone https://github.com/NavanKen/galangid-backend.git
cd galangid-backend
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Buat file `.env` di root project:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/galangid

# JWT
JWT_ACCESS_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=7d

# AI Moderation Service
AI_SERVICE_API=http://localhost:8000


MIDTRANS
MIDTRANS_BASE_URL="https://api.sandbox.midtrans.com/v2/charge"
MIDTRANS_SERVER_KEY="your_midtrans_server_key"
MIDTRANS_CLIENT_KEY="your_midtrans_client_key_key"
MIDTRANS_IS_PRODUCTION=false
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Jalankan migration
npx prisma migrate dev --name init

# (Opsional) Buka Prisma Studio untuk lihat data
npx prisma studio
```

### Run Development Server

```bash
npm run start:dev
```

Server akan berjalan di `http://localhost:3000`.

---

## 📡 Key API Endpoints

### Auth

| Method | Endpoint         | Deskripsi            |
| ------ | ---------------- | -------------------- |
| `POST` | `/auth/register` | Register user baru   |
| `POST` | `/auth/login`    | Login & dapatkan JWT |

### Campaign

| Method   | Endpoint               | Deskripsi                           | Auth       |
| -------- | ---------------------- | ----------------------------------- | ---------- |
| `POST`   | `/campaign`            | Buat campaign baru (DRAFT)          | Campaigner |
| `GET`    | `/campaign`            | List campaign publik (ACTIVE)       | Public     |
| `GET`    | `/campaign/:id`        | Detail campaign + AI review         | Public     |
| `PATCH`  | `/campaign/:id`        | Update campaign                     | Campaigner |
| `PATCH`  | `/campaign/:id/submit` | Submit campaign → **AI Moderation** | Campaigner |
| `DELETE` | `/campaign/:id`        | Hapus campaign                      | Campaigner |

### Admin

| Method | Endpoint                | Deskripsi                     | Auth  |
| ------ | ----------------------- | ----------------------------- | ----- |
| `GET`  | `/campaign/admin`       | List semua campaign + AI data | Admin |
| `GET`  | `/campaign/pending`     | List campaign pending review  | Admin |
| `PUT`  | `/campaign/:id/approve` | Approve campaign              | Admin |
| `PUT`  | `/campaign/:id/reject`  | Reject campaign               | Admin |
| `PUT`  | `/campaign/:id/suspend` | Suspend campaign              | Admin |

---

## 🤖 AI Moderation Flow

Ketika campaigner menekan **Submit Campaign**, backend otomatis menjalankan alur berikut:

```
1. Validasi ownership & status DRAFT
           │
           ▼
2. Kirim data ke FastAPI (POST /moderations/analyze)
           │
           ▼
3. Terima hasil AI (risk_score, approved, suggestions, dll)
           │
           ▼
4. Tentukan keputusan bisnis berdasarkan risk_score:
   ┌─────────────────────────────────────────────┐
   │  0-40   → AUTO_APPROVED → Status: ACTIVE    │
   │  41-70  → PENDING_REVIEW → Status: PENDING  │
   │  71-100 → REJECTED → Status: PENDING        │
   └─────────────────────────────────────────────┘
           │
           ▼
5. Simpan campaign + hasil AI dalam 1 transaksi
           │
           ▼
6. Kembalikan response + AI feedback ke campaigner
```

> **AI hanya berfungsi sebagai advisor.** Keputusan akhir tetap berada pada business logic NestJS dan admin.

---

## 🗄️ Database Schema (Highlights)

### Core Models

| Model            | Deskripsi                                |
| ---------------- | ---------------------------------------- |
| `User`           | User platform (Donor, Campaigner, Admin) |
| `UserProfile`    | Profil lengkap + verifikasi KTP          |
| `Campaign`       | Campaign donasi                          |
| `AiModeration`   | Hasil analisis AI per campaign           |
| `CampaignReview` | Review manual oleh admin                 |
| `Donation`       | Transaksi donasi                         |
| `Payment`        | Detail pembayaran                        |
| `Withdrawal`     | Pencairan dana                           |
| `Badge`          | Sistem gamifikasi                        |
| `Notification`   | Notifikasi user                          |

### AiModeration Model

```
┌──────────────────┬───────────────────┐
│ Field            │ Type              │
├──────────────────┼───────────────────┤
│ riskScore        │ Int (0-100)       │
│ aiApproved       │ Boolean           │
│ category         │ String            │
│ summary          │ Text              │
│ reason           │ Text              │
│ scamIndicators   │ Json (string[])   │
│ suggestions      │ Json (string[])   │
│ decision         │ AiModerationStatus│
│ analyzedAt       │ DateTime          │
└──────────────────┴───────────────────┘
```

---

## 📍 Roadmap

- [x] Project setup & architecture
- [x] Authentication (JWT)
- [x] Campaign CRUD
- [x] Campaign submission & approval workflow
- [x] AI Moderation integration (FastAPI)
- [x] Donation module
- [x] Payment gateway integration
- [x] Database schema design
- [ ] OAuth login (Google, Facebook)
- [ ] Cloudinary image upload
- [ ] Email notifications
- [ ] Withdrawal processing
- [ ] Badge & gamification system
- [ ] Admin dashboard analytics
- [ ] Rate limiting
- [ ] WebSocket notifications

---

## 🏗 Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Frontend   │────▶│  NestJS Backend  │────▶│  FastAPI AI Service  │
│  (Next.js)  │◀────│   (This repo)    │◀────│  (AI Moderation)     │
└─────────────┘     └────────┬─────────┘     └──────────┬──────────┘
                             │                          │
                     ┌───────▼───────┐          ┌───────▼───────┐
                     │  PostgreSQL   │          │ Google Gemini │
                     │  Database     │          │     API       │
                     └───────────────┘          └───────────────┘
```

---

## 📜 Available Scripts

| Script               | Deskripsi                |
| -------------------- | ------------------------ |
| `npm run start:dev`  | Development mode (watch) |
| `npm run start`      | Start server             |
| `npm run start:prod` | Production mode          |
| `npm run build`      | Build project            |
| `npm run test`       | Run unit tests           |
| `npm run test:e2e`   | Run e2e tests            |
| `npm run lint`       | Lint & fix               |

---

## 📄 License

This project is part of the **GalangID** ecosystem and is intended for educational purposes and portfolio development.
