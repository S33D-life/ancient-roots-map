# CI artifact provenance

Scope: CI only. No deployment workflow, credential, production, backend, auth, Circle or Ely changes.

The validation job builds once and retains `dist/` plus `release-evidence/` for 30 days. The browser job downloads that exact artifact, verifies the manifest hash, every distributed file hash, and checked-out source SHA, then uses that distribution without rebuilding.

Evidence:
- SOURCE_SHA: full commit checked out and built.
- GITHUB_SHA: Actions event SHA; pull_request runs normally use a synthetic merge commit.
- PR_HEAD_SHA / PR_BASE_SHA: contributing PR head and base, empty for push events. PR_HEAD_SHA identifies the candidate; its presence does not assert human approval.
- EVENT / RUN: event and run ID/attempt.
- SHA256SUMS: paths relative to dist, covering every distributed file.
- MANIFEST.sha256: checksum of SHA256SUMS, relative to release-evidence.

`version.json` already uses GITHUB_SHA in CI. PR builds therefore identify the tested merge source, not necessarily the PR head. These records are integrity/provenance evidence within GitHub CI, not signed attestations or proof of hosting.

Review requires an independent maintainer to confirm artifact paths and check both existing CI jobs. No settings changes: main protection and private preview setup remain separate approval documents outside this change. Thirty-day retention consumes additional Actions storage; monitor quota. Artifacts of this public repository must contain public build output only, never backend secrets or private media.

Rollback: revert this CI-only commit through a reviewed PR. Previously retained artifacts remain until their configured expiry or separately authorised removal. No production/backend rollback needed.
