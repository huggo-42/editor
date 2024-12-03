<script lang="ts">
    import {
        ChevronDown,
        ChevronRight,
        FolderOpen,
        Folder,
        File,
    } from "lucide-svelte";
    import type { FileNode } from "../../types";

    export let item: FileNode;
    export let depth = 0;
    export let onContextMenu: (e: MouseEvent, item: FileNode) => void;
    export let onRename: (id: string, newName: string) => void;
    export let isAllCollapsed = false;

    let isOpen = !isAllCollapsed && item.expanded;
    let editingName = item.name;
    let inputElement: HTMLInputElement;

    $: {
        if (isAllCollapsed !== undefined) {
            isOpen = !isAllCollapsed && item.expanded;
        }
    }

    $: {
        if (item.isRenaming && inputElement) {
            inputElement.focus();
            inputElement.select();
        }
    }

    function toggleFolder(e: MouseEvent) {
        e.stopPropagation();
        if (item.type === "folder") {
            isOpen = !isOpen;
            item.expanded = isOpen;
        }
    }

    function handleRenameSubmit(e: Event) {
        e.preventDefault();
        onRename(item.id, editingName);
    }

    function handleRenameChange(e: Event) {
        editingName = (e.target as HTMLInputElement).value;
    }
</script>

<div class="relative" style="padding-left: {depth * 1.5}rem">
    <button
        class="flex items-center py-1 px-2 hover:bg-gray-800 cursor-pointer group"
        on:click={toggleFolder}
        on:contextmenu|preventDefault={(e) => onContextMenu(e, item)}
    >
        <span class="mr-1">
            {#if item.type === "folder"}
                <button
                    class="p-0.5 hover:bg-gray-700 rounded"
                    on:click|stopPropagation={toggleFolder}
                >
                    {#if isOpen}
                        <ChevronDown size={16} />
                    {:else}
                        <ChevronRight size={16} />
                    {/if}
                </button>
            {:else}
                <span class="w-[26px]" />
            {/if}
        </span>

        <span class="mr-1">
            {#if item.type === "folder"}
                {#if isOpen}
                    <FolderOpen size={16} />
                {:else}
                    <Folder size={16} />
                {/if}
            {:else}
                <File size={16} />
            {/if}
        </span>

        {#if item.isRenaming}
            <form on:submit={handleRenameSubmit} class="flex-grow">
                <input
                    bind:this={inputElement}
                    bind:value={editingName}
                    class="w-full bg-gray-700 px-1 rounded"
                    on:input={handleRenameChange}
                    on:blur={handleRenameSubmit}
                />
            </form>
        {:else}
            <span class="flex-grow truncate">{item.name}</span>
        {/if}
        </button>

    {#if item.type === "folder" && isOpen}
        <div class="file-tree-children">
            {#each item.children || [] as child (child.id)}
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
