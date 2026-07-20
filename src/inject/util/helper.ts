import { videoPlayer } from "../mainWorld";

let touchPlayerMoveIndex = 0;

export function bodyClass(className: string) {
	return {
		enable: () => {
			document.body.classList.add(className);
		},
		disable: () => {
			document.body.classList.remove(className);
		},
	};
}

export function checkPlayerAD() {
	return (videoPlayer.player?.querySelector(".video-ads")?.childNodes?.length ?? 0) > 0 || false;
}

export function getChannelId() {
	const rt = videoPlayer.player?.getPlayerResponse()?.microformat?.playerMicroformatRenderer?.ownerProfileUrl?.slice(23);
	return rt ? decodeURI(rt) : null;
}

export function secToMMDD(time: number, forceShowHours = false): string {
	const hours = Math.floor(time / 3600)
		.toString()
		.padStart(2, "0");
	const minutes = Math.floor((time % 3600) / 60)
		.toString()
		.padStart(2, "0");
	const seconds = Math.floor(time % 60)
		.toString()
		.padStart(2, "0");

	return hours !== "00" || forceShowHours ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

export function touchPlayer() {
	const player = videoPlayer.player;
	if (!player) return false;

	const rect = player.getBoundingClientRect();
	if (rect.width <= 2 || rect.height <= 2) return false;

	touchPlayerMoveIndex = (touchPlayerMoveIndex + 1) % 4;
	const clientX = Math.min(
		Math.max(Math.round(rect.left + rect.width / 2) + (touchPlayerMoveIndex % 2 === 0 ? -1 : 1), Math.ceil(rect.left + 1)),
		Math.floor(rect.right - 1),
	);
	const clientY = Math.min(
		Math.max(Math.round(rect.top + rect.height * 0.35) + (touchPlayerMoveIndex < 2 ? -1 : 1), Math.ceil(rect.top + 1)),
		Math.floor(rect.bottom - 1),
	);

	player.dispatchEvent(
		new MouseEvent("mousemove", {
			bubbles: true,
			cancelable: false,
			composed: true,
			view: window,
			clientX,
			clientY,
			button: 0,
			buttons: 0,
		}),
	);
	return true;
}
