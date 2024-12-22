<script lang="ts">
    import { gitStore } from "@/stores/gitStore";
    import { Loader, X } from "lucide-svelte";
    import GitDiffViewer from "./GitDiffViewer.svelte";
    import GitDiffHeader from "./GitDiffHeader.svelte";
    import Button from "@/lib/components/Button.svelte";
</script>

{#if $gitStore.isDiffLoading}
    <div class="flex items-center justify-center h-full">
        <Loader class="w-6 h-6 text-gray-500 animate-spin" />
    </div>
{:else if $gitStore.diffError}
    <div class="flex flex-col h-full">
        <div class="flex items-center justify-between h-[35px] px-4 border-b border-gray-800">
            <span class="text-sm font-medium text-error">Error</span>
            <div class="flex items-center space-x-1">
                <Button
                    variant="ghost"
                    size="sm"
                    icon={X}
                    title="Close"
                    on:click={() => gitStore.clearFileSelection()}
                />
            </div>
        </div>
        <div class="flex-1 flex items-center justify-center">
            <div class="text-error text-center p-4">{$gitStore.diffError}</div>
        </div>
    </div>
{:else if $gitStore.fileDiff}
    <div class="flex flex-col h-full">
        <GitDiffHeader />
        <div class="flex-1 overflow-hidden">
            <GitDiffViewer />
        </div>
    </div>
{/if}
