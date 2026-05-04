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
      <Card className="bg-card/70 border-primary/20">
        <CardContent className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-serif mb-1">Subject</div>
          <div className="font-serif text-base text-foreground mb-4">{subject}</div>
          <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-foreground/90">
{markdown}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
