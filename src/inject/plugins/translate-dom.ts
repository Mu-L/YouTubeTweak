import config from "../config";
import type { Plugin } from "../types";
import {
	createTextSegment,
	decodeHtmlEntities,
	escapeTextForTranslate,
	getImageSrc,
	getImageSrcset,
	getTargetLanguage,
	googleTranslate,
	isTargetLanguage,
	translatedHtmlToText,
	type TextSegment,
} from "../util/translate";

const NON_TRANSLATABLE_SELECTOR = "a, img, picture, svg, yt-icon, button, input, textarea, select, video, audio, canvas, iframe";
const descriptionTranslations = new Map<"snippet" | "expanded", { key: string; translation?: HTMLElement }>();

async function translatePlainText(source: string, targetLanguage: string) {
	const [translations, detectedLanguages] = await googleTranslate(source, "auto", targetLanguage);
	const translation = decodeHtmlEntities(translations[0] ?? "").trim();
	if (!translation || translation === source || isTargetLanguage(detectedLanguages[0], targetLanguage)) return;
	return translation;
}

async function translateVideoTitle(metadata: HTMLElement) {
	const title = metadata.querySelector<HTMLElement>("#title h1 yt-formatted-string");
	const source = title?.innerText.trim();
	if (!title || !source) return;

	const targetLanguage = getTargetLanguage();
	const key = `${targetLanguage}\n${source}`;
	if (title.dataset.yttweakTranslation === key) return;

	title.dataset.yttweakTranslation = key;
	const h1 = title.parentElement;
	h1?.querySelector(":scope > .yttweak-video-title-translate")?.remove();
	h1?.classList.remove("yttweak-video-title-translated");

	try {
		const translatedText = await translatePlainText(source, targetLanguage);
		if (title.dataset.yttweakTranslation !== key || title.innerText.trim() !== source || !translatedText) return;

		const translation = document.createElement("span");
		translation.className = "yttweak-video-title-translate";
		translation.textContent = translatedText;
		title.after(translation);
		h1?.classList.add("yttweak-video-title-translated");
	} catch {
		if (title.dataset.yttweakTranslation === key) delete title.dataset.yttweakTranslation;
	}
}

async function translateVideoSummary(metadata: HTMLElement) {
	const summary = metadata.querySelector<HTMLElement>("#video-summary");
	const content = summary?.querySelector<HTMLElement>("#content");
	const collapsedTitle = summary?.querySelector<HTMLElement>("#collapsed-title");
	const source = content?.querySelector<HTMLElement>(".videoSummaryContentViewModelParagraphContainer");
	const sourceText = source?.innerText.trim();
	if (!summary || !content || !collapsedTitle || !source || !sourceText) return;

	if (!content.dataset.yttweakTranslationHooked) {
		content.dataset.yttweakTranslationHooked = "true";
		new MutationObserver(() => {
			const translation = summary.querySelector<HTMLElement>(".yttweak-video-summary-translate-collapsed");
			if (translation) translation.hidden = !content.hidden;
		}).observe(content, {
			attributes: true,
			attributeFilter: ["hidden"],
		});
	}

	const targetLanguage = getTargetLanguage();
	const key = `${targetLanguage}\n${sourceText}`;
	const currentExpandedTranslation = summary.querySelector(".yttweak-video-summary-translate-expanded");
	const currentCollapsedTranslation = summary.querySelector<HTMLElement>(".yttweak-video-summary-translate-collapsed");
	if (source.dataset.yttweakTranslation === key) {
		if (currentCollapsedTranslation) currentCollapsedTranslation.hidden = !content.hidden;
		return;
	}

	source.dataset.yttweakTranslation = key;
	currentExpandedTranslation?.remove();
	currentCollapsedTranslation?.remove();

	try {
		const translatedText = await translatePlainText(sourceText, targetLanguage);
		if (source.dataset.yttweakTranslation !== key || source.innerText.trim() !== sourceText || !source.isConnected || !translatedText) {
			return;
		}

		const expandedTranslation = document.createElement("span");
		expandedTranslation.className = "yttweak-video-description-translate yttweak-video-summary-translate-expanded";
		expandedTranslation.textContent = translatedText;
		source.after(expandedTranslation);

		const collapsedTranslation = document.createElement("span");
		collapsedTranslation.className = "yttweak-video-summary-translate-collapsed";
		collapsedTranslation.textContent = translatedText;
		collapsedTranslation.hidden = !content.hidden;
		collapsedTitle.after(collapsedTranslation);
	} catch {
		if (source.dataset.yttweakTranslation === key) delete source.dataset.yttweakTranslation;
	}
}

