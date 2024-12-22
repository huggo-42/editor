<script lang="ts">
    import { ChevronDown, ChevronRight } from "lucide-svelte";
    import { gitStore } from "@/stores/gitStore";
    import GitStatusItem from "./GitStatusItem.svelte";

    $: unstagedChanges = $gitStore.gitStatus?.filter((item) => !item.staged) || [];
</script>

{#if unstagedChanges.length > 0}
    <div class="mb-4">
        <button
            class="flex items-center text-sm text-gray-500 mb-1 px-2 cursor-pointer hover:text-gray-400"
            on:click={() => gitStore.toggleChangesExpanded()}
        >
            <span class="w-4 h-4 flex items-center justify-center">
                {#if $gitStore.changesExpanded}
                    <ChevronDown class="w-4 h-4" />
                {:else}
                    <ChevronRight class="w-4 h-4" />
                {/if}
            </span>
            <span class="font-bold ml-2">Changes ({unstagedChanges.length})</span>
        </button>
        {#if $gitStore.changesExpanded}
            <div>
                {#each unstagedChanges as item}
                    <GitStatusItem {item} isStaged={false} />
                {/each}
            </div>
        {/if}
    </div>
{/if}
