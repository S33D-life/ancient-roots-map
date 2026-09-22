/**
 * OfferingLibraryCard — each offering shown as what it actually is.
 * A photograph looks like a photograph. A song looks like a song.
 */
import { ExternalLink, Music, BookOpen } from "lucide-react";
import type { LifeGroveOffering } from "@/lib/life-groves/types";
import { useOfferingMediaUrl } from "@/utils/offeringMedia";

interface Props {
  offering: LifeGroveOffering;
  attribution?: string;
}

function meta(o: LifeGroveOffering): Record<string, unknown> {
  const m = (o as unknown as { media_metadata?: unknown }).media_metadata;
  return m && typeof m === "object" ? (m as Record<string, unknown>) : {};
}

const Frame = ({ children }: { children: React.ReactNode }) => (
  <article className="rounded-2xl border border-border/30 bg-card/40 overflow-hidden">{children}</article>
);

const Attribution = ({ name, when }: { name?: string; when: string }) => (
  <p className="font-serif text-[11px] text-muted-foreground/60 px-4 pb-3">
    Offered by {name || "a Wanderer"} · {new Date(when).toLocaleDateString()}
  </p>
);

export default function OfferingLibraryCard({ offering: o, attribution }: Props) {
  const m = meta(o);
  // Private-bucket media needs a short-lived signed URL before it can render.
  const mediaUrl = useOfferingMediaUrl(o.media_url, o.id);
  const words = o.body_text?.trim();

  const body = (() => {
    switch (o.offering_type) {
      case "photo":
        return (
          <>
            {mediaUrl && <img src={mediaUrl} alt={o.title ?? "A photograph"} loading="lazy" className="w-full object-cover max-h-[60vh]" />}
            <div className="px-4 pt-3 space-y-1">
              {o.title && <h3 className="font-serif text-base text-foreground">{o.title}</h3>}
              {words && <p className="font-serif text-sm text-foreground/85 whitespace-pre-wrap">{words}</p>}
            </div>
          </>
        );

      case "song":
        return (
          <div className="p-4 flex gap-3">
            {typeof m.artworkUrl === "string" ? (
              <img src={m.artworkUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Music className="h-5 w-5 text-primary/50" />
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <h3 className="font-serif text-base text-foreground truncate">{o.title}</h3>
              {typeof m.artist === "string" && (
                <p className="font-serif text-xs text-muted-foreground/70 truncate">{m.artist}</p>
              )}
              {words && <p className="font-serif text-sm text-foreground/85 whitespace-pre-wrap">{words}</p>}
              {typeof m.externalUrl === "string" && (
                <a href={m.externalUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 font-serif text-xs text-primary hover:underline">
                  Listen <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        );

      case "book":
        return (
          <div className="p-4 flex gap-3">
            {typeof m.coverUrl === "string" ? (
              <img src={m.coverUrl} alt="" className="w-14 h-20 rounded object-cover shrink-0" />
            ) : (
              <div className="w-14 h-20 rounded bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-primary/50" />
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <h3 className="font-serif text-base text-foreground">{o.title}</h3>
              {typeof m.author === "string" && (
                <p className="font-serif text-xs text-muted-foreground/70">{m.author}</p>
              )}
              {words && <p className="font-serif text-sm text-foreground/85 whitespace-pre-wrap">{words}</p>}
            </div>
          </div>
        );

      case "voice_note":
        return (
          <div className="p-4 space-y-2">
            {o.title && <h3 className="font-serif text-base text-foreground">{o.title}</h3>}
            {mediaUrl && <audio controls src={mediaUrl} className="w-full" />}
            {words && <p className="font-serif text-sm text-foreground/85 whitespace-pre-wrap">{words}</p>}
          </div>
        );

      case "poem":
        return (
          <div className="p-4 space-y-1">
            {o.title && <h3 className="font-serif text-base text-foreground">{o.title}</h3>}
            {typeof m.poet === "string" && m.poet && (
              <p className="font-serif text-xs text-muted-foreground/70">{m.poet}</p>
            )}
            {words && (
              <p className="font-serif text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed italic">{words}</p>
            )}
            {typeof m.sourceUrl === "string" && m.sourceUrl && (
              <a href={m.sourceUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 font-serif text-xs text-primary hover:underline">
                Read it whole <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        );

      case "letter":
        return (
          <div className="p-5 space-y-2" style={{ background: "hsl(var(--primary) / 0.03)" }}>
            {o.title && <h3 className="font-serif text-base text-foreground">{o.title}</h3>}
            {words && (
              <p className="font-serif text-[15px] text-foreground/90 whitespace-pre-wrap leading-[1.9]">{words}</p>
            )}
          </div>
        );

      default:
        // story, recipe, flower memory and anything new
        return (
          <>
            {mediaUrl && <img src={mediaUrl} alt="" loading="lazy" className="w-full object-cover max-h-[50vh]" />}
            <div className="px-4 pt-3 space-y-1">
              {o.title && <h3 className="font-serif text-base text-foreground">{o.title}</h3>}
              {words && <p className="font-serif text-sm text-foreground/85 whitespace-pre-wrap">{words}</p>}
            </div>
          </>
        );
    }
  })();

  return (
    <Frame>
      {body}
      <Attribution name={attribution ?? o.contributor_name} when={o.created_at} />
    </Frame>
  );
}
