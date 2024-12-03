<script lang="ts">
    import type { LucideIcon } from 'lucide-svelte';

    export let show: boolean;
    export let onClose: () => void;
    export let items: {
        icon: LucideIcon;
        label: string;
        onClick: () => void;
    }[];
    export let position: 'top' | 'bottom' = 'bottom';
    export let align: 'left' | 'right' = 'right';
    export let width: string = '12rem';
</script>

{#if show}
    <div 
        role="menu"
        on:mouseleave={() => show = false}
        class="absolute py-1 bg-gray-800 rounded shadow-lg z-50 border border-gray-700"
        class:right-0={align === 'right'}
        class:left-0={align === 'left'}
        class:mt-1={position === 'bottom'}
        class:mb-1={position === 'top'}
        class:bottom-full={position === 'top'}
        style="width: {width}"
    >
        {#each items as item}
            <button
                class="w-full px-3 py-1.5 text-sm text-left text-gray-300 hover:bg-gray-700 flex items-center"
                on:click={() => {
                    item.onClick();
                    onClose();
                }}
            >
                <svelte:component this={item.icon} size={14} class="mr-2" />
                {item.label}
            </button>
        {/each}
    </div>
{/if}
