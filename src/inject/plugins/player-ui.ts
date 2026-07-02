import { bodyClass, secToMMDD } from "../util/helper";
import type { Plugin } from "../types";
import { videoPlayer } from "../mainWorld";
import config from "../config";
import type { Config, PlayerHideButtonMode } from "@/defaultConfig";

let progress: HTMLDivElement;
let progressPercent: HTMLDivElement;
let progressTag: HTMLDivElement;

type ProgressTagPosition = "bottom-left" | "bottom-right" | "top-left" | "top-right";

const MIN_PROGRESS_TAG_FONT_SIZE = 8;
const MAX_PROGRESS_TAG_FONT_SIZE = 48;
const MIN_PROGRESS_TAG_OFFSET = 0;
const MAX_PROGRESS_TAG_OFFSET = 200;
const BUTTON_VISIBILITY_CLASSES: Array<[keyof Config, string, string]> = [
	["player.ui.hideButton.autoplay", "yttweak-hide-button-autoplay", "yttweak-show-button-autoplay"],
	["player.ui.hideButton.subtitles", "yttweak-hide-button-subtitles", "yttweak-show-button-subtitles"],
	["player.ui.hideButton.settings", "yttweak-hide-button-settings", "yttweak-show-button-settings"],
	["player.ui.hideButton.miniPlayer", "yttweak-hide-button-miniPlayer", "yttweak-show-button-miniPlayer"],
	["player.ui.hideButton.pip", "yttweak-hide-button-pip", "yttweak-show-button-pip"],
	["player.ui.hideButton.size", "yttweak-hide-button-size", "yttweak-show-button-size"],
	["player.ui.hideButton.remote", "yttweak-hide-button-remote", "yttweak-show-button-remote"],
	["player.ui.hideButton.fullscreen", "yttweak-hide-button-fullscreen", "yttweak-show-button-fullscreen"],
];
const MIN_PROGRESS_HEIGHT = 1;
const MAX_PROGRESS_HEIGHT = 20;

let videoProgressTimer: number | null = null;
function registerVideoProgressTimer() {
	if (videoProgressTimer) {
		clearInterval(videoProgressTimer);
	}
	videoProgressTimer = window.setInterval(() => {
		if (videoPlayer?.player) {
			const duration = videoPlayer.videoStream?.duration || 0;
			const currentTime = videoPlayer.videoStream?.currentTime || 0;
			const percent = (currentTime / duration) * 100;
			if (progress) {
				progressPercent.style.width = `${percent}%`;
			}
			if (progressTag) {
				let t = document.querySelector("#movie_player .ytp-live")
					? `${secToMMDD(currentTime, currentTime > 3600)}`
					: `${secToMMDD(currentTime, duration > 3600)}/${secToMMDD(duration)}`;
				if (progressTag.innerText !== t) progressTag.innerText = t;
			}
		}
	}, 300);
}

function updateProgressStyle() {
	if (!progress) return;

	let height = Number(config.get("player.ui.progress.height", 2));
	if (!Number.isFinite(height)) {
		height = 2;
	}
	height = Math.min(Math.max(height, MIN_PROGRESS_HEIGHT), MAX_PROGRESS_HEIGHT);

	progress.style.setProperty("--yttweak-progress-height", `${height}px`);
}

