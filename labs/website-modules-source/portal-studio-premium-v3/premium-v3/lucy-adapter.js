const DECART_SDK_URL = "https://esm.sh/@decartai/sdk@0.1.17";
const $ = (id) => document.getElementById(id);
const frame = $("studio");
const lucyVideo = $("lucyVideo");
const bridgeCanvas = $("bridgeCanvas");
const bridgeCtx = bridgeCanvas.getContext("2d", { alpha: false });

const EFFECTS = {
  movie3d: "Change the style of the video to a 3D animated movie: stylized CGI animation, the person as an animated character with expressive big eyes and smooth skin, soft cinematic lighting.",
  anime: "Change the style of the video to hand-drawn anime: clean black line art, flat cel shading, vibrant colors, large expressive eyes.",
  cyberpunk: "Change the style of the video to neon cyberpunk: glowing pink and cyan neon light on the person and walls, rain-slick reflective surfaces, holographic signs in the background.",
  watercolor: "Change the style of the video to a watercolor painting: soft loose brushstrokes, gentle color bleeds, visible paper texture, muted pastel palette.",
  lego: "Change the style of the video to a LEGO stop-motion animation: the person is a yellow LEGO minifigure with a cylindrical head, painted face, and claw hands, and the room is built entirely from glossy plastic LEGO bricks with visible round studs on every surface."
};

let studioWin = null;
let studioDoc = null;
let inputVideo = null;
let cameraStream = null;
let lucyStream = null;
let bridgeStream = null;
let realtimeClient = null;
let sourceMode = "ai";
let bridgeRaf = 0;
let connecting = false;
let reconnectTimer = null;
let reconnectAttempt = 0;
let userDisconnected = false;

function setState(state, text = state.toUpperCase()) {
  const el = $("aiState");
  el.textContent = text;
  el.className = `state ${state}`;
  $("lucyState").textContent = text;
}
function message(text) { $("aiMessage").textContent = text; }
function currentPrompt() {
  const style = $("styleSelect").value;
  if (style === "custom") return $("customPrompt").value.trim() || "Change the style of the video to a cinematic surreal alternate world.";
  return EFFECTS[style] || EFFECTS.movie3d;
}
function saveKey() {
  const key = $("apiKey").value.trim();
  localStorage.removeItem("portal-v3-decart-key");
  sessionStorage.removeItem("portal-v3-decart-key");
  if (key) ($("rememberKey").checked ? localStorage : sessionStorage).setItem("portal-v3-decart-key", key);
  return key;
}
function restorePrefs() {
  const key = localStorage.getItem("portal-v3-decart-key") || sessionStorage.getItem("portal-v3-decart-key") || "";
  $("apiKey").value = key;
  $("rememberKey").checked = !!localStorage.getItem("portal-v3-decart-key");
  const custom = localStorage.getItem("portal-v3-custom-prompt") || "";
  $("customPrompt").value = custom;
  const style = localStorage.getItem("portal-v3-style") || "movie3d";
  $("styleSelect").value = style;
  $("customBox").classList.toggle("hidden", style !== "custom");
}

function resolveStudio() {
  studioWin = frame.contentWindow;
  studioDoc = frame.contentDocument;
  inputVideo = studioDoc?.getElementById("inputVideo") || null;
  cameraStream = inputVideo?.srcObject || null;
  const ready = !!(studioWin?.FingerFrameV211 && cameraStream?.getVideoTracks?.().length);
  $("cameraState").textContent = ready ? "LIVE" : "WAITING";
  return ready;
}

function ensureBridge() {
  if (!resolveStudio()) throw new Error("Start the camera in Portal Studio first.");
  const w = inputVideo.videoWidth || 1280;
  const h = inputVideo.videoHeight || 720;
  if (bridgeCanvas.width !== w || bridgeCanvas.height !== h) {
    bridgeCanvas.width = w;
    bridgeCanvas.height = h;
  }
  if (!bridgeStream) {
    bridgeStream = bridgeCanvas.captureStream(30);
    studioWin.FingerFrameV211.setRemoteStream(bridgeStream, { owned: false });
  }
  if (!bridgeRaf) bridgeRaf = requestAnimationFrame(drawBridge);
}

function drawMirroredVideo(video, dx, dy, dw, dh) {
  if (!video || video.readyState < 2) return false;
  bridgeCtx.save();
  bridgeCtx.translate(dx + dw, dy);
  bridgeCtx.scale(-1, 1);
  bridgeCtx.drawImage(video, 0, 0, dw, dh);
  bridgeCtx.restore();
  return true;
}

function drawBridge() {
  bridgeRaf = requestAnimationFrame(drawBridge);
  if (!inputVideo || inputVideo.readyState < 2) {
    resolveStudio();
    return;
  }
  const w = bridgeCanvas.width, h = bridgeCanvas.height;
  bridgeCtx.fillStyle = "#000";
  bridgeCtx.fillRect(0, 0, w, h);

  if (sourceMode === "original") {
    drawMirroredVideo(inputVideo, 0, 0, w, h);
  } else if (sourceMode === "split") {
    drawMirroredVideo(inputVideo, 0, 0, w / 2, h);
    const aiOk = drawMirroredVideo(lucyVideo, w / 2, 0, w / 2, h);
    if (!aiOk) drawMirroredVideo(inputVideo, w / 2, 0, w / 2, h);
    bridgeCtx.save();
    bridgeCtx.fillStyle = "rgba(255,255,255,.72)";
    bridgeCtx.fillRect(w / 2 - 1, 0, 2, h);
    bridgeCtx.restore();
  } else {
    const aiOk = drawMirroredVideo(lucyVideo, 0, 0, w, h);
    if (!aiOk) drawMirroredVideo(inputVideo, 0, 0, w, h);
  }
}

