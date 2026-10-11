// Typecheck the edge entry points without changing their Deno/npm imports.
declare module 'https://esm.sh/@supabase/supabase-js@2.81.0' {
  export const createClient: typeof import('@supabase/supabase-js').createClient;
}
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};
