<script lang="ts">
    import type { SidebarState } from "@/types/ui";
    import ExplorerPane from './panes/ExplorerPane.svelte';
    import GitPane from './panes/GitPane.svelte';

    export let state: SidebarState;

</script>

<div class="h-full w-full flex flex-col overflow-hidden border-r border-gray-800">
    <div class="flex flex-col h-full">
        {#if state.activeSection === 'files'}
            <ExplorerPane />
        {/if}

        {#if state.activeSection === 'git'}
            <GitPane />
        {/if}
    </div>
</div>