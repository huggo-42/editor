<script lang="ts">
    import { Edit, FolderPlus, Plus, Trash2 } from 'lucide-svelte';
    import FileTreeItem from '../editor/FileTreeItem.svelte';
    import ContextMenu from '../editor/ContextMenu.svelte';
    import type { service } from '@/lib/wailsjs/go/models';
    import { fileStore } from '@/stores/fileStore';

    type FileNode = service.FileNode;

    export let fileTree: FileNode[] = [];
    export let isAllCollapsed = false;
    export let key = 0;  // Add key prop to force re-render

    let contextMenu = {
        show: false,
        x: 0,
        y: 0,
        targetItem: null as FileNode | null
    };

    function handleContextMenu(e: MouseEvent, item: FileNode) {
        e.preventDefault();
        contextMenu = {
            show: true,
            x: e.clientX,
            y: e.clientY,
            targetItem: item
        };
    }

    function handleCloseContextMenu() {
        contextMenu.show = false;
    }

    function handleContextMenuAction(action: string) {
        if (!contextMenu.targetItem) return;

        switch (action) {
            case 'rename':
                // TODO: Implement rename
                break;
            case 'delete':
                // TODO: Implement delete
                break;
            case 'newFile':
                // TODO: Implement new file
                break;
            case 'newFolder':
                // TODO: Implement new folder
                break;
        }
        handleCloseContextMenu();
    }

    function handleRename(path: string, newName: string) {
        // TODO: Implement rename logic
    }
</script>

<div class="h-full overflow-auto">
    {#if $fileStore.loading}
        <div class="p-4 text-sm text-gray-500">Loading files...</div>
    {:else if $fileStore.error}
        <div class="p-4 text-sm text-red-500">{$fileStore.error}</div>
    {:else if fileTree && fileTree.length > 0}
        {#each fileTree as item (item.path)}
            <FileTreeItem
                {item}
                {isAllCollapsed}
                onContextMenu={(e) => handleContextMenu(e, item)}
                onRename={(path, newName) => handleRename(path, newName)}
            />
        {/each}
    {:else}
        <div class="p-4 text-sm text-gray-500">No files found</div>
    {/if}

    {#if contextMenu.show}
        <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            on:close={handleCloseContextMenu}
            items={[
                { label: 'New File', icon: Plus, action: () => handleContextMenuAction('newFile') },
                { label: 'New Folder', icon: FolderPlus, action: () => handleContextMenuAction('newFolder') },
                { label: 'Rename', icon: Edit, action: () => handleContextMenuAction('rename') },
                { label: 'Delete', icon: Trash2, action: () => handleContextMenuAction('delete') }
            ]}
            on:action={({ detail }) => handleContextMenuAction(detail)}
            onClose={handleCloseContextMenu}
        />
    {/if}
</div>
