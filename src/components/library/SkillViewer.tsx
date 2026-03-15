/**
 * SkillViewer — Renders S33D skill markdown documents with navigation.
 * Integrated into the Dev Room as a "Skills" section.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen, ArrowLeft, MapPin, Database, Bug, GitBranch,
  Heart, Terminal, Loader2, Sprout, ChevronRight
} from "lucide-react";

/* ── Skill metadata ── */
export interface SkillMeta {
  slug: string;
  title: string;
  tagline: string;
  icon: React.ReactNode;
  category: string;
}

export const SKILLS: SkillMeta[] = [
  { slug: "SKILL",                 title: "S33D Skills — Root",      tagline: "Start here",                        icon: <Sprout className="w-4 h-4" />,    category: "root" },
  { slug: "map-verification",      title: "Map Verification",        tagline: "Verify tree locations on the Atlas", icon: <MapPin className="w-4 h-4" />,    category: "tree_data" },
  { slug: "tree-dataset-ingestion", title: "Dataset Ingestion",      tagline: "Parse & import tree datasets",      icon: <Database className="w-4 h-4" />,  category: "tree_data" },
  { slug: "bug-garden",            title: "Bug Garden",              tagline: "Report bugs & QA issues",           icon: <Bug className="w-4 h-4" />,       category: "bug_qa" },
  { slug: "roadmap-linking",       title: "Roadmap Linking",         tagline: "Connect needs to the roadmap",      icon: <GitBranch className="w-4 h-4" />, category: "roadmap" },
  { slug: "heart-rewards",         title: "Heart Rewards",           tagline: "Understand the Heart economy",      icon: <Heart className="w-4 h-4" />,     category: "reference" },
  { slug: "dev-room",              title: "Dev Room",                tagline: "Navigate the Tap Root",             icon: <Terminal className="w-4 h-4" />,  category: "reference" },
];

/** Map from task category → relevant skill slugs */
export const CATEGORY_SKILLS: Record<string, string[]> = {
  tree_data: ["map-verification", "tree-dataset-ingestion"],
  bug_qa:    ["bug-garden"],
  roadmap:   ["roadmap-linking"],
  research:  ["tree-dataset-ingestion", "map-verification"],
};

/* ── Simple markdown → JSX ── */
function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let listOrdered = false;

  function flushTable() {
    if (tableRows.length < 2) return;
    const headers = tableRows[0];
    const body = tableRows.slice(2); // skip separator row
    elements.push(
      <div key={`tbl-${elements.length}`} className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>{headers.map((h, i) => <th key={i} className="text-left px-3 py-2 border-b border-border/30 text-xs font-semibold text-foreground/80">{renderInline(h.trim())}</th>)}</tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} className="border-b border-border/10 last:border-0">
                {row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-muted-foreground">{renderInline(cell.trim())}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  }

  function flushList() {
    if (listItems.length === 0) return;
    const Tag = listOrdered ? "ol" : "ul";
    const cls = listOrdered ? "list-decimal" : "list-disc";
    elements.push(
      <Tag key={`list-${elements.length}`} className={`${cls} pl-6 my-3 space-y-1 text-sm text-muted-foreground`}>
        {listItems.map((li, i) => <li key={i}>{li}</li>)}
      </Tag>
    );
    listItems = [];
    inList = false;
  }

  function renderInline(text: string): React.ReactNode {
    // Bold, links, inline code, italic
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*)|(\[(.+?)\]\((.+?)\))|(`(.+?)`)|(\*(.+?)\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
      if (match[1]) parts.push(<strong key={key++} className="font-semibold text-foreground">{match[2]}</strong>);
      else if (match[3]) parts.push(<a key={key++} href={match[5]} className="text-primary underline underline-offset-2 hover:text-primary/80">{match[4]}</a>);
      else if (match[6]) parts.push(<code key={key++} className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono text-foreground">{match[7]}</code>);
      else if (match[8]) parts.push(<em key={key++}>{match[9]}</em>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table rows
    if (line.trim().startsWith("|")) {
      if (!inTable) { flushList(); inTable = true; }
      const cells = line.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Checklist
    if (/^- \[[ x]\] /.test(line.trim())) {
      if (!inList) { inList = true; listOrdered = false; }
      const checked = line.includes("[x]");
      const text = line.replace(/^- \[[ x]\] /, "").trim();
      listItems.push(
        <span className="flex items-start gap-2">
          <span className={`mt-0.5 w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[10px] ${checked ? "bg-primary/20 border-primary/40 text-primary" : "border-border/40"}`}>
            {checked ? "✓" : ""}
          </span>
          <span>{renderInline(text)}</span>
        </span>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line.trim())) {
      if (!inList || !listOrdered) { flushList(); inList = true; listOrdered = true; }
      listItems.push(renderInline(line.replace(/^\d+\.\s/, "").trim()));
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(line.trim())) {
      if (!inList || listOrdered) { flushList(); inList = true; listOrdered = false; }
      listItems.push(renderInline(line.replace(/^[-*]\s/, "").trim()));
      continue;
    }

    if (inList) flushList();

    // Headers
    if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-2xl font-serif font-bold text-foreground mt-6 mb-2">{renderInline(line.slice(2))}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-lg font-serif font-semibold text-foreground mt-5 mb-2 border-b border-border/20 pb-1">{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-base font-semibold text-foreground mt-4 mb-1">{renderInline(line.slice(4))}</h3>);
    }
    // Blockquote
    else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-primary/30 pl-4 my-3 text-sm italic text-muted-foreground">
          {renderInline(line.slice(2))}
        </blockquote>
      );
    }
    // Horizontal rule
    else if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} className="my-4 border-border/20" />);
    }
    // Empty line
    else if (line.trim() === "") {
      // skip
    }
    // Paragraph
    else {
      elements.push(<p key={i} className="text-sm text-muted-foreground leading-relaxed my-2">{renderInline(line)}</p>);
    }
  }
  if (inTable) flushTable();
  if (inList) flushList();

  return <>{elements}</>;
}

