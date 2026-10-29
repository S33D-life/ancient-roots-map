import { useEffect, useId, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { companions, photograph, voiceSample } from '../model';
import { blankFireDraft, fireReceipt, needsSafetyReview, practices, type FireReceipt } from './model';

type Step = 'practice' | 'compose' | 'hold' | 'placing' | 'receipt';
export default function FireComposer({ host, onClose, onReceipt }: { host: '2d' | 'deck'; onClose: () => void; onReceipt: (receipt: FireReceipt) => void }) {
  const [draft, setDraft] = useState(blankFireDraft);
  const [step, setStep] = useState<Step>('practice');
  const [voiceUrl, setVoiceUrl] = useState('');
  const heading = useRef<HTMLHeadingElement>(null), body = useRef<HTMLDivElement>(null);
  const first = useRef(true), openingFocus = useRef<number>();
  const id = useId(), questionId = `${id}-question`;
  const update = (patch: Partial<typeof draft>) => setDraft(d => ({ ...d, ...patch }));
  useEffect(() => {
    const url = URL.createObjectURL(voiceSample()); setVoiceUrl(url);
    return () => { URL.revokeObjectURL(url); if (openingFocus.current !== undefined) cancelAnimationFrame(openingFocus.current); };
  }, []);
  useEffect(() => {
    body.current?.scrollTo?.(0, 0);
    if (first.current) { first.current = false; return; }
    heading.current?.focus({ preventScroll: true });
  }, [step]);
  useEffect(() => {
    if (step !== 'placing') return;
    const timer = setTimeout(() => setStep('receipt'), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1700);
    return () => clearTimeout(timer);
  }, [step]);
  const question = step === 'practice' ? 'What happened?' : step === 'compose' ? 'What happened?' : step === 'hold' ? 'Who should see it?' : step === 'placing' ? 'Showing how it would rest by the Fire…' : 'This is how your offering would rest by the Fire.';
  function place() {
    if (!draft.practice || !draft.words.trim()) return;
    onReceipt(fireReceipt(draft)); setStep('placing');
  }
  function reset() { setDraft(blankFireDraft()); setStep('practice'); }
  return <Dialog.Root open onOpenChange={open => { if (!open && step !== 'placing') onClose(); }}>
    <Dialog.Portal><Dialog.Overlay className="offering-veil" />
      <Dialog.Content className="offering-sheet fire-sheet" data-host={host} data-fire-step={step}
        onOpenAutoFocus={e => { e.preventDefault(); openingFocus.current = requestAnimationFrame(() => heading.current?.isConnected && heading.current.focus({ preventScroll: true })); }}
        onCloseAutoFocus={e => e.preventDefault()} onEscapeKeyDown={e => { if (step === 'placing') e.preventDefault(); }} onPointerDownOutside={e => { if (step === 'placing') e.preventDefault(); }}>
        <header className="offering-head"><span className="fire-mark" aria-hidden="true">✦</span><div><p>StarPod Circle 238 · {draft.practice ?? 'yOur Blooming Week'}</p><Dialog.Title>The Fire</Dialog.Title><Dialog.Description className="demo-marker">DEMO · not saved, not submitted, not published</Dialog.Description></div><Dialog.Close disabled={step === 'placing'} className="sheet-close" aria-label="Close Fire offering">×</Dialog.Close></header>
        <div className="offering-body" ref={body}>
          <h2 ref={heading} id={questionId} tabIndex={-1} className="oq">{question}</h2>
          {step === 'practice' && <><p className="osub">Choose one. A few words is enough.</p><div className="practice-ring" role="group" aria-labelledby={questionId}><span className="fire-centre" aria-hidden="true">The Fire</span>{practices.map((p, i) => <button key={p.name} className="practice-token" aria-label={p.name} aria-describedby={`${id}-practice-${i}`} style={{ left: `${50 + 36 * Math.sin(i * Math.PI * 2 / 5)}%`, top: `${50 - 36 * Math.cos(i * Math.PI * 2 / 5)}%` }} onClick={() => { update({ practice: p.name }); setStep('compose'); }}><span aria-hidden="true">{p.mark}</span><b>{p.name}</b><small id={`${id}-practice-${i}`}>{p.hint}</small></button>)}</div><button className="fire-listen" onClick={onClose}><i>Or simply sit by the Fire and listen.</i><small>Nothing to bring. You’re still part of the Circle.</small></button></>}
          {step === 'compose' && <>
            <p className="osub">{draft.practice} · A few words is enough. Only “What happened?” is required.</p>
            <label>What happened?<textarea value={draft.words} onChange={e => update({ words: e.target.value })} rows={5} maxLength={3000} /></label>
            <label>Who was it with? (optional)<input list={`${id}-companions`} value={draft.subject} onChange={e => update({ subject: e.target.value })} maxLength={160} /></label>
            <datalist id={`${id}-companions`}>{companions.map(c => <option key={c.key} value={c.label} />)}<option value="Not sure" /></datalist>
            <p className="note">Names are only words here. Nothing is looked up or linked.</p>
            {draft.practice === 'Gather' && <fieldset className="fire-origin"><legend>Was it wild? (optional)</legend>{(['Wild', 'Grown', 'Given'] as const).map(origin => <label key={origin}><input type="radio" name={`${id}-origin`} checked={draft.origin === origin} onChange={() => update({ origin })} />{origin}</label>)}</fieldset>}
            <details><summary>Add more (optional)</summary><div className="fire-extras">
              <button className="o-act secondary" onClick={() => update({ photo: !draft.photo })}>Use synthetic photo example</button>{draft.photo && <img className="sample-image" src={photograph} alt="Synthetic tree example; no photograph uploaded" />}
              <button className="o-act secondary" onClick={() => update({ voice: !draft.voice })}>Use synthetic voice example</button>{draft.voice && <audio controls aria-label="Synthetic tone preview" src={voiceUrl} />}
              <p className="note">Examples only. No camera, microphone, uploads or external searches.</p>
              <label>Steps (optional)<textarea value={draft.steps} onChange={e => update({ steps: e.target.value })} maxLength={1000} /></label>
              <label>A question (optional)<textarea value={draft.question} onChange={e => update({ question: e.target.value })} maxLength={500} /></label>
              <label>Kind of place (optional)<select value={draft.place} onChange={e => update({ place: e.target.value })}><option value="">Not included</option>{['garden', 'kitchen', 'woodland', 'hedgerow', 'field', 'market', 'workshop', 'elsewhere'].map(p => <option key={p}>{p}</option>)}</select></label>
              {draft.practice === 'Make' && <label className="fire-check"><input type="checkbox" checked={draft.preserved} onChange={e => update({ preserved: e.target.checked })} />Preserved / remedy context (optional)</label>}
            </div></details>
            {needsSafetyReview(draft) && <aside className="fire-safety" aria-label="Wild food needs care">Wild food needs care. Share what you found and saw, not advice on eating it. Never eat a wild fungus without an expert’s in-person identification.</aside>}
            <button className="o-act" disabled={!draft.words.trim()} onClick={() => setStep('hold')}>Continue</button><button className="linkish" onClick={() => setStep('practice')}>Choose another practice</button>
          </>}
          {step === 'hold' && <>
            <fieldset className="holding" aria-labelledby={questionId}>
              <label className="hold-option"><input type="radio" name={`${id}-audience`} aria-labelledby={`${id}-private`} aria-describedby={`${id}-private-desc`} checked={!draft.curatorReview} onChange={() => update({ curatorReview: false, readAloud: false })} /><span><b id={`${id}-private`}>Only me</b><small id={`${id}-private-desc`}>Private intention. In a future live flow, only you would see it. This demo saves nothing.</small></span></label>
              <label className="hold-option"><input type="radio" name={`${id}-audience`} aria-labelledby={`${id}-curators`} aria-describedby={`${id}-curators-desc`} checked={draft.curatorReview} onChange={() => update({ curatorReview: true })} /><span><b id={`${id}-curators`}>The curators for this Circle</b><small id={`${id}-curators-desc`}>Choosing this proposes curator review only. It does not permit reading aloud or public Library publication. Nothing is sent.</small></span></label>
            </fieldset>
            <label className="fire-check"><input type="checkbox" checked={draft.readAloud} disabled={!draft.curatorReview} onChange={e => update({ readAloud: e.target.checked })} />Read aloud at the Fire</label>
            <p className="note">A separate opt-in, off by default. Anything public would be asked for separately, later.</p>
            <details className="future-promises"><summary>What this demo promises</summary><p>Future design, not implemented here: not minted; no Hearts given automatically; places stay general. Before the Harvest is sealed, you could withdraw it.</p></details>
            <button className="o-act" onClick={place}>Place it by the Fire (demo)</button><button className="linkish" onClick={() => setStep('compose')}>Back</button>
          </>}
          {step === 'placing' && <div className="placing" role="status" aria-live="polite"><span className="fire-centre">✦</span><p>Showing how your offering would be placed…</p></div>}
          {step === 'receipt' && <section className="rest" aria-label="Fire demo receipt"><span className="fire-centre" aria-hidden="true">✦</span><dl className="receipt-details"><dt>Circle</dt><dd>StarPod Circle 238 · yOur Blooming Week</dd><dt>Lived</dt><dd>{draft.practice}</dd><dt>Your words</dt><dd>{draft.words.slice(0, 240)}{draft.words.length > 240 ? '…' : ''}</dd><dt>Who sees it</dt><dd>{draft.curatorReview ? 'Curator review intention — not sent' : 'Only me — private intention'}</dd><dt>Read aloud</dt><dd>{draft.readAloud && draft.curatorReview ? 'Opted in — not sent' : 'No'}</dd></dl><p className="note">Demo — not saved, not submitted, not published. Nothing was stored or sent.</p><button className="o-act" onClick={reset}>Bring something else to the Fire</button><button className="linkish" onClick={onClose}>Return to the Council</button></section>}
        </div>
      </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
