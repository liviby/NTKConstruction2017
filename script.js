/* ================================
   NAVIGATION
================================ */
const navbar = document.querySelector(".navbar");
const menuIcon = document.querySelector(".menu-icon");
const mobileMenu = document.querySelector(".mobile-menu");

// Add shadow on scroll
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    if (navbar) navbar.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
  } else {
    if (navbar) navbar.style.boxShadow = "none";
  }
});

const overlay = document.querySelector(".mobile-overlay");

if (menuIcon && mobileMenu && overlay) {
  const toggleMenu = () => {
    mobileMenu.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.classList.toggle("menu-open");
  };

  menuIcon.addEventListener("click", toggleMenu);
  menuIcon.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleMenu();
    }
  });

  mobileMenu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
      overlay.classList.remove("active");
      document.body.classList.remove("menu-open");
    })
  );

  overlay.addEventListener("click", () => {
    mobileMenu.classList.remove("active");
    overlay.classList.remove("active");
    document.body.classList.remove("menu-open");
  });
}

/* ================================
   BUTTON MICRO-INTERACTIONS
================================ */
document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    if (!btn.style.transform.includes("scale")) {
      btn.style.transform = "translateY(-2px) scale(1.02)";
    }
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "translateY(0) scale(1)";
  });
});

/* ================================
   PROJECTS CAROUSEL (Responsive paginate)
================================ */
const track = document.querySelector(".projects-carousel");
const prevBtn = document.querySelector(".carousel-btn.prev");
const nextBtn = document.querySelector(".carousel-btn.next");

// state
let pages = []; // NodeList of .project-list (pages)
let currentIndex = 0; // active page index (ใช้ร่วมกับ swipe patch)

function refreshRefs() {
  if (!track) return;
  pages = track.querySelectorAll(".project-list");
}

function disableButtons() {
  if (!prevBtn || !nextBtn) return;

  if (pages.length <= 1) {
    // ถ้ามีแค่หน้าเดียว → ปิดปุ่มทั้งคู่
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  } else {
    // ถ้ามีหลายหน้า → ปุ่มเปิดตลอด (ไม่ disable)
    prevBtn.disabled = false;
    nextBtn.disabled = false;
  }
}

// calc how far to move per page (include CSS gap)
function getPageStep() {
  if (!track || !pages.length) return 0;
  const styles = getComputedStyle(track);
  const gapX = parseFloat(styles.columnGap || styles.gap || "0") || 0;
  const pageWidth = pages[0].getBoundingClientRect().width;
  return pageWidth + gapX;
}

function updateCarousel() {
  if (!track || !pages.length) return;
  const step = getPageStep();
  const translateX = -currentIndex * step;

  // Animate the entire track, pages will transition with it
  track.style.transform = `translate3d(${translateX}px, 0, 0)`;

  // Add/remove hidden-page class on old/new pages
  pages.forEach((page, i) => {
    if (i !== currentIndex) {
      page.classList.add("hidden-page");
    } else {
      page.classList.remove("hidden-page");
    }
  });

  // Staggered reveal for the current page
  const nowCards = pages[currentIndex].querySelectorAll(".project-card");
  nowCards.forEach((card, i) =>
    setTimeout(() => card.classList.remove("hidden-card"), i * 80)
  );

  disableButtons();
}

// Re-paginate cards: 4/page (>=901px), 2/page (<=900px)
function repaginateProjects() {
  if (!track) return;

  const allCards = Array.from(track.querySelectorAll(".project-card"));
  if (!allCards.length) return;

  track.innerHTML = "";

  const isSmall = window.matchMedia("(max-width: 900px)").matches;
  const perPage = isSmall ? 2 : 4;

  for (let i = 0; i < allCards.length; i += perPage) {
    const ul = document.createElement("ul");
    ul.className = "project-list";
    allCards.slice(i, i + perPage).forEach((card) => ul.appendChild(card)); // ย้ายการ์ดเดิม (ไม่ทำ loop)
    track.appendChild(ul);
  }

  refreshRefs();
  currentIndex = Math.min(currentIndex, pages.length - 1);
  if (currentIndex < 0) currentIndex = 0;

  updateCarousel();
  disableButtons();
}

/* --- interactions --- */
nextBtn?.addEventListener("click", () => {
  if (pages.length) {
    currentIndex = (currentIndex + 1) % pages.length; // วนกลับไปหน้าแรก
    updateCarousel();
  }
});

