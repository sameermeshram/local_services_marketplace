# Authentication API Examples

Base URL: `http://localhost:5000`

All responses use this shape:

```json
{
  "success": true,
  "message": "",
  "data": {},
  "errors": null
}
```

Error responses use this shape:

```json
{
  "success": false,
  "message": "",
  "data": null,
  "errors": []
}
```

## Register Customer

`POST /api/auth/register`

```json
{
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "phone": "+15551234567",
  "pincode": "110001",
  "password": "Password@123",
  "role": "customer",
  "termsAccepted": true
}
```

## Register Provider

`POST /api/auth/register`

```json
{
  "name": "Marcus Chen",
  "email": "marcus@example.com",
  "phone": "+15557654321",
  "pincode": "110001",
  "password": "Password@123",
  "role": "provider",
  "serviceType": "plumbing",
  "termsAccepted": true
}
```

## Login

`POST /api/auth/login`

```json
{
  "email": "alex@example.com",
  "password": "Password@123"
}
```

## Logout

`POST /api/auth/logout`

Requires `accessToken` cookie or `Authorization: Bearer <accessToken>`.

## Refresh

`POST /api/auth/refresh`

Requires `refreshToken` httpOnly cookie.

## Me

`GET /api/auth/me`

Requires `accessToken` cookie or `Authorization: Bearer <accessToken>`.

