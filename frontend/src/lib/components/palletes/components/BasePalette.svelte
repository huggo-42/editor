<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Search } from 'lucide-svelte';
    import Input from '../../Input.svelte';
    import { focusStore } from '@/stores/focusStore';

    const dispatch = createEventDispatcher<{
        close: void;
        search: { query: string };
        keydown: KeyboardEvent;
        selectionChange: number;
        select: void;
    }>();

    export let show = false;
    export let searchQuery = '';
    export let placeholder = 'Search...';
    export let paletteId: string;
    export let autofocus = true;
    export let totalItems = 0;
    export let selectedIndex = 0;

    let inputElement: HTMLInputElement;
    let vimModeEnabled = false;

    // Initialize when opening
    $: if (show) {
        focusStore.focus('palette', paletteId);
        // Focus input after a short delay to ensure DOM is ready
        if (autofocus) {
            setTimeout(() => {
                inputElement?.focus();
            }, 0);
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (!show) return;

        // Enable vim mode when Alt+J are pressed together
        if (event.altKey && event.key.toLowerCase() === 'j') {
            event.preventDefault();
            vimModeEnabled = true;
            return;
        }

        // Handle Alt+number for quick selection
        if (event.altKey && /^[1-9]$/.test(event.key)) {
            event.preventDefault();
            const index = parseInt(event.key) - 1;
            if (index < totalItems) {
                selectedIndex = index;
                dispatch('selectionChange', selectedIndex);
                dispatch('select');
            }
            return;
        }

        // Handle Escape to close
        if (event.key === 'Escape') {
            event.preventDefault();
            closePalette();
            return;
        }

        // Handle selection navigation
        switch(event.key) {
            case 'ArrowDown':
            case 'j':
                if (event.key === 'j' && !vimModeEnabled) break;
                event.preventDefault();
                if (totalItems > 0) {
                    selectedIndex = (selectedIndex + 1) % totalItems;
                    dispatch('selectionChange', selectedIndex);
                }
                break;
            case 'ArrowUp':
            case 'k':
                if (event.key === 'k' && !vimModeEnabled) break;
                event.preventDefault();
                if (totalItems > 0) {
                    selectedIndex = selectedIndex - 1 < 0 
                        ? totalItems - 1 
                        : selectedIndex - 1;
                    dispatch('selectionChange', selectedIndex);
                }
                break;
            case 'Enter':
                event.preventDefault();
                if (totalItems > 0) {
                    dispatch('select');
                }
                break;
            default:
                // For all other keys, just dispatch the event without any special handling
                dispatch('keydown', event);
        }
    }

    function handleSearchInput(event: Event) {
        const target = event.target as HTMLInputElement;
        dispatch('search', { query: target.value });
    }

    function closePalette() {
        show = false;
        vimModeEnabled = false;
        selectedIndex = 0;
        focusStore.restorePrevious();
        dispatch('close');
    }

    function handleClickOutside() {
        closePalette();
    }

    function handleClickInside(event: MouseEvent) {
        event.stopPropagation();
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
{#if show}
    <div 
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-[20vh]"
        on:click={handleClickOutside}
        on:keydown={(e) => e.key === 'Escape' && handleClickOutside()}
        role="dialog"
        aria-modal="true"
    >
        <div 
            class="palette-content w-[600px] bg-gray-900 rounded-lg shadow-xl border border-gray-700"
            on:click={handleClickInside}
        >
            <div class="relative">
                <div class="pl-10">
                    <Input
                        bind:value={searchQuery}
                        {placeholder}
                        on:keydown={handleKeyDown}
                        {autofocus}
                        on:input={handleSearchInput}
                    />
                </div>
                <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={16} />
                </div>
            </div>

            <slot {selectedIndex} />
        </div>
    </div>
{/if}