prevBtn?.addEventListener("click", () => {
  if (pages.length) {
    currentIndex = (currentIndex - 1 + pages.length) % pages.length; // วนไปหน้าสุดท้าย
    updateCarousel();
  }
});

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  const active = document.activeElement;
  if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;

  if (e.key === "ArrowRight" && pages.length) {
    currentIndex = (currentIndex + 1) % pages.length;
    updateCarousel();
  } else if (e.key === "ArrowLeft" && pages.length) {
    currentIndex = (currentIndex - 1 + pages.length) % pages.length;
    updateCarousel();
  }
});

/* =========================================
   Smooth Swipe (no vertical scroll) — v2
   ใช้ currentIndex + updateCarousel เดิม
========================================= */
(() => {
  const track = document.querySelector(".projects-carousel");
  if (!track) return;

  // helpers
  function getPages() {
    // รีเฟรชทุกครั้งเผื่อ repaginate ใหม่
    return Array.from(track.querySelectorAll(".project-list"));
  }
  function getStep(pgs) {
    if (!pgs.length) return 0;
    const styles = getComputedStyle(track);
    const gapX = parseFloat(styles.columnGap || styles.gap || "0") || 0;
    const w = pgs[0].getBoundingClientRect().width;
    return w + gapX;
  }
  function getTranslateX() {
    const m = getComputedStyle(track).transform;
    if (m && m !== "none") {
      const vals = m.match(/matrix\(([^)]+)\)/); // ✅ regex ถูกต้อง
      if (vals && vals[1]) {
        const parts = vals[1].split(",").map(v => parseFloat(v.trim()));
        return parts[4] || 0; // tx
      }
    }
    return 0;
  }
  function setTranslateX(px, withTransition = true) {
    if (!withTransition) {
      track.style.transition = "none";
    } else {
      track.style.transition = ""; // ปล่อยให้ใช้ CSS ที่เขียนไว้
    }
    track.style.transform = `translate3d(${px}px,0,0)`;
  }
  
  function clampIndex(idx, pgs) {
    return Math.max(0, Math.min(idx, pgs.length - 1));
  }

  // drag state
  let startX = 0, startY = 0, startTranslate = 0;
  let isDragging = false, locked = false, lastDx = 0;
  const DRAG_SWITCH = 12;   // px ก่อนล็อคทิศทาง
  const COMMIT_PX   = 70;   // px ตัดสินใจเปลี่ยนหน้า

  function pointerDown(x, y) {
    const pgs = getPages();
    if (!pgs.length) return;

    // sync index ตามตำแหน่งล่าสุด
    const step = getStep(pgs);
    if (step > 0) {
      const approx = Math.round(-getTranslateX() / step);
      currentIndex = clampIndex(approx, pgs); // ใช้ตัวแปรหลัก
    }

    isDragging = true; locked = false; lastDx = 0;
    startX = x; startY = y;
    startTranslate = getTranslateX();

    track.classList.add("is-dragging");
    setTranslateX(startTranslate, false); // ปิด transition ระหว่างลาก
  }

  function pointerMove(x, y, e) {
    if (!isDragging) return;

    const dx = x - startX;
    const dy = y - startY;

    if (!locked) {
      if (Math.abs(dx) > DRAG_SWITCH || Math.abs(dy) > DRAG_SWITCH) {
        locked = true;
        if (Math.abs(dx) > Math.abs(dy)) {
          e.preventDefault(); // คุมแนวนอนเอง
        } else {
          // แนวตั้งเด่น -> ยกเลิกโหมดลาก ปล่อยให้หน้าเลื่อนแนวตั้งได้
          isDragging = false;
          track.classList.remove("is-dragging");
          return;
        }
      }
    } else {
      e.preventDefault();
      lastDx = dx;

      const pgs = getPages();
      const step = getStep(pgs);
      const minX = - (pgs.length - 1) * step;
      const proposed = startTranslate + dx;

      // แรงต้านเมื่อดึงเกินขอบ
      let nextX = proposed;
      if (proposed > 0) {
        nextX = proposed * 0.35; // ซ้ายสุด
      } else if (proposed < minX) {
        nextX = minX + (proposed - minX) * 0.35; // ขวาสุด
      }
      setTranslateX(nextX, false);
    }
  }

  function pointerUp() {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove("is-dragging");

    const pgs = getPages();
    if (!pgs.length) return;

    // ชี้ขาดว่าจะไปหน้าถัดไป/ก่อนหน้าไหม
    if (Math.abs(lastDx) > COMMIT_PX) {
      if (lastDx < 0) {
        currentIndex = (currentIndex + 1) % pages.length;
      } else {
        currentIndex = (currentIndex - 1 + pages.length) % pages.length;
      }
    }
    updateCarousel();
  }

  // Touch
  track.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    pointerDown(t.clientX, t.clientY);
  }, { passive: true });

  track.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    pointerMove(t.clientX, t.clientY, e);
  }, { passive: false }); // preventDefault

  track.addEventListener("touchend", () => pointerUp(), { passive: true });

  // Mouse 
  track.addEventListener("mousedown", (e) => pointerDown(e.clientX, e.clientY));
  window.addEventListener("mousemove", (e) => pointerMove(e.clientX, e.clientY, e));
  window.addEventListener("mouseup", () => pointerUp());

  // Resize: stay at place
  window.addEventListener("resize", () => {
    const pgs = getPages();
    const step = getStep(pgs);
    setTranslateX(-clampIndex(currentIndex, pgs) * step, false);
  });
})();

