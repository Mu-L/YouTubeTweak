<template>
	<section id="page-translate">
		<div class="card">
			<div class="card-title">
				<span>{{ $t("translate.common.title") }}</span>
				<DocsHelpLink anchor="translate-settings" />
			</div>
			<div class="card-body">
				<label class="form-item form-item-select">
					<span>{{ $t("comment.context.select.targetLanguage") }}: </span>
					<DocsHelpLink anchor="translate-settings-target-language" />
					<select v-model="config['comment.targetLanguage']">
						<option value="auto">{{ $t("comment.context.select.option.auto") }}</option>
						<option v-for="(v, k) in locales" :value="k" :key="k">{{ v }}</option>
					</select>
				</label>

				<label class="form-item form-item-select">
					<span style="white-space: break-spaces">{{ $t("comment.context.select.neverTranslate") }}</span>
					<DocsHelpLink anchor="translate-settings-never-translate" />
					<select v-model="config['comment.neverTranslateLanguages']" multiple>
						<option v-for="(v, k) in locales" :value="k" :key="k">{{ v }}</option>
					</select>
				</label>
			</div>
		</div>
		<div class="card">
			<div class="card-title">
				<span>{{ $t("translate.global.title") }}</span>
				<DocsHelpLink anchor="translate-global" />
			</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['translate.enable.videoListTitle']" />
					<span>{{ $t("translate.global.checkbox.videoListTitle") }}</span>
					<DocsHelpLink anchor="translate-global-video-list-title" />
				</label>
			</div>
		</div>
		<div class="card">
			<div class="card-title">
				<span>{{ $t("translate.watch.title") }}</span>
				<DocsHelpLink anchor="translate-watch" />
			</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['translate.enable.videoTitle']" />
					<span>{{ $t("translate.watch.checkbox.videoTitle") }}</span>
					<DocsHelpLink anchor="translate-watch-video-title" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['translate.enable.videoDescription']" />
					<span>{{ $t("translate.watch.checkbox.videoDescription") }}</span>
					<DocsHelpLink anchor="translate-watch-video-description" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['translate.enable.videoSummary']" />
					<span>{{ $t("translate.watch.checkbox.videoSummary") }}</span>
					<DocsHelpLink anchor="translate-watch-video-summary" />
				</label>
			</div>
		</div>
		<div class="card">
			<div class="card-title">
				<span>{{ $t("translate.subtitle.title") }}</span>
				<DocsHelpLink anchor="translate-subtitle" />
			</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['translate.enable.timedtext']" />
					<span>{{ $t("translate.subtitle.checkbox.timedtext") }}</span>
					<DocsHelpLink anchor="translate-subtitle-enable" />
				</label>
				<label class="form-item form-item-select">
					<span>{{ $t("translate.subtitle.select.mode") }}: </span>
					<select v-model="config['translate.timedtext.mode']">
						<option value="bilingual">{{ $t("translate.subtitle.select.option.bilingual") }}</option>
						<option value="translationOnly">{{ $t("translate.subtitle.select.option.translationOnly") }}</option>
					</select>
				</label>
			</div>
		</div>
		<div class="card">
			<div class="card-title">
				<span>{{ $t("translate.comment.title") }}</span>
				<DocsHelpLink anchor="translate-comment" />
			</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['comment.autoTranslate']" />
					<span>{{ $t("comment.context.checkbox.autoTranslate") }}</span>
					<DocsHelpLink anchor="translate-comment-content" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['comment.showManualTranslateButtonForSkippedLanguages']" />
					<span>{{ $t("comment.context.checkbox.showManualTranslateButtonForSkippedLanguages") }}</span>
					<DocsHelpLink anchor="translate-comment-manual-button" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['comment.lineByLineTranslate']" />
					<span>{{ $t("comment.context.checkbox.lineByLineTranslate") }}</span>
					<DocsHelpLink anchor="translate-comment-line-by-line" />
				</label>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import DocsHelpLink from "../components/DocsHelpLink.vue";
import useConfigStore from "../util/config";
const config = useConfigStore();
const locales: Record<string, string> = {
	af: "Afrikaans",
	az: "Azərbaycan",
	id: "Bahasa Indonesia",
	ms: "Bahasa Malaysia",
	bs: "Bosanski",
	ca: "Català",
	cs: "Čeština",
	da: "Dansk",
	de: "Deutsch",
	et: "Eesti",
	"en-IN": "English (India)",
	"en-GB": "English (UK)",
	en: "English (US)",
	es: "Español (España)",
	"es-419": "Español (Latinoamérica)",
	"es-US": "Español (US)",
	eu: "Euskara",
	fil: "Filipino",
	fr: "Français",
	"fr-CA": "Français (Canada)",
	gl: "Galego",
	hr: "Hrvatski",
	zu: "IsiZulu",
	is: "Íslenska",
	it: "Italiano",
	sw: "Kiswahili",
	lv: "Latviešu valoda",
	lt: "Lietuvių",
	hu: "Magyar",
	nl: "Nederlands",
	no: "Norsk",
	uz: "O‘zbek",
	pl: "Polski",
	"pt-PT": "Português",
	pt: "Português (Brasil)",
	ro: "Română",
	sq: "Shqip",
	sk: "Slovenčina",
	sl: "Slovenščina",
	"sr-Latn": "Srpski",
	fi: "Suomi",
	sv: "Svenska",
	vi: "Tiếng Việt",
	tr: "Türkçe",
	be: "Беларуская",
	bg: "Български",
	ky: "Кыргызча",
	kk: "Қазақ Тілі",
	mk: "Македонски",
	mn: "Монгол",
	ru: "Русский",
	sr: "Српски",
	uk: "Українська",
	el: "Ελληνικά",
	hy: "Հայերեն",
	iw: "עברית",
	ur: "اردو",
	ar: "العربية",
	fa: "فارسی",
	ne: "नेपाली",
	mr: "मराठी",
	hi: "हिन्दी",
	as: "অসমীয়া",
	bn: "বাংলা",
	pa: "ਪੰਜਾਬੀ",
	gu: "ગુજરાતી",
	or: "ଓଡ଼ିଆ",
	ta: "தமிழ்",
	te: "తెలుగు",
	kn: "ಕನ್ನಡ",
	ml: "മലയാളം",
	si: "සිංහල",
	th: "ภาษาไทย",
	lo: "ລາວ",
	my: "ဗမာ",
	ka: "ქართული",
	am: "አማርኛ",
	km: "ខ្មែរ",
	"zh-CN": "中文 (简体)",
	"zh-TW": "中文 (繁體)",
	"zh-HK": "中文 (香港)",
	ja: "日本語",
	ko: "한국어",
};
</script>
