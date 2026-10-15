# Pediatric Health Tracker API Specification

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Auth Endpoints

### Register
- **POST** `/auth/register`
- **Request Body**:
  ```json
  {
    "name": "John Parent",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response** (201):
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "John Parent",
      "email": "john@example.com",
      "role": "parent"
    }
  }
  ```
- **Errors**: 400 (missing fields, email exists), 500 (server error)

### Login
- **POST** `/auth/login`
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response** (200): Same as Register
- **Errors**: 400 (invalid credentials), 500 (server error)

### Refresh Token
- **POST** `/auth/refresh`
- **Request Body**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```
- **Response** (200):
  ```json
  {
    "token": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
  ```
- **Errors**: 401 (invalid refresh token), 500

### Forgot Password
- **POST** `/auth/forgot-password`
- **Request Body**:
  ```json
  {
    "email": "john@example.com"
  }
  ```
- **Response** (200):
  ```json
  {
    "msg": "Password reset email sent"
  }
  ```
- **Errors**: 400 (email not found), 500

### Reset Password
- **POST** `/auth/reset-password/:resetToken`
- **Request Body**:
  ```json
  {
    "password": "NewSecurePassword123!"
  }
  ```
- **Response** (200):
  ```json
  {
    "msg": "Password reset successful"
  }
  ```
- **Errors**: 400 (invalid/expired token), 500

---

## Children Endpoints

### Get All Children (for authenticated user)
- **GET** `/children`
- **Auth**: Required
- **Query Params**: Optional
  - `sort`: `createdAt` (default), `firstName`, `dateOfBirth`
  - `order`: `ASC`, `DESC` (default)
- **Response** (200):
  ```json
  [
    {
      "id": 1,
      "firstName": "Emma",
      "lastName": "Parent",
      "dateOfBirth": "2020-05-15T00:00:00Z",
      "gender": "female",
      "bloodType": "O+",
      "allergies": [{"name": "Peanuts", "severity": "severe"}],
      "medications": [],
      "notes": "Healthy child",
      "userId": 1,
      "createdAt": "2024-11-01T10:00:00Z",
      "updatedAt": "2024-11-01T10:00:00Z"
    }
  ]
  ```
- **Errors**: 401 (not authenticated), 500

### Create Child
- **POST** `/children`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "firstName": "Emma",
    "lastName": "Parent",
    "dateOfBirth": "2020-05-15",
    "gender": "female",
    "bloodType": "O+",
    "allergies": [{"name": "Peanuts", "severity": "severe"}],
    "medications": [],
    "notes": "Healthy child"
  }
  ```
- **Response** (201): Created child object (same as Get All Children)
- **Errors**: 400 (validation error), 401, 500

### Get Child by ID
- **GET** `/children/:childId`
- **Auth**: Required
- **Response** (200): Child object
- **Errors**: 403 (not owner), 404 (not found), 401, 500

### Update Child
- **PUT** `/children/:childId`
- **Auth**: Required
- **Request Body**: Any field from Create (partial update allowed)
- **Response** (200): Updated child object
- **Errors**: 403 (not owner), 404, 400, 401, 500

### Delete Child
- **DELETE** `/children/:childId`
- **Auth**: Required
- **Response** (200):
  ```json
  {
    "msg": "Child deleted successfully"
  }
  ```
- **Errors**: 403 (not owner), 404, 401, 500

---

## Health Records Endpoints

### Create Health Record
- **POST** `/health`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "childId": 1,
    "type": "growth",
    "height": 105.5,
    "weight": 18.2,
    "headCircumference": 52.0,
    "bmi": 16.4,
    "vaccination": null,
    "dateAdministered": "2024-11-15",
    "notes": "Regular checkup"
  }
  ```
- **Response** (201): Health record object
- **Errors**: 400 (validation, missing childId), 403 (not owner), 404, 401, 500

### Get Health Records for Child
- **GET** `/health?childId=1`
- **Auth**: Required
- **Query Params**:
  - `childId` (required)
  - `type`: `growth`, `vaccination`, `visit`, `med` (optional filter)
  - `startDate`: ISO format (optional)
  - `endDate`: ISO format (optional)
  - `limit`: 50 (default)
  - `offset`: 0 (default)
- **Response** (200):
  ```json
  {
    "records": [
      {
        "id": 1,
        "childId": 1,
        "type": "growth",
        "height": 105.5,
        "weight": 18.2,
        "headCircumference": 52.0,
        "bmi": 16.4,
        "vaccination": null,
        "dateAdministered": "2024-11-15T00:00:00Z",
        "notes": "Regular checkup",
        "recordedBy": 1,
        "createdAt": "2024-11-15T10:00:00Z",
        "updatedAt": "2024-11-15T10:00:00Z"
      }
    ],
    "total": 45,
    "limit": 50,
    "offset": 0
  }
  ```
- **Errors**: 400 (missing childId), 403 (not owner), 401, 500

### Get Health Record by ID
- **GET** `/health/:recordId`
- **Auth**: Required
- **Response** (200): Health record object
- **Errors**: 403 (not owner), 404, 401, 500

### Update Health Record
- **PUT** `/health/:recordId`
- **Auth**: Required
- **Request Body**: Any field (partial update allowed)
- **Response** (200): Updated health record
- **Errors**: 403 (not owner), 404, 400, 401, 500

### Delete Health Record
- **DELETE** `/health/:recordId`
- **Auth**: Required
- **Response** (200):
  ```json
  {
    "msg": "Health record deleted successfully"
  }
  ```
- **Errors**: 403 (not owner), 404, 401, 500

---

## Vaccination Endpoints

### Get Vaccinations for Child
- **GET** `/vaccinations?childId=1`
- **Auth**: Required
- **Query Params**:
  - `childId` (required)
  - `status`: `pending`, `administered`, `missed` (optional)
- **Response** (200):
  ```json
  [
    {
      "id": 1,
      "childId": 1,
      "name": "DPT",
      "dueDate": "2024-12-01T00:00:00Z",
      "administeredDate": null,
      "status": "pending",
      "notes": "First dose",
      "createdAt": "2024-11-01T00:00:00Z",
      "updatedAt": "2024-11-01T00:00:00Z"
    }
  ]
  ```
- **Errors**: 400 (missing childId), 403, 401, 500

### Create Vaccination
- **POST** `/vaccinations`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "childId": 1,
    "name": "DPT",
    "dueDate": "2024-12-01",
    "status": "pending",
    "notes": "First dose"
  }
  ```
