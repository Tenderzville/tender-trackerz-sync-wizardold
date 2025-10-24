# TenderAlert Pro - Database Schema Documentation

## Overview
This document provides a comprehensive overview of all database tables, their columns, relationships, and Row-Level Security (RLS) policies in the TenderAlert Pro application.

**Last Updated:** 2025-10-24
**Database:** PostgreSQL 15.x (Supabase)
**Total Tables:** 17

---

## Table of Contents
1. [User Management](#user-management)
2. [Tender Management](#tender-management)
3. [Consortium System](#consortium-system)
4. [Service Providers](#service-providers)
5. [RFQ System](#rfq-system)
6. [Analytics & Tracking](#analytics--tracking)
7. [Security & Audit](#security--audit)

---

## User Management

### profiles
**Purpose:** Stores extended user profile information and subscription details.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | - | Primary key, references auth.users |
| first_name | text | Yes | - | User's first name |
| last_name | text | Yes | - | User's last name |
| email | text | Yes | - | User's email address |
| profile_image_url | text | Yes | - | Profile image URL |
| company | text | Yes | - | Company name |
| phone_number | text | Yes | - | Contact phone number |
| location | text | Yes | - | User location |
| business_type | text | Yes | - | Type of business |
| subscription_type | text | Yes | 'free' | Subscription tier (free/pro) |
| subscription_status | text | Yes | 'active' | Subscription status |
| subscription_start_date | timestamp | Yes | - | Subscription start date |
| subscription_end_date | timestamp | Yes | - | Subscription end date |
| paypal_subscription_id | text | Yes | - | PayPal subscription ID |
| referral_code | text | Yes | - | User's referral code |
| referred_by | text | Yes | - | Referrer's code |
| is_early_user | boolean | Yes | false | Early adopter flag |
| loyalty_points | integer | Yes | 0 | Loyalty program points |
| twitter_followed | boolean | Yes | false | Twitter follow status |
| total_referrals | integer | Yes | 0 | Number of successful referrals |
| created_at | timestamptz | Yes | now() | Record creation timestamp |
| updated_at | timestamptz | Yes | now() | Last update timestamp |

**RLS Policies:**
- `Users can insert their own profile` - Users can create their profile (INSERT)
- `Users can update their own profile` - Users can modify their profile (UPDATE)
- `Users can view own profile only` - Users can only see their own profile (SELECT)

**Relationships:**
- `id` references `auth.users(id)` (Supabase Auth)

**Security Triggers:**
- `profiles_audit_trigger` - Logs all INSERT/UPDATE/DELETE operations

---

### user_roles
**Purpose:** Manages user roles for role-based access control (RBAC).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | User reference |
| role | app_role | No | - | Enum: admin, moderator, user |
| created_at | timestamptz | Yes | now() | Role assignment date |

**RLS Policies:**
- `Admins can manage roles` - Admins have full control (ALL)
- `Admins can view all roles` - Admins can see all roles (SELECT)
- `Users can view their own roles` - Users see their roles (SELECT)

**Enums:**
```sql
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
```

**Functions:**
```sql
has_role(_user_id uuid, _role app_role) RETURNS boolean
-- Checks if a user has a specific role
```

---

## Tender Management

### tenders
**Purpose:** Stores government and public tender opportunities.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | No | nextval() | Primary key |
| title | varchar | No | - | Tender title |
| description | text | No | - | Tender description |
| organization | varchar | No | - | Issuing organization |
| category | varchar | No | - | Tender category |
| location | varchar | No | - | Tender location |
| budget_estimate | bigint | Yes | - | Estimated budget |
| deadline | date | No | - | Submission deadline |
| publish_date | date | Yes | CURRENT_DATE | Publication date |
| status | varchar | Yes | 'active' | Tender status |
| requirements | text[] | Yes | - | List of requirements |
| documents | text[] | Yes | - | Document URLs |
| contact_email | varchar | Yes | - | Contact email |
| contact_phone | varchar | Yes | - | Contact phone |
| tender_number | varchar | Yes | - | Official tender number |
| source_url | text | Yes | - | Source URL |
| scraped_from | varchar | Yes | - | Scraping source |
| created_at | timestamptz | Yes | now() | Creation timestamp |
| updated_at | timestamptz | Yes | now() | Update timestamp |

**RLS Policies:**
- `Anyone can view tenders` - Public read access (SELECT) ✅ **PUBLIC**
- `Admins can manage tenders` - Admin full control (ALL)

**Indexes:**
- Primary key on `id`
- Consider adding indexes on `category`, `deadline`, `status` for performance

---

### tender_categories
**Purpose:** Categorizes tenders for organization and filtering.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | No | nextval() | Primary key |
| name | varchar | No | - | Category name |
| description | text | Yes | - | Category description |
| created_at | timestamptz | Yes | now() | Creation timestamp |

**RLS Policies:**
- `Anyone can view tender categories` - Public read access (SELECT) ✅ **PUBLIC**
- `Admins can manage tender categories` - Admin full control (ALL)

---

### saved_tenders
**Purpose:** Tracks tenders saved by users for later reference.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | No | nextval() | Primary key |
| user_id | uuid | No | - | User who saved |
| tender_id | integer | No | - | Referenced tender |
| created_at | timestamptz | Yes | now() | Save timestamp |

**RLS Policies:**
- `Users can save tenders` - Users can save (INSERT)
- `Users can unsave their tenders` - Users can remove (DELETE)
- `Users can view their own saved tenders` - Users see saved (SELECT)

**Relationships:**
- `user_id` references users
- `tender_id` references `tenders(id)`

---

### ai_analyses
**Purpose:** Stores AI-generated analysis and insights for tenders.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | No | nextval() | Primary key |
| tender_id | integer | No | - | Analyzed tender |
| estimated_value_min | bigint | Yes | - | Min estimated value |
| estimated_value_max | bigint | Yes | - | Max estimated value |
| win_probability | integer | Yes | - | Win probability % |
| confidence_score | integer | Yes | - | AI confidence score |
| analysis_data | jsonb | Yes | - | Detailed analysis JSON |
| recommendations | text[] | Yes | - | AI recommendations |
| model_version | varchar | Yes | - | AI model version |
| created_at | timestamptz | Yes | now() | Analysis timestamp |

**RLS Policies:**
- `Admins can manage AI analyses` - Admin full control (ALL)
- `Users can view AI analyses for accessible tenders` - Users see analyses (SELECT)

**Relationships:**
- `tender_id` references `tenders(id)`

---

### tender_analytics
**Purpose:** Tracks engagement metrics for tenders.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | No | - | Primary key |
| tender_id | integer | No | - | Referenced tender |
| views_count | integer | Yes | 0 | Number of views |
| saves_count | integer | Yes | 0 | Number of saves |
| applications_count | integer | Yes | 0 | Number of applications |
| last_viewed | timestamptz | Yes | - | Last view timestamp |
| created_at | timestamptz | Yes | now() | Creation timestamp |
| updated_at | timestamptz | Yes | now() | Update timestamp |

**RLS Policies:**
- `Anyone can view tender analytics` - Public read (SELECT) ✅ **PUBLIC**
- `Admins can manage tender analytics` - Admin control (ALL)

---

## Consortium System

### consortiums
**Purpose:** Manages consortium groups for collaborative bidding.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | No | nextval() | Primary key |
| name | varchar | No | - | Consortium name |
| description | text | Yes | - | Consortium description |
| tender_id | integer | Yes | - | Associated tender |
| created_by | uuid | No | - | Creator user ID |
| status | varchar | Yes | 'active' | Consortium status |
| required_skills | text[] | Yes | - | Required skills |
| max_members | integer | Yes | 10 | Maximum members |
| created_at | timestamptz | Yes | now() | Creation timestamp |
| updated_at | timestamptz | Yes | now() | Update timestamp |

**RLS Policies:**
- `Authenticated users can view consortiums` - Auth users read (SELECT) 🔒
- `Authenticated users can create consortiums` - Auth users create (INSERT)
- `Consortium creators can update their consortiums` - Creators update (UPDATE)

**Relationships:**
- `tender_id` references `tenders(id)`
- `created_by` references users

---

### consortium_members
**Purpose:** Tracks membership in consortiums.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | No | nextval() | Primary key |
| consortium_id | integer | No | - | Consortium reference |
| user_id | uuid | No | - | Member user ID |
| role | varchar | Yes | 'member' | Member role |
| expertise | varchar | Yes | - | Member expertise |
| contribution | text | Yes | - | Member contribution |
| joined_at | timestamptz | Yes | now() | Join timestamp |

**RLS Policies:**
- `Anyone can view consortium members` - Public read (SELECT) ✅ **PUBLIC**
- `Users can join consortiums` - Users join (INSERT)
- `Users can leave consortiums` - Users leave (DELETE)
- `Consortium members can update their membership` - Members update (UPDATE)

**Relationships:**
- `consortium_id` references `consortiums(id)`
- `user_id` references users

---

## Service Providers

### service_providers
**Purpose:** Manages service provider profiles and capabilities.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | No | nextval() | Primary key |
| user_id | uuid | No | - | Provider user ID |
| name | varchar | No | - | Provider name |
| email | varchar | No | - | Contact email |
| phone | varchar | Yes | - | Contact phone |
| specialization | varchar | No | - | Specialization area |
| description | text | Yes | - | Provider description |
| experience | integer | Yes | - | Years of experience |
| rating | numeric | Yes | 0.00 | Average rating |
| review_count | integer | Yes | 0 | Number of reviews |
| hourly_rate | integer | Yes | - | Hourly rate |
| availability | varchar | Yes | 'available' | Availability status |
| certifications | text[] | Yes | - | Certifications list |
| portfolio | text[] | Yes | - | Portfolio URLs |
| profile_image | text | Yes | - | Profile image URL |
| website | text | Yes | - | Website URL |
| linkedin | text | Yes | - | LinkedIn URL |
| created_at | timestamptz | Yes | now() | Creation timestamp |
| updated_at | timestamptz | Yes | now() | Update timestamp |

**RLS Policies:**
- `Authenticated users can view service providers` - Auth users read (SELECT) 🔒 **SECURED**
- `Users can create their service provider profile` - Users create (INSERT)
- `Users can update their service provider profile` - Users update (UPDATE)

**Relationships:**
- `user_id` references users

**Security Triggers:**
- `service_providers_audit_trigger` - Logs all operations

**⚠️ Security Note:** This table was previously publicly readable, exposing PII. Now requires authentication.

---

## RFQ System

### rfqs
**Purpose:** Manages Request for Quotation submissions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | No | - | Primary key |
| user_id | uuid | No | - | RFQ creator |
| title | varchar | No | - | RFQ title |
| description | text | No | - | RFQ description |
| category | varchar | No | - | RFQ category |
| location | varchar | No | - | Project location |
| budget_range_min | bigint | Yes | - | Minimum budget |
| budget_range_max | bigint | Yes | - | Maximum budget |
| deadline | date | No | - | Response deadline |
| requirements | text[] | Yes | '{}' | Requirements list |
| documents | text[] | Yes | '{}' | Document URLs |
| preferred_suppliers | uuid[] | Yes | '{}' | Preferred supplier IDs |
| status | varchar | Yes | 'active' | RFQ status |
| tags | text[] | Yes | '{}' | Search tags |
| created_at | timestamptz | Yes | now() | Creation timestamp |
| updated_at | timestamptz | Yes | now() | Update timestamp |

**RLS Policies:**
- `Users can view all RFQs` - All auth users read (SELECT)
- `Users can create their own RFQs` - Users create (INSERT)
- `Users can update their own RFQs` - Users update (UPDATE)
- `Users can delete their own RFQs` - Users delete (DELETE)

**Relationships:**
- `user_id` references users

---

### rfq_quotes
**Purpose:** Manages supplier quotes for RFQs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | No | - | Primary key |
| rfq_id | integer | No | - | Referenced RFQ |
| supplier_id | uuid | No | - | Quote supplier |
| quoted_amount | bigint | No | - | Quoted amount |
| delivery_timeline | varchar | Yes | - | Delivery timeline |
| validity_period | integer | Yes | 30 | Quote validity days |
| proposal_text | text | Yes | - | Proposal details |
| attachments | text[] | Yes | '{}' | Attachment URLs |
| terms_and_conditions | text | Yes | - | Terms and conditions |
| status | varchar | Yes | 'pending' | Quote status |
| submitted_at | timestamptz | Yes | now() | Submission timestamp |
| updated_at | timestamptz | Yes | now() | Update timestamp |

**RLS Policies:**
- `RFQ creators and quote suppliers can view quotes` - Creators and suppliers read (SELECT)
- `Suppliers can create quotes` - Suppliers create (INSERT)
- `Suppliers can update their own quotes` - Suppliers update (UPDATE)
- `Suppliers can delete their own quotes` - Suppliers delete (DELETE)

**Relationships:**
- `rfq_id` references `rfqs(id)`
- `supplier_id` references users

---

## Analytics & Tracking

### version_tracking
**Purpose:** Tracks changes to critical entities for audit trail.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | No | - | Primary key |
| entity_type | varchar | No | - | Entity type (tender/rfq/etc) |
| entity_id | integer | No | - | Entity ID |
| version_number | integer | No | 1 | Version number |
| change_type | varchar | Yes | - | Type of change |
| changed_fields | jsonb | Yes | - | Changed fields JSON |
| changes_summary | text | Yes | - | Summary of changes |
| changed_by | uuid | Yes | - | User who made change |
| created_at | timestamptz | Yes | now() | Change timestamp |

**RLS Policies:**
- `Users can view version tracking for their entities` - Complex policy based on entity type (SELECT)

**Supported Entity Types:**
- tender
- rfq
- profile
- quote
- consortium

---

### automation_logs
**Purpose:** Logs automated task executions (scrapers, backups, etc.).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | No | nextval() | Primary key |
| function_name | varchar | No | - | Function that ran |
| status | varchar | No | 'pending' | Execution status |
| executed_at | timestamptz | No | now() | Execution start time |
| completed_at | timestamptz | Yes | - | Execution end time |
| duration_ms | integer | Yes | - | Duration in milliseconds |
| result_data | jsonb | Yes | - | Result data JSON |
| error_message | text | Yes | - | Error message if failed |

**RLS Policies:**
- `Only admins can view automation logs` - Admin read (SELECT)
- `Admins can manage automation logs` - Admin control (ALL)

---

## Security & Audit

### security_audit_log
**Purpose:** Comprehensive security audit logging for sensitive operations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | Yes | - | User who performed action |
| table_name | varchar | No | - | Table affected |
| record_id | text | Yes | - | Record ID affected |
| action_type | varchar | No | - | Action type (INSERT/UPDATE/DELETE) |
| ip_address | inet | Yes | - | User IP address |
| user_agent | text | Yes | - | User agent string |
| created_at | timestamptz | Yes | now() | Action timestamp |

**RLS Policies:**
- `Admins can manage security audit log` - Admin full control (ALL)

**Monitored Tables:**
- profiles
- service_providers
- (Can be extended to other sensitive tables)

---

### backup_logs
**Purpose:** Tracks database backup operations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | No | - | Primary key |
| backup_type | varchar | No | - | Backup type |
| backup_location | text | No | - | Backup location |
| backup_status | varchar | Yes | 'in_progress' | Backup status |
| file_size | bigint | Yes | - | Backup file size |
| checksum | varchar | Yes | - | File checksum |
| error_message | text | Yes | - | Error message if failed |
| created_at | timestamptz | Yes | now() | Backup start time |
| completed_at | timestamptz | Yes | - | Backup completion time |

**RLS Policies:**
- `Admins can manage backup logs` - Admin full control (ALL)

---

### user_alerts
**Purpose:** Manages user notifications and alerts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | No | nextval() | Primary key |
| user_id | uuid | No | - | Alert recipient |
| type | varchar | No | - | Alert type |
| title | varchar | No | - | Alert title |
| message | text | No | - | Alert message |
| data | jsonb | Yes | - | Additional data JSON |
| is_read | boolean | Yes | false | Read status |
| created_at | timestamptz | Yes | now() | Alert timestamp |

**RLS Policies:**
- `Users can view their own alerts` - Users read own (SELECT)
- `Users can create their own alerts` - Users create (INSERT)
- `Users can update their own alerts` - Users update (UPDATE)
- `Admins can manage user alerts` - Admin control (ALL)

**Relationships:**
- `user_id` references users

---

## Database Functions

### has_role(user_id uuid, role app_role)
**Purpose:** Checks if a user has a specific role.
**Returns:** boolean
**Security:** SECURITY DEFINER

```sql
SELECT has_role(auth.uid(), 'admin'::app_role);
```

### log_security_audit()
**Purpose:** Trigger function to log sensitive operations.
**Returns:** trigger
**Security:** SECURITY DEFINER

Automatically called by triggers on:
- profiles
- service_providers

---

## Security Summary

### Public Tables (No Authentication Required)
✅ tenders - Business opportunities are public
✅ tender_categories - Categories are public
✅ tender_analytics - Analytics are public
✅ consortium_members - Public visibility

### Protected Tables (Authentication Required)
🔒 profiles - Users see only their own
🔒 service_providers - Auth required (PII protection)
🔒 consortiums - Auth required
🔒 rfqs - Auth required
🔒 rfq_quotes - Restricted to relevant parties
🔒 saved_tenders - Users see only their own
🔒 user_alerts - Users see only their own

### Admin-Only Tables
👑 user_roles - Role management
👑 automation_logs - System logs
👑 security_audit_log - Audit trail
👑 backup_logs - Backup management

---

## Performance Considerations

### Recommended Indexes
```sql
-- Tenders table
CREATE INDEX idx_tenders_category ON tenders(category);
CREATE INDEX idx_tenders_deadline ON tenders(deadline);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_location ON tenders(location);

-- Saved tenders (for user queries)
CREATE INDEX idx_saved_tenders_user_id ON saved_tenders(user_id);

-- RFQs
CREATE INDEX idx_rfqs_user_id ON rfqs(user_id);
CREATE INDEX idx_rfqs_status ON rfqs(status);

-- Consortium members
CREATE INDEX idx_consortium_members_consortium_id ON consortium_members(consortium_id);
CREATE INDEX idx_consortium_members_user_id ON consortium_members(user_id);
```

---

## Migration History

| Date | Description |
|------|-------------|
| 2025-10-24 | Security fixes: Service providers and consortiums now require authentication |
| 2025-10-24 | Added security audit logging for profiles and service_providers |
| Earlier | Initial schema creation |

---

## Notes

1. **Authentication:** All user-facing operations require Supabase authentication
2. **Row-Level Security:** RLS is enabled on all tables with appropriate policies
3. **Audit Trail:** Sensitive tables have automatic audit logging
4. **Scalability:** Consider partitioning `automation_logs` and `security_audit_log` as they grow
5. **Backup:** Automated daily backups tracked in `backup_logs`

---

**Document Version:** 1.0
**Maintained By:** Development Team
**Next Review:** 2025-11-24
