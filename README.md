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
- [API Reference](#-api-reference)
- [Workflows](#-workflows)
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
| **Framework** | ![Express](https://img.shields.io/badge/-Express%205-000000?logo=express&logoColor=white) | HTTP server and routing |
| **Database** | ![MongoDB](https://img.shields.io/badge/-MongoDB-47A248?logo=mongodb&logoColor=white) | Document store per service |
| **ODM** | ![Mongoose](https://img.shields.io/badge/-Mongoose%209-880000?logoColor=white) | Schema modeling and validation |
| **Messaging** | ![RabbitMQ](https://img.shields.io/badge/-RabbitMQ-FF6600?logo=rabbitmq&logoColor=white) | Async inter-service events (AMQP) |
| **Auth** | ![JWT](https://img.shields.io/badge/-JSON%20Web%20Token-000000?logo=jsonwebtokens&logoColor=white) | Stateless authentication |
| **Password** | ![bcrypt](https://img.shields.io/badge/-bcrypt-4A4A4A?logoColor=white) | Password hashing |
| **Proxy** | `express-http-proxy` | Gateway reverse proxy |
| **HTTP Client** | ![Axios](https://img.shields.io/badge/-Axios-5A29E4?logo=axios&logoColor=white) | Inter-service HTTP calls (Ride) |
| **Dev Server** | ![nodemon](https://img.shields.io/badge/-nodemon-76D04B?logo=nodemon&logoColor=white) | Hot-reload during development |
| **Modules** | ES Modules (`import`/`export`) | Native module system |

---

## 🏗️ Architecture

```mermaid
flowchart TD
    Client(["Client\nBrowser / App"])
    GW["API Gateway :3000\nexpress-http-proxy"]
    US["User Service :3001"]
    CS["Captain Service :3002"]
    RS["Ride Service :3003"]
    UDB[("MongoDB\nUsers")]
    CDB[("MongoDB\nCaptains")]
    RDB[("MongoDB\nRides")]
    MQ["RabbitMQ Broker\nnew-ride | ride-accepted"]

    Client -->|"HTTP :3000"| GW
    GW -->|"/user/*"| US
    GW -->|"/captain/*"| CS
    GW -->|"/ride/*"| RS
    US --- UDB
    CS --- CDB
    RS --- RDB
    RS -->|"publish: new-ride"| MQ
    RS -->|"publish: ride-accepted"| MQ
    MQ -->|"consume: new-ride"| CS
    MQ -->|"consume: ride-accepted"| US
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
- Register and authenticate passengers
- Serve authenticated profile data
- Subscribe to the `ride-accepted` queue and hold long-poll connections until a captain accepts a ride

---

### 🚖 Captain Service `(port 3002)`

Manages **driver** accounts, their availability status, and surfaces incoming ride requests via long-polling.

**Stack:** Express 5 · Mongoose · JWT · bcrypt · RabbitMQ (amqplib) · cookie-parser

**Responsibilities:**
- Register and authenticate captains (drivers)
- Toggle availability status (available / unavailable)
- Subscribe to the `new-ride` queue and hold long-poll connections until a new ride is dispatched

---

### 🛣️ Ride Service `(port 3003)`

The core **ride orchestration** service. Creates ride documents and publishes events to RabbitMQ.

**Stack:** Express 4 · Mongoose · JWT · RabbitMQ (amqplib) · Axios · cookie-parser

**Responsibilities:**
- Create ride requests (validates user JWT)
- Publish `new-ride` events so Captain service can dispatch
- Accept rides (validates captain JWT)
- Publish `ride-accepted` events so User service can resolve long-polls
- Update ride status in MongoDB

---

## 📡 API Reference

### 👤 User Endpoints `(via Gateway: /user/*)`

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/user/register` | Public | Register a new passenger |
| `POST` | `/user/login` | Public | Authenticate and receive JWT |
| `POST` | `/user/logout` | Public | Logout and blacklist token |
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
| `POST` | `/captain/login` | Public | Authenticate and receive JWT |
| `POST` | `/captain/logout` | Public | Logout and blacklist token |
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

### 🔐 User Registration and Login Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant US as User Service
    participant DB as MongoDB

    C->>GW: POST /user/register
    GW->>US: proxy request
    US->>US: hash password with bcrypt
    US->>DB: save user document
    DB-->>US: saved
    US-->>GW: 201 + signed JWT
    GW-->>C: 201 + JWT + Set-Cookie

    C->>GW: POST /user/login
    GW->>US: proxy request
    US->>DB: find user by email
    DB-->>US: user document
    US->>US: bcrypt.compare password
    US->>US: sign JWT
    US-->>GW: 200 + token
    GW-->>C: 200 + JWT + Set-Cookie
```

---

### 🚕 Ride Request Flow

```mermaid
sequenceDiagram
    participant P as Passenger
    participant GW as API Gateway
    participant RS as Ride Service
    participant MQ as RabbitMQ
    participant CS as Captain Service
    participant Cap as Captain

    P->>GW: POST /ride/create-ride
    GW->>RS: proxy request
    RS->>RS: validate User JWT
    RS->>RS: save ride to MongoDB
    RS->>MQ: publish to new-ride queue
    RS-->>GW: 201 Created
    GW-->>P: 201 Created

    P->>GW: GET /user/accepted-ride
    GW->>CS: long-poll begins, passenger waits...

    Cap->>GW: GET /captain/new-ride
    GW->>CS: proxy request
    CS->>MQ: consume new-ride queue
    MQ-->>CS: ride payload delivered
    CS-->>Cap: ride data returned
```

---

### 🚗 Ride Acceptance Flow

```mermaid
sequenceDiagram
    participant Cap as Captain
    participant GW as API Gateway
    participant RS as Ride Service
    participant MQ as RabbitMQ
    participant US as User Service
    participant P as Passenger

    Cap->>GW: PUT /ride/accept-ride?rideId=xxx
    GW->>RS: proxy request
    RS->>RS: validate Captain JWT
    RS->>RS: set ride.status = accepted
    RS->>RS: save updated ride to MongoDB
    RS->>MQ: publish to ride-accepted queue
    RS-->>GW: 200 OK
    GW-->>Cap: 200 OK

    MQ-->>US: ride-accepted event consumed
    US-->>P: long-poll resolves with ride data
```

---

## 📨 Message Queues (RabbitMQ)

| Queue | Producer | Consumer | Payload |
|---|---|---|---|
| `new-ride` | Ride Service | Captain Service | `JSON.stringify(ride)` |
| `ride-accepted` | Ride Service | User Service | `JSON.stringify(ride)` |

Both queues are **asserted on use** (auto-created if not present) and use **manual acknowledgement** (`channel.ack`) for at-least-once delivery.

```mermaid
flowchart LR
    RS["Ride Service"]
    NRQ["Queue: new-ride"]
    RAQ["Queue: ride-accepted"]
    CS["Captain Service"]
    US["User Service"]

    RS -->|"publish"| NRQ
    RS -->|"publish"| RAQ
    NRQ -->|"consume"| CS
    RAQ -->|"consume"| US
```

---

## 🔑 Environment Variables

Each service has its own `.env` file. Below are the expected keys:

### User and Captain Services
```env
PORT=3001
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

| Dependency | Version | Download |
|---|---|---|
| ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white) | >= 18.x | [nodejs.org](https://nodejs.org) |
| ![MongoDB](https://img.shields.io/badge/-MongoDB-47A248?logo=mongodb&logoColor=white) | >= 6.x | [mongodb.com](https://www.mongodb.com) |
| ![RabbitMQ](https://img.shields.io/badge/-RabbitMQ-FF6600?logo=rabbitmq&logoColor=white) | >= 3.x | [rabbitmq.com](https://www.rabbitmq.com) |

### Installation and Running

Open **4 separate terminals** and run each service:

```bash
# Terminal 1 - API Gateway (port 3000)
cd gateway && npm install && npm run dev

# Terminal 2 - User Service (port 3001)
cd user && npm install && npm run dev

# Terminal 3 - Captain Service (port 3002)
cd captain && npm install && npm run dev

# Terminal 4 - Ride Service (port 3003)
cd ride && npm install && npm run dev
```

All requests flow through the single gateway entry point:

```
http://localhost:3000
```

---

## 🗂️ Project Structure

```
Uber - Micro-Services/
|
+-- gateway/
|   +-- app.js                       Express proxy rules + server entry
|   +-- package.json
|
+-- user/
|   +-- app.js                       Express setup + RabbitMQ init
|   +-- server.js                    HTTP server entry point
|   +-- controllers/
|   |   +-- user.controller.js       register, login, logout, profile, acceptedRide
|   +-- routes/
|   |   +-- user.router.js           Route definitions
|   +-- models/
|   |   +-- user.model.js            Mongoose user schema
|   +-- middleware/
|   |   +-- authMiddleware.js        userAuth JWT middleware
|   +-- service/
|   |   +-- rabbit.js                RabbitMQ connect / publish / subscribe
|   +-- db/db.js                     MongoDB connection
|   +-- .env
|
+-- captain/
|   +-- app.js                       Express setup + RabbitMQ init
|   +-- server.js                    HTTP server entry point
|   +-- controllers/
|   |   +-- captain.controller.js    register, login, logout, profile, toggleAvailability, waitForNewRide
|   +-- routes/
|   |   +-- captain.router.js        Route definitions
|   +-- models/
|   |   +-- captain.model.js         Mongoose captain schema
|   +-- middleware/
|   |   +-- authMiddleware.js        captainAuth JWT middleware
|   +-- service/
|   |   +-- rabbit.js                RabbitMQ connect / publish / subscribe
|   +-- db/db.js                     MongoDB connection
|   +-- .env
|
+-- ride/
|   +-- app.js                       Express setup + RabbitMQ init
|   +-- server.js                    HTTP server entry point
|   +-- controllers/
|   |   +-- ride.controller.js       createRide, acceptRide
|   +-- routes/
|   |   +-- ride.route.js            Route definitions
|   +-- model/
|   |   +-- ride.model.js            Mongoose ride schema
|   +-- middleware/
|   |   +-- auth.middleware.js       userAuth + captainAuth JWT middleware
|   +-- service/
|   |   +-- rabbit.js                RabbitMQ connect / publish / subscribe
|   +-- db/db.js                     MongoDB connection
|   +-- .env
|
+-- README.md
```

---

<div align="center">

Built with ❤️ as a learning project to explore **microservices**, **event-driven architecture**, and **Node.js ES Modules**.

</div>
