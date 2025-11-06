# API Architecture & Operations Layer

## Overview
TenderAlert Pro uses a modern serverless architecture with Supabase as the backend platform, providing a complete API layer for all operations.

## Architecture Stack

### Core Components
1. **Frontend**: React + TypeScript (Client-side)
2. **API Layer**: Supabase Edge Functions (Deno runtime)
3. **Database**: PostgreSQL with Row-Level Security
4. **Storage**: Supabase Storage (S3-compatible)
5. **Authentication**: Supabase Auth (JWT-based)
6. **Real-time**: Supabase Subscriptions (WebSockets)

## API Layers

### 1. Auto-Generated REST API
**Provider**: Supabase PostgREST

Every database table automatically gets REST endpoints:
```
GET    /rest/v1/tenders              # List tenders
GET    /rest/v1/tenders?id=eq.1      # Get single tender
POST   /rest/v1/tenders              # Create tender
PATCH  /rest/v1/tenders?id=eq.1      # Update tender
DELETE /rest/v1/tenders?id=eq.1      # Delete tender
```

**Features**:
- Automatic CRUD operations
- Query parameters for filtering
- Pagination support
- Full-text search
- Complex joins and aggregations
- RLS policy enforcement

**Client Implementation**:
```typescript
import { supabase } from '@/integrations/supabase/client';

// Fetch tenders with filters
const { data, error } = await supabase
  .from('tenders')
  .select('*, ai_analyses(*)')
  .eq('status', 'active')
  .gte('deadline', new Date().toISOString())
  .order('publish_date', { ascending: false })
  .limit(20);
```

### 2. Edge Functions (Custom Business Logic)

**Location**: `supabase/functions/`

#### Implemented Functions

##### a) **tender-scraper**
- **Purpose**: Scrape tenders from government websites
- **Endpoint**: `/functions/v1/tender-scraper`
- **Method**: POST
- **Auth**: JWT not required (internal use)
- **Triggers**: Manual, scheduled, webhook

**Request**:
```json
{
  "source": "tenders.go.ke",
  "category": "construction",
  "limit": 100
}
```

**Response**:
```json
{
  "success": true,
  "scraped": 45,
  "inserted": 42,
  "updated": 3,
  "errors": 0
}
```

##### b) **automated-scraper**
- **Purpose**: Scheduled tender scraping
- **Endpoint**: `/functions/v1/automated-scraper`
- **Schedule**: Daily at 2 AM (pg_cron)
- **Auth**: JWT not required (cron trigger)

##### c) **manual-scraper-trigger**
- **Purpose**: Admin-triggered scraping
- **Endpoint**: `/functions/v1/manual-scraper-trigger`
- **Auth**: Admin role required
- **Usage**: Admin dashboard button

##### d) **ai-tender-analysis**
- **Purpose**: AI analysis of tenders
- **Endpoint**: `/functions/v1/ai-tender-analysis`
- **Method**: POST
- **Auth**: JWT required

**Request**:
```json
{
  "tender_id": 123,
  "user_context": {
    "industry": "construction",
    "experience_years": 5,
    "average_bid": 50000000
  }
}
```

**Response**:
```json
{
  "tender_id": 123,
  "estimated_value_min": 45000000,
  "estimated_value_max": 55000000,
  "win_probability": 72,
  "confidence_score": 85,
  "recommendations": [
    "Your experience aligns well with this tender",
    "Budget is within your range",
    "Consider partnering for technical capacity"
  ],
  "analysis_data": { /* detailed analysis */ }
}
```

##### e) **tender-similarity-analysis**
- **Purpose**: Find similar tenders
- **Endpoint**: `/functions/v1/tender-similarity-analysis`
- **Method**: POST
- **Auth**: JWT required

##### f) **bid-strategy-optimizer**
- **Purpose**: Optimize bidding strategy
- **Endpoint**: `/functions/v1/bid-strategy-optimizer`
- **Method**: POST
- **Auth**: JWT required

##### g) **backup-manager**
- **Purpose**: Automated database backups
- **Endpoint**: `/functions/v1/backup-manager`
- **Schedule**: Daily via cron
- **Auth**: JWT not required (internal)

### 3. Real-time Subscriptions

**Protocol**: WebSockets via Supabase Realtime

```typescript
// Subscribe to new tenders
const subscription = supabase
  .channel('tenders-channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'tenders'
  }, (payload) => {
    console.log('New tender!', payload.new);
    // Update UI
  })
  .subscribe();
```

**Use Cases**:
- Real-time tender alerts
- Live consortium member updates
- RFQ quote notifications
- Admin dashboard live stats

### 4. Storage API

**Buckets**:
- `rfq-documents`: RFQ files and requirements
- `quote-attachments`: Supplier quote files
- `backups`: Database backups

**Operations**:
```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('rfq-documents')
  .upload(`${userId}/requirement.pdf`, file);

// Generate signed URL
const { data } = await supabase.storage
  .from('rfq-documents')
  .createSignedUrl(path, 3600); // 1 hour expiry
```

## Security Architecture

### Authentication Flow
```
1. User logs in → 
2. Supabase Auth generates JWT → 
3. JWT stored in localStorage → 
4. All API requests include JWT in Authorization header → 
5. Edge functions validate JWT → 
6. RLS policies enforce data access
```