/* ── Main component ── */
export function SkillViewer() {
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function loadSkill(slug: string) {
    setLoading(true);
    setActiveSkill(slug);
    try {
      const res = await fetch(`/skills/${slug}.md`);
      if (!res.ok) throw new Error("Not found");
      setContent(await res.text());
    } catch {
      setContent(`# Skill not found\n\nThe skill document \`${slug}.md\` could not be loaded.`);
    }
    setLoading(false);
  }

  if (activeSkill) {
    const meta = SKILLS.find(s => s.slug === activeSkill);
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="skill-detail"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          className="space-y-4"
        >
          <Button variant="ghost" size="sm" onClick={() => setActiveSkill(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> All Skills
          </Button>

          <Card className="border-primary/10 bg-card/50">
            <CardContent className="p-5 sm:p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="prose-s33d">{renderMarkdown(content)}</div>
              )}
            </CardContent>
          </Card>

          {/* Related skills */}
          {meta && meta.slug !== "SKILL" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground/60 font-medium">Related skills</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => loadSkill("SKILL")}>
                  <Sprout className="w-3.5 h-3.5 mr-1" /> Root Skill
                </Button>
                {SKILLS.filter(s => s.slug !== activeSkill && s.slug !== "SKILL" && s.category === meta.category).map(s => (
                  <Button key={s.slug} variant="ghost" size="sm" className="text-xs" onClick={() => loadSkill(s.slug)}>
                    {s.icon} <span className="ml-1">{s.title}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Skill index ──
  const root = SKILLS.find(s => s.slug === "SKILL")!;
  const subSkills = SKILLS.filter(s => s.slug !== "SKILL");

  return (
    <div className="space-y-5">
      {/* Root skill card */}
      <Card
        className="border-primary/15 bg-primary/5 cursor-pointer hover:bg-primary/8 transition-colors group"
        onClick={() => loadSkill(root.slug)}
      >
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-semibold text-foreground text-sm">{root.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{root.tagline} — read this first</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </CardContent>
      </Card>

      {/* Sub-skills grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {subSkills.map(skill => (
          <Card
            key={skill.slug}
            className="border-border/20 bg-card/30 cursor-pointer hover:bg-card/50 transition-colors group"
            onClick={() => loadSkill(skill.slug)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                {skill.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground">{skill.title}</h4>
                <p className="text-[11px] text-muted-foreground/70 truncate">{skill.tagline}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
