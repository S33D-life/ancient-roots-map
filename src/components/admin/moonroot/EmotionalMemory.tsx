import type { AncientFriendsSummary } from "@/lib/moonroot/types";

export default function EmotionalMemory({ summary }: { summary: AncientFriendsSummary }) {
  if (!summary.emotionalMemory.length) return null;
  return (
    <ul className="space-y-3 max-w-md mx-auto">
      {summary.emotionalMemory.map((line, i) => (
        <li
          key={i}
          className="font-serif italic text-foreground/85 text-center text-sm md:text-base leading-relaxed"
        >
          {line}
        </li>
      ))}
    </ul>
  );
}
