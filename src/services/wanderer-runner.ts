/**
 * First Wanderer — Hardened in-app journey runner.
 *
 * Real SPA navigation via history.pushState + popstate events,
 * real console error capture, network failure tracking,
 * DOM snapshots for evidence, and robust semantic target resolution.
 */
import type { JourneyStep, StepResult, StepSnapshot, RunTrace } from "@/lib/wanderer-types";

// ── Error / Network Capture ──────────────────────────

let capturedConsoleErrors: string[] = [];
let capturedNetworkErrors: string[] = [];
let originalConsoleError: typeof console.error;
let originalConsoleWarn: typeof console.warn;

function startCapture() {
  capturedConsoleErrors = [];
  capturedNetworkErrors = [];

  // Intercept console.error and console.warn
  originalConsoleError = console.error;
  originalConsoleWarn = console.warn;
  console.error = (...args: unknown[]) => {
    capturedConsoleErrors.push(args.map(a => (typeof a === "string" ? a : String(a))).join(" "));
    originalConsoleError.apply(console, args);
  };
  console.warn = (...args: unknown[]) => {
    // Only capture meaningful warnings, not React dev noise
    const msg = args.map(a => (typeof a === "string" ? a : String(a))).join(" ");
    if (!msg.includes("React does not recognize") && !msg.includes("Warning: ")) {
      capturedConsoleErrors.push(`[warn] ${msg}`);
    }
    originalConsoleWarn.apply(console, args);
  };

  // Capture unhandled promise rejections
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  // Intercept fetch for network errors
  const originalFetch = window.fetch;
  (window as any).__wandererOriginalFetch = originalFetch;
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    try {
      const response = await originalFetch(...args);
      if (!response.ok && response.status >= 400) {
        const url = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url || "unknown";
        capturedNetworkErrors.push(`${response.status} ${response.statusText} — ${url.slice(0, 120)}`);
      }
      return response;
    } catch (err) {
      const url = typeof args[0] === "string" ? args[0] : "unknown";
      capturedNetworkErrors.push(`Network error — ${url.slice(0, 120)}: ${err}`);
      throw err;
    }
  };
}

function stopCapture() {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  window.removeEventListener("unhandledrejection", onUnhandledRejection);
  if ((window as any).__wandererOriginalFetch) {
    window.fetch = (window as any).__wandererOriginalFetch;
    delete (window as any).__wandererOriginalFetch;
  }
}

function onUnhandledRejection(e: PromiseRejectionEvent) {
  capturedConsoleErrors.push(`Unhandled rejection: ${e.reason}`);
}

function drainErrors(): { consoleErrors: string[]; networkErrors: string[] } {
  const result = {
    consoleErrors: [...capturedConsoleErrors],
    networkErrors: [...capturedNetworkErrors],
  };
  capturedConsoleErrors = [];
  capturedNetworkErrors = [];
  return result;
}

// ── DOM Snapshot ─────────────────────────────────────

function takeSnapshot(resolvedEl: Element | null): StepSnapshot {
  const h1 = document.querySelector("h1");
  const landmarks = document.querySelectorAll("main, nav, header, footer, [role='main'], [role='navigation']");
  // Capture ~200 chars of visible body text for context
  const bodyText = document.body.innerText?.slice(0, 300).replace(/\s+/g, " ").trim() || "";

  return {
    url: window.location.pathname + window.location.search,
    pageTitle: document.title,
    headingText: h1?.textContent?.trim().slice(0, 100) || null,
    landmarkCount: landmarks.length,
    resolvedSelector: resolvedEl ? describeElement(resolvedEl) : null,
    targetTagName: resolvedEl?.tagName.toLowerCase() || null,
    targetText: resolvedEl?.textContent?.trim().slice(0, 80) || null,
    visibleText: bodyText.slice(0, 200),
  };
}

function describeElement(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : "";
  const testId = el.getAttribute("data-testid");
  const ariaLabel = el.getAttribute("aria-label");
  if (testId) return `[data-testid="${testId}"]`;
  if (ariaLabel) return `[aria-label="${ariaLabel}"]`;
  if (id) return `${tag}${id}`;
  const cls = el.className && typeof el.className === "string"
    ? `.${el.className.split(" ").filter(Boolean).slice(0, 2).join(".")}`
    : "";
  return `${tag}${cls}`.slice(0, 60);
}

// ── Target Resolution (semantic-first) ──────────────

