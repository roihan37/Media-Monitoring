

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
cd media-monitoring
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

> Do not commit `.env` to the repository.

---

## Database Setup

This project uses PostgreSQL.

The database schema is created through the migration:

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

| Field          | Description                              |
| -------------- | ---------------------------------------- |
| `id`           | Internal UUID primary key                |
| `external_id`  | ID from the original source              |
| `source`       | Normalized source name                   |
| `source_key`   | Normalized key used for source filtering |
| `title`        | Mention title                            |
| `content`      | Cleaned mention content                  |
| `url`          | Original mention URL                     |
| `author`       | Mention author                           |
| `published_at` | Publication date and time                |
| `engagement`   | Normalized engagement value              |
| `dedupe_key`   | Unique key used to prevent duplicates    |
| `created_at`   | Record creation time                     |
| `updated_at`   | Record update time                       |

### Why `source_key`?

Source names may have different formats:

```text
"The Star"
"the-star"
" THE STAR "
```

They are normalized into the same key:

```text
thestar
```

This makes source filtering consistent.

### Why `dedupe_key`?

`dedupe_key` is used to identify the same mention.

It also has a database-level `UNIQUE` constraint:

```sql
dedupe_key TEXT NOT NULL UNIQUE
```

This prevents the same mention from being inserted multiple times.

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

If a URL is not available, a deterministic fallback key is generated from the available normalized fields.

Duplicates are checked in two places:

1. Application level
2. Database level

The application removes duplicates inside the same request before inserting them.

The database uses the `UNIQUE` constraint and PostgreSQL conflict handling as the final protection.

This makes the ingestion endpoint idempotent, meaning sending the same data again does not continuously create duplicate rows.

---

## Data Normalization

The input data contains inconsistent formats, so data is normalized before being stored.

### Source

Whitespace, separators, and letter casing are normalized.

Example:

```text
"The Star"
"the-star"
" THE STAR "
```

are treated consistently.

### Engagement

String values are converted to integers.

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

This also prevents HTML/script tags from being stored as content.

---

# API Usage

## 1. Bulk Ingestion

### Request

```http
POST /internal/mentions/bulk
Content-Type: application/json
```

Example body:

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

Example response:

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

Indexes are used to make frequently used searches and filters faster.

For example:

* `source_key` → source filtering
* `published_at` → date filtering and statistics
* `external_id` → lookup by external ID
* `url` → URL lookup

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
├── repositories/
│   └── mention.repository.ts
│
├── routes/
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
├── app.ts
├── server.ts
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

### Folder Responsibilities

**Routes**

Defines API endpoints.

**Controllers**

Handles HTTP requests and responses.

**Services**

Contains application logic such as normalization and duplicate detection.

**Repositories**

Handles PostgreSQL queries.

**Utils**

Contains reusable helper functions.

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

```bash
npm run dev
```

The API will run at:

```text
http://localhost:3000
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

The provided `seed_mentions.json` can be used to test bulk ingestion.

Example using curl:

```bash
curl -X POST http://localhost:3000/internal/mentions/bulk \
  -H "Content-Type: application/json" \
  --data @seed_mentions.json
```

Then search the inserted data:

```bash
curl "http://localhost:3000/mentions?source=The%20Star"
```

Statistics:

```bash
curl "http://localhost:3000/mentions/stats?group_by=source"
```

---

# Assumptions

The following implementation decisions were made:

1. URL is the primary duplicate identifier when available.
2. Records without a usable URL use a deterministic fallback key.
3. Missing or invalid publication dates are stored as `NULL`.
4. Engagement values such as `"1,204"` are converted to `1204`.
5. Source names are normalized before storage and filtering.
6. Search keywords use case-insensitive matching.
7. The `to` date is inclusive.
8. Search results are sorted by publication date in descending order.

---

# Trade-offs

### URL-based duplicate detection

URL is used as the primary identifier because it is more stable than title text.

The limitation is that the same content with different URLs may not be detected as a duplicate.

### Application + database deduplication

Duplicates are removed before insertion to reduce unnecessary database operations.

The database `UNIQUE` constraint provides an additional layer of protection.

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

Approximately **[XX hours] across [X sessions]**.

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

