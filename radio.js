(function () {
	"use strict";

	var root = document.getElementById("miniPlayer");
	if (!root) return;

	var btn = document.getElementById("radioMute");
	var art = document.getElementById("playerArt");
	var song = document.getElementById("playerSong");
	var track = document.getElementById("playerSongTrack");
	var count = document.getElementById("playerListeners");

	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	var STREAM = "https://network.kngi.org/radio/8000/stream";

	var NOTE_SVG =
		'<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="20" height="20">' +
		'<path d="M18.6216 3.21667c.2391.1897.3784.47817.3784.78334V15.6667c0 .0412-.0025.0818-.0073.1218.0048.0698.0073.1404.0073.2115 0 1.6569-1.3431 3-3 3s-3-1.3431-3-3 1.3431-3 3-3c.3506 0 .6872.0602 1 .1707V9.2602l-8 1.8667V18l-.00001.0032C8.99824 19.6586 7.65577 21 6 21c-1.65685 0-3-1.3431-3-3s1.34315-3 3-3c.35064 0 .68722.0602 1 .1707V6.33334c0-.46474.32018-.86823.77277-.97384l9.99953-2.33321c.1486-.03477.3012-.03465.4467-.00201.1427.03202.2783.09532.3964.18752.0021.00162.0041.00324.0062.00487Z"/></svg>';

	var music = new Audio();
	music.preload = "none";
	music.volume = 0.6;
	var streamAttached = false;

	function safePlay(audio) {
		var p = audio.play();
		if (p && p.catch) p.catch(function () {});
	}

	function setSong(text) {
		if (!text) return;
		track.textContent = "";
		var a = document.createElement("span");
		a.textContent = text;
		var b = document.createElement("span");
		b.textContent = text;
		b.setAttribute("aria-hidden", "true");
		track.appendChild(a);
		track.appendChild(b);
		song.setAttribute("title", text);

		tuneMarquee();
	}

	function tuneMarquee() {
		var first = track.firstChild;
		if (!first) return;
		var w = first.getBoundingClientRect().width;
		if (w > song.clientWidth + 4 && !reduceMotion.matches) {
			song.classList.add("scrolling");

			song.style.setProperty("--npd", Math.max(9, w / 18) + "s");
		} else {
			song.classList.remove("scrolling");
		}
	}

	function setArt(url) {
		var img = new Image();
		img.alt = "";
		img.decoding = "async";

		img.onload = function () {
			art.textContent = "";
			art.appendChild(img);
		};
		img.src = url;
	}

	function setListeners(n) {
		if (typeof n !== "number" || !isFinite(n)) return;
		count.textContent = n === 1 ? "1 listening" : n + " listening";
	}

	function updateNowPlaying(np, listeners) {
		if (np && np.song) {
			setSong(np.song.text || np.song.title || "KNGI Network");
			if (np.song.art) setArt(np.song.art);
		}
		if (listeners) setListeners(listeners);
	}

	function fetchNowPlaying() {
		fetch("https://network.kngi.org/api/nowplaying")
			.then(function (r) {
				return r.json();
			})
			.then(function (d) {
				updateNowPlaying(d[0] && d[0].now_playing, d[0] && d[0].listeners && d[0].listeners.total);
			})
			.catch(function () {

			});
	}

	var wsReconnect = 2000;
	var wsFallback = null;
	var ws = null;

	function connectWS() {
		try {
			ws = new WebSocket("wss://network.kngi.org/api/live/nowplaying/websocket");
		} catch (_) {
			startFallback();
			return;
		}
		ws.onmessage = function (e) {
			try {
				var d = JSON.parse(e.data);
				var row = d[0] || d;
				updateNowPlaying(row.now_playing, row.listeners && row.listeners.total);
			} catch (_) {}
		};
		ws.onopen = function () {
			wsReconnect = 2000;
			if (wsFallback) {
				clearInterval(wsFallback);
				wsFallback = null;
			}
		};
		ws.onclose = function () {
			startFallback();
			setTimeout(connectWS, wsReconnect);
			wsReconnect = Math.min(wsReconnect * 1.5, 30000);
		};
		ws.onerror = function () {
			ws.close();
		};
	}

	function startFallback() {
		if (wsFallback) return;
		wsFallback = setInterval(fetchNowPlaying, 5000);
		fetchNowPlaying();
	}

	function applyAudio(muted) {
		btn.setAttribute("aria-pressed", muted ? "false" : "true");
		btn.setAttribute("aria-label", muted ? "Unmute all sound" : "Mute all sound");
		if (muted) {
			music.pause();
		} else {
			if (!streamAttached) {
				music.src = STREAM;
				streamAttached = true;
			}
			safePlay(music);
		}
	}

	if (window.CardAudio) {
		window.CardAudio.subscribe(applyAudio);
	} else {

		btn.hidden = true;
	}

	btn.addEventListener("click", function (e) {
		e.preventDefault();
		e.stopPropagation();
		if (window.CardAudio) window.CardAudio.toggle();
	});

	music.addEventListener("error", function () {
		streamAttached = false;
		music.removeAttribute("src");
		setSong("Stream unavailable");
	});

	addEventListener(
		"resize",
		function () {
			clearTimeout(track._t);
			track._t = setTimeout(tuneMarquee, 150);
		},
		{ passive: true }
	);

	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(tuneMarquee);
	}

	art.textContent = NOTE_SVG;
	setSong("KNGI Network - loading...");
	connectWS();
	fetchNowPlaying();
})();
