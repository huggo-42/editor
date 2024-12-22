<script lang="ts">
    import { onMount } from 'svelte';
    import BasePalette from './components/BasePalette.svelte';
    import FileItem from './components/FileItem.svelte';
    import ResultsList from './components/ResultsList.svelte';
    import { SearchFiles } from '@/lib/wailsjs/go/main/App';
    import { projectStore } from '@/stores/project';
    import { fileStore } from '@/stores/fileStore';
    import { focusStore } from '@/stores/focusStore';
    import type { service } from '@/lib/wailsjs/go/models';

    export let show = false;
    export let searchQuery = '';
    let selectedIndex = 0;
    let previousShow = show;
    let results: (service.FileNode & { isOpen: boolean })[] = [];
    let baseResults: (service.FileNode & { isOpen: boolean })[] = [];
    let previousBaseQuery = '';
    let loading = false;
    let error: string | null = null;
    let debounceTimer: number | null = null;
    let currentSearch: Promise<any> | null = null;
    let searchCounter = 0;
    let mounted = false;
    let finderId = focusStore.generateId('file-finder');

    // Convert open files to search results format
    function getOpenFilesAsResults() {
        return Array.from($fileStore.openFiles.entries()).map(([path, file]) => ({
            name: path.split('/').pop() || '',
            path,
            type: 'file',
            isOpen: true
        }));
    }

    // Reset all states
    function resetState() {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
        results = getOpenFilesAsResults();
        baseResults = [];
        previousBaseQuery = '';
        selectedIndex = 0;
        loading = false;
        error = null;
    }

    // Filter existing results with additional terms
    function filterResults(terms: string[]): (service.FileNode & { isOpen: boolean })[] {
        return baseResults.filter(file => {
            const lowerPath = file.path.toLowerCase();
            return terms.every(term => lowerPath.includes(term.toLowerCase()));
        });
    }

    // Perform search
    async function performSearch(query: string, counter: number) {
        if (!show || counter !== searchCounter) {
            loading = false;
            return;
        }

        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        
        // If we have a previous base query and this query starts with it
        if (previousBaseQuery && 
            query.toLowerCase().startsWith(previousBaseQuery.toLowerCase()) && 
            terms.length > 1) {
            // Filter existing results instead of doing a new search
            results = filterResults(terms);
            loading = false;
            return;
        }

        try {
            // This is a new base search
            const thisSearch = SearchFiles(
                $projectStore.currentProject!.Path,
                terms[0] // Use only the first term for backend search
            );
            currentSearch = thisSearch;

            const searchResults = await thisSearch;
            if (counter === searchCounter && show) {
                // Get open files for merging
                const openFiles = new Set($fileStore.openFiles.keys());
                
                // Mark open files and sort them to top
                baseResults = (searchResults || []).map(file => ({
                    ...file,
                    isOpen: openFiles.has(file.path)
                })).sort((a, b) => {
                    if (a.isOpen && !b.isOpen) return -1;
                    if (!a.isOpen && b.isOpen) return 1;
                    return 0;
                });

                // Store the base query for future refinements
                previousBaseQuery = terms[0];

                // If there are additional terms, filter the results
                if (terms.length > 1) {
                    results = filterResults(terms);
                } else {
                    results = baseResults;
                }

                selectedIndex = Math.min(
                    selectedIndex,
                    Math.max(0, results.length - 1)
                );
            }
        } catch (err) {
            if (counter === searchCounter && show) {
                results = [];
                baseResults = [];
                previousBaseQuery = '';
                error = err.message;
            }
        } finally {
            if (counter === searchCounter) {
                loading = false;
            }
        }
    }

    // Watch for show changes
    $: if (show && !previousShow) {
        searchQuery = '';
        resetState();
        previousShow = show;
    } else if (!show) {
        previousShow = show;
    }

    // Handle search query changes
    $: {
        if (mounted && show && searchQuery !== undefined) {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                debounceTimer = null;
            }

            searchCounter++; // Increment counter for new search attempt
            const currentCounter = searchCounter;

            if (searchQuery === '') {
                resetState();
            } else {
                loading = true;
                error = null;
                debounceTimer = setTimeout(() => {
                    if (show && currentCounter === searchCounter) {
                        performSearch(searchQuery, currentCounter);
                    } else {
                        loading = false;
                    }
                }, 200);
            }
        }
    }

    async function handleSelect() {
        const file = results[selectedIndex];
        if (file?.type === 'file') {
            await fileStore.openFile(file.path);
            show = false;
        }
    }

    onMount(() => {
        mounted = true;
    });
</script>

<BasePalette
    bind:show
    bind:searchQuery
    paletteId={finderId}
    placeholder="Type to search files..."
    bind:selectedIndex
    totalItems={results.length}
    on:select={handleSelect}
>
    <ResultsList 
        {selectedIndex} 
        isEmpty={loading || error || results.length === 0}
        emptyMessage={loading ? "Loading..." : error ? error : "No files found"}
    >
        {#each results as file, index (file.path)}
            <FileItem
                {file}
                {index}
                selected={index === selectedIndex}
                onClick={() => handleSelect()}
            />
        {/each}
    </ResultsList>
</BasePalette>
