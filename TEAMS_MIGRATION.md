# Teams Migration Guide

This document explains how to migrate your Supabase database to support multi-tenancy with teams.

## Overview

The migration adds team support to enable multiple users to collaborate on quotes, customers, and service presets. Each user automatically gets their own team when they sign up, and team owners can invite other users to join their team.

## Migration Steps

### 1. Run the Migration Script

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase-migration-teams.sql`
4. Click **Run** to execute the migration

**⚠️ Important:** This migration will:
- Create new tables (`teams`, `team_members`)
- Add `team_id` columns to existing tables
- Migrate all existing data to use teams
- Update all RLS policies
- Create helper functions

### 2. What the Migration Does

#### Creates New Tables
- **`teams`**: Stores team information (id, name, created_at)
- **`team_members`**: Links users to teams with roles (owner/member)

#### Modifies Existing Tables
- Adds `team_id` to `customers`, `quotes`, and `service_presets`
- All existing data is automatically migrated to use teams

#### Data Backfill
- For each existing user:
  - Creates a team named after their company (or "My Team" if no company name)
  - Adds the user as the team owner
  - Updates all their customers, quotes, and presets to use the new team_id

#### Updates RLS Policies
- Old policies: `user_id = auth.uid()`
- New policies: User can access data if they're a member of the team that owns it

#### Creates Helper Functions
- `get_user_teams()`: Returns all teams a user belongs to
- `get_user_primary_team()`: Returns the user's primary team (first owned team, or first member team)

### 3. Frontend Changes Required

After running the migration, you'll need to update your frontend code to:

1. **Fetch the user's team_id** before creating quotes/customers/presets
2. **Include team_id** in all INSERT operations
3. **Use the helper functions** from `src/lib/supabase/teams.ts`

#### Example: Creating a Quote

**Before:**
```typescript
const { data, error } = await supabase
  .from('quotes')
  .insert({
    user_id: user.id,
    customer_id: customerId,
    // ... other fields
  })
```

**After:**
```typescript
// Get user's primary team
const teamId = await getUserPrimaryTeam()
if (!teamId) throw new Error('No team found')

const { data, error } = await supabase
  .from('quotes')
  .insert({
    user_id: user.id,
    team_id: teamId, // Add team_id
    customer_id: customerId,
    // ... other fields
  })
```

### 4. Updated TypeScript Types

The types in `src/lib/types.ts` have been updated to include:
- `Team` interface
- `TeamMember` interface
- `team_id` fields added to `Customer`, `Quote`, and `ServicePreset`

### 5. Testing the Migration

After running the migration, verify:

1. **All users have teams:**
   ```sql
   SELECT u.id, u.company_name, t.id as team_id, t.name as team_name
   FROM users u
   LEFT JOIN team_members tm ON u.id = tm.user_id
   LEFT JOIN teams t ON tm.team_id = t.id
   WHERE tm.role = 'owner';
   ```

2. **All data has team_id:**
   ```sql
   SELECT COUNT(*) as null_team_ids FROM customers WHERE team_id IS NULL;
   SELECT COUNT(*) as null_team_ids FROM quotes WHERE team_id IS NULL;
   SELECT COUNT(*) as null_team_ids FROM service_presets WHERE team_id IS NULL;
   ```
   All should return 0.

3. **RLS policies work:**
   - Log in as a user and verify they can see their own data
   - Verify they cannot see data from other teams

## Rollback (If Needed)

If you need to rollback this migration, you would need to:

1. Restore the old RLS policies (check git history)
2. Remove `team_id` columns (after setting them to NULL)
3. Drop the new tables and functions

**⚠️ Warning:** Rolling back will lose team membership data. Only do this if absolutely necessary.

## Next Steps

After migration:
1. Update all INSERT operations to include `team_id`
2. Consider adding a team selector UI for users who belong to multiple teams
3. Add team invitation functionality
4. Update the dashboard to show team-based stats

## Helper Functions

### Server-Side (TypeScript)
```typescript
import { getUserPrimaryTeam, getUserTeams } from '@/lib/supabase/teams'

// Get user's primary team
const teamId = await getUserPrimaryTeam()

// Get all teams user belongs to
const teams = await getUserTeams()
```

### SQL Functions
```sql
-- Get all teams for current user
SELECT * FROM get_user_teams();

-- Get primary team ID
SELECT get_user_primary_team();
```

