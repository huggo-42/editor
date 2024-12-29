<script lang="ts">
    import { GitBranch, RefreshCw, Loader, FolderTree } from "lucide-svelte";
    import Button from "@/lib/components/Button.svelte";
    import { gitStore } from "@/stores/gitStore";
    import { onMount } from "svelte";
    import GitRepositoryStatus from "@/lib/editor/git/GitRepositoryStatus.svelte";
    import GitStagedChanges from "@/lib/editor/git/GitStagedChanges.svelte";
    import GitUnstagedChanges from "@/lib/editor/git/GitUnstagedChanges.svelte";
    import GitCommitSection from "@/lib/editor/git/GitCommitSection.svelte";
    import GitViewToggle from "@/lib/editor/git/GitViewToggle.svelte";

    onMount(async () => {
        await gitStore.checkRepository();
    });
</script>

<div class="flex flex-col h-full">
    <div class="flex items-center justify-between h-[35px] px-4 border-b border-gray-800">
        <div class="flex items-center space-x-2">
            {#if $gitStore.isLoading || $gitStore.isQuickRefreshing}
                <Loader class="w-4 h-4 text-gray-500 animate-spin" />
            {:else}
                <GitBranch size={16} />
            {/if}
            <span class="text-sm font-medium">Source Control</span>
        </div>
        <div class="flex items-center space-x-1">
            <Button
                variant={$gitStore.hierarchicalView ? "secondary" : "ghost"}
                size="sm"
                icon={FolderTree}
                title="Toggle Hierarchical View"
                on:click={() => gitStore.toggleHierarchicalView()}
            />
            <Button
                variant="ghost"
                size="sm"
                icon={RefreshCw}
                title="Refresh"
                on:click={() => gitStore.quickRefresh()}
                disabled={$gitStore.isQuickRefreshing || $gitStore.isLoading}
            />
        </div>
    </div>

    <div class="flex-1 overflow-auto flex flex-col">
        <GitRepositoryStatus />
        
        {#if $gitStore.isRepository && !$gitStore.isLoading && !$gitStore.error}
            <div class="px-4 py-2 border-b border-gray-800">
                <GitViewToggle
                />
            </div>
            <div class="p-1 pt-2 flex-1">
                <GitStagedChanges />
                <GitUnstagedChanges />
            </div>
            <GitCommitSection />
        {/if}
    </div>
</div>