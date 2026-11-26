import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ROUTES } from '@/lib/routes';
import { SUPPORT_CONFIG } from '@/lib/support-config';
import { useDocumentTitle } from '@/hooks/use-document-title';

/** Informational only: no collection, checkout, account provisioning or payment hooks. */
export default function FoundingGatewayPage() {
  useDocumentTitle('Welcome to S33D · Founding invitation');
  const linkStyle = 'inline-flex items-center min-h-11 rounded-lg border border-primary/40 px-4 py-3 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary';
  return <div className="min-h-screen flex flex-col bg-background text-foreground">
    <Header />
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 space-y-8" style={{ paddingTop: 'var(--content-top)' }}>
      <header className="pt-8 space-y-4">
        <p className="text-sm font-serif tracking-wide text-muted-foreground">A founding invitation</p>
        <h1 className="font-serif text-3xl sm:text-5xl leading-tight">Welcome to S33D</h1>
        <p className="font-serif text-lg max-w-3xl">Discover ancient trees, share what life teaches you, and help grow a living library for everyone.</p>
      </header>
      <section aria-labelledby="free-wanderer" className="rounded-2xl border border-primary/30 bg-card p-5 sm:p-7 space-y-4">
        <h2 id="free-wanderer" className="font-serif text-2xl">Enter freely as a Wanderer</h2>
        <p>No purchase or donation is required to discover Ancient Friends, contribute to the Living Library or explore the weekly Council of Life.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Discover and map Ancient Friends. Contributions use a free account where sign-in is needed.</li>
          <li>Leave offerings and Whispers under their existing participation rules. Some group Whisper channels use earned Hearts; eligibility and invitation rules still apply.</li>
          <li>Explore the weekly Council of Life. Join live Fires when they are announced; this page announces no live Fire.</li>
        </ul>
        <nav aria-label="Free Wanderer entrances" className="flex flex-wrap gap-3">
          <Link className={linkStyle} to={ROUTES.MAP}>Explore Ancient Friends</Link>
          <Link className={linkStyle} to={ROUTES.COUNCIL}>Visit the weekly Council</Link>
          <Link className={linkStyle} to={ROUTES.AUTH}>Join or sign in for free</Link>
        </nav>
      </section>
      <section aria-label="Two distinct ways to support S33D" className="grid gap-6 md:grid-cols-2">
        <article aria-labelledby="founding-groves" className="rounded-2xl border border-border bg-card p-5 sm:p-7 space-y-4">
          <p className="text-sm text-muted-foreground">Founding Grove - account required</p>
          <h2 id="founding-groves" className="font-serif text-2xl">The First 1,000 Life Groves</h2>
          <p>A private place for families and friends to gather chosen memories around an Ethereal Tree.</p>
          <p><strong>£33 Founding Grove:</strong> one year of S33D access including a private Life Grove with Founding Grove status. An S33D account is required. Your year begins when you activate your Grove.</p>
          <p>First invitations are planned from 21 December 2026. Manually issued invitations will support new and existing accounts.</p>
          <a className={linkStyle} href="https://www.crowdfunder.co.uk/p/s33d" target="_blank" rel="noopener noreferrer">View the S33D Crowdfunder</a>
          <p>Papaya Seed is the campaign recipient. No checkout is enabled on this page.</p>
          <p>Renewal is optional. Founding Grove Keepers will be offered the lowest available renewal price for the equivalent plan. Renewal details, memory access after non-renewal, and the duration of Founding status after year one must be confirmed before activation.</p>
          <p>Life Grove activation is being prepared. Private-media, account and recovery checks must pass before invitations are issued.</p>
        </article>
        <article aria-labelledby="giveth-commons" className="rounded-2xl border border-border bg-card p-5 sm:p-7 space-y-4">
          <p className="text-sm text-muted-foreground">Voluntary public-goods support · Giveth</p>
          <h2 id="giveth-commons" className="font-serif text-2xl">Gift to the Commons</h2>
          <p>Support the free Ancient Friends Atlas, Council of Life, Heartwood Library and wider Planetary Living Library, including shared infrastructure and human tending.</p>
          <p>Donations do not purchase a Grove, premium access, tokens, Hearts or other product rewards.</p>
          <a className={linkStyle} href={SUPPORT_CONFIG.external.giveth.url} target="_blank" rel="noopener noreferrer">View the existing S33D Giveth project</a>
          <p className="text-sm text-muted-foreground">No donation totals, matching or eligibility are claimed here. Giveth project activation and recipient verification remain separate owner checks.</p>
        </article>
      </section>
      <footer className="border-t border-border pt-6 space-y-3">
        <h2 className="font-serif text-xl">An invitation, not a checkout</h2>
        <p>This page collects no personal details, expressions of interest or payments. The Ancient Friends map remains free.</p>
        <p className="font-serif italic">The living commons remain free. Founding Life Groves are being prepared for backer activation.</p>
      </footer>
    </main>
    <Footer />
  </div>;
}
