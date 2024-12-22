<script lang="ts">
    import { Loader } from "lucide-svelte";
    import Button from "@/lib/components/Button.svelte";
    import { gitStore } from "@/stores/gitStore";
</script>

{#if $gitStore.isLoading}
    <div class="flex flex-col items-center justify-center h-full space-y-3">
        <Loader class="w-6 h-6 text-gray-500 animate-spin" />
        <span class="text-sm text-gray-500">Loading Git Repository...</span>
    </div>
{:else if !$gitStore.isRepository}
    <div class="flex flex-col items-center justify-center h-full p-4 space-y-4">
        <div class="text-center">This directory is not a Git repository</div>
        <Button variant="primary" on:click={() => gitStore.initRepository()}>
            Initialize Repository
        </Button>
    </div>
{:else if $gitStore.error}
    <div class="flex flex-col items-center justify-center h-full p-4 space-y-4">
        <div class="text-error text-center">{$gitStore.error}</div>
        <Button variant="primary" on:click={() => gitStore.checkRepository()}>
            Retry
        </Button>
    </div>
{/if}
