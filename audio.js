(function () {
	"use strict";

	var muted = true;
	var listeners = [];

	function notify() {
		for (var i = 0; i < listeners.length; i++) listeners[i](muted);
	}

	window.CardAudio = {

		isMuted: function () {
			return muted;
		},

		subscribe: function (fn) {
			listeners.push(fn);
			fn(muted);
		},

		toggle: function () {
			muted = !muted;
			notify();
			return muted;
		}
	};
})();
