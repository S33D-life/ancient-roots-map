import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { appearance, identities, introductions, isCompanionKey, pilotState, returnHref, roster, type CompanionKey } from '@/review/circle237/registry';
import { invitation, publicationBlockers } from '@/review/circle237/invitation';
import { identityOpening } from '@/lib/library/contextualReturn';
import { sameIdentity } from '@/lib/library/recordIdentity';
describe('Circle 237 isolated portal contract',()=>{
  it('keeps ten unique appearances with pending art and the agreed roles',()=>{
    expect(roster).toHaveLength(10); expect(new Set(roster.map(c=>c.appearanceId)).size).toBe(10);
    expect(roster.every(c=>c.artwork===null)).toBe(true);
    expect(roster.map(c=>c.category)).toEqual(['Ancient Friend','Tree Species','Plant','Seed','Leaf','Flower','Fruit','Fungi','Book','Bird']);
  });
  it.each(['noku','fly-agaric'] as const)('preserves one identity for both modes: %s',key=>{
    const a=identityOpening(appearance(key,'2d'))!, b=identityOpening(appearance(key,'spatial'))!;
    expect(sameIdentity(a.identity,b.identity)).toBe(true); expect(a.identity).toEqual(identities[key]);
    for(const mode of ['2d','spatial'] as const){ const s=pilotState(new URL(returnHref(key,mode),'http://localhost').search); expect(s).toMatchObject({mode,view:'council',returned:key}); }
  });
  it('rejects unknown identities and ignores arbitrary return authority',()=>{
    expect(pilotState('?companion=private-tree&view=record&return=https://evil.test')).toMatchObject({view:'council',key:null});
    expect(pilotState('?companion=fly-agaric&view=twin').view).toBe('council');
    expect(pilotState('?mode=evil&returned=private-person')).toMatchObject({mode:'2d',returned:null});
    expect(()=>returnHref('private-person' as CompanionKey,'2d')).toThrow('Unregistered companion');
  });
  it.each(roster)('opens and returns from the registered appearance $key without inventing an identity',c=>{
    expect(isCompanionKey(c.key)).toBe(true);
    expect(introductions[c.key as CompanionKey]).toBeTruthy();
    for(const mode of ['2d','spatial'] as const){
      expect(pilotState(`?mode=${mode}&view=encounter&companion=${c.key}`)).toMatchObject({mode,view:'encounter',key:c.key});
      expect(pilotState(new URL(returnHref(c.key as CompanionKey,mode),'http://localhost').search)).toMatchObject({mode,view:'council',returned:c.key});
    }
    if(c.key!=='noku'&&c.key!=='fly-agaric')expect(pilotState(`?view=record&companion=${c.key}`).view).toBe('council');
  });
  it('keeps the invitation unapproved with no inherited event details',()=>{
    expect(invitation.approved).toBe(false);
    expect(invitation.approvedQuestion).toBeNull();
    expect(invitation.openingFireDate).toBeNull();
    expect(invitation.openingFireTimeUK).toBeNull();
    expect(invitation.joiningLink).toBeNull();
    expect(publicationBlockers()).toHaveLength(5);
    expect(pilotState('?view=invitation').view).toBe('invitation');
    expect(JSON.stringify(invitation)).not.toMatch(/13 October|235|236/);
  });
  it('keeps source boundaries in executable projection',()=>{
    const source=readFileSync('src/review/circle237/main.tsx','utf8');
    expect(source).toContain('distinct from the Camp Unicorn fig');
    expect(source).toContain('Circle 234: remembered appearance');
    expect(source).toContain('taxonomy-index binding remains unresolved');
    expect(source).toContain('not surveyed field geometry');
    expect(source).toContain('encounter / gathering date unconfirmed');
    expect(source).not.toMatch(/supabase|fetch\(|localStorage|serviceWorker/);
  });
});
