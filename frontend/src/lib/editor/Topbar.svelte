<script lang="ts">
  import { ChevronLeft, ChevronRight, Search, GitBranch, Files, File, Terminal } from 'lucide-svelte';
  import Input from '../components/Input.svelte';
  import { tooltip } from '@/lib/actions/tooltip';
  import { terminalVisibility } from '@/stores/terminalStore';

  export let onToggleLeftSidebar: () => void;
  export let onToggleRightSidebar: () => void;
  export let onToggleSourceControl: () => void;
  export let onToggleExplorer: () => void;
  export let showCommandPalette: () => void;
  export let showFileFinder: () => void;
  export let isLeftSidebarCollapsed: boolean;
  export let isRightSidebarCollapsed: boolean;
  export let isSourceControlActive: boolean;
  export let isExplorerActive: boolean;
  export let modifiedFilesCount: number = 0;

  let searchQuery = '';

  function toggleTerminal() {
    terminalVisibility.update(v => !v);
  }
</script>

<div class="h-12 bg-gray-900 border-b border-gray-700 flex items-center px-4">
  <!-- Left side buttons -->
  <div class="flex items-center space-x-2">
    <button
      on:click={onToggleLeftSidebar}
      class="p-2 hover:bg-gray-800 rounded-sm text-gray-400 hover:text-gray-300"
    >
      {#if isLeftSidebarCollapsed}
        <ChevronRight size={16} />
      {:else}
        <ChevronLeft size={16} />
      {/if}
    </button>

    <button
      on:click={onToggleExplorer}
      class="p-2 hover:bg-gray-800 rounded-sm relative {isExplorerActive ? 'bg-gray-800 text-gray-200' : 'text-gray-400'}"
    >
      <Files size={16} />
    </button>

    <button
      on:click={onToggleSourceControl}
      class="p-2 hover:bg-gray-800 rounded-sm relative {isSourceControlActive ? 'bg-gray-800 text-gray-200' : 'text-gray-400'}"
    >
      <GitBranch size={16} />
      {#if modifiedFilesCount > 0}
        <span class="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
          {modifiedFilesCount}
        </span>
      {/if}
    </button>

    <button
      on:click={toggleTerminal}
      class="p-2 hover:bg-gray-800 rounded-sm relative {$terminalVisibility ? 'bg-gray-800 text-gray-200' : 'text-gray-400'}"
      use:tooltip={{ text: "Toggle Terminal" }}
    >
      <Terminal size={16} />
    </button>
  </div>

  <!-- Center search area with command palette and file finder -->
  <div class="flex-1 flex justify-center items-center space-x-2 max-w-2xl mx-auto">
    <button 
      class="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
      use:tooltip={{ text: "Open Command Palette", command: "command.showCommandPalette" }}
      on:click={showCommandPalette}
    >
      <Search size={16} />
    </button>

    <div class="flex-1">
      <Input
        bind:value={searchQuery}
        placeholder="Search"
      />
    </div>

    <button 
      class="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
      use:tooltip={{ text: "Open File Finder", command: "file.showFileFinder" }}
      on:click={showFileFinder}
    >
      <File size={16} />
    </button>
  </div>

  <!-- Right side buttons -->
  <div class="flex items-center space-x-2">
    <button
      on:click={onToggleRightSidebar}
      class="p-2 hover:bg-gray-800 rounded-sm text-gray-400 hover:text-gray-300"
    >
      {#if isRightSidebarCollapsed}
        <ChevronLeft size={16} />
      {:else}
        <ChevronRight size={16} />
      {/if}
    </button>
  </div>
</div>
