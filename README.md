# 🌾 e-Arthiya

![Landing Page](./docs/screenshots/landing.png)

### More Choices. Better Markets. Fairer Trade.

e-Arthiya is a transparent digital agricultural marketplace connecting **Farmers, Buyers, FPOs and Arthiyas** through one connected workflow.

Instead of trying to remove the existing agricultural ecosystem, e-Arthiya strengthens it by giving farmers greater visibility into **demand, aggregation, market opportunities and competing offers**.

> **The farmer creates the value. But doesn't always control the choice.**

---

## 🎯 The Problem

A farmer can successfully grow a crop and still be left asking:

- Who will buy it?
- At what price?
- When will they need it?
- Do I have another option?

The challenge is not simply the existence of an intermediary.

Agricultural markets also face:

- Fragmented supply
- Uncertain demand
- Weak price discovery
- Post-harvest and unsold-stock risk
- Limited visibility into alternative buyers
- Difficulty aggregating small quantities into buyer-ready supply

At the same time, Arthiyas and FPOs provide important services such as aggregation, liquidity, logistics, trust and buyer access.

### Our approach

**Don't remove the ecosystem. Connect it.**

e-Arthiya brings these actors together through:

```text
Supply
   ↓
Demand Discovery
   ↓
Matching
   ↓
Aggregation
   ↓
Offers / Auctions
   ↓
Allocation
   ↓
Commitment
   ↓
Payment
   ↓
Settlement
```

---

# 💡 Core Idea

A farmer can move from:

> **"I can supply."**

to:

> **"I have a buyer."**

while having greater visibility and choice throughout the process.

---

# 👥 Platform Roles

## 👨‍🌾 Farmer

Farmers can:

- List available produce
- Upload produce images
- Create future supply intents
- Discover market opportunities
- Participate in matched opportunities
- Track commitments
- Track payments

---

## 🛒 Buyer

Buyers can:

- Create procurement requirements
- Specify crop, quantity and quality
- Specify required timelines and locations
- Discover matching supply
- Participate in auctions
- Track allocations and commitments
- Track payments

---

## 🌾 FPO

FPOs focus on aggregation.

They can:

- Coordinate farmer supply
- Create supply pools
- Aggregate fragmented quantities
- Connect pooled supply with buyer demand
- Track commitments and settlements

### Example

```text
Farmer A → 6 quintal
Farmer B → 7 quintal
Farmer C → 7 quintal
                  ↓
            FPO Supply Pool
                  ↓
             20 quintal
                  ↓
          Buyer Requirement
```

---

## 🤝 Arthiya

Arthiyas remain an important part of the agricultural ecosystem.

They can:

- Discover supply and demand opportunities
- Facilitate market access
- Manage facilitated supply
- Participate in auction workflows
- Manage deals
- Track settlements

---

# 🖥️ Dashboards

## 🏠 Landing Page

The landing page introduces e-Arthiya and communicates the core proposition of connecting farmers, buyers, FPOs and Arthiyas.


---

## 👨‍🌾 Farmer Dashboard

The Farmer Dashboard provides a central view of:

- Available supply
- Future supply
- Market opportunities
- Auctions
- Commitments
- Payments

## 🛒 Buyer Dashboard

The Buyer Dashboard represents the demand side of the marketplace.

Buyers can create requirements, discover matching supply, participate in auctions and manage commitments.

Example:

```text
Crop       : Tomato
Quantity   : 20 quintal
Quality    : Grade A
Market     : Azadpur
Demand     : Spot
```

## 🌾 FPO Dashboard

The FPO Dashboard focuses on aggregation.

For example:

```text
6q + 7q + 7q
     ↓
   20q Pool
     ↓
Buyer-ready Supply
```

The FPO can manage farmers, supply pools, marketplace opportunities, commitments and settlements.

---

## 🤝 Arthiya Dashboard

The Arthiya Dashboard keeps traditional market facilitation within the digital ecosystem.

It provides access to:

- Supply
- Demand
- Opportunities
- Auctions
- Deals
- Settlements

---

# ⚙️ Technical Architecture

e-Arthiya uses a modular full-stack architecture.

```text
┌──────────────────────────────────────┐
│        React + Tailwind CSS          │
│             Frontend                 │
└──────────────────┬───────────────────┘
                   │
                REST API
                   │
┌──────────────────▼───────────────────┐
│         Node.js + Express            │
│       Controllers + Logic            │
└──────────────────┬───────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
┌─────────▼────────┐ ┌──────▼──────────┐
│  MongoDB Atlas   │ │ Supabase Storage│
│ Application Data │ │ Produce Images  │
└──────────────────┘ └─────────────────┘
```

### Frontend

- React
- Tailwind CSS
- React Router
- Vite

### Backend

- Node.js
- Express.js
- REST APIs
- Mongoose

### Database & Storage

- MongoDB Atlas
- Supabase Storage

### Authentication

- JWT
- bcrypt
- Role-based authorization
- Protected routes

### Blockchain Layer

- Solidity
- Hardhat
- Ethers.js

Blockchain is planned as a **selective trust layer for critical trade events**, rather than storing routine application data on-chain.

---

# 🔐 Authentication & Authorization

e-Arthiya uses JWT-based authentication with role-based access control.

Supported roles:

```text
Farmer
Buyer
FPO
Arthiya
Admin
```

Each role receives access to its relevant workflows and dashboard.

---

# 📦 Core Data Models

The backend represents the agricultural transaction lifecycle through dedicated models:

