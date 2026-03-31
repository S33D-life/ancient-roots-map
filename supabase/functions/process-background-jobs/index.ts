import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * process-background-jobs — Edge function for processing queued background jobs.
 *
 * Called periodically (via cron or manual trigger) to drain the background_jobs queue.
 * Each job type has a dedicated handler.
 *
 * Supported job types:
 * - refresh_map_view: Refreshes the trees_map_hot materialized view
 * - duplicate_check: Logs a duplicate-detection task (placeholder for future ML/similarity)
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate caller — must be a keeper
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Check keeper role
    const { data: roleCheck } = await authClient.rpc("has_role", { _user_id: user.id, _role: "keeper" });
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden — keeper role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Fetch up to 10 pending jobs ordered by priority
    const { data: jobs, error: fetchError } = await supabase
      .from("background_jobs")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .lt("attempts", 3)
      .order("priority", { ascending: true })
      .order("scheduled_for", { ascending: true })
      .limit(10);

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No pending jobs" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    const results: { id: string; type: string; status: string }[] = [];

    for (const job of jobs) {
      // Mark as in-progress
      await supabase
        .from("background_jobs")
        .update({ status: "processing", started_at: new Date().toISOString(), attempts: job.attempts + 1 })
        .eq("id", job.id);

      try {
        switch (job.job_type) {
          case "refresh_map_view": {
            // Refresh the materialized view
            await supabase.rpc("refresh_trees_map_hot");
            break;
          }

          case "duplicate_check": {
            // Log the check — actual similarity scoring happens client-side or in a future ML pipeline
            const payload = job.payload as { tree_id: string };
            await supabase.from("compute_metrics").insert({
              metric_type: "background_job",
              metric_key: "duplicate_check",
              value: 1,
              metadata: { tree_id: payload.tree_id },
            });
            break;
          }

          default: {
            console.warn(`Unknown job type: ${job.job_type}`);
          }
        }

        // Mark completed
        await supabase
          .from("background_jobs")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", job.id);

        processed++;
        results.push({ id: job.id, type: job.job_type, status: "completed" });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        await supabase
          .from("background_jobs")
          .update({ status: "failed", error_message: errorMessage })
          .eq("id", job.id);

        results.push({ id: job.id, type: job.job_type, status: "failed" });
      }
    }

    return new Response(
      JSON.stringify({ processed, total: jobs.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
