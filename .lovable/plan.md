

## Security Review Summary

Your project has a solid foundation with RLS enabled on all tables and proper authentication. However, there are **2 issues to fix** and **1 recommendation**.

---

### Issue 1: User Email Addresses Publicly Exposed (High Severity)

The `profiles` table has a SELECT policy of `true`, meaning anyone -- even unauthenticated visitors -- can query all user emails, names, and avatar URLs. This is a privacy risk.

**Fix:** Change the profiles SELECT policy so only authenticated users can view profiles, or restrict email visibility entirely.

**SQL Migration:**
```sql
DROP POLICY "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

---

### Issue 2: Leaked Password Protection Disabled (Medium Severity)

Your authentication system doesn't check passwords against known breach databases. This means users can sign up with passwords like "password123" that have been compromised in data breaches.

**Fix:** Enable leaked password protection in the authentication settings. This can be done through the Lovable Cloud backend settings.

---

### Recommendation: Input Validation on Tree/Project Forms

The edge functions and auth page already use good validation (zod for auth, proper CORS headers). No `dangerouslySetInnerHTML` is used with user content (only in the chart UI component with static data). The what3words integration properly uses edge functions to protect API keys.

One minor improvement: ensure the `AddTreeDialog` and `AddOfferingDialog` components validate text input lengths before submission to prevent excessively large entries.

---

### What's Already Done Well

- All 5 tables have RLS enabled with appropriate policies
- API keys (What3words, Google Maps) are stored as secrets and accessed via edge functions
- Authentication uses zod validation for email/password
- Edge functions have proper CORS headers
- Wishlist table is fully user-scoped (only owners can CRUD)
- No raw SQL execution in edge functions
- Quota management and caching for third-party APIs

---

### Technical Implementation Plan

**Step 1:** Run a database migration to fix the profiles SELECT policy (restrict to authenticated users).

**Step 2:** Enable leaked password protection via auth configuration.

**Step 3:** Optionally add input length validation to tree and offering creation forms.

