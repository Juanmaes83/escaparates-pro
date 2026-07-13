const cv = document.getElementById("pin_cv");
const ctx = cv.getContext("2d");
const canvasOuter = document.getElementById("canvas_outer");
const canvasWrap = document.getElementById("canvas_wrap");
const dropZone = document.getElementById("drop_zone");
const imgInput = document.getElementById("img_input");
const pinList = document.getElementById("pin_list");
const copyBtn = document.getElementById("copy_btn");
const clearAllBtn = document.getElementById("clear_all_btn");
const changeBtn = document.getElementById("change_btn");
const imgHint = document.getElementById("img_hint");
const viewToggle = document.getElementById("view_toggle");
const viewABtn = document.getElementById("view_a_btn");
const viewBBtn = document.getElementById("view_b_btn");
const ratioAEl = document.getElementById("ratio_a");
const ratioBEl = document.getElementById("ratio_b");
const labelAEl = document.getElementById("label_a");
const labelBEl = document.getElementById("label_b");
const wscaleHint = document.getElementById("wscale_hint");

let img = null;
let pins = [];
let dragging = null;
let pendingAdd = false;
let downPos = null;
let mouseNorm = null;
let currentView = "a";
let layoutCache = null;
let rafPending = false;

const posA = { x: 0.5, y: 0.5 };
const posB = { x: 0.5, y: 0.5 };

const PIN_R = 9;
const GRAB_PX = 18;
const LOUPE_R = 60;
const LOUPE_ZOOM = 1.5;
const LOUPE_OFF = LOUPE_R + 12;
const TAP_DIST = 0.012;
const SIZE_DEF = 2.0;

const sampleCv = document.createElement("canvas");
sampleCv.width = 3;
sampleCv.height = 3;
const sampleCtx = sampleCv.getContext("2d", { willReadFrequently: true });

function requestRender() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    draw();
  });
}

function invalidateLayout() {
  layoutCache = null;
}

function dpr() {
  return window.devicePixelRatio || 1;
}
function cw() {
  return cv.offsetWidth;
}
function ch() {
  return cv.offsetHeight;
}

function resize() {
  cv.width = cw() * dpr();
  cv.height = ch() * dpr();
}

new ResizeObserver(() => {
  if (img) {
    resize();
    requestRender();
  }
}).observe(cv);

