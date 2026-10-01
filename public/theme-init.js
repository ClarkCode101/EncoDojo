// Dark mode and large text before the app loads, so the page never flashes white (see Layout.tsx).
// A separate file (not inline in index.html) so the Content-Security-Policy can allow only the site's own scripts.
try {
  var s = JSON.parse(localStorage.getItem('encodojo:v1') || '{}').settings || {};
  if (s.dark === true) document.documentElement.classList.add('dark');
  if (s.largeText === true) document.documentElement.classList.add('large-text');
} catch (e) {
  // no storage: the app sets the classes itself once it loads
}
