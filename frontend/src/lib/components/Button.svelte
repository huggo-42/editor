<script lang="ts">
    import type { LucideIcon } from 'lucide-svelte';

    export let variant: 'primary' | 'secondary' | 'ghost' = 'secondary';
    export let size: 'sm' | 'md' = 'md';
    export let icon: LucideIcon | null = null;
    export let disabled: boolean = false;
    export let title: string | undefined = undefined;
    export let type: 'button' | 'submit' = 'button';
    export let fullWidth: boolean = false;

    const customClasses: string = $$props.class || '';

    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-sky-700',
        secondary: 'bg-gray-800 text-gray-300 hover:bg-gray-700',
        ghost: 'text-gray-300 hover:bg-gray-800'
    };

    // For buttons with only icons, use square padding
    // For buttons with text (with or without icons), use horizontal padding
    $: hasText = $$slots.default;
    $: padding = hasText 
        ? size === 'sm' ? 'px-3 py-1.5' : 'px-4 py-1.5'
        : size === 'sm' ? 'p-1.5' : 'p-2';

    

    $: classes = `
        ${variantClasses[variant]}
        ${padding}
        ${fullWidth ? 'w-full' : ''}
        rounded
        flex
        items-center
        justify-center
        space-x-1.5
        disabled:opacity-50
        disabled:cursor-not-allowed
        transition-colors
        ${customClasses}
    `;
</script>

<button
    {type}
    {disabled}
    {title}
    class={classes}
    on:click
>
    {#if icon}
        <svelte:component this={icon} size={size === 'sm' ? 14 : 16} />
    {/if}
    {#if $$slots.default}
        <span>
            <slot />
        </span>
    {/if}
</button>
