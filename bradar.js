(function () {
	"use strict";

	var IGNORED = "bradarIgnored";

	var banner = document.createElement("div");
	banner.id = "adblockBanner";
	banner.className = "adblock-banner";
	banner.setAttribute("role", "alertdialog");
	banner.setAttribute("aria-modal", "true");
	banner.setAttribute("aria-label", "Ad blocker detected");
	banner.hidden = true;
	banner.innerHTML =
		'<button class="adblock-close" id="adblockClose" aria-label="Close and ignore">' +
		'<span class="sr-only">&times;</span></button>' +
		'<div class="adblock-body">' +
		"<h3>Hello Bradar</h3>" +
		'<img src="./bradar.png" alt="Bradar" class="adblock-img">' +
		"<p>It seems that you're blocking my cameras to track your toes.</p>" +
		"<p>Make the Bradar happy and disable blocking.</p>" +
		"</div>" +
		'<button class="adblock-yes" id="adblockYes">Yes Bradar</button>';
	document.body.appendChild(banner);

	var closeBtn = document.getElementById("adblockClose");

	var netBlocked = 0;

	var PROBES = [
		"https://static.cloudflareinsights.com/beacon.min.js",
		"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
		"https://securepubads.g.doubleclick.net/tag/js/gpt.js"
	];

	function isIgnored() {
		try {
			return sessionStorage.getItem(IGNORED) === "1";
		} catch (e) {

			return true;
		}
	}

	var controlState = "pending";

	function detected() {
		if (controlState !== "ok") return false;
		return netBlocked >= 2;
	}

	var announced = false;
	var lastFocused = null;

	function reveal() {
		if (announced || !detected() || isIgnored()) return;
		announced = true;
		window.bradarDetected = true;

		lastFocused = document.activeElement;
		banner.hidden = false;
		closeBtn.focus();
	}

	function dismiss() {
		if (banner.hidden) return;
		try {
			sessionStorage.setItem(IGNORED, "1");
		} catch (e) {

		}
		banner.hidden = true;
		if (lastFocused && lastFocused.isConnected) lastFocused.focus();
		lastFocused = null;
	}

	window.addEventListener("load", reveal);

	var pending = PROBES.length;

	function probeDone() {
		if (--pending <= 0) reveal();
	}

	PROBES.forEach(function (url) {
		try {
			var s = document.createElement("script");
			s.src = url;
			s.async = true;
			s.onerror = function () {
				netBlocked++;
				probeDone();
			};
			document.head.appendChild(s);
		} catch (e) {
			netBlocked++;
			probeDone();
		}
	});

	(function probeControl() {
		if (navigator.onLine === false) {
			controlState = "failed";
			reveal();
			return;
		}
		var control = new Image();
		control.onload = function () {
			controlState = "ok";
			reveal();
		};
		control.onerror = function () {
			controlState = "failed";
			reveal();
		};

		control.src = "./favicon-32x32.png";
	})();

	setTimeout(reveal, 2500);

	window.bradarDetected = detected();

	document.getElementById("adblockYes").addEventListener("click", function () {
		location.reload();
	});

	closeBtn.addEventListener("click", dismiss);

	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape") dismiss();
	});
})();
