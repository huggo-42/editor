<script lang="ts">
    import { GitCommit } from "lucide-svelte";
    import type { service } from "@/lib/wailsjs/go/models";
    import { formatRelativeTime } from "@/lib/utils/time";
    import { createEventDispatcher } from "svelte";

    export let commit: service.CommitInfo;

    type CommitHistoryContextMenu = {
        event: MouseEvent;
        commit: service.CommitInfo;
    };

    const dispatch = createEventDispatcher<{
        contextmenu: { detail: CommitHistoryContextMenu }
    }>();

    function handleContextMenu(event: MouseEvent) {
        event.preventDefault();
        dispatch('contextmenu', { 
            detail: {
                event: event,
                commit: commit
            }
        });
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div 
    class="flex items-start p-2 text-sm hover:bg-gray-800/50 group cursor-pointer relative"
    on:contextmenu={handleContextMenu}
>
    <GitCommit class="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
    <div class="ml-2 flex-1 min-w-0">
        <div class="flex items-center justify-between">
            <span class="font-mono text-xs text-gray-500">{commit.hash.substring(0, 7)}</span>
            <span class="text-xs text-gray-500">{formatRelativeTime(commit.date)}</span>
        </div>
        <p class="text-gray-300 truncate" title={commit.message}>
            {commit.message}
        </p>
        <p class="text-xs text-gray-500 truncate">
            {commit.author}
        </p>
    </div>
</div>
