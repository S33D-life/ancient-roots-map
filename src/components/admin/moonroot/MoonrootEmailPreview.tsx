import { Card, CardContent } from "@/components/ui/card";
import CopyButton from "./CopyButton";
import {
  buildMoonrootEmailMarkdown,
  buildMoonrootEmailPlainText,
  buildMoonrootEmailSubject,
} from "@/lib/moonroot/buildEmail";
import type { MoonrootDigest } from "@/lib/moonroot/types";

export default function MoonrootEmailPreview({ digest }: { digest: MoonrootDigest }) {
  const subject = buildMoonrootEmailSubject(digest);
  const markdown = buildMoonrootEmailMarkdown(digest);
  const plain = buildMoonrootEmailPlainText(digest);

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={subject} label="Copy subject" />
        <CopyButton text={plain} label="Copy email text" />
        <CopyButton text={markdown} label="Copy markdown" />
      </div>
      <Card className="bg-[hsl(var(--card))]/80 border-primary/20 shadow-inner">
        <CardContent className="p-6 md:p-8">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-serif mb-2">Subject</div>
          <div className="font-serif text-lg md:text-xl text-foreground mb-6 border-b border-primary/10 pb-4">
            {subject}
          </div>
          <div className="prose prose-sm max-w-none font-serif text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {markdown}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
