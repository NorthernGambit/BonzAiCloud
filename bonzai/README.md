# BonzAI Booking API

Serverless REST API för hotellbokningar, byggt med **Node.js, AWS Lambda, API Gateway, DynamoDB och Serverless Framework**.

API:t hanterar användare, authentication, hotellrum, tillgänglighet och bokningar.

---

# Installation

Klona repositoryt:

```bash
git clone https://github.com/NorthernGambit/BonzAiCloud.git
```

Gå till projektmappen:

```bash
cd BonzAiCloud/bonzai
```

Installera dependencies:

```bash
npm install
```

Skapa en lokal `config.yml` i `bonzai`-mappen:

```yml
role: arn:aws:iam::<AWS_ACCOUNT_ID>:role/<IAM_ROLE_NAME>
jwtSecret: your-secret-key
```

`config.yml` finns i `.gitignore` och ska inte commitas.

AWS credentials med rätt behörigheter behöver vara konfigurerade innan deployment.

### Seed rooms

Efter att DynamoDB-tabellen har skapats läggs hotellets rum in med:

```bash
npm run seed
```

### Deployment

```bash
npx serverless deploy
```

Projektet deployas till AWS-regionen:

```text
eu-north-1
```

Efter deployment visas API Gateway-URL:en i terminalen.

---

# Base URL

```text
https://<API-ID>.execute-api.eu-north-1.amazonaws.com
```

> Ersätt med aktuell API Gateway-URL efter deployment.

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

## Sök tillgängliga rum

```http
GET /api/rooms?startDate=2026-09-20&endDate=2026-09-23
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

## Avboka bokning

```http
DELETE /api/bookings/{id}
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
PK       USER#<userId>
SK       USER#<userId>
GSI1PK   EMAIL#<email>
GSI1SK   EMAIL#<email>
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
| Kontrollera rumsbokningar | `PK = ROOM#<roomId>` |

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