function parseRatio(str) {
  const s = str.trim().replace(/\s/g, "");
  const m = s.match(/^(\d+(?:\.\d+)?)[:/](\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const w = parseFloat(m[1]),
    h = parseFloat(m[2]);
  if (!w || !h) return null;
  return { w, h };
}

function getCropRect(imgW, imgH, rw, rh, px, py) {
  const imgR = imgW / imgH;
  const cropR = rw / rh;
  if (imgR > cropR) {
    const visW = cropR / imgR;
    const x0 = px * (1 - visW);
    return { x0, y0: 0, x1: x0 + visW, y1: 1 };
  } else {
    const visH = imgR / cropR;
    const y0 = py * (1 - visH);
    return { x0: 0, y0, x1: 1, y1: y0 + visH };
  }
}

function getRects() {
  if (layoutCache) return layoutCache;
  if (!img) return null;
  const ra = parseRatio(ratioAEl.value);
  const rb = parseRatio(ratioBEl.value);
  if (!ra || !rb) return null;
  const rectA = getCropRect(
    img.naturalWidth,
    img.naturalHeight,
    ra.w,
    ra.h,
    posA.x,
    posA.y
  );
  const rectB = getCropRect(
    img.naturalWidth,
    img.naturalHeight,
    rb.w,
    rb.h,
    posB.x,
    posB.y
  );
  const wScale = (rectA.x1 - rectA.x0) / (rectB.x1 - rectB.x0);
  layoutCache = { rectA, rectB, wScale };
  return layoutCache;
}

function getCurrentRect() {
  const rects = getRects();
  if (!rects) return null;
  return currentView === "a" ? rects.rectA : rects.rectB;
}

function imgToDisplay(px, py, rect) {
  return {
    x: (px - rect.x0) / (rect.x1 - rect.x0),
    y: (py - rect.y0) / (rect.y1 - rect.y0)
  };
}

function displayToImg(dx, dy, rect) {
  return {
    x: rect.x0 + dx * (rect.x1 - rect.x0),
    y: rect.y0 + dy * (rect.y1 - rect.y0)
  };
}

function isInFrame(d) {
  return d.x >= 0 && d.x <= 1 && d.y >= 0 && d.y <= 1;
}

function updateCanvasAspect() {
  const r = parseRatio(currentView === "a" ? ratioAEl.value : ratioBEl.value);
  if (r && img) cv.style.aspectRatio = `${r.w} / ${r.h}`;
}

function eventNorm(e) {
  const rect = cv.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / rect.width,
    y: (e.clientY - rect.top) / rect.height
  };
}

function clampNorm(n) {
  return { x: Math.max(0, Math.min(1, n.x)), y: Math.max(0, Math.min(1, n.y)) };
}

function normToCanvas(nx, ny) {
  return { x: nx * cw(), y: ny * ch() };
}

function nearestPin(dx, dy) {
  const rect = getCurrentRect();
  if (!rect) return null;
  const w = cw(),
    h = ch() || 1;
  const thresh = GRAB_PX * GRAB_PX;
  let best = null,
    bestD = Infinity;
  pins.forEach((p, i) => {
    const d = imgToDisplay(p.x, p.y, rect);
    const ex = (d.x - dx) * w;
    const ey = (d.y - dy) * h;
    const dist = ex * ex + ey * ey;
    if (dist < bestD) {
      bestD = dist;
      best = i;
    }
  });
  return bestD < thresh ? best : null;
}

function sampleLuminance(nx, ny) {
  if (!img) return 128;
  const rect = getCurrentRect();
  if (!rect) return 128;
  const ic = displayToImg(nx, ny, rect);
  sampleCtx.clearRect(0, 0, 3, 3);
  sampleCtx.drawImage(
    img,
    ic.x * img.naturalWidth - 1,
    ic.y * img.naturalHeight - 1,
    3,
    3,
    0,
    0,
    3,
    3
  );
  const d = sampleCtx.getImageData(1, 1, 1, 1).data;
  return 0.299 * d[0] + 0.587 * d[1] + 0.114 * d[2];
}

function drawPin(cx, cy, num, active, faded) {
  ctx.save();
  ctx.globalAlpha = faded ? 0.35 : 1;
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, PIN_R, 0, Math.PI * 2);
  ctx.fillStyle = active ? "oklch(52% 0.14 135)" : "oklch(42% 0.13 135)";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.88)";
  ctx.stroke();
  ctx.font = '500 9px "DM Mono", monospace';
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(num), cx, cy + 0.5);
  ctx.restore();
}

function drawLoupe(cx, cy) {
  const w = cw(),
    h = ch();
  let lx = cx + LOUPE_OFF,
    ly = cy - LOUPE_OFF;
  if (lx + LOUPE_R > w) lx = cx - LOUPE_OFF;
  if (lx - LOUPE_R < 0) lx = cx + LOUPE_OFF;
  if (ly - LOUPE_R < 0) ly = cy + LOUPE_OFF;
  if (ly + LOUPE_R > h) ly = cy - LOUPE_OFF;

  const rect = getCurrentRect();
  if (!rect) return;
  const ic = displayToImg(cx / w, cy / h, rect);
  const scaleX = (img.naturalWidth * (rect.x1 - rect.x0)) / w;
  const scaleY = (img.naturalHeight * (rect.y1 - rect.y0)) / h;
  const hw = LOUPE_R / LOUPE_ZOOM;

  ctx.save();
  ctx.beginPath();
  ctx.arc(lx, ly, LOUPE_R, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(
    img,
    ic.x * img.naturalWidth - hw * scaleX,
    ic.y * img.naturalHeight - hw * scaleY,
    hw * 2 * scaleX,
    hw * 2 * scaleY,
    lx - LOUPE_R,
    ly - LOUPE_R,
    LOUPE_R * 2,
    LOUPE_R * 2
  );

  const edgeLines = [
    { axis: "x", cv: 0 },
    { axis: "x", cv: w },
    { axis: "y", cv: 0 },
    { axis: "y", cv: h }
  ];
  edgeLines.forEach(({ axis, cv: edgePos }) => {
    const loupePos =
      axis === "x"
        ? lx + (edgePos - cx) * LOUPE_ZOOM
        : ly + (edgePos - cy) * LOUPE_ZOOM;
    const center = axis === "x" ? lx : ly;
    if (loupePos < center - LOUPE_R || loupePos > center + LOUPE_R) return;
    ctx.strokeStyle = "oklch(52% 0.14 135)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (axis === "x") {
      ctx.moveTo(loupePos, ly - LOUPE_R);
      ctx.lineTo(loupePos, ly + LOUPE_R);
    } else {
      ctx.moveTo(lx - LOUPE_R, loupePos);
      ctx.lineTo(lx + LOUPE_R, loupePos);
    }
    ctx.stroke();
  });

  ctx.restore();

  const lum = sampleLuminance(cx / w, cy / h);
  const light = lum > 148;
  const crossFg = light ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.85)";
  const crossSh = light ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
  const ringColor = light ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.55)";
  const CL = 10;

  ctx.save();
  ctx.beginPath();
  ctx.arc(lx, ly, LOUPE_R, 0, Math.PI * 2);
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(lx - CL, ly);
  ctx.lineTo(lx + CL, ly);
  ctx.moveTo(lx, ly - CL);
  ctx.lineTo(lx, ly + CL);
  ctx.strokeStyle = crossSh;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.strokeStyle = crossFg;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function draw() {
  if (!img) return;
  const w = cw(),
    h = ch(),
    d = dpr();
  const rect = getCurrentRect();
  if (!rect) return;

  ctx.clearRect(0, 0, w * d, h * d);
  ctx.save();
  ctx.scale(d, d);
  ctx.drawImage(
    img,
    rect.x0 * img.naturalWidth,
    rect.y0 * img.naturalHeight,
    (rect.x1 - rect.x0) * img.naturalWidth,
    (rect.y1 - rect.y0) * img.naturalHeight,
    0,
    0,
    w,
    h
  );

  pins.forEach((p, i) => {
    const dp = imgToDisplay(p.x, p.y, rect);
    const inFrame = isInFrame(dp);
    const cp = normToCanvas(
      Math.max(0, Math.min(1, dp.x)),
      Math.max(0, Math.min(1, dp.y))
    );
    drawPin(cp.x, cp.y, i + 1, dragging === i, !inFrame);
  });

  if (mouseNorm) {
    const cl = clampNorm(mouseNorm);
    const { x, y } = normToCanvas(cl.x, cl.y);
    drawLoupe(x, y);
  }
  ctx.restore();
}

