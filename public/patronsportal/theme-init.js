// S33D Patrons Portal — theme system (shared by all four portal pages)
//
// Extracted from the previously inline <script> blocks so the strict
// production CSP (script-src 'self') can serve these pages without
// requiring 'unsafe-inline'.
//
// 1. Pre-paint reader — applies the saved theme before the first paint
//    (executes immediately as a top-level IIFE).
// 2. toggleTheme — flips between light and dark, persists the choice.
// 3. Click wiring — replaces the inline `onclick="toggleTheme()"`
//    attribute on .theme-toggle buttons.

(function () {
  // 1. Pre-paint theme application
  try {
    var saved = localStorage.getItem('s33d-theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (e) {
    // localStorage unavailable (private mode, disabled storage) — silently fall through.
  }
})();

function toggleTheme() {
  var root = document.documentElement;
  var current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  var next = current === 'light' ? 'dark' : 'light';
  if (next === 'dark') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', 'light');
  }
  try {
    localStorage.setItem('s33d-theme', next);
  } catch (e) {
    // Silently ignore — toggle still works for the current session.
  }
}

// 3. Click wiring — wires every .theme-toggle button on the page.
document.addEventListener('DOMContentLoaded', function () {
  var buttons = document.querySelectorAll('.theme-toggle');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', toggleTheme);
  }
});
