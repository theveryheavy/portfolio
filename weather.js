(function () {
	"use strict";

	var bgVideo = document.querySelector(".background-video");
	if (bgVideo) {
		var startVideo = function () {
			var p = bgVideo.play();
			if (p && p.catch) p.catch(function () {});
		};
		startVideo();
		if ("requestIdleCallback" in window) {
			requestIdleCallback(startVideo, { timeout: 2000 });
		} else {
			setTimeout(startVideo, 1200);
		}
	}

	var troughCanvas = document.getElementById("weatherTrough");
	var rainCanvas = document.getElementById("weatherRain");
	var flashCanvas = document.getElementById("weatherFlash");
	if (!troughCanvas || !rainCanvas || !flashCanvas) return;

	var x1 = troughCanvas.getContext("2d");
	var x2 = rainCanvas.getContext("2d");
	var x3 = flashCanvas.getContext("2d");

	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

	var rainSound = new Audio("./rain.mp3");
	rainSound.preload = "none";
	rainSound.loop = true;
	rainSound.volume = 0.5;

	var thunderSound = new Audio("./thunder.mp3");
	thunderSound.preload = "none";
	thunderSound.volume = 0.6;

	var w = (troughCanvas.width = rainCanvas.width = flashCanvas.width = innerWidth);
	var h = (troughCanvas.height = rainCanvas.height = flashCanvas.height = innerHeight);

	var troughs = [];
	var drops = [];

	var rnd = function (a, b) {
		return Math.random() * (b - a) + a;
	};

	var particleCount = function () {
		if (innerWidth < 700)
			return Math.floor(140 * Math.sqrt((innerWidth * innerHeight) / (600 * 800)));
		return Math.floor(500 * Math.sqrt((innerWidth * innerHeight) / (1920 * 1080)));
	};

	var newDrop = function () {
		return { x: rnd(0, w), y: rnd(0, h), l: Math.random(), xs: 0, ys: rnd(10, 20) };
	};

	var newTrough = function () {
		return {
			x: rnd(0, w),
			y: rnd(0, h),
			length: Math.floor(rnd(1, 830)),
			opacity: Math.random() * 0.2,
			xs: 2,
			ys: rnd(10, 20)
		};
	};

	var resizeParticles = function (arr, target, maker) {
		while (arr.length < target) arr.push(maker());
		arr.length = target;
	};

	var safePlay = function (audio) {
		var p = audio.play();
		if (p && p.catch) p.catch(function () {});
	};

	resizeParticles(drops, particleCount(), newDrop);
	resizeParticles(troughs, particleCount(), newTrough);

	var resize = function () {
		w = troughCanvas.width = rainCanvas.width = flashCanvas.width = innerWidth;
		h = troughCanvas.height = rainCanvas.height = flashCanvas.height = innerHeight;
		resizeParticles(drops, particleCount(), newDrop);
		resizeParticles(troughs, particleCount(), newTrough);
	};

	var resizeTimer = null;
	addEventListener(
		"resize",
		function () {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(resize, 150);
		},
		{ passive: true }
	);

	function drawDrop(i) {
		x2.beginPath();
		x2.moveTo(drops[i].x, drops[i].y);
		x2.lineTo(drops[i].x, drops[i].y + drops[i].l * drops[i].ys);
		x2.strokeStyle = "rgba(174,194,224,0.5)";
		x2.lineWidth = 1;
		x2.stroke();
	}

	function drawTrough(i) {
		x1.beginPath();
		var g = x1.createLinearGradient(0, troughs[i].y, 0, troughs[i].y + troughs[i].length);
		g.addColorStop(0, "rgba(255,255,255,0)");
		g.addColorStop(1, "rgba(255,255,255," + troughs[i].opacity + ")");
		x1.fillStyle = g;
		x1.fillRect(troughs[i].x, troughs[i].y, 1, troughs[i].length);
	}

	function animTrough() {
		x1.clearRect(0, 0, w, h);
		for (var i = 0; i < troughs.length; i++) {
			troughs[i].y = troughs[i].y >= h ? -troughs[i].length * 5 : troughs[i].y + troughs[i].ys;
			drawTrough(i);
		}
	}

	function animRain() {
		x2.clearRect(0, 0, w, h);
		for (var i = 0; i < drops.length; i++) {
			drops[i].x += drops[i].xs;
			drops[i].y += drops[i].ys;
			if (drops[i].x > w || drops[i].y > h) {
				drops[i].x = rnd(0, w);
				drops[i].y = -20;
			}
			drawDrop(i);
		}
	}

	var FLASH_MIN = 22000;
	var FLASH_MAX = 52000;

	var THUNDER_CHANCE = 0.25;

	var flashUntil = 0;
	var flashSpan = 1;

	var nextFlash = performance.now() + rnd(2500, 6000);

	function animFlash() {
		x3.clearRect(0, 0, w, h);

		var now = performance.now();

		if (now >= flashUntil && now >= nextFlash) {

			if (document.hidden) {
				nextFlash = now + 1000;
				return;
			}
			flashSpan = rnd(90, 170);
			flashUntil = now + flashSpan;
			nextFlash = flashUntil + rnd(FLASH_MIN, FLASH_MAX);

			if (soundOn && Math.random() < THUNDER_CHANCE) {

				thunderSound.currentTime = 0;
				safePlay(thunderSound);
			}
		}

		if (now >= flashUntil) return;

		var left = flashUntil - now;
		var a = Math.max(0, Math.min(1, left / flashSpan));
		if (a <= 0) return;

		x3.fillStyle = "rgba(226, 240, 255, " + (a * 0.34).toFixed(3) + ")";
		x3.fillRect(0, 0, w, h);
	}

	function loop() {
		if (reduceMotion.matches) {

			x1.clearRect(0, 0, w, h);
			x2.clearRect(0, 0, w, h);
			x3.clearRect(0, 0, w, h);
			return;
		}

		animTrough();
		animRain();
		animFlash();
		requestAnimationFrame(loop);
	}

	var soundOn = false;

	if (window.CardAudio) {
		window.CardAudio.subscribe(function (muted) {
			soundOn = !muted;
			if (muted) {
				rainSound.pause();
				thunderSound.pause();
			} else {
				safePlay(rainSound);
			}
		});
	}

	loop();
})();
