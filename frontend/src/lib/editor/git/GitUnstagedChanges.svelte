<script lang="ts">
    import { ChevronDown, ChevronRight } from "lucide-svelte";
    import { gitStore } from "@/stores/gitStore";
    import GitStatusItem from "./GitStatusItem.svelte";
    import Modal from "@/lib/components/Modal.svelte";
    import { sortGitFiles } from "@/lib/utils/gitSort";

    $: unstagedChanges = $gitStore.gitStatus?.filter((item) => !item.staged)
        ? sortGitFiles($gitStore.gitStatus.filter((item) => !item.staged), $gitStore.hierarchicalView)
        : [];

    let showDiscardModal = false;
    let fileToDiscard: string | null = null;

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
    
    function handleDiscard(event: CustomEvent<{ file: string }>) {
        console.log('Discarding changes in', event.detail);
        fileToDiscard = event.detail.file;
        showDiscardModal = true;
    }
</script>

{#if unstagedChanges.length > 0}
    <div class="mb-4">
        <button
            class="flex items-center text-sm text-gray-500 mb-1 px-2 cursor-pointer hover:text-gray-400"
            on:click={() => gitStore.toggleChangesExpanded()}
        >
            <span class="w-4 h-4 flex items-center justify-center">
                {#if $gitStore.changesExpanded}
                    <ChevronDown class="w-4 h-4" />
                {:else}
                    <ChevronRight class="w-4 h-4" />
                {/if}
            </span>
            <span class="font-bold ml-2">Changes ({unstagedChanges.length})</span>
        </button>
        {#if $gitStore.changesExpanded}
            <div>
                {#each unstagedChanges as item}
                    <GitStatusItem {item} isStaged={false} on:discard={handleDiscard} />
                {/each}
            </div>
        {/if}
    </div>
{/if}

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
