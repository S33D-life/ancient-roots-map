// Generated from approved Current Circle. Run npm run council:static.
(() => {
  // supabase/functions/_shared/currentCircle.ts
  var CURRENT_CIRCLE = {
    number: 235,
    title: "Circle 235 \xB7 yOur Blooming Week",
    weekState: "Open Circle",
    openLine: "The Circle is open now. Times will be shared in the group as each fire is lit.",
    question: "What is already blooming in us that we haven\u2019t noticed yet?",
    companions: ["Fulham Palace Holm Oak", "Apple Blossom", "Dragon Fruit / Pitaya", "Fly Agaric", "Hen Harrier", "Peter Pan"],
    peopleSeat: "People / those who gather hold the open seventh seat.",
    companionsLabel: "This week\u2019s companions, chosen by Leo",
    safetyLabel: "Fly Agaric",
    safety: "Toxic \xB7 Meet with care \xB7 Never eat.",
    approval: "approved",
    revision: "circle-235-ce9bab5",
    links: {
      council: { url: "https://www.s33d.life/council-of-life", approved: true },
      tetol: { url: "https://www.s33d.life/tetol/circle-235/pre-fire/tetol.html", approved: true },
      group: { url: "https://t.me/s33dlife", approved: true },
      councilDeck: { url: "https://www.s33d.life/tetol/circle-235/pre-fire/tetol.html#croom", approved: true }
    }
  };
  function approvedCircleUrl(link) {
    if (!link?.approved) return void 0;
    try {
      const u = new URL(link.url);
      if (u.protocol !== "https:" || u.username || u.password || u.port) return void 0;
      if (!["www.s33d.life", "s33d.life", "t.me", "meet.google.com"].includes(u.hostname)) return void 0;
      return u.href;
    } catch {
      return void 0;
    }
  }

  // src/lib/council/staticCouncilAdapter.ts
  function staticCouncilProjection(circle = CURRENT_CIRCLE) {
    if (circle.approval !== "approved") return null;
    return {
      number: circle.number,
      title: circle.title,
      question: circle.question,
      weekState: circle.weekState,
      openLine: circle.openLine,
      companionsLabel: circle.companionsLabel,
      revision: circle.revision,
      links: Object.fromEntries(Object.entries(circle.links).flatMap(([key, link]) => {
        const url = approvedCircleUrl(link);
        return url ? [[key, url]] : [];
      }))
    };
  }
  function applyStaticCouncil(registry, circle) {
    const manifest = registry.circles[registry.registry.current];
    if (!circle || circle.number !== manifest.circle_number) throw new Error("Approved Current Circle does not match this static Council package");
    manifest.title = circle.title.replace(`Circle ${circle.number} \xB7 `, "");
    manifest.central_question.text = manifest.central_question.final = circle.question;
    manifest.central_question.status = "TEOTAG APPROVED";
    manifest.fire.display_note = manifest.fire.display_when_unknown = circle.openLine;
    manifest.fire.fires = [];
    manifest.join_link.href = circle.links.fire || null;
    manifest.join_link.platform = circle.links.fire ? "Council room" : "TBC";
    manifest.join_link.status = circle.links.fire ? "APPROVED" : "TBC";
    Object.assign(manifest.tetol_surfaces, {
      fire_unknown: circle.openLine,
      fire_unknown_short: circle.weekState,
      welcome_fire_unknown: circle.openLine,
      join_pending: circle.openLine
    });
    Object.assign(manifest.links, {
      council_of_life: circle.links.council || null,
      s33d_council: circle.links.council || null,
      tetol: circle.links.tetol || null,
      group: circle.links.group || null,
      councilDeck: circle.links.councilDeck || null,
      join: circle.links.fire || null
    });
    return circle;
  }
  function councilReturnUrl(circle) {
    if (!circle?.links.council) return null;
    const url = new URL(circle.links.council);
    if (url.pathname !== "/council-of-life") return null;
    return url.pathname + "#next-gathering";
  }
  if (typeof window !== "undefined") {
    Object.assign(window, { S33D_APPLY_CURRENT_CIRCLE: (registry) => applyStaticCouncil(registry, staticCouncilProjection()) });
    window.addEventListener("tetol:current-circle", () => {
      const circle = staticCouncilProjection(), href = councilReturnUrl(circle);
      if (!href) return;
      const link = document.createElement("a");
      link.href = href;
      link.textContent = "Return to Council of Life";
      link.className = "home";
      link.id = "council-return";
      document.querySelector("#hdr")?.appendChild(link);
    });
  }
})();
