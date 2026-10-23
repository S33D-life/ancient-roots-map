import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { invitation } from '@/review/circle237/invitation';
import { ROUTES } from '@/lib/routes';
import { pilotHref, returnHref, pilotState } from '@/review/circle237/registry';
import current236 from '../../public/council/circle-236/companions.json';

describe('Circle 237 as the open current Canopy Council, with historical Circles preserved', () => {
  it('opens the Council without advertising an unconfirmed live Fire or an unsent invitation', () => {
    expect(invitation.openingFireDate).toBeNull();
    expect(invitation.openingFireTimeUK).toBeNull();
    expect(invitation.joiningLink).toBeNull();
    expect(invitation.communityLink).toBe('https://t.me/s33dlife');
    expect(invitation.approvedQuestion).toBe('What is life teaching us through the beings we encounter?');
    expect(invitation.approved).toBe(false);
    for (const file of ['src/pages/CouncilOfLifePage.tsx', 'src/components/council/Circle237Experience.tsx']) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/20 October|2026-10-20/);
    }
    expect(readFileSync('src/components/council/Circle237Experience.tsx', 'utf8')).toContain('no completed encounter or physical visit is asserted');
  });
  it('retains the existing 236 source and adds an explicit 237 route', () => {
    expect(current236.number).toBe(236);
    expect(ROUTES.CIRCLE237).toBe('/council/237');
    const app = readFileSync('src/App.tsx', 'utf8');
    expect(app).toContain('path={ROUTES.CIRCLE237}');
    expect(app).toContain('path={THREAD_PATTERNS.CIRCLE}');
    const canopy = readFileSync('src/pages/CouncilOfLifePage.tsx', 'utf8');
    expect(canopy).toContain('id="next-gathering"');
    expect(canopy).toContain('aria-labelledby="circle237-arrival"');
    expect(canopy).toContain('id="previous-circle-236"');
    expect(canopy).toContain('id="previous-circle-235"');
    expect(canopy.indexOf('id="circle237-arrival"')).toBeLessThan(canopy.indexOf('id="circle236-arrival"'));
    expect(canopy).toContain('CURRENT_WEBSITE_CIRCLE.route');
  });
  it('keeps integrated returns on the numbered route in both modes', () => {
    for (const mode of ['2d', 'spatial'] as const) {
      const url = new URL(returnHref('noku', mode, ROUTES.CIRCLE237), 'http://localhost');
      expect(url.pathname).toBe(ROUTES.CIRCLE237);
      expect(pilotState(url.search)).toMatchObject({ mode, returned: 'noku' });
      expect(pilotHref(mode, 'invitation', undefined, ROUTES.CIRCLE237)).toBe(`/council/237?mode=${mode}&c237view=invitation`);
    }
  });
  it('namespaces Circle237 views away from shared map-filter authority', () => {
    const href = pilotHref('2d', 'encounter', 'noku', ROUTES.CIRCLE237);
    expect(href).not.toContain('&view=');
    expect(pilotState(new URL(href, 'http://localhost').search, 'c237view')).toMatchObject({ key: 'noku', view: 'encounter' });
  });
  it('scopes every Council style rather than changing historical pages', () => {
    const css = readFileSync('src/review/circle237/pilot.css', 'utf8');
    const selectors = [...css.matchAll(/([^{}]+)\{/g)].map(m => m[1].trim()).filter(s => !s.startsWith('@'));
    for (const group of selectors) for (const selector of group.split(',')) expect(selector.trim().startsWith('.circle237')).toBe(true);
  });
});
