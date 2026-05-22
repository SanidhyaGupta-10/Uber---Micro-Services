<div align="center">

# 🚗 Uber — Micro-Services Architecture

**A production-inspired ride-hailing backend built with a clean microservices pattern.**  
Decoupled services, async messaging, JWT auth, and a single API Gateway — all in Node.js + ES Modules.

[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-AMQP-FF6600?logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![ESM](https://img.shields.io/badge/Modules-ES%20Modules-F7DF1E?logo=javascript&logoColor=black)](https://nodejs.org/api/esm.html)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Services](#-services)
  - [🌐 API Gateway](#-api-gateway-port-3000)
  - [👤 User Service](#-user-service-port-3001)
  - [🚖 Captain Service](#-captain-service-port-3002)
  - [🛣️ Ride Service](#️-ride-service-port-3003)
- [API Reference](#-api-reference)
- [Workflows](#-workflows)
  - [🔐 User Registration & Login](#-user-registration--login-flow)
  - [🚕 Ride Request Flow](#-ride-request-flow)
  - [✅ Ride Acceptance Flow](#-ride-acceptance-flow)
- [Message Queues](#-message-queues-rabbitmq)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)

---

## 🧭 Overview

This project implements a **real-world microservices backend** for a ride-hailing platform modelled after Uber. Each domain (users, captains/drivers, rides) is an **independently deployable Node.js service** that communicates over both **HTTP (via API Gateway)** and **asynchronous message queues (RabbitMQ)**.

Key architectural highlights:

- 🏗️ **4 independent services** — Gateway, User, Captain, Ride
- 🔀 **Event-driven messaging** via RabbitMQ (AMQP) for real-time ride dispatching
- 🔐 **JWT-based authentication** with cookie support and token blacklisting
- 📡 **Long-polling** for real-time ride notifications (no WebSocket needed)
- 🗄️ **MongoDB** with Mongoose ODM per service (shared-nothing persistence)
- 📦 **ES Modules** (`"type": "module"`) throughout every service

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | ![Node.js](https://img.shields.io/badge/-Node.js%2024-339933?logo=node.js&logoColor=white) | JavaScript server runtime |
| **Framework** | ![Express](https://img.shields.io/badge/-Express%205-000000?logo=express&logoColor=white) | HTTP server & routing |
| **Database** | ![MongoDB](https://img.shields.io/badge/-MongoDB-47A248?logo=mongodb&logoColor=white) | Document store per service |
| **ODM** | ![Mongoose](https://img.shields.io/badge/-Mongoose%209-880000?logo=mongoose&logoColor=white) | Schema modeling & validation |
| **Messaging** | ![RabbitMQ](https://img.shields.io/badge/-RabbitMQ-FF6600?logo=rabbitmq&logoColor=white) | Async inter-service events (AMQP) |
| **Auth** | ![JWT](https://img.shields.io/badge/-JSON%20Web%20Token-000000?logo=jsonwebtokens&logoColor=white) | Stateless authentication |
| **Password** | ![bcrypt](https://img.shields.io/badge/-bcrypt-4A4A4A?logo=lock&logoColor=white) | Password hashing |
| **Proxy** | `express-http-proxy` | Gateway reverse proxy |
| **HTTP Client** | ![Axios](https://img.shields.io/badge/-Axios-5A29E4?logo=axios&logoColor=white) | Inter-service HTTP calls (Ride) |
| **Dev Server** | ![nodemon](https://img.shields.io/badge/-nodemon-76D04B?logo=nodemon&logoColor=white) | Hot-reload during development |
| **Modules** | ES Modules (`import`/`export`) | Native module system |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser / App)                   │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTP :3000
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      🌐 API GATEWAY  (:3000)                     │
│                    express-http-proxy                            │
│  /user/*  ──► :3001    /captain/*  ──► :3002    /ride/*  ──► :3003 │
└───────────┬─────────────────┬──────────────────────┬───────────┘
            │                 │                      │
            ▼                 ▼                      ▼
    ┌───────────────┐ ┌───────────────┐   ┌───────────────────┐
    │  👤 User Svc  │ │ 🚖 Captain Svc│   │  🛣️ Ride Service  │
    │   (:3001)     │ │   (:3002)     │   │     (:3003)       │
    │               │ │               │   │                   │
    │  MongoDB      │ │  MongoDB      │   │  MongoDB          │
    └───────┬───────┘ └───────┬───────┘   └────────┬──────────┘
            │                 │                     │
            └────────┬────────┘                     │
                     │        RabbitMQ (AMQP)        │
                     │  ┌────────────────────────┐  │
                     └─►│  📨 Message Broker     │◄─┘
                        │                        │
                        │  Queue: new-ride        │
                        │  Queue: ride-accepted   │
                        └────────────────────────┘
```

---

## 📦 Services

### 🌐 API Gateway `(port 3000)`

The single entry point for all client requests. Uses `express-http-proxy` to transparently forward requests to the appropriate downstream service. No business logic lives here.

| Path Prefix | Proxied To |
|---|---|
| `/user/*` | User Service `:3001` |
| `/captain/*` | Captain Service `:3002` |
| `/ride/*` | Ride Service `:3003` |

---

### 👤 User Service `(port 3001)`

Manages **passenger** accounts and handles real-time ride notifications via long-polling.

**Stack:** Express 5 · Mongoose · JWT · bcrypt · RabbitMQ (amqplib) · cookie-parser

**Responsibilities:**
- Register & authenticate passengers
- Serve authenticated profile data
- Subscribe to the `ride-accepted` queue and hold long-poll connections until a captain accepts their ride

---

### 🚖 Captain Service `(port 3002)`

Manages **driver** accounts, their availability status, and surfaces incoming ride requests via long-polling.

**Stack:** Express 5 · Mongoose · JWT · bcrypt · RabbitMQ (amqplib) · cookie-parser

**Responsibilities:**
- Register & authenticate captains (drivers)
- Toggle availability status (available / unavailable)
- Subscribe to the `new-ride` queue and hold long-poll connections until a new ride is dispatched

---

### 🛣️ Ride Service `(port 3003)`

The core **ride orchestration** service. Creates ride documents and publishes events to RabbitMQ.

**Stack:** Express 4 · Mongoose · JWT · RabbitMQ (amqplib) · Axios · cookie-parser

**Responsibilities:**
- Create ride requests (validates user JWT)
- Publish `new-ride` events → Captain service listens
- Accept rides (validates captain JWT)
- Publish `ride-accepted` events → User service listens
- Update ride status in MongoDB

---

## 📡 API Reference

### 👤 User Endpoints `(via Gateway: /user/*)`

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/user/register` | Public | Register a new passenger |
| `POST` | `/user/login` | Public | Authenticate & receive JWT |
| `POST` | `/user/logout` | Public | Logout & blacklist token |
| `GET` | `/user/profile` | 🔒 User JWT | Get own profile |
| `GET` | `/user/accepted-ride` | 🔒 User JWT | Long-poll — wait for ride acceptance |

**Register body:**
```json
{ "name": "string", "email": "string", "password": "string" }
```

**Login body:**
```json
{ "email": "string", "password": "string" }
```

---

### 🚖 Captain Endpoints `(via Gateway: /captain/*)`

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/captain/register` | Public | Register a new captain |
| `POST` | `/captain/login` | Public | Authenticate & receive JWT |
| `POST` | `/captain/logout` | Public | Logout & blacklist token |
| `GET` | `/captain/profile` | 🔒 Captain JWT | Get own profile |
| `PATCH` | `/captain/toggle-availability` | 🔒 Captain JWT | Toggle available / unavailable |
| `GET` | `/captain/new-ride` | 🔒 Captain JWT | Long-poll — wait for a ride request |

---

### 🛣️ Ride Endpoints `(via Gateway: /ride/*)`

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/ride/create-ride` | 🔒 User JWT | Create a new ride request |
| `PUT` | `/ride/accept-ride?rideId=<id>` | 🔒 Captain JWT | Accept a pending ride |

**Create ride body:**
```json
{ "pickup": "string", "destination": "string" }
```

---

## 🔄 Workflows

### 🔐 User Registration & Login Flow

```
Client                    Gateway              User Service         MongoDB
  │                          │                      │                  │
  │── POST /user/register ──►│                      │                  │
  │                          │── proxy ────────────►│                  │
  │                          │                      │── hash password  │
  │                          │                      │── save user ────►│
  │                          │                      │◄─ saved ─────────│
  │                          │◄─ 201 + JWT ─────────│                  │
  │◄─ 201 + JWT + Cookie ────│                      │                  │
  │                          │                      │                  │
  │── POST /user/login ─────►│                      │                  │
  │                          │── proxy ────────────►│                  │
  │                          │                      │── find user ────►│
  │                          │                      │◄─ user doc ──────│
  │                          │                      │── bcrypt.compare │
  │                          │                      │── sign JWT       │
  │◄─ 200 + JWT + Cookie ────│◄─ 200 + token ───────│                  │
```

---

### 🚕 Ride Request Flow

```
Passenger Client    Gateway    Ride Service    RabbitMQ     Captain Service   Captain Client
      │                │            │              │               │                │
      │─ POST /ride/create-ride ───►│              │               │                │
      │                │            │── validate JWT              │                │
      │                │            │── save ride ─────────────►DB│               │
      │                │            │                              │               │
      │                │            │── publish ──────────────────►│               │
      │                │            │   "new-ride" queue           │               │
      │◄─ 201 Created ─│◄───────────│              │               │               │
      │                │            │              │               │               │
      │─ GET /user/accepted-ride ──►│              │               │               │
      │  (long-poll, waits...)      │              │               │               │
      │                │            │              │               │               │
      │                │            │              │          (captain online)      │
      │                │            │              │               │◄─ GET /captain/new-ride
      │                │            │              │               │   (long-poll) │
      │                │            │              │◄──────────────│  consuming    │
      │                │            │              │   "new-ride"  │               │
      │                │            │              │──────────────►│               │
      │                │            │              │               │── ride data ─►│
```

---

### ✅ Ride Acceptance Flow

```
Captain Client   Gateway    Ride Service    RabbitMQ    User Service    Passenger Client
      │              │            │              │             │                │
      │─ PUT /ride/accept-ride?rideId=xxx ──────►│             │                │
      │              │            │── validate Captain JWT     │                │
      │              │            │── update ride.status = "accepted"           │
      │              │            │── save to MongoDB          │                │
      │              │            │                            │                │
      │              │            │── publish ────────────────►│                │
      │              │            │   "ride-accepted" queue    │                │
      │◄─ 200 OK ────│◄───────────│              │             │                │
      │              │            │              │             │── resolve       │
      │              │            │              │             │   long-poll    │
      │              │            │              │             │── ride data ──►│
      │              │            │              │             │                │◄─ ride confirmed!
```

---

## 📨 Message Queues (RabbitMQ)

| Queue | Producer | Consumer | Payload |
|---|---|---|---|
| `new-ride` | Ride Service | Captain Service | `JSON.stringify(ride)` |
| `ride-accepted` | Ride Service | User Service | `JSON.stringify(ride)` |

Both queues are **asserted on use** (auto-created if not present) and use **manual acknowledgement** (`channel.ack`) to guarantee at-least-once delivery.

```
┌─────────────────────────────────────────────────┐
│              RabbitMQ Broker                    │
│                                                 │
│  ┌─────────────────────┐                        │
│  │  Queue: new-ride    │ ◄── Ride Service        │
│  │  (durable: false)   │ ──► Captain Service     │
│  └─────────────────────┘                        │
│                                                 │
│  ┌─────────────────────┐                        │
│  │ Queue: ride-accepted │ ◄── Ride Service       │
│  │  (durable: false)   │ ──► User Service        │
│  └─────────────────────┘                        │
└─────────────────────────────────────────────────┘
```

---

## 🔑 Environment Variables

Each service has its own `.env` file. Below are the expected keys:

### User & Captain Services
```env
PORT=3001               # or 3002 for captain
MONGO_URI=mongodb://localhost:27017/uber-users
JWT_SECRET=your_jwt_secret_here
RABBIT_URL=amqp://localhost
```

### Ride Service
```env
PORT=3003
MONGO_URI=mongodb://localhost:27017/uber-rides
JWT_SECRET=your_jwt_secret_here
RABBIT_URL=amqp://localhost
```

---

## 🚀 Getting Started

### Prerequisites

Ensure the following are installed and running:

| Dependency | Version | Download |
|---|---|---|
| ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white) | ≥ 18.x | [nodejs.org](https://nodejs.org) |
| ![MongoDB](https://img.shields.io/badge/-MongoDB-47A248?logo=mongodb&logoColor=white) | ≥ 6.x | [mongodb.com](https://www.mongodb.com) |
| ![RabbitMQ](https://img.shields.io/badge/-RabbitMQ-FF6600?logo=rabbitmq&logoColor=white) | ≥ 3.x | [rabbitmq.com](https://www.rabbitmq.com) |

### Installation & Running

Open **4 separate terminals** and run each service independently:

```bash
# Terminal 1 — API Gateway (port 3000)
cd gateway
npm install
npm run dev

# Terminal 2 — User Service (port 3001)
cd user
npm install
npm run dev

# Terminal 3 — Captain Service (port 3002)
cd captain
npm install
npm run dev

# Terminal 4 — Ride Service (port 3003)
cd ride
npm install
npm run dev
```

Once all 4 terminals show `running on port ...` and `Connected to RabbitMQ`, the system is live. All requests go through:

```
http://localhost:3000
```

---

## 🗂️ Project Structure

```
Uber - Micro-Services/
│
├── 📁 gateway/                   # API Gateway — reverse proxy
│   ├── app.js                    # Express proxy rules + server bootstrap
│   └── package.json
│
├── 📁 user/                      # User (Passenger) Service
│   ├── app.js                    # Express app setup + RabbitMQ init
│   ├── server.js                 # HTTP server entry point
│   ├── controllers/
│   │   └── user.controller.js    # register, login, logout, profile, acceptedRide
│   ├── routes/
│   │   └── user.router.js        # Route definitions with JSDoc
│   ├── models/
│   │   └── user.model.js         # Mongoose user schema
│   ├── middleware/
│   │   └── authMiddleware.js     # userAuth JWT middleware
│   ├── service/
│   │   └── rabbit.js             # RabbitMQ connect / publish / subscribe
│   ├── db/
│   │   └── db.js                 # MongoDB connection
│   └── .env
│
├── 📁 captain/                   # Captain (Driver) Service
│   ├── app.js                    # Express app setup + RabbitMQ init
│   ├── server.js                 # HTTP server entry point
│   ├── controllers/
│   │   └── captain.controller.js # register, login, logout, profile, toggleAvailability, waitForNewRide
│   ├── routes/
│   │   └── captain.router.js     # Route definitions with JSDoc
│   ├── models/
│   │   └── captain.model.js      # Mongoose captain schema
│   ├── middleware/
│   │   └── authMiddleware.js     # captainAuth JWT middleware
│   ├── service/
│   │   └── rabbit.js             # RabbitMQ connect / publish / subscribe
│   ├── db/
│   │   └── db.js                 # MongoDB connection
│   └── .env
│
├── 📁 ride/                      # Ride Service
│   ├── app.js                    # Express app setup + RabbitMQ init
│   ├── server.js                 # HTTP server entry point
│   ├── controllers/
│   │   └── ride.controller.js    # createRide, acceptRide
│   ├── routes/
│   │   └── ride.route.js         # Route definitions with JSDoc
│   ├── model/
│   │   └── ride.model.js         # Mongoose ride schema
│   ├── middleware/
│   │   └── auth.middleware.js    # userAuth + captainAuth JWT middleware
│   ├── service/
│   │   └── rabbit.js             # RabbitMQ connect / publish / subscribe
│   ├── db/
│   │   └── db.js                 # MongoDB connection
│   └── .env
│
└── README.md                     # 📖 You are here
```

---

<div align="center">

Built with ❤️ as a learning project to explore **microservices**, **event-driven architecture**, and **Node.js ES Modules** in a real-world scenario.

</div>
