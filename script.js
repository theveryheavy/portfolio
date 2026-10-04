const userID = "1266113644643614803";
const elements = {
	statusBox: document.querySelector(".status"),
	statusImage: document.getElementById("status-image"),
	displayName: document.querySelector(".display-name"),
	username: document.querySelector(".username"),
	customStatus: document.querySelector(".custom-status"),
	customStatusText: document.querySelector(".custom-status-text"),
	customStatusEmoji: document.getElementById("custom-status-emoji"),
};
function startWebSocket() {
	const ws = new WebSocket("wss://api.lanyard.rest/socket");
	ws.onopen = () => {
		ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userID } }));
	};
	ws.onmessage = (event) => {
		const { t, d } = JSON.parse(event.data);
		if (t === "INIT_STATE" || t === "PRESENCE_UPDATE") {
			updateStatus(d);
		}
	};
	ws.onerror = (error) => {
		console.error("WebSocket error:", error);
		ws.close();
	};
	ws.onclose = () => {
		console.log("WebSocket closed, reconnecting...");
		setTimeout(startWebSocket, 1000);
	};
}
function updateStatus(lanyardData) {
	const { discord_status, activities, discord_user } = lanyardData;
	elements.displayName.innerHTML = discord_user.display_name;
	elements.username.innerHTML = discord_user.username;
	let imagePath;
	let label;
	switch (discord_status) {
		case "online":
			imagePath = "./online.svg";
			label = "Online";
			break;
		case "idle":
			imagePath = "./idle.svg";
			label = "Idle / AFK";
			break;
		case "dnd":
			imagePath = "./dnd.svg";
			label = "Do Not Disturb";
			break;
		case "offline":
			imagePath = "./offline.svg";
			label = "Offline";
			break;
		default:
			imagePath = "./offline.svg";
			label = "Unknown";
			break;
	}
	const isStreaming = activities.some(
		(activity) =>
			activity.type === 1 &&
			(activity.url.includes("twitch.tv") ||
				activity.url.includes("youtube.com"))
	);
	if (isStreaming) {
		imagePath = "./streaming.svg";
		label = "Streaming";
	}
	elements.statusImage.src = imagePath;
	elements.statusBox.setAttribute("aria-label", label);

	const state = activities[0] && activities[0].state;
	elements.customStatusText.textContent = state || "";
	const emoji = activities[0] && activities[0].emoji;
	let emojiSrc = null;
	if (emoji && emoji.id) {
		emojiSrc = `https://cdn.discordapp.com/emojis/${emoji.id}?format=webp&size=24&quality=lossless`;
	}

	if (emojiSrc) {
		elements.customStatusEmoji.style.display = "";
		elements.customStatusEmoji.src = emojiSrc;
	} else {
		elements.customStatusEmoji.style.display = "none";
	}

	elements.customStatus.style.display = state || emojiSrc ? "flex" : "none";
}
startWebSocket();
