<script lang="ts">
    import { ChevronDown, ChevronRight, Loader, Eye, Edit, GitBranch, RotateCcw, GitFork, ArrowDownToLine, ArrowDown } from "lucide-svelte";
    import { gitStore } from "@/stores/gitStore";
    import { onMount } from "svelte";
    import ResizeHandle from "../ResizeHandle.svelte";
    import GitCommitItem from "./GitCommitItem.svelte";
    import ContextMenu from "@/lib/editor/ContextMenu.svelte";
    import type { service } from "@/lib/wailsjs/go/models";

    export let expanded = false;
    let historyHeight = 240; // Default height
    let loadingMore = false;
    let scrollContainer: HTMLDivElement;

    // Context menu state
    let contextMenu = {
        show: false,
        x: 0,
        y: 0,
        commit: null as service.CommitInfo | null
    };

    // Load initial commits
    onMount(async () => {
        if (!$gitStore.commits || $gitStore.commits.length === 0) {
            await gitStore.getCommits({ limit: 20 });
        }
    });

    async function loadMoreCommits() {
        if (loadingMore || !$gitStore.commits?.length) return;
        
        const lastCommit = $gitStore.commits[$gitStore.commits.length - 1];
        if (!lastCommit.hasMore) return;

        loadingMore = true;
        try {
            await gitStore.getCommitsAfter(lastCommit.hash, 20);
        } catch (error) {
            console.error('Failed to load more commits:', error);
        } finally {
            loadingMore = false;
        }
    }

    function handleScroll(event: Event) {
        const target = event.target as HTMLDivElement;
        const bottom = target.scrollHeight - target.scrollTop - target.clientHeight;
        
        // Load more when within 50px of the bottom
        if (bottom < 50) {
            loadMoreCommits();
        }
    }

    function handleContextMenu(event: CustomEvent<{ detail: { event: MouseEvent, commit: service.CommitInfo } }>) {
        const { commit, event: mouseEvent } = event.detail.detail;
        
        // If menu is already shown, close it first
        if (contextMenu.show) {
            contextMenu.show = false;
            return;
        }

        // Show new menu
        contextMenu = {
            show: true,
            x: mouseEvent.clientX,
            y: mouseEvent.clientY,
            commit
        };
    }

    function handleContextMenuAction(action: string) {
        if (!contextMenu.commit) return;

        const commit = contextMenu.commit;
        switch (action) {
            case 'view':
                console.log('View commit:', commit.hash);
                break;
            case 'edit':
                console.log('Edit message:', commit.hash);
                break;
            case 'amend':
                console.log('Amend staged:', commit.hash);
                break;
            case 'checkout':
                console.log('Checkout commit:', commit.hash);
                break;
            case 'branch':
                console.log('Create branch from:', commit.hash);
                break;
            case 'hard-reset':
                console.log('Hard reset to:', commit.hash);
                break;
            case 'soft-reset':
                console.log('Soft reset to:', commit.hash);
                break;
        }
        contextMenu.show = false;
    }

    function handleCloseContextMenu() {
        contextMenu.show = false;
    }
</script>

<div>
    <div class="border-t border-gray-800">
        {#if expanded}
            <ResizeHandle 
                orientation="horizontal"
                side="top"
                bind:size={historyHeight}
                minSize={100}
                maxSize={600}
            />
        {/if}
        <button
            class="flex items-center text-sm text-gray-500 p-2 w-full cursor-pointer hover:text-gray-400 hover:bg-gray-800/50"
            on:click={() => expanded = !expanded}
        >
            <span class="w-4 h-4 flex items-center justify-center">
                {#if expanded}
                    <ChevronDown class="w-4 h-4" />
                {:else}
                    <ChevronRight class="w-4 h-4" />
                {/if}
            </span>
            <span class="font-bold ml-2">Recent Commits</span>
        </button>

        {#if expanded}
            <div class="relative" style="height: {historyHeight}px">
                <div 
                    bind:this={scrollContainer}
                    on:scroll={handleScroll}
                    class="absolute inset-0 overflow-y-auto"
                    class:overflow-y-hidden={contextMenu.show}
                >
                    {#if $gitStore.commitsLoading && !loadingMore}
                        <div class="flex items-center justify-center py-4">
                            <Loader class="w-4 h-4 text-gray-500 animate-spin" />
                        </div>
                    {:else if $gitStore.commits && $gitStore.commits.length > 0}
                        {#each $gitStore.commits as commit}
                            <GitCommitItem 
                                {commit} 
                                on:contextmenu={handleContextMenu} 
                            />
                        {/each}
                        {#if loadingMore}
                            <div class="flex items-center justify-center py-2 text-sm text-gray-500">
                                <Loader class="w-4 h-4 animate-spin mr-2" />
                                Loading more commits...
                            </div>
                        {:else if $gitStore.commits[$gitStore.commits.length - 1]?.hasMore}
                            <div class="text-center py-2 text-xs text-gray-500">
                                Scroll to load more commits
                            </div>
                        {:else}
                            <div class="text-center py-2 text-xs text-gray-500">
                                No more commits to load
                            </div>
                        {/if}
                    {:else}
                        <div class="text-sm text-gray-500 p-2">No commits found</div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>

    {#if contextMenu.show}
        <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={[
                {
                    label: "View Commit",
                    icon: Eye,
                    action: () => handleContextMenuAction("view")
                },
                {
                    label: "Edit Message",
                    icon: Edit,
                    action: () => handleContextMenuAction("edit")
                },
                {
                    label: "Amend Staged",
                    icon: GitFork,
                    action: () => handleContextMenuAction("amend"),
                    divider: true,
                },
                {
                    label: "Checkout Commit",
                    icon: ArrowDownToLine,
                    action: () => handleContextMenuAction("checkout")
                },
                {
                    label: "Create Branch",
                    icon: GitBranch,
                    action: () => handleContextMenuAction("branch"),
                    divider: true,
                },
                {
                    label: "Hard Reset to This Commit",
                    icon: RotateCcw,
                    action: () => handleContextMenuAction("hard-reset")
                },
                {
                    label: "Soft Reset to This Commit",
                    icon: ArrowDown,
                    action: () => handleContextMenuAction("soft-reset")
                }
            ]}
            onClose={handleCloseContextMenu}
        />
    {/if}
</div>
