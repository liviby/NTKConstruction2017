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
let currentIndex = 0; // active page index

function refreshRefs() {
  pages = document.querySelectorAll(".project-list");
}

function disableButtons() {
  if (!prevBtn || !nextBtn) return;
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex >= pages.length - 1;
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
    allCards.slice(i, i + perPage).forEach((card) => ul.appendChild(card));
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
  if (currentIndex < pages.length - 1) {
    currentIndex++;
    updateCarousel();
  }
});
prevBtn?.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    updateCarousel();
  }
});

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  const active = document.activeElement;
  if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA"))
    return;

  if (e.key === "ArrowRight" && currentIndex < pages.length - 1) {
    currentIndex++;
    updateCarousel();
  } else if (e.key === "ArrowLeft" && currentIndex > 0) {
    currentIndex--;
    updateCarousel();
  }
});

// Touch swipe (mobile)
let touchStartX = 0;
let touchDragging = false;

track?.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.touches[0].clientX;
    touchDragging = true;
  },
  { passive: true }
);
track?.addEventListener(
  "touchend",
  (e) => {
    if (!touchDragging) return;
    touchDragging = false;
    const endX = e.changedTouches[0].clientX;
    const dx = touchStartX - endX;
    if (Math.abs(dx) > 50) {
      let moved = false;
      if (dx > 0 && currentIndex < pages.length - 1) {
        currentIndex++;
        moved = true;
      } else if (dx < 0 && currentIndex > 0) {
        currentIndex--;
        moved = true;
      }
      if (moved) updateCarousel();
    }
  },
  { passive: true }
);

// Mouse drag (desktop)
let mouseStartX = 0;
let mouseDown = false;

track?.addEventListener("mousedown", (e) => {
  mouseDown = true;
  mouseStartX = e.clientX;
});
window.addEventListener("mouseup", () => (mouseDown = false));
window.addEventListener("mousemove", (e) => {
  if (!mouseDown) return;
  const dx = mouseStartX - e.clientX;
  if (Math.abs(dx) > 80) {
    let moved = false;
    if (dx > 0 && currentIndex < pages.length - 1) {
      currentIndex++;
      moved = true;
    }
    if (dx < 0 && currentIndex > 0) {
      currentIndex--;
      moved = true;
    }
    if (moved) updateCarousel();
    mouseDown = false;
  }
});

/* ================================
   FORM (validate + Google Sheet)
================================ */
const contactForm = document.querySelector(".contact-form form");
const modal = document.getElementById("form-modal");
const modalOk = modal?.querySelector(".form-modal__ok");
const modalClose = modal?.querySelector(".form-modal__close");

