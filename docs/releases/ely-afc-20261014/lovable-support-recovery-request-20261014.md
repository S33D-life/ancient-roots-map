Subject: Read-only deployed Edge Function recovery artifacts — S33D Lovable Cloud

Please provide a read-only recovery package for Lovable project 206b4e97-2343-48d0-89b8-f5647bb248f1 (https://lovable.dev/projects/206b4e97-2343-48d0-89b8-f5647bb248f1), serving https://www.s33d.life. Its live frontend references https://mwzcuczfedrjplndggiv.supabase.co. Please confirm that this is the Cloud-managed backend shared by production and preview.

We need to preserve the current privacy-safe deployment before a narrowly scoped og-proxy location-metadata change. No deployment or infrastructure changes are requested.

For currently deployed og-proxy, and og-card because its Staff-identity/privacy repair is linked to the same social-preview path, please supply:
- Actual deployed source, all local imports/dependencies/assets, import map/lockfile, entrypoint, and deployed bundle/artifact if available. Please distinguish deployed code from current editor/Git code.
- Immutable deployment ID/version, deployment time, source commit or other provenance, and SHA-256 checksums for the files/artifacts. Identify any missing source or deployment-input information.
- Non-secret runtime/build/dependency versions, function verify_jwt/auth configuration and gateway/routing configuration needed to restore the same behaviour. Provide environment-variable names and confirmation their existing values will be retained; do not include credentials, secret values or user records.
- Confirmation of which deployed versions include public-only tree/Offering parent checks and the removal of the global unrelated Staff-binding lookup. Confirm shared-cache controls and whether response-rewriting/CDN policies exist outside these functions.
- Exact supported way to restore those versions independently, without reverting database privacy migrations or publishing another frontend; note whether Lovable Publish could overwrite them and how to prevent that.
- Cache invalidation/revalidation procedure for both functions, including existing shared metadata/image URLs.

If a deployed artifact cannot be exported, please provide an authoritative deployment receipt tying each active version to a complete source snapshot, plus a supported independently restorable version/checkpoint. Tell us whether that snapshot is sufficient to reproduce the deployed artifact and what cannot be reproduced.

Do not redeploy, rollback, change permissions, rotate credentials, alter data, or modify production in response to this request. A private read-only download/support attachment is sufficient.
