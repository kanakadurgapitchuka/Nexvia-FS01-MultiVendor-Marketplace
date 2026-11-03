# Nexvia FS01 – Software Testing Plan and Report

## 1. Introduction

This document describes the testing strategy for the Nexvia FS01 Multi-Vendor Marketplace application.

The objective is to verify application functionality, security, data validation, integrations and major user workflows.

## 2. Testing Scope

The testing scope includes:

- Authentication and authorization
- Vendor management
- Product management
- Shopping cart
- Checkout and order processing
- Payment integration
- Order management
- Product reviews and ratings
- Security controls
- External service integrations

## 3. Functional Test Cases

| ID | Module | Test Scenario | Expected Result |
|---|---|---|---|
| TC01 | Auth | Register with valid details | Account created |
| TC02 | Auth | Register with duplicate email | Duplicate rejected |
| TC03 | Auth | Login with invalid password | Access denied |
| TC04 | Auth | Check JWT expiry | Expired token rejected |
| TC05 | Vendor | Apply for vendor status | Application submitted |
| TC06 | Vendor | Admin approval | Vendor status updated |
| TC07 | Products | Create valid product | Product created |
| TC08 | Products | Unauthorized product update | Access denied |
| TC09 | Products | Product image upload | Image uploaded to S3 |
| TC10 | Search | Search for products | Matching products returned |
| TC11 | Cart | Add product to cart | Cart updated |
| TC12 | Cart | Enter invalid quantity | Request rejected |
| TC13 | Checkout | Verify server-side totals | Correct total calculated |
| TC14 | Checkout | Check product stock | Insufficient stock rejected |
| TC15 | Payment | Verify Razorpay payment | Valid payment accepted |
| TC16 | Payment | Invalid signature | Payment rejected |
| TC17 | Orders | Retrieve customer orders | Customer's orders displayed |
| TC18 | Reviews | Submit eligible review | Review saved |
| TC19 | Reviews | Submit invalid rating | Request rejected |
| TC20 | Admin | Retrieve analytics | Dashboard data displayed |

## 4. Integration Testing

The following integrations are included in the project testing scope:

| Integration | Test Objective |
|---|---|
| MongoDB Atlas | Database connectivity and data persistence |
| Redis | Cache connectivity and fallback behavior |
| Elasticsearch | Product indexing and search |
| AWS S3 | Product image upload and retrieval |
| Razorpay | Test payment creation and signature verification |
| Render | Backend deployment and API availability |
| Vercel | Frontend deployment and application access |

## 5. Security Testing

- Duplicate account registration prevention.
- JWT authentication and expiry validation.
- Role-based access control.
- Server-side price and ownership validation.
- Payment signature verification.
- CORS origin restrictions.
- API rate limiting.
- Environment secret protection.
- Request payload validation.

## 6. Review and Rating Testing

Review submission is restricted to authenticated customers with a paid and delivered order containing the reviewed product.

Test scenarios:
- Valid review submission.
- Invalid order ID.
- Wrong product/order combination.
- Rating outside the 1–5 range.
- Review retrieval on product details page.
- Duplicate review prevention.

## 7. Manual Verification Results

The following features have been manually verified during project development:

| Feature | Observed Result |
|---|---|
| Backend deployment | Successful |
| Frontend deployment | Successful |
| MongoDB connection | Successful |
| Elasticsearch connection | Successful |
| Redis connection | Successful |
| Product search | Verified |
| Product details page | Verified |
| Razorpay test payment | Verified |
| Order status and admin revenue update | Verified |
| Invoice PDF download | Verified |
| Review submission | Successful |
| Review display | Successful |

Other test scenarios should be marked complete only after execution and verification.

## 8. Known Limitations and Future Testing

- Complete automated test suite.
- Load and performance testing with documented measurements.
- Additional security testing.
- Elasticsearch and Redis failure-mode testing.
- Production payment settlement verification.
- OpenAPI/Swagger API contract testing.

## 9. Conclusion

The project has undergone functional and integration verification of its major marketplace workflows.

Further automated, performance and security testing can improve reliability and production readiness.