/* ================================
   FORM (validate + Formspree)
================================ */
const contactForm = document.getElementById("contact-form"); 
const modal = document.getElementById("form-modal");
const modalOk = modal?.querySelector(".form-modal__ok");
const modalClose = modal?.querySelector(".form-modal__close");

// helper: set state and show error message
function setState(input, ok, message = "") {
  if (!input) return;
  const errorEl = input.nextElementSibling;
  input.classList.remove("is-error", "is-valid");
  input.classList.add(ok ? "is-valid" : "is-error");
  input.setAttribute("aria-invalid", ok ? "false" : "true");
  if (errorEl && errorEl.classList.contains("error-message")) {
    errorEl.textContent = message;
    errorEl.style.visibility = ok ? "hidden" : "visible";
    errorEl.style.opacity = ok ? "0" : "1";
  }
}

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isPhone(v) { return /^(\+66|0)[0-9\s-]{9,14}$/.test(v); }

contactForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nameEl = contactForm.querySelector('input[name="full-name"]');
  const emailEl = contactForm.querySelector('input[name="email"]');
  const phoneEl = contactForm.querySelector('input[name="phone"]');
  const messageEl = contactForm.querySelector('textarea[name="message"]');

  setState(nameEl, true);
  setState(emailEl, true);
  setState(phoneEl, true);

  let valid = true;
  let firstError = null;

  if (!nameEl?.value.trim()) {
    setState(nameEl, false, "กรุณากรอกชื่อ-นามสกุล");
    valid = false; firstError = firstError || nameEl;
  }
  if (!isEmail(emailEl?.value.trim() || "")) {
    setState(emailEl, false, "กรุณากรอกอีเมลที่ถูกต้อง");
    valid = false; firstError = firstError || emailEl;
  }
  if (!isPhone(phoneEl?.value.trim() || "")) {
    setState(phoneEl, false, "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง");
    valid = false; firstError = firstError || phoneEl;
  }

  if (!valid) {
    firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
    firstError?.focus();
    return;
  }

  const formData = new FormData(contactForm);
  const submitBtn = contactForm.querySelector(".submit-btn");
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "กำลังส่ง..."; }

  try {
    const response = await fetch(contactForm.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      openModal();
      contactForm.reset();
      [nameEl, emailEl, phoneEl, messageEl].forEach((el) => {
        if (el) el.classList.remove("is-valid", "is-error");
      });
    } else {
      throw new Error('Form submission failed.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert("เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง");
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "ส่งฟอร์ม"; }
  }
});

// ===== Form Success Modal (GSAP motion) =====
function openModal() {
  if (!modal) return;
  modal.classList.add("is-open");
  document.body.classList.add("modal-open");
  const dialog = modal.querySelector(".form-modal__dialog");
  if (window.gsap && dialog) {
    gsap.fromTo(
      dialog,
      { y: -50, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }
    );
  }
}

function closeModal() {
  if (!modal) return;
  const dialog = modal.querySelector(".form-modal__dialog");
  if (window.gsap && dialog) {
    gsap.to(dialog, {
      y: -50, opacity: 0, scale: 0.9, duration: 0.3, ease: "power3.in",
      onComplete: () => {
        modal.classList.remove("is-open");
        document.body.classList.remove("modal-open");
      },
    });
  } else {
    modal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
  }
}

modalOk?.addEventListener("click", closeModal);
modalClose?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

/* ================================
   SMOOTH SCROLL (With Custom Easing)
================================ */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("href");
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 69, // offset for navbar
        behavior: "smooth",
      });
    }
  });
});

