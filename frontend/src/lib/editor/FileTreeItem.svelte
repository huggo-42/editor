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
    let editingName = item.name;
    let inputElement: HTMLInputElement;

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

    function handleRenameSubmit(e: Event) {
        e.preventDefault();
        onRename(item.path, editingName);
    }

    function handleRenameChange(e: Event) {
        editingName = (e.target as HTMLInputElement).value;
    }
</script>

<div class="relative">
    <div
        class="flex items-center py-1 px-2 hover:bg-gray-800 cursor-pointer group rounded-sm mx-1 hover:rounded-md {isActive ? 'bg-sky-800' : ''}"
        on:click={toggleFolder}
        on:contextmenu|preventDefault={(e) => onContextMenu(e, item)}
        on:keydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFolder(e);
            }
        }}
        role="button"
        tabindex="0"
        aria-expanded={item.type === 'directory' ? isOpen : undefined}
        aria-label={`${item.name} ${item.type}`}
    >
        <div class="flex items-center flex-1 overflow-hidden"  style="padding-left: {depth * 0.5}rem">
            {#if isDirectory}
                <div class="w-4 h-4 flex items-center justify-center">
                    {#if isLoading}
                        <Loader2 class="animate-spin" size={16} />
                    {:else if hasChildren}
                        {#if isOpen}
                            <ChevronDown size={16} />
                        {:else}
                            <ChevronRight size={16} />
                        {/if}
                    {/if}
                </div>
                <div class="w-4 h-4 ml-1 text-sky-400">
                    {#if isOpen}
                        <FolderOpen size={16} />
                    {:else}
                        <Folder size={16} />
                    {/if}
                </div>
            {:else}
                <div class="w-4 h-4 ml-5">
                    <File size={16} />
                </div>
            {/if}

            {#if item.isRenaming}
                <form on:submit={handleRenameSubmit} class="flex-1">
                    <input
                        bind:this={inputElement}
                        type="text"
                        class="w-full bg-gray-800 text-sm px-1 rounded"
                        value={editingName}
                        on:change={handleRenameChange}
                        on:blur={() => onRename(item.path, editingName)}
                    />
                </form>
            {:else}
                <span class="ml-1 truncate">{item.name}</span>
            {/if}
        </div>
    </div>

    {#if isOpen && hasChildren}
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
</style>
