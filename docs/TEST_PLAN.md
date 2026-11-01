# Test plan

- Auth: duplicate email, invalid password, JWT expiry, role access checks.
- Vendors: apply, admin approval, only approved vendor can publish products.
- Products: validation, ownership checks, image upload URL, search fallback if Elasticsearch unavailable.
- Cart: invalid quantity, unavailable product, Redis unavailable fallback.
- Checkout: server-side totals, stock checks, coupon validation, duplicate checkout protection.
- Payments: invalid signature rejected; order remains unpaid until verified.
- Orders: invalid lifecycle transitions rejected; customer cannot read another customer's order.
- Reviews: one review per delivered purchase, rating range 1–5.
- Security: no secrets in frontend bundle; CORS allowlist; payload validation and rate limiting.
- Manual integration tests: S3 upload, Elasticsearch indexing, Redis caching, Razorpay test payment.
