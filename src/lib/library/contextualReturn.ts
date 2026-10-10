/** Appearance owns context; PLANeTary owns neither that context nor its authorisation. */
import { z } from "zod";
import { ROUTES } from "@/lib/routes";
import { identityRefSchema, type IdentityRef } from "./recordIdentity";
import { returnPathFor, type LibraryOrigin } from "./origin";

const token = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,95}$/);
const circle = z.string().regex(/^council-of-life\/circle-[1-9][0-9]{0,5}$/);
const councilReturnSchema = z.object({
  route: z.literal("council"), realm: z.literal("canopy"), contextId: circle,
  appearanceId: token, mode: z.enum(["2d", "spatial"]), focusTarget: token.optional(),
}).strict();
export const returnContextSchema = z.discriminatedUnion("route", [
  z.object({ route: z.literal("tree"), realm: z.literal("roots"), contextId: z.string().uuid() }).strict(),
  councilReturnSchema,
]);
export type ReturnContext = z.infer<typeof returnContextSchema>;
export type CouncilReturn = z.infer<typeof councilReturnSchema>;
const RETURN_PARAM = "recordReturn";

/** Optional refresh-safe transport. Parsing is not source registration or permission. */
export function returnContextParams(input: unknown): URLSearchParams {
  const parsed = returnContextSchema.safeParse(input);
  return parsed.success ? new URLSearchParams({ [RETURN_PARAM]: JSON.stringify(parsed.data) }) : new URLSearchParams();
}

export function parseReturnContext(params: URLSearchParams): ReturnContext | null {
  const values = params.getAll(RETURN_PARAM);
  if (values.length !== 1 || values[0].length > 1024) return null;
  try {
    const parsed = returnContextSchema.safeParse(JSON.parse(values[0]));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
export const appearanceSchema = z.object({
  id: token,
  contextId: circle,
  identity: identityRefSchema,
  contextNote: z.string().optional(),
  artifactRef: z.string().min(1).optional(),
  order: z.number().int().nonnegative().optional(),
  returnContext: returnContextSchema,
}).strict();
export type ContextualAppearance = z.infer<typeof appearanceSchema>;

/** A reference to artwork is not the artwork's approval or its subject's identity. */
export function parseAppearance(input: unknown): ContextualAppearance | null {
  const parsed = appearanceSchema.safeParse(input);
  if (!parsed.success) return null;
  const a = parsed.data, r = a.returnContext;
  return r.route === "council" && r.contextId === a.contextId && r.appearanceId === a.id ? a : null;
}

/** Compatibility bridge; legacy query parsing and existing Library UI stay unchanged. */
export function treeReturnContext(origin: LibraryOrigin | null): ReturnContext | null {
  if (!origin) return null;
  const parsed = returnContextSchema.safeParse({ route: "tree", realm: "roots", contextId: origin.id });
  return parsed.success ? parsed.data : null;
}

export interface ReturnSources {
  treeAvailable: (id: string) => boolean;
  /** Source owner supplies only contexts available to this viewer. Never trust query state as authority. */
  councilAppearance: (contextId: string, appearanceId: string) => ContextualAppearance | null;
}
export interface ContextualReturnTarget {
  pathname: string;
  state?: { libraryReturn: CouncilReturn };
}

/** Routes are constructed internally. No URL, selector or unregistered Circle accepted. */
export function contextualReturnTarget(input: unknown, sources: ReturnSources): ContextualReturnTarget {
  const fallback = { pathname: ROUTES.LIBRARY };
  const parsed = returnContextSchema.safeParse(input);
  if (!parsed.success) return fallback;
  const context = parsed.data;
  try {
    if (context.route === "tree") {
      return { pathname: returnPathFor({ type: "ancient-friend", id: context.contextId }, sources.treeAvailable(context.contextId)) };
    }
    const a = parseAppearance(sources.councilAppearance(context.contextId, context.appearanceId));
    if (!a) return fallback;
    const trusted = a.returnContext;
    if (trusted.route !== "council" || trusted.contextId !== context.contextId ||
        trusted.appearanceId !== context.appearanceId || trusted.mode !== context.mode) return fallback;
    // Focus comes from the registered appearance, never the caller's focus string.
    return { pathname: ROUTES.COUNCIL, state: { libraryReturn: trusted } };
  } catch {
    return fallback;
  }
}

/** Call after the destination appearance mounts. No arbitrary CSS selectors or scene-state engine. */
export function restoreAppearanceFocus(context: CouncilReturn, root: Document = document): boolean {
  const parsed = returnContextSchema.safeParse(context);
  if (!parsed.success || parsed.data.route !== "council") return false;
  const element = root.getElementById(parsed.data.focusTarget ?? parsed.data.appearanceId);
  if (!(element instanceof HTMLElement)) return false;
  element.focus({ preventScroll: true });
  return root.activeElement === element;
}

/** Opening carries a reference + appearance return, not a copied detail record or arbitrary route. */
export function identityOpening(appearance: unknown): { identity: IdentityRef; returnContext: ReturnContext } | null {
  const a = parseAppearance(appearance);
  return a ? { identity: a.identity, returnContext: a.returnContext } : null;
}
