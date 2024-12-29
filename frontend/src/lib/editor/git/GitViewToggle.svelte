<!-- A toggle switch component with text on both sides -->
<script lang="ts">
    import { Inspect } from "lucide-svelte";
    import { tooltip } from "@/lib/actions/tooltip";
    import { gitStore } from "@/stores/gitStore";
</script>

<div class="flex items-center space-x-2 text-sm">
    <div class="flex flex-row flex-1 gap-2 items-center">
        <Inspect size={16} class="text-gray-400" />
        <span
            class="text-gray-400"
            use:tooltip={{ text: "Default action when clicking on a file" }}
            >Default View</span
        >
    </div>
    <div
        class="flex items-center space-x-1 border border-gray-700 rounded-md bg-gray-900"
    >
        <button
            class="px-3 rounded transition-colors text-gray-400"
            class:toggler-active={!$gitStore.showDiff}
            on:click={() => gitStore.toggleDiffView()}
        >
            File
        </button>
        <button
            class="px-3 rounded transition-colors text-gray-400"
            class:toggler-active={$gitStore.showDiff}
            on:click={() => gitStore.toggleDiffView()}
        >
            Diff
        </button>
    </div>
</div>

<style lang="postcss">
    .toggler-active {
        @apply text-gray-200 bg-gray-700;
    }
</style>
