<script lang="ts">
    import {
        FileText,
        GitBranch,
        User,
        Folder,
        FileIcon,
        RefreshCw,
        ChevronsDown,
        Plus,
        Files,
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
    let activeSection: 'files' | 'git' = 'files';

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

    function setActiveSection(section: 'files' | 'git') {
        if (state.collapsed) {
            state.collapsed = false;
        }
        activeSection = section;
    }

    $: modifiedFilesCount = gitStatus.length;
</script>

<div class="h-full flex flex-col bg-gray-900 border-r border-gray-800 {state.collapsed ? 'w-12' : 'w-64'}">
    <div class="flex flex-col h-full">
        <!-- Sidebar Icons -->
        <div class="flex flex-col items-center py-2 {state.collapsed ? 'space-y-4' : 'hidden'}">
            <button
                class="p-2 hover:bg-gray-800 rounded-sm relative {activeSection === 'files' ? 'bg-gray-800' : ''}"
                on:click={() => setActiveSection('files')}
                title="Explorer"
            >
                <Files size={20} />
            </button>
            <button
                class="p-2 hover:bg-gray-800 rounded-sm relative {activeSection === 'git' ? 'bg-gray-800' : ''}"
                on:click={() => setActiveSection('git')}
                title="Source Control"
            >
                <GitBranch size={20} />
                {#if modifiedFilesCount > 0}
                    <div class="absolute top-0 right-0 -mt-1 -mr-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                        {modifiedFilesCount}
                    </div>
                {/if}
            </button>
        </div>

        <!-- Expanded View -->
        {#if !state.collapsed}
            <!-- Files Section -->
            {#if activeSection === 'files'}
                <div class="flex items-center justify-between p-2 border-b border-gray-800">
                    <div class="flex items-center space-x-2">
                        <span class="text-sm font-medium">Explorer</span>
                    </div>
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
                    </div>
                </div>
            {/if}

            <!-- Git Section -->
            {#if activeSection === 'git'}
                <div class="flex items-center justify-between p-2 border-b border-gray-800">
                    <div class="flex items-center space-x-2">
                        <span class="text-sm font-medium">Source Control</span>
                    </div>
                    <div class="flex items-center space-x-1">
                        <button
                            class="p-1 hover:bg-gray-800 rounded"
                            title="Refresh"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>

                <div class="flex-1 overflow-auto">
                    <div class="p-2">
                        <div class="mb-4">
                            <div class="flex items-center text-sm text-gray-500 mb-1">
                                <span>Changes ({modifiedFilesCount})</span>
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
                    </div>
                </div>
            {/if}
        {/if}
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
