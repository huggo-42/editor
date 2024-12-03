<script lang="ts">
    import {
        FileText,
        GitBranch,
        User,
        Folder,
        FileIcon,
        RefreshCw,
        ChevronsUp,
        Plus,
        Files,
        Check,
        MoreVertical,
        Undo,
        GitCommit,
        Plus as PlusCircle,
        ChevronDown,
        ChevronRight,
        Clock,
        Trash2
    } from 'lucide-svelte';
    import ContextMenu from './ContextMenu.svelte';
    import FileTreeItem from './FileTreeItem.svelte';
    import DropdownMenu from '../components/DropdownMenu.svelte';
    import type { FileNode, GitStatusItem, SidebarState } from '../../types';

    export let state: SidebarState;

    let contextMenu = {
        show: false,
        x: 0,
        y: 0,
        targetItem: null as FileNode | null
    };

    let showMoreCommitOptions = false;

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
        // Reset isAllCollapsed after collapsing to allow re-expanding
        setTimeout(() => {
            isAllCollapsed = false;
        }, 0);
    }

    function setActiveSection(section: 'files' | 'git') {
        state.activeSection = section;
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

    function handleMoreCommitOptions() {
        // Handle more commit options
        console.log('More commit options');
    }

    function handleStash() {
        alert('Stash changes');
    }

    function handleAmend() {
        console.log('Amend commit');
    }

    $: modifiedFilesCount = gitStatus.length;
</script>

<div class="h-full w-full flex flex-col overflow-hidden border-r border-gray-800">
    <div class="flex flex-col h-full">
        {#if state.activeSection === 'files'}
            <div class="flex items-center justify-between h-[35px] px-4 border-b border-gray-800">
                <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium">Explorer</span>
                </div>
                <div class="flex items-center space-x-1">
                    <button
                        class="p-1 hover:bg-gray-800 rounded"
                        on:click={collapseAll}
                        title="Collapse All"
                    >
                        <ChevronsUp size={16} />
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
        {#if state.activeSection === 'git'}
            <div class="flex items-center justify-between h-[35px] px-4 border-b border-gray-800">
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
                            on:click={() => showSourceControlActions = !showSourceControlActions}
                            title="More Actions"
                        >
                            <MoreVertical size={16} />
                        </button>
                        <DropdownMenu
                            show={showSourceControlActions}
                            onClose={() => showSourceControlActions = false}
                            items={[
                                {
                                    icon: Plus,
                                    label: 'Stage All Changes',
                                    onClick: handleStageAll
                                },
                                {
                                    icon: Undo,
                                    label: 'Unstage All Changes',
                                    onClick: handleUnstageAll
                                },
                                {
                                    icon: Trash2,
                                    label: 'Discard All Changes',
                                    onClick: handleDiscard
                                }
                            ]}
                        />
                    </div>
                </div>
            </div>

            <div class="flex-1 overflow-auto flex flex-col">
                <div class="p-1 pt-2 flex-1">
                    <!-- Staged Changes -->
                    {#if stagedChanges.length > 0}
                        <div class="mb-4">
                            <div class="flex items-center text-sm text-gray-500 mb-1 px-4">
                                <span>Staged Changes ({stagedChanges.length})</span>
                            </div>
                            <div>
                                {#each stagedChanges as item}
                                    <div class="flex items-center text-sm py-1 group hover:bg-gray-800/50 rounded-md mx-2">
                                        <div class="flex items-center px-2 w-full">
                                            <span class="w-2 h-2 rounded-full mr-2 flex-shrink-0 {item.status === 'modified' ? 'bg-blue-400' : 'bg-green-400'}" />
                                            <span class="text-gray-300 truncate flex-1" title={item.file}>{item.file}</span>
                                            <div class="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    class="p-1 hover:bg-gray-700 rounded"
                                                    title="Unstage Changes"
                                                >
                                                    <Undo size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <!-- Unstaged Changes -->
                    <div class="mb-4">
                        <div class="flex items-center text-sm text-gray-500 mb-1 px-4">
                            <span>Changes ({unstagedChanges.length})</span>
                        </div>
                        <div>
                            {#each unstagedChanges as item}
                                <div class="flex items-center text-sm py-1 group hover:bg-gray-800/50 rounded-md mx-2">
                                    <div class="flex items-center px-2 w-full">
                                        <span class="w-2 h-2 rounded-full mr-2 flex-shrink-0 {item.status === 'modified' ? 'bg-blue-400' : 'bg-green-400'}" />
                                        <span class="text-gray-300 truncate flex-1" title={item.file}>{item.file}</span>
                                        <div class="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                class="p-1 hover:bg-gray-700 rounded"
                                                title="Stage Changes"
                                            >
                                                <Plus size={14} />
                                            </button>
                                            <button
                                                class="p-1 hover:bg-gray-700 rounded"
                                                title="Discard Changes"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
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
                    />
                    <div class="flex justify-between items-center relative">
                        <button
                            class="flex items-center space-x-1 px-6 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!commitMessage || stagedChanges.length === 0}
                            on:click={handleCommit}
                        >
                            <GitCommit size={14} />
                            <span class="text-sm">Commit</span>
                        </button>
                        <button
                            class="p-1 hover:bg-gray-800 rounded"
                            on:click={() => showMoreCommitOptions = !showMoreCommitOptions}
                            title="More Commit Options"
                        >
                            <MoreVertical size={16} />
                        </button>
                        <DropdownMenu
                            show={showMoreCommitOptions}
                            onClose={() => showMoreCommitOptions = false}
                            position="top"
                            items={[
                                {
                                    icon: GitCommit,
                                    label: 'Commit (Amend)',
                                    onClick: handleAmend
                                },
                                {
                                    icon: Clock,
                                    label: 'Stash Changes',
                                    onClick: handleStash
                                }
                            ]}
                        />
                    </div>

                    <!-- Recent Commits Section -->
                    <div class="mt-2 border-t border-gray-800 pt-2">
                        <button
                            class="flex items-center text-sm text-gray-400 hover:text-gray-300 w-full px-2 py-1 hover:bg-gray-800 rounded"
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
                            <div class="mt-1">
                                {#each recentCommits as commit}
                                    <div 
                                        class="group flex items-start py-1.5 px-2 hover:bg-gray-800 rounded cursor-pointer text-sm"
                                        title="Click to show details"
                                    >
                                        <Clock size={14} class="mt-1 mr-2 text-gray-500 flex-shrink-0" />
                                        <div class="flex-1 min-w-0">
                                            <div class="text-gray-300 truncate">{commit.message}</div>
                                            <div class="text-gray-500 text-xs mt-0.5 truncate">
                                                {commit.hash.substring(0, 7)} • {commit.author} • {commit.date}
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
