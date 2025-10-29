# Reports API Implementation

This implementation provides the reports endpoints following the project's established architecture and best practices.

## Features Implemented

### POST /api/reports

- Creates a new report for the authenticated user
- Requires Firebase authentication
- Automatically creates a user record if it doesn't exist
- Returns the created report with owner information

### GET /api/reports

- Retrieves all reports owned by the authenticated user
- Requires Firebase authentication
- Returns reports with metadata (categories count, expenses count)
- Ordered by most recently updated

## File Structure

```
src/
├── config/
│   └── database.js          # Prisma client singleton
├── controllers/
│   └── reportController.js  # Business logic for reports
├── routes/
│   └── reportRoutes.js      # Route definitions
└── index.js                 # Updated to include report routes
```

## Architecture Details

### Authentication

- Uses the existing `verifyAuth` middleware
- Automatically handles user creation/lookup based on Firebase UID
- All endpoints require valid Firebase ID token

### Database Integration

- Uses Prisma ORM with PostgreSQL
- Follows the existing schema structure
- Includes proper error handling and validation

### Response Format

- Consistent JSON responses with `message` field
- Proper HTTP status codes
- Structured error responses

## API Endpoints

### Create Report

```
POST /api/reports
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "name": "My Report Name"
}
```

**Response (201 Created):**

```json
{
  "message": "Report created successfully",
  "report": {
    "id": 1,
    "name": "My Report Name",
    "owner": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2025-06-13T12:00:00.000Z",
    "updatedAt": "2025-06-13T12:00:00.000Z"
  }
}
```

### Get Reports

```
GET /api/reports
Authorization: Bearer <firebase-id-token>
```

**Response (200 OK):**

```json
{
  "message": "Reports retrieved successfully",
  "reports": [
    {
      "id": 1,
      "name": "My Report Name",
      "owner": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "categoriesCount": 0,
      "expensesCount": 0,
      "createdAt": "2025-06-13T12:00:00.000Z",
      "updatedAt": "2025-06-13T12:00:00.000Z"
    }
  ]
}
```

## Error Handling

The API returns consistent error responses:

### 400 Bad Request

```json
{
  "error": "Bad Request",
  "message": "Report name is required"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authorization header"
}
```

### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "User not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "Failed to create report"
}
```

## Testing

Use the test file to understand how to interact with the API:

```bash
node tests/test-reports.js
```

Or test manually with curl:

```bash
# Create a report
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{"name": "My Test Report"}'

# Get all reports
curl -X GET http://localhost:3000/api/reports \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

## Next Steps

This implementation provides the foundation for the reports feature. Future enhancements could include:

1. Report filtering and pagination
2. Report sharing and permissions
3. Report analytics and summaries
4. Bulk operations
5. Report templates
