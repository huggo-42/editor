<script lang="ts">
    import { gitStore } from "@/stores/gitStore";
    import { X, Plus, Minus } from "lucide-svelte";
    import Button from "@/lib/components/Button.svelte";

    $: diff = $gitStore.fileDiff;
    $: stats = diff?.stats || { added: 0, deleted: 0, modified: 0 };
</script>

<div class="flex items-center justify-between h-[35px] px-4 border-b border-gray-800">
    <div class="flex items-center space-x-4">
        <span class="text-sm font-medium">{diff?.path}</span>
        <div class="flex items-center space-x-2 text-xs text-gray-400">
            {#if stats.added > 0}
                <div class="flex items-center space-x-1">
                    <Plus class="w-3 h-3 text-green-500" />
                    <span>{stats.added}</span>
                </div>
            {/if}
            {#if stats.deleted > 0}
                <div class="flex items-center space-x-1">
                    <Minus class="w-3 h-3 text-rose-500" />
                    <span>{stats.deleted}</span>
                </div>
            {/if}
        </div>
    </div>
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
