(function () {
	"use strict";

	var slider = document.getElementById("projectSlider");
	if (!slider) return;

	var track = document.getElementById("projectTrack");
	var slides = Array.prototype.slice.call(track.children);
	if (!slides.length) return;

	var counter = document.getElementById("projectCounter");
	var prev = document.getElementById("projectPrev");
	var next = document.getElementById("projectNext");

	var DELAY = 4500;
	var index = 0;
	var timer = null;
	var holds = 0;
	var touchStartX = 0;

	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

	var loadedSlides = {};

	function loadSlide(n) {
		if (loadedSlides[n]) return;
		loadedSlides[n] = true;
		var img = slides[n].querySelector(".project-media img");
		if (!img) return;
		img.loading = "eager";

		var src = img.getAttribute("src");
		if (src) img.src = src;
	}

	function show(i) {
		index = (i + slides.length) % slides.length;
		track.style.transform = "translateX(-" + index * 100 + "%)";
		if (counter) counter.textContent = index + 1 + " / " + slides.length;
		loadSlide(index);

		slides.forEach(function (slide, n) {
			if (n === index) {
				slide.removeAttribute("inert");
				slide.removeAttribute("aria-hidden");
			} else {
				slide.setAttribute("inert", "");
				slide.setAttribute("aria-hidden", "true");
			}
		});
	}

	function stop() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	function start() {
		stop();

		if (holds > 0 || document.hidden || reduceMotion.matches) return;
		timer = setInterval(function () {
			show(index + 1);
		}, DELAY);
	}

	function hold() {
		holds++;
		stop();
	}

	function release() {
		if (holds > 0) holds--;
		if (holds === 0) start();
	}

	function step(delta) {
		show(index + delta);

		start();
	}

	prev.addEventListener("click", function () {
		step(-1);
	});

	next.addEventListener("click", function () {
		step(1);
	});

	slider.addEventListener("mouseenter", hold);
	slider.addEventListener("mouseleave", release);

	slider.addEventListener("focusin", hold);
	slider.addEventListener("focusout", function (e) {
		if (!slider.contains(e.relatedTarget)) release();
	});

	slider.addEventListener("keydown", function (e) {
		if (e.key === "ArrowLeft") {
			step(-1);
		} else if (e.key === "ArrowRight") {
			step(1);
		} else {
			return;
		}
		e.preventDefault();
	});

	slider.addEventListener(
		"touchstart",
		function (e) {
			touchStartX = e.changedTouches[0].clientX;
		},
		{ passive: true }
	);

	slider.addEventListener(
		"touchend",
		function (e) {
			var delta = e.changedTouches[0].clientX - touchStartX;
			if (Math.abs(delta) > 45) step(delta < 0 ? 1 : -1);
		},
		{ passive: true }
	);

	document.addEventListener("visibilitychange", function () {
		if (document.hidden) stop();
		else start();
	});

	if (reduceMotion.addEventListener) {
		reduceMotion.addEventListener("change", start);
	}

	window.CardProjects = {
		hold: hold,
		release: release,
		next: function () {
			step(1);
		},
		prev: function () {
			step(-1);
		},
		count: slides.length
	};

	show(0);
	start();
})();
