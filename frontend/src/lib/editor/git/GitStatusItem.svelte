<script lang="ts">
    import { File, Loader, Plus, Undo, Trash2 } from "lucide-svelte";
    import Button from "@/lib/components/Button.svelte";
    import Modal from "@/lib/components/Modal.svelte";
    import { gitStore } from "@/stores/gitStore";
    import type { service } from "@/lib/wailsjs/go/models";

    export let item: service.FileStatus;
    export let isStaged: boolean;

    let showDiscardModal = false;
    let fileToDiscard: string | null = null;

    // Status color mapping
    const getStatusColor = (status: string) => {
        switch (status) {
            case "D":
                return "text-rose-500"; // Deleted
            case "M":
                return "text-blue-500"; // Modified
            case "?":
                return "text-gray-500"; // Untracked
            case "A":
                return "text-green-500"; // Added
            case "R":
                return "text-purple-500"; // Renamed
            case "C":
                return "text-yellow-500"; // Copied
            case "U":
                return "text-orange-500"; // Unmerged
            default:
                return "text-gray-500";
        }
    };

    function handleDiscardClick(file: string) {
        fileToDiscard = file;
        showDiscardModal = true;
    }

    async function handleDiscardConfirm() {
        if (fileToDiscard) {
            await gitStore.discardChanges(fileToDiscard);
            showDiscardModal = false;
            fileToDiscard = null;
        }
    }

    function handleDiscardCancel() {
        showDiscardModal = false;
        fileToDiscard = null;
    }
</script>

<div class="flex items-center text-sm py-1 group hover:bg-gray-800 rounded-sm mx-1 hover:rounded-md">
    <div class="flex items-center px-2 w-full">
        {#if $gitStore.loadingFiles.has(item.file)}
            <Loader class="w-4 h-4 text-gray-500 mr-2 flex-shrink-0 animate-spin" />
        {:else}
            <File class="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
        {/if}
        <span class="text-gray-300 truncate flex-1" title={item.file}>
            {item.file}
        </span>
        <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {#if isStaged}
                <Button
                    variant="ghost"
                    size="sm"
                    icon={Undo}
                    title="Unstage Changes"
                    on:click={() => gitStore.unstageFile(item.file)}
                    disabled={$gitStore.loadingFiles.has(item.file)}
                />
            {:else}
                <Button
                    variant="ghost"
                    size="sm"
                    icon={Plus}
                    title="Stage Changes"
                    on:click={() => gitStore.stageFile(item.file)}
                    disabled={$gitStore.loadingFiles.has(item.file)}
                />
                <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    title="Discard Changes"
                    on:click={() => handleDiscardClick(item.file)}
                    disabled={$gitStore.loadingFiles.has(item.file)}
                />
            {/if}
        </div>
        <span class={`ml-2 w-4 font-semibold text-center ${getStatusColor(item.status)}`}>
            {#if $gitStore.loadingFiles.has(item.file)}
                <span class="loading loading-spinner loading-xs"></span>
            {:else}
                {item.status}
            {/if}
        </span>
    </div>
</div>

<Modal
    show={showDiscardModal}
    title="Discard Changes"
    confirmText="Discard"
    confirmButtonClass="bg-red-600 hover:bg-red-700"
    on:close={handleDiscardCancel}
    on:confirm={handleDiscardConfirm}
>
    <div class="p-4">
        <p>Are you sure you want to discard changes in <span class="font-mono text-gray-300">{fileToDiscard}</span>?</p>
        <p class="mt-2 text-gray-400">This action cannot be undone.</p>
    </div>
</Modal>