function loadImage(file) {
  const url = URL.createObjectURL(file);
  const tmp = new Image();
  tmp.onerror = () => {
    URL.revokeObjectURL(url);
    imgHint.textContent = "error loading image";
  };
  tmp.onload = () => {
    URL.revokeObjectURL(url);
    img = tmp;
    invalidateLayout();
    updateCanvasAspect();
    cv.classList.add("visible");
    dropZone.style.display = "none";
    canvasOuter.classList.add("active");
    canvasWrap.classList.add("has-image");
    canvasWrap.style.cursor = "crosshair";
    viewToggle.style.display = "";
    changeBtn.style.display = "";
    imgHint.textContent = pins.length
      ? `${pins.length} pin${pins.length > 1 ? "s" : ""} retained`
      : "";
    requestAnimationFrame(() => {
      resize();
      draw();
      renderList();
    });
  };
  tmp.src = url;
}

function setView(v) {
  currentView = v;
  viewABtn.classList.toggle("on", v === "a");
  viewBBtn.classList.toggle("on", v === "b");
  updateLabels();
  if (img) {
    updateCanvasAspect();
    requestAnimationFrame(() => {
      resize();
      draw();
    });
  }
}

function updateLabels() {
  const ra = ratioAEl.value.trim() || "16/9";
  const rb = ratioBEl.value.trim() || "3/4";
  const la = labelAEl.value.trim() || "a";
  const lb = labelBEl.value.trim() || "b";
  viewABtn.textContent = `${la} · ${ra}`;
  viewBBtn.textContent = `${lb} · ${rb}`;
  const rects = getRects();
  wscaleHint.textContent = rects
    ? `size scale ×${rects.wScale.toFixed(3)}`
    : "";
}

function setPosGrid(crop, x, y) {
  const grid = document.getElementById(`pos_grid_${crop}`);
  grid.querySelectorAll(".pos-btn").forEach((btn) => {
    btn.classList.toggle(
      "on",
      parseFloat(btn.dataset.x) === x && parseFloat(btn.dataset.y) === y
    );
  });
}

document.querySelectorAll(".pos-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const crop = btn.dataset.crop;
    const x = parseFloat(btn.dataset.x);
    const y = parseFloat(btn.dataset.y);
    if (crop === "a") {
      posA.x = x;
      posA.y = y;
    } else {
      posB.x = x;
      posB.y = y;
    }
    invalidateLayout();
    setPosGrid(crop, x, y);
    updateLabels();
    if (img) {
      requestAnimationFrame(() => {
        resize();
        draw();
        renderList();
      });
    }
  });
});

viewABtn.addEventListener("click", () => setView("a"));
viewBBtn.addEventListener("click", () => setView("b"));

