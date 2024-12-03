<script lang="ts">
  import { ChevronLeft, ChevronRight, Search } from 'lucide-svelte';

  export let onToggleLeftSidebar: () => void;
  export let onToggleRightSidebar: () => void;
  export let isLeftSidebarCollapsed: boolean;
  export let isRightSidebarCollapsed: boolean;
</script>

<div class="bg-gray-900 border-b border-gray-800 flex justify-between items-center px-4 py-2">
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
