# BonzAI Booking API

Serverless REST API för hotellbokningar, byggt med **Node.js, AWS Lambda, API Gateway, DynamoDB och Serverless Framework**.

API:t hanterar användare, authentication, hotellrum, tillgänglighet och bokningar.

---

# Setup

base url
```text
https://92u8zpyroa.execute-api.eu-north-1.amazonaws.com
```
---

# Tech stack

- Node.js 24
- AWS Lambda
- Amazon API Gateway
- Amazon DynamoDB
- Serverless Framework
- AWS SDK for JavaScript
- Middy
- Zod
- JSON Web Tokens (JWT)
- bcryptjs
- Git & GitHub

---

# Hotellrum

BonzAI har totalt **20 hotellrum**.

| Typ | Antal | Nummer | Kapacitet | Pris/natt |
| --- | ---: | --- | ---: | ---: |
| Single | 5 | 101–105 | 1 | 500 kr |
| Double | 10 | 201–210 | 2 | 1000 kr |
| Suite | 5 | 301–305 | 3 | 1500 kr |

---

# Endpoints

| Method | Endpoint | Auth | Beskrivning |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Nej | Registrera användare |
| POST | `/api/auth/login` | Nej | Logga in |
| GET | `/api/rooms` | Nej | Hämta/sök rum |
| GET | `/api/rooms/{id}` | Nej | Hämta specifikt rum |
| POST | `/api/bookings` | Ja | Skapa bokning |
| GET | `/api/bookings` | Ja | Hämta egna bokningar |
| GET | `/api/bookings/{id}` | Ja | Hämta specifik bokning |
| PATCH | `/api/bookings/{id}` | Ja | Uppdatera bokning |
| DELETE | `/api/bookings/{id}` | Ja | Avboka bokning |

---

# Authentication

Skyddade endpoints kräver JWT:

```http
Authorization: Bearer <token>
```

JWT returneras vid lyckad login.

Bokningar kopplas till användarens **email från den verifierade JWT:n**, vilket gör att användaren endast kan hantera sina egna bokningar.

## Register

```http
POST /api/auth/register
```

```json
{
  "name": "Anna Andersson",
  "email": "anna@example.com",
  "password": "password123"
}
```

Password måste vara minst 8 tecken och lagras hashat med bcrypt.

## Login

```http
POST /api/auth/login
```

```json
{
  "email": "anna@example.com",
  "password": "password123"
}
```

Exempel på response:

```json
{
  "token": "<JWT>",
  "user": {
    "id": "user-id",
    "email": "anna@example.com",
    "name": "Anna Andersson"
  }
}
```

---

# Rooms

## Hämta alla rum

```http
GET /api/rooms
```

Exempel på response:
```json
[
  {
    "PK": "ROOM",
    "SK": "ROOM#101",
    "type": "single",
    "maxGuests": 1,
    "price": 500
  },
  {
    "PK": "ROOM",
    "SK": "ROOM#201",
    "type": "double",
    "maxGuests": 2,
    "price": 1000
  }
]
```
## Sök tillgängliga rum

```http
GET /api/rooms?startDate=2026-09-20&endDate=2026-09-23
```

Exempel på response:
```json
[
  {
    "PK": "ROOM",
    "SK": "ROOM#202",
    "type": "double",
    "maxGuests": 2,
    "price": 1000
  },
  {
    "PK": "ROOM",
    "SK": "ROOM#301",
    "type": "suite",
    "maxGuests": 3,
    "price": 1500
  }
]
```
Filtrera efter rumstyp:

```http
GET /api/rooms?startDate=2026-09-20&endDate=2026-09-23&type=double
```

### Query parameters

| Parameter | Beskrivning |
| --- | --- |
| `startDate` | Check-in i format `YYYY-MM-DD` |
| `endDate` | Check-out i format `YYYY-MM-DD` |
| `type` | `single`, `double` eller `suite` |

`startDate` och `endDate` måste anges tillsammans.

## Hämta specifikt rum

```http
GET /api/rooms/{id}
```

Exempel:

```http
GET /api/rooms/201
```

Exempel på response:
```json
{
  "PK": "ROOM",
  "SK": "ROOM#201",
  "type": "double",
  "maxGuests": 2,
  "price": 1000
}
```

---

# Bookings

Alla booking-endpoints kräver:

```http
Authorization: Bearer <token>
```

API:t kontrollerar automatiskt att:

- rummen existerar
- rummens kapacitet räcker
- rummen inte är dubbelbokade
- datumen är giltiga
- totalpriset beräknas korrekt

Klienten skickar aldrig in `totalPrice` eller användarens email.

## Skapa bokning

```http
POST /api/bookings
```

Request body:

```json
{
  "checkIn": "2026-09-20",
  "checkOut": "2026-09-23",
  "guests": 3,
  "rooms": ["201", "101"]
}
```

Exempel på response:

