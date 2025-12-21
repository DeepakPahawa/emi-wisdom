# Fixing Row Level Security (RLS) Error

## The Error
```
Supabase error: {
  code: '42501',
  details: null,
  hint: null,
  message: 'new row violates row-level security policy for table "loan_details"'
}
```

## Why This Happens
The `loan_details` table was created with Row Level Security (RLS) enabled, which requires authentication. Since your app doesn't currently use Supabase authentication, the policy blocks all operations.

## Quick Fix (For Development)

### Option 1: Run the Fix Script (Recommended)

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy the contents from `scripts/fix_loan_details_rls.sql`
4. Paste and click **Run**

This will update the policy to allow operations without authentication.

### Option 2: Manual Fix via Dashboard

1. Go to **Supabase Dashboard** → **Authentication** → **Policies**
2. Find the `loan_details` table
3. Delete the existing policy: `"Allow all operations for authenticated users"`
4. Create a new policy:
   - **Policy Name**: `Allow all operations for everyone`
   - **Policy Command**: `ALL`
   - **USING expression**: `true`
   - **WITH CHECK expression**: `true`
5. Click **Save**

### Option 3: Disable RLS (Not Recommended)

If you want to completely disable RLS (less secure):

```sql
ALTER TABLE loan_details DISABLE ROW LEVEL SECURITY;
```

## Verify the Fix

After applying the fix, test by:

1. Refresh your application
2. Fill in the loan details form
3. Click "Apply"
4. You should see: ✅ **"Created! Loan details created successfully"**

## For Production

⚠️ **Important**: The current policy allows anyone to read/write data. For production:

1. **Implement Supabase Authentication**:
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   
   const supabase = createClient(url, key, {
     auth: {
       persistSession: true,
       autoRefreshToken: true,
     }
   })
   ```

2. **Update the RLS Policy**:
   ```sql
   -- Drop the permissive policy
   DROP POLICY "Allow all operations for everyone" ON loan_details;
   
   -- Create authenticated-only policy
   CREATE POLICY "Allow operations for authenticated users" ON loan_details
       FOR ALL
       USING (auth.uid() IS NOT NULL)
       WITH CHECK (auth.uid() IS NOT NULL);
   ```

3. **Add User-Specific Policies** (Optional):
   ```sql
   -- Only allow users to see their own loans
   CREATE POLICY "Users can only see their own loans" ON loan_details
       FOR SELECT
       USING (auth.uid()::text = user_id);
   
   -- Only allow users to modify their own loans
   CREATE POLICY "Users can only modify their own loans" ON loan_details
       FOR ALL
       USING (auth.uid()::text = user_id)
       WITH CHECK (auth.uid()::text = user_id);
   ```

## Understanding RLS Policies

### Policy Components

- **USING**: Determines which rows are visible for SELECT/UPDATE/DELETE
- **WITH CHECK**: Determines which rows can be inserted or updated

### Common Policy Patterns

1. **Public Read, Authenticated Write**:
   ```sql
   CREATE POLICY "Public read" ON loan_details
       FOR SELECT USING (true);
   
   CREATE POLICY "Authenticated write" ON loan_details
       FOR INSERT
       WITH CHECK (auth.uid() IS NOT NULL);
   ```

2. **User-Specific Data**:
   ```sql
   CREATE POLICY "User owns data" ON loan_details
       FOR ALL
       USING (auth.uid()::text = user_id)
       WITH CHECK (auth.uid()::text = user_id);
   ```

3. **Role-Based Access**:
   ```sql
   CREATE POLICY "Admin full access" ON loan_details
       FOR ALL
       USING (auth.jwt() ->> 'role' = 'admin');
   ```

## Troubleshooting

### Still Getting RLS Error?

1. **Check if RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'loan_details';
   ```

2. **List all policies**:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'loan_details';
   ```

3. **Verify policy is active**:
   - Go to Supabase Dashboard → Table Editor → loan_details
   - Check "RLS" badge - should show policies

### Policy Not Working?

- Clear browser cache
- Check Supabase logs in Dashboard → Logs
- Verify you're using the correct Supabase URL and anon key

## Summary

✅ **For Development**: Use the permissive policy (allows all operations)
⚠️ **For Production**: Implement authentication and user-specific policies

The fix script has been created and is ready to run!