### Row-Level Security (RLS)

**Example Policy**:
```sql
-- Users can only see their own saved tenders
CREATE POLICY "Users view own saved tenders"
ON saved_tenders FOR SELECT
USING (auth.uid() = user_id);

-- Anyone can view public tenders
CREATE POLICY "Anyone view tenders"
ON tenders FOR SELECT
USING (true);

-- Admins can manage all data
CREATE POLICY "Admins manage all"
ON tenders FOR ALL
USING (has_role(auth.uid(), 'admin'));
```

### API Rate Limiting

**Current Setup**:
- Supabase default: 100 requests/second
- Edge functions: 500 invocations/second
- Storage: 100 uploads/second

**Future**: Implement custom rate limiting per subscription tier

## Data Flow Patterns

### 1. Tender Discovery Flow
```
User → Frontend → Supabase Client → PostgREST → 
PostgreSQL (RLS check) → Data → Frontend → User
```

### 2. AI Analysis Flow
```
User → Frontend → Edge Function (ai-tender-analysis) → 
AI Model → Analysis → Database → Edge Function → 
Frontend → User
```

### 3. Scraping Flow
```
Cron Job → Edge Function (automated-scraper) → 
External Website → Parse Data → Database → 
Automation Log → Admin Dashboard
```

### 4. Real-time Update Flow
```
Database Change → PostgreSQL Trigger → 
Supabase Realtime → WebSocket → 
Connected Clients → UI Update
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "TENDER_NOT_FOUND",
    "message": "The requested tender does not exist",
    "details": {
      "tender_id": 999,
      "timestamp": "2025-01-27T10:30:00Z"
    }
  }
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid JWT)
- `403`: Forbidden (RLS policy denied)
- `404`: Not Found
- `429`: Too Many Requests (rate limit)
- `500`: Internal Server Error

### Edge Function Error Handling
```typescript
try {
  // Business logic
  const result = await processData(input);
  
  return new Response(
    JSON.stringify({ success: true, data: result }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
} catch (error) {
  console.error('Error:', error);
  
  return new Response(
    JSON.stringify({ 
      error: {
        code: 'PROCESSING_FAILED',
        message: error.message
      }
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

## Performance Optimization

### 1. Database Indexing
```sql
-- Optimize tender queries
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_deadline ON tenders(deadline);
CREATE INDEX idx_tenders_category ON tenders(category);
CREATE INDEX idx_saved_tenders_user ON saved_tenders(user_id);
```

### 2. Query Optimization
- Use `select()` to specify only needed columns
- Implement pagination with `range()`
- Use database functions for complex calculations
- Cache frequently accessed data

### 3. Edge Function Optimization
- Keep functions lightweight
- Use background tasks for long operations
- Implement connection pooling
- Cache external API responses

### 4. Storage Optimization
- Compress images before upload
- Use signed URLs for private files
- Implement CDN for public assets
- Set appropriate cache headers

## Monitoring & Logging

### Available Logs

1. **Edge Function Logs**
   - Access via Supabase Dashboard
   - View in Admin Dashboard
   - Check `automation_logs` table

2. **Database Logs**
   - Query performance
   - RLS policy checks
   - Connection stats

3. **Security Audit Logs**
   - All sensitive operations
   - Table: `security_audit_log`
   - Tracks: user_id, action, table, timestamp

### Monitoring Queries

```sql
-- Check scraper performance
SELECT 
  function_name,
  COUNT(*) as executions,
  AVG(duration_ms) as avg_duration,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failures
FROM automation_logs
WHERE executed_at > NOW() - INTERVAL '7 days'
GROUP BY function_name;

-- Check API usage by user
SELECT 
  user_id,
  table_name,
  action_type,
  COUNT(*) as requests
FROM security_audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, table_name, action_type
ORDER BY requests DESC;
```

## API Versioning

### Current Version: v1
All endpoints are currently v1. Future versions will be:
- `/functions/v2/endpoint-name`
- `/rest/v2/table-name`

### Migration Strategy
- Maintain backward compatibility
- Deprecation warnings (6 months)
- Clear migration guides
- Parallel versions during transition

## Developer Resources

### Testing
```bash
# Test edge function locally
supabase functions serve tender-scraper

# Invoke function
curl -i --location \
  --request POST 'http://localhost:54321/functions/v1/tender-scraper' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"source":"tenders.go.ke"}'
```

### Documentation
- OpenAPI/Swagger spec (TODO)
- Postman collection (TODO)
- SDK for popular languages (Future)

### Support
- Developer portal: docs.tenderalert.co.ke (Planned)
- API status page: status.tenderalert.co.ke (Planned)
- Discord community for developers

## Future Enhancements

1. **GraphQL API**
   - More flexible queries
   - Reduced over-fetching
   - Type-safe client code

2. **Webhook System**
   - Custom event subscriptions
   - Third-party integrations
   - Real-time notifications

3. **API Gateway**
   - Advanced rate limiting
   - Request transformation
   - Analytics and monitoring

4. **SDK Generation**
   - TypeScript SDK
   - Python SDK
   - Mobile SDKs

5. **API Marketplace**
   - Third-party integrations
   - Plugin system
   - Revenue sharing
