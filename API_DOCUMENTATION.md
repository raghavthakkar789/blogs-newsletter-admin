# API Documentation - Blogs & Newsletters

## Base URL
```
http://localhost:5000/api
```

All endpoints require authentication via `Authorization` header:
```
Authorization: Bearer {ADMIN_TOKEN}
```

---

## 📝 BLOGS APIs

### 1. Get All Blogs (Paginated)

**Endpoint:** `GET /api/blogs`

**Description:** Fetch a paginated list of blogs with optional filtering.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page |
| `status` | string | No | - | Filter by status: `PENDING`, `APPROVED`, `REJECTED`, `DISABLED`, or `all` |
| `createdById` | string | No | - | Filter by creator user ID |
| `search` | string | No | - | Search in title, content, summary, category, author |

**Example Request:**
```bash
GET /api/blogs?page=1&limit=20&status=APPROVED&search=technology
```

**Response:**
```json
{
  "blogs": [
    {
      "id": "uuid",
      "title": "Blog Title",
      "content": "Blog content...",
      "summary": "Blog summary",
      "category": "Technology",
      "tags": ["tech", "ai"],
      "author": "John Doe",
      "image": "https://s3.amazonaws.com/bucket/blogs/image.jpg",
      "status": "APPROVED",
      "createdById": "user-uuid",
      "approvedById": "user-uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "editHistory": [
        {
          "userId": "user-uuid",
          "userName": "John Doe",
          "editedAt": "2024-01-01T00:00:00.000Z",
          "changes": ["title", "content"]
        }
      ],
      "lastEditedAt": "2024-01-01T00:00:00.000Z",
      "lastEditedBy": "John Doe"
    }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 5
}
```

---

### 2. Get Single Blog by ID

**Endpoint:** `GET /api/blogs/:id`

**Description:** Fetch a single blog by its ID (works for any status).

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Blog ID |

**Example Request:**
```bash
GET /api/blogs/123e4567-e89b-12d3-a456-426614174000
```

**Response:**
```json
{
  "blog": {
    "id": "uuid",
    "title": "Blog Title",
    "content": "Blog content...",
    "summary": "Blog summary",
    "category": "Technology",
    "tags": ["tech", "ai"],
    "author": "John Doe",
    "image": "https://s3.amazonaws.com/bucket/blogs/image.jpg",
    "status": "APPROVED",
    "createdById": "user-uuid",
    "approvedById": "user-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "publishedAt": "2024-01-01T00:00:00.000Z",
    "editHistory": [],
    "lastEditedAt": null,
    "lastEditedBy": null
  }
}
```

**Error Response (404):**
```json
{
  "statusCode": 404,
  "message": "Blog not found"
}
```

---

### 3. Create Blog

**Endpoint:** `POST /api/blogs`

**Description:** Create a new blog.

**Request Body:**
```json
{
  "title": "Blog Title",
  "content": "Blog content...",
  "summary": "Blog summary (optional)",
  "category": "Technology (optional)",
  "tags": ["tech", "ai"] (optional),
  "author": "John Doe (optional)",
  "image": "https://s3.amazonaws.com/bucket/blogs/image.jpg (optional)"
}
```

**Response:**
```json
{
  "blog": {
    "id": "uuid",
    "title": "Blog Title",
    "content": "Blog content...",
    "status": "PENDING",
    "createdAt": "2024-01-01T00:00:00.000Z",
    ...
  }
}
```

---

### 4. Update Blog

**Endpoint:** `PATCH /api/blogs/:id`

**Description:** Update an existing blog.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Blog ID |