[ratioAEl, ratioBEl, labelAEl, labelBEl].forEach((el) => {
  el.addEventListener("input", () => {
    if (el === ratioAEl || el === ratioBEl) invalidateLayout();
    updateLabels();
    if (img) {
      updateCanvasAspect();
      requestAnimationFrame(() => {
        resize();
        draw();
        renderList();
      });
    }
  });
  el.addEventListener("blur", () => {
    if ((el === ratioAEl || el === ratioBEl) && !parseRatio(el.value))
      el.classList.add("invalid");
    else el.classList.remove("invalid");
  });
  el.addEventListener("focus", () => el.classList.remove("invalid"));
});

imgInput.addEventListener("change", (e) => {
  const f = e.target.files?.[0];
  if (f) loadImage(f);
  imgInput.value = "";
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () =>
  dropZone.classList.remove("drag-over")
);
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  const f = e.dataTransfer.files?.[0];
  if (f?.type.startsWith("image/")) loadImage(f);
});

changeBtn.addEventListener("click", () => imgInput.click());

clearAllBtn?.addEventListener("click", () => {
  pins = [];
  draw();
  renderList();
});

canvasOuter.addEventListener("pointerdown", (e) => {
  if (!img) return;
  const n = eventNorm(e);
  const ki = nearestPin(n.x, n.y);
  if (ki !== null) {
    dragging = ki;
    pendingAdd = false;
    canvasOuter.setPointerCapture(e.pointerId);
    canvasWrap.style.cursor = "grabbing";
  } else {
    pendingAdd = true;
    downPos = { ...n };
  }
  e.preventDefault();
});

canvasOuter.addEventListener("pointermove", (e) => {
  if (!img) return;
  const n = eventNorm(e);
  mouseNorm = n;
  if (dragging !== null) {
    const rect = getCurrentRect();
    if (rect)
      pins[dragging] = {
        ...displayToImg(clampNorm(n).x, clampNorm(n).y, rect),
        size: pins[dragging].size
      };
    requestRender();
    return;
  }
  if (pendingAdd && downPos) {
    const dx = n.x - downPos.x,
      dy = n.y - downPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > TAP_DIST) pendingAdd = false;
  }
  canvasWrap.style.cursor =
    nearestPin(n.x, n.y) !== null ? "grab" : "crosshair";
  requestRender();
});

function endInteraction(e, commit) {
  if (!img) return;
  if (dragging !== null) {
    if (commit) {
      const n = clampNorm(eventNorm(e));
      const rect = getCurrentRect();
      if (rect)
        pins[dragging] = {
          ...displayToImg(n.x, n.y, rect),
          size: pins[dragging].size
        };
    }
    dragging = null;
    if (canvasOuter.hasPointerCapture?.(e.pointerId))
      canvasOuter.releasePointerCapture(e.pointerId);
    canvasWrap.style.cursor = "crosshair";
    draw();
    renderList();
    return;
  }
  if (commit && pendingAdd && downPos) {
    const n = clampNorm(eventNorm(e));
    const rect = getCurrentRect();
    const dx = n.x - downPos.x,
      dy = n.y - downPos.y;
    if (
      rect &&
      Math.sqrt(dx * dx + dy * dy) < TAP_DIST &&
      nearestPin(n.x, n.y) === null
    ) {
      pins.push({ ...displayToImg(n.x, n.y, rect), size: SIZE_DEF });
      draw();
      renderList();
    }
  }
  pendingAdd = false;
  downPos = null;
}

canvasOuter.addEventListener("pointerup", (e) => endInteraction(e, true));
canvasOuter.addEventListener("pointercancel", (e) => endInteraction(e, false));

canvasOuter.addEventListener("pointerleave", () => {
  if (dragging !== null) return;
  mouseNorm = null;
  canvasWrap.style.cursor = "crosshair";
  requestRender();
});

function fmt(v) {
  return (v * 100).toFixed(1);
}
function fmtPct(v) {
  return fmt(v) + "%";
}
function fmtSize(v) {
  return v.toFixed(1) + "%";
}

function getPinData(p) {
  const rects = getRects();
  if (!rects) return null;
  const da = imgToDisplay(p.x, p.y, rects.rectA);
  const db = imgToDisplay(p.x, p.y, rects.rectB);
  return {
    a: da,
    aIn: isInFrame(da),
    b: db,
    bIn: isInFrame(db),
    sizeA: p.size,
    sizeB: +(p.size * rects.wScale).toFixed(2)
  };
}

