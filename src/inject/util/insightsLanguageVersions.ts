import { youtubeiAPIv1 } from "./youtubei";

let requestPending = false;
let cooldownUntil = 0;
let cooldownReason = "";
const thumbnailHashes = new Map<string, string>();

function rendererText(value: any): string {
	if (typeof value === "string") return value;
	if (typeof value?.simpleText === "string") return value.simpleText;
	return Array.isArray(value?.runs) ? value.runs.map((run: any) => (typeof run?.text === "string" ? run.text : "")).join("") : "";
}

export function parseInsightsLanguageVersion(data: any, videoId: string, language: string) {
	const responses = Array.isArray(data) ? data : [data];
	const player = responses.find((item) => item?.playerResponse)?.playerResponse;
	const next = responses.find((item) => item?.watchNextResponse)?.watchNextResponse;
	const playerId = player?.videoDetails?.videoId;
	const nextId = next?.currentVideoEndpoint?.watchEndpoint?.videoId;
	if ((playerId && playerId !== videoId) || (nextId && nextId !== videoId)) throw new Error("video-changed");
	if (playerId !== videoId && nextId !== videoId) throw new Error("no-metadata");

	let title = "";
	let description = "";
	const queue: any[] = [next?.contents?.twoColumnWatchNextResults?.results, next?.contents?.singleColumnWatchNextResults?.results];
	for (let index = 0; index < queue.length; index++) {
		const value = queue[index];
		if (!value || typeof value !== "object") continue;
		if (!title) title = rendererText(value.videoPrimaryInfoRenderer?.title);
		if (!description) {
			description =
				rendererText(value.videoSecondaryInfoRenderer?.attributedDescription?.content) ||
				rendererText(value.videoSecondaryInfoRenderer?.description);
		}
		Object.values(value).forEach((child) => {
			if (child && typeof child === "object") queue.push(child);
		});
	}

	const microformat = player?.microformat?.playerMicroformatRenderer;
	title ||= rendererText(microformat?.title) || rendererText(player?.videoDetails?.title);
	description ||= rendererText(microformat?.description) || rendererText(player?.videoDetails?.shortDescription);
	if (!title.trim()) throw new Error("no-metadata");

	const thumbnails = [
		...(Array.isArray(microformat?.thumbnail?.thumbnails) ? microformat.thumbnail.thumbnails : []),
		...(Array.isArray(player?.videoDetails?.thumbnail?.thumbnails) ? player.videoDetails.thumbnail.thumbnails : []),
	].filter((item) => typeof item?.url === "string" && /^https?:\/\//.test(item.url));
	thumbnails.sort((a, b) => (Number(b.width) || 0) * (Number(b.height) || 0) - (Number(a.width) || 0) * (Number(a.height) || 0));

	return { videoId, language, title, description, thumbnail: thumbnails[0]?.url || "", error: null };
}

export async function getInsightsLanguageVersion(data: unknown) {
	const { videoId, language } = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
	if (
		typeof videoId !== "string" ||
		!/^[a-zA-Z0-9_-]{11}$/.test(videoId) ||
		typeof language !== "string" ||
		language.length > 35 ||
		!/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(language)
	) {
		return { error: "invalid-request" };
	}

	const page = new URL(location.href);
	if (page.pathname !== "/watch") return { error: "not-watch-page" };
	if (page.searchParams.get("v") !== videoId) return { error: "video-changed" };
	if (requestPending) return { error: "request-busy" };
	if (Date.now() < cooldownUntil) return { error: cooldownReason, retryAfterMs: cooldownUntil - Date.now() };

	requestPending = true;
	const controller = new AbortController();
	const timeout = window.setTimeout(() => controller.abort(), 10000);
	try {
		const ytcfg = (window as any).ytcfg;
		const context = ytcfg?.get("INNERTUBE_CONTEXT") || {};
		const gl = ytcfg?.get("GL") || context.client?.gl || "US";
		const response = await youtubeiAPIv1(
			"/get_watch",
			{
				context: { ...context, client: { ...context.client, hl: language, gl } },
				playerRequest: { videoId },
				watchNextRequest: { videoId },
			},
			language,
			gl,
			true,
			controller.signal,
		);
		const currentPage = new URL(location.href);
		if (currentPage.pathname !== "/watch" || currentPage.searchParams.get("v") !== videoId) {
			return { error: "video-changed" };
		}

		const responses = Array.isArray(response) ? response : [response];
		const apiError = responses.find((item) => item?.error)?.error;
		const playability = responses.find((item) => item?.playerResponse)?.playerResponse?.playabilityStatus;
		if (apiError?.code === 429 || apiError?.status === "RESOURCE_EXHAUSTED") throw new Error("rate-limited");
		if (apiError?.code === 403 || apiError?.status === "PERMISSION_DENIED" || playability?.status === "LOGIN_REQUIRED") {
			throw new Error("youtube-blocked");
		}
		if (apiError) throw new Error("request-failed");
		const version = parseInsightsLanguageVersion(response, videoId, language);
		let thumbnailHash = thumbnailHashes.get(version.thumbnail);
		if (!thumbnailHash && version.thumbnail) {
			try {
				const thumbnailUrl = new URL(version.thumbnail);
				if (
					thumbnailUrl.protocol === "https:" &&
					(thumbnailUrl.hostname === "ytimg.com" || thumbnailUrl.hostname.endsWith(".ytimg.com"))
				) {
					const image = await fetch(thumbnailUrl.href, { credentials: "omit", redirect: "error", signal: controller.signal });
					if (
						image.ok &&
						image.headers.get("content-type")?.startsWith("image/") &&
						Number(image.headers.get("content-length")) <= 2097152
					) {
						const bytes = await image.arrayBuffer();
						if (bytes.byteLength <= 2097152) {
							thumbnailHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (byte) =>
								byte.toString(16).padStart(2, "0"),
							).join("");
							if (thumbnailHashes.size >= 64) thumbnailHashes.delete(thumbnailHashes.keys().next().value!);
							thumbnailHashes.set(version.thumbnail, thumbnailHash);
						}
					}
				}
			} catch {
				// CORS or an image timeout must not discard the localized text already received.
			}
		}
		const completedPage = new URL(location.href);
		if (completedPage.pathname !== "/watch" || completedPage.searchParams.get("v") !== videoId) {
			return { error: "video-changed" };
		}
		return { ...version, ...(thumbnailHash && { thumbnailHash }) };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (/\b429\b/.test(message) || message === "rate-limited") {
			cooldownReason = "rate-limited";
			cooldownUntil = Date.now() + 60000;
			return { error: cooldownReason, retryAfterMs: 60000 };
		}
		if (/\b403\b/.test(message) || message === "youtube-blocked") {
			cooldownReason = "youtube-blocked";
			cooldownUntil = Date.now() + 60000;
			return { error: cooldownReason, retryAfterMs: 60000 };
		}
		return {
			error: controller.signal.aborted
				? "request-timeout"
				: ["video-changed", "no-metadata"].includes(message)
					? message
					: "request-failed",
		};
	} finally {
		window.clearTimeout(timeout);
		requestPending = false;
	}
}
