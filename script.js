const ASSET_ROOT = new URL(".", document.baseURI);

const targets = {
  "sgr-c": {
    label: "Sgr C",
    alt: "Sgr C",
    plain: "SgrC_plain.png",
    sources: "SgrC_sourc.png",
  },
  "cloud-e": {
    label: "Dust Ridge cloud e",
    alt: "Dust Ridge cloud e",
    // These two legacy filenames describe the opposite of their visible content.
    plain: "cloude_sourc.png",
    sources: "cloude_plain.png",
  },
  "20kms": {
    label: "20 km s⁻¹ cloud",
    alt: "the 20 kilometer per second cloud",
    plain: "The20kmsCloud_plain.png",
    sources: "The20kmsCloud_sourc.png",
  },
};

const viewer = document.querySelector("#viewer");
const viewerCard = document.querySelector("#viewer-card");
const stage = document.querySelector("#media-stage");
const fieldImage = document.querySelector("#field-image");
const magnifier = document.querySelector("#magnifier");
const magnifierViewport = document.querySelector("#magnifier-viewport");
const magnifierImage = document.querySelector("#magnifier-image");
const magnifierBadge = document.querySelector("#magnifier-badge");
const targetSelect = document.querySelector("#target-select");
const viewButtons = [...document.querySelectorAll("[data-view]")];
const zoomRange = document.querySelector("#zoom-range");
const zoomOutput = document.querySelector("#zoom-output");
const resetButton = document.querySelector("#reset-button");
const viewerTitle = document.querySelector("#viewer-title");
const modeReadout = document.querySelector("#mode-readout");
const positionReadout = document.querySelector("#position-readout");
const loadingMessage = document.querySelector("#loading-message");

const state = {
  target: "sgr-c",
  view: "plain",
  zoom: 4,
  point: { x: 0.5, y: 0.5 },
  inspecting: false,
  touchPinned: false,
  requestId: 0,
  renderFrame: 0,
};

const imageCache = new Map();

function assetUrl(filename) {
  return new URL(filename, ASSET_ROOT).href;
}

function preloadImage(filename) {
  const url = assetUrl(filename);

  if (!imageCache.has(url)) {
    const request = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () =>
        resolve({
          url,
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      image.onerror = () => reject(new Error(`Could not load ${filename}`));
      image.src = url;
    });

    request.catch(() => imageCache.delete(url));
    imageCache.set(url, request);
  }

  return imageCache.get(url);
}

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatZoom(zoom) {
  return `${Number.isInteger(zoom) ? zoom : zoom.toFixed(1)}×`;
}

function setInspecting(isInspecting) {
  state.inspecting = isInspecting;
  viewer.classList.toggle("is-inspecting", isInspecting);
  magnifier.setAttribute("aria-hidden", String(!isInspecting));
}

function scheduleLensRender() {
  if (state.renderFrame) return;

  state.renderFrame = requestAnimationFrame(() => {
    state.renderFrame = 0;
    renderLens();
  });
}

function renderLens() {
  if (stage.dataset.ready !== "true") return;

  const stageRect = stage.getBoundingClientRect();
  const localX = state.point.x * stageRect.width;
  const localY = state.point.y * stageRect.height;
  const zoomedWidth = stageRect.width * state.zoom;
  const zoomedHeight = stageRect.height * state.zoom;

  magnifier.style.left = `${localX}px`;
  magnifier.style.top = `${localY}px`;

  magnifierImage.style.width = `${zoomedWidth}px`;
  magnifierImage.style.height = `${zoomedHeight}px`;
  magnifierImage.style.left = `${magnifierViewport.clientWidth / 2 - localX * state.zoom}px`;
  magnifierImage.style.top = `${magnifierViewport.clientHeight / 2 - localY * state.zoom}px`;

  const location =
    state.point.x === 0.5 && state.point.y === 0.5
      ? "Frame center"
      : "Sample position";
  positionReadout.textContent = `${location} · x ${(state.point.x * 100).toFixed(1)}% · y ${(
    state.point.y * 100
  ).toFixed(1)}%`;
}

function updatePoint(clientX, clientY) {
  const rect = stage.getBoundingClientRect();
  state.point.x = clamp((clientX - rect.left) / rect.width);
  state.point.y = clamp((clientY - rect.top) / rect.height);
  scheduleLensRender();
}

function applyView() {
  const target = targets[state.target];
  const filename = target[state.view];
  const url = assetUrl(filename);
  const hasSources = state.view === "sources";

  fieldImage.src = url;
  magnifierImage.src = url;
  fieldImage.alt = `Dual-band ALMA mosaic of ${target.alt}${
    hasSources ? " with cataloged compact sources marked" : ""
  }`;

  viewButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.view === state.view));
  });

  modeReadout.textContent = hasSources ? "Cataloged sources marked" : "Dual-color composite";
  scheduleLensRender();
}

