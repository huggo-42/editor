<script lang="ts">
    import { onMount } from 'svelte';
    import BasePalette from './components/BasePalette.svelte';
    import ResultsList from './components/ResultsList.svelte';
    import { gitStore } from '@/stores/gitStore';
    import { focusStore } from '@/stores/focusStore';
    import type { service } from '@/lib/wailsjs/go/models';
    import { GitCommit } from 'lucide-svelte';
    import { formatRelativeTime } from '@/lib/utils/time';

    export let show = false;
    export let searchQuery = '';
    let selectedIndex = 0;
    let results: service.CommitInfo[] = [];
    let loading = false;
    let error: string | null = null;
    let debounceTimer: number | null = null;
    let currentSearch: Promise<any> | null = null;
    let searchCounter = 0;
    let mounted = false;
    let palleteId = focusStore.generateId('git-commit-finder');

    // Reset all states
    function resetState() {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
        results = [];
        selectedIndex = 0;
        loading = false;
        error = null;
    }

    // Perform search
    async function performSearch(query: string, counter: number) {
        if (!show || counter !== searchCounter) {
            return;
        }

        loading = true;
        error = null;

        try {
            // Load initial commits if not loaded
            if (!$gitStore.commits || $gitStore.commits.length === 0) {
                await gitStore.getCommits({ limit: 20 });
            }

            // Filter commits based on search query
            if (!query) {
                results = $gitStore.commits || [];
            } else {
                const terms = query.toLowerCase().split(' ');
                results = ($gitStore.commits || []).filter(commit => {
                    const message = commit.message.toLowerCase();
                    const hash = commit.hash.toLowerCase();
                    return terms.every(term => message.includes(term) || hash.includes(term));
                });
            }
        } catch (e) {
            error = e instanceof Error ? e.message : 'Failed to search commits';
            results = [];
        } finally {
            loading = false;
        }
    }

    // Handle selection
    function handleSelect() {
        if (results[selectedIndex]) {
            const commit = results[selectedIndex];
            console.log('Selected commit:', commit.hash);
            show = false;
        }
    }

    // Initialize component
    onMount(() => {
        mounted = true;
        return () => {
            mounted = false;
            resetState();
        };
    });

    // Watch for show changes
    $: if (mounted && show !== undefined) {
        if (show) {
            resetState();
            searchCounter++;
            performSearch(searchQuery, searchCounter);
        } else {
            resetState();
        }
    }

    // Watch for search query changes
    $: if (mounted && show && searchQuery !== undefined) {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }

        const currentCounter = ++searchCounter;
        debounceTimer = setTimeout(() => {
            performSearch(searchQuery, currentCounter);
        }, 300) as unknown as number;
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<BasePalette
    bind:show
    bind:searchQuery
    placeholder="Search commits..."
    paletteId={palleteId}
    totalItems={results.length}
    bind:selectedIndex
    on:select={handleSelect}
>
    <ResultsList>
        {#if loading}
            <div class="text-sm text-gray-500 p-2">Loading commits...</div>
        {:else if error}
            <div class="text-sm text-red-500 p-2">{error}</div>
        {:else if results.length === 0}
            <div class="text-sm text-gray-500 p-2">No commits found</div>
        {:else}
            {#each results as commit, index}
                <div
                    class="flex items-start p-2 text-sm hover:bg-gray-800/50 group cursor-pointer relative {index === selectedIndex ? 'bg-gray-800/50' : ''}"
                    on:click={() => {
                        selectedIndex = index;
                        handleSelect();
                    }}
                >
                    <GitCommit 
                        class="w-4 h-4 {commit.hash === $gitStore.HEAD?.hash ? 'text-sky-500' : 'text-gray-500'} mt-1 flex-shrink-0" 
                    />
                    <div class="ml-2 flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2 min-w-0 flex-1">
                                <span class="font-mono text-xs text-gray-500">{commit.hash.substring(0, 7)}</span>
                                <span class="text-gray-500">•</span>
                                <span class="text-xs text-gray-500">{formatRelativeTime(commit.date)}</span>
                                <span class="text-gray-500">•</span>
                                <span class="text-xs text-gray-500 truncate">{commit.author}</span>
                            </div>
                            <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                                {#if commit.hash === $gitStore.HEAD?.hash}
                                    <span class="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-sky-500 border border-sky-500 border-opacity-50">
                                        Current
                                    </span>
                                {/if}
                                {#if index < 9}
                                    <span class="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700">
                                        Alt+{index + 1}
                                    </span>
                                {/if}
                            </div>
                        </div>
                        <p class="text-gray-300 truncate" title={commit.message}>
                            {commit.message}
                        </p>
                    </div>
                </div>
            {/each}
        {/if}
    </ResultsList>
</BasePalette>
