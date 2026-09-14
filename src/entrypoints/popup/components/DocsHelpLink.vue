<template>
	<button
		type="button"
		class="docs-help-link"
		:title="$t('common.getHelp')"
		:aria-label="$t('common.getHelp')"
		@click.stop.prevent="openDocs"
		@mousedown.stop.prevent
	>
		<span aria-hidden="true">?</span>
	</button>
</template>

<script setup lang="ts">
const props = defineProps<{
	anchor: string;
}>();

function openDocs() {
	const locale = localStorage.getItem("lang") || document.documentElement.lang;
	const docsPath = locale.startsWith("zh")
		? "docs/zh-cn/FUNCTIONS.md"
		: locale.startsWith("ja")
			? "docs/ja/FUNCTIONS.md"
			: "FUNCTIONS.md";
	const url = `https://github.com/xlch88/YouTubeTweak/blob/main/${docsPath}#${props.anchor}`;

	browser.tabs.create({ url }).catch(() => {
		window.open(url, "_blank", "noopener,noreferrer");
	});
}
</script>