function resolveTarget(target: string): Element | null {
  // 1. data-testid
  const byTestId = document.querySelector(`[data-testid="${target}"]`);
  if (byTestId) return byTestId;

  // 2. aria-label
  const byAriaLabel = document.querySelector(`[aria-label="${target}"]`);
  if (byAriaLabel) return byAriaLabel;

  // 3. role-based
  const byRole = document.querySelector(`[role="${target}"]`);
  if (byRole) return byRole;

  // 4. has-text() pseudo pattern
  if (target.includes("has-text(")) {
    const match = target.match(/has-text\(['"]?(.+?)['"]?\)/);
    if (match) {
      const text = match[1].toLowerCase();
      // Search interactive elements first, then any element
      const candidates = document.querySelectorAll("button, a, [role=button], label, h1, h2, h3, p, span, div");
      for (const el of candidates) {
        if (el.textContent?.toLowerCase().includes(text)) return el;
      }
    }
  }

  // 5. Button/link text match (bare text without has-text wrapper)
  if (!target.includes("[") && !target.includes(".") && !target.includes("#") && !target.includes(",") && !target.includes(":") && !target.includes("/")) {
    const searchText = target.toLowerCase();
    const interactives = document.querySelectorAll("button, a, [role=button]");
    for (const el of interactives) {
      if (el.textContent?.trim().toLowerCase().includes(searchText)) return el;
    }
  }

  // 6. Placeholder text for inputs
  const byPlaceholder = document.querySelector(`[placeholder="${target}"], [placeholder*="${target}"]`) as Element | null;
  if (byPlaceholder) return byPlaceholder;

  // 7. CSS selector(s) — comma-separated
  const parts = target.split(",").map(s => s.trim());
  for (const part of parts) {
    try {
      const el = document.querySelector(part);
      if (el) return el;
    } catch {
      continue;
    }
  }

  return null;
}

// ── SPA Navigation ──────────────────────────────────

async function navigateTo(path: string): Promise<boolean> {
  if (window.location.pathname === path) return true;

  // Use a link click to let React Router handle navigation naturally
  const link = document.createElement("a");
  link.href = path;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Wait for route to settle (React Router processes the click)
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 150));
    if (window.location.pathname === path) {
      // Wait a bit more for content to render
      await new Promise(r => setTimeout(r, 300));
      return true;
    }
  }
  return false;
}

// ── Step Execution ──────────────────────────────────