function renderList() {
  const hasPins = pins.length > 0;
  copyBtn.style.display = hasPins ? "" : "none";
  clearAllBtn.style.display = hasPins ? "" : "none";

  if (!hasPins) {
    pinList.innerHTML = '<div class="empty-hint">no pins placed</div>';
    wscaleHint.textContent = "";
    if (img) imgHint.textContent = "";
    return;
  }
  updateLabels();
  const la = labelAEl.value.trim() || "a";
  const lb = labelBEl.value.trim() || "b";
  pinList.innerHTML = "";

  pins.forEach((p, i) => {
    const c = getPinData(p);
    const div = document.createElement("div");
    div.className = "pin-entry";

    const aCoord = c
      ? c.aIn
        ? `${fmtPct(c.a.x)} ${fmtPct(c.a.y)}`
        : `${fmtPct(c.a.x)} ${fmtPct(
            c.a.y
          )} <span class="pin-coord-out">out</span>`
      : "—";
    const bCoord = c
      ? c.bIn
        ? `${fmtPct(c.b.x)} ${fmtPct(c.b.y)}`
        : `${fmtPct(c.b.x)} ${fmtPct(
            c.b.y
          )} <span class="pin-coord-out">out</span>`
      : "—";

    div.innerHTML = `
      <div class="pin-entry-head">
        <div class="pin-dot">${i + 1}</div>
        <div class="pin-coords-block">
          <div class="pin-coord-line${c && !c.aIn ? " out" : ""}">
            <span class="pin-coord-label">${la}</span>${aCoord}
          </div>
          <div class="pin-coord-line${c && !c.bIn ? " out" : ""}">
            <span class="pin-coord-label">${lb}</span>${bCoord}
          </div>
        </div>
        <button class="btn-remove" aria-label="remove pin ${i + 1}">×</button>
      </div>
      <div class="pin-size-row">
        <div class="pin-size-field">
          <span class="pin-size-label">size ${la}</span>
          <input type="text" class="pin-size-input" value="${p.size.toFixed(
            1
          )}" data-idx="${i}">
        </div>
        <div class="pin-size-field">
          <span class="pin-size-label">size ${lb}</span>
          <div class="pin-size-computed">${c ? fmtSize(c.sizeB) : "—"}</div>
        </div>
      </div>
    `;

    div.querySelector(".btn-remove").addEventListener("click", () => {
      pins.splice(i, 1);
      canvasWrap.style.cursor = "crosshair";
      draw();
      renderList();
    });

    const sizeInput = div.querySelector(".pin-size-input");
    sizeInput.addEventListener("focus", () => sizeInput.select());
    sizeInput.addEventListener("change", (ev) => {
      const v = parseFloat(ev.target.value);
      if (isFinite(v) && v > 0) {
        pins[i].size = v;
        ev.target.value = v.toFixed(1);
        ev.target.classList.remove("invalid");
        renderList();
      } else {
        ev.target.classList.add("invalid");
      }
    });

    pinList.appendChild(div);
  });
}

function posLabel(p) {
  const h = { 0: "left", 0.5: "center", 1: "right" };
  const v = { 0: "top", 0.5: "center", 1: "bottom" };
  const hs = h[p.x] ?? String(p.x);
  const vs = v[p.y] ?? String(p.y);
  return hs === "center" && vs === "center" ? "center" : `${vs}-${hs}`;
}

function buildJSON() {
  const la = labelAEl.value.trim() || "a";
  const lb_raw = labelBEl.value.trim() || "b";
  const lb = lb_raw === la ? lb_raw + "_b" : lb_raw;
  return {
    crops: {
      [la]: { ratio: ratioAEl.value.trim() || "16/9", anchor: posLabel(posA) },
      [lb]: { ratio: ratioBEl.value.trim() || "3/4", anchor: posLabel(posB) }
    },
    pins: pins.map((p, i) => {
      const c = getPinData(p);
      const pin = { id: i + 1 };
      if (c) {
        pin[la] = c.aIn
          ? { x: +fmt(c.a.x), y: +fmt(c.a.y), size: c.sizeA }
          : null;
        pin[lb] = c.bIn
          ? { x: +fmt(c.b.x), y: +fmt(c.b.y), size: +c.sizeB.toFixed(2) }
          : null;
      }
      return pin;
    })
  };
}

copyBtn.addEventListener("click", () => {
  if (!pins.length) return;
  const prev = copyBtn.textContent;
  let copyTimer;
  navigator.clipboard
    ?.writeText(JSON.stringify(buildJSON(), null, 2))
    .then(() => {
      copyBtn.textContent = "copied!";
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copyBtn.textContent = prev), 1400);
    })
    .catch(() => {});
});

updateLabels();
