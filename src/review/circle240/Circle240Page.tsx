import { createElement, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CouncilTimeTree from '@/components/council/CouncilTimeTree';
import '@/review/circle237/pilot.css';

const spatial = '/tetol/circle-235/pre-fire/tetol.html?circle=240';

type Companion = { key: string; label: string; kind: string; id: string; artwork: string; alt: string; scientificName?: string };

export default function Circle240Page() {
  const [catalogue, setCatalogue] = useState<Companion[]>([]);
  const [inquiry, setInquiry] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [query, setQuery] = useSearchParams();
  const selected = catalogue.find(item => item.key === query.get('companion'));
  useEffect(() => {
    let mounted = true;
    fetch('/council/circle-240/catalogue.json').then(response => {
      if (!response.ok) throw new Error('Circle 240 unavailable');
      return response.json();
    }).then(edition => {
      if (!mounted) return;
      setCatalogue(edition.companions);
      setInquiry(edition.question);
      if (!document.getElementById('circle240-living-frame')) {
        const script = document.createElement('script');
        script.id = 'circle240-living-frame';
        script.type = 'module';
        script.src = '/council/circle-240/frame.js';
        document.head.append(script);
      }
    }).catch(() => { if (mounted) setUnavailable(true); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    const frame = document.querySelector('council-240-frame');
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
    <CouncilTimeTree number={240} />
    <h1 id="circle240-heading" tabIndex={-1}>Circle 240 · Current Council</h1>
    <p>{inquiry ?? 'The inquiry is unavailable.'}</p>
    <a href="#circle240-fire">Visit the Fire</a>
    <Link to="/council/239">Return to Circle 239</Link>
    {unavailable && <p role="status">Circle 240 artwork is unavailable.</p>}
    {!!catalogue.length && <p><a href={spatial + '#' + (selected?.id ?? 'croom')}>Open in the original TETOL →</a></p>}
    {selected ? <section>
      <h2 id="circle240-companion" tabIndex={-1}>{selected.label}</h2>
      {selected.scientificName && <p><i>{selected.scientificName}</i></p>}
      {createElement('council-240-frame', {key:selected.key, 'companion-key':selected.key, label:selected.label,
        front:selected.artwork, 'front-alt':selected.alt, side:query.get('side') === 'reverse' ? 'reverse' : 'front'})}
      <p><Link to="/council/240">All Circle 240 companions</Link></p>
    </section> : <section className="gallery" aria-label="Ten Council companions">
      {catalogue.map(item => <article className="portrait" key={item.key}>
        <h2>{item.label}</h2><p>{item.kind}</p>
        <img className="companion-scene" src={item.artwork} alt={item.alt} width={1536} height={1024} loading="lazy" style={{width:'100%',height:'auto'}} />
        <Link to={'?companion=' + item.key}>Meet {item.label}</Link>
      </article>)}
    </section>}
    <div id="circle240-fire">{createElement('circle240-hearth')}</div>
  </main>;
}
