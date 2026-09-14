<template>
	<div class="language-versions">
		<p class="language-warning">{{ $t("insights.label.languageVersions.warning") }}</p>
		<p class="language-hint">{{ $t("insights.label.languageVersions.orderHint") }}</p>
		<div v-if="versions.length" class="version-results">
			<section v-if="thumbnailVersions.length" class="thumbnail-versions">
				<h3 class="versions-section-title">{{ $t("insights.label.languageVersions.thumbnails") }}</h3>
				<figure v-for="version in thumbnailVersions" :key="version.key">
					<a :href="version.thumbnail" target="_blank" rel="noopener noreferrer">
						<img :src="version.thumbnail" :alt="$t('insights.label.languageVersions.thumbnails')" loading="lazy" />
					</a>
					<figcaption class="version-languages">
						<span class="languages-label">{{ $t("insights.label.languageVersions.languages") }}</span>
						<span v-for="language in version.languages" :key="language" :title="language">{{
							languageNames.get(language) || language
						}}</span>
					</figcaption>
				</figure>
			</section>
			<section class="text-versions">
				<h3 class="versions-section-title">{{ $t("insights.label.languageVersions.textVersions") }}</h3>
				<details v-for="version in textVersions" :key="version.key" class="text-version" :open="expandedText === version.key">
					<summary @click.prevent="expandedText = expandedText === version.key ? '' : version.key">
						<span class="text-heading">
							<span class="text-title" dir="auto">{{ version.title }}</span>
							<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
								<path d="m4 2 4 4-4 4" />
							</svg>
						</span>
						<span class="version-languages">
							<span class="languages-label">{{ $t("insights.label.languageVersions.languages") }}</span>
							<span v-for="language in version.languages" :key="language" :title="language">{{
								languageNames.get(language) || language
							}}</span>
						</span>
					</summary>
					<p dir="auto">{{ version.description || $t("insights.label.languageVersions.noDescription") }}</p>
				</details>
			</section>
		</div>
		<div
			class="language-selection"
			@focusout="!($event.currentTarget as HTMLElement).contains($event.relatedTarget as Node | null) && (languagePickerOpen = false)"
			@keydown.esc.stop.prevent="
				languagePickerOpen = false;
				languagePickerButton?.focus();
			"
		>
			<button
				ref="languagePickerButton"
				class="language-picker-toggle"
				type="button"
				:disabled="busy || complete"
				:aria-expanded="languagePickerOpen"
				:aria-controls="`${descriptionId}-languages`"
				@click="languagePickerOpen = !languagePickerOpen"
			>
				<span>{{ $t("insights.label.languageVersions.selectLanguages") }}</span>
				<span class="selected-count">{{ pendingLanguages.length }}</span>
				<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path d="m2.5 4 3.5 3.5L9.5 4" />
				</svg>
			</button>
			<div v-if="languagePickerOpen" :id="`${descriptionId}-languages`" class="language-picker-options">
				<select
					v-model="selectedLanguages"
					multiple
					:size="Math.min(8, remainingLanguages.length)"
					:aria-label="$t('insights.label.languageVersions.selectLanguages')"
					:disabled="busy"
				>
					<option v-for="language in remainingLanguages" :key="language" :value="language">
						{{ languageNames.get(language) || language }}
					</option>
				</select>
				<p class="language-hint">{{ $t("insights.label.languageVersions.selectionHint") }}</p>
				<div class="selection-actions">
					<button class="btn" :disabled="busy || complete" @click="selectedLanguages = [...remainingLanguages]">
						{{ $t("insights.label.languageVersions.selectAll") }}
					</button>
					<button class="btn" :disabled="busy || !selectedLanguages.length" @click="selectedLanguages = []">
						{{ $t("insights.label.languageVersions.clearSelection") }}
					</button>
				</div>
			</div>
		</div>
		<div v-if="started" class="language-status" role="status" aria-live="polite">
			<span>{{
				$t("insights.label.languageVersions.progress", {
					loaded: results.length,
					total: INSIGHTS_LANGUAGES.length,
					versions: versions.length,
				})
			}}</span>
			<span v-if="busy && currentLanguage && !stopRequested">{{
				$t("insights.label.languageVersions.loading", { language: languageNames.get(currentLanguage) || currentLanguage })
			}}</span>
			<span v-else-if="complete">{{ $t("insights.label.languageVersions.complete") }}</span>
			<span v-if="cooldownSeconds > 0">{{ $t("insights.label.languageVersions.cooldown", { seconds: cooldownSeconds }) }}</span>
		</div>
		<p v-if="errorKey" class="language-error" role="alert">
			{{ $t(`insights.label.languageVersions.${errorKey}`, { language: languageNames.get(currentLanguage) || currentLanguage }) }}
		</p>
		<div class="language-controls">
			<button
				class="btn"
				:disabled="busy || cooldownSeconds > 0 || videoChanged || !videoId || !tabId || !pendingLanguages.length"
				@click="loadBatch"
			>
				{{
					$t(started ? "insights.label.languageVersions.next" : "insights.label.languageVersions.start", {
						count: Math.min(started ? batchSize : 10, pendingLanguages.length),
					})
				}}
			</button>
			<label>
				<span>{{ $t("insights.label.languageVersions.batchSize") }}</span>
				<select v-model.number="batchSize" :disabled="busy" @change="selectedLanguages = remainingLanguages.slice(0, batchSize)">
					<option v-for="size in [5, 10, 20, 50]" :key="size" :value="size">{{ size }}</option>
				</select>
			</label>
			<button v-if="busy" class="btn stop-button" :disabled="stopRequested" @click="stopRequested = true">
				{{ $t(stopRequested ? "insights.label.languageVersions.stopping" : "insights.label.languageVersions.stop") }}
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from "vue";
import { useI18n } from "vue-i18n";
import { INSIGHTS_LANGUAGES } from "../../util/insightsLanguages";
import { cacheLanguageVersion, readLanguageVersionsCache, type LanguageVersion } from "../../util/insightsLanguageCache";

