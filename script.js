const sampleGrid = document.querySelector("#sampleGrid");
const modal = document.querySelector("#sampleModal");
const toast = document.querySelector("#toast");
const modalImage = document.querySelector("#modalImage");
const modalThumbs = document.querySelector("#modalThumbs");
const modalTitle = document.querySelector("#modalTitle");
const modalTheme = document.querySelector("#modalTheme");
const modalLanguage = document.querySelector("#modalLanguage");
const modalTier = document.querySelector("#modalTier");
const modalVerdict = document.querySelector("#modalVerdict");
const modalLabels = document.querySelector("#modalLabels");
const modalText = document.querySelector("#modalText");
const modalRationale = document.querySelector("#modalRationale");

const state = {
  samples: [],
  activeFilter: { type: "all", value: "all" },
  modalIndex: 0,
  imageIndex: 0,
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const compactNumber = (value) => new Intl.NumberFormat("en-US").format(value);

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}

document.querySelectorAll("[data-placeholder]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showToast(link.dataset.placeholder);
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.02 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

function filterSamples() {
  if (state.activeFilter.type === "all") {
    return state.samples;
  }
  return state.samples.filter((sample) => sample[state.activeFilter.type] === state.activeFilter.value);
}

function mosaicClass(count) {
  if (count <= 1) return "count-1";
  if (count === 2) return "count-2";
  if (count === 3) return "count-3";
  if (count === 4) return "count-4";
  return "count-many";
}

function sampleCard(sample, index) {
  const images = sample.images.slice(0, 4);
  const more = sample.imageCount > 4 ? `<span class="more-badge">+${sample.imageCount - 4}</span>` : "";
  const labels = [
    sample.languageName,
    sample.tierName,
    sample.verdict,
    `${sample.imageCount} images`,
  ];

  return `
    <article class="sample-card" data-index="${index}">
      <div class="sample-mosaic ${mosaicClass(sample.imageCount)}">
        ${images
          .map(
            (src, imageIndex) =>
              `<img src="${escapeHtml(src)}" alt="Sample ${escapeHtml(sample.id)} image ${imageIndex + 1}" loading="lazy">`
          )
          .join("")}
        ${more}
      </div>
      <div class="sample-body">
        <div class="sample-meta">
          ${labels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}
        </div>
        <h3 class="sample-title">Sample ${escapeHtml(sample.id)} <span>${escapeHtml(sample.themeShort)}</span></h3>
        <p class="sample-excerpt">${escapeHtml(sample.excerpt)}</p>
        <div class="sample-labels">
          ${sample.distortions.slice(0, 3).map((label) => `<span>${escapeHtml(label)}</span>`).join("")}
        </div>
        <div class="sample-footer">
          <span>${compactNumber(sample.chars)} chars</span>
          <button class="open-sample" type="button" data-index="${index}">Open sample</button>
        </div>
      </div>
    </article>
  `;
}

function renderSamples() {
  const visible = filterSamples();
  if (!visible.length) {
    sampleGrid.innerHTML = `<p class="empty-state">No samples match this filter.</p>`;
    return;
  }
  sampleGrid.innerHTML = visible
    .map((sample) => sampleCard(sample, state.samples.indexOf(sample)))
    .join("");

  sampleGrid.querySelectorAll(".open-sample").forEach((button) => {
    button.addEventListener("click", () => openModal(Number(button.dataset.index), 0));
  });
}

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeFilter = {
      type: button.dataset.filterType,
      value: button.dataset.filterValue,
    };
    document.querySelectorAll(".filter-button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderSamples();
  });
});

function renderModal() {
  const sample = state.samples[state.modalIndex];
  if (!sample) return;
  const image = sample.images[state.imageIndex] ?? sample.cover;

  modalImage.src = image;
  modalImage.alt = `Sample ${sample.id} image ${state.imageIndex + 1}`;
  modalTitle.textContent = `Sample ${sample.id}: ${sample.languageName} / ${sample.tierName}`;
  modalTheme.textContent = `${sample.theme} · ${sample.regionName} · ${compactNumber(sample.chars)} characters`;
  modalLanguage.textContent = sample.languageName;
  modalTier.textContent = sample.tierName;
  modalVerdict.textContent = sample.verdict;
  modalText.textContent = sample.text;
  modalRationale.textContent = sample.rationale;

  modalLabels.innerHTML = sample.distortions.length
    ? sample.distortions.map((label) => `<span>${escapeHtml(label)}</span>`).join("")
    : "<span>No L2 distortion labels</span>";

  modalThumbs.innerHTML = sample.images
    .map(
      (src, index) => `
        <button class="${index === state.imageIndex ? "active" : ""}" type="button" data-image="${index}" aria-label="Show image ${index + 1}">
          <img src="${escapeHtml(src)}" alt="">
        </button>
      `
    )
    .join("");

  modalThumbs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.imageIndex = Number(button.dataset.image);
      renderModal();
    });
  });
}

function openModal(index, imageIndex = 0) {
  state.modalIndex = index;
  state.imageIndex = imageIndex;
  renderModal();
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.querySelector(".modal-close").focus();
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function stepImage(delta) {
  const sample = state.samples[state.modalIndex];
  if (!sample) return;
  const count = sample.images.length;
  state.imageIndex = (state.imageIndex + delta + count) % count;
  renderModal();
}

document.querySelector(".modal-close").addEventListener("click", closeModal);
document.querySelector(".prev-image").addEventListener("click", () => stepImage(-1));
document.querySelector(".next-image").addEventListener("click", () => stepImage(1));

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

window.addEventListener("keydown", (event) => {
  if (!modal.classList.contains("is-open")) return;
  if (event.key === "Escape") closeModal();
  if (event.key === "ArrowLeft") stepImage(-1);
  if (event.key === "ArrowRight") stepImage(1);
});

fetch("assets/data/samples.json")
  .then((response) => {
    if (!response.ok) throw new Error("Unable to load sample data");
    return response.json();
  })
  .then((samples) => {
    state.samples = samples;
    renderSamples();
  })
  .catch((error) => {
    sampleGrid.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  });

function initField() {
  const canvas = document.querySelector("#field");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext("2d");
  let nodes = [];
  let width = 0;
  let height = 0;
  let pointer = { x: 0, y: 0, active: false };

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.max(34, Math.min(78, Math.floor(width / 18)));
    nodes = Array.from({ length: count }, (_, index) => ({
      x: (index * 97) % width,
      y: (index * 53) % height,
      vx: (Math.sin(index * 1.7) * 0.22) + 0.04,
      vy: (Math.cos(index * 1.3) * 0.18) + 0.03,
      size: 1.4 + (index % 3) * 0.4,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;

    nodes.forEach((node) => {
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < -20) node.x = width + 20;
      if (node.x > width + 20) node.x = -20;
      if (node.y < -20) node.y = height + 20;
      if (node.y > height + 20) node.y = -20;
    });

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 132) {
          const alpha = (1 - dist / 132) * 0.16;
          ctx.strokeStyle = `rgba(15, 118, 110, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    nodes.forEach((node) => {
      const drift = pointer.active ? Math.max(0, 1 - Math.hypot(node.x - pointer.x, node.y - pointer.y) / 240) : 0;
      ctx.fillStyle = drift > 0 ? `rgba(217, 99, 79, ${0.18 + drift * 0.24})` : "rgba(71, 87, 168, 0.18)";
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size + drift * 1.4, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (event) => {
    pointer = { x: event.clientX, y: event.clientY, active: true };
  });
  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
  resize();
  draw();
}

initField();
