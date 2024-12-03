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
        Check,
        MoreVertical,
        Undo,
        GitCommit,
        Plus as PlusCircle,
        ChevronDown,
        ChevronRight,
        Clock
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
        { status: 'modified', file: 'src/App.tsx', staged: true },
        { status: 'new', file: 'src/LeftSidebar.tsx', staged: false }
    ];

    let fileTree = initialFileTree;
    let isAllCollapsed = false;
    let activeSection: 'files' | 'git' = 'files';
    let commitMessage = '';
    let showSourceControlActions = false;
    let showCommits = false;

    // Mock data for commits - replace with actual git log data
    const recentCommits = [
        {
            hash: 'abc1234',
            message: 'feat: Add source control panel',
            author: 'John Doe',
            date: '2 hours ago',
            files: ['src/lib/editor/LeftSidebar.svelte', 'src/lib/editor/Editor.svelte']
        },
        {
            hash: 'def5678',
            message: 'fix: Resolve sidebar collapse issues',
            author: 'Jane Smith',
            date: '5 hours ago',
            files: ['src/lib/editor/LeftSidebar.svelte']
        },
        {
            hash: 'ghi9012',
            message: 'chore: Update dependencies',
            author: 'John Doe',
            date: '1 day ago',
            files: ['package.json', 'yarn.lock']
        }
    ];

    // Separate staged and unstaged changes
    $: stagedChanges = gitStatus.filter(item => item.staged);
    $: unstagedChanges = gitStatus.filter(item => !item.staged);

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

    function handleCommit(amend = false) {
        // Handle commit logic
        console.log('Committing with message:', commitMessage, 'amend:', amend);
        commitMessage = '';
    }

    function handleStageAll() {
        // Handle stage all files
        console.log('Staging all files');
    }

    function handleUnstageAll() {
        // Handle unstage all files
        console.log('Unstaging all files');
    }

    function handleDiscard() {
        // Handle discard changes
        console.log('Discarding changes');
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
                            title="Stage All Changes"
                            on:click={handleStageAll}
                        >
                            <Plus size={16} />
                        </button>
                        <button
                            class="p-1 hover:bg-gray-800 rounded"
                            title="Refresh"
                        >
                            <RefreshCw size={16} />
                        </button>
                        <div class="relative">
                            <button
                                class="p-1 hover:bg-gray-800 rounded"
                                title="More Actions"
                                on:click={() => showSourceControlActions = !showSourceControlActions}
                            >
                                <MoreVertical size={16} />
                            </button>
                            {#if showSourceControlActions}
                                <div 
                                    class="absolute right-0 mt-1 py-1 w-48 bg-gray-800 rounded-md shadow-lg z-50"
                                    on:mouseleave={() => showSourceControlActions = false}
                                >
                                    <button
                                        class="w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700 flex items-center"
                                        on:click={() => {
                                            handleStageAll();
                                            showSourceControlActions = false;
                                        }}
                                    >
                                        <Plus size={14} class="mr-2" />
                                        Stage All Changes
                                    </button>
                                    <button
                                        class="w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700 flex items-center"
                                        on:click={() => {
                                            handleUnstageAll();
                                            showSourceControlActions = false;
                                        }}
                                    >
                                        <Undo size={14} class="mr-2" />
                                        Unstage All Changes
                                    </button>
                                    <button
                                        class="w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700 flex items-center"
                                        on:click={() => {
                                            handleDiscard();
                                            showSourceControlActions = false;
                                        }}
                                    >
                                        <Undo size={14} class="mr-2" />
                                        Discard All Changes
                                    </button>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>

                <div class="flex-1 overflow-auto flex flex-col">
                    <div class="p-2 flex-1">
                        <!-- Staged Changes -->
                        {#if stagedChanges.length > 0}
                            <div class="mb-4">
                                <div class="flex items-center text-sm text-gray-500 mb-1">
                                    <span>Staged Changes ({stagedChanges.length})</span>
                                </div>
                                <div class="pl-4">
                                    {#each stagedChanges as item}
                                        <div class="flex items-center text-sm py-1 group hover:bg-gray-800/50 rounded px-1">
                                            <span class="w-2 h-2 rounded-full mr-2 flex-shrink-0 {item.status === 'modified' ? 'bg-blue-400' : 'bg-green-400'}" />
                                            <span class="text-gray-300 truncate flex-1" title={item.file}>{item.file}</span>
                                            <div class="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    class="p-1 hover:bg-gray-800 rounded"
                                                    title="Unstage Changes"
                                                >
                                                    <Undo size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}

                        <!-- Unstaged Changes -->
                        <div class="mb-4">
                            <div class="flex items-center text-sm text-gray-500 mb-1">
                                <span>Changes ({unstagedChanges.length})</span>
                            </div>
                            <div class="pl-4">
                                {#each unstagedChanges as item}
                                    <div class="flex items-center text-sm py-1 group hover:bg-gray-800/50 rounded px-1">
                                        <span class="w-2 h-2 rounded-full mr-2 flex-shrink-0 {item.status === 'modified' ? 'bg-blue-400' : 'bg-green-400'}" />
                                        <span class="text-gray-300 truncate flex-1" title={item.file}>{item.file}</span>
                                        <div class="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                class="p-1 hover:bg-gray-800 rounded"
                                                title="Stage Changes"
                                            >
                                                <Plus size={14} />
                                            </button>
                                            <button
                                                class="p-1 hover:bg-gray-800 rounded"
                                                title="Discard Changes"
                                            >
                                                <Undo size={14} />
                                            </button>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>

                    <!-- Commit Section -->
                    <div class="p-2 border-t border-gray-800">
                        <textarea
                            bind:value={commitMessage}
                            placeholder="Message (⌘Enter to commit)"
                            class="w-full h-20 bg-gray-800 text-gray-300 text-sm p-2 rounded mb-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                        ></textarea>
                        <div class="flex space-x-2 mb-3">
                            <button
                                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center"
                                on:click={() => handleCommit(false)}
                                disabled={!commitMessage}
                            >
                                <GitCommit size={14} class="mr-1" />
                                Commit
                            </button>
                            <button
                                class="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm"
                                on:click={() => handleCommit(true)}
                                disabled={!commitMessage}
                            >
                                Amend
                            </button>
                        </div>

                        <!-- Recent Commits Section -->
                        <div class="border-t border-gray-800 pt-2">
                            <button
                                class="flex items-center text-sm text-gray-400 hover:text-gray-300 w-full"
                                on:click={() => showCommits = !showCommits}
                            >
                                {#if showCommits}
                                    <ChevronDown size={16} class="mr-1" />
                                {:else}
                                    <ChevronRight size={16} class="mr-1" />
                                {/if}
                                Recent Commits
                            </button>
                            {#if showCommits}
                                <div class="mt-2">
                                    {#each recentCommits as commit}
                                        <div 
                                            class="group flex items-start py-2 px-2 hover:bg-gray-800 rounded cursor-pointer text-sm"
                                            title="Click to show details"
                                        >
                                            <Clock size={14} class="mt-1 mr-2 text-gray-500" />
                                            <div class="flex-1">
                                                <div class="text-gray-300">{commit.message}</div>
                                                <div class="text-gray-500 text-xs mt-1">
                                                    {commit.hash.substring(0, 7)} • {commit.author} • {commit.date}
                                                </div>
                                                <div class="hidden group-hover:block text-gray-500 text-xs mt-1">
                                                    Modified files: {commit.files.join(', ')}
                                                </div>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
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