```text
User
ProduceLot
SupplyIntent
ProcurementRequest
SupplyPool
Allocation
Auction
Bid
ExternalOffer
PurchaseCommitment
PaymentTransaction
```

---

# 🌱 Supply Model

Farmers can represent two types of supply.

### Spot Supply

> "I have this produce available now."

### Future Supply

> "I can supply this crop in the future."

---

# 🛒 Demand Model

Buyers can represent:

### Spot Demand

> "I need this produce now."

### Forward Demand

> "I will need this quantity in the future."

This allows e-Arthiya to coordinate both immediate and future agricultural requirements.

---

# 🧺 Multi-Farmer Aggregation

One of the core workflows is converting fragmented supply into buyer-ready quantities.

For example:

```text
Farmer A       6q
Farmer B       7q
Farmer C       7q
                 ↓
             20q Tomato
                 ↓
           Supply Pool
                 ↓
          Buyer Requirement
```

This allows multiple farmers to collectively satisfy a larger buyer requirement.

---

# 🔨 Auctions & Offers

e-Arthiya supports competitive opportunities through:

- Platform bids
- External offers
- Farmer choice
- Final commitments

Example:

```text
Platform Bid       ₹2,250/q

External Offer     ₹2,350/q
                         ↓
                  Farmer Choice
                         ↓
                 Final Commitment
```

The objective is not simply to create another auction platform.

It is to make **alternative opportunities visible to the farmer**.

---

# 💰 Commitments & Payments

The platform models commitments separately from initial offers and matching.

A commitment can contain:

- Buyer
- Quantity
- Agreed price
- Commitment source
- Deposit percentage
- Deposit amount
- Commitment window
- Status
- Settlement information

Payment transactions can represent:

- Security deposits
- Balance payments
- Refunds
- Settlements

---

# ☁️ Produce Image Storage

Produce listings can contain images stored using **Supabase Storage**.

The image URL is associated with the corresponding produce listing in MongoDB.

---

# 🧪 Demo Dataset

The project includes a demo seed workflow for demonstrating an interconnected marketplace.

### Demo actors

```text
Farmer   → Swae
Buyer    → Gyanesh
Arthiya  → Mahesh Traders
FPO      → Rupa FPO
```

Additional farmers are included to demonstrate aggregation.

### Demo crops

```text
Tomato
Potato
Onion
Wheat
```

### Demonstrated workflows

- Multi-farmer Tomato aggregation
- Buyer demand
- Supply pools
- Allocation
- Potato auction
- Platform bids
- External offers
- Commitments
- Future supply
- Forward demand
- Payment records

---

# 🔄 Example End-to-End Flow

```text
        FARMERS
     6q + 7q + 7q
           │
           ▼
      ┌──────────┐
      │   FPO    │
      │ 20q Pool │
      └────┬─────┘
           │
           ▼
      ┌──────────┐
      │  BUYER   │
      │ Needs 20q│
      └────┬─────┘
           │
           ▼
     Matching / Offers
           │
           ▼
    Farmer Choice
           │
           ▼
      Commitment
           │
           ▼
    Payment / Settlement
```

---

# 🛠️ Project Structure

```text
e-arthiya/
│
├── client/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── assets/
│       ├── components/
│       ├── layouts/
│       ├── lib/
│       ├── pages/
│       ├── App.jsx
│       └── main.jsx
│
├── server/
│   └── src/
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── lib/
│       ├── scripts/
│       └── server.js
│
└── README.md
```

---

# 🚀 Running Locally

## 1. Clone the repository

```bash
git clone <YOUR-GITHUB-REPOSITORY-URL>
cd e-arthiya
```

## 2. Install frontend dependencies

```bash
cd client
npm install
```

## 3. Start frontend

```bash
npm run dev
```

## 4. Install backend dependencies

Open another terminal:

```bash
cd server
npm install
```

## 5. Configure environment variables

Add the required environment variables to your `.env` file.

**Never commit real credentials, API keys or database passwords to GitHub.**

## 6. Start backend

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

Frontend:

```text
http://localhost:5173
```

---

# 📌 MVP Status

### ✅ Implemented

- Role-based authentication
- Farmer dashboard and workflows
- Buyer dashboard and workflows
- FPO dashboard and workflows
- Arthiya dashboard and workflows
- Produce listings
- Produce image uploads
- Supply intents
- Procurement requests
- Supply pools
- Allocations
- Auctions
- Bids
- External offers
- Purchase commitments
- Payment transaction records
- Demo data seeding
- Role-specific APIs

### 🔜 Next Implementation Layer

- Complete end-to-end trade execution
- Deeper automated matching
- Complete commitment lifecycle
- Payment gateway integration
- Recovery and re-matching workflows
- Production-grade verification
- Selective blockchain verification
- Broader deployment and scaling

---

# 🎯 USP

e-Arthiya is built around five principles:

### CHOICE
Give farmers visibility into multiple opportunities.

### DEMAND-FIRST
Connect supply with actual buyer requirements.

### AGGREGATION
Turn fragmented supply into buyer-ready quantities.

### EXISTING ECOSYSTEM
Keep FPOs and Arthiyas valuable participants.

### TRACEABLE TRADE
Maintain structured records across matching, commitment, payment and settlement.

---

# 🌾 Vision

> **The farmer creates the value. But doesn't always control the choice.**

e-Arthiya is built to change that.

## More Choices. Better Markets. Fairer Trade.

---

### Built for IEEE WIE ILS Hackathon 2026
**Team SWAE**
