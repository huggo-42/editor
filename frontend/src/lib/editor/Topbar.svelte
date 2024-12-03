<script lang="ts">
  import { ChevronLeft, ChevronRight, Search, GitBranch, Files } from 'lucide-svelte';

  export let onToggleLeftSidebar: () => void;
  export let onToggleRightSidebar: () => void;
  export let onToggleSourceControl: () => void;
  export let onToggleExplorer: () => void;
  export let isLeftSidebarCollapsed: boolean;
  export let isRightSidebarCollapsed: boolean;
  export let isSourceControlActive: boolean;
  export let isExplorerActive: boolean;
  export let modifiedFilesCount: number = 0;
</script>

<div class="bg-gray-900 border-b border-gray-800 flex justify-between items-center px-4 py-2">
  <div class="flex items-center space-x-2">
    <button
      on:click={onToggleLeftSidebar}
      class="text-gray-400 hover:text-gray-200 transition-colors duration-200"
      aria-label={isLeftSidebarCollapsed ? "Expand left sidebar" : "Collapse left sidebar"}
    >
      {#if isLeftSidebarCollapsed}
        <ChevronRight size={20} />
      {:else}
        <ChevronLeft size={20} />
      {/if}
    </button>

    <button
      on:click={onToggleExplorer}
      class="p-2 hover:bg-gray-800 rounded-sm relative {isExplorerActive ? 'bg-gray-800 text-gray-200' : 'text-gray-400'}"
      title="Explorer"
    >
      <Files size={16} />
    </button>

    <button
      on:click={onToggleSourceControl}
      class="p-2 hover:bg-gray-800 rounded-sm relative {isSourceControlActive ? 'bg-gray-800 text-gray-200' : 'text-gray-400'}"
      title="Source Control"
    >
      <GitBranch size={16} />
      {#if modifiedFilesCount > 0}
        <div class="absolute top-0 right-0 -mt-1 -mr-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
          {modifiedFilesCount}
        </div>
      {/if}
    </button>
  </div>

  <div class="flex-1 flex justify-center items-center">
    <div class="relative w-1/2 max-w-md">
      <input
        type="text"
        placeholder="Search..."
        class="w-full bg-gray-800 text-gray-200 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Search
        class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        size={18}
      />
    </div>
  </div>

  <button
    on:click={onToggleRightSidebar}
    class="text-gray-400 hover:text-gray-200 transition-colors duration-200"
    aria-label={isRightSidebarCollapsed ? "Expand right sidebar" : "Collapse right sidebar"}
  >
    {#if isRightSidebarCollapsed}
      <ChevronLeft size={20} />
    {:else}
      <ChevronRight size={20} />
    {/if}
  </button>
</div>
