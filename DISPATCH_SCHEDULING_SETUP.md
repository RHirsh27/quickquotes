# 📅 Dispatch & Scheduling Module Setup

This document explains the database schema for the Dispatch & Scheduling module, which enables service location management, job tracking, and appointment scheduling.

---

## 🎯 Overview

The migration adds three core tables:

1. **Service Locations** - Multiple locations per customer (home, office, rental properties)
2. **Jobs** - Work orders/work assignments with status tracking
3. **Appointments** - Scheduled time slots with assigned technicians

---

## 📋 Migration File

**File**: `supabase-migration-dispatch-scheduling.sql`

**To Run**:
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the entire migration file
3. Click "Run"
4. Verify all tables were created successfully

**Prerequisites**:
- Teams migration must be run first (`supabase-migration-teams.sql`)
- Customers table must exist
- (Optional) Fintech migration for job activity logging integration

---

## 🗄️ Database Schema

### 1. Service Locations Table (`service_locations`)

**Purpose**: Store multiple service locations for each customer (e.g., home, office, rental property).

**Key Fields**:
- `customer_id`: Links to customer
- `team_id`: For RLS (team-based access)
- `address_line_1`, `address_line_2`, `city`, `state`, `postal_code`: Full address
- `gate_code`: Gate or access code
- `access_instructions`: Additional access instructions
- `is_primary`: Mark primary location for customer

**Example Use Cases**:
- Customer has home and office locations
- Track gate codes for gated communities
- Store access instructions (e.g., "Use side gate, code is 1234")

---

### 2. Jobs Table (`jobs`)

**Purpose**: Work orders/work assignments for customers. Can be created from quotes or independently.

**Key Fields**:
- `team_id`: Team that owns the job (for RLS)
- `customer_id`: Customer for whom the job is being performed
- `service_location_id`: Specific location where job will be performed
- `quote_id`: Optional link to quote if job was converted from a quote
- `title`: Job title/name
- `description`: Detailed job description
- `status`: 'pending', 'scheduled', 'in_progress', 'completed', 'canceled'
- `priority`: 'low', 'normal', 'high', 'urgent'
- `estimated_duration_minutes`: Estimated time to complete
- `actual_duration_minutes`: Actual time taken (filled after completion)
- `scheduled_start`, `scheduled_end`: When job is scheduled
- `completed_at`, `canceled_at`: Timestamps for completion/cancellation

**Status Flow**:
```
pending → scheduled → in_progress → completed
                ↓
            canceled
```

**Example Use Cases**:
- Convert accepted quote to a job
- Create job independently (emergency call)
- Track job progress through status changes
- Measure actual vs estimated duration

---

### 3. Appointments Table (`appointments`)

**Purpose**: Scheduled time slots for jobs with assigned technicians.

**Key Fields**:
- `job_id`: Job this appointment is for
- `assigned_tech`: Technician assigned to the appointment
- `start_time`, `end_time`: Appointment time window
- `status`: 'confirmed', 'tentative', 'completed', 'canceled', 'no_show'
- `hold_expires_at`: When tentative hold expires (for soft hold logic)
- `notes`: Additional notes for the appointment

**Status Types**:
- `tentative`: Soft hold (expires at `hold_expires_at`)
- `confirmed`: Confirmed appointment
- `completed`: Appointment finished
- `canceled`: Appointment canceled
- `no_show`: Customer didn't show up

**Example Use Cases**:
- Schedule technician for specific time slot
- Hold time slot tentatively (expires if not confirmed)
- Track technician availability
- Handle no-shows

---

## 🔒 Security (RLS Policies)

All tables have Row Level Security (RLS) enabled with team-based access:

### Service Locations
- Team members can view/edit locations for their team's customers
- Validates that location belongs to team's customer

### Jobs
- Team members can view/edit jobs for their team
- Validates customer and service location belong to team

### Appointments
- Team members can view/edit appointments for their team's jobs
- Validates assigned technician is a team member

---

## 🔗 Relationships

```
Customer
  ├── Service Locations (1 to many)
  └── Jobs (1 to many)
      ├── Quote (optional, 1 to 1)
      └── Appointments (1 to many)
          └── Assigned Tech (User, many to 1)
```

---

## 📊 TypeScript Types

Updated `src/lib/types.ts` with:

1. **`ServiceLocation`** interface
2. **`Job`** interface
3. **`Appointment`** interface

All types include proper TypeScript types for status enums and nullable fields.

---

## 🚀 Usage Examples

### Create Service Location

```typescript
const { data, error } = await supabase
  .from('service_locations')
  .insert({
    customer_id: customerId,
    team_id: teamId,
    address_line_1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    postal_code: '12345',
    gate_code: '1234',
    is_primary: true
  })
```

### Create Job from Quote

```typescript
const { data, error } = await supabase
  .from('jobs')
  .insert({
    team_id: teamId,
    customer_id: customerId,
    service_location_id: locationId,
    quote_id: quoteId, // Link to original quote
    title: 'Plumbing Repair',
    description: 'Fix leaky faucet in kitchen',
    status: 'pending',
    priority: 'normal',
    estimated_duration_minutes: 60,
    created_by: userId
  })
```

