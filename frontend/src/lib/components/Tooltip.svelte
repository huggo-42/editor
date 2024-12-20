<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';

    export let text: string;
    export let position: 'top' | 'bottom' | 'left' | 'right' = 'top';
    export let delay = 300;

    let tooltipVisible = false;
    let tooltipElement: HTMLDivElement;
    let triggerElement: HTMLDivElement;
    let timeoutId: NodeJS.Timeout;

    function showTooltip() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            tooltipVisible = true;
        }, delay);
    }

    function hideTooltip() {
        clearTimeout(timeoutId);
        tooltipVisible = false;
    }

    onMount(() => {
        return () => {
            clearTimeout(timeoutId);
        };
    });
</script>

<div
    bind:this={triggerElement}
    on:mouseenter={showTooltip}
    on:mouseleave={hideTooltip}
    on:focusin={showTooltip}
    on:focusout={hideTooltip}
    class="relative inline-block"
>
    <slot />
    {#if tooltipVisible}
        <div
            bind:this={tooltipElement}
            transition:fade={{ duration: 100 }}
            class="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap"
            class:top-0={position === 'top'}
            class:bottom-0={position === 'bottom'}
            class:left-0={position === 'left'}
            class:right-0={position === 'right'}
            class:-translate-y-full={position === 'top'}
            class:translate-y-full={position === 'bottom'}
            class:-translate-x-full={position === 'left'}
            class:translate-x-full={position === 'right'}
            class:mb-1={position === 'top'}
            class:mt-1={position === 'bottom'}
            class:mr-1={position === 'left'}
            class:ml-1={position === 'right'}
        >
            {text}
            <div
                class="absolute w-2 h-2 bg-gray-900 transform rotate-45"
                class:left-1/2={position === 'top' || position === 'bottom'}
                class:top-1/2={position === 'left' || position === 'right'}
                class:-translate-x-1/2={position === 'top' || position === 'bottom'}
                class:-translate-y-1/2={position === 'left' || position === 'right'}
                class:bottom-0={position === 'top'}
                class:top-0={position === 'bottom'}
                class:right-0={position === 'left'}
                class:left-0={position === 'right'}
                class:translate-y-1/2={position === 'top'}
                class:-translate-y-1/2={position === 'bottom'}
            />
        </div>
    {/if}
</div>