**Request Body (all fields optional):**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "summary": "Updated summary",
  "category": "Updated category",
  "tags": ["updated", "tags"],
  "author": "Updated Author",
  "image": "https://s3.amazonaws.com/bucket/blogs/new-image.jpg"
}
```

**Response:**
```json
{
  "blog": {
    "id": "uuid",
    "title": "Updated Title",
    ...
  }
}
```

---

### 5. Delete Blog

**Endpoint:** `DELETE /api/blogs/:id`

**Description:** Delete a blog.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Blog ID |

**Response:**
```json
{
  "message": "Blog deleted successfully"
}
```

---

### 6. Update Blog Status

**Endpoint:** `PATCH /api/blogs/:id/status`

**Description:** Update the status of a blog.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Blog ID |

**Request Body:**
```json
{
  "status": "APPROVED" // PENDING | APPROVED | REJECTED | DISABLED
}
```

**Response:**
```json
{
  "blog": {
    "id": "uuid",
    "status": "APPROVED",
    "approvedById": "user-uuid",
    "publishedAt": "2024-01-01T00:00:00.000Z",
    ...
  }
}
```

---

### 7. Bulk Update Blog Status

**Endpoint:** `PATCH /api/blogs/bulk/status`

**Description:** Update status of multiple blogs at once.

**Request Body:**
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"],
  "status": "APPROVED" // PENDING | APPROVED | REJECTED
}
```

**Response:**
```json
{
  "updatedCount": 3
}
```

---

## 📧 NEWSLETTERS APIs

### 1. Get All Newsletters (Paginated)

**Endpoint:** `GET /api/newsletters`

**Description:** Fetch a paginated list of newsletters with optional filtering.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page |
| `status` | string | No | - | Filter by status: `PENDING`, `APPROVED`, `REJECTED`, `DISABLED`, or `all` |
| `createdById` | string | No | - | Filter by creator user ID |
| `search` | string | No | - | Search in title, content, summary, category |

**Example Request:**
```bash
GET /api/newsletters?page=1&limit=20&status=APPROVED&search=newsletter
```

**Response:**
```json
{
  "newsletters": [
    {
      "id": "uuid",
      "title": "Newsletter Title",
      "content": "Newsletter content...",
      "summary": "Newsletter summary",
      "category": "Marketing",
      "tags": ["marketing", "email"],
      "image": "https://s3.amazonaws.com/bucket/newsletters/image.jpg",
      "status": "APPROVED",
      "createdById": "user-uuid",
      "approvedById": "user-uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "editHistory": [],
      "lastEditedAt": null,
      "lastEditedBy": null
    }
  ],
  "total": 50,
  "page": 1,
  "totalPages": 3
}
```

---

### 2. Get Single Newsletter by ID

**Endpoint:** `GET /api/newsletters/:id`

**Description:** Fetch a single newsletter by its ID (works for any status).

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Newsletter ID |

**Example Request:**
```bash
GET /api/newsletters/123e4567-e89b-12d3-a456-426614174000
```

**Response:**
```json
{
  "newsletter": {
    "id": "uuid",
    "title": "Newsletter Title",
    "content": "Newsletter content...",
    "summary": "Newsletter summary",
    "category": "Marketing",
    "tags": ["marketing", "email"],
    "image": "https://s3.amazonaws.com/bucket/newsletters/image.jpg",
    "status": "APPROVED",
    "createdById": "user-uuid",
    "approvedById": "user-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "publishedAt": "2024-01-01T00:00:00.000Z",
    "editHistory": [],
    "lastEditedAt": null,
    "lastEditedBy": null
  }
}
```

**Error Response (404):**
```json
{
  "statusCode": 404,
  "message": "Newsletter not found"
}
```

---

### 3. Create Newsletter

**Endpoint:** `POST /api/newsletters`

**Description:** Create a new newsletter.

**Request Body:**
```json
{
  "title": "Newsletter Title",
  "content": "Newsletter content...",
  "summary": "Newsletter summary (optional)",
  "category": "Marketing (optional)",
  "tags": ["marketing", "email"] (optional),
  "image": "https://s3.amazonaws.com/bucket/newsletters/image.jpg (optional)"
}
```

**Response:**
```json
{
  "newsletter": {
    "id": "uuid",
    "title": "Newsletter Title",
    "content": "Newsletter content...",
    "status": "PENDING",
    "createdAt": "2024-01-01T00:00:00.000Z",
    ...
  }
}
```

---

### 4. Update Newsletter