const props = defineProps<{ videoId: string; tabId: number | null }>();
const emit = defineEmits<{ "update:count": [count: number] }>();
const { locale } = useI18n();
const descriptionId = useId();
const expandedText = ref("");
const languagePickerButton = ref<HTMLButtonElement | null>(null);
const languagePickerOpen = ref(false);
const batchSize = ref(10);
const selectedLanguages = ref<string[]>([]);
const results = ref<LanguageVersion[]>([]);
const started = ref(false);
const busy = ref(false);
const stopRequested = ref(false);
const currentLanguage = ref("");
const errorKey = ref<"failed" | "blocked" | "videoChanged" | "">("");
const videoChanged = ref(false);
const cooldownSeconds = ref(0);
const complete = computed(() => results.value.length === INSIGHTS_LANGUAGES.length);
const loadedLanguages = computed(() => new Set(results.value.map((result) => result.language)));
const remainingLanguages = computed(() => INSIGHTS_LANGUAGES.filter((language) => !loadedLanguages.value.has(language)));
const pendingLanguages = computed(() => remainingLanguages.value.filter((language) => selectedLanguages.value.includes(language)));
const languageNames = computed(() => {
	const names = new Intl.DisplayNames([locale.value, "en"], { type: "language" });
	return new Map<string, string>(INSIGHTS_LANGUAGES.map((code) => [code, names.of(code) || code]));
});
const versions = computed(() => {
	const thumbnailHashes = new Map(
		results.value.filter((result) => result.thumbnailHash).map((result) => [result.thumbnail, result.thumbnailHash]),
	);
	const grouped = new Map<string, LanguageVersion & { key: string; thumbnailKey: string; languages: string[] }>();
	for (const result of results.value) {
		const thumbnailHash = result.thumbnailHash || thumbnailHashes.get(result.thumbnail);
		const thumbnailKey = thumbnailHash ? `sha256:${thumbnailHash}` : result.thumbnail;
		const key = JSON.stringify([result.title, result.description, thumbnailKey]);
		const group = grouped.get(key) || { ...result, key, thumbnailKey, languages: [] };
		group.languages.push(result.language);
		grouped.set(key, group);
	}
	return [...grouped.values()];
});
const thumbnailVersions = computed(() => {
	const grouped = new Map<string, { key: string; thumbnail: string; languages: string[] }>();
	for (const version of versions.value) {
		if (!version.thumbnail) continue;
		const group = grouped.get(version.thumbnailKey) || { key: version.thumbnailKey, thumbnail: version.thumbnail, languages: [] };
		group.languages.push(...version.languages);
		grouped.set(version.thumbnailKey, group);
	}
	return [...grouped.values()];
});
const textVersions = computed(() => {
	const grouped = new Map<string, { key: string; title: string; description: string; languages: string[] }>();
	for (const version of versions.value) {
		const key = JSON.stringify([version.title, version.description]);
		const group = grouped.get(key) || { key, title: version.title, description: version.description, languages: [] };
		group.languages.push(...version.languages);
		grouped.set(key, group);
	}
	return [...grouped.values()];
});

