// Small progressive enhancements. The site works without this file.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };

  // Theme: follow the system until the visitor picks one.
  const root = document.documentElement;
  const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
  $(".theme-toggle")?.addEventListener("click", () => {
    const current = root.dataset.theme || (systemDark() ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    store.set("orbit-theme", next);
  });

  // Mobile menu.
  const menuBtn = $(".menu-toggle");
  const nav = $(".nav");
  menuBtn?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  $$(".nav a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("open"); menuBtn?.setAttribute("aria-expanded", "false"); }));

  // Copy buttons: the text comes from the nearest data-copy, else the code block.
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".copy");
    if (!btn) return;
    const holder = btn.closest("[data-copy]");
    const text = holder ? holder.dataset.copy : btn.parentElement.querySelector("code")?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text.trim());
      btn.textContent = "Copied";
      btn.classList.add("done");
    } catch {
      btn.textContent = "Press ⌘C";
    }
    setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1600);
  });

  // Install tabs, preselected from the visitor's OS.
  const osTabs = $$(".os-list [role=tab]");
  if (osTabs.length) {
    const select = (tab, focus) => {
      osTabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    };
    osTabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key] || 0;
        if (d) { e.preventDefault(); select(osTabs[(i + d + osTabs.length) % osTabs.length], true); }
      });
    });
    const ua = (navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || "").toLowerCase();
    const guess = /win/.test(ua) ? "windows" : /linux|x11|cros/.test(ua) && !/android/.test(ua) ? "linux" : "macos";
    select(osTabs.find((t) => t.dataset.os === guess) || osTabs[0]);
  }

  // Hero OS buttons open the matching install tab.
  $$("[data-os-link]").forEach((a) => a.addEventListener("click", () => {
    osTabs.find((t) => t.dataset.os === a.dataset.osLink)?.click();
  }));

  // Home page: the nav item for the section on screen is marked.
  const sectionLinks = $$(".nav a[data-section]");
  if (document.body.classList.contains("home") && sectionLinks.length && "IntersectionObserver" in window) {
    const navFor = { features: "features", tour: "features", install: "install", quickstart: "install", author: "author" };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const key = navFor[en.target.id];
        sectionLinks.forEach((a) => a.classList.toggle("is-active", a.dataset.section === key));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main > section").forEach((el) => io.observe(el));
  }

  // Screenshot gallery.
  const gTabs = $$(".gallery-tabs [role=tab]");
  const gImg = $("#gallery-img");
  const gCap = $(".gallery-caption");
  gTabs.forEach((t) => t.addEventListener("click", () => {
    gTabs.forEach((x) => x.setAttribute("aria-selected", String(x === t)));
    gImg.style.opacity = "0.25";
    const next = new Image();
    next.src = `/assets/${t.dataset.shot}.png`;
    next.onload = () => {
      gImg.src = next.src;
      gImg.alt = t.querySelector("b").textContent + ": " + t.querySelector("span").textContent;
      gImg.style.opacity = "1";
    };
    gCap.textContent = t.querySelector("b").textContent;
  }));

  // Docs: mobile sidebar, heading anchors, and the "on this page" highlight.
  const sideBtn = $(".side-toggle");
  sideBtn?.addEventListener("click", () => {
    const open = $(".side-nav").classList.toggle("open");
    sideBtn.setAttribute("aria-expanded", String(open));
  });
  $$(".prose :is(h2, h3, h4)[id]").forEach((h) => {
    const a = document.createElement("a");
    a.className = "anchor";
    a.href = `#${h.id}`;
    a.setAttribute("aria-label", "Link to this section");
    a.textContent = "#";
    h.prepend(a);
  });
  const tocLinks = $$(".toc a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    const byId = new Map(tocLinks.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? visible.add(en.target.id) : visible.delete(en.target.id)));
      const first = [...byId.keys()].find((id) => visible.has(id));
      if (first) tocLinks.forEach((a) => a.classList.toggle("active", a === byId.get(first)));
    }, { rootMargin: "-70px 0px -65% 0px" });
    byId.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }
})();
