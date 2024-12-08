<script lang="ts">
    import {
        MoreVertical,
        Undo,
        GitCommit,
        Plus,
        Clock,
        Trash2,
        ChevronRight,
        RefreshCw

    } from 'lucide-svelte';
    import DropdownMenu from '../components/DropdownMenu.svelte';
    import Button from '../components/Button.svelte';
    import Input from '../components/Input.svelte';
    import ExplorerPane from './panes/ExplorerPane.svelte';
    import type { GitStatusItem } from '@/types';
    import type { SidebarState } from '@/types/ui';
    import { fileStore } from '@/stores/fileStore';

    export let state: SidebarState;

    // Subscribe to fileStore
    $: fileTree = $fileStore.fileTree || undefined;

    let showMoreCommitOptions = false;
    let showSourceControlActions = false;
    let showCommits = false;

    const gitStatus: GitStatusItem[] = [
        { status: 'modified', file: 'src/App.tsx', staged: true },
        { status: 'new', file: 'src/LeftSidebar.tsx', staged: false }
    ];

    let commitMessage = '';
    $: stagedChanges = gitStatus.filter(item => item.staged);
    $: unstagedChanges = gitStatus.filter(item => !item.staged);

    function handleCommit() {
        // Implement commit functionality
        commitMessage = '';
    }

    function handleStageAll() {
        // Implement stage all functionality
    }

    function handleUnstageAll() {
        // Implement unstage all functionality
    }

    function handleDiscardAll() {
        // Implement discard all functionality
    }

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
            date: '3 hours ago',
            files: ['src/lib/editor/LeftSidebar.svelte']
        }
    ];

</script>

<div class="h-full w-full flex flex-col overflow-hidden border-r border-gray-800">
    <div class="flex flex-col h-full">
        {#if state.activeSection === 'files'}
            <ExplorerPane {fileTree} />
        {/if}

        {#if state.activeSection === 'git'}
            <div class="flex items-center justify-between h-[35px] px-4 border-b border-gray-800">
                <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium">Source Control</span>
                </div>
                <div class="flex items-center space-x-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={Plus}
                        title="Stage All Changes"
                        on:click={handleStageAll}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={RefreshCw}
                        title="Refresh"
                    />
                    <div class="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={MoreVertical}
                            title="More Actions"
                            on:click={() => showSourceControlActions = !showSourceControlActions}
                        />
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
                                    onClick: handleDiscardAll
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
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={Undo}
                                                    title="Unstage Changes"
                                                />
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
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={Plus}
                                                title="Stage Changes"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={Trash2}
                                                title="Discard Changes"
                                            />
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>

                <!-- Commit Section -->
                <div class="p-2 border-t border-gray-800">
                    <Input
                        variant="textarea"
                        bind:value={commitMessage}
                        placeholder="Message (⌘Enter to commit)"
                        minRows={1}
                        maxRows={5}
                        onSubmit={handleCommit}
                    />
                    <div class="flex justify-between items-center relative mt-2">
                        <Button
                            variant="primary"
                            icon={GitCommit}
                            disabled={!commitMessage || stagedChanges.length === 0}
                            on:click={handleCommit}
                        >
                            Commit
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={MoreVertical}
                            title="More Commit Options"
                            on:click={() => showMoreCommitOptions = !showMoreCommitOptions}
                        />
                        <DropdownMenu
                            show={showMoreCommitOptions}
                            onClose={() => showMoreCommitOptions = false}
                            position="top"
                            items={[
                                {
                                    icon: GitCommit,
                                    label: 'Commit (Amend)',
                                    onClick: handleCommit
                                },
                                {
                                    icon: Clock,
                                    label: 'Stash Changes',
                                    onClick: handleDiscardAll
                                }
                            ]}
                        />
                    </div>

                    <!-- Recent Commits Section -->
                    <div class="mt-2 border-t border-gray-800 pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={ChevronRight}
                            title="Recent Commits"
                            on:click={() => showCommits = !showCommits}
                        >
                            Recent Commits
                        </Button>
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
