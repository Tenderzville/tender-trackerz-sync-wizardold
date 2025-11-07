# API Operations Documentation

This document provides comprehensive documentation for all available API operations in TenderAlert Pro.

## Table of Contents
1. [Tender Operations](#tender-operations)
2. [Profile Operations](#profile-operations)
3. [RFQ Operations](#rfq-operations)
4. [Analytics Operations](#analytics-operations)
5. [Authentication](#authentication)

---

## Authentication

All API endpoints require authentication. Include the user's session token in the Authorization header:

```javascript
const response = await fetch('https://mwggjriyxxknotymfsvp.supabase.co/functions/v1/tender-operations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ operation, data })
});
```

---

## Tender Operations

**Endpoint:** `/functions/v1/tender-operations`

### Create Tender
**Operation:** `create`  
**Required Role:** Admin  
**Request:**
```json
{
  "operation": "create",
  "data": {
    "title": "Road Construction Project",
    "description": "Construction of 10km road",
    "organization": "Kenya Roads Board",
    "category": "Construction",
    "location": "Nairobi",
    "deadline": "2025-12-31",
    "budget_estimate": 10000000,
    "contact_email": "tenders@krb.go.ke",
    "tender_number": "KRB/2025/001"
  }
}
```

### Update Tender
**Operation:** `update`  
**Required Role:** Admin  
**Request:**
```json
{
  "operation": "update",
  "data": {
    "id": 123,
    "status": "closed",
    "deadline": "2025-11-30"
  }
}
```

### Delete Tender
**Operation:** `delete`  
**Required Role:** Admin  
**Request:**
```json
{
  "operation": "delete",
  "data": {
    "id": 123
  }
}
```

### List Tenders
**Operation:** `list`  
**Request:**
```json
{
  "operation": "list",
  "data": {
    "filters": {
      "category": "Construction",
      "status": "active",
      "location": "Nairobi",
      "search": "road"
    },
    "limit": 50,
    "offset": 0
  }
}
```

---

## Profile Operations

**Endpoint:** `/functions/v1/profile-operations`

### Get Profile
**Operation:** `get`  
**Request:**
```json
{
  "operation": "get"
}
```

### Update Profile
**Operation:** `update`  
**Request:**
```json
{
  "operation": "update",
  "data": {
    "first_name": "John",
    "last_name": "Doe",
    "company": "ABC Construction Ltd",
    "phone_number": "+254700000000",
    "location": "Nairobi",
    "business_type": "Construction"
  }
}
```

### Update Subscription
**Operation:** `update-subscription`  
**Request:**
```json
{
  "operation": "update-subscription",
  "data": {
    "subscription_type": "pro",
    "subscription_status": "active",
    "paypal_subscription_id": "I-XXXXXXXXXX"
  }
}
```

### Add Loyalty Points
**Operation:** `add-loyalty-points`  
**Request:**
```json
{
  "operation": "add-loyalty-points",
  "data": {
    "points": 100
  }
}
```

---

## RFQ Operations

**Endpoint:** `/functions/v1/rfq-operations`

### Create RFQ
**Operation:** `create-rfq`  
**Request:**
```json
{
  "operation": "create-rfq",
  "data": {
    "title": "Office Supplies Request",
    "description": "Need office furniture and supplies",
    "category": "Office Supplies",
    "location": "Nairobi",
    "budget_range_min": 50000,
    "budget_range_max": 100000,
    "deadline": "2025-12-31",
    "requirements": ["Desks", "Chairs", "Cabinets"]
  }
}
```

### Update RFQ
**Operation:** `update-rfq`  
**Request:**
```json
{
  "operation": "update-rfq",
  "data": {
    "id": 456,
    "status": "closed",
    "deadline": "2025-11-30"
  }
}
```

### Delete RFQ
**Operation:** `delete-rfq`  
**Request:**
```json
{
  "operation": "delete-rfq",
  "data": {
    "id": 456
  }
}
```

### Submit Quote
**Operation:** `submit-quote`  
**Request:**
```json
{
  "operation": "submit-quote",
  "data": {
    "rfq_id": 456,
    "quoted_amount": 75000,
    "delivery_timeline": "30 days",
    "proposal_text": "We can provide all requested items...",
    "validity_period": 30
  }
}
```

### Update Quote
**Operation:** `update-quote`  
**Request:**
```json
{
  "operation": "update-quote",
  "data": {
    "id": 789,
    "quoted_amount": 72000,
    "proposal_text": "Updated proposal..."
  }
}
```

### Accept Quote
**Operation:** `accept-quote`  
**Request:**
```json
{
  "operation": "accept-quote",
  "data": {
    "quote_id": 789,
    "rfq_id": 456
  }
}
```

### List RFQs
**Operation:** `list-rfqs`  
**Request:**
```json
{
  "operation": "list-rfqs",
  "data": {
    "filters": {
      "my_rfqs": true,
      "category": "Construction",
      "status": "active"
    },
    "limit": 50,
    "offset": 0
  }
}
```

---

## Analytics Operations

**Endpoint:** `/functions/v1/analytics-operations`

### Track Tender View
**Operation:** `track-tender-view`  
**Request:**
```json
{
  "operation": "track-tender-view",
  "data": {
    "tender_id": 123
  }
}
```

### Track Tender Save
**Operation:** `track-tender-save`  
**Request:**
```json
{
  "operation": "track-tender-save",
  "data": {
    "tender_id": 123
  }
}
```

### Get Dashboard Stats
**Operation:** `get-dashboard-stats`  
**Request:**
```json
{
  "operation": "get-dashboard-stats"
}
```

**Response:**
```json
{
  "data": {
    "savedTenders": 15,
    "activeTenders": 234,
    "rfqs": 5,
    "consortiums": 2
  }
}
```

### Get Trending Tenders
**Operation:** `get-trending-tenders`  
**Request:**
```json
{
  "operation": "get-trending-tenders"
}
```

---

## Example Usage

### React/TypeScript Example

```typescript
import { supabase } from '@/integrations/supabase/client';

// Helper function to call edge functions
async function callEdgeFunction(
  functionName: string, 
  operation: string, 
  data?: any
) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `https://mwggjriyxxknotymfsvp.supabase.co/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operation, data })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API call failed');
  }

  return response.json();
}

// Usage examples
async function examples() {
  // List tenders
  const tenders = await callEdgeFunction('tender-operations', 'list', {
    filters: { status: 'active' },
    limit: 10
  });

  // Update profile
  const profile = await callEdgeFunction('profile-operations', 'update', {
    first_name: 'John',
    company: 'ABC Ltd'
  });

  // Create RFQ
  const rfq = await callEdgeFunction('rfq-operations', 'create-rfq', {
    title: 'Office Supplies',
    category: 'Office Supplies',
    deadline: '2025-12-31'
  });

  // Get dashboard stats
  const stats = await callEdgeFunction('analytics-operations', 'get-dashboard-stats');
}
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid operation or data)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `500` - Internal Server Error

---

## Rate Limiting

Currently, there are no rate limits on edge functions, but excessive usage may be throttled. For production use, implement appropriate rate limiting on the client side.

---

## Security Notes

1. All operations require valid authentication
2. Admin operations (tender create/update/delete) require admin role
3. Users can only modify their own data (profiles, RFQs, quotes)
4. All database operations respect Row-Level Security (RLS) policies
5. Sensitive operations are logged in the security audit table

---

## Support

For issues or questions, check:
- Database schema: `DATABASE_SCHEMA.md`
- API architecture: `API_ARCHITECTURE.md`
- Payment systems: `PAYMENT_SYSTEMS.md`
