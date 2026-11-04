# Nexvia FS-01 — Multi-Vendor E-Commerce Marketplace

Full-stack project scaffold based on the assigned requirements: React, Node.js/Express, MongoDB, Elasticsearch, Redis, AWS S3, and Razorpay test mode.

## Important status
This repository provides an integrated starter implementation and service adapters. Before calling it production-ready, configure credentials, test each integration, add stronger operational controls, and review payment/marketplace compliance. Razorpay Route/vendor settlements require account/product eligibility and activation by Razorpay; do not assume a normal payment account can split funds automatically.

## Live Demo

- Frontend: https://nexvia-fs-01-multi-vendor-marketpla.vercel.app/
- Backend API: https://nexvia-fs01-multivendor-marketplace.onrender.com
- API Health Check: https://nexvia-fs01-multivendor-marketplace.onrender.com/api/health
- 
## Requirements
- Node.js 20+ and npm
- MongoDB Atlas URI
- Redis (local or hosted)
- Elasticsearch 8.x (local Docker or hosted)
- AWS S3 bucket + IAM credentials for uploads
- Razorpay test account credentials

## Run locally
1. Copy `server/.env.example` to `server/.env` and fill values.
2. Copy `client/.env.example` to `client/.env`.
3. Start services (optional local Elasticsearch + Redis): `docker compose up -d`
4. Backend: `cd server && npm install && npm run dev`
5. Frontend in another terminal: `cd client && npm install && npm run dev`
6. Open the Vite URL printed by the frontend. API health: `http://localhost:5000/api/health`.

MongoDB Atlas must allow your IP address and use a database user. Never commit `.env` files or cloud credentials.

## Seed an admin
Register a user normally, then update that user's `role` to `admin` in MongoDB Atlas for local development. Do not expose public admin role assignment in production.

## Project structure
- `server/src`: Express API, models, middleware, integrations, routes
- `client/src`: React storefront and role dashboards
- `docs`: architecture, API notes, test plan, presentation outline

## Current feature coverage
- JWT register/login and role-based authorization
- Vendor onboarding, product CRUD, S3 signed uploads
- MongoDB product catalog and Elasticsearch search adapter
- Redis cart caching with MongoDB fallback
- Cart, checkout/order lifecycle, Razorpay order creation and signature verification
- Commission calculation, reviews, coupon validation, PDF invoice endpoint
- Admin analytics endpoint, health endpoint
- Docker compose for Redis + Elasticsearch
- Basic React store/login/cart/vendor/admin UI

Some capabilities require external account setup and end-to-end testing. Payment capture, vendor settlements, email notifications, and deployment depend on configured provider accounts and operational decisions.
