# 📊 Fintech Risk Profile Data Collection Setup

This document explains the database schema enhancements for collecting operational data to build risk profiles for potential lending/fintech features.

---

## 🎯 Overview

The migration adds four key components:

1. **Granular Status Logging** (`job_activity_logs`) - Tracks every lifecycle event
2. **Quote Item Classification** (`item_type` enum) - Materials vs Labor tracking
3. **Metric Aggregation** (`team_fintech_metrics`) - Calculated performance data
4. **Soft KYC Data** (`teams` table) - Entity verification fields

---

## 📋 Migration File

**File**: `supabase-migration-fintech-risk-profiles.sql`

**To Run**:
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the entire migration file
3. Click "Run"
4. Verify all tables and columns were created successfully

---

## 🗄️ Database Schema Changes

### 1. Job Activity Logs Table (`job_activity_logs`)

**Purpose**: Track every lifecycle event for quotes (and future jobs/invoices) - the "black box" recorder.

**Key Fields**:
- `entity_type`: 'quote', 'job', or 'invoice'
- `entity_id`: UUID of the entity
- `previous_status`: Previous status (null for initial)
- `new_status`: New status after change
- `changed_by`: User ID who made the change
- `metadata`: JSONB for additional context (reschedule reason, location coords, etc.)

**Automatic Trigger**: 
- Automatically logs every quote status change via database trigger
- No code changes needed - works automatically!

**Example Use Cases**:
- Track how fast quotes are accepted (velocity)
- Track cancellation patterns (reliability)
- Track reschedule reasons (reliability)

---

### 2. Quote Item Classification (`item_type` enum)

**Purpose**: Classify line items as labor, materials, service, or other for risk analysis.

**Added To**:
- `quote_line_items` table
- `invoice_items` table (if exists)

**Enum Values**:
- `'labor'` - Labor/work hours
- `'materials'` - Physical materials/products
- `'service'` - Service calls (default)
- `'other'` - Other items

**Default**: `'service'` (backwards compatible)

**Future UI Enhancement**: 
- UI can default this based on the selected preset
- Users can manually override
- Helps calculate materials vs labor ratios for risk scoring

---

### 3. Team Fintech Metrics Table (`team_fintech_metrics`)

**Purpose**: Store aggregated performance metrics calculated from activity logs.

**Key Metrics**:
- `avg_quote_to_job_hours`: Speed of closing deals (quote sent → accepted)
- `avg_job_completion_hours`: Speed of doing work (job start → completion)
- `cancellation_rate`: Percentage of quotes/jobs cancelled (0.0 to 1.0)
- `on_time_completion_rate`: Percentage of jobs completed on time (0.0 to 1.0)
- `avg_response_time_hours`: Average time to respond to inquiries

**Calculation Function**: 
- `calculate_team_fintech_metrics(team_id)` - Call periodically via cron or API
- Updates metrics automatically

**Usage**:
```sql
-- Calculate metrics for a team
SELECT public.calculate_team_fintech_metrics('team-uuid-here');

-- View metrics
SELECT * FROM public.team_fintech_metrics WHERE team_id = 'team-uuid-here';
```

---

### 4. KYC Fields on Teams Table

**Purpose**: Store entity verification data for future KYC/fintech features.

**New Fields**:
- `entity_type`: 'LLC', 'Sole Prop', 'Corp', 'Partnership', 'Other'
- `ein_verified`: Boolean - Whether EIN has been verified
- `website_url`: Company website URL
- `established_date`: Date business was established

**Usage**: 
- Can be populated via admin UI or API
- Used for risk scoring and verification

---

## 🔒 Security (RLS Policies)

All new tables have Row Level Security (RLS) enabled:

- **`job_activity_logs`**: Team members can view logs for their team's quotes/jobs
- **`team_fintech_metrics`**: Team members can view their team's metrics
- System functions can insert/update (via SECURITY DEFINER)

---

## 📊 TypeScript Types

Updated `src/lib/types.ts` with:

1. **`JobActivityLog`** interface
2. **`TeamFintechMetrics`** interface
3. **`QuoteLineItem.item_type`** field
4. **`InvoiceItem.item_type`** field
5. **`Team`** KYC fields (entity_type, ein_verified, website_url, established_date)

---

## 🚀 Usage Examples

### Query Activity Logs

```typescript
// Get all status changes for a quote
const { data } = await supabase
  .from('job_activity_logs')
  .select('*')
  .eq('entity_type', 'quote')
  .eq('entity_id', quoteId)
  .order('created_at', { ascending: true })
```

### Calculate Team Metrics

```sql
-- Via SQL
SELECT public.calculate_team_fintech_metrics('team-uuid');

-- Via API (create an API route)
-- POST /api/fintech/calculate-metrics
```

### Update Item Type

