<script lang="ts">
    import { fileStore } from '@/stores/fileStore';
    import { gitStore } from "@/stores/gitStore";
    import { ChevronRight, Plus, Minus } from 'lucide-svelte';

    export let filepath: string;

    $: currentFile = $fileStore.openFiles.get(filepath);
    $: stats = currentFile?.type === 'diff' && currentFile?.stats 
        ? currentFile.stats 
        : { added: 0, deleted: 0, modified: 0 };
</script>

<div class="flex items-center px-4 py-1.5 bg-gray-900 border-b border-gray-700 sticky top-0 z-10">
    <div class="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        <span class="text-sm text-gray-500">Changes</span>
        <ChevronRight size={14} class="text-gray-600 flex-shrink-0" />
        <span class="text-sm text-gray-300 whitespace-nowrap">{filepath.replace('[diff] ', '')}</span>
        <div class="ml-auto flex items-center gap-2">
            <div class="flex items-center gap-1 text-sm">
                <Plus size={14} class="text-green-500" />
                <span class="text-green-500">{stats.added}</span>
            </div>
            <div class="flex items-center gap-1 text-sm">
                <Minus size={14} class="text-red-500" />
                <span class="text-red-500">{stats.deleted}</span>
            </div>
        </div>
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