let disposed = false;
let cooldownUntil = 0;
let cooldownTimer: ReturnType<typeof setTimeout> | undefined;

function updateCooldown() {
	cooldownSeconds.value = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
	cooldownTimer = cooldownSeconds.value ? setTimeout(updateCooldown, 500) : undefined;
}

async function loadBatch() {
	if (busy.value || cooldownSeconds.value || videoChanged.value || !props.tabId || !props.videoId || !pendingLanguages.value.length)
		return;
	const tabId = props.tabId;
	const videoId = props.videoId;
	const batch = pendingLanguages.value.slice(0, started.value ? batchSize.value : 10);
	languagePickerOpen.value = false;
	started.value = true;
	busy.value = true;
	stopRequested.value = false;
	errorKey.value = "";
	try {
		for (const language of batch) {
			if (stopRequested.value || disposed) break;
			currentLanguage.value = language;
			const response = await browser.tabs.sendMessage(tabId, {
				action: "getInsightsLanguageVersion",
				payload: { videoId, language: currentLanguage.value },
			});
			if (disposed || props.videoId !== videoId || props.tabId !== tabId) return;
			if (response?.error) {
				videoChanged.value = response.error === "video-changed" || response.error === "not-watch-page";
				errorKey.value = videoChanged.value
					? "videoChanged"
					: ["youtube-blocked", "rate-limited"].includes(response.error)
						? "blocked"
						: "failed";
				if (Number.isFinite(response.retryAfterMs) && response.retryAfterMs > 0) {
					cooldownUntil = Date.now() + response.retryAfterMs;
					clearTimeout(cooldownTimer);
					updateCooldown();
				}
				break;
			}
			if (
				response?.videoId !== videoId ||
				response?.language !== currentLanguage.value ||
				typeof response?.title !== "string" ||
				typeof response?.description !== "string" ||
				typeof response?.thumbnail !== "string"
			)
				throw new Error("invalid-language-version");
			const version: LanguageVersion = {
				videoId,
				language: response.language,
				title: response.title.replace(/\r\n?/g, "\n").trim(),
				description: response.description.replace(/\r\n?/g, "\n").trim(),
				thumbnail: response.thumbnail,
				thumbnailHash: response.thumbnailHash,
			};
			results.value.push(version);
			selectedLanguages.value = selectedLanguages.value.filter((language) => language !== version.language);
			cacheLanguageVersion(version);
			emit("update:count", versions.value.length);
		}
		if (!stopRequested.value && !errorKey.value && !pendingLanguages.value.length) {
			selectedLanguages.value = remainingLanguages.value.slice(0, batchSize.value);
		}
	} catch (error) {
		if (!disposed && props.videoId === videoId && props.tabId === tabId) {
			errorKey.value = "failed";
			console.warn("Unable to load a language version:", error);
		}
	} finally {
		if (!disposed) busy.value = false;
	}
}

watch(
	() => [props.videoId, props.tabId],
	() => {
		stopRequested.value = true;
		languagePickerOpen.value = false;
		results.value = readLanguageVersionsCache(props.videoId);
		expandedText.value = "";
		selectedLanguages.value = remainingLanguages.value.slice(0, 10);
		started.value = results.value.length > 0;
		errorKey.value = "";
		videoChanged.value = false;
		currentLanguage.value = "";
		emit("update:count", versions.value.length);
	},
	{ immediate: true },
);

onBeforeUnmount(() => {
	disposed = true;
	stopRequested.value = true;
	clearTimeout(cooldownTimer);
});
</script>

