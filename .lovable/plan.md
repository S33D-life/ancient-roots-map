# Root Approval Notifications

## Goal
Use S33D’s existing in-app notification stream so authorised people learn when a Root is waiting at either approval gate.

## Build
- When a contributor suggests a Root, notify the Grove’s Primary Steward and active Grove Stewards, excluding the proposer.
- When a steward creates a Root that needs Ancient Friend approval, or accepts a contributor suggestion into that state, notify the Ancient Friend’s existing authorised actors: its creator, keepers, and curators, excluding the actor who caused the transition.
- Send generic, privacy-safe wording without inscription, dedication, remembered-person, or Grove-private content.
- Link steward notifications to the relevant Grove and Ancient Friend notifications to the relevant tree, where the existing approval controls already live.
- Reuse the current inbox, unread count, realtime delivery, read/dismiss controls, and Root authority functions; do not add another notification surface.

## Technical details
- Extend the trusted Root creation and proposal-review functions so relationship state and notifications commit atomically.
- Deduplicate recipients before insertion and preserve current Root status, authority, privacy, history, and no-reward behavior.
- Add a Root-approval notification category presentation and focused tests, then run typecheck and the full test suite.

## Deliberately excluded
- Email, push, Telegram, notification preference redesign, reminders, and notifications for final decisions.
