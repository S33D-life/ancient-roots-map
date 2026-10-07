// Generated from approved Current Circle. Run npm run council:static.
(() => {
  // src/lib/council/staticCouncilAdapter.ts
  function applyStaticCouncil(registry, circle2) {
    const manifest = registry.circles[registry.registry.current];
    if (!circle2 || circle2.number !== manifest.circle_number) throw new Error("Approved Current Circle does not match this static Council package");
    manifest.title = circle2.title.replace(`Circle ${circle2.number} \xB7 `, "");
    manifest.central_question.text = manifest.central_question.final = circle2.question;
    manifest.central_question.status = "TEOTAG APPROVED";
    manifest.fire.display_note = manifest.fire.display_when_unknown = circle2.openLine;
    manifest.fire.fires = [];
    manifest.join_link.href = circle2.links.fire || null;
    manifest.join_link.platform = circle2.links.fire ? "Council room" : "TBC";
    manifest.join_link.status = circle2.links.fire ? "APPROVED" : "TBC";
    Object.assign(manifest.tetol_surfaces, {
      fire_unknown: circle2.openLine,
      fire_unknown_short: circle2.weekState,
      welcome_fire_unknown: circle2.openLine,
      join_pending: circle2.openLine
    });
    Object.assign(manifest.links, {
      council_of_life: circle2.links.council || null,
      s33d_council: circle2.links.council || null,
      tetol: circle2.links.tetol || null,
      group: circle2.links.group || null,
      councilDeck: circle2.links.councilDeck || null,
      join: circle2.links.fire || null
    });
    return circle2;
  }
  function councilReturnUrl(circle2) {
    if (!circle2?.links.council) return null;
    const url = new URL(circle2.links.council);
    if (url.pathname !== "/council-of-life") return null;
    return url.pathname + "?from=spatial-council#next-gathering";
  }

  // static-council-runtime.js
  var circle = { "number": 235, "title": "Circle 235 \xB7 yOur Blooming Week", "question": "What is already blooming in us that we haven\u2019t noticed yet?", "weekState": "Open Circle", "openLine": "The Circle is open now. Times will be shared in the group as each fire is lit.", "companionsLabel": "This week\u2019s companions, chosen by Leo", "revision": "circle-235-ce9bab5", "links": { "council": "https://www.s33d.life/council-of-life", "tetol": "https://www.s33d.life/tetol/circle-235/pre-fire/tetol.html", "group": "https://t.me/s33dlife", "councilDeck": "https://www.s33d.life/tetol/circle-235/pre-fire/tetol.html#croom" } };
  window.S33D_APPLY_CURRENT_CIRCLE = (registry) => applyStaticCouncil(registry, circle);
  window.addEventListener("tetol:current-circle", () => {
    const href = councilReturnUrl(circle);
    if (!href) return;
    const link = document.createElement("a");
    link.href = href;
    link.textContent = "Return to Council of Life";
    link.className = "home";
    link.id = "council-return";
    link.style.cssText = "position:fixed;right:16px;bottom:calc(112px + env(safe-area-inset-bottom, 0px));z-index:2147483647;min-height:44px;display:inline-flex;align-items:center;padding:10px 14px;border:1px solid var(--line);border-radius:10px;background:var(--bg, #1a1f14);color:var(--ink, #f0eadb);text-decoration:none;font:13px var(--sans, sans-serif)";
    document.body.appendChild(link);
  });
})();
