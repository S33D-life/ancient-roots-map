import { approvedCircleUrl, CURRENT_CIRCLE, type CurrentCircle } from "../../../supabase/functions/_shared/currentCircle";

/** Invitation presentation only; weekly facts and destinations belong to CurrentCircle. */
const presentation = {
  opening: "Ancient Friends — the Circle begins outside.",
  context: "The Council doesn’t begin when the call opens. It begins when we notice the living world around us.",
  invitation: "Choose a companion, or the living thing nearest to you. Meet it. Notice something new. Learn one thing. Bring a story, photograph, song, seed, question, something you made — or simply yourself — back to the Circle.",
  closing: "Different places. Different moments. One living Council. 🌳",
};

/** Public compatibility projection. Never import a working invitation manifest or its message templates. */
export function currentCircleShare(circle: CurrentCircle = CURRENT_CIRCLE) {
  if (circle.approval !== "approved") return undefined;
  const links = Object.fromEntries(Object.entries(circle.links).flatMap(([key, link]) => {
    const url = approvedCircleUrl(link);
    return url ? [[key, url]] : [];
  }));
  return {
    circle_number: circle.number,
    title: circle.title,
    state: circle.weekState,
    central_question: circle.question,
    companions: [...circle.companions],
    companionsLabel: circle.companionsLabel,
    peopleSeat: circle.peopleSeat,
    safetyLabel: circle.safetyLabel,
    safety: circle.safety,
    openLine: circle.openLine,
    revision: circle.revision,
    links,
  };
}

/** Prepared share text only: does not send, publish, or change Telegram rendering. */
export function renderCurrentCircleInvitation(circle: CurrentCircle = CURRENT_CIRCLE): string | undefined {
  const share = currentCircleShare(circle);
  if (!share) return undefined;
  const destinations: [string, string][] = [
    ["council", "Council of Life"], ["tetol", `Enter Circle ${share.circle_number} in TETOL`],
    ["councilDeck", "Open the Council Deck"], ["group", "Council group"],
    ["fire", "Council room, when a fire is lit"], ["guide", "Guide"],
    ["images", "Images"], ["livingRecord", "Living Record"],
  ];
  return [
    `🌸 **Council of Life · ${share.title}**`, presentation.opening, presentation.context,
    `**${share.state}**`, `${share.companionsLabel}:\n${share.companions.map(name => `- ${name}`).join("\n")}\n${share.peopleSeat}`,
    presentation.invitation, `**${share.central_question}**`,
    `${share.safetyLabel}: **${share.safety}**`, `🔥 **${share.openLine}**`,
    ...destinations.flatMap(([key, label]) => share.links[key] ? [`${label}: ${share.links[key]}`] : []),
    presentation.closing,
  ].join("\n\n") + "\n";
}
