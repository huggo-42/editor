<script lang="ts">
    import { onMount } from 'svelte';

    export let value: string = '';
    export let placeholder: string = '';
    export let variant: 'text' | 'textarea' = 'text';
    export let minRows: number = 1;
    export let maxRows: number = 5;
    export let disabled: boolean = false;
    export let autofocus: boolean = false;
    export let onSubmit: (() => void) | undefined = undefined;

    let textarea: HTMLTextAreaElement;
    let isScrollable = false;
    
    const baseClasses = `
        w-full
        bg-gray-800
        text-gray-300
        text-sm
        p-2
        rounded
        border
        border-gray-700
        focus:outline-none
        focus:ring-1
        focus:ring-blue-500
        focus:border-blue-500
        disabled:opacity-50
        disabled:cursor-not-allowed
    `;

    const textareaClasses = `
        ${baseClasses}
        resize-none
        overflow-y-auto
        scrollbar
        scrollbar-thin
        scrollbar-thumb-gray-600
        scrollbar-track-transparent
    `;

    function adjustHeight(element: HTMLTextAreaElement) {
        // Reset height to auto to get the correct scrollHeight
        element.style.height = 'auto';
        
        // Calculate line height from the computed styles
        const computedStyle = window.getComputedStyle(element);
        const lineHeight = parseInt(computedStyle.lineHeight);
        
        // Calculate min and max heights based on rows
        const minHeight = lineHeight * minRows;
        const maxHeight = lineHeight * maxRows;
        
        // Check if content exceeds max height
        isScrollable = element.scrollHeight > maxHeight;
        
        // Set new height based on content
        const newHeight = Math.min(Math.max(element.scrollHeight, minHeight), maxHeight);
        element.style.height = `${newHeight}px`;
    }

    function handleKeydown(event: KeyboardEvent) {
        if (variant === 'textarea' && event.key === 'Enter') {
            if (event.shiftKey) {
                // Allow Shift+Enter for new line
                return;
            }
            
            if (onSubmit) {
                event.preventDefault();
                onSubmit();
            }
        }
    }

    $: if (textarea && variant === 'textarea') {
        value; // Track value changes
        adjustHeight(textarea);
    }

    onMount(() => {
        if (textarea && variant === 'textarea') {
            adjustHeight(textarea);
        }
    });
</script>

{#if variant === 'textarea'}
    <textarea
        bind:this={textarea}
        bind:value
        {placeholder}
        {disabled}
        class={textareaClasses}
        on:keydown={handleKeydown}
        {autofocus}
    />
{:else}
    <input
        type="text"
        bind:value
        {placeholder}
        {disabled}
        class={baseClasses}
        on:keydown
        {autofocus}
    />
{/if}

<style>
    /* Ensure the scrollbar is visible on hover and when scrolling */
    :global(.scrollbar::-webkit-scrollbar) {
        width: 6px;
    }

    :global(.scrollbar::-webkit-scrollbar-track) {
        background: transparent;
    }

    :global(.scrollbar::-webkit-scrollbar-thumb) {
        background-color: rgb(75, 85, 99);
        border-radius: 3px;
    }

    :global(.scrollbar::-webkit-scrollbar-thumb:hover) {
        background-color: rgb(107, 114, 128);
    }
</style>
