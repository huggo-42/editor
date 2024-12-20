<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { addKeyboardContext, removeKeyboardContext } from '@/stores/keyboardStore';
    import type { BottomPaneState } from '@/types/ui';
    import TerminalPane from '@/lib/editor/panes/TerminalPane.svelte';
    import { bottomPaneStore } from '@/stores/bottomPaneStore';
    import { FilesIcon } from 'lucide-svelte';
    import { terminalVisibility } from '@/stores/terminalStore';

    export let state: BottomPaneState;
    export let height: number;

    onMount(() => {
        if (!state.collapsed) {
            addKeyboardContext('bottomPane');
        }
    });

    onDestroy(() => {
        removeKeyboardContext('bottomPane');
    });

    // Watch for state changes
    $: if (!state.collapsed) {
        addKeyboardContext('bottomPane');
    } else {
        removeKeyboardContext('bottomPane');
    }
</script>

<div class="w-full flex flex-col overflow-hidden border-t border-gray-800" style="height: {!$terminalVisibility && state.activeSection === 'terminal' ? 0 : height}px">
    <div class="flex-1 overflow-auto">
        {#if state.activeSection === 'terminal'}
            <TerminalPane {height} />
        {:else if state.activeSection === 'problems'}
            <div class="p-2">
                <!-- Problems content will go here -->
                <p class="text-gray-500">No problems found.</p>
            </div>
        {:else if state.activeSection === 'output'}
            <div class="p-2">
                <!-- Output content will go here -->
                <p class="text-gray-500">No output to display.</p>
            </div>
        {/if}
    </div>
</div>
