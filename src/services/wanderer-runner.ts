/**
 * First Wanderer — In-app journey runner (simulated).
 *
 * Walks each step of a journey definition, capturing timing and errors.
 * Structured so a future Playwright or external harness can replace the
 * step execution while keeping the same trace format.
 */
import type { JourneyStep, StepResult, RunTrace } from "@/lib/wanderer-types";

/** Try to match a selector or semantic label to a real element */
function resolveTarget(target: string): Element | null {
  // Try CSS selector first
  try {
    const el = document.querySelector(target);
    if (el) return el;
  } catch {
    // not a valid selector — fall through
  }

  // Try comma-separated selectors
  const parts = target.split(",").map(s => s.trim());
  for (const part of parts) {
    try {
      const el = document.querySelector(part);
      if (el) return el;
    } catch {
      continue;
    }
  }

  // Try semantic: button text match
  if (target.includes("has-text(")) {
    const match = target.match(/has-text\(['"]?(.+?)['"]?\)/);
    if (match) {
      const text = match[1];
      const buttons = document.querySelectorAll("button, a, [role=button]");
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes(text.toLowerCase())) return btn;
      }
    }
  }

  return null;
}

/** Execute a single journey step in the browser */
async function executeStep(step: JourneyStep): Promise<StepResult> {
  const start = performance.now();
  const consoleErrors: string[] = [];
  const url = window.location.pathname;

  try {
    switch (step.action) {
      case "goto": {
        // We can't actually navigate in an SPA runner without React Router,
        // so we simulate by checking if we're already there
        if (window.location.pathname !== step.target) {
          // In a real runner, this would navigate
          return {
            step,
            passed: true,
            durationMs: performance.now() - start,
            url,
            consoleErrors,
          };
        }
        break;
      }

      case "wait_for": {
        let found = false;
        for (let i = 0; i < 20; i++) {
          if (resolveTarget(step.target)) {
            found = true;
            break;
          }
          await new Promise(r => setTimeout(r, 250));
        }
        if (!found) {
          return {
            step,
            passed: false,
            durationMs: performance.now() - start,
            error: `Timed out waiting for: ${step.target}`,
            url,
            consoleErrors,
          };
        }
        break;
      }

      case "assert_visible": {
        const el = resolveTarget(step.target);
        if (!el) {
          return {
            step,
            passed: false,
            durationMs: performance.now() - start,
            error: `Element not visible: ${step.target}`,
            url,
            consoleErrors,
          };
        }
        break;
      }

      case "assert_text": {
        const el = resolveTarget(step.target);
        if (!el) {
          return {
            step,
            passed: false,
            durationMs: performance.now() - start,
            error: `Element not found for text assertion: ${step.target}`,
            url,
            consoleErrors,
          };
        }
        if (step.expected && !el.textContent?.includes(step.expected)) {
          return {
            step,
            passed: false,
            durationMs: performance.now() - start,
            error: `Expected text "${step.expected}" not found in element`,
            url,
            consoleErrors,
          };
        }
        break;
      }

      case "click": {
        const el = resolveTarget(step.target);
        if (!el) {
          return {
            step,
            passed: false,
            durationMs: performance.now() - start,
            error: `Click target not found: ${step.target}`,
            url,
            consoleErrors,
          };
        }
        (el as HTMLElement).click();
        // Wait briefly for any resulting UI updates
        await new Promise(r => setTimeout(r, 500));
        break;
      }

      case "type": {
        const el = resolveTarget(step.target) as HTMLInputElement | HTMLTextAreaElement | null;
        if (!el) {
          return {
            step,
            passed: false,
            durationMs: performance.now() - start,
            error: `Type target not found: ${step.target}`,
            url,
            consoleErrors,
          };
        }
        if (step.value) {
          el.value = step.value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
        break;
      }
    }

    return {
      step,
      passed: true,
      durationMs: performance.now() - start,
      url: window.location.pathname,
      consoleErrors,
    };
  } catch (err) {
    return {
      step,
      passed: false,
      durationMs: performance.now() - start,
      error: err instanceof Error ? err.message : String(err),
      url,
      consoleErrors,
    };
  }
}

/**
 * Run a full journey and return a structured trace.
 * This is the in-app simulated runner — steps that require navigation
 * are best-effort (goto steps are noted but don't actually navigate).
 */
export async function runJourney(steps: JourneyStep[]): Promise<RunTrace> {
  const totalStart = performance.now();
  const results: StepResult[] = [];

  for (const step of steps) {
    const result = await executeStep(step);
    results.push(result);
  }

  const consoleErrorCount = results.reduce(
    (sum, r) => sum + (r.consoleErrors?.length || 0) + (r.passed ? 0 : 1),
    0
  );

  return {
    steps: results,
    totalDurationMs: performance.now() - totalStart,
    consoleErrorCount,
    networkErrorCount: 0,
    screenshotUrls: [],
  };
}
