import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {ROUTES} from '@/lib/routes';
const read=(file:string)=>readFileSync(file,'utf8');
describe('Council public demo release boundary',()=>{
 it('uses a standalone build entry without loading the authenticated application',()=>{
  expect(ROUTES.COUNCIL_OFFERINGS_DEMO).toBe('/council/238/offerings.html');
  const entry=read('council/238/offerings.html');
  expect(entry).toContain('/src/review/council-offerings/main.tsx');
  expect(entry).not.toMatch(/src\/main|supabase|registerSW/);
  expect(read('vite.config.ts')).toContain('council/238/offerings.html');
 });
 it('adds an explicit demonstration entrance without replacing the existing Council routes',()=>{
  const page=read('src/pages/CouncilOfLifePage.tsx');
  expect(page).toContain('href={ROUTES.COUNCIL_OFFERINGS_DEMO}');
  expect(page).toContain('demo — nothing is saved');
  expect(page).toContain('to={ROUTES.CIRCLE238}');
  expect(page).toContain('/tetol/circle-235/pre-fire/tetol.html?circle=238#croom');
 });
 it('keeps public demo CSP local and permits only synthetic voice playback',()=>{
  const section=read('public/_headers').split('/council/238/offerings.html')[1];
  expect(section).toContain("connect-src 'self'");
  expect(section).toContain("form-action 'none'");
  expect(section).toContain("media-src 'self' blob: data:");
  expect(section).toContain('Cache-Control: no-store');
 });
});
