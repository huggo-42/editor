<script lang="ts">
    import type { Command } from '@/stores/commandStore';

    export let command: Command;
    export let selected = false;
    export let index = 0;
    export let onClick: () => void;
</script>

<button
    class="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-800 
        {selected ? 'bg-gray-800' : ''}"
    on:click={onClick}
>
    <div class="flex items-center space-x-2">
        <span class="text-gray-300">{command.label}</span>
        <div class="flex items-center gap-2">
            {#if command.category}
                <span class="text-xs text-gray-500 px-1.5 py-0.5 bg-gray-800 rounded">{command.category}</span>
            {/if}

            {#if command.context}
                {#each command.context as context}
                    <span class="text-xs text-gray-600">{context}</span>
                {/each}
            {/if}
        </div>
    </div>
    {#if command.shortcut}
        <div class="flex items-center space-x-1">
            <span class="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700">
                {command.shortcut}
            </span>
        </div>
    {/if}
</button>
