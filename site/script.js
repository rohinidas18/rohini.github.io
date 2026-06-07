// Year
document.getElementById("year").textContent = new Date().getFullYear();

// Nav scroll state + scroll progress
const nav = document.getElementById("nav");
const progress = document.getElementById("scrollProgress");
const onScroll = () => {
  const y = window.scrollY;
  nav.classList.toggle("is-scrolled", y > 40);
  const h = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Mobile menu
const toggle = document.getElementById("navToggle");
const links = document.querySelector(".nav__links");
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("is-open");
  nav.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
});
links.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    links.classList.remove("is-open");
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  })
);

// Scroll reveal
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        revealObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
);
document.querySelectorAll(".reveal").forEach((el, i) => {
  // small stagger for siblings
  el.style.transitionDelay = Math.min((i % 4) * 60, 180) + "ms";
  revealObserver.observe(el);
});

// Timeline dot activation
const tlObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("is-visible");
    });
  },
  { threshold: 0.4 }
);
document.querySelectorAll(".tl").forEach((el) => tlObserver.observe(el));

// Active nav link via section observation
const navMap = new Map();
document.querySelectorAll(".nav__links a").forEach((a) => {
  const id = a.getAttribute("href").slice(1);
  navMap.set(id, a);
});
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      const link = navMap.get(e.target.id);
      if (!link) return;
      if (e.isIntersecting) {
        navMap.forEach((l) => l.classList.remove("is-active"));
        link.classList.add("is-active");
      }
    });
  },
  { threshold: 0.5 }
);
["story", "journey", "work", "recognition", "contact"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) sectionObserver.observe(el);
});

// Animated stat counters
const animateCount = (el) => {
  const target = parseFloat(el.dataset.target);
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  const suffix = el.dataset.suffix || "";
  const dur = 1400;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = target * eased;
    el.textContent = val.toFixed(decimals) + (p === 1 ? suffix : "");
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target.toFixed(decimals) + suffix;
  };
  requestAnimationFrame(step);
};
const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        animateCount(e.target);
        statObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.6 }
);
document.querySelectorAll(".stat__num").forEach((el) => statObserver.observe(el));

// Photo carousels (prev / next, one image at a time)
function initCarousels(root) {
  root.querySelectorAll("[data-carousel]").forEach((c) => {
    if (c.dataset.ready) return;
    c.dataset.ready = "1";
    const slides = Array.from(c.querySelectorAll(".carousel__slide"));
    if (!slides.length) return;
    const counter = c.querySelector(".carousel__current");
    let i = Math.max(0, slides.findIndex((s) => s.classList.contains("is-active")));
    const show = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("is-active", k === i));
      if (counter) counter.textContent = String(i + 1);
    };
    const prev = c.querySelector(".carousel__btn--prev");
    const next = c.querySelector(".carousel__btn--next");
    if (prev) prev.addEventListener("click", (e) => { e.stopPropagation(); show(i - 1); });
    if (next) next.addEventListener("click", (e) => { e.stopPropagation(); show(i + 1); });
    c.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); show(i - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); show(i + 1); }
    });
    show(i);
  });
}
initCarousels(document);

// Deter casual image downloads (drag + right-click)
["contextmenu", "dragstart"].forEach((evt) =>
  document.addEventListener(evt, (e) => {
    if (e.target && e.target.tagName === "IMG") e.preventDefault();
  })
);

// Project modal
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
let lastFocused = null;

const openModal = (card) => {
  const tpl = card.querySelector("template.card__detail");
  if (!tpl) return;
  lastFocused = card;
  modalBody.innerHTML = "";
  modalBody.appendChild(tpl.content.cloneNode(true));
  initCarousels(modalBody);

  // Wire up tabs if the content has any
  const tabs = modalBody.querySelectorAll(".md__tab");
  if (tabs.length) {
    const panels = modalBody.querySelectorAll(".md__panel");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const name = tab.dataset.tab;
        tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
        panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === name));
        modalBody.scrollTop = 0;
      });
    });
  }

  modal.hidden = false;
  document.body.classList.add("modal-open");
  modalBody.scrollTop = 0;
  modalClose.focus();
};

const closeModal = () => {
  if (modal.hidden) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  modalBody.innerHTML = ""; // stops any playing video / iframe
  if (lastFocused) lastFocused.focus();
};

document.querySelectorAll("[data-modal]").forEach((card) => {
  card.addEventListener("click", () => openModal(card));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal(card);
    }
  });
});

modalClose.addEventListener("click", closeModal);
modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// Subtle parallax on hero orbs
const orbs = document.querySelectorAll(".hero .orb");
if (window.matchMedia("(min-width: 920px)").matches) {
  window.addEventListener(
    "mousemove",
    (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      orbs.forEach((orb, i) => {
        const d = (i + 1) * 12;
        orb.style.transform = `translate(${x * d}px, ${y * d}px)`;
      });
    },
    { passive: true }
  );
}