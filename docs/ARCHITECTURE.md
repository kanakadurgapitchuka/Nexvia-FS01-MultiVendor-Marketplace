# Architecture

React SPA -> Express REST API -> MongoDB Atlas (source of truth). Elasticsearch is a searchable product index; MongoDB remains authoritative. Redis stores short-lived cart/session cache. Images are uploaded directly to S3 using short-lived presigned URLs. Razorpay test mode creates payment orders and verifies signatures; marketplace split settlements must use an approved Route/Connect product and onboarded vendors.

## Roles
- customer: browse, cart, checkout, view own orders, review delivered purchases
- vendor: apply for vendor status, manage own products, view own order items
- admin: approve vendors, manage catalog/coupons, view analytics

## Security invariants
- Never trust prices, commissions, roles, or ownership sent by the client.
- Calculate totals on the server from database product prices.
- Verify payment signatures on the server and verify payment status before marking orders paid.
- Keep cloud secrets in environment variables, never in React env vars.
- Restrict image content types and size; production should add malware scanning and rate limiting.
