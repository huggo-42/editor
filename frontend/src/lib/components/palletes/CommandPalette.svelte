<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import BasePalette from './components/BasePalette.svelte';
    import CommandItem from './components/CommandItem.svelte';
    import ResultsList from './components/ResultsList.svelte';
    import { commandStore } from '@/stores/commandStore';
    import { focusStore } from '@/stores/focusStore';
    import type { Command } from '@/stores/commandStore';

    const dispatch = createEventDispatcher<{
        close: void;
    }>();

    export let show = false;
    export let searchQuery = '';
    let selectedIndex = 0;
    let previousShow = show;
    let filteredCommands: Command[] = [];
    let paletteId = focusStore.generateId('command-palette');

    $: {
        if (searchQuery.trim() === '') {
            filteredCommands = $commandStore.filter(cmd => cmd.id !== 'command.showCommandPalette');
        } else {
            const query = searchQuery.toLowerCase();
            filteredCommands = $commandStore.filter(command => {
                if (command.id === 'command.showCommandPalette') return false;
                
                const label = command.label.toLowerCase();
                const category = command.category?.toLowerCase() || '';
                const context = command.context?.join(' ').toLowerCase() || '';
                return label.includes(query) || category.includes(query) || context.includes(query);
            });
        }
    }

    // Reset selection when commands change
    $: {
        selectedIndex = Math.min(selectedIndex, Math.max(0, filteredCommands.length - 1));
    }

    // Initialize when opening
    $: if (show && !previousShow) {
        searchQuery = '';
        selectedIndex = 0;
        previousShow = show;
    } else if (!show) {
        previousShow = show;
    }

    async function executeCommand(command: Command) {
        show = false;
        dispatch('close');
        if (command.action) {
            await Promise.resolve(command.action());
        }
    }

    function handleSelect() {
        if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
        }
    }

    function handleClose() {
        dispatch('close');
    }
</script>

<BasePalette
    bind:show
    bind:searchQuery
    paletteId={paletteId}
    placeholder="Type a command..."
    bind:selectedIndex
    totalItems={filteredCommands.length}
    on:select={handleSelect}
    on:close={handleClose}
>
    <ResultsList 
        {selectedIndex} 
        isEmpty={filteredCommands.length === 0}
        emptyMessage={searchQuery ? "No commands found" : "No commands available"}
    >
        {#each filteredCommands as command, index (command.id)}
            <CommandItem
                {command}
                {index}
                selected={index === selectedIndex}
                onClick={() => executeCommand(command)}
            />
        {/each}
    </ResultsList>
</BasePalette>