async function executeStep(step: JourneyStep): Promise<StepResult> {
  const start = performance.now();
  const urlBefore = window.location.pathname + window.location.search;
  const errsBefore = drainErrors(); // flush pre-step noise

  try {
    switch (step.action) {
      case "goto": {
        const success = await navigateTo(step.target);
        const snapshot = takeSnapshot(null);
        const errs = drainErrors();
        if (!success) {
          return {
            step, passed: false, durationMs: performance.now() - start,
            error: `Navigation to "${step.target}" timed out — ended at ${window.location.pathname}`,
            urlBefore, urlAfter: window.location.pathname,
            consoleErrors: errs.consoleErrors, networkErrors: errs.networkErrors, snapshot,
          };
        }
        return {
          step, passed: true, durationMs: performance.now() - start,
          urlBefore, urlAfter: window.location.pathname,
          consoleErrors: errs.consoleErrors, networkErrors: errs.networkErrors, snapshot,
        };
      }

      case "wait_for": {
        let el: Element | null = null;
        for (let i = 0; i < 30; i++) {
          el = resolveTarget(step.target);
          if (el) break;
          await new Promise(r => setTimeout(r, 200));
        }
        const errs = drainErrors();
        const snapshot = takeSnapshot(el);
        if (!el) {
          return {
            step, passed: false, durationMs: performance.now() - start,
            error: `Timed out (6s) waiting for "${step.target}" — page title: "${document.title}", heading: "${snapshot.headingText || "none"}"`,
            urlBefore, urlAfter: window.location.pathname,
            consoleErrors: errs.consoleErrors, networkErrors: errs.networkErrors, snapshot,
          };
        }
        return {
          step, passed: true, durationMs: performance.now() - start,
          urlBefore, urlAfter: window.location.pathname,
          consoleErrors: errs.consoleErrors, networkErrors: errs.networkErrors, snapshot,
        };
      }

      case "assert_visible": {
        const el = resolveTarget(step.target);
        const errs = drainErrors();
        const snapshot = takeSnapshot(el);
        if (!el) {
          return {
            step, passed: false, durationMs: performance.now() - start,
            error: `Element not found: "${step.target}" — checked data-testid, aria-label, role, text, CSS selectors. Page: "${snapshot.headingText || document.title}"`,
            urlBefore, urlAfter: window.location.pathname,
            consoleErrors: errs.consoleErrors, networkErrors: errs.networkErrors, snapshot,
          };
        }
        // Check actual visibility
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          return {
            step, passed: false, durationMs: performance.now() - start,
            error: `Element "${step.target}" exists but has zero dimensions (hidden). Resolved: ${describeElement(el)}`,
            urlBefore, urlAfter: window.location.pathname,
            consoleErrors: errs.consoleErrors, networkErrors: errs.networkErrors, snapshot,
          };
        }
        return {
          step, passed: true, durationMs: performance.now() - start,
          urlBefore, urlAfter: window.location.pathname,
          consoleErrors: errs.consoleErrors, networkErrors: errs.networkErrors, snapshot,
        };
      }

      case "assert_text": {
        const el = resolveTarget(step.target);
        const errs = drainErrors();
        const snapshot = takeSnapshot(el);
        if (!el) {
          return {
            step, passed: false, durationMs: performance.now() - start,
            error: `Element not found for text assertion: "${step.target}"`,
            urlBefore, urlAfter: window.location.pathname,
            consoleErrors: errs.consoleErrors, networkErrors: errs.networkErrors, snapshot,
          };
        }
        if (step.expected && !el.textContent?.includes(step.expected)) {
          return {
            step, passed: false, durationMs: performance.now() - start,
            error: `Expected text "${step.expected}" not found. Actual: "${el.textContent?.trim().slice(0, 100)}"`,
            urlBefore, urlAfter: window.location.pathname,
            consoleErrors: errs.consoleErrors, networkErrors: errs.networkErrors, snapshot,
          };
        }
        return {
          step, passed: true, durationMs: performance.now() - start,
          urlBefore, urlAfter: window.location.pathname,
          consoleErrors: errs.consoleErrors, networkErrors: errs.networkErrors, snapshot,
        };
      }

      case "click": {
        const el = resolveTarget(step.target);
        const errs0 = drainErrors();
        if (!el) {
          const snapshot = takeSnapshot(null);
          return {
            step, passed: false, durationMs: performance.now() - start,
            error: `Click target not found: "${step.target}" — page: "${snapshot.headingText || document.title}"`,
            urlBefore, urlAfter: window.location.pathname,
            consoleErrors: errs0.consoleErrors, networkErrors: errs0.networkErrors, snapshot,
          };
        }
        (el as HTMLElement).click();
        await new Promise(r => setTimeout(r, 600));
        const errs = drainErrors();
        const snapshot = takeSnapshot(el);
        return {
          step, passed: true, durationMs: performance.now() - start,
          urlBefore, urlAfter: window.location.pathname,
          consoleErrors: [...errs0.consoleErrors, ...errs.consoleErrors],
          networkErrors: [...errs0.networkErrors, ...errs.networkErrors],
          snapshot,
        };
      }

      case "type": {
        const el = resolveTarget(step.target) as HTMLInputElement | HTMLTextAreaElement | null;
        const errs = drainErrors();
        const snapshot = takeSnapshot(el);
        if (!el) {
          return {
            step, passed: false, durationMs: performance.now() - start,
            error: `Type target not found: "${step.target}"`,
            urlBefore, urlAfter: window.location.pathname,
            consoleErrors: errs.consoleErrors, networkErrors: errs.networkErrors, snapshot,
          };
        }
        if (step.value) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, "value"
          )?.set || Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, "value"
          )?.set;
          nativeInputValueSetter?.call(el, step.value);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
        return {
          step, passed: true, durationMs: performance.now() - start,
          urlBefore, urlAfter: window.location.pathname,
          consoleErrors: errs.consoleErrors, networkErrors: errs.networkErrors, snapshot,
        };
      }

      default: {
        const errs = drainErrors();
        return {
          step, passed: false, durationMs: performance.now() - start,
          error: `Unknown action: "${(step as any).action}"`,
          urlBefore, urlAfter: window.location.pathname,
          consoleErrors: errs.consoleErrors, networkErrors: errs.networkErrors,
          snapshot: takeSnapshot(null),
        };
      }
    }
  } catch (err) {
    const errs = drainErrors();
    return {
      step, passed: false, durationMs: performance.now() - start,
      error: err instanceof Error ? err.message : String(err),
      urlBefore, urlAfter: window.location.pathname,
      consoleErrors: errs.consoleErrors, networkErrors: errs.networkErrors,
      snapshot: takeSnapshot(null),
    };
  }
}

// ── Public API ──────────────────────────────────────

export async function runJourney(steps: JourneyStep[]): Promise<RunTrace> {
  const totalStart = performance.now();
  startCapture();

  const results: StepResult[] = [];
  for (const step of steps) {
    const result = await executeStep(step);
    results.push(result);
  }

  stopCapture();

  const allConsoleErrors = results.flatMap(r => r.consoleErrors);
  const allNetworkErrors = results.flatMap(r => r.networkErrors);

  return {
    steps: results,
    totalDurationMs: performance.now() - totalStart,
    consoleErrorCount: allConsoleErrors.length,
    networkErrorCount: allNetworkErrors.length,
    consoleErrors: allConsoleErrors,
    networkErrors: allNetworkErrors,
  };
}