**Endpoint:** `PATCH /api/newsletters/:id`

**Description:** Update an existing newsletter.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Newsletter ID |

**Request Body (all fields optional):**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "summary": "Updated summary",
  "category": "Updated category",
  "tags": ["updated", "tags"],
  "image": "https://s3.amazonaws.com/bucket/newsletters/new-image.jpg"
}
```

**Response:**
```json
{
  "newsletter": {
    "id": "uuid",
    "title": "Updated Title",
    ...
  }
}
```

---

### 5. Delete Newsletter

**Endpoint:** `DELETE /api/newsletters/:id`

**Description:** Delete a newsletter.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Newsletter ID |

**Response:**
```json
{
  "message": "Newsletter deleted successfully"
}
```

---

### 6. Update Newsletter Status

**Endpoint:** `PATCH /api/newsletters/:id/status`

**Description:** Update the status of a newsletter.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Newsletter ID |

**Request Body:**
```json
{
  "status": "APPROVED" // PENDING | APPROVED | REJECTED | DISABLED
}
```

**Response:**
```json
{
  "newsletter": {
    "id": "uuid",
    "status": "APPROVED",
    "approvedById": "user-uuid",
    "publishedAt": "2024-01-01T00:00:00.000Z",
    ...
  }
}
```

---

### 7. Bulk Update Newsletter Status

**Endpoint:** `PATCH /api/newsletters/bulk/status`

**Description:** Update status of multiple newsletters at once.

**Request Body:**
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"],
  "status": "APPROVED" // PENDING | APPROVED | REJECTED
}
```

**Response:**
```json
{
  "updatedCount": 3
}
```

---

## 📤 IMAGE UPLOAD API

### Upload Image

**Endpoint:** `POST /api/upload?folder=blogs` or `POST /api/upload?folder=newsletters`

**Description:** Upload an image file to S3 bucket in the specified folder.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folder` | string | No | `blogs` or `newsletters` (defaults to `blogs`) |

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field (image file, max 10MB)

**Example Request (cURL):**
```bash
curl -X POST \
  'http://localhost:5000/api/upload?folder=blogs' \
  -H 'Authorization: Bearer {ADMIN_TOKEN}' \
  -F 'file=@/path/to/image.jpg'
```

**Response:**
```json
{
  "url": "https://your-bucket.s3.us-east-1.amazonaws.com/blogs/1234567890-image.jpg",
  "filename": "1234567890-image.jpg"
}
```

---

## 🔐 Authentication

All endpoints require authentication via the `Authorization` header:

```
Authorization: Bearer {ADMIN_TOKEN}
```

The `ADMIN_TOKEN` is set in your `.env` file as `ADMIN_TOKEN`.

---

## 📊 Status Values

- `PENDING` - Content is pending approval
- `APPROVED` - Content is approved and published
- `REJECTED` - Content was rejected
- `DISABLED` - Content is disabled/hidden

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation error message",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Blog not found" // or "Newsletter not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## 📝 Notes

1. **Pagination**: Default page size is 20 items. Maximum recommended limit is 100.
2. **Search**: The search parameter searches across title, content, summary, category, and author (for blogs).
3. **Image URLs**: Images are stored in S3 with separate folders for blogs and newsletters.
4. **Edit History**: All updates are tracked in the `editHistory` array.
5. **Status Changes**: When status changes to `APPROVED`, `publishedAt` is automatically set.

---

## 🧪 Example Usage

### Fetch all approved blogs (page 1, 20 per page)
```bash
curl -X GET \
  'http://localhost:5000/api/blogs?page=1&limit=20&status=APPROVED' \
  -H 'Authorization: Bearer {ADMIN_TOKEN}'
```

### Search newsletters
```bash
curl -X GET \
  'http://localhost:5000/api/newsletters?search=marketing&status=APPROVED' \
  -H 'Authorization: Bearer {ADMIN_TOKEN}'
```

### Get single blog by ID
```bash
curl -X GET \
  'http://localhost:5000/api/blogs/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Authorization: Bearer {ADMIN_TOKEN}'
```


