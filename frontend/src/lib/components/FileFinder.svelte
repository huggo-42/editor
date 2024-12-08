<script lang="ts">
    import { onMount, createEventDispatcher, afterUpdate, onDestroy } from 'svelte';
    import { Search, File, Folder } from 'lucide-svelte';
    import Input from './Input.svelte';
    import { setKeyboardContext } from '@/stores/keyboardStore';
    import { SearchFiles } from '@/lib/wailsjs/go/main/App';
    import { projectStore } from '@/stores/project';
    import { fileStore } from '@/stores/fileStore';
    import type { service } from '../wailsjs/go/models';

    const dispatch = createEventDispatcher<{
        close: void;
        select: any;
    }>();

    export let show = false;
    let previousShow = show;
    let vimModeEnabled = false;
    let searchQuery = '';
    let results: service.FileNode[] = [];
    let selectedIndex = 0;
    let loading = false;
    let error = null;
    let inputElement: HTMLInputElement;
    let debounceTimer: number | null = null;
    let currentSearch: Promise<any> | null = null;
    let searchCounter = 0;
    let mounted = false;

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
        currentSearch = null;
    }

    // Perform search
    async function performSearch(query: string, counter: number) {
        if (!show || counter !== searchCounter) {
            loading = false;
            return;
        }

        try {
            const thisSearch = SearchFiles($projectStore.currentProject!.Path, query);
            currentSearch = thisSearch;

            const searchResults = await thisSearch;
            if (counter === searchCounter && show) {
                results = searchResults || [];
                selectedIndex = Math.min(selectedIndex, Math.max(0, results.length - 1));
            }
        } catch (err) {
            if (counter === searchCounter && show) {
                results = [];
                error = err.message;
            }
        } finally {
            if (counter === searchCounter) {
                loading = false;
            }
        }
    }

    // Watch for show changes
    $: {
        if (show !== previousShow) {
            if (show) {
                setKeyboardContext('fileFinder');
                searchQuery = '';
                if (inputElement) {
                    setTimeout(() => inputElement.focus(), 0);
                }
            } else {
                setKeyboardContext('global');
            }
            resetState();
            previousShow = show;
        }
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
            
            // Don't trim the query - allow spaces
            if (searchQuery === '') {
                resetState();
            } else {
                loading = true;
                error = null;
                debounceTimer = setTimeout(() => {
                    if (show && currentCounter === searchCounter) {
                        // Remove leading and trailing and inner spaces
                        performSearch(searchQuery.trim().replace(/\s+/g, ''), currentCounter);
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
        if (event.altKey && event.key.toLowerCase() === 'j') {
            event.preventDefault();
            vimModeEnabled = true;
            return;
        }

        switch(event.key) {
            case 'ArrowDown':
            case 'j':
                if (event.key === 'j' && !vimModeEnabled) break;
                event.preventDefault();
                selectedIndex = (selectedIndex + 1) % results.length;
                break;
            case 'ArrowUp':
            case 'k':
                if (event.key === 'k' && !vimModeEnabled) break;
                event.preventDefault();
                selectedIndex = selectedIndex - 1 < 0
                    ? results.length - 1
                    : selectedIndex - 1;
                break;
            case 'Enter':
                event.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
                break;
            case 'Escape':
                event.preventDefault();
                closeFileFinder();
                break;
        }
    }

    async function handleSelect(file: any) {
        if (file.type === 'file') {
            await fileStore.openFile(file.path);
        }
        closeFileFinder();
    }

    function closeFileFinder() {
        resetState();
        searchQuery = '';
        selectedIndex = 0;
        show = false;
        dispatch('close');
    }

    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (target.classList.contains('bg-opacity-50')) {
            closeFileFinder();
        }
    }

    function removeBasedir(path: string) {
        return path.replace($projectStore.currentProject!.Path + '/', '');
    }

    onMount(() => {
        mounted = true;
        if (show && inputElement) {
            inputElement.focus();
        }
    });

    onDestroy(() => {
        mounted = false;
        resetState();
        setKeyboardContext('global');
    });
</script>

{#if show}
    <button
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-[20vh]"
        on:click={handleClickOutside}
    >
        <button class="w-[600px] bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden" on:click|stopPropagation>
            <div class="relative">
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
                <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                    {#each results as file, index}
                        <button
                            class="w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-gray-800
                                {index === selectedIndex ? 'bg-gray-800' : ''}"
                            on:click={() => handleSelect(file)}
                        >
                            <svelte:component
                                this={file.type === 'directory' ? Folder : File}
                                size={16}
                                class="text-gray-400 flex-shrink-0"
                            />
                            <div class="flex flex-col min-w-0">
                                <span class="text-gray-300 font-medium truncate">{file.name}</span>
                                {#if file.path}
                                    <span class="text-gray-500 text-sm truncate">{removeBasedir(file.path)}</span>
                                {/if}
                            </div>
                        </button>
                    {/each}
                </div>
            {:else if searchQuery.trim()}
                <div class="px-4 py-8 text-center text-gray-500">
                    No files found
                </div>
            {/if}
        </button>
    </button>
{/if}
