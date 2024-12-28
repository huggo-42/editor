<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { addKeyboardContext, removeKeyboardContext } from '@/stores/keyboardStore';
    import TerminalPane from '@/lib/editor/panes/TerminalPane.svelte';
    import { terminalVisibility } from '@/stores/terminalStore';
    import { bottomPaneStore } from '@/stores/bottomPaneStore';

    // Migrate to the UI store
    let state = {
        activeSection: 'terminal',
    };

    // Track if terminal pane is opened and visible
    let isTerminalPaneSelected = false;

    onMount(() => {
        addKeyboardContext('bottomPane');
    });

    onDestroy(() => {
        removeKeyboardContext('bottomPane');
    });

    // Watch for state changes

    $: isTerminalPaneSelected = state.activeSection === 'terminal' && $terminalVisibility;
</script>

<div
    class="w-full flex flex-col overflow-hidden border-t border-gray-800"
    style:height={`${$bottomPaneStore.height}px`}
>
    <TerminalPane show={isTerminalPaneSelected} />
</div>
