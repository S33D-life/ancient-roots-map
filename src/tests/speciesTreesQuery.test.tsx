import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSpeciesTrees } from '@/hooks/use-treeasurus';
const query = vi.hoisted(() => ({select:vi.fn(),eq:vi.fn(),limit:vi.fn(),from:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:query.from}}));
function wrapper({children}:{children:React.ReactNode}) { return <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>{children}</QueryClientProvider>; }
beforeEach(()=>{vi.clearAllMocks();query.from.mockReturnValue(query);query.select.mockReturnValue(query);query.eq.mockReturnValue(query);query.limit.mockResolvedValue({data:[{id:'recorded-tree',country:'England'}],error:null});});
describe('species trees read-only query',()=>{
  it('reads nation through the existing country presentation alias and preserves opaque identity',async()=>{
    const {result}=renderHook(()=>useSpeciesTrees('  Quercus-Ilex  '),{wrapper});
    await waitFor(()=>expect(result.current.isSuccess).toBe(true));
    expect(query.select.mock.calls[0][0]).toContain('country:nation');
    expect(query.eq).toHaveBeenCalledWith('species_key','  Quercus-Ilex  ');
    expect(result.current.data?.[0].country).toBe('England');
  });
  it('does not infer or query an absent species key',()=>{
    renderHook(()=>useSpeciesTrees(undefined),{wrapper});expect(query.from).not.toHaveBeenCalled();
  });
});