- **Response** (201): Vaccination object
- **Errors**: 400, 403, 404, 401, 500

### Update Vaccination Status
- **PUT** `/vaccinations/:vaccinationId`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "status": "administered",
    "administeredDate": "2024-12-01"
  }
  ```
- **Response** (200): Updated vaccination
- **Errors**: 403, 404, 400, 401, 500

---

## AI Prediction Endpoints

### Predict Growth Anomaly
- **POST** `/ai/predict/growth`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "childId": 1,
    "age_months": 24,
    "height_cm": 90.0,
    "weight_kg": 14.0,
    "gender": "female"
  }
  ```
- **Response** (200):
  ```json
  {
    "prediction": {
      "height_percentile": 60,
      "weight_percentile": 55,
      "anomaly_detected": false,
      "confidence": 0.92,
      "recommendations": ["Continue current growth trend monitoring"]
    },
    "model_version": "v1.0"
  }
  ```
- **Errors**: 400 (validation), 403, 401, 500

---

## Error Response Format

All error responses follow this format:
```json
{
  "msg": "Error message",
  "error": "Optional detailed error object",
  "code": "ERROR_CODE"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (not owner of resource) |
| 404 | Not Found |
| 409 | Conflict (email exists, etc.) |
| 500 | Internal Server Error |

---

## Pagination

Endpoints that return lists support pagination:
- `limit`: number of results (default 50, max 200)
- `offset`: starting position (default 0)
- Response includes: `total`, `limit`, `offset`

## Filtering & Sorting

- Endpoints support optional `sort` and `order` params where applicable
- Date filters use ISO 8601 format: `2024-11-15`

