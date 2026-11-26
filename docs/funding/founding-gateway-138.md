# Funding gateway — source-only review under138 / existing PR122

Advances the existing funding PR, retaining its truthful Giveth wording. Currentmain2fe6837b was integrated into the working branch; no PR/main merge performed. Main's CI and all Council sources/assets remain unchanged in this diff.

New review route:/support/founding. Existing/support gains one discoverability link; its legacy commerce implementation is not activated or changed here. The gateway does not import its checkout/signup handlers. Reuses existing route constants, Header/Footer, support-config Giveth URL and UI styles. No duplicate campaign service or collection table.

Free Wanderer entrance links to existing map, weeklyCouncil and free sign-in. Contribution eligibility, group Whisper earned-Hearts costs and invitations remain truthful; no unlimited group access or paid premium promise. Live Fires only when announced, no invented schedule.

Life Groves:proposed1,000collection,£33first-year/£111ten-year proposals,Christmasgifting underpreparation,not a fulfilled service. No Crowdfunder URL,checkout,signup/intake,paid reservation,subscription,invite quota,storage provisioning or archival guarantee. ExistingGivethproject only; voluntarypublic-goods gifts confer no product/token/Heart/premium rewards and no matching or eligibility promise. Owner verification under121 remains separate.

Canonical source:https://app.notion.com/p/40c15b58480d81829d54e9fb5005f63b and issue138. Prices,privacy,fulfilment,storage/recovery/export,legal/recipient checks and campaignpublication remain explicit human gates. No real accounts or private records accessed. Existing/supportlegacyweekly-v-monthly and£33/monthcopy are not ratified newpricing; do not send campaign traffic into oldcheckout assuming this PR proves paymentreadiness.

Source scope:newstaticpage+route,oneexistingSupportlink,unit/browserchecks,andthisreceipt,alongside122's original4files. NoCouncil,renderer,history,backend,Auth,RLS,storage,DNS,workflow,dependency or secret changes. KeepDRAFT; separatemergeandfrontendpublicationGO. Publiccampaigncopypublicationandpaymentactivationareseparateapprovals.

Local review:`npm run release-check`;`npx playwright test --config playwright.founding-gateway.config.ts`;`npm run preview -- --host127.0.0.1 --port4278`;open/support/founding on that loopbackorigin. NativeiPhone/VoiceOver notprovenbydesktopWebKit; no new LAN/Serve/Funnel exposure authorised.