// helper: set state and show error message
function setState(input, ok, message = "") {
  // หา error element ที่อยู่ถัดไป
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

// validate utilities (โค้ดเดิม)
function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isPhone(v) {
  return /^[0-9+\-\s]{9,15}$/.test(v);
}

// contactForm?.addEventListener("submit", ...)
contactForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const nameEl = contactForm.querySelector('input[type="text"]');
  const emailEl = contactForm.querySelector('input[type="email"]');
  const phoneEl = contactForm.querySelector('input[type="tel"]');

  // Clear previous errors
  setState(nameEl, true);
  setState(emailEl, true);
  setState(phoneEl, true);

  let valid = true;

  if (!nameEl || !nameEl.value.trim()) {
    setState(nameEl, false, "กรุณากรอกชื่อ-นามสกุล");
    valid = false;
  }

  if (!emailEl || !isEmail(emailEl.value.trim())) {
    setState(emailEl, false, "กรุณากรอกอีเมลที่ถูกต้อง");
    valid = false;
  }

  if (!phoneEl || !isPhone(phoneEl.value.trim())) {
    setState(phoneEl, false, "กรุณากรอกเบอร์โทรศัพท์");
    valid = false;
  } else {
    setState(phoneEl, true);
  }

  if (!valid) {
    const firstErr = contactForm.querySelector(".is-error");
    firstErr?.scrollIntoView({ behavior: "smooth", block: "center" });
    firstErr?.focus();
    return;
  }

  // ถ้า valid แล้ว แสดง modal
  openModal();
  contactForm.reset();
  [nameEl, emailEl, phoneEl].forEach((el) => el?.classList.remove("is-valid"));

  // ===== Form Success Modal (GSAP motion) =====
  function openModal() {
    if (!modal) return;
    modal.classList.add("is-open");
    document.body.classList.add("modal-open");

    const dialog = modal.querySelector(".form-modal__dialog");
    gsap.fromTo(
      dialog,
      { y: -50, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }
    );
  }

  function closeModal() {
    if (!modal) return;
    const dialog = modal.querySelector(".form-modal__dialog");
    gsap.to(dialog, {
      y: -50,
      opacity: 0,
      scale: 0.9,
      duration: 0.3,
      ease: "power3.in",
      onComplete: () => {
        modal.classList.remove("is-open");
        document.body.classList.remove("modal-open");
      },
    });
  }

  modalOk?.addEventListener("click", closeModal);
  modalClose?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // ✅ โค้ดสำหรับส่งฟอร์ม...
  // const formData = new FormData(contactForm);
  // const url = "URL_FROM_GOOGLE_APPS_SCRIPT"; // 👈 อย่าลืมเปลี่ยน URL นี้

  // fetch(url, {
  //     method: 'POST',
  //     body: formData
  //   })
  //   .then(response => response.text())
  //   .then(data => {
  //     console.log('Success:', data);
  //     openModal();
  //     contactForm.reset();
  //     [nameEl, emailEl, phoneEl].forEach((el) =>
  //       el?.classList.remove("is-valid")
  //     );
  //   })
  //   .catch((error) => {
  //     console.error('Error:', error);
  //     alert("มีข้อผิดพลาดในการส่งข้อมูล");
  //   });
});

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
        top: targetElement.offsetTop - 69, // 80px for navbar offset
        behavior: "smooth",
      });
    }
  });
});

/* ================================
   INTERSECTION OBSERVER ANIMATIONS
================================ */
const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.remove("hidden-on-load");
    }
  });
}, observerOptions);

document
  .querySelectorAll(".card, .project-card, .about-content")
  .forEach((el) => {
    el.classList.add("hidden-on-load");
    observer.observe(el);
  });

/* ================================
   PERFORMANCE (debounce + parallax banner)
================================ */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const handleScroll = debounce(() => {
  const scrolled = window.pageYOffset;
  if (window.innerWidth > 768) {
    const banner = document.querySelector(".banner");
    const speed = scrolled * 0.3;
    if (banner) banner.style.backgroundPositionY = speed + "px";
  }
}, 10);
window.addEventListener("scroll", handleScroll);

/* ================================
   INIT
================================ */
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

// ===== Scroll to Top Button =====
const scrollToTopBtn = document.getElementById("scroll-to-top");

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    scrollToTopBtn.classList.add("show");
  } else {
    scrollToTopBtn.classList.remove("show");
  }
});

scrollToTopBtn.addEventListener("click", (e) => {
  e.preventDefault();
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

// Modal logic
document.addEventListener("DOMContentLoaded", () => {
  const imgModal = document.getElementById("imageModal");
  const imgModalContent = document.getElementById("modalImg");
  const imgModalClose = document.querySelector(".modal-close");

  document.querySelectorAll(".project-card .project-image").forEach((div) => {
    div.addEventListener("click", () => {
      const bg = getComputedStyle(div).backgroundImage;
      if (bg && bg.startsWith("url(")) {
        const url = bg.slice(5, -2);
        imgModalContent.src = url;
      }
      imgModal.classList.add("show"); // ใช้ class แทน
    });
  });

  imgModalClose.addEventListener("click", () => {
    imgModal.classList.remove("show");
  });

  imgModal.addEventListener("click", (e) => {
    if (e.target === imgModal) {
      imgModal.classList.remove("show");
    }
  });
});
