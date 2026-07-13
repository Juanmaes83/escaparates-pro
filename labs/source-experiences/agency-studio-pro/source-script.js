const POSTBIN_URL = "https://www.postb.in/1778049793423-9521197765134";
const TILE_COUNT = 128;

const UNSPLASH_IDS = [
	// Typography / design
	"1609605348579-3123e3d40eb8",
	"1533226458520-6f71cffeaa6a",
	"1617050318658-a9a3175e34cb",
	"1461958508236-9a742665a0d5",
	"1596299786007-9974099be52b",
	"1581080247486-57989c1f14ab",
	"1611532736597-de2d4265fba3",
	"1513909894411-7d7e04c28ecd",
	"1581080247575-12fa86f6ef6e",
	"1603204254626-d0de8eb24cf1",
	"1619632973808-4acf8041df42",
	"1505356822725-08ad25f3ffe4",
	"1566978862346-73282aa378a4",
	"1617575521317-d2974f3b56d2",
	"1610454059909-f9a5a6eb4e58",
	"1690141001405-456018efb3f9",
	"1691712820599-c159327225cb",
	"1692053067599-36ed06d37c06",
	// Brutalist architecture
	"1504625709867-b4e45e3bb9dd",
	"1446771326090-d910bfaf00f6",
	"1536924491042-b0466800ce46",
	"1716249738093-623a70ad6531",
	"1546414701-81cc6963c67f",
	"1737442981890-0a87ef3ce9f5",
	"1625390711106-3728815ebcd9",
	"1634573826817-27d9e8da08df",
	"1595658511703-2cad160de181",
	"1591280122880-eec70c6a5810",
	"1600730424902-a3a3be6af112",
	"1643580594611-bb4f78b87f44",
	"1522743791393-522312deeebf",
	"1691432215961-b86fbb5892f5",
	"1609670530579-fe311b3630cc"
];

function unsplashUrl(id, size) {
	return `https://images.unsplash.com/photo-${id}?w=${size}&h=${size}&fit=crop&q=70&auto=format`;
}

const TAG_POOL = [
	"Identity",
	"Editorial",
	"Web",
	"Type",
	"Packaging",
	"Direction",
	"Motion",
	"Print",
	"System",
	"Poster"
];
const CLIENTS = [
	"Atelier Borel",
	"Maison Klein",
	"Kunsthalle Bern",
	"Volume Zero",
	"Studio Forme",
	"La Compagnie",
	"Index Magazine",
	"Foundry Y",
	"Centre Marlot",
	"Type West",
	"Office of Things",
	"Press Nord"
];
const ROLES = [
	"Lead Designer",
	"Art Direction",
	"Type & Layout",
	"Identity Designer",
	"Creative Direction"
];
const YEARS = [2026, 2025, 2025, 2024, 2024, 2023, 2023, 2022, 2022, 2021];
const TITLES = [
	"Counterpoint",
	"Field Notes",
	"Minor Index",
	"Long Form",
	"Sans Serif",
	"Working Title",
	"Volume One",
	"Continued",
	"Inventory",
	"After Image",
	"Marginal",
	"Verso & Recto",
	"Plain Text",
	"Open Set",
	"New Standard",
	"Footnote",
	"Annotated",
	"Reprint"
];

const BRIEFS = [
	"A complete identity refresh for a long-running cultural institution. The brief asked for visual continuity with the previous twenty-year mark while opening room for a more flexible system across screen-first applications.",
	"An editorial system for a quarterly publication moving from collector-only print to a hybrid print + web release. The publication's editorial voice — opinionated, citation-heavy — needed to survive both formats without compromise.",
	"A type-led wayfinding system for a small contemporary art space, designed to be set entirely in one variable typeface and printed in two colors on uncoated stock.",
	"A packaging system for an independent food producer, scoped to be production-ready across nine SKUs with a single die-cut and minimal printing constraints."
];

const APPROACHES = [
	[
		"The system is built on a 12-column flexible grid that resolves to 4 and 6 columns at smaller sizes. Type pairs are reduced to two: a grotesque for display and a monospace for marginalia and metadata.",
		"Color is held in OKLCH, with a single accent doing the heavy lifting across surfaces. The grid is shown, not hidden — registration marks remain visible at the edges of the page."
	],
	[
		"Every component was specified twice — once for print, once for screen — with explicit fallback rules where the two diverge. Image treatments are limited to three: full-bleed, framed, and inset.",
		"Typography uses a single variable font axis (weight) to handle the entire hierarchy. Footnotes and captions sit in monospace, intentionally distinct from the editorial body."
	],
	[
		"The mark is constructed from a single geometric primitive, scaled and rotated. No outliers. No exceptions for special applications.",
		"Print specifications were reduced to the minimum: one paper stock, two ink colors, one folding scheme. Constraints made the system durable."
	]
];

