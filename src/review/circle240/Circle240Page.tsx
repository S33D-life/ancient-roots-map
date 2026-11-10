import { createElement, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadEdition, spatial } from './edition.js';
import '@/review/circle237/pilot.css';

type Companion = { key: string; label: string; kind: string; id: string; artwork: string; alt: string; scientificName?: string; proofPending?: boolean };

export default function Circle240Page() {
  const [catalogue, setCatalogue] = useState<Companion[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [query, setQuery] = useSearchParams();
  const selected = catalogue.find(item => item.key === query.get('companion'));
  useEffect(() => {
    let mounted = true;
    loadEdition().then(edition => {
      if (!mounted) return;
      setCatalogue(edition.companions);
      if (!document.getElementById('circle240-living-frame')) {
        const script = document.createElement('script');
        script.id = 'circle240-living-frame';
        script.type = 'module';
        script.src = '/src/review/circle240/frame.js';
        document.head.append(script);
      }
    }).catch(() => { if (mounted) setUnavailable(true); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    const frame = document.querySelector('council-preview-frame');
    const turn = (event: Event) => {
      if (!selected) return;
      const next = new URLSearchParams({companion: selected.key});
      if ((event as CustomEvent).detail.side === 'reverse') next.set('side', 'reverse');
      setQuery(next);
    };
    frame?.addEventListener('council-frame-turn', turn);
    return () => frame?.removeEventListener('council-frame-turn', turn);
  }, [selected, setQuery]);
  useEffect(() => { document.getElementById(selected ? 'circle240-companion' : 'circle240-heading')?.focus(); }, [selected]);
  return <main className="circle237">
    <h1 id="circle240-heading" tabIndex={-1}>Circle 240 · Private review</h1>
    <p>Inquiry awaiting approval. No scheduled Fire.</p>
    <Link to="/council/239">Return to Circle 239</Link>
    {unavailable && <p role="status">Circle 240 artwork is unavailable in this preview.</p>}
    {!!catalogue.length && <p><a href={spatial + '#' + (selected?.id ?? 'croom')}>Open in the original TETOL →</a></p>}
    {selected ? <section>
      <h2 id="circle240-companion" tabIndex={-1}>{selected.label}</h2>
      {selected.scientificName && <p><i>{selected.scientificName}</i></p>}
      {selected.proofPending && <p>Working proof · approval pending.</p>}
      {createElement('council-preview-frame', {key:selected.key, 'companion-key':selected.key, label:selected.label,
        front:selected.artwork, 'front-alt':selected.alt, side:query.get('side') === 'reverse' ? 'reverse' : 'front'})}
      <p><Link to="/council/240">All Circle 240 companions</Link></p>
    </section> : <ol>{catalogue.map(item => <li key={item.key}><Link to={'?companion=' + item.key}>{item.label}</Link> · {item.kind}</li>)}</ol>}
  </main>;
}
