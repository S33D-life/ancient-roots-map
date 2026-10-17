/** Editorial proposal only. Never inherit question, Fire or lifecycle from 235/236. */
export const invitation = {
  title: 'An invitation to Council of Life · 237',
  copy: 'Come and meet ten companions: a returning Ancient Friend, a tree species, a plant, a seed, a leaf, a flower, a fruit, a fungus, a book and a bird. We will make room to notice them together.',
  proposedQuestion: 'What can these companions teach us about growing together?',
  approvedQuestion: null,
  openingFireDate: '2026-10-20',
  openingFireTimeUK: '19:30 UK (BST)',
  joiningLink: null, // No verified direct Fire-room URL.
  communityLink: 'https://t.me/s33dlife',
  approved: false,
} as const;

export function publicationBlockers() {
  return [
    'Ten exact portraits, checksums and public-use approvals awaiting intake',
    'Companion introductions and Broad Bean public naming awaiting Ed’s editorial approval',
    ...(!invitation.approvedQuestion ? ['Central question awaiting Ed’s approval'] : []),
    'Direct Fire-room URL not verified; Telegram is the Council community link',
    'Production route integration, native-device review and frontend-only recovery approval outstanding',
  ];
}
