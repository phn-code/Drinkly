// Loaded as a blocking script in <head> so the theme is applied before first paint.
(function () {
  const root = document.documentElement;
  let saved = null;
  try {
    saved = localStorage.getItem('darkMode');
  } catch {
    // Storage can be unavailable (private mode); fall back to the OS preference.
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.classList.toggle('dark', saved === null ? prefersDark : saved === 'true');

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-theme-toggle]')) return;
    const dark = root.classList.toggle('dark');
    try {
      localStorage.setItem('darkMode', String(dark));
    } catch {
      // Ignore: the toggle still works for this page view.
    }
  });
})();
