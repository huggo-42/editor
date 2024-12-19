<script lang="ts">
    import {
        onMount,
        createEventDispatcher,
        afterUpdate,
        onDestroy,
    } from "svelte";
    import { Search, File, Folder } from "lucide-svelte";
    import Input from "./Input.svelte";
    import { setKeyboardContext, addKeyboardContext, removeKeyboardContext, keyBindings, registerCommand } from "@/stores/keyboardStore";
    import { SearchFiles } from "@/lib/wailsjs/go/main/App";
    import { projectStore } from "@/stores/project";
    import { fileStore } from "@/stores/fileStore";
    import { focusStore } from "@/stores/focusStore";
    import type { service } from "../wailsjs/go/models";

    const dispatch = createEventDispatcher<{
        close: void;
        select: { path: string };
    }>();

    export let show = false;
    let previousShow = show;
    let vimModeEnabled = false;
    let searchQuery = "";
    let previousBaseQuery = ""; // Store the previous base query
    let baseResults: (service.FileNode & { isOpen: boolean })[] = []; // Store base results
    let results: (service.FileNode & { isOpen: boolean })[] = [];
    let selectedIndex = 0;
    let loading = false;
    let error = null;
    let inputElement: HTMLInputElement;
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
        previousBaseQuery = "";
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
                previousBaseQuery = "";
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
        searchQuery = "";
        resetState();
        previousShow = show;
        focusStore.focus('file-finder', finderId);
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

            if (searchQuery === "") {
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

    function handleKeyDown(event: KeyboardEvent) {
        if (!show) return;

        // Enable vim mode when Alt+J are pressed together
        if (event.altKey && event.key.toLowerCase() === "j") {
            vimModeEnabled = !vimModeEnabled;
            event.preventDefault();
            return;
        }

        // Close modal on Alt + Number
        if (event.altKey && /^[0-9]$/.test(event.key)) {
            event.preventDefault();
            dispatch("close");
            return;
        }
        
        switch (event.key) {
            case "ArrowDown":
            case "j":
                if (event.key === "j" && !vimModeEnabled) break;
                event.preventDefault();
                selectedIndex = (selectedIndex + 1) % results.length;
                break;
            case "ArrowUp":
            case "k":
                if (event.key === "k" && !vimModeEnabled) break;
                event.preventDefault();
                selectedIndex =
                    selectedIndex - 1 < 0
                        ? results.length - 1
                        : selectedIndex - 1;
                break;
            case "Enter":
                event.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
                break;
            case "Escape":
                event.preventDefault();
                closeFileFinder();
                break;
        }
    }

    async function handleSelect(file: any) {
        if (file.type === "file") {
            await fileStore.openFile(file.path);
            dispatch('select', { path: file.path });
        }
        closeFileFinder();
    }

    async function handleQuickSelect(index: number) {
        if (index < results.length) {
            await handleSelect(results[index]);
        }
    }

    function closeFileFinder() {
        resetState();
        searchQuery = "";
        vimModeEnabled = false;
        selectedIndex = 0;
        show = false;
        focusStore.restorePrevious();
        dispatch("close");
    }

    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (target.classList.contains("bg-opacity-50")) {
            closeFileFinder();
        }
    }

    function removeBasedir(path: string) {
        return path.replace($projectStore.currentProject!.Path + "/", "");
    }

    onMount(() => {
        mounted = true;
        addKeyboardContext('fileFinder');

        // Register actions for fuzzy finder selection commands
        for (let i = 1; i <= 9; i++) {
            registerCommand(`fuzzyFinderSelect${i}`, () => {
                const index = i - 1;
                if (results[index]) {
                    handleSelect(results[index]);
                }
            });
        }

        if (show && inputElement) {
            inputElement.focus();
        }
    });

    onDestroy(() => {
        removeKeyboardContext('fileFinder');
        mounted = false;
        resetState();
        setKeyboardContext("global");
    });
</script>

{#if show}
    <button
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-[20vh]"
        on:click={handleClickOutside}
    >
        <button
            class="w-[600px] bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden"
            on:click|stopPropagation
        >
            <div class="relative bg">
                <div class="pl-10">
                    <Input
                        bind:value={searchQuery}
                        placeholder="Type to search files..."
                        bind:this={inputElement}
                        on:keydown={handleKeyDown}
                        class="w-full px-4 py-2 bg-transparent border-none focus:outline-none text-gray-200"
                        autofocus
                    />
                </div>
                <div
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                    <Search size={16} />
                </div>
            </div>

            {#if loading}
                <div class="px-4 py-8 text-center text-gray-500">
                    Loading...
                </div>
            {:else if error}
                <div class="px-4 py-8 text-center text-red-500">
                    {error}
                </div>
            {:else if results.length > 0}
                <div class="max-h-[400px] overflow-y-auto">
                    <div class="w-full">
                        {#each results as file, index}
                            <button
                                class="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-800 {index === selectedIndex ? 'bg-gray-800' : ''}"
                                on:click={() => handleSelect(file)}
                            >
                                <div class="flex items-center gap-3 min-w-0 flex-1">
                                    <svelte:component
                                        this={file.type === "directory" ? Folder : File}
                                        size={16}
                                        class="text-gray-400 flex-shrink-0"
                                    />
                                    <div class="flex flex-col min-w-0 flex-1">
                                        <span class="text-gray-300 font-medium truncate">{file.name}</span>
                                        {#if file.path}
                                            <span class="text-gray-500 text-sm truncate max-w-full">{removeBasedir(file.path)}</span>
                                        {/if}
                                    </div>
                                </div>
                                <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                                    {#if index < 9}
                                        <span class="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700">
                                            Alt+{index + 1}
                                        </span>
                                    {/if}
                                    {#if file.isOpen}
                                        <span class="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700">
                                            Open
                                        </span>
                                    {/if}
                                </div>
                            </button>
                        {/each}
                    </div>
                </div>
            {:else if searchQuery.trim()}
                <div class="px-4 py-8 text-center text-gray-500">
                    No files found
                </div>
            {/if}
        </button>
    </button>
{/if}
