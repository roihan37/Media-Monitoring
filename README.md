
# Media Monitoring API

Backend service untuk mengelola data media mentions.

Project ini dibuat untuk Technical Assessment dengan tiga fitur utama:

- Bulk ingestion
- Search mentions
- Statistics

## Tech Stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- Vitest
- Supertest

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/internal/mentions/bulk` | Bulk ingest mentions |
| GET | `/mentions` | Search and filter mentions |
| GET | `/mentions/stats?group_by=source` | Statistics by source |
| GET | `/mentions/stats?group_by=day` | Statistics by day |

---

## Requirements

Make sure you have:

- Node.js 20+
- PostgreSQL
- npm

---

## Installation

Clone repository:

```bash
git clone <YOUR_REPOSITORY_URL>
cd backend
````

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create `.env` in the project root:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/MentionDB
PORT=3000
```

Update the database username, password, and database name according to your PostgreSQL configuration.

> Do not commit `.env` to the repository. Use `.env.example` as a template.

---

## Database Setup

This project uses PostgreSQL.

The database schema is created through the committed migration:

```text
migrations/
└── create.mentions.ts
```

Run the migration:

```bash
npm run migrate
```

The migration creates the `mentions` table and required indexes.

---

## Database Schema

The main table is:

```text
mentions
```

Important fields:

| Field          | Description                                            |
| -------------- | ------------------------------------------------------ |
| `id`           | Internal UUID primary key                              |
| `external_id`  | ID from the original source                            |
| `source`       | Normalized source name                                 |
| `source_key`   | Canonical key used for source comparison and filtering |
| `title`        | Mention title                                          |
| `content`      | Cleaned mention content                                |
| `url`          | Original mention URL                                   |
| `author`       | Mention author                                         |
| `published_at` | Publication date and time                              |
| `engagement`   | Normalized engagement value                            |
| `dedupe_key`   | Unique key used to prevent duplicate records           |
| `created_at`   | Record creation time                                   |
| `updated_at`   | Record update time                                     |

### Why `source_key`?

Source names may have different formatting or casing.

For example:

```text
"The Star"
"THE STAR"
" THE STAR "
```

are normalized consistently for comparison and filtering.

The canonical comparison key removes differences in casing, surrounding whitespace, and separators.

For example:

```text
"The Star" → "thestar"
"THE STAR" → "thestar"
"the-star" → "thestar"
```

`source_key` is used for comparison and filtering, while `source` is kept as the normalized display value.

### Why `dedupe_key`?

`dedupe_key` is used to identify the same mention.

It also has a database-level `UNIQUE` constraint:

```sql
dedupe_key TEXT NOT NULL UNIQUE
```

This provides database-level protection against inserting the same mention multiple times.

---

## Duplicate Detection

The primary duplicate identifier is the normalized URL.

Example:

```text
Original URL
      ↓
Normalize URL
      ↓
dedupe_key
```

When a usable URL is available:

```text
dedupe_key = url:<normalized_url>
```

For example:

```text
https://example.com/article
https://example.com/article/
```

are normalized consistently before comparison.

If a usable URL is not available, a deterministic fallback key is generated from the available normalized fields.

Duplicates are checked in two places:

1. Application level
2. Database level

The application removes duplicates within the same request before sending records to the repository.

The database uses the `UNIQUE` constraint and PostgreSQL conflict handling as the final protection.

This makes the ingestion endpoint idempotent, meaning sending the same payload multiple times does not continuously create duplicate rows.

---

## Data Normalization

The input data contains inconsistent formats, so data is normalized before being stored.

### Source

Source values are trimmed and normalized for consistent comparison.

Examples:

```text
"The Star"
"THE STAR"
" THE STAR "
```

are treated consistently.

A canonical `source_key` is generated for comparison and filtering.

### Title

Titles are trimmed and normalized where required for comparison.

Empty titles are stored as `NULL`.

### Engagement

String values containing comma separators are converted to integers.

```text
"1,204" → 1204
```

### Published Date

Different date formats are normalized into PostgreSQL `TIMESTAMPTZ`.

Missing or invalid dates are stored as `NULL`.

### Content

HTML tags are removed before storing the content.

Example:

```html
<p>Hello world</p>
```

becomes:

```text
Hello world
```

HTML and script tags are not stored as part of the cleaned content.

---

# API Usage

## 1. Bulk Ingestion

### Request

```http
POST /internal/mentions/bulk
Content-Type: application/json
```

The endpoint accepts an array of mention records through the request body.

The provided `seed_mentions.json` file contains the sample data used to test this endpoint.

### Example body

```json
[
  {
    "external_id": "str-99120",
    "source": "The Star",
    "title": "Ringgit strengthens against US dollar in early trade",
    "content": "<p>The ringgit opened higher.</p>",
    "url": "https://www.thestar.com.my/business/2026/08/10/ringgit-strengthens",
    "author": "Aisyah Rahman",
    "published_at": "2026-08-10T08:15:00Z",
    "engagement": 412
  }
]
```

### Using the provided seed data

From the project root:

```bash
curl -X POST http://localhost:3000/internal/mentions/bulk \
  -H "Content-Type: application/json" \
  --data @seed_mentions.json
