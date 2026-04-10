/* ══════════════════════════════════════════════════════════════ */
/*  THE PERSONAL DOSSIER · script.js                               */
/*  Section selection, tray behaviour, PDF compilation             */
/* ══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "dossier-selected-sections";

/* ═══ State persistence ═════════════════════════════════════════ */
function loadSelection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSelection(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/* ═══ Tray updating ══════════════════════════════════════════════ */
function updateTray() {
  const toggles = Array.from(document.querySelectorAll(".section-toggle"));
  const selected = toggles.filter((cb) => cb.checked);

  const tray = document.querySelector(".dossier-tray");
  const countEl = tray.querySelector(".tray-count");
  const listEl = tray.querySelector(".tray-list");
  const compileBtn = tray.querySelector(".tray-compile");

  // Update count (zero-padded)
  countEl.textContent = String(selected.length).padStart(2, "0");

  // Activate/deactivate tray
  tray.classList.toggle("is-active", selected.length > 0);

  // Enable/disable compile button
  compileBtn.disabled = selected.length === 0;

  // Rebuild chip list
  listEl.innerHTML = "";
  selected.forEach((cb) => {
    const section = cb.closest(".cv-section");
    const num = section.dataset.sectionNum;
    const title = cb.dataset.sectionTitle || "Untitled";
    const chip = document.createElement("li");
    chip.className = "tray-chip";
    chip.innerHTML = `<span class="chip-num">§${num}</span><span class="chip-title">${title}</span>`;
    listEl.appendChild(chip);
  });

  // Visual marker on each section
  document.querySelectorAll(".cv-section").forEach((section) => {
    const cb = section.querySelector(".section-toggle");
    section.classList.toggle("is-selected", cb && cb.checked);
  });

  // Persist to localStorage
  const ids = selected.map((cb) => cb.dataset.sectionId);
  saveSelection(ids);
}

/* ═══ Restore persisted selection on load ═══════════════════════ */
function restoreSelection() {
  const ids = loadSelection();
  if (!ids.length) {
    updateTray();
    return;
  }
  document.querySelectorAll(".section-toggle").forEach((cb) => {
    if (ids.includes(cb.dataset.sectionId)) {
      cb.checked = true;
    }
  });
  updateTray();
}

/* ═══ Compile dossier (trigger print) ═══════════════════════════ */
function compileDossier() {
  const selected = document.querySelectorAll(".section-toggle:checked");
  if (!selected.length) return;

  // Fill in the print-header date
  const dateEl = document.getElementById("print-date");
  if (dateEl) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    dateEl.textContent = `${y} · ${m} · ${d}`;
  }

  // Add printing class for CSS to filter sections
  document.body.classList.add("is-printing");

  // Wait for a frame so styles apply, then print
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.print();
      // Restore normal view after print dialog closes
      setTimeout(() => {
        document.body.classList.remove("is-printing");
      }, 500);
    });
  });
}

/* ═══ Clear all selections ══════════════════════════════════════ */
function clearSelection() {
  document.querySelectorAll(".section-toggle").forEach((cb) => {
    cb.checked = false;
  });
  updateTray();
}

/* ═══ Section reveal on scroll ══════════════════════════════════ */
function initScrollReveal() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".cv-section").forEach((s) => s.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );

  document.querySelectorAll(".cv-section").forEach((section) => {
    observer.observe(section);
  });
}

/* ═══ Label click toggles the hidden input ══════════════════════ */
function initToggleClicks() {
  // The native label wrapping handles this automatically,
  // but we keep clicks on the whole dossier-toggle inclusive.
  document.querySelectorAll(".section-toggle").forEach((cb) => {
    cb.addEventListener("change", updateTray);
  });
}

/* ═══ Tray controls ═════════════════════════════════════════════ */
function initTrayControls() {
  const tray = document.querySelector(".dossier-tray");

  tray.querySelector(".tray-compile").addEventListener("click", compileDossier);
  tray.querySelector(".tray-clear").addEventListener("click", clearSelection);

  const toggle = tray.querySelector(".tray-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      tray.classList.toggle("is-expanded");
    });
  }
}

/* ═══ Keyboard shortcut: Ctrl/Cmd + P compiles dossier ══════════ */
function initKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Escape: collapse tray
    if (e.key === "Escape") {
      document.querySelector(".dossier-tray")?.classList.remove("is-expanded");
    }
  });
}

/* ═══ Subtle parallax on scroll for stamp ═══════════════════════ */
function initStampParallax() {
  const stamp = document.querySelector(".classification-stamp");
  if (!stamp) return;

  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 800) {
          stamp.style.transform = `translateY(${y * 0.15}px) rotate(${y * 0.01}deg)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ═══ Bootstrap ═════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  initToggleClicks();
  initTrayControls();
  initKeyboardShortcuts();
  initScrollReveal();
  initStampParallax();
  restoreSelection();
});
