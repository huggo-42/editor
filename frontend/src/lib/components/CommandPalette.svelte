<script lang="ts">
    import { onMount, createEventDispatcher, afterUpdate, onDestroy } from 'svelte';
    import { Search } from 'lucide-svelte';
    import Input from './Input.svelte';
    import { fuzzySearch } from '../utils/fuzzySearch';
    import { commandStore, type Command } from '../stores/commandStore';
    import { keyBindings, formatKeybinding } from '../stores/keyboardStore';

    const dispatch = createEventDispatcher();

    export let show = false;
    let previousShow = show;

    let commands: Command[] = [];
    commandStore.subscribe(value => {
        commands = value;
    });

    let shortcuts: Record<string, string> = {};
    keyBindings.subscribe(bindings => {
        shortcuts = Object.entries(bindings).reduce((acc, [command, binding]) => ({
            ...acc,
            [binding.description]: formatKeybinding(binding)
        }), {});
    });

    let searchQuery = '';
    let selectedIndex = 0;
    let filteredCommands: Command[] = commands;
    let inputElement: HTMLInputElement;
    let vimModeEnabled = false;

    afterUpdate(() => {
        // If command palette was showing and is now hidden, disable vim mode
        if (previousShow && !show) {
            vimModeEnabled = false;
        }
        previousShow = show;
    });

    $: {
        if (searchQuery) {
            filteredCommands = fuzzySearch(commands, searchQuery, (cmd) => cmd.label);
        } else {
            filteredCommands = commands;
        }
        selectedIndex = 0;
    }

    $: console.log('Vim mode:', vimModeEnabled);

    function handleKeyDown(event: KeyboardEvent) {
        if (!show) return;

        // Enable vim mode when Alt+J are pressed together
        if (event.altKey && event.key.toLowerCase() === 'j') {
            event.preventDefault();
            console.log('Alt+J pressed, enabling vim mode');
            vimModeEnabled = true;
            return;
        }

        switch(event.key) {
            case 'ArrowDown':
                event.preventDefault();
                selectedIndex = (selectedIndex + 1) % filteredCommands.length;
                break;
            case 'ArrowUp':
                event.preventDefault();
                selectedIndex = selectedIndex - 1 < 0 
                    ? filteredCommands.length - 1 
                    : selectedIndex - 1;
                break;
            case 'j':
                if (vimModeEnabled) {
                    event.preventDefault();
                    selectedIndex = (selectedIndex + 1) % filteredCommands.length;
                }
                break;
            case 'k':
                if (vimModeEnabled) {
                    event.preventDefault();
                    selectedIndex = selectedIndex - 1 < 0 
                        ? filteredCommands.length - 1 
                        : selectedIndex - 1;
                }
                break;
            case 'Enter':
                event.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    executeCommand(filteredCommands[selectedIndex]);
                }
                break;
            case 'Escape':
                event.preventDefault();
                closeCommandPalette();
                break;
        }
    }

    function executeCommand(command: Command) {
        command.action();
        closeCommandPalette();
    }

    function closeCommandPalette() {
        console.log('Closing palette');
        searchQuery = '';
        selectedIndex = 0;
        show = false;
        dispatch('close');
    }

    function handleClickOutside() {
        closeCommandPalette();
    }

    function handleClickInside(event: MouseEvent) {
        event.stopPropagation();
    }

    $: if (show) {
        // Use setTimeout to ensure the input exists in the DOM
        setTimeout(() => {
            inputElement?.focus();
        }, 0);
    }

    onMount(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    });

    onDestroy(() => {
        console.log('Component destroyed, resetting vim mode');
        vimModeEnabled = false;
    });
</script>

{#if show}
    <div 
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-[20vh]"
        on:click={handleClickOutside}
    >
        <div 
            class="command-palette-content w-[600px] bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden"
            on:click={handleClickInside}
        >
            <div class="relative">
                <div class="pl-10">
                    <Input
                        bind:value={searchQuery}
                        placeholder="Type a command or search..."
                        bind:this={inputElement}
                        autofocus
                    />
                </div>
                <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={16} />
                </div>
            </div>

            {#if filteredCommands.length > 0}
                <div class="max-h-[300px] overflow-y-auto">
                    {#each filteredCommands as command, index}
                        <button
                            class="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-800 
                                {index === selectedIndex ? 'bg-gray-800' : ''}"
                            on:click={() => executeCommand(command)}
                        >
                            <div class="flex items-center space-x-2">
                                <span class="text-gray-300">{command.label}</span>
                                {#if command.category}
                                    <span class="text-xs text-gray-500">{command.category}</span>
                                {/if}
                            </div>
                            {#if shortcuts[command.label]}
                                <div class="flex items-center space-x-1">
                                    <span class="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700">
                                        {shortcuts[command.label]}
                                    </span>
                                </div>
                            {/if}
                        </button>
                    {/each}
                </div>
            {:else}
                <div class="px-4 py-8 text-center text-gray-500">
                    No commands found
                </div>
            {/if}
        </div>
    </div>
{/if}
