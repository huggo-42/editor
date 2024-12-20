<script lang="ts">
    import {
        ChevronDown,
        ChevronRight,
        FolderOpen,
        Folder,
        File,
        Loader2,
    } from "lucide-svelte";
    import type { service } from '@/lib/wailsjs/go/models';
    import { fileStore } from '@/stores/fileStore';
    import { LoadDirectoryContents } from '@/lib/wailsjs/go/main/App';

    type FileNode = service.FileNode;

    export let item: FileNode;
    export let depth = 0;
    export let onContextMenu: (e: MouseEvent, item: FileNode) => void;
    export let onRename: (path: string, newName: string) => void;
    export let isAllCollapsed = false;

    let isOpen = false;
    let isLoading = false;
    let isRenaming = false;
    let editingName = item.name;
    let inputElement: HTMLInputElement;
    let validationError = '';
    let originalName = '';

    // Validation rules
    const isValidFileName = (name: string) => {
        if (!name || name.trim() === '') return 'Name cannot be empty';
        if (name.includes('/') || name.includes('\\')) return 'Name cannot contain slashes';
        if (name === '.' || name === '..') return 'Invalid file name';
        if (/[<>:"|?*]/.test(name)) return 'Name contains invalid characters';
        return '';
    };

    $: isDirectory = item.type === "directory";
    $: hasChildren = isDirectory && item.children && item.children.length > 0;
    $: isActive = $fileStore.activeFilePath === item.path;

    $: {
        if (isAllCollapsed) {
            isOpen = false;
        }
    }

    async function toggleFolder(e: MouseEvent) {
        e.stopPropagation();
        if (isDirectory) {
            if (!item.isLoaded && !isOpen) {
                isLoading = true;
                try {
                    const updatedNode = await LoadDirectoryContents(item.path);
                    if (updatedNode) {
                        item.children = updatedNode.children;
                        item.isLoaded = true;
                    }
                } catch (error) {
                    console.error('Error loading directory:', error);
                } finally {
                    isLoading = false;
                }
            }
            isOpen = !isOpen;
        } else {
            fileStore.openFile(item.path);
        }
    }

    function startRename() {
        isRenaming = true;
        editingName = item.name;
        
        // Focus and select filename without extension
        setTimeout(() => {
            if (inputElement) {
                inputElement.focus();
                const lastDotIndex = item.name.lastIndexOf('.');
                if (lastDotIndex > 0) { // Has extension and not hidden file (starting with .)
                    inputElement.setSelectionRange(0, lastDotIndex);
                } else {
                    inputElement.setSelectionRange(0, item.name.length);
                }
            }
        }, 0);
    }

    function handleRenameKeydown(e: KeyboardEvent) {
        e.stopPropagation();
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            finishRename();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelRename();
        }
    }

    function handleRenameInput() {
        validationError = isValidFileName(editingName);
    }

    function finishRename(e?: Event) {
        if (e?.type === 'blur' && (e.target as HTMLInputElement)?.matches(':focus-within')) {
            return;
        }

        const error = isValidFileName(editingName);
        if (error) {
            validationError = error;
            return;
        }
        if (editingName && editingName !== item.name) {
            onRename(item.path, editingName);
        }
        isRenaming = false;
        item.isRenaming = false;
        validationError = '';
    }

    function cancelRename() {
        editingName = originalName;
        isRenaming = false;
        validationError = '';
    }
</script>

<div class="relative">
    <div
        class="flex items-center py-1 px-2 hover:bg-gray-800 cursor-pointer group rounded-sm mx-1 hover:rounded-md {isActive ? 'bg-gray-700' : ''}"
        on:click={toggleFolder}
        on:contextmenu|preventDefault={(e) => onContextMenu(e, item)}
        on:startRename={startRename}
        on:keydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFolder(e);
            }
        }}
        data-path={item.path}
        role="button"
        tabindex="0"
        aria-expanded={isDirectory ? isOpen : undefined}
        aria-label={`${item.name} ${item.type}`}
        style="padding-left: {depth * 20}px"
    >
        <span class="mr-1 w-[20px] flex justify-center">
            {#if isDirectory}
                {#if isLoading}
                    <Loader2 size={16} class="animate-spin" />
                {:else}
                    <button
                        class="p-0.5 rounded"
                        on:click|stopPropagation={toggleFolder}
                        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${item.name} folder`}
                    >
                        {#if isOpen}
                            <ChevronDown size={16} />
                        {:else}
                            <ChevronRight size={16} />
                        {/if}
                    </button>
                {/if}
            {:else}
                <span class="invisible">
                    <ChevronRight size={16} />
                </span>
            {/if}
        </span>

        <span class="mr-1 w-[20px] flex justify-center {isDirectory ? 'text-sky-400' : ''}">
            {#if isDirectory}
                {#if isOpen}
                    <FolderOpen size={16} />
                {:else}
                    <Folder size={16} />
                {/if}
            {:else}
                <File size={16} />
            {/if}
        </span>

        {#if isRenaming}
            <form 
                on:submit|preventDefault={finishRename}
                class="flex-grow"
            >
                <input
                    bind:this={inputElement}
                    bind:value={editingName}
                    on:input={handleRenameInput}
                    on:keydown={handleRenameKeydown}
                    on:blur={finishRename}
                    on:click|stopPropagation={() => {}}
                    class="w-full bg-gray-700 px-1 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm"
                />
                {#if validationError}
                    <div class="absolute left-0 bottom-[-20px] text-xs text-red-500 bg-gray-900 px-2 py-1 rounded">
                        {validationError}
                    </div>
                {/if}
            </form>
        {:else}
            <span class="flex-grow truncate text-sm">{item.name}</span>
        {/if}
    </div>

    {#if isDirectory && isOpen && item.children}
        <div>
            {#each item.children as child (child.path)}
                <svelte:self
                    item={child}
                    depth={depth + 1}
                    {onContextMenu}
                    {onRename}
                    {isAllCollapsed}
                />
            {/each}
        </div>
    {/if}
</div>

<style>
    input {
        outline: none;
    }

    input::selection {
        background-color: theme('colors.sky.900');
        color: theme('colors.sky.100');
    }

    /* Prevent text selection while dragging */
    span {
        user-select: none;
    }
</style>