### Create Appointment

```typescript
const { data, error } = await supabase
  .from('appointments')
  .insert({
    job_id: jobId,
    assigned_tech: techUserId,
    start_time: '2024-12-15T09:00:00Z',
    end_time: '2024-12-15T10:00:00Z',
    status: 'tentative',
    hold_expires_at: '2024-12-14T17:00:00Z' // Expires tomorrow at 5 PM
  })
```

### Query Jobs with Related Data

```typescript
const { data, error } = await supabase
  .from('jobs')
  .select(`
    *,
    customers (*),
    service_locations (*),
    quotes (*),
    appointments (*)
  `)
  .eq('team_id', teamId)
  .eq('status', 'scheduled')
```

### Update Job Status

```typescript
const { error } = await supabase
  .from('jobs')
  .update({
    status: 'in_progress',
    updated_at: new Date().toISOString()
  })
  .eq('id', jobId)
```

---

## 🔄 Automatic Features

### Updated Timestamps

All tables have `updated_at` triggers that automatically update the timestamp on any UPDATE operation.

### Job Status Logging (If Fintech Migration Exists)

If you've run the fintech migration (`supabase-migration-fintech-risk-profiles.sql`), job status changes are automatically logged to `job_activity_logs` table for risk profile analysis.

---

## 📈 Future Enhancements

### UI Features

1. **Service Location Management**:
   - Add/edit locations in customer profile
   - Mark primary location
   - Quick select location when creating job

2. **Job Management**:
   - Convert quote to job
   - Job status board (Kanban view)
   - Job timeline/history
   - Duration tracking

3. **Appointment Scheduling**:
   - Calendar view for technicians
   - Drag-and-drop scheduling
   - Conflict detection
   - Soft hold management
   - SMS/Email reminders

### API Endpoints (Future)

```typescript
// Get available time slots for a technician
GET /api/scheduling/availability?techId=xxx&date=2024-12-15

// Create appointment with conflict check
POST /api/scheduling/appointments

// Convert quote to job
POST /api/jobs/from-quote/:quoteId

// Get jobs for calendar view
GET /api/jobs/calendar?startDate=xxx&endDate=xxx
```

---

## ✅ Verification Checklist

After running the migration:

- [ ] `service_locations` table exists
- [ ] `jobs` table exists
- [ ] `appointments` table exists
- [ ] All indexes created
- [ ] RLS enabled on all tables
- [ ] RLS policies created
- [ ] `updated_at` triggers working
- [ ] Job status logging trigger created (if fintech migration exists)
- [ ] TypeScript types updated

---

## 🧪 Testing

### Test Service Location Creation

```sql
-- Insert test location
INSERT INTO public.service_locations (customer_id, team_id, address_line_1, city, state, postal_code, is_primary)
VALUES ('customer-uuid', 'team-uuid', '123 Test St', 'Test City', 'CA', '12345', true);

-- Verify
SELECT * FROM public.service_locations WHERE customer_id = 'customer-uuid';
```

### Test Job Creation

```sql
-- Insert test job
INSERT INTO public.jobs (team_id, customer_id, title, status, priority)
VALUES ('team-uuid', 'customer-uuid', 'Test Job', 'pending', 'normal');

-- Verify
SELECT * FROM public.jobs WHERE team_id = 'team-uuid';
```

### Test Appointment Creation

```sql
-- Insert test appointment
INSERT INTO public.appointments (job_id, assigned_tech, start_time, end_time, status)
VALUES (
  'job-uuid',
  'tech-user-uuid',
  '2024-12-15 09:00:00+00',
  '2024-12-15 10:00:00+00',
  'tentative'
);

-- Verify
SELECT * FROM public.appointments WHERE job_id = 'job-uuid';
```

---

## 🆘 Troubleshooting

### Issue: RLS blocking queries

**Fix**: Verify user is a team member:
```sql
SELECT * FROM public.team_members WHERE user_id = auth.uid();
```

### Issue: Foreign key constraint fails

**Fix**: Ensure referenced records exist:
- Customer must exist before creating service location
- Job must exist before creating appointment
- Team must exist before creating job

### Issue: Appointment time conflict

**Fix**: Add application-level conflict checking:
```typescript
// Check for overlapping appointments
const { data } = await supabase
  .from('appointments')
  .select('id')
  .eq('assigned_tech', techId)
  .or(`start_time.lte.${endTime},end_time.gte.${startTime}`)
  .neq('status', 'canceled')
```

---

## 📚 Related Files

- **Migration**: `supabase-migration-dispatch-scheduling.sql`
- **TypeScript Types**: `src/lib/types.ts`
- **Documentation**: This file (`DISPATCH_SCHEDULING_SETUP.md`)

---

**Migration Complete!** 🎉

The database is now ready for dispatch and scheduling functionality.

