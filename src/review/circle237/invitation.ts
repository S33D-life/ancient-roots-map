/** Open weekly Circle 237. Telegram/PDF invitation is separately reviewed before sending. */
export const invitation = {
  title: 'An invitation to Council of Life · 237',
  copy: 'Come and meet ten companions: a returning Ancient Friend, a tree species, a plant, a seed, a leaf, a flower, a fruit, a fungus, a book and a bird. We will make room to notice them together.',
  proposedQuestion: 'What is life teaching us through the beings we encounter?',
  approvedQuestion: 'What is life teaching us through the beings we encounter?',
  openingFireDate: null, // Open Council this week; no fixed Fire session scheduled.
  openingFireTimeUK: null,
  joiningLink: null, // No verified direct Fire-room URL.
  communityLink: 'https://t.me/s33dlife',
  approved: false,
} as const;

export function publicationBlockers() {
  return [
    'Telegram invitation and illustrated PDF have not yet been approved for sharing',
    'The Teddy Bear Sunflower illustration is labelled illustrative rather than botanically exact',
    'No live Fire is scheduled this week; Telegram is the community link, not a meeting URL',
  ];
}