async function createRichTextTranslation(source: HTMLElement, targetLanguage: string) {
	const translation = source.cloneNode(true) as HTMLElement;
	translation.removeAttribute("id");
	translation.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));

	const segments: Array<[Text, TextSegment]> = [];
	const walker = document.createTreeWalker(translation, NodeFilter.SHOW_TEXT);
	while (walker.nextNode()) {
		const node = walker.currentNode as Text;
		const segment = createTextSegment(node.data);
		if (segment.source && !node.parentElement?.closest(NON_TRANSLATABLE_SELECTOR)) segments.push([node, segment]);
	}
	if (segments.length === 0) return null;

	const [translations, detectedLanguages] = await googleTranslate(
		segments.map(([, segment]) => escapeTextForTranslate(segment.source)),
		"auto",
		targetLanguage,
	);

	let changed = false;
	segments.forEach(([node, segment], index) => {
		const translatedText = translatedHtmlToText(translations[index] ?? "").trim();
		if (!translatedText || translatedText === segment.source || isTargetLanguage(detectedLanguages[index], targetLanguage)) return;

		node.data = segment.leading + translatedText + segment.trailing;
		changed = true;
	});

	return changed ? translation : null;
}

function syncRichTextImages(source: HTMLElement, translation: HTMLElement) {
	const sourceImages = source.querySelectorAll<HTMLImageElement>("img");
	translation.querySelectorAll<HTMLImageElement>("img").forEach((image, index) => {
		const syncImage = () => {
			const src = getImageSrc(sourceImages[index]);
			const srcset = getImageSrcset(sourceImages[index]);
			if (src) image.src = src;
			if (srcset) image.srcset = srcset;
			if (!src && !srcset) return false;

			image.loading = "eager";
			image.classList.add("ytCoreImageLoaded");
			return true;
		};
		if (!syncImage()) sourceImages[index]?.addEventListener("load", syncImage, { once: true });
	});
}

function mountDescriptionTranslation(branch: HTMLElement, translation: HTMLElement) {
	if (branch.id === "snippet") {
		const snippetText = branch.querySelector<HTMLElement>(":scope > #snippet-text");
		if (!snippetText) return;

		snippetText.append(translation);
		branch.classList.add("yttweak-video-description-snippet-translated");
		return;
	}

	branch.append(translation);
}

async function translateDescriptionSource(expander: HTMLElement, selector: string, branchName: "snippet" | "expanded") {
	const source = expander.querySelector<HTMLElement>(selector);
	const branch = source?.closest<HTMLElement>(`#${branchName}`);
	const sourceText = source?.textContent ?? "";
	if (!source || !branch || !sourceText.trim()) return;

	const targetLanguage = getTargetLanguage();
	const key = `${new URL(location.href).searchParams.get("v")}\n${targetLanguage}${branchName === "expanded" ? `\n${sourceText}` : ""}`;
	const previousTranslation = descriptionTranslations.get(branchName);
	if (previousTranslation?.key === key) {
		if (previousTranslation.translation && !branch.contains(previousTranslation.translation)) {
			syncRichTextImages(source, previousTranslation.translation);
			mountDescriptionTranslation(branch, previousTranslation.translation);
		}
		return;
	}

	const state = { key, translation: undefined as HTMLElement | undefined };
	descriptionTranslations.set(branchName, state);
	const translationClass = `yttweak-video-description-translate-${branchName}`;
	expander.querySelector(`.${translationClass}`)?.remove();

	if (branchName === "snippet" && !expander.style.getPropertyValue("--yttweak-video-description-expand-left")) {
		const expandLeft = expander.querySelector<HTMLElement>(":scope > #expand")?.style.left;
		if (expandLeft) expander.style.setProperty("--yttweak-video-description-expand-left", expandLeft);
	}

	try {
		const translation = await createRichTextTranslation(source, targetLanguage);
		if (descriptionTranslations.get(branchName) !== state || !translation) return;

		state.translation = translation;
		translation.classList.add("yttweak-video-description-translate", translationClass);
		const currentSource = expander.querySelector<HTMLElement>(selector);
		const currentBranch = currentSource?.closest<HTMLElement>(`#${branchName}`);
		if (currentSource && currentBranch) {
			syncRichTextImages(currentSource, translation);
			mountDescriptionTranslation(currentBranch, translation);
		}
	} catch {
		if (descriptionTranslations.get(branchName) === state) descriptionTranslations.delete(branchName);
	}
}

function translateWatchMetadata(metadata: HTMLElement) {
	if (config.get("translate.enable.videoTitle")) void translateVideoTitle(metadata);
	if (config.get("translate.enable.videoSummary")) void translateVideoSummary(metadata);
	if (!config.get("translate.enable.videoDescription")) return;

	const expander = metadata.querySelector<HTMLElement>("#description #description-inline-expander");
	if (!expander) return;

	void translateDescriptionSource(
		expander,
		":scope > #snippet > #snippet-text > #attributed-snippet-text > span.ytAttributedStringHost",
		"snippet",
	);
	void translateDescriptionSource(expander, ":scope > #expanded > yt-attributed-string > span.ytAttributedStringHost", "expanded");
}

export default {
	"translate.enable.videoTitle": {
		options: {
			reloadOnToggle: true,
		},
		enable() {},
		initWatchMetadata(metadata, setUpdateListener) {
			translateWatchMetadata(metadata);
			setUpdateListener(() => translateWatchMetadata(metadata));
		},
	},
	"translate.enable.videoDescription": {
		options: {
			reloadOnToggle: true,
		},
		enable() {},
	},
	"translate.enable.videoSummary": {
		options: {
			reloadOnToggle: true,
		},
		enable() {},
	},
} as Record<string, Plugin>;
