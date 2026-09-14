import { INSIGHTS_LANGUAGES } from "./insightsLanguages";

export type LanguageVersion = {
	videoId: string;
	language: string;
	title: string;
	description: string;
	thumbnail: string;
	thumbnailHash?: string;
};

type CachedLanguageVersion = LanguageVersion & { fetchedAt: number };
const CACHE_PREFIX = "insights-language-versions:v1:";

function isValidCacheEntry(
	entry: any,
	videoId: string,
	language: string,
	now: number,
	includeExpired = false,
): entry is CachedLanguageVersion {
	if (
		!entry ||
		typeof entry !== "object" ||
		entry.videoId !== videoId ||
		entry.language !== language ||
		typeof entry.title !== "string" ||
		!entry.title.trim() ||
		typeof entry.description !== "string" ||
		typeof entry.thumbnail !== "string" ||
		(entry.thumbnailHash !== undefined && (typeof entry.thumbnailHash !== "string" || !/^[a-f0-9]{64}$/i.test(entry.thumbnailHash))) ||
		!Number.isFinite(entry.fetchedAt) ||
		entry.fetchedAt <= 0 ||
		entry.fetchedAt > now ||
		(!includeExpired && now - entry.fetchedAt >= 60 * 60 * 1000)
	) {
		return false;
	}
	if (!entry.thumbnail) return true;
	try {
		const thumbnail = new URL(entry.thumbnail);
		return ["https:", "http:"].includes(thumbnail.protocol) && !thumbnail.username && !thumbnail.password;
	} catch {
		return false;
	}
}

function parseCacheRecord(raw: string | null, videoId: string, now: number, includeExpired = false): Record<string, CachedLanguageVersion> {
	let record;
	try {
		record = raw ? JSON.parse(raw) : {};
	} catch (error) {
		console.warn("Unable to parse language versions cache:", error);
		return {};
	}
	if (!record || typeof record !== "object" || Array.isArray(record)) return {};
	return Object.fromEntries(
		INSIGHTS_LANGUAGES.flatMap((language) => {
			const entry = record[language];
			if (!isValidCacheEntry(entry, videoId, language, now, includeExpired)) return [];
			return [
				[
					language,
					{
						videoId,
						language,
						title: entry.title,
						description: entry.description,
						thumbnail: entry.thumbnail,
						...(entry.thumbnailHash && { thumbnailHash: entry.thumbnailHash }),
						fetchedAt: entry.fetchedAt,
					},
				],
			];
		}),
	);
}

export function readLanguageVersionsCache(videoId: string): LanguageVersion[] {
	if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return [];
	try {
		return Object.values(parseCacheRecord(localStorage.getItem(CACHE_PREFIX + videoId), videoId, Date.now())).map(
			({ fetchedAt: _fetchedAt, ...version }) => version,
		);
	} catch (error) {
		console.warn("Unable to read language versions cache:", error);
		return [];
	}
}

export function cacheLanguageVersion(result: LanguageVersion): void {
	try {
		const now = Date.now();
		if (
			!/^[a-zA-Z0-9_-]{11}$/.test(result.videoId) ||
			!INSIGHTS_LANGUAGES.some((language) => language === result.language) ||
			!isValidCacheEntry({ ...result, fetchedAt: now }, result.videoId, result.language, now)
		) {
			return;
		}
		const record = parseCacheRecord(localStorage.getItem(CACHE_PREFIX + result.videoId), result.videoId, now, true);
		record[result.language] = {
			videoId: result.videoId,
			language: result.language,
			title: result.title,
			description: result.description,
			thumbnail: result.thumbnail,
			...(result.thumbnailHash && { thumbnailHash: result.thumbnailHash }),
			fetchedAt: now,
		};
		localStorage.setItem(CACHE_PREFIX + result.videoId, JSON.stringify(record));
	} catch (error) {
		console.warn("Unable to save language versions cache:", error);
	}
}

export function renewLanguageVersionsCache(videoId: string, openedAt = Date.now()): void {
	if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return;
	try {
		const now = Date.now();
		if (!Number.isFinite(openedAt) || openedAt <= 0 || openedAt > now || now - openedAt >= 60 * 60 * 1000) return;
		const record = parseCacheRecord(localStorage.getItem(CACHE_PREFIX + videoId), videoId, now);
		let changed = false;
		for (const entry of Object.values(record)) {
			if (entry.fetchedAt >= openedAt) continue;
			entry.fetchedAt = openedAt;
			changed = true;
		}
		if (changed) localStorage.setItem(CACHE_PREFIX + videoId, JSON.stringify(record));
	} catch (error) {
		console.warn("Unable to renew language versions cache:", error);
	}
}

export function cleanupLanguageVersionsCache(): void {
	try {
		const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key): key is string =>
			Boolean(key?.startsWith(CACHE_PREFIX)),
		);
		const now = Date.now();
		for (const key of keys) {
			try {
				const videoId = key.slice(CACHE_PREFIX.length);
				const raw = localStorage.getItem(key);
				const record = /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? parseCacheRecord(raw, videoId, now) : {};
				if (!Object.keys(record).length) {
					localStorage.removeItem(key);
				} else {
					const cleaned = JSON.stringify(record);
					if (cleaned !== raw) localStorage.setItem(key, cleaned);
				}
			} catch (error) {
				console.warn("Unable to clean a language versions cache record:", error);
			}
		}
	} catch (error) {
		console.warn("Unable to clean language versions cache:", error);
	}
}
