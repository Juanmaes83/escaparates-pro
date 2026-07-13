document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const imageUpload = document.getElementById("image_upload");
  const processButton = document.getElementById("process_button");
  const stopButton = document.getElementById("stop_button");
  const loading = document.getElementById("loading");
  const modal = document.getElementById("modal");
  const closeModal = document.querySelector(".close");
  const downloadButton = document.getElementById("download_button");

  let imgSRC;
  let w, h;
  let isProcessing = false;
  let processedCanvas;

  const grassPalette = [
    [255, 255, 255],
    [225, 240, 210],
    [200, 230, 180],
    [180, 220, 160],
    [165, 210, 140],
    [150, 200, 120],
    [135, 190, 105],
    [120, 180, 90],
    [105, 170, 75],
    [90, 160, 65],
    [75, 145, 55],
    [65, 130, 50],
    [55, 115, 45],
    [48, 100, 40],
    [42, 85, 35],
    [37, 75, 31],
    [32, 65, 26],
    [28, 55, 22],
    [24, 45, 19],
    [21, 38, 16],
    [18, 32, 13],
    [15, 26, 10],
    [12, 20, 8],
    [9, 15, 6],
    [5, 7, 3],
    [3, 5, 2],
    [2, 3, 1],
    [0, 0, 0]
  ];

  const pane = new Tweakpane.Pane({
    title: "Controls",
    container: document.getElementById("controls")
  });
  const params = {
    bladeDensity: 5,
    loadingMessage: "Idle"
  };

  function setAccordionBehavior(openedFolder) {
    folders.forEach((folder) => {
      if (folder === openedFolder) {
        // Keep the clicked folder as is
        return;
      }
      folder.expanded = false; // Close all other folders
    });
  }

  function observeFolder(folder) {
    const observer = new MutationObserver(() => {
      if (folder.expanded) {
        setAccordionBehavior(folder);
      }
    });

    observer.observe(folder.element, {
      attributes: true,
      attributeFilter: ["class"]
    });
    return observer;
  }

  function setFolderEnabled(folder, enabled) {
    folder.children.forEach((control) => {
      if (control.controller_ && control.controller_.view) {
        const container = control.controller_.view.element;
        if (!enabled) {
          container.classList.add("disabled-folder");
        } else {
          container.classList.remove("disabled-folder");
        }
      }
    });
  }

  const actionsFolder = pane.addFolder({ title: "Actions" });
  const uploadButton = actionsFolder.addButton({ title: "Upload Image" });
  const processButtonPane = actionsFolder.addButton({
    title: "Process Image",
    disabled: true
  });
  const stopButtonPane = actionsFolder.addButton({
    title: "Stop Process",
    disabled: true
  });
  actionsFolder.addMonitor(params, "loadingMessage", { label: "Status" });

  const folders = [];

  const grassFolder = pane.addFolder({ title: "Grass Settings" });
  folders.push(grassFolder);
  observeFolder(grassFolder);
  grassFolder.addInput(params, "bladeDensity", {
    min: 1,
    max: 10,
    step: 1,
    label: "Blades/Pixel"
  });

  const demoFolder = pane.addFolder({ title: "Demo Images", expanded: false });
  folders.push(demoFolder);
  observeFolder(demoFolder);

  const thumbnailContainer = document.createElement("div");
  thumbnailContainer.style.display = "flex";
  thumbnailContainer.style.maxHeight = "110px";
  thumbnailContainer.style.overflowY = "auto";
  thumbnailContainer.style.width = "100%";
  thumbnailContainer.style.padding = "0 5px";
  thumbnailContainer.style.gap = "5px";
  thumbnailContainer.style.flexWrap = "wrap";

  const demoImageBase = "https://www.lessrain.com/dev/images/lr-demo-img-";
  const totalDemoImages = 370;
  const fixedFirstImage = 198;

  const allImageIds = Array.from(
    { length: totalDemoImages },
    (_, i) => i + 1
  ).filter((num) => num !== fixedFirstImage);

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); // Random index
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
  }

  shuffleArray(allImageIds);

  const demoImageIds = [fixedFirstImage, ...allImageIds.slice(0, 19)];

  const demoImages = demoImageIds.map((id) => ({
    name: `Image ${id}`,
    url: `${demoImageBase}${id}`,
    thumbnail: `${demoImageBase}${id}-thumb`
  }));

  async function tryImageExtensions(baseUrl, extensions, onSuccess, onError) {
    for (const ext of extensions) {
      const url = `${baseUrl}.${ext}`;
      const img = new Image();
      img.src = url;
      await new Promise((resolve) => {
        img.onload = () => {
          img.crossOrigin = "Anonymous";
          onSuccess(url);
          resolve();
        };
        img.onerror = () => resolve();
      });

      if (img.complete && img.naturalWidth > 0) {
        return;
      }
    }

    onError();
  }

  demoImages.forEach(({ name, url, thumbnail }) => {
    const thumbnailImg = document.createElement("img");
    Object.assign(thumbnailImg.style, {
      width: "60px",
      height: "60px",
      objectFit: "cover",
      cursor: "pointer",
      border: "2px solid transparent",
      borderRadius: "4px"
    });

    // Try multiple extensions for thumbnails
    tryImageExtensions(
      thumbnail,
      ["png"],
      (resolvedUrl) => {
        thumbnailImg.src = resolvedUrl;
        thumbnailImg.alt = name;
      },
      () => {} // Empty function prevents logging anything on failure
    );

    thumbnailImg.addEventListener("mouseenter", () => {
      thumbnailImg.style.border = "2px solid var(--btn-bg)";
    });
    thumbnailImg.addEventListener("mouseleave", () => {
      thumbnailImg.style.border = "2px solid transparent";
    });

    thumbnailImg.addEventListener("click", () => loadDemoImage(url));

    thumbnailContainer.appendChild(thumbnailImg);
  });

  const folderContent = demoFolder.element.querySelector(".tp-fldv_c");
  if (folderContent) {
    folderContent.appendChild(thumbnailContainer);
  } else {
    console.error("Could not find folder content area.");
  }

  uploadButton.on("click", () => imageUpload.click());

  processButtonPane.on("click", () => {
    if (imgSRC) {
      setFolderEnabled(grassFolder, false);
      params.loadingMessage = "Processing...";
      isProcessing = true;
      processButtonPane.disabled = true;
      stopButtonPane.disabled = false;
      processImage();
    } else {
      alert("Please upload an image first.");
    }
  });

  stopButtonPane.on("click", async () => {
    if (isProcessing) {
      console.log("Stopping process...");
      await stopProcess();
      alert("Processing stopped.");
    }
  });

  function stopProcess() {
    return new Promise((resolve) => {
      if (isProcessing) {
        if (animationFrameID) cancelAnimationFrame(animationFrameID);
        animationFrameID = null;
        setFolderEnabled(grassFolder, true);
        isProcessing = false;
        params.loadingMessage = "Idle";
        processButtonPane.disabled = false;
        stopButtonPane.disabled = true;

        cleanupMemory();

        setTimeout(() => {
          console.log("Cleanup complete. Process has fully stopped.");
          resolve();
        }, 10); // Allow event loop to process before resolving
      } else {
        resolve(); // If no processing, resolve immediately
      }
    });
  }

  function resizeImage(img, maxWidth, maxHeight) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      height *= maxWidth / width;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width *= maxHeight / height;
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(img, 0, 0, width, height);

    const resizedImage = new Image();
    resizedImage.src = canvas.toDataURL("image/png");
    return resizedImage;
  }

  imageUpload.addEventListener("change", async (event) => {
    console.log("Waiting for stopProcess to complete...");
    await stopProcess();

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        if (img.width > 2048 || img.height > 2048) {
          imgSRC = resizeImage(img, 2048, 2048);
          imgSRC.onload = () => {
            initialize(imgSRC);
            processButtonPane.disabled = false;
            startAutoProcessing();
          };
        } else {
          imgSRC = img;
          initialize(imgSRC);
          processButtonPane.disabled = false;
          startAutoProcessing();
        }
      };
    };
    reader.readAsDataURL(file);
  });

  async function loadDemoImage(baseUrl) {
    if (isProcessing) {
      console.log("Waiting for stopProcess to complete...");
      await stopProcess();
    }

    const extensions = ["jpg", "png", "webp"]; // Try these formats in order

    tryImageExtensions(
      baseUrl,
      extensions,
      (url) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        img.onload = () => {
          if (img.width > 2048 || img.height > 2048) {
            imgSRC = resizeImage(img, 2048, 2048);
            imgSRC.onload = () => {
              initialize(imgSRC);
              processButtonPane.disabled = false;
              startAutoProcessing();
            };
          } else {
            imgSRC = img;
            initialize(imgSRC);
            processButtonPane.disabled = false;
            startAutoProcessing();
          }
        };
      },
      () => {} // Empty function prevents logging anything on failure
    );
  }

  function startAutoProcessing() {
    if (imgSRC) {
      setFolderEnabled(grassFolder, false);
      params.loadingMessage = "Processing...";
      isProcessing = true;
      processButtonPane.disabled = true;
      stopButtonPane.disabled = false;
      processImage();
    }
  }

  function initialize(img) {
    const scaleFactor = 2.0;
    w = img.width * scaleFactor;
    h = img.height * scaleFactor;

    canvas.width = w;
    canvas.height = h;

    canvas.style.width = `${w / 2}px`;
    canvas.style.height = `${h / 2}px`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    window.addEventListener("resize", () => updateCanvasSize(img));
  }

  function updateCanvasSize(img) {
    const aspectRatio = img.height / img.width;
    const containerWidth = canvas.parentElement.offsetWidth;

    const maxWidth = Math.min(img.width, 2048);
    const maxHeight = Math.min(img.height, 2048);

    const calculatedWidth = Math.min(containerWidth, maxWidth);
    const calculatedHeight = Math.min(calculatedWidth * aspectRatio, maxHeight);

    canvas.style.width = `${calculatedWidth}px`;
    canvas.style.height = `${calculatedHeight}px`;
  }

  // Mulberry32 PRNG
  function mulberry32(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) >>> 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const prng = mulberry32(42); // Seed with any number

  //---
  const QUANTIZE_SHIFT = 4; // Reduce 256 levels to 16
  const QUANTIZE_MASK = 0xf0; // Mask for quantization

  // Quantize RGB values to reduce LUT size
  const quantize = (value) => (value & QUANTIZE_MASK) >> QUANTIZE_SHIFT;

  // Smaller LUT (64x64x64 = 262KB instead of 16MB)
  const LUT = new Uint8Array(64 * 64 * 64);

  // Precompute grassPalette length to avoid repeated lookups
  const grassPaletteLength = grassPalette.length;

  // Optimized LUT construction
  function buildLUT() {
    for (let r = 0; r < 256; r += 16) {
      for (let g = 0; g < 256; g += 16) {
        for (let b = 0; b < 256; b += 16) {
          const index = (quantize(r) << 12) | (quantize(g) << 6) | quantize(b);
          LUT[index] = findClosestGreenIndex(r, g, b);
        }
      }
    }
  }

  function findClosestGreenIndex(r, g, b) {
    let closestIndex = 0,
      minDiff = Infinity,
      color,
      diff;

    for (let i = 0; i < grassPaletteLength; i++) {
      color = grassPalette[i];
      diff =
        Math.abs(color[0] - r) +
        Math.abs(color[1] - g) +
        Math.abs(color[2] - b);

      closestIndex = diff < minDiff ? ((minDiff = diff), i) : closestIndex;
    }
    return closestIndex;
  }

  // Optimized color lookup
  function findClosestColor(red, green, blue) {
    const index =
      (quantize(red) << 12) | (quantize(green) << 6) | quantize(blue);
    const paletteIndex = LUT[index];
    return grassPalette[paletteIndex];
  }

  // Build LUT on initialization
  buildLUT();

  let imageData;
  let finalColorBuffer;
  let animationFrameID = null;

  function cleanupMemory() {
    console.log("Cleaning up memory...");
    if (imageData) {
      imageData.data = null; // Properly release memory
      imageData = null;
    }

    if (finalColorBuffer) {
      finalColorBuffer.fill(0); // Reset instead of deleting
    }
  }

  function processImage() {
    hideModal();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    finalColorBuffer = new Uint8ClampedArray(3);

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = imgSRC.width;
    tempCanvas.height = imgSRC.height;
    tempCtx.drawImage(imgSRC, 0, 0);

    // Extract image data and immediately release tempCanvas
    imageData = tempCtx.getImageData(0, 0, imgSRC.width, imgSRC.height);
    tempCanvas.width = tempCanvas.height = 0; // Release memory

    const data = new Uint8ClampedArray(imageData.data.buffer); // Faster pixel access

    const batchSize = 1000;
    let index = 0;

    const imgWidth = imgSRC.width;
    const imgHeight = imgSRC.height;
    const imgDataSize = imgWidth * imgHeight * 4;
    const stepX = imgWidth / w;
    const stepY = imgHeight / h;

    function processPixel(index) {
      if (index >= imgDataSize) return; // Prevent out-of-bounds access

      let y = (index / w) | 0;
      let x = index - y * w; // Faster than `index % w`

      let srcX = (x * stepX * 2) | 0;
      let srcY = (y * stepY * 2) | 0;
      let pixelIndex = (srcY * imgWidth + srcX) * 4;

      let red = data[pixelIndex];
      let green = data[pixelIndex + 1];
      let blue = data[pixelIndex + 2];

      let percent = ((red * 10 + green * 100 + blue * 100) / (6 * 255)) | 0;
      let baseColor = findClosestColor(red, green, blue);

      let randomIndex = prng();
      let randomX = (randomIndex - 0.5) * 10;
      let randomY = (prng() - 0.5) * 10;

      let drawX = x * 2 - percent * 0.2 + 10 + randomX;
      let drawY = y * 2 + percent * 0.1 + randomY;
      let rotation = randomIndex * 50 + percent * 46 * 0.5;
      let alpha = prng() * 0.5;

      for (let i = 0; i < params.bladeDensity; i++) {
        let randI = prng();
        let offsetX = (randI - 0.5) * 5;
        let offsetY = (prng() - 0.5) * 5;

        let baseLength = percent * 0.5;
        let extraRandomLength = prng() * 75;
        let length = baseLength + extraRandomLength * (prng() > 0.5 ? 1 : 0.5);

        let colorVariation = prng() * 30;

        finalColorBuffer[0] = Math.min(255, baseColor[0] + colorVariation) | 0;
        finalColorBuffer[1] = Math.min(255, baseColor[1] + colorVariation) | 0;
        finalColorBuffer[2] = Math.min(255, baseColor[2] + colorVariation) | 0;

        drawBladeOptimized(
          drawX + offsetX,
          drawY + offsetY,
          length,
          rotation + (prng() - 0.5) * 20,
          alpha,
          finalColorBuffer
        );
      }
    }

    function processBatch() {
      if (!isProcessing) return;

      animationFrameID = requestAnimationFrame(() => {
        const end = Math.min(index + batchSize, (w * h) / 2);

        for (; index < end; index += 4) {
          processPixel(index);
          processPixel(index + 1);
          processPixel(index + 2);
          processPixel(index + 3);
        }

        if (index < (w * h) / 2) {
          if (index % 5000 === 0) {
            // Check if requestIdleCallback is supported, otherwise use setTimeout as fallback
            if (typeof requestIdleCallback === "function") {
              requestIdleCallback(processBatch);
            } else {
              setTimeout(processBatch, 0); // iOS Safari fallback
            }
          } else {
            processBatch();
          }
        } else {
          stopProcess().then(() => {
            finishProcessing();
          });
        }
      });
    }

    processBatch();
  }

  function drawBladeOptimized(x, y, length, rotation, alpha, color) {
    ctx.save(); // Save canvas state before transforming
    ctx.setTransform(1, 0, 0, 1, x, y); // Reset transformation to avoid cumulative rotations
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = `rgb(${color[0] | 0}, ${color[1] | 0}, ${color[2] | 0})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();
    ctx.restore(); // Restore original state to avoid affecting future drawings
  }

  function drawBlade(x, y, length, rotation, alpha, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();
    ctx.restore();
  }

  function finishProcessing() {
    console.log("Processing finished, stopping process...");

    processedCanvas = document.createElement("canvas");
    processedCanvas.width = canvas.width;
    processedCanvas.height = canvas.height;
    const processedCtx = processedCanvas.getContext("2d");

    processedCtx.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      processedCanvas.width,
      processedCanvas.height
    );

    showModal();
  }

  function showModal() {
    modal.style.display = "flex";
  }

  function hideModal() {
    modal.style.display = "none";
  }

  closeModal.addEventListener("click", () => {
    hideModal();
  });

  downloadButton.addEventListener("click", () => {
    if (!processedCanvas) {
      alert("No processed image available.");
      return;
    }

    const imageDataURL = processedCanvas.toDataURL("image/png");

    const newTab = window.open();
    newTab.document.write(
      `<img src="${imageDataURL}" alt="Processed Image" />`
    );
    newTab.document.close();
  });

  const isCodePen = document.referrer.includes("codepen.io");
  const hostDomains = isCodePen ? ["codepen.io"] : [];
  hostDomains.push(window.location.hostname);

  const links = document.getElementsByTagName("a");
  LR.utils.urlUtils.validateLinks(links, hostDomains);

  loadDemoImage(demoImages[0].url);
});
