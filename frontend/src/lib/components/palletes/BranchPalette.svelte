<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import BasePalette from './components/BasePalette.svelte';
    import ResultsList from './components/ResultsList.svelte';
    import { gitStore } from '@/stores/gitStore';
    import { focusStore } from '@/stores/focusStore';
    import type { service } from '@/lib/wailsjs/go/models';
    import { GitBranch } from 'lucide-svelte';

    const dispatch = createEventDispatcher<{
        close: void;
    }>();

    export let show = false;
    export let searchQuery = '';
    let selectedIndex = 0;
    let previousShow = show;
    let filteredBranches: service.BranchInfo[] = [];
    let paletteId = focusStore.generateId('branch-palette');

    $: {
        if (searchQuery.trim() === '') {
            filteredBranches = [...$gitStore.branches].sort((a, b) => {
                if (a.isHead && !b.isHead) return -1;
                if (!a.isHead && b.isHead) return 1;
                return 0;
            });
        } else {
            const query = searchQuery.toLowerCase();
            filteredBranches = $gitStore.branches
                .filter(branch => branch.name.toLowerCase().includes(query))
                .sort((a, b) => {
                    if (a.isHead && !b.isHead) return -1;
                    if (!a.isHead && b.isHead) return 1;
                    return 0;
                });
        }
    }

    // Reset selection when branches change
    $: {
        selectedIndex = Math.min(selectedIndex, Math.max(0, filteredBranches.length - 1));
    }

    // Initialize when opening
    $: if (show && !previousShow) {
        searchQuery = '';
        selectedIndex = 0;
        gitStore.refreshBranches();
        previousShow = show;
    } else if (!show) {
        previousShow = show;
    }

    async function switchBranch(branch: service.BranchInfo) {
        show = false;
        dispatch('close');
        // TODO: Implement branch switching logic
        // await gitStore.switchBranch(branch.name);
    }

    function handleSelect() {
        if (filteredBranches[selectedIndex]) {
            switchBranch(filteredBranches[selectedIndex]);
        }
    }

    function handleClose() {
        dispatch('close');
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->

<BasePalette
    bind:show
    bind:searchQuery
    paletteId={paletteId}
    placeholder="Type a branch name..."
    bind:selectedIndex
    totalItems={filteredBranches.length}
    on:select={handleSelect}
    on:close={handleClose}
>
    <ResultsList 
        {selectedIndex} 
        isEmpty={filteredBranches.length === 0}
        emptyMessage={searchQuery ? "No branches found" : "No branches available"}
    >
        {#each filteredBranches as branch, index (branch.name)}
            <div
                class="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-800 {index === selectedIndex ? 'bg-gray-800' : ''}"
                on:click={() => switchBranch(branch)}
            >
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <GitBranch 
                        size={16}
                        class="{branch.isHead ? 'text-sky-500' : 'text-gray-400'} flex-shrink-0"
                    />
                    <span class="text-gray-300 font-medium truncate">{branch.name}</span>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                    {#if branch.isHead}
                    <span class="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-sky-500 border border-sky-500 border-opacity-50">
                        Current
                    </span>
                    {/if}
                    {#if branch.isRemote}
                    <span class="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700">
                        Remote
                    </span>
                    {/if}
                    {#if index < 9}
                        <span class="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700">
                            Alt+{index + 1}
                        </span>
                    {/if}
                </div>
            </div>
        {/each}
    </ResultsList>
</BasePalette>
