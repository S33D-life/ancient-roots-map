# RLS Audit: Trees + Offerings

## Scope

- `public.trees`
- `public.offerings`

## Findings

- Base policies existed for creator-owned writes.
- Hardening required:
  - scope mutating policies explicitly to `authenticated`
  - add explicit `WITH CHECK` to `UPDATE` policies for ownership continuity
  - reapply policies idempotently to avoid drift

## Hardening migration

- `supabase/migrations/20260305001000_harden_tree_submission_rls.sql`

## Expected behavior after migration

- Anyone can read trees/offerings.
- Only authenticated users can insert.
- Insert requires `created_by = auth.uid()`.
- Update/delete require row ownership (`created_by = auth.uid()`).
- Update also requires post-update row still owned by caller.

## Quick verification SQL

```sql
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname='public'
  and tablename in ('trees','offerings')
order by tablename, cmd, policyname;
```