const OUTCOMES = [
	"The system is now in active use across 14 touchpoints. Onboarding new collaborators takes a single page of documentation. The grid holds.",
	"Twelve issues released to date. The editorial voice has remained legible across the format change, and the production cost dropped 22%.",
	"The mark survived its first year intact. No exceptions were granted. Three downstream agencies now build inside the system without supervision."
];

function makeProjects() {
	return Array.from({ length: TILE_COUNT }, (_, i) => {
		const tags = [
			TAG_POOL[i % TAG_POOL.length],
			TAG_POOL[(i + 3) % TAG_POOL.length],
			TAG_POOL[(i + 7) % TAG_POOL.length]
		];
		return {
			id: i,
			num: String(i + 1).padStart(3, "0"),
			title:
				TITLES[i % TITLES.length] + " №" + String((i % 12) + 1).padStart(2, "0"),
			client: CLIENTS[i % CLIENTS.length],
			year: YEARS[i % YEARS.length],
			role: ROLES[i % ROLES.length],
			tags: tags,
			image: unsplashUrl(UNSPLASH_IDS[i % UNSPLASH_IDS.length], 800),
			brief: BRIEFS[i % BRIEFS.length],
			approach: APPROACHES[i % APPROACHES.length],
			outcome: OUTCOMES[i % OUTCOMES.length],
			related: [
				unsplashUrl(UNSPLASH_IDS[(i * 7 + 1) % UNSPLASH_IDS.length], 600),
				unsplashUrl(UNSPLASH_IDS[(i * 7 + 3) % UNSPLASH_IDS.length], 600),
				unsplashUrl(UNSPLASH_IDS[(i * 7 + 5) % UNSPLASH_IDS.length], 600),
				unsplashUrl(UNSPLASH_IDS[(i * 7 + 9) % UNSPLASH_IDS.length], 600)
			]
		};
	});
}

const projects = makeProjects();

const mosaic = document.getElementById("mosaic");

/* Generate a muted OKLCH color in the brand tonality.
   Lightness 35-75%, low chroma 0.04-0.12, hue across full wheel. */
function placeholderColor(seed) {
	const rand = (s) => {
		const x = Math.sin(s) * 10000;
		return x - Math.floor(x);
	};
	const l = 35 + rand(seed * 1.3) * 40; // 35—75%
	const c = 0.04 + rand(seed * 2.7) * 0.08; // 0.04—0.12
	const h = rand(seed * 4.1) * 360; // 0—360
	return `oklch(${l.toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(1)})`;
}

const tiles = projects.map((p, i) => {
	const a = document.createElement("a");
	a.className = "tile";
	a.href = "#project-" + p.id;
	a.setAttribute("role", "listitem");
	a.dataset.id = String(i);
	a.style.setProperty("--tile-bg", placeholderColor(i + 1));
	a.innerHTML = `
    <img src="${p.image}" alt="${p.title}" loading="${
		i < 12 ? "eager" : "lazy"
	}" decoding="async">
    <div class="tile__label">
      <span>[${p.num}]</span>
      <span>${p.year}</span>
    </div>
  `;
	const img = a.querySelector("img");
	if (img.complete) {
		a.dataset.loaded = "true";
	} else {
		img.addEventListener(
			"load",
			() => {
				a.dataset.loaded = "true";
			},
			{ once: true }
		);
		img.addEventListener(
			"error",
			() => {
				a.dataset.loaded = "true";
			},
			{ once: true }
		);
	}
	a.addEventListener("click", (e) => {
		e.preventDefault();
		openProject(i);
	});
	mosaic.appendChild(a);
	return a;
});

/* Staggered reveal — wave effect per visible batch, capped delay */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
	.matches;
if (reduceMotion) {
	tiles.forEach((t) => {
		t.dataset.visible = "true";
	});
} else {
	let waveStart = performance.now();
	let waveCount = 0;
	const observer = new IntersectionObserver(
		(entries) => {
			const now = performance.now();
			if (now - waveStart > 400) {
				waveStart = now;
				waveCount = 0;
			}
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const delay = Math.min(waveCount * 35, 600);
					entry.target.style.setProperty("--reveal-delay", delay + "ms");
					entry.target.dataset.visible = "true";
					waveCount++;
					observer.unobserve(entry.target);
				}
			});
		},
		{ rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
	);
	tiles.forEach((t) => observer.observe(t));
}

const detail = document.getElementById("detail");
const detailImg = document.getElementById("detail-img");
const detailTitle = document.getElementById("detail-title");
const detailCrumb = document.getElementById("detail-crumb");
const detailClient = document.getElementById("detail-client");
const detailYear = document.getElementById("detail-year");
const detailRole = document.getElementById("detail-role");
const detailTags = document.getElementById("detail-tags");
const detailBrief = document.getElementById("detail-brief");
const detailAppr1 = document.getElementById("detail-approach-1");
const detailAppr2 = document.getElementById("detail-approach-2");
const detailOutcome = document.getElementById("detail-outcome");
const detailRelated = document.getElementById("detail-related");
const detailMetaL = document.getElementById("detail-meta-l");
const detailMetaR = document.getElementById("detail-meta-r");
const detailClose = document.getElementById("detail-close");

