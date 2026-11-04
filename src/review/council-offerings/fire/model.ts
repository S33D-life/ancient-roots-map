/** Review-only intentions. No Ledger identities, storage adapters or live Fire clock. */
export const practices = [
  { name: 'Notice', hint: 'met · saw', mark: '◉' },
  { name: 'Tend', hint: 'grew · cared', mark: '♧' },
  { name: 'Gather', hint: 'harvested · foraged', mark: '♧' },
  { name: 'Make', hint: 'cooked · kept · crafted', mark: '◇' },
  { name: 'Learn', hint: 'found out · wondered', mark: '▤' },
] as const;
export type Practice = typeof practices[number]['name'];
export type FireState = 'open' | 'gathering' | 'afterglow' | 'remembered';
export interface FireDraft {
  practice: Practice | null;
  words: string;
  subject: string;
  origin: '' | 'Wild' | 'Grown' | 'Given';
  preserved: boolean;
  photo: boolean;
  voice: boolean;
  steps: string;
  question: string;
  place: string;
  curatorReview: boolean;
  readAloud: boolean;
}
export const blankFireDraft = (): FireDraft => ({ practice: null, words: '', subject: '', origin: '', preserved: false, photo: false, voice: false, steps: '', question: '', place: '', curatorReview: false, readAloud: false });
export const needsSafetyReview = (d: FireDraft) =>
  (d.practice === 'Gather' && d.origin === 'Wild') || /fung|mushroom|hen of the woods|amanita|maitake/i.test(d.subject) || (d.practice === 'Make' && d.preserved);
export function fireReceipt(d: FireDraft) {
  return { destination: 'fire' as const, circle: 238 as const, practice: d.practice, words: d.words, curatorReview: d.curatorReview, readAloud: d.curatorReview && d.readAloud, safety_review: needsSafetyReview(d) ? 'required' : 'standard', status: 'demo-only' as const };
}
export type FireReceipt = ReturnType<typeof fireReceipt>;
export function reviewFireState(qa: boolean, value: string | null): FireState {
  return qa && ['gathering', 'afterglow', 'remembered'].includes(value ?? '') ? value as FireState : 'open';
}
