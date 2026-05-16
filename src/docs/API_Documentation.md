# DFA Ticketing & Admin Dashboard API Documentation

## Base URL
`https://dfa-backend-lilj.onrender.com/api/v1` *(Will change to production URL later)*

## Authentication
Admin routes require a JWT Bearer token in the request headers.
**Header:** `Authorization: Bearer <your_jwt_token>`

---

## Public Routes (Guest Checkout & Event Viewing)

### 1. Get All Events
*   **Endpoint:** `GET /events`
*   **Description:** Fetches all published, upcoming events for the public homepage.
*   **Response:** `{ "status": "success", "data": { "events": [...] } }`

### 2. Get Single Event
*   **Endpoint:** `GET /events/:id`
*   **Description:** Fetches details and available ticket tiers for a specific event.

### 3. Initialize Checkout (Create Order)
*   **Endpoint:** `POST /orders/checkout`
*   **Payload:**
    ```json
    {
      "eventId": "64a7c...",
      "ticketType": "Standard",
      "quantity": 2,
      "buyerDetails": { "name": "John Doe", "email": "john@email.com", "whatsapp": "08012345678" },
      "attendees": [
         { "name": "Jane Doe", "email": "jane@email.com" }
      ],
      "paymentMethod": "Card"
    }
    
```
*   **Response:** Returns a `checkoutUrl` (Flutterwave redirect link) and the pending `order` object.

---

## Admin & Dashboard Routes (Requires Auth)

### 1. Admin Login
*   **Endpoint:** `POST /admin/login`
*   **Payload:** `{ "email": "admin@dfa.com", "password": "securepassword" }`
*   **Response:** Returns the `token` and the `staff` user object (including their `permissions` object).

### 2. Get Dashboard Stats
*   **Endpoint:** `GET /admin/stats`
*   **Description:** Returns aggregates for the overview cards (Total Revenue, Ticket Orders, etc.).

### 3. Fetch Transaction History (Payments)
*   **Endpoint:** `GET /admin/transactions`
*   **Description:** Returns all orders/purchases for the Payments data table.

### 4. Create Event
*   **Endpoint:** `POST /admin/events`
*   **Headers:** `Content-Type: multipart/form-data`
*   **Payload:** Requires a `bannerImage` file upload, along with stringified `title`, `capacity`, `ticketTiers`, etc.

### 5. Manually Add Attendee
*   **Endpoint:** `POST /admin/attendees/manual`
*   **Description:** Bypasses payment gateway to add comped/manual guests.
*   **Payload:** Includes `eventId`, guest details, and `specialNote`.


## Content Management (Requires Auth)

### 1. Upload Media / Gallery Image
*   **Endpoint:** `POST /content/media`
*   **Headers:** `Content-Type: multipart/form-data`
*   **Payload:** Requires a `file` upload, `category`, and `visibleOnSite` boolean.
*   **Response:** Returns the Cloudinary URL of the uploaded image.

### 2. Add YouTube Video
*   **Endpoint:** `POST /content/videos`
*   **Payload:** `{ "title": "...", "category": "Teachings", "youtubeUrl": "https://...", "isPublished": true }`

---

## Staff & Role Management (Requires 'Super Admin' Role)

### 1. Add Staff Member
*   **Endpoint:** `POST /staff`
*   **Payload:** `{ "name": "...", "email": "...", "password": "...", "role": "Finance Manager" }`

### 2. Update Staff Permissions
*   **Endpoint:** `PATCH /staff/:id/permissions`
*   **Payload:** 
    ```json
    {
      "permissions": {
        "dashboard": true,
        "events": false,
        "finance": true
      }
    }
    ```