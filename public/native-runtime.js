(function () {
  var apiOrigin = "https://p-n-p.vercel.app";
  var isPackaged = location.hostname === "localhost" && location.origin !== apiOrigin;
  if (!isPackaged) return;

  window.__DEEDS_NATIVE_BUILD__ = "__DEEDS_NATIVE_BUILD__";
  window.__DEEDS_API_ORIGIN__ = apiOrigin;

  var originalFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var value = typeof input === "string" || input instanceof URL ? String(input) : input.url;
    var target = value;
    try {
      var parsed = new URL(value, location.href);
      if (parsed.origin === location.origin && parsed.pathname.indexOf("/api/") === 0) {
        target = apiOrigin + parsed.pathname + parsed.search + parsed.hash;
      }
    } catch (_) {}
    if (target === value) return originalFetch(input, init);
    return originalFetch(target, Object.assign({}, init || {}, { credentials: "include" }));
  };

  document.addEventListener("click", function (event) {
    var element = event.target instanceof Element ? event.target.closest("a") : null;
    if (!element) return;
    var href = element.getAttribute("href") || "";
    if (href.indexOf("/api/") !== 0) return;
    event.preventDefault();
    var target = new URL(apiOrigin + href);
    target.searchParams.set("native", "1");
    var opened = window.open(target.toString(), "_blank", "noopener,noreferrer");
    if (!opened) location.href = target.toString();
  }, true);
})();