```json
{
  "message": "Booking successfully made!",
  "booking": {
    "bookingId": "abc123",
    "checkIn": "2026-09-20",
    "checkOut": "2026-09-23",
    "guests": 3,
    "rooms": ["201", "101"],
    "nights": 3,
    "totalPrice": 4500
  }
}
```

## Hämta bokningar

```http
GET /api/bookings
```

Returnerar endast den inloggade användarens bokningar.

## Hämta specifik bokning

```http
GET /api/bookings/{id}
```

Exempel på response:
```json
{
  "message": "All bookings successfully retrieved!",
  "bookings": [
    {
      "bookingId": "abc123",
      "checkIn": "2026-09-20",
      "checkOut": "2026-09-23",
      "guests": 3,
      "totalPrice": 4500,
      "rooms": [
        {
          "roomId": "201",
          "maxGuests": 2,
          "price": 1000,
          "type": "double"
        },
        {
          "roomId": "101",
          "maxGuests": 1,
          "price": 500,
          "type": "single"
        }
      ]
    }
  ]
}
```
Hämta specifik bokning

GET /api/bookings/{id}

Exempel på response:
```json
{
  "message": "Booking on the specified ID succesfully retrieved!",
  "booking": {
    "bookingId": "abc123",
    "checkIn": "2026-09-20",
    "checkOut": "2026-09-23",
    "guests": 3,
    "totalPrice": 4500,
    "rooms": [
      {
        "roomId": "201",
        "maxGuests": 2,
        "price": 1000,
        "type": "double"
      },
      {
        "roomId": "101",
        "maxGuests": 1,
        "price": 500,
        "type": "single"
      }
    ]
  }
}
```

## Uppdatera bokning

```http
PATCH /api/bookings/{id}
```

Ett eller flera fält kan skickas:

```json
{
  "checkOut": "2026-09-24",
  "guests": 2
}
```

Kapacitet, tillgänglighet och pris kontrolleras på nytt.

Exempel på response:
```json
{
  "message": "Booking successfully updated!",
  "booking": {
    "bookingId": "abc123",
    "checkIn": "2026-09-20",
    "checkOut": "2026-09-24",
    "guests": 2,
    "rooms": ["201", "101"],
    "nights": 4,
    "totalPrice": 6000
  }
}
```

## Avboka bokning

```http
DELETE /api/bookings/{id}
```

Exempel på response:
```json
{
  "message": "Booking successfully deleted!",
  "bookingId": "abc123"
}
```
---

# DynamoDB

Projektet använder en DynamoDB-tabell:

```text
bonz-ai
```

Primary key:

```text
PK
SK
```

Global Secondary Index:

```text
GSI1PK
GSI1SK
```

## Data structure

Users:

```text
PK       USER#<userEmail>
SK       PROFILE
```

Rooms:

```text
PK   ROOM
SK   ROOM#<roomId>
```

Bookings:

```text
PK       BOOKINGS#<bookingId>
SK       DETAILS
GSI1PK   USER#<email>
GSI1SK   BOOKINGS#<checkIn>
```

För varje bokat rum skapas även en referens:

```text
PK   ROOM#<roomId>
SK   BOOKINGS#<checkIn>
```

Dessa används för att kontrollera överlappande bokningar.

---

# Access Patterns

| Access pattern | DynamoDB |
| --- | --- |
| Hämta användare via email | `GSI1PK = EMAIL#<email>` |
| Hämta alla rum | `PK = ROOM` |
| Hämta specifikt rum | `PK = ROOM`, `SK = ROOM#<id>` |
| Hämta specifik bokning | `PK = BOOKINGS#<id>`, `SK = DETAILS` |
| Hämta användarens bokningar | `GSI1PK = USER#<email>` |
| Kontrollera rumsbokningar | `PK = ROOM#<roomId>` `SK = BOOKINGS<checkIn>#datum` |

---

# Error responses

API:t returnerar JSON tillsammans med relevanta HTTP-statuskoder.

| Status | Betydelse |
| --- | --- |
| `400` | Ogiltig input, datum, rum eller kapacitet |
| `401` | JWT saknas eller är ogiltig |
| `403` | Användaren saknar behörighet |
| `404` | Rum eller bokning finns inte |
| `409` | Email finns redan eller rum är dubbelbokat |
| `500` | Oväntat serverfel |

Fel returneras i formatet:

```json
{
  "message": "Error message"
}
```

# Varför är databasen designad som den är?
Vår databas är byggd i single-table design, och det blev så efter att vi pratat med Jesper och frågat AI om olika access patterns. Vi valde att använda userEmail som en unik identifierare för våran auth. Rooms är byggd på ett snarlikt sätt. Vi använde booking som PK med en unik identifierare sen använde vi userEmail på GSI1PK för att kunna hämta ut alla bokningar på en användare. GSI1SK sparar vi vår checkIn som inte används nu men som var tänkt att kunna sortera en användares bokningar i kronologisk ordning, t.ex. För varje rum i en bokning så skapas en hjälpreferens som vi använder för att kolla om ett specifikt rum är bokat inom en viss datumperiod. Det förhindrar dubbelbokningar.  
