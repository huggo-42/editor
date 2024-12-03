<script lang="ts">
  import { GitBranch, AlertCircle, CheckCircle } from 'lucide-svelte';

  interface Diagnostic {
    type: 'error' | 'warning';
    message: string;
  }

  let currentBranch = 'main';

  const diagnostics: Diagnostic[] = [
    { type: 'error', message: 'Syntax error in App.tsx:24' },
    { type: 'warning', message: 'Unused variable in LeftSidebar.tsx:12' },
  ];
</script>

<div class="bg-gray-900 border-t border-gray-800 flex justify-between items-center px-4 py-2 text-sm">
  <div class="flex items-center">
    <GitBranch size={16} class="mr-2" />
    <select
      class="bg-gray-800 text-gray-200 p-1 rounded-sm"
      bind:value={currentBranch}
    >
      <option>main</option>
      <option>develop</option>
      <option>feature/new-ui</option>
    </select>
  </div>
  <div class="flex items-center space-x-4">
    {#each diagnostics as diagnostic}
      <div class="flex items-center">
        {#if diagnostic.type === 'error'}
          <AlertCircle size={16} class="text-red-500 mr-1" />
        {:else}
          <CheckCircle size={16} class="text-yellow-500 mr-1" />
        {/if}
        <span>{diagnostic.message}</span>
      </div>
    {/each}
  </div>
</div>
