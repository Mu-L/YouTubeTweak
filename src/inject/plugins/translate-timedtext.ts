import { createLogger } from "@/logger";
import type { Plugin } from "../types";
import xmlHttpRequestHooker from "../xmlHttpRequestHooker";
import {
	escapeTextForTranslate,
	getTargetLanguage,
	googleTranslate,
	shouldSkipAutoTranslation,
	translatedHtmlToText,
} from "../util/translate";
import config from "../config";
import { videoPlayer } from "../mainWorld";

const logger = createLogger("Translate-timedtext");
const TIMEDTEXT_TRANSLATE_MAX_TEXT_LENGTH = 30000;
const textEncoder = new TextEncoder();

type TimedtextResponse = {
	pens?: Array<{
		foForeAlpha?: number;
	}>;
	wpWinPositions: Array<{
		rcRows: number;
	}>;
	events?: Array<{
		dDurationMs: number;
		tStartMs: number;
		segs?: Array<{
			utf8: string;
			pPenId?: number;
		}>;
	}>;
};

async function translateTimedtextItems(texts: string[], srcLang: string, targetLanguage: string) {
	if (texts.length === 0) return [];

	const batches: string[][] = [];
	let batch: string[] = [];
	let batchTextLength = 0;

	for (const text of texts) {
		const textLength = textEncoder.encode(text).length;
		if (textLength > TIMEDTEXT_TRANSLATE_MAX_TEXT_LENGTH) {
			throw new Error(`Single timedtext item exceeds translate text length limit: ${textLength}`);
		}

		if (batch.length > 0 && batchTextLength + textLength > TIMEDTEXT_TRANSLATE_MAX_TEXT_LENGTH) {
			batches.push(batch);
			batch = [];
			batchTextLength = 0;
		}

		batch.push(text);
		batchTextLength += textLength;
	}

	if (batch.length > 0) {
		batches.push(batch);
	}

	const batchResults = await Promise.all(
		batches.map(async (batch) => {
			const result = await googleTranslate(batch, srcLang, targetLanguage);
			return batch.map((source, index) => (typeof result[0][index] === "string" ? result[0][index] : source));
		}),
	);

	return batchResults.flat();
}

function refreshSubtitles() {
	if (!videoPlayer.player?.isSubtitlesOn()) return;

	videoPlayer.player.toggleSubtitles();
	setTimeout(() => videoPlayer.player?.toggleSubtitlesOn(), 100);
}

export default {
	"translate.enable.timedtext": {
		options: {
			reloadOnToggle: true,
		},
		enable() {
			xmlHttpRequestHooker.addHook("translateTimedtext", {
				match: "/api/timedtext",
				mutator: true,
				async handler(data: TimedtextResponse, url) {
					if (!data || typeof data !== "object") {
						return data;
					}

					const urlObj = new URL(url);
					const srcLang = urlObj.searchParams.get("lang") || "auto";
					const targetLanguage = getTargetLanguage();

					if (shouldSkipAutoTranslation(srcLang, targetLanguage)) {
						return data;
					}

					if (!Array.isArray(data.events) || data.events.length === 0) {
						return data;
					}

					const needTranslateList = data.events.map((event) => {
						const text = Array.isArray(event.segs)
							? escapeTextForTranslate(event.segs.map((segment) => segment.utf8).join(""))
							: "";
						return text.trim() ? text : "---";
					});

					if (srcLang === "ja") {
						needTranslateList.forEach((text, index) => {
							const lines = text.split("<br/>");
							if (lines.length >= 2 && /[a-z ]/i.test(lines[lines.length - 1])) {
								needTranslateList[index] = lines.slice(0, -1).join("<br/>");
							}
						});
					}

					let translatedTexts: string[];
					try {
						translatedTexts = await translateTimedtextItems(needTranslateList, srcLang, targetLanguage);
					} catch (e) {
						logger.warn("Timedtext translation failed:", e);
						return data;
					}

					const isTranslationOnly = config.get("translate.timedtext.mode", "bilingual") === "translationOnly";
					const isAsr = urlObj.searchParams.get("kind") === "asr";

					for (const [index, event] of data.events.entries()) {
						try {
							if (!event.segs?.[0]) {
								continue;
							}

							const translatedText = translatedHtmlToText(translatedTexts[index], "").replace("---", "");
							const sourceSegment = event.segs.find((segment) => {
								if (segment.pPenId === undefined) return false;
								const pen = data.pens?.[segment.pPenId];
								return pen?.foForeAlpha !== 0 && segment.utf8.replace(/[\s\u200B-\u200D\uFEFF]/g, "");
							});

							const pPenId = sourceSegment?.pPenId;

							if (isAsr) {
								if (isTranslationOnly) {
									event.segs = [
										{
											utf8: translatedText,
											pPenId,
										},
									];
								} else {
									event.segs.unshift({
										utf8: translatedText + "\n",
										pPenId,
									});
								}
							} else {
								if (isTranslationOnly) {
									event.segs = [
										{
											utf8: translatedText,
											pPenId,
										},
									];
								} else {
									event.segs.unshift({
										utf8: translatedText + "\n",
										pPenId,
									});
								}
							}
						} catch (e) {
							logger.error("Error while processing timedtext event:", e, event, translatedTexts[index]);
						}
					}

					if ((urlObj.searchParams.get("xoaf") || "5") === "7") {
						if (data?.wpWinPositions?.[1]?.rcRows === 2) {
							data.wpWinPositions[1].rcRows = 3;
						}
					}

					logger.debug("Timedtext translation completed:", {
						srcLang,
						targetLanguage,
						originalTexts: needTranslateList,
						translatedTexts,
						data,
					});

					return data;
				},
			});

			refreshSubtitles();
		},
		disable() {
			delete xmlHttpRequestHooker.hooks["translateTimedtext"];
			refreshSubtitles();
		},
	},
} as Record<string, Plugin>;
