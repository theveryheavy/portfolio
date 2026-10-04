(function () {
	"use strict";

	var lightbox = document.getElementById("lightbox");
	if (!lightbox) return;

	var lightboxImg = document.getElementById("lightboxImg");
	var lightboxClose = document.getElementById("lightboxClose");

	var slider = window.CardProjects;
	var lastFocused = null;

	function open(src, trigger) {
		if (!src) return;
		lightboxImg.setAttribute("src", src);
		lightboxImg.setAttribute("alt", trigger.getAttribute("alt") || "");
		lightbox.classList.add("open");
		lightboxClose.focus();
		lastFocused = trigger;
		if (slider) slider.hold();
	}

	function close() {
		if (!lightbox.classList.contains("open")) return;
		lightbox.classList.remove("open");

		lightboxImg.removeAttribute("src");
		if (slider) slider.release();
		if (lastFocused) lastFocused.focus();
		lastFocused = null;
	}

	var thumbnails = document.querySelectorAll(".project-media img");

	Array.prototype.forEach.call(thumbnails, function (img) {

		img.tabIndex = 0;
		img.setAttribute("role", "button");

		img.addEventListener("click", function () {
			open(img.getAttribute("src"), img);
		});

		img.addEventListener("keydown", function (e) {
			if (e.key !== "Enter" && e.key !== " ") return;
			e.preventDefault();
			open(img.getAttribute("src"), img);
		});
	});

	lightboxClose.addEventListener("click", close);

	lightbox.addEventListener("click", function (e) {
		if (e.target === lightbox) close();
	});

	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape") close();
	});
})();