async function setTarget(targetKey) {
  const target = targets[targetKey];
  if (!target) return;

  const requestId = ++state.requestId;
  state.target = targetKey;
  stage.dataset.ready = "false";
  stage.dataset.error = "false";
  stage.setAttribute("aria-busy", "true");
  loadingMessage.textContent = `Loading ${target.label}…`;
  viewerTitle.textContent = target.label;
  applyView();
  setInspecting(false);

  try {
    const [plainImage] = await Promise.all([
      preloadImage(target.plain),
      preloadImage(target.sources),
    ]);

    if (requestId !== state.requestId) return;

    stage.style.aspectRatio = `${plainImage.width} / ${plainImage.height}`;
    viewerCard.classList.toggle("is-portrait", plainImage.width / plainImage.height < 0.9);
    applyView();
    stage.dataset.ready = "true";
    stage.setAttribute("aria-busy", "false");
    loadingMessage.textContent = `${target.label} ready`;
    scheduleLensRender();
  } catch (error) {
    if (requestId !== state.requestId) return;
    stage.dataset.error = "true";
    stage.setAttribute("aria-busy", "false");
    loadingMessage.textContent = "The mosaic could not be loaded. Please try again.";
    console.error(error);
  }
}

function setZoom(value) {
  state.zoom = clamp(Number(value), 2, 8);
  zoomRange.value = String(state.zoom);
  const label = formatZoom(state.zoom);
  zoomOutput.value = label;
  magnifierBadge.textContent = label;
  scheduleLensRender();
}

function resetViewer() {
  state.point = { x: 0.5, y: 0.5 };
  state.touchPinned = false;
  setZoom(4);
  setInspecting(document.activeElement === viewer);
  scheduleLensRender();
}

targetSelect.addEventListener("change", (event) => {
  state.view = "plain";
  setTarget(event.target.value);
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    applyView();
  });
});

zoomRange.addEventListener("input", (event) => setZoom(event.target.value));
resetButton.addEventListener("click", resetViewer);

stage.addEventListener("pointerenter", (event) => {
  if (event.pointerType === "touch") return;
  updatePoint(event.clientX, event.clientY);
  setInspecting(true);
});

stage.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch" && !stage.hasPointerCapture(event.pointerId)) return;
  updatePoint(event.clientX, event.clientY);
  setInspecting(true);
});

stage.addEventListener("pointerleave", (event) => {
  if (event.pointerType !== "touch" && !state.touchPinned && document.activeElement !== viewer) {
    setInspecting(false);
  }
});

stage.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  stage.setPointerCapture(event.pointerId);
  updatePoint(event.clientX, event.clientY);
  state.touchPinned = event.pointerType !== "mouse";
  setInspecting(true);
});

stage.addEventListener("pointerup", (event) => {
  if (stage.hasPointerCapture(event.pointerId)) {
    stage.releasePointerCapture(event.pointerId);
  }
});

stage.addEventListener("pointercancel", (event) => {
  if (stage.hasPointerCapture(event.pointerId)) {
    stage.releasePointerCapture(event.pointerId);
  }
});

viewer.addEventListener("focus", () => {
  setInspecting(true);
  scheduleLensRender();
});

viewer.addEventListener("blur", () => {
  if (!state.touchPinned) setInspecting(false);
});

viewer.addEventListener("keydown", (event) => {
  const step = event.shiftKey ? 0.1 : 0.02;
  let handled = true;

  switch (event.key) {
    case "ArrowLeft":
      state.point.x = clamp(state.point.x - step);
      break;
    case "ArrowRight":
      state.point.x = clamp(state.point.x + step);
      break;
    case "ArrowUp":
      state.point.y = clamp(state.point.y - step);
      break;
    case "ArrowDown":
      state.point.y = clamp(state.point.y + step);
      break;
    case "+":
    case "=":
      setZoom(state.zoom + 0.5);
      break;
    case "-":
    case "_":
      setZoom(state.zoom - 0.5);
      break;
    case "Escape":
      state.touchPinned = false;
      setInspecting(false);
      break;
    default:
      handled = false;
  }

  if (handled) {
    event.preventDefault();
    setInspecting(event.key !== "Escape");
    scheduleLensRender();
  }
});

new ResizeObserver(scheduleLensRender).observe(stage);

setZoom(state.zoom);
setTarget(state.target);
