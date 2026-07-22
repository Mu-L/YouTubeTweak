import type { Config } from "@/defaultConfig";

export const READ_CHANGELOG_VERSION_STORAGE_KEY = "readChangelogVersion";
export const CHANGELOG_URL = "https://raw.githubusercontent.com/xlch88/YouTubeTweak/refs/heads/main/changelog.json";

const VERSION_NOTICE_POPUP_URL = "popup.html?action=popup&tab=general&changelog=1";
const BADGE_TEXT = "new";
const BADGE_BACKGROUND_COLOR = "#ff9800";
const BADGE_TEXT_COLOR = "#ffffff";

function getActionApi() {
	return browser.action || browser.browserAction;
}

function getFeatureVersion(version: string) {
	return version.split(/[.-]/).slice(0, 3).join(".");
}

export function compareVersions(left: string, right: string) {
	const leftParts = left.split(/[.-]/);
	const rightParts = right.split(/[.-]/);
	for (let i = 0; i < Math.max(leftParts.length, rightParts.length); i++) {
		const leftValue = Number(leftParts[i] || 0);
		const rightValue = Number(rightParts[i] || 0);
		if ((Number.isFinite(leftValue) ? leftValue : 0) > (Number.isFinite(rightValue) ? rightValue : 0)) return 1;
		if ((Number.isFinite(leftValue) ? leftValue : 0) < (Number.isFinite(rightValue) ? rightValue : 0)) return -1;
	}
	return 0;
}

export async function syncVersionNoticeBadge() {
	const actionApi = getActionApi();
	const [changelogData, settingsData] = await Promise.all([
		browser.storage.local.get(READ_CHANGELOG_VERSION_STORAGE_KEY),
		browser.storage.sync.get("settings"),
	]);
	const appVersion = browser.runtime.getManifest().version;
	const readChangelogVersion = changelogData[READ_CHANGELOG_VERSION_STORAGE_KEY];
	const hasUnreadChangelog =
		(settingsData.settings as Partial<Config> | undefined)?.["yttweak.disableUpdateNotice"] !== true &&
		(typeof readChangelogVersion !== "string" || getFeatureVersion(readChangelogVersion) !== getFeatureVersion(appVersion));

	await actionApi.setBadgeText({ text: hasUnreadChangelog ? BADGE_TEXT : "" }).catch(() => {});
	await actionApi
		.setPopup({
			popup: hasUnreadChangelog ? VERSION_NOTICE_POPUP_URL : "popup.html",
		})
		.catch(() => {});

	if (!hasUnreadChangelog) return;

	await actionApi.setBadgeBackgroundColor({ color: BADGE_BACKGROUND_COLOR }).catch(() => {});
	if ("setBadgeTextColor" in actionApi) {
		await actionApi.setBadgeTextColor({ color: BADGE_TEXT_COLOR }).catch(() => {});
	}
}

export async function markChangelogVersionRead() {
	await browser.storage.local.set({ [READ_CHANGELOG_VERSION_STORAGE_KEY]: browser.runtime.getManifest().version });
	await syncVersionNoticeBadge();
}
