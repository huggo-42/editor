<script lang="ts">
    import { File, Loader, Plus, Undo, Trash2 } from "lucide-svelte";
    import Button from "@/lib/components/Button.svelte";
    import { gitStore } from "@/stores/gitStore";
    import { fileStore } from "@/stores/fileStore";
    import type { service } from "@/lib/wailsjs/go/models";
    import { createEventDispatcher } from "svelte";

    export let item: service.FileStatus;
    export let isStaged: boolean;

    const dispatch = createEventDispatcher<{
        discard: { file: string };
    }>();

    // Status color mapping
    const getStatusColor = (status: string) => {
        switch (status) {
            case "D":
                return "text-rose-500"; // Deleted
            case "M":
                return "text-blue-500"; // Modified
            case "?":
                return "text-gray-500"; // Untracked
            case "A":
                return "text-green-500"; // Added
            case "R":
                return "text-purple-500"; // Renamed
            case "C":
                return "text-yellow-500"; // Copied
            case "U":
                return "text-orange-500"; // Unmerged
            default:
                return "text-gray-500";
        }
    };

    function handleClick(e: MouseEvent) {
        if ($gitStore.showDiff) {
            gitStore.getDiff(item.file, isStaged);
        } else {
            const fullPath = $fileStore.currentProjectPath + '/' + item.file;
            fileStore.openFile(fullPath);
            console.log('Opening file', fullPath);
        }
        e.stopPropagation();
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div 
    class="flex items-center text-sm py-1 group hover:bg-gray-800 rounded-sm mx-1 hover:rounded-md cursor-pointer"
    on:click={handleClick}
>
    <div class="flex items-center px-2 w-full">
        {#if $gitStore.loadingFiles.has(item.file)}
            <Loader class="w-4 h-4 text-gray-500 mr-2 flex-shrink-0 animate-spin" />
        {:else}
            <File class="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
        {/if}
        <span class="text-gray-300 truncate flex-1" title={item.file}>
            {item.file.split('/').pop()}
            <span class="text-gray-500 ml-1">{item.file.split('/').slice(0, -1).join('/')}</span>
        </span>
        <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {#if isStaged}
                <Button
                    variant="ghost"
                    size="sm"
                    icon={Undo}
                    title="Unstage Changes"
                    on:click={(e) => {
                        e.stopPropagation();
                        gitStore.unstageFile(item.file);
                    }}
                    disabled={$gitStore.loadingFiles.has(item.file)}
                />
            {:else}
                <Button
                    variant="ghost"
                    size="sm"
                    icon={Plus}
                    title="Stage Changes"
                    on:click={(e) => {
                        e.stopPropagation();
                        gitStore.stageFile(item.file);
                    }}
                    disabled={$gitStore.loadingFiles.has(item.file)}
                />
                <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    title="Discard Changes"
                    on:click={(e) => {
                        e.stopPropagation();
                        dispatch('discard', { file: item.file });
                    }}
                    disabled={$gitStore.loadingFiles.has(item.file)}
                />
            {/if}
        </div>
        <span class={`ml-2 w-4 font-semibold text-center ${getStatusColor(item.status)}`}>
            {#if $gitStore.loadingFiles.has(item.file)}
                <span class="loading loading-spinner loading-xs"></span>
            {:else}
                {item.status}
            {/if}
        </span>
    </div>
</div>
