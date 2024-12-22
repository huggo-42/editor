<script lang="ts">
    import { File, Folder } from 'lucide-svelte';
    import type { service } from '@/lib/wailsjs/go/models';
    import { projectStore } from '@/stores/project';

    export let file: service.FileNode & { isOpen: boolean };
    export let selected = false;
    export let onClick: () => void;
    export let index: number;

    function removeBasedir(path: string) {
        return path.replace($projectStore.currentProject!.Path + "/", "");
    }
</script>

<button
    class="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-800 {selected ? 'bg-gray-800' : ''}"
    on:click={onClick}
>
    <div class="flex items-center gap-3 min-w-0 flex-1">
        <svelte:component
            this={file.type === "directory" ? Folder : File}
            size={16}
            class="text-gray-400 flex-shrink-0"
        />
        <div class="flex flex-col min-w-0 flex-1">
            <span class="text-gray-300 font-medium truncate">{file.name}</span>
            {#if file.path}
                <span class="text-gray-500 text-sm truncate max-w-full">{removeBasedir(file.path)}</span>
            {/if}
        </div>
    </div>
    <div class="flex items-center gap-2 flex-shrink-0 ml-2">
        {#if index < 9}
            <span class="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700">
                Alt+{index + 1}
            </span>
        {/if}
        {#if file.isOpen}
            <span class="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700">
                Open
            </span>
        {/if}
    </div>
</button>
