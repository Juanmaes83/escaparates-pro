//import { Pane, FolderApi } from "https://esm.sh/tweakpane@4.0.4";
import { Pane, FolderApi } from "https://esm.sh/tweakpane@4.0.4";
const TweakpaneUtils = {
    appendToFolderContent(folder, elements) {
        const checkAndAppend = () => {
            const folderContent = folder.element.querySelector(".tp-fldv_c");
            if (!folderContent) return false;

            (Array.isArray(elements) ? elements : [elements]).forEach((el) => {
                if (!folderContent.contains(el)) {
                    folderContent.appendChild(el);
                }
            });

            return true;
        };

        if (checkAndAppend()) return;

        const observer = new MutationObserver(() => {
            if (checkAndAppend()) {
                observer.disconnect();
            }
        });

        observer.observe(folder.element, { childList: true, subtree: true });
    },

    appendToRootPaneContent(pane, elements) {
        const checkAndAppend = () => {
            const rootContent = pane.element.querySelector(".tp-rotv_c");
            if (!rootContent) return false;

            (Array.isArray(elements) ? elements : [elements]).forEach((el) => {
                if (!rootContent.contains(el)) {
                    rootContent.appendChild(el);
                }
            });

            return true;
        };

        if (checkAndAppend()) return;

        const observer = new MutationObserver(() => {
            if (checkAndAppend()) {
                observer.disconnect();
            }
        });

        observer.observe(pane.element, { childList: true, subtree: true });
    },

    enableAccordion(pane, targetTitles = null, defaultOpen = null) {
        const folders = new Map();

        function isTarget(folder) {
            return !targetTitles || targetTitles.length === 0 || targetTitles.includes(folder.title);
        }

        function registerFolder(folder) {
            if (!(folder instanceof FolderApi)) return;
            if (!isTarget(folder)) return;

            folders.set(folder.title, folder);

            const observer = new MutationObserver(() => {
                if (folder.expanded) {
                    folders.forEach((f) => {
                        if (f !== folder) f.expanded = false;
                    });
                }
            });

            observer.observe(folder.element, {
                attributes: true,
                attributeFilter: ["class"]
            });

            folder.__observer = observer;
        }

        pane.children
            .filter((child) => child instanceof FolderApi)
            .forEach(registerFolder);

        pane.on("folder:add", (folder) => {
            registerFolder(folder);
        });

        folders.forEach((folder, title) => {
            folder.expanded = title === defaultOpen;
        });
    },

    addDemoImages(pane, onImageLoad, options = {}) {
        const {
            baseURL = "https://www.lessrain.com/dev/images/lr-demo-img-",
                totalImages = 370,
                thumbnailClass = "tp-demo-thumbnails",
                folderOptions = { title: "Demo Images" },
                thumbnailExtensions = ["png"],
                imageExtensions = ["jpg", "webp", "png"],
                onThumbnailClick = null,
                ordered = false,
                startIndex = 1,
        } = options;

        const demoFolder = pane.addFolder(folderOptions);
        const thumbnailContainer = document.createElement("div");
        thumbnailContainer.classList.add(thumbnailClass);

        let demoImageIds = [];
        let orderedOffset = ordered ? (startIndex - 1) % totalImages : 0;
        let hasInitialized = false;

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        async function tryImageExtensions(baseUrl, extensions) {
            for (const ext of extensions) {
                const url = `${baseUrl}.${ext}`;
                const img = new Image();
                img.src = url;
                img.crossOrigin = "Anonymous";

                const isValid = await new Promise((resolve) => {
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                });

                if (isValid) return url;
            }
            return null;
        }

        function generateThumbnails() {
            while (thumbnailContainer.firstChild) {
                const child = thumbnailContainer.firstChild;
                const img = child.querySelector("img");
                if (img) img.src = "";
                thumbnailContainer.removeChild(child);
            }

            const allImageIds = Array.from({ length: totalImages }, (_, i) => i + 1);
            const maxThumbnails = Math.min(20, totalImages);

            if (ordered) {
                const slice = [];
                for (let i = 0; i < maxThumbnails; i++) {
                    const id = allImageIds[(orderedOffset + i) % allImageIds.length];
                    slice.push(id);
                }
                orderedOffset = (orderedOffset + maxThumbnails) % allImageIds.length;
                demoImageIds = slice;
            } else {
                shuffleArray(allImageIds);

                if (!hasInitialized) {
                    const startId = ((startIndex - 1) % totalImages) + 1;
                    const rest = allImageIds.filter((id) => id !== startId);
                    demoImageIds = [startId, ...rest.slice(0, maxThumbnails - 1)];
                    hasInitialized = true;
                } else {
                    demoImageIds = allImageIds.slice(0, maxThumbnails);
                }
            }

            for (let i = 0; i < demoImageIds.length; i++) {
                const thumbnailWrapper = document.createElement("div");
                thumbnailWrapper.classList.add("tp-demo-thumbnail");

                const thumbnailImg = document.createElement("img");
                thumbnailWrapper.appendChild(thumbnailImg);
                thumbnailContainer.appendChild(thumbnailWrapper);
            }

            Array.from(thumbnailContainer.children).forEach(async (thumbnailWrapper, index) => {
                const id = demoImageIds[index];
                const name = `Image ${id}`;
                const baseUrl = `${baseURL}${id}`;
                const thumbnailUrl = await tryImageExtensions(`${baseUrl}-thumb`, thumbnailExtensions);

                if (!thumbnailUrl) return;

                const thumbnailImg = thumbnailWrapper.querySelector("img");
                thumbnailImg.src = thumbnailUrl;
                thumbnailImg.alt = name;

                thumbnailWrapper.addEventListener("click", async () => {
                    if (typeof onThumbnailClick === "function") {
                        onThumbnailClick(name, baseUrl);
                    }

                    const imageUrl = await tryImageExtensions(baseUrl, imageExtensions);
                    if (imageUrl) {
                        onImageLoad(imageUrl);
                    } else {
                        console.error(`Failed to load image: ${baseUrl}`);
                    }
                });
            });
        }

        function getImageList() {
            return demoImageIds.map((id) => `${baseURL}${id}`);
        }

        function loadImageIndex(index) {
            if (demoImageIds.length === 0) {
                console.warn("No images loaded yet.");
                return;
            }

            const safeIndex = ((index % demoImageIds.length) + demoImageIds.length) % demoImageIds.length;
            const baseUrl = `${baseURL}${demoImageIds[safeIndex]}`;

            tryImageExtensions(baseUrl, imageExtensions).then((imageUrl) => {
                if (imageUrl) {
                    onImageLoad(imageUrl);
                } else {
                    console.error(`Failed to load image: ${baseUrl}`);
                }
            });
        }

        function loadRandomImage() {
            if (demoImageIds.length === 0) {
                console.warn("No images loaded yet.");
                return;
            }

            const randomIndex = Math.floor(Math.random() * demoImageIds.length);
            loadImageIndex(randomIndex);
        }

        //demoFolder.addButton({ title: "Refresh Thumbnails" }).on("click", generateThumbnails);
        generateThumbnails();

        TweakpaneUtils.appendToFolderContent(demoFolder, thumbnailContainer);

        return {
            folder: demoFolder,
            getImageList,
            loadImageIndex,
            loadRandomImage
        };
    },

    setEnabled(pane, isEnabled) {
        pane.children.forEach((control) => {
            if (control.disabled !== undefined) {
                control.disabled = !isEnabled;
            }
        });

        pane.element.querySelectorAll(".tp-fldv, .tp-fldv_c").forEach((folder) => {
            folder.style.pointerEvents = isEnabled ? "auto" : "none";
            folder.style.opacity = isEnabled ? "1" : "0.75";
        });

        pane.element.querySelectorAll("button").forEach((button) => {
            button.disabled = !isEnabled;
        });

        // Disable all inputs
        pane.element.querySelectorAll("input, select").forEach((input) => {
            input.disabled = !isEnabled;
        });
    },

    addPersistentMessage(container, label = undefined, options = {}) {
        const {
            initial = "",
                index = undefined,
                multiline = true,
                rows = 1,
        } = options;

        const proxy = { status: initial };

        const bindingOptions = {
            readonly: true,
            multiline,
            rows,
            index,
            label: label !== undefined ? label : "",
        };

        const statusBlade = container.addBinding(proxy, "status", bindingOptions);

        requestAnimationFrame(() => {
            const textareaEl = statusBlade.element.querySelector("textarea");

            if (textareaEl) {
                textareaEl.style.whiteSpace = "pre-wrap";
                textareaEl.style.overflow = "hidden";
                textareaEl.style.wordBreak = "break-word";
                textareaEl.style.resize = "none";

                // Fix for single-line height
                textareaEl.style.paddingTop = "4px";
                textareaEl.style.paddingBottom = "0px";
                textareaEl.style.lineHeight = "1.2";
                textareaEl.rows = 1;

                const resize = () => {
                    textareaEl.style.height = "0px";
                    textareaEl.style.minHeight = "20px";
                    textareaEl.style.maxHeight = "none";
                    textareaEl.style.height = `${textareaEl.scrollHeight}px`;
                };

                resize();

                statusBlade._resizeTextarea = resize;
            }

            if (label === undefined) {
                const labelContainer = statusBlade.element.querySelector(".tp-lblv_l");
                if (labelContainer) {
                    labelContainer.style.display = "none";
                    if (labelContainer.nextElementSibling) {
                        labelContainer.nextElementSibling.style.width = "100%";
                    }
                }
            }
        });

        return {
            set(text) {
                proxy.status = text;
                statusBlade.refresh();
                requestAnimationFrame(() => {
                    statusBlade._resizeTextarea?.();
                });
            },
            clear() {
                proxy.status = "";
                statusBlade.refresh();
                requestAnimationFrame(() => {
                    statusBlade._resizeTextarea?.();
                });
            },
            blade: statusBlade,
        };
    },

};

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("output");
    const ctx = canvas.getContext("2d");
    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d");
    const simplex = new SimplexNoise();

    const params = {
        amplitude: -0.185,//0.15
        frequency: 0.09,//0.08,
        noise:0.10,// 0.4,
        speed: 0.65,//1.6,
        overlay: true,
        overlayStyle: "lines", // lines | bars | dots | heatmap
        direction: "both",
        borderMode: "reflect",//"clamp",
        upload: () => fileInput.click()
    };

    let img; // = new window.Image();
    //img.crossOrigin = "anonymous";
    //img.src = "https://www.lessrain.com/dev/images-2025/squiggle/lr-squiggle-img-06-orig.webp";
    let imgNaturalWidth = 1,
        imgNaturalHeight = 1;
    let originalU32 = null;

    let cachedWidth = 0,
        cachedHeight = 0;
    let cachedOutput = null,
        cachedTemp = null;
    let cachedOutputU32 = null,
        cachedTempU32 = null;

    let rowOffsets = null,
        rowSquiggles = null;
    let colOffsets = null,
        colSquiggles = null;

    let basePhase = 0;
    let lastUpdateTime = performance.now();
    let lastSpeed = params.speed;

    let frameCounter = 0;

    let manualDirty = true;
    let isDrawingBitmap = false;

    function getCssVarNumber(el, name, fallback = 0) {
        let val = getComputedStyle(el).getPropertyValue(name).trim();
        if (!val) return fallback;
        let num = parseFloat(val);
        if (isNaN(num)) return fallback;
        if (val.endsWith("px")) return num;
        if (val.endsWith("rem")) return num * parseFloat(getComputedStyle(document.documentElement).fontSize);
        if (val.endsWith("vw")) return (num / 100) * window.innerWidth;
        if (val.endsWith("vh")) return (num / 100) * window.innerHeight;
        return num;
    }

    const root = document.documentElement;

    const canvasOffset = getCssVarNumber(canvas, "--canvas-offset") || getCssVarNumber(root, "--canvas-offset", 64);
    const maxCanvasWidth = getCssVarNumber(canvas, "--max-canvas-width") || getCssVarNumber(root, "--max-canvas-width", 1024);
    const maxCanvasHeight = getCssVarNumber(canvas, "--max-canvas-height") || getCssVarNumber(root, "--max-canvas-height", 1024);

    //let imgDrawnOnce = false;
    let imgBitmap = null;

    let lastDisplayW = 0,
        lastDisplayH = 0;

    let resizePending = false;

    function resizeCanvasToImage(force = false) {
        if (!imgBitmap) return;

        resizePending = true;

        const imgW = imgNaturalWidth;
        const imgH = imgNaturalHeight;
        const boxW = Math.min(maxCanvasWidth, window.innerWidth) - canvasOffset;
        const boxH = Math.min(maxCanvasHeight, window.innerHeight) - canvasOffset;

        const baseScale = Math.min(boxW / imgW, boxH / imgH, 1);
        const maxPixels = 1024 * 1024;
        const maxAllowedScale = Math.min(1, Math.sqrt(maxPixels / (imgW * imgH)));
        const scale = Math.min(baseScale, maxAllowedScale);

        const displayW = Math.round(imgW * scale);
        const displayH = Math.round(imgH * scale);

        const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
        const targetW = Math.round(displayW * dpr);
        const targetH = Math.round(displayH * dpr);

        if (
            !force &&
            canvas.width === targetW &&
            canvas.height === targetH &&
            displayW === lastDisplayW &&
            displayH === lastDisplayH
        ) {
            resizePending = false;
            return;
        }

        lastDisplayW = displayW;
        lastDisplayH = displayH;

        canvas.width = targetW;
        canvas.height = targetH;
        canvas.style.width = `${displayW}px`;
        canvas.style.height = `${displayH}px`;

        offscreen.width = targetW;
        offscreen.height = targetH;

        offCtx.clearRect(0, 0, targetW, targetH);
        offCtx.imageSmoothingEnabled = true;
        offCtx.drawImage(imgBitmap, 0, 0, targetW, targetH);

        const originalData = offCtx.getImageData(0, 0, targetW, targetH);
        originalU32 = new Uint32Array(originalData.data.buffer);

        cachedWidth = 0;
        cachedHeight = 0;
        cachedOutput = null;
        cachedOutputU32 = null;
        rowOffsets = null;
        rowSquiggles = null;
        colOffsets = null;
        colSquiggles = null;

        resizePending = false;
    }

    function loadImageAndUpdateCanvas(imgSource, startAnimation = false) {
        if (!img) {
            startAnimation = true;
            img = new Image();
            img.crossOrigin = "anonymous";

        }
        img.src = imgSource;
        img.onload = () => {
            createImageBitmap(img).then((bitmap) => {
                imgBitmap = bitmap;
                imgNaturalWidth = bitmap.width;
                imgNaturalHeight = bitmap.height;

                cachedWidth = 0;
                cachedHeight = 0;
                originalU32 = null;
                manualDirty = true;

                resizeCanvasToImage(true);

                if (startAnimation) {
                    requestAnimationFrame(animate);
                }
            });
        };
    }

    const pane = new Pane({ title: "Squiggle Controls" });

    pane.addButton({ title: "Upload Image" }).on("click", params.upload);

    pane.addBinding(params, "amplitude", {
        min: -0.3,
        max: 0.3,
        step: 0.005,
        label: "Amplitude"
    }).on("change", () => { manualDirty = true; });

    pane.addBinding(params, "frequency", {
        min: -0.15,
        max: 0.15,
        step: 0.01,
        label: "Frequency"
    }).on("change", () => { manualDirty = true; });

    pane.addBinding(params, "noise", {
        min: 0,
        max: 1,
        step: 0.01,
        label: "Noise"
    }).on("change", () => { manualDirty = true; });

    pane.addBinding(params, "speed", {
        min: 0,
        max: 5,
        step: 0.01,
        label: "Animation Speed"
    }).on("change", () => { manualDirty = true; });

    pane.addBinding(params, "direction", {
        options: { Horizontal: "horizontal", Vertical: "vertical", Both: "both" },
        label: "Direction"
    }).on("change", () => { manualDirty = true; });

    pane.addBinding(params, "borderMode", {
        options: { Transparent: "transparent", Clamp: "clamp", Reflect: "reflect" },
        label: "Border Mode"
    }).on("change", () => { manualDirty = true; });

    const overlayFolder = pane.addFolder({
        title: "Overlay",
        expanded: true
    });

    const overlayBinding = overlayFolder.addBinding(params, "overlay", {
        label: "Show"
    }).on("change", () => {
        manualDirty = true;
        styleBinding.disabled = !params.overlay;
    });

    const styleBinding = overlayFolder.addBinding(params, "overlayStyle", {
        options: {
            Lines: "lines",
            Bars: "bars",
            Dots: "dots",
            Heatmap: "heatmap"
        },
        label: "Style",
        disabled: !params.overlay
    }).on("change", () => {
        manualDirty = true;
    });

    const demoImages = TweakpaneUtils.addDemoImages(
        pane,
        (loadedImage) => {
            loadImageAndUpdateCanvas(loadedImage, false);
            TweakpaneUtils.setEnabled(pane, true);
        }, {
            baseURL: "https://www.lessrain.com/dev/images-2025/squigglev2/lr-squiggle-img-",
            totalImages: 8,
            thumbnailClass: "tp-demo-thumbnails",
            thumbnailExtensions: ["png"],
            imageExtensions: ["webp"],
            folderOptions: { title: "Demo Images", expanded: true },
            ordered: true,
            startIndex: 1,
            onThumbnailClick: () => {
                TweakpaneUtils.setEnabled(pane, false);
            }
        }
    );

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            loadImageAndUpdateCanvas(evt.target.result, false); // Loop already running
        };
        reader.readAsDataURL(file);
    };

    function resolveIndex(index, size, borderMode) {
        if (borderMode === "repeat") {
            return (index + size) % size;
        }
        if (borderMode === "clamp") {
            return Math.max(0, Math.min(size - 1, index));
        }
        return (index >= 0 && index < size) ? index : null;
    }

    let prev = {
        amplitude: params.amplitude,
        frequency: params.frequency,
        noise: params.noise,
        direction: params.direction,
        borderMode: params.borderMode,
        overlay: params.overlay,
        width: 0,
        height: 0,
        phase: 0,
    };

    function isDirty(width, height, phase) {
        return (
            prev.width !== width ||
            prev.height !== height ||
            prev.amplitude !== params.amplitude ||
            prev.frequency !== params.frequency ||
            prev.noise !== params.noise ||
            prev.direction !== params.direction ||
            prev.borderMode !== params.borderMode ||
            prev.overlay !== params.overlay ||
            prev.phase !== phase
        );
    }

    let frameTimes = [];
    let heapLog = [];
    let lastHeap = 0;
    let gcDetected = false;

    /*if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'longtask') {
                    console.warn(`[LONG TASK] Duration: ${entry.duration.toFixed(2)}ms`);
                }
                if (entry.entryType === 'gc') {
                    console.warn(`[GC] Kind: ${entry.kind}, Duration: ${entry.duration.toFixed(2)}ms`);
                }
            }
        });

        try {
            observer.observe({ type: ['longtask', 'gc'], buffered: true });
        } catch (e) {
            observer.observe({ type: 'longtask', buffered: true });
        }
    }*/

    function logDiagnostics(now = performance.now()) {
        if (!logDiagnostics.last) logDiagnostics.last = now;
        const dt = (now - logDiagnostics.last) / 1000;
        logDiagnostics.last = now;

        if (dt > 0) {
            const fps = (1 / dt).toFixed(1);
            let heapInfo = '';

            if ('memory' in performance) {
                const mem = performance.memory;
                const used = (mem.usedJSHeapSize / 1048576).toFixed(1);
                const total = (mem.totalJSHeapSize / 1048576).toFixed(1);
                heapInfo = ` | Heap: ${used}/${total} MB`;
            }

            console.log(`FPS: ${fps}${heapInfo}`);
        }
    }

    let yStep = 1;
    let xStep = 1;
    let overlayStepY = 2;
    let overlayStepX = 2;
    const TWO_PI = 2 * Math.PI;

    const deformWorker = createDeformWorker();
    let workerBusy = false;

    function createDeformWorker() {
        const workerBlob = new Blob([`
            self.onmessage = function(e) {
                const { buffer, width, height, direction, borderMode, rowOffsets, colOffsets } = e.data;
                const inputU32 = new Uint32Array(buffer);
                const outputU32 = new Uint32Array(width * height);
                const w = width, h = height;
                const w1 = w - 1, h1 = h - 1;
                const w2 = 2 * w1, h2 = 2 * h1;

                const useClamp = borderMode === "clamp";
                const useReflect = borderMode === "reflect";
                const useTransparent = borderMode === "transparent";

                if (direction === "horizontal") {
                    for (let y = 0; y < h; y++) {
                        const offset = rowOffsets[y];
                        const rowStart = y * w;

                        let x = 0;
                        for (; x < w - 3; x += 4) {
                            const pos = rowStart + x;
                            processPixelBlock(x, offset, w1, w2, useClamp, useReflect, inputU32, outputU32, pos, rowStart);
                        }

                        for (; x < w; x++) {
                            const pos = rowStart + x;
                            let tx = x + offset;
                            if (useClamp) {
                                tx = tx < 0 ? 0 : tx > w1 ? w1 : tx;
                                outputU32[pos] = inputU32[rowStart + tx];
                            } else if (useReflect) {
                                tx = tx < 0 ? -tx : tx > w1 ? w2 - tx : tx;
                                outputU32[pos] = (tx < 0 || tx > w1) ? 0 : inputU32[rowStart + tx];
                            } else {
                                outputU32[pos] = (tx < 0 || tx > w1) ? 0 : inputU32[rowStart + tx];
                            }
                        }
                    }
                } else if (direction === "vertical") {
                    for (let x = 0; x < w; x++) {
                        const offset = colOffsets[x];
                        for (let y = 0; y < h; y++) {
                            const pos = y * w + x;
                            let ty = y + offset;
                            if (useClamp) {
                                ty = ty < 0 ? 0 : ty > h1 ? h1 : ty;
                            } else if (useReflect) {
                                ty = ty < 0 ? -ty : ty > h1 ? h2 - ty : ty;
                            }
                            outputU32[pos] = (ty < 0 || ty > h1) ? 0 : inputU32[ty * w + x];
                        }
                    }
                } else {
                    for (let y = 0; y < h; y++) {
                        const rowOffset = rowOffsets[y];
                        const rowStart = y * w;

                        let x = 0;
                        for (; x < w - 3; x += 4) {
                            const pos = rowStart + x;
                            const colOffset0 = colOffsets[x];
                            const colOffset1 = colOffsets[x + 1];
                            const colOffset2 = colOffsets[x + 2];
                            const colOffset3 = colOffsets[x + 3];

                            let tx0 = x + rowOffset, ty0 = y + colOffset0;
                            let tx1 = x + 1 + rowOffset, ty1 = y + colOffset1;
                            let tx2 = x + 2 + rowOffset, ty2 = y + colOffset2;
                            let tx3 = x + 3 + rowOffset, ty3 = y + colOffset3;

                            if (useClamp) {
                                tx0 = tx0 < 0 ? 0 : tx0 > w1 ? w1 : tx0;
                                ty0 = ty0 < 0 ? 0 : ty0 > h1 ? h1 : ty0;
                                tx1 = tx1 < 0 ? 0 : tx1 > w1 ? w1 : tx1;
                                ty1 = ty1 < 0 ? 0 : ty1 > h1 ? h1 : ty1;
                                tx2 = tx2 < 0 ? 0 : tx2 > w1 ? w1 : tx2;
                                ty2 = ty2 < 0 ? 0 : ty2 > h1 ? h1 : ty2;
                                tx3 = tx3 < 0 ? 0 : tx3 > w1 ? w1 : tx3;
                                ty3 = ty3 < 0 ? 0 : ty3 > h1 ? h1 : ty3;
                            } else if (useReflect) {
                                tx0 = tx0 < 0 ? -tx0 : tx0 > w1 ? w2 - tx0 : tx0;
                                ty0 = ty0 < 0 ? -ty0 : ty0 > h1 ? h2 - ty0 : ty0;
                                tx1 = tx1 < 0 ? -tx1 : tx1 > w1 ? w2 - tx1 : tx1;
                                ty1 = ty1 < 0 ? -ty1 : ty1 > h1 ? h2 - ty1 : ty1;
                                tx2 = tx2 < 0 ? -tx2 : tx2 > w1 ? w2 - tx2 : tx2;
                                ty2 = ty2 < 0 ? -ty2 : ty2 > h1 ? h2 - ty2 : ty2;
                                tx3 = tx3 < 0 ? -tx3 : tx3 > w1 ? w2 - tx3 : tx3;
                                ty3 = ty3 < 0 ? -ty3 : ty3 > h1 ? h2 - ty3 : ty3;
                            }

                            outputU32[pos]     = (tx0 < 0 || tx0 > w1 || ty0 < 0 || ty0 > h1) ? 0 : inputU32[ty0 * w + tx0];
                            outputU32[pos + 1] = (tx1 < 0 || tx1 > w1 || ty1 < 0 || ty1 > h1) ? 0 : inputU32[ty1 * w + tx1];
                            outputU32[pos + 2] = (tx2 < 0 || tx2 > w1 || ty2 < 0 || ty2 > h1) ? 0 : inputU32[ty2 * w + tx2];
                            outputU32[pos + 3] = (tx3 < 0 || tx3 > w1 || ty3 < 0 || ty3 > h1) ? 0 : inputU32[ty3 * w + tx3];
                        }

                        for (; x < w; x++) {
                            const colOffset = colOffsets[x];
                            let tx = x + rowOffset;
                            let ty = y + colOffset;

                            if (useClamp) {
                                tx = tx < 0 ? 0 : tx > w1 ? w1 : tx;
                                ty = ty < 0 ? 0 : ty > h1 ? h1 : ty;
                            } else if (useReflect) {
                                tx = tx < 0 ? -tx : tx > w1 ? w2 - tx : tx;
                                ty = ty < 0 ? -ty : ty > h1 ? h2 - ty : ty;
                            }

                            const idx = y * w + x;
                            outputU32[idx] = (tx < 0 || tx > w1 || ty < 0 || ty > h1) ? 0 : inputU32[ty * w + tx];
                        }
                    }
                }

                self.postMessage({ buffer: outputU32.buffer, width, height }, [outputU32.buffer]);
            };

            function processPixelBlock(x, offset, w1, w2, useClamp, useReflect, inputU32, outputU32, pos, rowStart) {
                let tx0 = x + offset;
                let tx1 = x + 1 + offset;
                let tx2 = x + 2 + offset;
                let tx3 = x + 3 + offset;

                if (useClamp) {
                    tx0 = tx0 < 0 ? 0 : tx0 > w1 ? w1 : tx0;
                    tx1 = tx1 < 0 ? 0 : tx1 > w1 ? w1 : tx1;
                    tx2 = tx2 < 0 ? 0 : tx2 > w1 ? w1 : tx2;
                    tx3 = tx3 < 0 ? 0 : tx3 > w1 ? w1 : tx3;

                    outputU32[pos]     = inputU32[rowStart + tx0];
                    outputU32[pos + 1] = inputU32[rowStart + tx1];
                    outputU32[pos + 2] = inputU32[rowStart + tx2];
                    outputU32[pos + 3] = inputU32[rowStart + tx3];
                } else if (useReflect) {
                    tx0 = tx0 < 0 ? -tx0 : tx0 > w1 ? w2 - tx0 : tx0;
                    tx1 = tx1 < 0 ? -tx1 : tx1 > w1 ? w2 - tx1 : tx1;
                    tx2 = tx2 < 0 ? -tx2 : tx2 > w1 ? w2 - tx2 : tx2;
                    tx3 = tx3 < 0 ? -tx3 : tx3 > w1 ? w2 - tx3 : tx3;

                    outputU32[pos]     = (tx0 < 0 || tx0 > w1) ? 0 : inputU32[rowStart + tx0];
                    outputU32[pos + 1] = (tx1 < 0 || tx1 > w1) ? 0 : inputU32[rowStart + tx1];
                    outputU32[pos + 2] = (tx2 < 0 || tx2 > w1) ? 0 : inputU32[rowStart + tx2];
                    outputU32[pos + 3] = (tx3 < 0 || tx3 > w1) ? 0 : inputU32[rowStart + tx3];
                } else {
                    outputU32[pos]     = (tx0 < 0 || tx0 > w1) ? 0 : inputU32[rowStart + tx0];
                    outputU32[pos + 1] = (tx1 < 0 || tx1 > w1) ? 0 : inputU32[rowStart + tx1];
                    outputU32[pos + 2] = (tx2 < 0 || tx2 > w1) ? 0 : inputU32[rowStart + tx2];
                    outputU32[pos + 3] = (tx3 < 0 || tx3 > w1) ? 0 : inputU32[rowStart + tx3];
                }
            }
        `], { type: "application/javascript" });

        return new Worker(URL.createObjectURL(workerBlob));
    }

    function animate() {
        if (
            canvas.width === 0 ||
            canvas.height === 0 ||
            !imgBitmap ||
            !originalU32 ||
            resizePending
        ) {
            requestAnimationFrame(animate);
            return;
        }

        //logDiagnostics();

        const width = canvas.width;
        const height = canvas.height;

        if (width !== cachedWidth || height !== cachedHeight) {
            cachedWidth = width;
            cachedHeight = height;

            cachedOutput = ctx.createImageData(width, height);
            cachedOutputU32 = new Uint32Array(cachedOutput.data.buffer);

            rowOffsets = new Int32Array(height);
            rowSquiggles = new Float32Array(height);
            colOffsets = new Int32Array(width);
            colSquiggles = new Float32Array(width);

            const h512 = (height / 512) | 0;
            const w512 = (width / 512) | 0;
            const h100 = height * 0.01;
            const w100 = width * 0.01;

            yStep = h512 > 1 ? h512 : 1;
            xStep = w512 > 1 ? w512 : 1;
            overlayStepY = h100 > 2 ? (h100 + 0.5) | 0 : 2;
            overlayStepX = w100 > 2 ? (w100 + 0.5) | 0 : 2;
        }

        const now = performance.now();
        const elapsed = (now - lastUpdateTime) / 1000;
        basePhase += elapsed * lastSpeed;
        lastUpdateTime = now;
        lastSpeed = params.speed;
        const phase = basePhase;

        const shouldRender = (++frameCounter % 3 === 0) && (manualDirty || isDirty(width, height, phase));
        if (!shouldRender) {
            requestAnimationFrame(animate);
            return;
        }

        manualDirty = false;

        const phaseFactor1 = phase * 0.07;
        const phaseFactor2 = phase * 0.13;
        const pxAmp = params.amplitude * height;

        const rowNoise = new Float32Array(height);
        const colNoise = new Float32Array(width);

        if (params.noise !== 0) {
            if (params.direction === "horizontal" || params.direction === "both") {
                for (let y = 0; y < height; y += yStep) {
                    const ny = y / height;
                    const noiseVal = simplex.noise3D(0, ny * 2, phaseFactor1) * 0.7 +
                        simplex.noise3D(15, ny * 10 - 3, phaseFactor2) * 0.3;
                    const limit = Math.min(y + yStep, height);
                    for (let i = y; i < limit; i++) rowNoise[i] = noiseVal;
                }
            }
            if (params.direction === "vertical" || params.direction === "both") {
                for (let x = 0; x < width; x += xStep) {
                    const nx = x / width;
                    const noiseVal = simplex.noise3D(0, nx * 2, phaseFactor1) * 0.7 +
                        simplex.noise3D(15, nx * 10 - 3, phaseFactor2) * 0.3;
                    const limit = Math.min(x + xStep, width);
                    for (let i = x; i < limit; i++) colNoise[i] = noiseVal;
                }
            }
        }

        let ny, nx, freq1, freq2, freq3;
        let mainWave, localCurl, n, raw, offset, limit;

        const useOverlay = params.overlay;

        if (params.direction === "horizontal" || params.direction === "both") {
            for (let y = 0; y < height; y += yStep) {
                ny = y / height;
                freq1 = params.frequency * TWO_PI * (ny * 2) + phase;
                freq2 = params.frequency * 7 * Math.PI * ny - phase * 1.2;
                freq3 = params.frequency * 8 * Math.PI * (ny * 4) - phase * 2;

                mainWave = Math.sin(freq1) + 0.5 * Math.cos(freq2);
                localCurl = Math.sin(freq3);
                n = rowNoise[y] || 0;

                raw = mainWave * 0.4 + localCurl * 0.2 + params.noise * n;
                offset = ((pxAmp * raw) + (raw >= 0 ? 0.5 : -0.5)) | 0;
                limit = Math.min(y + yStep, height);

                let i = y;
                for (; i + 3 < limit; i += 4) {
                    rowOffsets[i] = offset;
                    rowOffsets[i + 1] = offset;
                    rowOffsets[i + 2] = offset;
                    rowOffsets[i + 3] = offset;
                    if (useOverlay) {
                        rowSquiggles[i] = raw;
                        rowSquiggles[i + 1] = raw;
                        rowSquiggles[i + 2] = raw;
                        rowSquiggles[i + 3] = raw;
                    }
                }
                for (; i < limit; i++) {
                    rowOffsets[i] = offset;
                    if (useOverlay) rowSquiggles[i] = raw;
                }
            }
        }

        if (params.direction === "vertical" || params.direction === "both") {
            for (let x = 0; x < width; x += xStep) {
                nx = x / width;
                freq1 = params.frequency * TWO_PI * (nx * 2) + phase;
                freq2 = params.frequency * 7 * Math.PI * nx - phase * 1.2;
                freq3 = params.frequency * 8 * Math.PI * (nx * 4) - phase * 2;

                mainWave = Math.sin(freq1) + 0.5 * Math.cos(freq2);
                localCurl = Math.sin(freq3);
                n = colNoise[x] || 0;

                raw = mainWave * 0.4 + localCurl * 0.2 + params.noise * n;
                offset = ((pxAmp * raw) + (raw >= 0 ? 0.5 : -0.5)) | 0;
                limit = Math.min(x + xStep, width);

                let i = x;
                for (; i + 3 < limit; i += 4) {
                    colOffsets[i] = offset;
                    colOffsets[i + 1] = offset;
                    colOffsets[i + 2] = offset;
                    colOffsets[i + 3] = offset;
                    if (useOverlay) {
                        colSquiggles[i] = raw;
                        colSquiggles[i + 1] = raw;
                        colSquiggles[i + 2] = raw;
                        colSquiggles[i + 3] = raw;
                    }
                }
                for (; i < limit; i++) {
                    colOffsets[i] = offset;
                    if (useOverlay) colSquiggles[i] = raw;
                }
            }
        }

        if (workerBusy) {
            requestAnimationFrame(animate);
            return;
        }

        workerBusy = true;
        const bufferCopy = originalU32.slice().buffer;

        deformWorker.postMessage({
            buffer: bufferCopy,
            width,
            height,
            direction: params.direction,
            borderMode: params.borderMode,
            rowOffsets,
            colOffsets
        }, [bufferCopy]);

        deformWorker.onmessage = (e) => {
            const { buffer, width: w, height: h } = e.data;

            if (
                !cachedOutputU32 ||
                w !== canvas.width ||
                h !== canvas.height ||
                cachedOutputU32.length !== (w * h)
            ) {
                workerBusy = false;
                requestAnimationFrame(animate);
                return;
            }

            cachedOutputU32.set(new Uint32Array(buffer));
            ctx.putImageData(cachedOutput, 0, 0);
            workerBusy = false;

            if (params.overlay) {
                const scaleX = w / canvas.offsetWidth;
                const amp = params.amplitude * h;
                const drawMode = params.overlayStyle;

                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.lineWidth = 2 * scaleX;

                const midX = w >> 1;
                const midY = h >> 1;

                let v = 0,
                    px = 0,
                    py = 0,
                    barLen = 0,
                    intensity = 0;
                let x = 0,
                    y = 0;

                if (params.direction !== "vertical") {
                    switch (drawMode) {
                        case "lines": {
                            ctx.beginPath();
                            ctx.strokeStyle = "#bb1177";
                            let first = true;
                            for (y = 0; y < h; y += overlayStepY) {
                                v = rowSquiggles[y];
                                px = midX + v * amp;
                                if (first) {
                                    ctx.moveTo(px, y);
                                    first = false;
                                } else {
                                    ctx.lineTo(px, y);
                                }
                            }
                            ctx.stroke();
                            break;
                        }

                        case "bars": {
                            ctx.fillStyle = "#bb1177";
                            for (y = 0; y < h; y += overlayStepY) {
                                v = rowSquiggles[y];
                                barLen = v * amp;
                                ctx.fillRect(midX, y, barLen, overlayStepY / 1.5);
                            }
                            break;
                        }

                        case "dots": {
                            ctx.fillStyle = "#bb1177";
                            for (y = 0; y < h; y += overlayStepY) {
                                v = rowSquiggles[y];
                                px = midX + v * amp;
                                ctx.beginPath();
                                ctx.arc(px, y, 2 * scaleX, 0, TWO_PI);
                                ctx.fill();
                            }
                            break;
                        }

                        case "heatmap": {
                            const heatH = Math.max(2, overlayStepY);
                            for (y = 0; y < h; y += overlayStepY) {
                                v = Math.min(Math.max(rowSquiggles[y], -1), 1);
                                intensity = (v + 1) * 127.5 | 0;
                                ctx.fillStyle = `rgb(${intensity}, 0, ${255 - intensity})`;
                                ctx.fillRect(0, y, w, heatH);
                            }
                            break;
                        }
                    }
                }

                if (params.direction !== "horizontal") {
                    switch (drawMode) {
                        case "lines": {
                            ctx.beginPath();
                            ctx.strokeStyle = "#1177bb";
                            let first = true;
                            for (x = 0; x < w; x += overlayStepX) {
                                v = colSquiggles[x];
                                py = midY + v * amp;
                                if (first) {
                                    ctx.moveTo(x, py);
                                    first = false;
                                } else {
                                    ctx.lineTo(x, py);
                                }
                            }
                            ctx.stroke();
                            break;
                        }

                        case "bars": {
                            ctx.fillStyle = "#1177bb";
                            for (x = 0; x < w; x += overlayStepX) {
                                v = colSquiggles[x];
                                barLen = v * amp;
                                ctx.fillRect(x, midY, overlayStepX / 1.5, barLen);
                            }
                            break;
                        }

                        case "dots": {
                            ctx.fillStyle = "#1177bb";
                            for (x = 0; x < w; x += overlayStepX) {
                                v = colSquiggles[x];
                                py = midY + v * amp;
                                ctx.beginPath();
                                ctx.arc(x, py, 2 * scaleX, 0, TWO_PI);
                                ctx.fill();
                            }
                            break;
                        }

                        case "heatmap": {
                            const heatW = Math.max(2, overlayStepX);
                            for (x = 0; x < w; x += overlayStepX) {
                                v = Math.min(Math.max(colSquiggles[x], -1), 1);
                                intensity = (v + 1) * 127.5 | 0;
                                ctx.fillStyle = `rgb(${intensity}, 0, ${255 - intensity})`;
                                ctx.fillRect(x, 0, heatW, h);
                            }
                            break;
                        }
                    }
                }

                ctx.restore();
            }

            requestAnimationFrame(animate);
        };
    }

    /*img.onload = () => {
        createImageBitmap(img).then(bitmap => {
            imgBitmap = bitmap;
            imgNaturalWidth = bitmap.width;
            imgNaturalHeight = bitmap.height;
            resizeCanvasToImage(true);
            manualDirty = true;
            requestAnimationFrame(animate);
        });
    };*/

    window.addEventListener("resize", () => {
        resizeCanvasToImage(true);
        manualDirty = true;
    });

    //if (img.complete && img.naturalWidth) img.onload();

    const isCodePen = document.referrer.includes("codepen.io");
    const hostDomains = isCodePen ? ["codepen.io"] : [];
    hostDomains.push(window.location.hostname);
    const links = document.getElementsByTagName("a");
    utils.url.validateLinks(links, hostDomains);

    //demoImages.loadRandomImage();
    demoImages.loadImageIndex(4);
});