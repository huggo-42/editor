<script lang="ts">
    import { GitBranch, RefreshCw, Loader } from "lucide-svelte";
    import Button from "@/lib/components/Button.svelte";
    import { gitStore } from "@/stores/gitStore";
    import { onMount } from "svelte";
    import GitRepositoryStatus from "../git/GitRepositoryStatus.svelte";
    import GitStagedChanges from "../git/GitStagedChanges.svelte";
    import GitUnstagedChanges from "../git/GitUnstagedChanges.svelte";
    import GitCommitSection from "../git/GitCommitSection.svelte";

    // Refresh both status and branches
    async function refreshAll() {
        await Promise.all([
            gitStore.refreshStatus(),
            gitStore.refreshBranches(),
        ]);
    }

    onMount(async () => {
        await gitStore.checkRepository();
    });
</script>

<div class="flex flex-col h-full">
    <div class="flex items-center justify-between h-[35px] px-4 border-b border-gray-800">
        <div class="flex items-center space-x-2">
            {#if $gitStore.isLoading}
                <Loader class="w-4 h-4 text-gray-500 animate-spin" />
            {:else}
                <GitBranch size={16} />
            {/if}
            <span class="text-sm font-medium">Source Control</span>
        </div>
        <div class="flex items-center space-x-1">
            <Button
                variant="ghost"
                size="sm"
                icon={RefreshCw}
                title="Refresh"
                on:click={() => refreshAll()}
                disabled={$gitStore.isLoading}
            />
        </div>
    </div>

    <div class="flex-1 overflow-auto flex flex-col">
        <GitRepositoryStatus />
        
        {#if $gitStore.isRepository && !$gitStore.isLoading && !$gitStore.error}
            <div class="p-1 pt-2 flex-1">
                <GitStagedChanges />
                <GitUnstagedChanges />
            </div>
            <GitCommitSection />
        {/if}
    </div>
</div>