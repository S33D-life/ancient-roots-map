/** Editorial proposal only. Never inherit question, Fire or lifecycle from 235/236. */
export const invitation = {
  title: 'An invitation to Council of Life · 237',
  copy: 'Come and meet ten companions: a returning Ancient Friend, a tree species, a plant, a seed, a leaf, a flower, a fruit, a fungus, a book and a bird. We will make room to notice them together.',
  proposedQuestion: 'What can these companions teach us about growing together?',
  approvedQuestion: null,
  openingFireDate: null,
  openingFireTimeUK: null,
  joiningLink: null,
  approved: false,
} as const;

export function publicationBlockers() {
  return [
    'Ten exact portraits, checksums and public-use approvals awaiting intake',
    'Companion introductions and Broad Bean public naming awaiting Ed’s editorial approval',
    ...(!invitation.approvedQuestion ? ['Central question awaiting Ed’s approval'] : []),
    ...(!invitation.openingFireDate || !invitation.openingFireTimeUK || !invitation.joiningLink ? ['Opening Fire date, UK time and joining doorway unconfirmed'] : []),
    'Production route integration, native-device review and frontend-only recovery approval outstanding',
  ];
}
