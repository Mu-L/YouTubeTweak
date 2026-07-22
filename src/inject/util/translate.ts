import config from "../config";

export type TextSegment = {
	leading: string;
	source: string;
	trailing: string;
};

export function getTargetLanguage() {
	const language = config.get("comment.targetLanguage");
	return language === "auto" ? window.yt?.config_?.HL || "zh_TW" : language;
}

export function isTargetLanguage(language: string | undefined, targetLanguage: string) {
	return language?.split(/[-_*]/)[0].toLowerCase() === targetLanguage.split(/[-_*]/)[0].toLowerCase();
}

export function shouldSkipAutoTranslation(language: string | undefined, targetLanguage: string) {
	return (
		isTargetLanguage(language, targetLanguage) ||
		config.get("comment.neverTranslateLanguages", []).some((neverTranslateLanguage) =>
			isTargetLanguage(language, neverTranslateLanguage),
		)
	);
}

export function escapeTextForTranslate(text: string) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\r\n|\r|\n/g, "<br/>");
}

export function createTextSegment(text: string): TextSegment {
	if (text.trim() === "") return { leading: text, source: "", trailing: "" };

	const leading = text.match(/^\s*/)?.[0] ?? "";
	const trailing = text.match(/\s*$/)?.[0] ?? "";
	return {
		leading,
		source: text.slice(leading.length, text.length - trailing.length),
		trailing,
	};
}

export function decodeHtmlEntities(text: string) {
	return text.replace(/&(amp|lt|gt|quot|apos|nbsp|#(\d+)|#x([\da-f]+));/gi, (entity, name, decimal, hexadecimal) => {
		if (decimal || hexadecimal) {
			const codePoint = Number.parseInt(decimal || hexadecimal, decimal ? 10 : 16);
			return codePoint <= 0x10ffff && (codePoint < 0xd800 || codePoint > 0xdfff) ? String.fromCodePoint(codePoint) : entity;
		}

		switch (name.toLowerCase()) {
			case "amp":
				return "&";
			case "lt":
				return "<";
			case "gt":
				return ">";
			case "quot":
				return '"';
			case "apos":
				return "'";
			case "nbsp":
				return "\u00a0";
			default:
				return entity;
		}
	});
}

export function translatedHtmlToText(html: string, lineBreak = "\n") {
	return decodeHtmlEntities(html.replace(/<br\s*\/?>/gi, lineBreak).replace(/<[^>]+>/g, ""));
}

export function getImageSrc(image: HTMLImageElement | undefined) {
	return (
		image?.currentSrc ||
		image?.src ||
		image?.getAttribute("src") ||
		image?.getAttribute("data-src") ||
		image?.getAttribute("data-thumb") ||
		""
	);
}

export function getImageSrcset(image: HTMLImageElement | undefined) {
	return image?.srcset || image?.getAttribute("srcset") || image?.getAttribute("data-srcset") || "";
}

export async function googleTranslate(text: string | string[], srcLang: string, targetLang: string): Promise<[string[], string[]]> {
	const response = await fetch("https://translate-pa.googleapis.com/v1/translateHtml", {
		headers: {
			"content-type": "application/json+protobuf",
			"x-goog-api-key": "AIzaSyATBXajvzQLTDHEQbcpq0Ihe0vWDHmO520",
		},
		body: JSON.stringify([[typeof text === "string" ? [text] : text, srcLang, targetLang], "te_lib"]),
		method: "POST",
	});
	const data = await response.json();
	if (typeof data?.[0] === "number") throw new Error(`Translation API error (${data[0]}): ${data[1]}`);
	if (!Array.isArray(data?.[0])) throw new Error("Invalid translation response");

	return [data[0], Array.isArray(data[1]) ? data[1] : []];
}