/* ================================
   INTERSECTION OBSERVER ANIMATIONS (lightweight)
================================ */
(() => {
  const targets = document.querySelectorAll("[data-anim]");
  if (!targets.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      // ใส่ .appear เมื่อเข้า viewport
      el.classList.add("appear");
      // io.unobserve(el); // เล่นครั้งเดียว
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });

  targets.forEach((el) => {
    el.classList.add("anim-init");
    const type = el.dataset.anim || "fade-in-up";
    if (type === "slide-left")  el.classList.add("slide-in-left");
    else if (type === "slide-right") el.classList.add("slide-in-right");
    else if (type === "zoom")   el.classList.add("zoom-in");
    else                        el.classList.add("fade-in-up");

    // รองรับ delay (เช่น data-delay="120")
    const delay = parseInt(el.dataset.delay || "0", 10);
    if (delay) el.style.transitionDelay = `${delay}ms`;

    io.observe(el);
  });
})();


/* ================================
   PERFORMANCE (Parallax banner with rAF)
================================ */
let latestY = 0;
let ticking = false;

window.addEventListener("scroll", () => {
  latestY = window.pageYOffset;
  if (!ticking) {
    requestAnimationFrame(() => {
      const bg = document.querySelector(".banner-bg");
      if (bg) {
        const offset = Math.min(latestY * 0.3, 200);
        bg.style.transform = `translate3d(0, ${offset}px, 0)`;
      }
      ticking = false;
    });
    ticking = true;
  }
});


/* ================================
   INIT
================================ */

function debounce(fn, wait) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

window.addEventListener("load", () => {
  repaginateProjects(); // build pages for current viewport
  disableButtons();
});

window.addEventListener(
  "resize",
  debounce(() => {
    repaginateProjects();
  }, 150)
);

/* ===== Projects: Pagination (dots) ===== */
(() => {
  const wrapper = document.querySelector(".carousel-wrapper");
  let paginationEl = null;

  function buildPagination() {
    if (!wrapper) return;
    if (paginationEl) paginationEl.remove();
    paginationEl = document.createElement("div");
    paginationEl.className = "projects-pagination";
    wrapper.insertAdjacentElement("afterend", paginationEl);

    if (!pages || !pages.length) return;
    for (let i = 0; i < pages.length; i++) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "projects-dot";
      dot.setAttribute("aria-label", `ไปหน้า ${i + 1}`);
      dot.addEventListener("click", () => {
        currentIndex = i;
        updateCarousel();
        updatePagination();
      });
      paginationEl.appendChild(dot);
    }
    updatePagination();
  }

  function updatePagination() {
    if (!paginationEl) return;
    const dots = paginationEl.querySelectorAll(".projects-dot");
    dots.forEach((d, i) => {
      d.classList.toggle("is-active", i === currentIndex);
      d.disabled = i === currentIndex;
    });
  }

  const __updateCarousel = updateCarousel;
  window.updateCarousel = function () {
    __updateCarousel();
    updatePagination();
  };

  window.addEventListener("load", () => {
    setTimeout(buildPagination, 50);
  });
  window.addEventListener("resize", () => {
    setTimeout(buildPagination, 180);
  });

  if (document.readyState === "complete") {
    setTimeout(buildPagination, 50);
  }
})();

/* ===== Scroll to Top Button ===== */
const scrollToTopBtn = document.getElementById("scroll-to-top");

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    scrollToTopBtn?.classList.add("show");
  } else {
    scrollToTopBtn?.classList.remove("show");
  }
});

scrollToTopBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ===== Image Modal (optional) ===== */
document.addEventListener("DOMContentLoaded", () => {
  const imgModal = document.getElementById("imageModal");
  const imgModalContent = document.getElementById("modalImg");
  const imgModalClose = document.querySelector(".modal-close");

  if (!imgModal || !imgModalContent) return;

  document.querySelectorAll(".project-card .project-image").forEach((div) => {
    div.addEventListener("click", () => {
      const bg = getComputedStyle(div).backgroundImage;
      if (bg && bg.startsWith("url(")) {
        const url = bg.slice(5, -2);
        imgModalContent.src = url;
      }
      imgModal.classList.add("show");
    });
  });

  imgModalClose?.addEventListener("click", () => {
    imgModal.classList.remove("show");
  });

  imgModal.addEventListener("click", (e) => {
    if (e.target === imgModal) {
      imgModal.classList.remove("show");
    }
  });
});