let activeTile = null;

function fillDetail(p) {
	detailImg.src = p.image;
	detailImg.alt = p.title;
	detailTitle.textContent = p.title;
	detailCrumb.textContent = `№${p.num} — ${p.title}`;
	detailClient.textContent = p.client;
	detailYear.textContent = p.year;
	detailRole.textContent = p.role;
	detailTags.innerHTML = p.tags.map((t) => `<span>${t}</span>`).join("");
	detailBrief.textContent = p.brief;
	detailAppr1.textContent = p.approach[0];
	detailAppr2.textContent = p.approach[1];
	detailOutcome.textContent = p.outcome;
	detailRelated.innerHTML = p.related
		.map((src) => `<img src="${src}" alt="" loading="lazy">`)
		.join("");
	detailMetaL.textContent = `№${p.num} — ${p.client.toUpperCase()}`;
	detailMetaR.textContent = `FIG. ${String(p.id + 1).padStart(2, "0")}`;
}

function applyOpenState() {
	detail.dataset.open = "true";
	detail.setAttribute("aria-hidden", "false");
	document.body.style.overflow = "hidden";
}
function applyCloseState() {
	detail.dataset.open = "false";
	detail.setAttribute("aria-hidden", "true");
	document.body.style.overflow = "";
}

function openProject(idx) {
	const p = projects[idx];
	const tile = tiles[idx];
	const tileImg = tile.querySelector("img");
	activeTile = tile;

	fillDetail(p);

	if (document.startViewTransition) {
		tileImg.style.viewTransitionName = "hero-image";
		detailImg.style.viewTransitionName = "hero-image";

		const t = document.startViewTransition(() => {
			applyOpenState();
			tileImg.style.viewTransitionName = "";
		});

		t.finished.finally(() => {
			detailImg.style.viewTransitionName = "";
		});
	} else {
		applyOpenState();
	}
	detail.scrollTop = 0;
}

function closeProject() {
	if (!activeTile) {
		applyCloseState();
		return;
	}
	const tileImg = activeTile.querySelector("img");

	if (document.startViewTransition) {
		detailImg.style.viewTransitionName = "hero-image";
		tileImg.style.viewTransitionName = "hero-image";

		const t = document.startViewTransition(() => {
			applyCloseState();
			detailImg.style.viewTransitionName = "";
		});

		t.finished.finally(() => {
			tileImg.style.viewTransitionName = "";
			activeTile = null;
		});
	} else {
		applyCloseState();
		activeTile = null;
	}
}

detailClose.addEventListener("click", closeProject);
document.addEventListener("keydown", (e) => {
	if (e.key === "Escape" && detail.dataset.open === "true") closeProject();
});
detail.addEventListener("click", (e) => {
	// Click on background (outside .detail__inner) closes — optional UX
	if (e.target === detail) closeProject();
});

const form = document.getElementById("contact-form");
const status = document.getElementById("form-status");
const submit = form.querySelector(".form__submit");

form.addEventListener("submit", async (e) => {
	e.preventDefault();
	if (!form.reportValidity()) return;

	status.dataset.state = "";
	status.textContent = "";
	submit.disabled = true;
	submit.textContent = "Sending…";

	const data = Object.fromEntries(new FormData(form).entries());
	data.timestamp = new Date().toISOString();
	data.referrer = document.referrer || "direct";

	try {
		const res = await fetch(POSTBIN_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data)
		});
		if (!res.ok) throw new Error("HTTP " + res.status);
		status.dataset.state = "ok";
		status.textContent = "✓ Message received — replying within 48h";
		form.reset();
	} catch (err) {
		status.dataset.state = "error";
		status.textContent =
			"✕ Failed (" + err.message + ") — replace POSTBIN_URL with your bin URL";
	} finally {
		submit.disabled = false;
		submit.textContent = "Send Message";
	}
});

const serviceItems = document.querySelectorAll(".services__item");
serviceItems.forEach((item) => {
	const trigger = item.querySelector(".services__trigger");
	const arrow = item.querySelector(".services__arrow");
	trigger.addEventListener("click", () => {
		const willOpen = item.dataset.open !== "true";

		// Close all others
		serviceItems.forEach((other) => {
			if (other !== item) {
				other.dataset.open = "false";
				other
					.querySelector(".services__trigger")
					.setAttribute("aria-expanded", "false");
				other.querySelector(".services__arrow").textContent = "+";
			}
		});

		// Toggle this one
		item.dataset.open = String(willOpen);
		trigger.setAttribute("aria-expanded", String(willOpen));
		arrow.textContent = willOpen ? "−" : "+";
	});
});

const clock1 = document.getElementById("local-time");
const clock2 = document.getElementById("local-time-2");
function tick() {
	const now = new Date();
	const t = now.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		timeZone: "Europe/Paris"
	});
	clock1.textContent = `BDX ${t}`;
	clock2.textContent = `Bordeaux / ${t}`;
}
tick();
setInterval(tick, 1000);
