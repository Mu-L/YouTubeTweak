<template>
	<details :class="embedded ? 'settings-details' : 'card settings-card-details'" :open="expanded" @toggle="saveExpandedState">
		<summary :class="embedded ? undefined : 'card-title'">
			<slot name="title" />
		</summary>
		<slot />
	</details>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(defineProps<{ cardId: string; defaultOpen?: boolean; embedded?: boolean }>(), {
	defaultOpen: true,
	embedded: false,
});
const storageKey = "settings-card:" + props.cardId;
const expanded = ref(props.defaultOpen);

try {
	const saved = localStorage.getItem(storageKey);
	if (saved === "open" || saved === "closed") expanded.value = saved === "open";
} catch (error) {
	console.warn("Unable to restore settings card state:", error);
}

function saveExpandedState(event: Event) {
	if (event.target !== event.currentTarget) return;
	const open = (event.currentTarget as HTMLDetailsElement).open;
	if (open === expanded.value) return;
	expanded.value = open;
	try {
		localStorage.setItem(storageKey, open ? "open" : "closed");
	} catch (error) {
		console.warn("Unable to save settings card state:", error);
	}
}
</script>
