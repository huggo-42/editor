<script lang="ts">
    import {
        FileText,
        GitBranch,
        User,
        Folder,
        FileIcon,
        RefreshCw,
        ChevronsDown,
        Plus
    } from 'lucide-svelte';
    import ContextMenu from './ContextMenu.svelte';
    import FileTreeItem from './FileTreeItem.svelte';
    import type { FileNode, GitStatusItem, SidebarState } from '../../types';

    export let state: SidebarState;

    let contextMenu = {
        show: false,
        x: 0,
        y: 0,
        targetItem: null as FileNode | null
    };

    const initialFileTree: FileNode[] = [
        {
            id: '1',
            name: 'src',
            type: 'folder',
            path: '/src',
            expanded: true,
            children: [
                { id: '2', name: 'lib', type: 'folder', path: '/src/lib', children: [] },
                { id: '3', name: 'routes', type: 'folder', path: '/src/routes', children: [] },
                { id: '4', name: 'App.tsx', type: 'file', path: '/src/App.tsx' },
                { id: '5', name: 'LeftSidebar.tsx', type: 'file', path: '/src/LeftSidebar.tsx' },
                { id: '6', name: 'Editor.tsx', type: 'file', path: '/src/Editor.tsx' },
                { id: '7', name: 'RightSidebar.tsx', type: 'file', path: '/src/RightSidebar.tsx' },
                { id: '8', name: 'BottomBar.tsx', type: 'file', path: '/src/BottomBar.tsx' },
            ]
        },
        {
            id: '9',
            name: 'public',
            type: 'folder',
            path: '/public',
            children: [{ id: '10', name: 'index.html', type: 'file', path: '/public/index.html' }]
        },
        { id: '11', name: 'package.json', type: 'file', path: '/package.json' }
    ];

    const gitStatus: GitStatusItem[] = [
        { status: 'modified', file: 'src/App.tsx' },
        { status: 'new', file: 'src/LeftSidebar.tsx' }
    ];

    let fileTree = initialFileTree;
    let isAllCollapsed = false;

    function handleContextMenu(e: MouseEvent, item: FileNode) {
        e.preventDefault();
        contextMenu = {
            show: true,
            x: e.clientX,
            y: e.clientY,
            targetItem: item
        };
    }

    function handleRename(id: string, newName: string) {
        fileTree = fileTree.map(item => {
            if (item.id === id) {
                return { ...item, name: newName, isRenaming: false };
            }
            if (item.children) {
                return {
                    ...item,
                    children: item.children.map(child =>
                        child.id === id
                            ? { ...child, name: newName, isRenaming: false }
                            : child
                    )
                };
            }
            return item;
        });
    }

    function collapseAll() {
        isAllCollapsed = true;
        fileTree = fileTree.map(item => ({
            ...item,
            expanded: false,
            children: item.children?.map(child => ({ ...child, expanded: false }))
        }));
    }
</script>

<div class="h-full flex flex-col bg-gray-900 border-r border-gray-800 {state.collapsed ? 'w-12' : 'w-64'}">
    <div class="flex items-center justify-between p-2 border-b border-gray-800">
        <div class="flex items-center space-x-2">
            {#if !state.collapsed}
                <span class="text-sm font-medium">Explorer</span>
            {/if}
        </div>
        {#if !state.collapsed}
            <div class="flex items-center space-x-1">
                <button
                    class="p-1 hover:bg-gray-800 rounded"
                    on:click={collapseAll}
                    title="Collapse All"
                >
                    <ChevronsDown size={16} />
                </button>
                <button
                    class="p-1 hover:bg-gray-800 rounded"
                    title="Refresh Explorer"
                >
                    <RefreshCw size={16} />
                </button>
            </div>
        {/if}
    </div>

    <div class="flex-1 overflow-auto">
        <div class="p-2">
            <div class="mb-4">
                <div class="flex items-center justify-between text-sm text-gray-500 mb-1">
                    <span>FILES</span>
                    <button
                        class="p-1 hover:bg-gray-800 rounded"
                        title="New File"
                    >
                        <Plus size={14} />
                    </button>
                </div>
                {#each fileTree as item (item.id)}
                    <FileTreeItem
                        {item}
                        onContextMenu={handleContextMenu}
                        onRename={handleRename}
                        isAllCollapsed={isAllCollapsed}
                    />
                {/each}
            </div>

            {#if !state.collapsed}
                <div class="mb-4">
                    <div class="flex items-center text-sm text-gray-500 mb-1">
                        <GitBranch size={16} class="mr-1" />
                        <span>SOURCE CONTROL</span>
                    </div>
                    <div class="pl-4">
                        {#each gitStatus as item}
                            <div class="flex items-center text-sm py-1">
                                <span class="w-2 h-2 rounded-full mr-2 {item.status === 'modified' ? 'bg-blue-400' : 'bg-green-400'}" />
                                <span class="text-gray-300">{item.file}</span>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

{#if contextMenu.show}
    <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        items={[
            {
                label: 'New File',
                icon: FileText,
                action: () => {
                    // Handle new file
                    contextMenu.show = false;
                }
            },
            {
                label: 'New Folder',
                icon: Folder,
                action: () => {
                    // Handle new folder
                    contextMenu.show = false;
                }
            },
            { divider: true },
            {
                label: 'Rename',
                action: () => {
                    if (contextMenu.targetItem) {
                        fileTree = fileTree.map(item => ({
                            ...item,
                            isRenaming: item.id === contextMenu.targetItem?.id
                        }));
                    }
                    contextMenu.show = false;
                }
            }
        ]}
        onClose={() => contextMenu.show = false}
    />
{/if}
