import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { supabaseEnv } from "@/config/env";

const missingEnvError = {
  name: "MissingSupabaseEnvError",
  message:
    "Supabase is disabled because VITE_SUPABASE_URL and a publishable/anon key are not configured.",
};

const WRITE_METHODS = new Set(["insert", "update", "upsert", "delete"]);
const SINGLE_RESULT_METHODS = new Set(["single", "maybeSingle"]);

const createQueryBuilderStub = (
  state: { expectsSingle: boolean; isWrite: boolean } = { expectsSingle: false, isWrite: false },
) => {
  const result = state.isWrite
    ? {
        data: state.expectsSingle ? null : null,
        error: missingEnvError,
        count: null,
        status: 503,
        statusText: "Supabase disabled",
      }
    : {
        data: state.expectsSingle ? null : [],
        error: null,
        count: 0,
        status: 200,
        statusText: "OK",
      };

  const promise = Promise.resolve(result);

  return new Proxy(() => undefined, {
    get(_target, prop) {
      if (prop === "then") return promise.then.bind(promise);
      if (prop === "catch") return promise.catch.bind(promise);
      if (prop === "finally") return promise.finally.bind(promise);
      if (prop === Symbol.toStringTag) return "Promise";

      return (..._args: unknown[]) => {
        const name = String(prop);
        return createQueryBuilderStub({
          expectsSingle: state.expectsSingle || SINGLE_RESULT_METHODS.has(name),
          isWrite: state.isWrite || WRITE_METHODS.has(name),
        });
      };
    },
    apply() {
      return createQueryBuilderStub(state);
    },
  });
};

const createMissingEnvSupabaseClient = () => {
  const auth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => undefined,
        },
      },
    }),
    signOut: async () => ({ error: null }),
    signInWithOAuth: async () => ({ data: { provider: null, url: null }, error: missingEnvError }),
    signInWithOtp: async () => ({ data: { session: null, user: null }, error: missingEnvError }),
    signInWithPassword: async () => ({ data: { session: null, user: null }, error: missingEnvError }),
    signUp: async () => ({ data: { session: null, user: null }, error: missingEnvError }),
    resetPasswordForEmail: async () => ({ data: null, error: missingEnvError }),
    updateUser: async () => ({ data: { user: null }, error: missingEnvError }),
    refreshSession: async () => ({ data: { session: null, user: null }, error: missingEnvError }),
    exchangeCodeForSession: async () => ({ data: { session: null, user: null }, error: missingEnvError }),
    setSession: async () => ({ data: { session: null, user: null }, error: missingEnvError }),
  };

  return {
    auth,
    from: () => createQueryBuilderStub(),
    rpc: () => createQueryBuilderStub({ expectsSingle: false, isWrite: true }),
    functions: {
      invoke: async () => ({ data: null, error: missingEnvError }),
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: missingEnvError }),
        update: async () => ({ data: null, error: missingEnvError }),
        remove: async () => ({ data: null, error: missingEnvError }),
        move: async () => ({ data: null, error: missingEnvError }),
        copy: async () => ({ data: null, error: missingEnvError }),
        createSignedUrl: async () => ({ data: null, error: missingEnvError }),
        createSignedUrls: async () => ({ data: [], error: missingEnvError }),
        download: async () => ({ data: null, error: missingEnvError }),
        list: async () => ({ data: [], error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
    channel: () => {
      const channelStub: Record<string, any> = {
        on: () => channelStub,
        subscribe: () => ({ unsubscribe: () => undefined }),
        unsubscribe: () => undefined,
        send: async () => ({ error: missingEnvError }),
      };
      return channelStub;
    },
    removeChannel: () => undefined,
    removeAllChannels: () => undefined,
  } as unknown as SupabaseClient<Database>;
};

export const supabase: SupabaseClient<Database> = supabaseEnv
  ? createClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createMissingEnvSupabaseClient();