<style lang="scss" scoped>
.language-versions {
	padding: 8px;
	font-size: 11px;

	.language-warning {
		margin: 0;
		padding: 8px;
		border: 1px solid #ead4ad;
		border-radius: 7px;
		background: #fff8ec;
		color: #8e5b1c;
		line-height: 1.5;
	}

	.language-hint {
		margin: 7px 0;
		color: #77717e;
		font-size: 10px;
		line-height: 1.5;
	}

	.language-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 7px;
		margin-top: 9px;

		.btn {
			padding: 6px 9px;
			font-size: 11px;
			background: var(--media-accent);
			color: #fff;

			&.stop-button {
				background: #f6eeed;
				color: #b5463e;
			}

			&:disabled {
				opacity: 0.5;
				cursor: default;
			}
		}

		label {
			display: flex;
			align-items: center;
			gap: 5px;
			color: #635d6b;

			select {
				padding: 4px 6px;
				min-width: 52px;
				font-size: 11px;
			}
		}
	}

	.language-selection {
		margin-top: 12px;

		.language-picker-toggle {
			display: flex;
			align-items: center;
			gap: 7px;
			width: 100%;
			padding: 6px 8px;
			border: 1px solid #d9dce5;
			border-radius: 7px;
			background: #fff;
			color: #635d6b;
			font: inherit;
			text-align: start;
			cursor: pointer;

			.selected-count {
				margin-inline-start: auto;
				color: var(--media-accent);
			}

			svg {
				width: 12px;
				height: 12px;
				flex: 0 0 auto;
			}

			&[aria-expanded="true"] svg {
				transform: rotate(180deg);
			}

			&:disabled {
				opacity: 0.5;
				cursor: default;
			}
		}

		.language-picker-options {
			margin-top: 5px;
			padding: 7px;
			border: 1px solid var(--media-border);
			border-radius: 7px;
			background: #fff;

			select {
				width: 100%;
				padding: 4px;
				font-size: 11px;

				option {
					padding: 3px 5px;
				}
			}
			.selection-actions {
				display: flex;
				gap: 6px;

				.btn {
					padding: 4px 7px;
					font-size: 10px;
					background: var(--media-soft);
					color: var(--media-accent);

					&:disabled {
						opacity: 0.5;
						cursor: default;
					}
				}
			}
		}
	}

	.language-status {
		display: grid;
		gap: 3px;
		margin-top: 8px;
		color: #726b7b;
		font-size: 10px;
	}

	.language-error {
		margin: 8px 0 0;
		color: #b43b34;
		line-height: 1.5;
	}

	.version-results {
		display: grid;
		gap: 12px;
		margin-top: 9px;

		.versions-section-title {
			margin: 0 0 7px;
			color: #635d6b;
			font-size: 11px;
			font-weight: 600;
		}

		.version-languages {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 4px;
			margin-top: 7px;

			span {
				padding: 2px 5px;
				border-radius: 5px;
				background: var(--media-soft);
				color: var(--media-accent);
				font-size: 9px;

				&.languages-label {
					padding-inline-start: 0;
					background: none;
					color: #77717e;
				}
			}
		}

		.thumbnail-versions {
			figure {
				margin: 0 0 8px;
				padding: 8px;
				border: 1px solid var(--media-border);
				border-radius: 8px;
				background: var(--media-surface);

				&:last-child {
					margin-bottom: 0;
				}

				a,
				img {
					display: block;
					width: 100%;
				}

				img {
					height: auto;
					border-radius: 5px;
				}
			}
		}

		.text-versions {
			.text-version {
				margin-top: 7px;
				border: 1px solid var(--media-border);
				border-radius: 8px;
				background: var(--media-surface);

				summary {
					padding: 8px;
					cursor: pointer;
					list-style: none;

					&::-webkit-details-marker {
						display: none;
					}

					.text-heading {
						display: flex;
						align-items: center;
						gap: 8px;

						.text-title {
							flex: 1;
							min-width: 0;
							color: #37313f;
							font-size: 11px;
							font-weight: 600;
							line-height: 1.5;
							overflow-wrap: anywhere;
							user-select: text;
						}

						svg {
							width: 12px;
							height: 12px;
							flex: 0 0 auto;
							color: var(--media-accent);
						}
					}
				}

				&[open] > summary svg {
					transform: rotate(90deg);
				}

				p {
					margin: 0;
					padding: 0 8px 8px;
					color: #524b5a;
					line-height: 1.5;
					white-space: pre-wrap;
					overflow-wrap: anywhere;
					user-select: text;
				}
			}
		}
	}
}
</style>