```

The `seed_mentions.json` file is used as a sample request payload. The API receives the JSON data through `req.body`, normalizes the records, applies duplicate detection, and stores the resulting records in PostgreSQL.

The backend does not depend on reading `seed_mentions.json` directly during the request.

### Example response

```json
{
  "message": "Mentions ingested successfully",
  "received": 1,
  "unique": 1,
  "inserted": 1
}
```

---

## 2. Search Mentions

```http
GET /mentions
```

Supported parameters:

| Parameter | Description                     |
| --------- | ------------------------------- |
| `q`       | Search keyword in title/content |
| `source`  | Filter by source                |
| `from`    | Start date                      |
| `to`      | End date                        |
| `page`    | Page number                     |
| `limit`   | Number of records per page      |

### Examples

Search by source:

```text
GET /mentions?source=The%20Star
```

Search by keyword:

```text
GET /mentions?q=ringgit
```

Search by source and keyword:

```text
GET /mentions?q=ringgit&source=The%20Star
```

Date range:

```text
GET /mentions?from=2026-08-10&to=2026-08-15
```

Pagination:

```text
GET /mentions?page=1&limit=20
```

Results are sorted by:

```text
published_at DESC NULLS LAST
id DESC
```

This provides deterministic ordering when multiple records have the same publication date.

---

## 3. Statistics

### By Source

```text
GET /mentions/stats?group_by=source
```

Example response:

```json
[
  {
    "source": "The Star",
    "count": 5
  },
  {
    "source": "Twitter",
    "count": 2
  }
]
```

### By Day

```text
GET /mentions/stats?group_by=day
```

Example response:

```json
[
  {
    "day": "2026-08-10",
    "count": 3
  },
  {
    "day": "2026-08-11",
    "count": 4
  }
]
```

Invalid `group_by` values return:

```text
400 Bad Request
```

---

# Indexes

The following indexes are created:

```sql
CREATE INDEX IF NOT EXISTS idx_mentions_source_key
    ON mentions(source_key);

CREATE INDEX IF NOT EXISTS idx_mentions_published_at
    ON mentions(published_at);

CREATE INDEX IF NOT EXISTS idx_mentions_external_id
    ON mentions(external_id);

CREATE INDEX IF NOT EXISTS idx_mentions_url
    ON mentions(url);
```

Indexes are used to support frequently used searches and filters.

For example:

* `source_key` → source filtering
* `published_at` → date filtering and ordering
* `external_id` → lookup by external ID
* `url` → URL lookup

The `dedupe_key` also has a unique constraint to provide database-level duplicate protection.

---

# Project Structure

```text
media-monitoring/
├── config/
│   └── connection.ts
│
├── controllers/
│   └── mention.controller.ts
│
├── migrations/
│   └── create.mentions.ts
│
├── models/
│   └── ...
│
├── repositories/
│   └── mention.repository.ts
│
├── router/
│   └── mention.routes.ts
│
├── services/
│   └── mention.service.ts
│
├── utils/
│   ├── duplicate-detector.ts
│   └── mention-normalizer.ts
│
├── test/
│   ├── mention-normalizer.test.ts
│   ├── duplicate-detector.test.ts
│   └── mention.service.test.ts
│
├── seed_mentions.json
├── app.ts
├── server.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Folder Responsibilities

