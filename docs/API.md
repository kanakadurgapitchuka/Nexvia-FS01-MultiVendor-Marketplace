# Nexvia FS01 – API Documentation

## 1. API Overview

The Nexvia FS01 Multi-Vendor Marketplace backend provides RESTful APIs using Node.js and Express.js.

**Base URL (Production):**

`https://nexvia-fs01-multivendor-marketplace.onrender.com/api`

**Local Development:**

`http://localhost:5000/api`

All endpoints are prefixed with `/api`.

## 2. Authentication APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Authenticate a user |
| GET | `/auth/me` | Get authenticated user details |

## 3. Vendor APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/vendors/apply` | Apply for vendor status |
| GET | `/vendors/me` | Get current vendor details |
| PATCH | `/vendors/:id/status` | Update vendor status (Admin) |

## 4. Product APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | Retrieve products |
| GET | `/products/:id` | Retrieve product details |
| POST | `/products` | Create a product (Vendor) |
| PATCH | `/products/:id` | Update a product |
| DELETE | `/products/:id` | Delete a product |
| POST | `/products/upload-url` | Generate an S3 upload URL |
| GET | `/products/:id/reviews` | Retrieve product reviews |

## 5. Cart APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/cart` | Retrieve shopping cart |
| POST | `/cart/items` | Add an item |
| PATCH | `/cart/items/:productId` | Update item quantity |
| DELETE | `/cart/items/:productId` | Remove an item |

## 6. Order APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders/checkout` | Create an order |
| GET | `/orders/my` | Retrieve customer's orders |
| GET | `/orders/:id` | Retrieve order details |
| PATCH | `/orders/:id/status` | Update order status (Vendor/Admin) |

## 7. Payment APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/payments/razorpay/order` | Create Razorpay payment order |
| POST | `/payments/razorpay/verify` | Verify payment signature |

Payments are processed through Razorpay. The backend verifies payment signatures before updating payment status.

## 8. Review APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/reviews` | Submit a product review |
| GET | `/products/:id/reviews` | Retrieve product reviews |

Review submission requires an authenticated customer with a paid and delivered order containing the reviewed product. Ratings must be between 1 and 5.

## 9. Coupon APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/coupons/validate` | Validate a coupon |

Coupon administration is handled through the existing admin/database implementation.

## 10. Invoice APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/invoices/:orderId.pdf` | Download order invoice PDF |

## 11. Admin APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/analytics` | Retrieve marketplace analytics |

## 12. Health Check API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check backend API availability |

Successful response:

```json
{
  "ok": true,
  "service": "nexvia-fs01-api",
  "time": "ISO_TIMESTAMP"
}
```

## 13. Security and Authorization

- Protected endpoints require authentication.
- Role-based authorization restricts vendor and admin operations.
- Server-side validation is applied to incoming requests where implemented.
- Payment signatures are verified on the backend.
- Product prices and ownership are validated server-side.
- Rate limiting and security headers are configured.

## 14. Error Handling

The API uses HTTP status codes to communicate request results.

| Status | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 400 | Invalid request |
| 401 | Authentication required |
| 403 | Access denied |
| 404 | Resource not found |
| 409 | Duplicate value |
| 500 | Internal server error |

**Note:** This document summarizes the existing API routes. Exact request/response schemas, validation rules and OpenAPI/Swagger specifications can be added as a future documentation enhancement.
