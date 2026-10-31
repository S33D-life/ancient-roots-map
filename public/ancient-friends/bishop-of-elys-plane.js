/** Static, cache-independent entrance: reuses the existing curated Ely folio record.
 * No auth, Supabase, precise coordinates, user media, token claims or backend writes.
 */
(() => {
  const params = new URLSearchParams(location.search);
  const fromSpatial = params.get("from") === "spatial";
  const returnUrl = fromSpatial
    ? "/tetol/circle-235/pre-fire/tetol.html?circle=236#ely-plane-companion"
    : "/review/council/236?mode=2d&returned=1&companion=ely-plane-companion";
  for (const id of ["return-to-circle", "return-bottom"]) {
    const link = document.getElementById(id);
    if (link) link.setAttribute("href", returnUrl);
  }
  const target = document.getElementById("curated-study");
  if (!target) return;
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  fetch("/review/ely-folio.json", { cache: "no-store" }).then(res => {
    if (!res.ok) throw new Error("curated folio unavailable");
    return res.json();
  }).then(folio => {
    if (folio?.key !== "ely" || folio?.identity?.source !== "research-trees" || !Array.isArray(folio.sections) || !Array.isArray(folio.timeline)) throw new Error("unexpected folio");
    const sectionHeading = element("h2", "The living chapters");
    const grid = element("div", "", "study-grid");
    for (const chapter of folio.sections) {
      const section = element("section");
      section.append(element("p", chapter.status, "status"), element("h2", chapter.title), element("p", chapter.text));
      grid.append(section);
    }
    target.append(sectionHeading, grid, element("h2", "Through time"));
    const timeline = element("ol", "", "timeline");
    for (const event of folio.timeline) {
      const li = element("li");
      li.append(element("h3", event.date), element("p", event.text), element("p", event.status, "status"));
      timeline.append(li);
    }
    target.append(timeline);
  }).catch(() => {
    target.append(element("p", "The additional research chapters are temporarily unavailable. The original research identity, visit note and credited sources above remain accessible.", "status"));
  });
})();