**Config**

Contains application and database configuration.

**Controllers**

Handles HTTP requests and responses.

**Models**

Contains data-related types or models.

**Repositories**

Handles PostgreSQL queries and database operations.

**Router**

Defines API routes and connects them to controllers.

**Services**

Contains application logic such as normalization, ingestion, and duplicate detection.

**Utils**

Contains reusable helper functions.

**Migrations**

Contains the committed database schema migration.

**Test**

Contains unit and API tests.

**seed_mentions.json**

Contains the sample mention data provided for testing the bulk ingestion endpoint.

---

# Running the Application

### 1. Install dependencies

```bash
npm install
```

### 2. Configure `.env`

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/MentionDB
PORT=3000
```

### 3. Run migration

```bash
npm run migrate
```

### 4. Start server

For development:

```bash
npm run dev
```

The API will run at:

```text
http://localhost:3000
```

For a production-style run:

```bash
npm run build
npm start
```

---

# Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

The tests cover:

* Source normalization
* Engagement normalization
* HTML cleaning
* Duplicate detection
* Duplicate removal during ingestion
* Source filtering
* Statistics
* Invalid `group_by`

---

# Testing with Seed Data

The provided `seed_mentions.json` is stored in the project root and can be used as the request body for bulk ingestion.

### 1. Run the server

```bash
npm run dev
```

### 2. Send the seed data

```bash
curl -X POST http://localhost:3000/internal/mentions/bulk \
  -H "Content-Type: application/json" \
  --data @seed_mentions.json
```

### 3. Search the inserted data

```bash
curl "http://localhost:3000/mentions?source=The%20Star"
```

### 4. Get statistics

By source:

```bash
curl "http://localhost:3000/mentions/stats?group_by=source"
```

By day:

```bash
curl "http://localhost:3000/mentions/stats?group_by=day"
```

Sending the same `seed_mentions.json` payload again should not continuously create duplicate rows.

---

# Assumptions

The following implementation decisions were made:

1. URL is the primary duplicate identifier when a usable URL is available.
2. URLs are normalized before duplicate comparison.
3. Records without a usable URL use a deterministic fallback key.
4. Missing or invalid publication dates are stored as `NULL`.
5. Engagement values such as `"1,204"` are converted to `1204`.
6. Source names are normalized before storage and filtering.
7. Search keywords use case-insensitive matching.
8. The `to` date is inclusive.
9. Search results are sorted by publication date in descending order with `id` as a secondary sort key.
10. The provided `seed_mentions.json` is treated as sample input for the bulk ingestion endpoint and is not read directly by the backend during ingestion.

---

# Trade-offs

### URL-based duplicate detection

URL is used as the primary identifier because it is more stable than title text for identifying the same published resource.

The limitation is that the same content published under different URLs may not be detected as a duplicate.

### Application + database deduplication

Duplicates are removed before insertion to avoid unnecessary database operations.

The database `UNIQUE` constraint provides an additional layer of protection against duplicate records.

### Source normalization

A canonical source key is generated by normalizing formatting differences such as whitespace, casing, and separators.

This helps values such as:

```text
"The Star"
"THE STAR"
"the-star"
```

produce the same comparison key.

The implementation does not use fuzzy matching because similar-looking source names may represent different entities.

### PostgreSQL

PostgreSQL was chosen because the assessment requires a real database and PostgreSQL provides the features needed for this project, including indexing, `TIMESTAMPTZ`, aggregation, and conflict handling.

---

# Not Included

The following are not included because they are not required for this assessment:

* Authentication
* User accounts
* Frontend
* Docker
* CI/CD
* Machine learning
* Sentiment analysis

---

# Development Time

Approximately **11 hours across 4 sessions**.

---

# With Another Week, I Would...

If I had another week, I would:

1. Add more integration tests using a real PostgreSQL test database.
2. Improve URL canonicalization for duplicate detection.
3. Add stronger request validation.
4. Add more search and statistics test cases.
5. Add Docker Compose for easier local setup.

---

# AI Usage

AI tools were used as a development aid for:

* Understanding requirements
* Reviewing implementation decisions
* Debugging
* Writing and reviewing tests
* Documentation

All implementation decisions and submitted code were reviewed and adapted to the assessment requirements.

````