async function pushPrompt() {
  if (!realtimeClient || !lucyStream) {
    message("Lucy is not live yet.");
    return;
  }
  const prompt = currentPrompt();
  localStorage.setItem("portal-v3-style", $("styleSelect").value);
  localStorage.setItem("portal-v3-custom-prompt", $("customPrompt").value);
  try {
    try {
      await realtimeClient.set({ prompt, enhance: true });
    } catch {
      await realtimeClient.set({ prompt: { text: prompt }, enhance: true });
    }
    message("Live style updated without reconnecting.");
  } catch (err) {
    message(`Prompt update failed: ${(err?.message || err).toString().slice(0, 100)}`);
  }
}

function scheduleReconnect(reason) {
  if (userDisconnected || reconnectTimer) return;
  reconnectAttempt += 1;
  const delay = Math.min(30000, Math.round(2500 * Math.pow(1.65, reconnectAttempt - 1)));
  setState("connecting", `RETRY ${Math.ceil(delay / 1000)}s`);
  message(`${reason} Reconnecting automatically…`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectLucy(true);
  }, delay);
}

async function connectLucy(isRetry = false) {
  if (connecting) return;
  if (!resolveStudio()) {
    setState("error", "CAMERA FIRST");
    message("Start the camera in Portal Studio, then press CONNECT AI.");
    return;
  }
  const apiKey = saveKey();
  if (!apiKey) {
    setState("error", "KEY REQUIRED");
    message("Add a Decart API key first.");
    return;
  }
  connecting = true;
  userDisconnected = false;
  setState("connecting", isRetry ? "RECONNECTING" : "CONNECTING");
  message("Opening Lucy 2.5 realtime session…");
  try {
    await disconnectClientOnly();
    ensureBridge();
    const { createDecartClient, models } = await import(DECART_SDK_URL);
    const client = createDecartClient({ apiKey });
    const model = models.realtime("lucy-2.5");
    const videoOnly = new MediaStream(cameraStream.getVideoTracks());
    realtimeClient = await client.realtime.connect(videoOnly, {
      model,
      initialState: { prompt: { text: currentPrompt(), enhance: true } },
      onRemoteStream: async (stream) => {
        lucyStream = stream;
        lucyVideo.srcObject = stream;
        lucyVideo.muted = true;
        await lucyVideo.play().catch(() => {});
        reconnectAttempt = 0;
        setState("live", "LIVE");
        $("remoteState").textContent = `${stream.getVideoTracks().length} VIDEO TRACK`;
        message("Lucy is live. Open the portal to reveal the AI world.");
        ensureBridge();
      }
    });
    realtimeClient?.addEventListener?.("close", () => scheduleReconnect("Lucy session closed."));
  } catch (err) {
    console.error("Lucy connection failed", err);
    setState("error", "AI OFFLINE");
    $("remoteState").textContent = "NO STREAM";
    scheduleReconnect((err?.message || "Connection failed").toString().slice(0, 90));
  } finally {
    connecting = false;
  }
}

async function disconnectClientOnly() {
  try { await realtimeClient?.disconnect?.(); } catch {}
  try { realtimeClient?.close?.(); } catch {}
  realtimeClient = null;
  lucyStream = null;
  lucyVideo.pause();
  lucyVideo.srcObject = null;
  $("remoteState").textContent = "NO STREAM";
}

async function disconnectLucy() {
  userDisconnected = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  reconnectAttempt = 0;
  await disconnectClientOnly();
  setState("off", "OFFLINE");
  message("Lucy disconnected. Original media mode remains available.");
}

function setSource(mode) {
  sourceMode = mode;
  document.querySelectorAll("[data-source]").forEach((b) => b.classList.toggle("active", b.dataset.source === mode));
  $("outputSource").textContent = mode.toUpperCase();
  try { ensureBridge(); } catch {}
  if (mode === "ai" && !lucyStream) message("AI mode selected. Until Lucy is live, the portal falls back to the original camera feed.");
  if (mode === "split") message("Split mode: original on the left, Lucy AI on the right.");
  if (mode === "original") message("Original camera feed is now used as portal content.");
}

function wire() {
  restorePrefs();
  $("connectLucy").onclick = () => connectLucy(false);
  $("disconnectLucy").onclick = disconnectLucy;
  $("pushPrompt").onclick = pushPrompt;
  $("styleSelect").onchange = () => {
    const custom = $("styleSelect").value === "custom";
    $("customBox").classList.toggle("hidden", !custom);
    localStorage.setItem("portal-v3-style", $("styleSelect").value);
    if (lucyStream) pushPrompt();
  };
  $("customPrompt").onchange = () => localStorage.setItem("portal-v3-custom-prompt", $("customPrompt").value);
  document.querySelectorAll("[data-source]").forEach((b) => b.onclick = () => setSource(b.dataset.source));
  $("collapseDock").onclick = () => { $("aiDock").classList.add("hidden"); $("showDock").classList.remove("hidden"); };
  $("showDock").onclick = () => { $("aiDock").classList.remove("hidden"); $("showDock").classList.add("hidden"); };
  frame.addEventListener("load", () => {
    setTimeout(() => {
      resolveStudio();
      message("Portal Studio ready. Start camera, then connect Lucy.");
    }, 500);
  });
  window.addEventListener("beforeunload", () => { userDisconnected = true; realtimeClient?.disconnect?.(); });
}

window.PortalStudioV3 = {
  connectLucy,
  disconnectLucy,
  setSource,
  pushPrompt,
  getState: () => ({ sourceMode, connecting, lucyLive: !!lucyStream, cameraLive: !!cameraStream })
};
wire();
setState("off", "OFFLINE");