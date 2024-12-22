<script lang="ts">
    import { GitCommit, Loader } from "lucide-svelte";
    import Button from "@/lib/components/Button.svelte";
    import Input from "@/lib/components/Input.svelte";
    import GitCommitHistory from "./GitCommitHistory.svelte";
    import { gitStore } from "@/stores/gitStore";

    let commitMessage = "";
    let commitInProgress = false;
    let showHistory = false;

    $: stagedChanges = $gitStore.gitStatus?.filter((item) => item.staged) || [];

    // Handle commit action
    async function handleCommit() {
        if (!commitMessage || stagedChanges.length === 0 || commitInProgress) return;

        commitInProgress = true;
        try {
            await gitStore.commit(commitMessage);
            commitMessage = "";
            // Refresh commits after successful commit
            await gitStore.getCommits({ limit: 20 });
        } catch (error) {
            console.error("Failed to commit:", error);
        } finally {
            commitInProgress = false;
        }
    }

    // Handle keyboard shortcuts
    function handleKeydown(event: KeyboardEvent) {
        // ⌘Enter or Ctrl+Enter to commit
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            handleCommit();
        }
    }
</script>

<div>
    <div class="p-2 border-t border-gray-800">
        <Input
            variant="textarea"
            bind:value={commitMessage}
            placeholder="Message (⌘Enter to commit)"
            on:keydown={handleKeydown}
        />
        <Button
            variant="primary"
            size="sm"
            icon={GitCommit}
            on:click={handleCommit}
            disabled={!commitMessage || stagedChanges.length === 0 || commitInProgress}
        >
            {#if commitInProgress}
                <Loader class="w-4 h-4 animate-spin" />
                Committing...
            {:else}
                Commit
            {/if}
        </Button>
    </div>
    <GitCommitHistory bind:expanded={showHistory} />
</div>
