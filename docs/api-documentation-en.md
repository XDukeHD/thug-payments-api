# Thug Payments API Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Credit Card Payments](#credit-card-payments)
   - [PIX Payments](#pix-payments)
   - [PagBank Checkout](#pagbank-checkout)
   - [Status Management](#status-management)
   - [User-specific Payments](#user-specific-payments)
4. [Webhooks](#webhooks)
5. [Error Handling](#error-handling)
6. [Status Codes](#status-codes)
7. [Example Requests](#example-requests)

## Introduction

Thug Payments API is a robust payment processing system built on top of PagBank's infrastructure. This API allows you to process payments, track their statuses, and manage payment records efficiently.

### Base URL

```
http://your-domain.com/api/payments
```

Replace `your-domain.com` with your actual domain or IP address and port (e.g., `localhost:3000` or `eufantasmabaixofrio.com`)

## Authentication

All API endpoints (except webhooks) require authentication using a system key, which is passed via the `x-system-key` HTTP header.

```
x-system-key: your_secure_system_key_here
```

The system key is defined in your `config.json` file. 

Authentication failure will result in a 401 Unauthorized response:

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing system key"
}
```

## API Endpoints

### Credit Card Payments

#### Create a Credit Card Payment

Creates a new payment using credit card payment method.

**Endpoint:** `POST /credit-card`

**Request Headers:**
- Content-Type: application/json
- x-system-key: your_secure_system_key_here

**Request Body:**
```json
{
  "amount": 100.50,
  "description": "Product purchase",
  "customerName": "John Smith",
  "customerEmail": "john@example.com",
  "customerDocument": "123.456.789-01",
  "customerUserId": "user123",
  "card": {
    "number": "4111111111111111",
    "expMonth": "12",
    "expYear": "2025",
    "securityCode": "123",
    "holderName": "JOHN SMITH"
  },
  "installments": 1
}
```

**Required Fields:**
- `amount`: Payment amount (numeric, greater than 0)
- `customerUserId`: Unique identifier for the customer in your system
- `card`: Credit card information object with all required fields

**Optional Fields:**
- `description`: Description of the payment
- `customerName`: Customer's full name
- `customerEmail`: Customer's email address
- `customerDocument`: Customer's tax ID document (CPF/CNPJ)
- `installments`: Number of installments (default: 1)

**Response Example (201 Created):**
```json
{
  "success": true,
  "payment": {
    "referenceId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 100.50,
    "status": "PENDING",
    "chargeId": "CHARGE_123456789",
    "receiptUrl": "https://sandbox.api.pagseguro.com/charges/CHARGE_123456789/receipt"
  }
}
```

### PIX Payments

#### Create a PIX Payment

Creates a new PIX payment.

**Endpoint:** `POST /pix`

**Request Headers:**
- Content-Type: application/json
- x-system-key: your_secure_system_key_here

**Request Body:**
```json
{
  "amount": 100.50,
  "description": "Product purchase",
  "customerName": "John Smith",
  "customerEmail": "john@example.com",
  "customerDocument": "123.456.789-01",
  "customerUserId": "user123",
  "expirationHours": 24
}
```

**Required Fields:**
- `amount`: Payment amount (numeric, greater than 0)
- `customerUserId`: Unique identifier for the customer in your system

**Optional Fields:**
- `description`: Description of the payment
- `customerName`: Customer's full name
- `customerEmail`: Customer's email address
- `customerDocument`: Customer's tax ID document (CPF/CNPJ)
- `expirationHours`: Hours until the PIX expires (defaults to 24)

**Response Example (201 Created):**
```json
{
  "success": true,
  "payment": {
    "referenceId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 100.50,
    "status": "PENDING",
    "orderId": "ORDER_123456789",
    "pix": {
      "qrCode": "00020101021226850014br.gov.bcb.pix2563api-h.pagseguro.com/pix/v2/...",
      "qrCodeImage": "https://sandbox.api.pagseguro.com/qrcode/QRCO_123456789/png",
      "copyPaste": "00020101021226850014br.gov.bcb.pix2563...",
      "expirationDate": "2025-05-13T01:57:53.000-03:00"
    }
  }
}
```

### PagBank Checkout

#### Create a PagBank Checkout Session

Creates a checkout session that redirects the customer to PagBank's payment page with multiple payment options.

**Endpoint:** `POST /checkout`

**Request Headers:**
- Content-Type: application/json
- x-system-key: your_secure_system_key_here

**Request Body:**
```json
{
  "amount": 100.50,
  "description": "Product purchase",
  "customerName": "John Smith",
  "customerEmail": "john@example.com",
  "customerDocument": "123.456.789-01",
  "customerUserId": "user123",
  "enabledTypes": ["CREDIT_CARD", "DEBIT_CARD", "BOLETO", "PIX"],
  "defaultType": "CREDIT_CARD",
  "expiresAt": "2025-05-13T23:59:59-03:00",
  "redirectUrl": "https://your-store.com/payment/confirmation"
}
```

**Required Fields:**
- `amount`: Payment amount (numeric, greater than 0)
- `customerUserId`: Unique identifier for the customer in your system

**Optional Fields:**
- `description`: Description of the payment
- `customerName`: Customer's full name
- `customerEmail`: Customer's email address
- `customerDocument`: Customer's tax ID document (CPF/CNPJ)
- `enabledTypes`: Array of enabled payment methods (defaults to all available methods)
- `defaultType`: Default selected payment method (defaults to "CREDIT_CARD")
- `expiresAt`: ISO date for checkout expiration (defaults to 24 hours from creation)
- `redirectUrl`: URL to redirect after payment (defaults to the URL configured in your config.json)

**Response Example (201 Created):**
```json
{
  "success": true,
  "payment": {
    "referenceId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 100.50,
    "status": "PENDING",
    "checkoutId": "CHECKOUT_123456789",
    "checkoutUrl": "https://sandbox.pagseguro.com.br/checkout/123456789"
  }
}
```

### Payment Status

#### Get Payment Status

Check the status of a specific payment.

**Endpoint:** `GET /status/:referenceId`

**Request Headers:**
- x-system-key: your_secure_system_key_here

**Path Parameters:**
- `referenceId`: The reference ID returned when the payment was created

**Response Example (200 OK):**
```json
{
  "success": true,
  "payment": {
    "referenceId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 100.50,
    "description": "Product purchase",
    "status": "PAID",
    "statusMessage": "PAID",
    "customerName": "John Smith",
    "customerEmail": "john@example.com",
    "customerDocument": "123.456.789-01",
    "customerUserId": "user123",
    "paymentMethod": "CREDIT_CARD",
    "paymentUrl": "https://sandbox.api.pagseguro.com/charges/CHARGE_123456789/receipt",
    "createdAt": "2025-05-11T21:09:00.000Z",
    "updatedAt": "2025-05-11T21:15:00.000Z"
  }
}
```

#### Get All Payments

Retrieve all payment records with pagination.

**Endpoint:** `GET /all`

**Request Headers:**
- x-system-key: your_secure_system_key_here

**Query Parameters:**
- `limit`: Maximum number of records to return (default: 100)
- `offset`: Number of records to skip (default: 0)

**Response Example (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "payments": [
    {
      "referenceId": "550e8400-e29b-41d4-a716-446655440000",
      "amount": 100.50,
      "description": "Product purchase",
      "status": "PAID",
      "customerName": "John Smith",
      "customerEmail": "john@example.com",
      "customerDocument": "123.456.789-01",
      "customerUserId": "user123",
      "paymentMethod": "CREDIT_CARD",
      "paymentUrl": "https://sandbox.api.pagseguro.com/charges/CHARGE_123456789/receipt",
      "createdAt": "2025-05-11T21:09:00.000Z",
      "updatedAt": "2025-05-11T21:15:00.000Z"
    },
    {
      "referenceId": "660e8400-e29b-41d4-a716-446655440001",
      "amount": 200.75,
      "description": "Service fee",
      "status": "PENDING",
      "customerName": "Jane Doe",
      "customerEmail": "jane@example.com",
      "customerDocument": "234.567.890-12",
      "customerUserId": "user456",
      "paymentMethod": "PIX",
      "paymentUrl": "https://sandbox.api.pagseguro.com/qrcode/QRCO_987654321/png",
      "createdAt": "2025-05-11T22:30:00.000Z",
      "updatedAt": "2025-05-11T22:30:00.000Z"
    }
  ]
}
```

#### Get Payments by Status

Retrieve payment records filtered by status.

**Endpoint:** `GET /status/filter/:status`

**Request Headers:**
- x-system-key: your_secure_system_key_here

**Path Parameters:**
- `status`: The payment status to filter by (e.g., "PAID", "PENDING", "PROCESSING", "CANCELED")

**Query Parameters:**
- `limit`: Maximum number of records to return (default: 100)
- `offset`: Number of records to skip (default: 0)

**Response Example (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "status": "PAID",
  "payments": [
    {
      "referenceId": "550e8400-e29b-41d4-a716-446655440000",
      "amount": 100.50,
      "description": "Product purchase",
      "status": "PAID",
      "customerName": "John Smith",
      "customerEmail": "john@example.com",
      "customerDocument": "123.456.789-01",
      "customerUserId": "user123",
      "paymentMethod": "CREDIT_CARD",
      "paymentUrl": "https://sandbox.api.pagseguro.com/charges/CHARGE_123456789/receipt",
      "createdAt": "2025-05-11T21:09:00.000Z",
      "updatedAt": "2025-05-11T21:15:00.000Z"
    }
  ]
}
```

### User-specific Payments

#### Get User Payments

Retrieve payment records for a specific user.

**Endpoint:** `GET /user/:userId`

**Request Headers:**
- x-system-key: your_secure_system_key_here

**Path Parameters:**
- `userId`: The user ID to filter payments by

**Query Parameters:**
- `limit`: Maximum number of records to return (default: 100)
- `offset`: Number of records to skip (default: 0)

**Response Example (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "payments": [
    {
      "referenceId": "550e8400-e29b-41d4-a716-446655440000",
      "amount": 100.50,
      "description": "Product purchase",
      "status": "PAID",
      "customerName": "John Smith",
      "customerEmail": "john@example.com",
      "customerDocument": "123.456.789-01",
      "customerUserId": "user123",
      "paymentMethod": "CREDIT_CARD",
      "paymentUrl": "https://sandbox.api.pagseguro.com/charges/CHARGE_123456789/receipt",
      "createdAt": "2025-05-11T21:09:00.000Z",
      "updatedAt": "2025-05-11T21:15:00.000Z"
    }
  ]
}
```

## Webhooks

### Payment Webhook Handler

The API provides a webhook endpoint for receiving payment status updates from PagBank.

**Endpoint:** `POST /webhook`

**Note:** This endpoint does NOT require the system key header, as it's called by PagBank.

**Request Body Example:**
```json
{
  "id": "charge_123456789",
  "reference_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PAID"
}
```

**Response Example (200 OK):**
```json
{
  "success": true
}
```

## Error Handling

The API returns appropriate HTTP status codes and JSON error messages:

### Common Error Responses

**400 Bad Request:**
```json
{
  "error": "Invalid amount",
  "message": "Amount must be greater than zero"
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing system key"
}
```

**404 Not Found:**
```json
{
  "error": "Payment not found",
  "message": "No payment with reference ID 550e8400-e29b-41d4-a716-446655440000"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to create payment",
  "message": "PagBank API error: 400 - Invalid payment information"
}
```

## Status Codes

The API standardizes payment statuses for easier integration:

- **PAID**: Payment has been received and confirmed
- **PROCESSING**: Payment is being processed or awaiting confirmation
- **CANCELED**: Payment was canceled, declined, or refunded

Raw statuses from PagBank are mapped to these standardized statuses for consistency.

## Example Requests

### Create a Credit Card Payment (with cURL)

```bash
curl -X POST http://localhost:3000/api/payments/credit-card \
  -H "Content-Type: application/json" \
  -H "x-system-key: your_secure_system_key_here" \
  -d '{
    "amount": 100.50,
    "description": "Product purchase",
    "customerName": "John Smith",
    "customerEmail": "john@example.com",
    "customerDocument": "123.456.789-01",
    "customerUserId": "user123",
    "card": {
      "number": "4111111111111111",
      "expMonth": "12",
      "expYear": "2025",
      "securityCode": "123",
      "holderName": "JOHN SMITH"
    }
  }'
```

### Create a PIX Payment (with cURL)

```bash
curl -X POST http://localhost:3000/api/payments/pix \
  -H "Content-Type: application/json" \
  -H "x-system-key: your_secure_system_key_here" \
  -d '{
    "amount": 100.50,
    "description": "Product purchase",
    "customerName": "John Smith",
    "customerEmail": "john@example.com",
    "customerDocument": "123.456.789-01",
    "customerUserId": "user123",
    "expirationHours": 24
  }'
```

### Create a PagBank Checkout (with cURL)

```bash
curl -X POST http://localhost:3000/api/payments/checkout \
  -H "Content-Type: application/json" \
  -H "x-system-key: your_secure_system_key_here" \
  -d '{
    "amount": 100.50,
    "description": "Product purchase",
    "customerName": "John Smith",
    "customerEmail": "john@example.com",
    "customerDocument": "123.456.789-01",
    "customerUserId": "user123",
    "enabledTypes": ["CREDIT_CARD", "PIX"]
  }'
```

### Check Payment Status (with cURL)

```bash
curl -X GET http://localhost:3000/api/payments/status/550e8400-e29b-41d4-a716-446655440000 \
  -H "x-system-key: your_secure_system_key_here"
```