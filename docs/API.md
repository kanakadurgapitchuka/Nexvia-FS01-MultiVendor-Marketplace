# API overview

All endpoints are prefixed with `/api`.

- `GET /health`
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `POST /vendors/apply`, `GET /vendors/me`, `PATCH /vendors/:id/status` (admin)
- `GET /products`, `GET /products/:id`, `POST /products` (vendor), `PATCH /products/:id`, `DELETE /products/:id`, `POST /products/upload-url`
- `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`
- `POST /orders/checkout`, `GET /orders/my`, `GET /orders/:id`, `PATCH /orders/:id/status` (vendor/admin), `POST /payments/razorpay/order`, `POST /payments/razorpay/verify`
- `POST /reviews`, `GET /products/:id/reviews`
- `POST /coupons/validate` (admin creates coupons via database/API extension)
- `GET /invoices/:orderId.pdf`
- `GET /admin/analytics`

Request and response shapes are validated in route handlers where applicable. Extend API documentation with OpenAPI/Swagger before final submission.
