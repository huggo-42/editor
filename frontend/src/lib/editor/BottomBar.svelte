<script lang="ts">
  import { GitBranch, AlertCircle, CheckCircle } from 'lucide-svelte';
  import Select from '../components/Select.svelte';
  import Button from '../components/Button.svelte';

  interface Diagnostic {
    type: 'error' | 'warning';
    message: string;
  }

  let currentBranch = 'main';
  const branchOptions = ['main', 'develop', 'feature/new-ui'];

  const diagnostics: Diagnostic[] = [
    { type: 'error', message: 'Syntax error in App.tsx:24' },
    { type: 'warning', message: 'Unused variable in LeftSidebar.tsx:12' },
  ];
</script>

<div class="bg-gray-900 border-t border-gray-800 flex justify-between items-center h-[35px] px-4 text-sm">
  <div class="flex items-center space-x-2">
    <Button variant="ghost" size="sm" icon={GitBranch} />
    <div class="w-40">
      <Select
        bind:value={currentBranch}
        options={branchOptions}
        variant="compact"
      />
    </div>
  </div>
  <div class="flex items-center space-x-4">
    {#each diagnostics as diagnostic}
      <div class="flex items-center space-x-1.5 text-gray-300">
        {#if diagnostic.type === 'error'}
          <AlertCircle size={14} class="text-red-500" />
        {:else}
          <CheckCircle size={14} class="text-yellow-500" />
        {/if}
        <span class="text-xs">{diagnostic.message}</span>
      </div>
    {/each}
  </div>
</div>
