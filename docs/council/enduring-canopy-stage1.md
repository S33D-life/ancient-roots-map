# One enduring Canopy

One enduring Canopy. Many historical Circles. An ever-deepening Living Library.

Stage 1 is frontend-only guided meetings. No meeting record, rewards, persistence,
account requirement, reflection submission or backend change is implemented.

## Reuse and scope

The ordered chooser, bounded Previous/Next, gathering return and focus handling
reuse the interaction approach in draft PR127 (d926be725328), without importing
its Circle238 content, imagery or renderer changes. The existing LivingFrame239
remains the only folio viewer: images, accessible literal transcripts, separate
corrected readings, full-image reading and reduced motion remain available.

The original entry/camera/scene selects nodes as before. A shared folio adapter
loads each compatible edition and a small navigation controller decorates its
panel. No classic runtime, model, camera or touch-gesture implementation changes.
The same controller contract is demonstrated by 242 and historical241. Their
catalogues, images and transcripts are unchanged. Older234–240 keep their existing
adapters. Existing weekly gallery URLs remain valid; their JS invokes one renderer.

## Minimum weekly contract

A published Time Tree entry, a catalogue at /council/circle-N/catalogue.json, an
integer number N, question, fire:null for this Stage1 contract, and ordered
companions. Each has unique key, id cN-key, label, kind, front artwork, positive
width/height, SHA-256, and reverse artwork/dimensions/hash/literal readableText.
Art paths must remain inside the edition; no arbitrary destinations are loaded.
New editions require publicationApproved:true; historical241 has an explicit
compatibility exception for its original contract. This is not a new approval.

The shared 2D entry is /council/canopy.html?circle=N. The original Tree can load a
compatible folio edition from its catalogue without another per-week application
adapter. New weekly content still needs rights, editorial, source and publication
approval. No publication flag is inferred from a calendar date or a private pack.
The full intake/rights validator remains a separate task; runtime validation does
not certify copyright, factual accuracy or image bytes.

## Navigation state

URL state only: circle, companion, and frame/side for a selected reverse.
The original spatial hash still identifies the selected node. Switching surface
preserves companion and side. Previous/Next starts the newly chosen companion on
its front; Back/Forward restores the previous URL state. Gathering return removes
selection, not historical content. No localStorage, cookies or database writes.

Selectors and buttons have explicit accessible names, companion position,
bounded ends, 44px controls and focus restoration. The existing phone #grab and
sheet gestures remain authoritative. Native Safari/VoiceOver acceptance is a
separate human gate; browser emulation must not be recorded as native testing.

## Dependencies deliberately separate

The stale-shell/cache investigation and broken legacy /council/241 shortcut are
not repaired here. Shared navigation uses the existing verified catalogue entry
and shared 2D route. Do not clear user storage or broaden access for a preview.
Private preview stays loopback; private iPhone HTTPS requires separate activation
approval and verified device-only access. No production changes under this draft.

Stage2 personal remembering and Stage3 reflection/Fire participation remain
future work. Do not connect these controls to claimCouncilParticipation.

## Editorial handoff

Claude/TEOTAG continue to own the weekly roster, inquiry, artwork, transcripts,
provenance and Chronicle. Supply the edition contract once; shared controls should
not require new weekly UI code. Separate enriching library links from the original
historical folio text. No new artwork or editorial correction is requested here.

## Acceptance

Test both editions, all ten pairs, correct order/position, bounded steps, chooser,
gathering return, deep links, Back/Forward/reload, 2D/3D companion+side continuity,
keyboard, mobile320/390, reduced motion and exact artwork preservation. Historical
234–240, TimeTree and StaffRoom retain their existing regression coverage. Synthetic
fixtures block nonlocal transport and render the original Tree with the existing
software-GPU pacing; they do not prove native camera performance or VoiceOver.

## Native review handoff

Use the exact candidate built locally, with no public hosting or Tailscale Serve
activation under this PR. Open the loopback preview on the Mac. An approved
private iPhone session requires independently verified device-only HTTPS access.
On real Safari/VoiceOver test both242/241: Meet entrance, ordered chooser, first/
last boundaries, next/previous, turn and read literal transcript, full image,
return to gathering, 2D↔3D side/companion continuity, reload/Back/Forward, phone
sheet #grab (tap, keyboard and drag), camera gestures, safe areas and orientation.
Check announced names/position, focus after each transition, no focus behind a
closed sheet and reduced motion. Include historical240, TimeTree and StaffRoom.
Do not mark these passed from automated WebKit screenshots.
