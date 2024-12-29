<script lang="ts">
  import { GitBranch, AlertCircle, CheckCircle, ChevronDown } from 'lucide-svelte';
  import Select from '../components/Select.svelte';
  import Button from '../components/Button.svelte';
  import { gitStore } from '@/stores/gitStore';
  import { bottomPaneStore } from '@/stores/bottomPaneStore';
  import { onMount } from 'svelte';

  interface Diagnostic {
    type: 'error' | 'warning';
    message: string;
  }

  const diagnostics: Diagnostic[] = [
    { type: 'error', message: 'Syntax error in App.tsx:24' },
    { type: 'warning', message: 'Unused variable in LeftSidebar.tsx:12' },
  ];

  let selectedBranch = '';

  // Subscribe to branch changes
  $: if ($gitStore.currentBranch) {
    selectedBranch = $gitStore.currentBranch;
  }

  // Handle branch selection
  function handleBranchChange(event: CustomEvent<string>) {
    const newBranch = event.detail;
    if (newBranch !== selectedBranch) {
      selectedBranch = newBranch;
      // TODO: Implement branch switching functionality
      console.log('Switching to branch:', newBranch);
    }
  }

  // Refresh branches when component mounts
  onMount(async () => {
    await gitStore.refreshBranches();
  });

  // Derived values for branch options
  $: branchOptions = $gitStore.branches.map(branch => branch.name);
  $: currentBranch = $gitStore.currentBranch;

  function toggleBottomPane() {
    bottomPaneStore.update(state => ({
      ...state,
      collapsed: !state.collapsed
    }));
  }
</script>

<div class="bg-gray-900 border-t border-gray-800 flex justify-between items-center h-[35px] px-4 text-sm">
  <div class="flex items-center space-x-2">
    <Button 
      variant="ghost" 
      size="sm" 
      icon={GitBranch} 
      disabled={!$gitStore.isRepository}
    />
    {#if $gitStore.isRepository}
      <Select 
        options={branchOptions} 
        value={selectedBranch} 
        on:change={handleBranchChange}
        disabled={$gitStore.isLoading}
        class="w-40"
      />
    {/if}
    <Button
      variant="ghost"
      size="sm"
      icon={ChevronDown}
      on:click={toggleBottomPane}
      tooltipParams={{ text: 'Toggle Bottom Pane', command: 'editor.toggleBottomPane' }}
      class="transform {$bottomPaneStore.collapsed ? 'rotate-180' : ''}"
    />
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
