<script lang="ts">
    import { onMount, createEventDispatcher, afterUpdate } from 'svelte';
    import { Search, File, Folder } from 'lucide-svelte';
    import Input from './Input.svelte';
    import { fuzzySearch } from '../utils/fuzzySearch';
    import { fileStore, type FileItem } from '../stores/fileStore';

    const dispatch = createEventDispatcher<{
        close: void;
        select: FileItem;
    }>();

    export let show = false;
    let previousShow = show;
    let vimModeEnabled = false;
    let searchQuery = '';
    let selectedIndex = 0;
    let files: FileItem[] = [];
    let filteredFiles: FileItem[] = [];
    let inputElement: HTMLInputElement;

    // Subscribe to fileStore
    onMount(() => {
        const unsubscribe = fileStore.subscribe(value => {
            files = value;
            updateFilteredFiles();
        });

        return () => {
            unsubscribe();
        };
    });

    function updateFilteredFiles() {
        if (searchQuery) {
            filteredFiles = fuzzySearch(files, searchQuery, (file) => file.name);
        } else {
            filteredFiles = [...files];
        }
        selectedIndex = 0;
    }

    $: if (searchQuery !== undefined) {
        updateFilteredFiles();
    }

    $: if (show) {
        // Use setTimeout to ensure the DOM is updated
        setTimeout(() => {
            inputElement?.focus();
        }, 0);
    }

    afterUpdate(() => {
        if (previousShow && !show) {
            vimModeEnabled = false;
        }
        previousShow = show;
    });

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
                event.preventDefault();
                selectedIndex = (selectedIndex + 1) % filteredFiles.length;
                break;
            case 'ArrowUp':
                event.preventDefault();
                selectedIndex = selectedIndex - 1 < 0 
                    ? filteredFiles.length - 1 
                    : selectedIndex - 1;
                break;
            case 'j':
                if (vimModeEnabled) {
                    event.preventDefault();
                    selectedIndex = (selectedIndex + 1) % filteredFiles.length;
                }
                break;
            case 'k':
                if (vimModeEnabled) {
                    event.preventDefault();
                    selectedIndex = selectedIndex - 1 < 0 
                        ? filteredFiles.length - 1 
                        : selectedIndex - 1;
                }
                break;
            case 'Enter':
                event.preventDefault();
                if (filteredFiles[selectedIndex]) {
                    openFile(filteredFiles[selectedIndex]);
                }
                break;
            case 'Escape':
                event.preventDefault();
                closeFileFinder();
                break;
        }
    }

    function openFile(file: FileItem) {
        dispatch('select', file);
        closeFileFinder();
    }

    function closeFileFinder() {
        searchQuery = '';
        selectedIndex = 0;
        show = false;
        dispatch('close');
    }

    function handleClickOutside() {
        closeFileFinder();
    }

    function handleClickInside(event: MouseEvent) {
        event.stopPropagation();
    }

    onMount(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    });

    function getFileIcon(type: string) {
        return type === 'directory' ? Folder : File;
    }

    function formatPath(path: string) {
        const parts = path.split('/');
        const fileName = parts.pop();
        return {
            path: parts.join('/'),
            fileName
        };
    }
</script>

{#if show}
    <div 
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-[20vh]"
        on:click={handleClickOutside}
    >
        <div 
            class="w-[600px] bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden"
            on:click={handleClickInside}
        >
            <div class="relative">
                <div class="pl-10">
                    <Input
                        bind:value={searchQuery}
                        placeholder="Type to search files..."
                        bind:this={inputElement}
                        autofocus
                    />
                </div>
                <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={16} />
                </div>
            </div>

            {#if filteredFiles.length > 0}
                <div class="max-h-[400px] overflow-y-auto">
                    {#each filteredFiles as file, index}
                        {@const { path, fileName } = formatPath(file.path)}
                        <button
                            class="w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-gray-800 
                                {index === selectedIndex ? 'bg-gray-800' : ''}"
                            on:click={() => openFile(file)}
                        >
                            <svelte:component 
                                this={getFileIcon(file.type)} 
                                size={16}
                                class="text-gray-400 flex-shrink-0"
                            />
                            <div class="flex flex-col min-w-0">
                                <span class="text-gray-300 font-medium truncate">{fileName}</span>
                                {#if path}
                                    <span class="text-gray-500 text-sm truncate">{path}</span>
                                {/if}
                            </div>
                        </button>
                    {/each}
                </div>
            {:else}
                <div class="px-4 py-8 text-center text-gray-500">
                    No files found
                </div>
            {/if}
        </div>
    </div>
{/if}