```typescript
// When creating/updating a quote line item
await supabase
  .from('quote_line_items')
  .update({ item_type: 'labor' })
  .eq('id', itemId)
```

### Update KYC Data

```typescript
// Update team KYC fields
await supabase
  .from('teams')
  .update({
    entity_type: 'LLC',
    ein_verified: true,
    website_url: 'https://example.com',
    established_date: '2020-01-15'
  })
  .eq('id', teamId)
```

---

## 🔄 Automatic Data Collection

### Quote Status Changes

**Automatic**: Every time a quote's `status` changes, a log entry is automatically created via database trigger.

**No Code Changes Needed**: The trigger runs automatically on any UPDATE to the `quotes` table.

**Example Flow**:
1. Quote created with status 'draft' → No log (initial state)
2. Quote updated to 'sent' → Log entry created
3. Quote updated to 'accepted' → Log entry created
4. Quote updated to 'declined' → Log entry created

### Initial Log Entries

The migration creates initial log entries for all existing quotes with their current status. This establishes baseline data.

---

## 📈 Risk Profile Metrics

### Velocity Metrics

- **Quote-to-Job Speed**: Time from quote sent to accepted
- **Job Completion Speed**: Time from job start to completion (when jobs table exists)

### Reliability Metrics

- **Cancellation Rate**: % of quotes/jobs cancelled
- **On-Time Completion Rate**: % of jobs completed on time
- **Response Time**: Average time to respond to customer inquiries

### Financial Metrics (Future)

- **Materials vs Labor Ratio**: Calculated from `item_type` classification
- **Average Job Value**: From quotes/invoices
- **Payment Velocity**: Time from invoice sent to paid

---

## 🔮 Future Enhancements

### When Jobs Table is Added

1. Update `job_activity_logs` trigger to also track job status changes
2. Update `calculate_team_fintech_metrics()` to calculate job completion metrics
3. Add job-specific metadata (location, weather, etc.)

### UI Enhancements

1. **Item Type Selection**: Add dropdown in quote builder to select item type
2. **Preset Defaults**: Set default `item_type` based on preset selection
3. **Metrics Dashboard**: Show team metrics to owners
4. **KYC Form**: Add form in settings to collect entity verification data

### API Endpoints (Future)

```typescript
// Calculate metrics for all teams (cron job)
POST /api/fintech/calculate-all-metrics

// Get risk profile for a team
GET /api/fintech/risk-profile/:teamId

// Update KYC data
PUT /api/fintech/kyc/:teamId
```

---

## ✅ Verification Checklist

After running the migration:

- [ ] `job_activity_logs` table exists
- [ ] `team_fintech_metrics` table exists
- [ ] `item_type` column added to `quote_line_items`
- [ ] `item_type` column added to `invoice_items` (if table exists)
- [ ] KYC fields added to `teams` table
- [ ] Trigger `trigger_log_quote_status_change` exists
- [ ] Function `calculate_team_fintech_metrics` exists
- [ ] RLS policies enabled on new tables
- [ ] Initial log entries created for existing quotes
- [ ] TypeScript types updated

---

## 🧪 Testing

### Test Quote Status Logging

```sql
-- Update a quote status and verify log entry
UPDATE public.quotes SET status = 'sent' WHERE id = 'quote-uuid';
SELECT * FROM public.job_activity_logs WHERE entity_id = 'quote-uuid' ORDER BY created_at;
```

### Test Metrics Calculation

```sql
-- Calculate metrics for a team
SELECT public.calculate_team_fintech_metrics('team-uuid');

-- View calculated metrics
SELECT * FROM public.team_fintech_metrics WHERE team_id = 'team-uuid';
```

### Test Item Type

```sql
-- Update a line item type
UPDATE public.quote_line_items SET item_type = 'labor' WHERE id = 'item-uuid';

-- Verify update
SELECT id, label, item_type FROM public.quote_line_items WHERE id = 'item-uuid';
```

---

## 📚 Related Files

- **Migration**: `supabase-migration-fintech-risk-profiles.sql`
- **TypeScript Types**: `src/lib/types.ts`
- **Documentation**: This file (`FINTECH_RISK_PROFILES_SETUP.md`)

---

## 🆘 Troubleshooting

### Issue: Trigger not firing

**Fix**: Verify trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_log_quote_status_change';
```

### Issue: Metrics not calculating

**Fix**: Check function exists and has correct permissions:
```sql
SELECT proname FROM pg_proc WHERE proname = 'calculate_team_fintech_metrics';
```

### Issue: RLS blocking queries

**Fix**: Verify user is a team member:
```sql
SELECT * FROM public.team_members WHERE user_id = auth.uid();
```

---

**Migration Complete!** 🎉

The database is now ready to collect operational data for risk profile analysis.

