# API Contract

## Auth
POST /api/v1/auth/register
POST /api/v1/auth/login

## Sellers
GET /api/v1/sellers
GET /api/v1/sellers/:id
GET /api/v1/sellers/:id/menus

## Menus
POST /api/v1/menus

## Orders
POST /api/v1/orders
GET /api/v1/orders
GET /api/v1/orders/:id
PUT /api/v1/orders/:id/status
