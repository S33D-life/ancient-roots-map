/** Durable references, not a second knowledge store. Source adapters own content and access. */
import { z } from "zod";

const uuid = z.string().uuid();
export const identityRefSchema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("notion"), id: uuid }).strict(),
  z.object({ source: z.literal("species-index"), id: uuid, speciesKey: z.string().min(1) }).strict(),
  z.object({ source: z.literal("trees"), id: uuid }).strict(),
]);
export type IdentityRef = z.infer<typeof identityRefSchema>;

const descriptorSchema = z.object({
  ref: identityRefSchema,
  scope: z.enum(["genus", "species", "individual", "subject"]),
  label: z.string().min(1),
  scientificName: z.string().min(1).optional(),
}).strict();
export type IdentityDescriptor = z.infer<typeof descriptorSchema>;
export type IdentitySource = (ref: IdentityRef) => Promise<IdentityDescriptor | null>;
export type IdentitySources = Partial<Record<IdentityRef["source"], IdentitySource>>;

export function sameIdentity(a: IdentityRef, b: IdentityRef): boolean {
  return a.source === b.source && a.id === b.id &&
    (a.source !== "species-index" || (b.source === "species-index" && a.speciesKey === b.speciesKey));
}

/** No fuzzy fallback, genus substitution, implicit publication or access upgrade. */
export async function resolveRecordIdentity(input: unknown, sources: IdentitySources): Promise<
  { status: "ready"; identity: IdentityDescriptor } | { status: "stop"; reason: string }
> {
  const parsed = identityRefSchema.safeParse(input);
  if (!parsed.success) return { status: "stop", reason: "invalid-reference" };
  const ref = parsed.data;
  const source = sources[ref.source];
  if (!source) return { status: "stop", reason: "source-unavailable" };
  try {
    const result = descriptorSchema.safeParse(await source(ref));
    if (!result.success) return { status: "stop", reason: "record-unavailable" };
    const identity = result.data;
    if (!sameIdentity(ref, identity.ref)) return { status: "stop", reason: "identity-mismatch" };
    if ((ref.source === "species-index" && identity.scope !== "species") ||
        (ref.source === "trees" && identity.scope !== "individual")) {
      return { status: "stop", reason: "scope-mismatch" };
    }
    return { status: "ready", identity };
  } catch {
    return { status: "stop", reason: "source-error" };
  }
}

const relationshipSchema = z.object({
  kind: z.enum(["species-strand", "individual-of-species"]),
  from: identityRefSchema,
  to: identityRefSchema,
  evidence: z.array(identityRefSchema).min(1),
}).strict();
export type IdentityRelationship = z.infer<typeof relationshipSchema>;

/** Validate supplied relationships; never derive them from names, tags or co-presence. */
export async function resolveIdentityRelationship(input: unknown, sources: IdentitySources): Promise<IdentityRelationship | null> {
  const parsed = relationshipSchema.safeParse(input);
  if (!parsed.success) return null;
  const relation = parsed.data;
  if (sameIdentity(relation.from, relation.to)) return null;
  const [from, to] = await Promise.all([
    resolveRecordIdentity(relation.from, sources), resolveRecordIdentity(relation.to, sources),
  ]);
  if (from.status !== "ready" || to.status !== "ready") return null;
  const scopes = relation.kind === "species-strand" ? ["genus", "species"] : ["species", "individual"];
  return from.identity.scope === scopes[0] && to.identity.scope === scopes[1] ? relation : null;
}
