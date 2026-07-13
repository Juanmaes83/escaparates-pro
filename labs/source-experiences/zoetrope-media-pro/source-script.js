document.addEventListener("DOMContentLoaded", () => {
	// === Links Validation ===
	// https://assets.codepen.io/573855/lr-utils.js
	// https://codepen.io/luis-lessrain/pen/pvzVozd
	const isCodePen = document.referrer.includes("codepen.io");
	const hostDomains = isCodePen ? ["codepen.io"] : [];
	hostDomains.push(window.location.hostname);

	const links = document.getElementsByTagName("a");
	LR.utils.urlUtils.validateLinks(links, hostDomains);
});
