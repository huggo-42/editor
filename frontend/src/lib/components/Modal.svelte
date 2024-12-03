<script lang="ts">
    import { X } from 'lucide-svelte';
    import { createEventDispatcher } from 'svelte';
    import { onMount, onDestroy } from 'svelte';

    const dispatch = createEventDispatcher();

    export let show = false;
    export let title: string;
    export let confirmText = 'Confirm';
    export let cancelText = 'Cancel';
    export let confirmButtonClass = 'bg-blue-600 hover:bg-blue-700';
    export let width = '600px';

    function handleClose() {
        dispatch('close');
    }

    function handleConfirm() {
        dispatch('confirm');
    }

    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (target.classList.contains('modal-overlay')) {
            handleClose();
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape' && show) {
            handleClose();
        }
    }

    onMount(() => {
        window.addEventListener('keydown', handleKeyDown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeyDown);
    });
</script>

{#if show}
    <div 
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center modal-overlay"
        on:click={handleClickOutside}
    >
        <div 
            class="bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden"
            style="width: {width}"
        >
            <!-- Header -->
            <div class="px-6 py-4 flex items-center justify-between border-b border-gray-700">
                <h2 class="text-lg font-semibold text-gray-100">{title}</h2>
                <button
                    class="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-300 transition-colors"
                    on:click={handleClose}
                >
                    <X size={20} />
                </button>
            </div>

            <!-- Content -->
            <div class="px-6 py-4">
                <slot></slot>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 bg-gray-800/50 flex justify-end space-x-3">
                <button
                    class="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
                    on:click={handleClose}
                >
                    {cancelText}
                </button>
                <button
                    class="px-4 py-2 rounded-lg {confirmButtonClass} text-white transition-colors"
                    on:click={handleConfirm}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
{/if}