function updateProgressTagStyle() {
	if (!progressTag) return;

	const position = config.get("player.ui.progress.tagPosition", "bottom-left") as ProgressTagPosition;
	let fontSize = Number(config.get("player.ui.progress.tagFontSize", 12));
	fontSize = Math.min(Math.max(fontSize, MIN_PROGRESS_TAG_FONT_SIZE), MAX_PROGRESS_TAG_FONT_SIZE);

	let offset = Number(config.get("player.ui.progress.tagOffset", 5));
	if (!Number.isFinite(offset)) {
		offset = 5;
	}
	offset = Math.min(Math.max(offset, MIN_PROGRESS_TAG_OFFSET), MAX_PROGRESS_TAG_OFFSET);

	progressTag.style.setProperty("--yttweak-progress-tag-font-size", `${fontSize}px`);
	progressTag.style.setProperty("--yttweak-progress-tag-offset", `${offset}px`);

	const isTop = position.startsWith("top");
	const isLeft = position.endsWith("left");

	progressTag.style.setProperty("--yttweak-progress-tag-top", isTop ? `var(--yttweak-progress-tag-offset)` : "auto");
	progressTag.style.setProperty("--yttweak-progress-tag-bottom", isTop ? "auto" : `var(--yttweak-progress-tag-offset)`);
	progressTag.style.setProperty("--yttweak-progress-tag-left", isLeft ? `var(--yttweak-progress-tag-offset)` : "auto");
	progressTag.style.setProperty("--yttweak-progress-tag-right", isLeft ? "auto" : `var(--yttweak-progress-tag-offset)`);
}

function syncButtonVisibility() {
	for (const [key, hideClassName, showClassName] of BUTTON_VISIBILITY_CLASSES) {
		const mode = config.get(key) as PlayerHideButtonMode | boolean;
		document.body.classList.toggle(hideClassName, mode === "hide" || mode === true);
		document.body.classList.toggle(showClassName, mode === "show");
	}
}

export default {
	"player.ui.hideButton": {
		setup: syncButtonVisibility,
		configUpdate(oldConfig: Partial<Config>, newConfig: Partial<Config>) {
			if (BUTTON_VISIBILITY_CLASSES.some(([key]) => oldConfig[key] !== newConfig[key])) {
				syncButtonVisibility();
			}
			return false;
		},
	},
	"player.ui.hideCeElement": bodyClass("yttweak-hide-ce_element"),
	"player.ui.progress.enable": {
		videoSrcChange() {
			registerVideoProgressTimer();
		},
		initPlayer() {
			if (!progress) {
				progress = document.createElement("div");
				progress.className = "yttweak-player-progress";

				progressPercent = document.createElement("div");
				progressPercent.className = "yttweak-player-progress-percent";
				progress.appendChild(progressPercent);

				videoPlayer.player?.appendChild(progress);
				updateProgressStyle();
			}
		},
		enable() {
			document.body.classList.add("yttweak-player-progress-enable");
			updateProgressStyle();
		},
		disable() {
			document.body.classList.remove("yttweak-player-progress-enable");
		},
		configUpdate(oldConfig, newConfig) {
			const heightChanged = oldConfig["player.ui.progress.height"] !== newConfig["player.ui.progress.height"];

			if (heightChanged) {
				updateProgressStyle();
			}

			return false;
		},
	},
	"player.ui.progress.enableTag": {
		videoSrcChange() {
			registerVideoProgressTimer();
		},
		initPlayer() {
			if (!progressTag) {
				progressTag = document.createElement("div");
				progressTag.className = "yttweak-player-progress-tag";
				progressTag.innerText = "00:00/00:00";
				videoPlayer.player?.appendChild(progressTag);
				updateProgressTagStyle();
			}
		},
		enable() {
			document.body.classList.add("yttweak-player-progress-enable-tag");
			updateProgressTagStyle();
		},
		disable() {
			document.body.classList.remove("yttweak-player-progress-enable-tag");
		},
		configUpdate(oldConfig, newConfig) {
			const fontChanged = oldConfig["player.ui.progress.tagFontSize"] !== newConfig["player.ui.progress.tagFontSize"];
			const positionChanged = oldConfig["player.ui.progress.tagPosition"] !== newConfig["player.ui.progress.tagPosition"];
			const offsetChanged = oldConfig["player.ui.progress.tagOffset"] !== newConfig["player.ui.progress.tagOffset"];

			if (fontChanged || positionChanged || offsetChanged) {
				updateProgressTagStyle();
			}

			return false;
		},
	},
} as Record<string, Plugin>;
