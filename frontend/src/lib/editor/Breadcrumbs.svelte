<script lang="ts">
    import { File, ChevronRight } from 'lucide-svelte';
    import { projectStore } from '@/stores/project';

    export let filepath: string = '';

    $: relativePath = filepath.replace($projectStore.currentProject?.Path + '/', '');
    $: parts = relativePath ? relativePath.split('/').filter(Boolean) : [];
</script>

<div class="flex items-center px-4 py-1.5 bg-gray-900 border-b border-gray-700 sticky top-0 z-10">
    <div class="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {#each parts as part, i}
            {#if i > 0}
                <ChevronRight size={14} class="text-gray-600 flex-shrink-0" />
            {/if}
            <span class="text-sm {i === parts.length - 1 ? 'text-gray-300' : 'text-gray-500'} whitespace-nowrap">
                {part}
            </span>
        {/each}
    </div>
</div>

<style>
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
