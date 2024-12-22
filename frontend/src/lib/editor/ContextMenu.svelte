<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ContextMenuItem } from '../../types';

  export let x: number;
  export let y: number;
  export let items: ContextMenuItem[] = [];
  export let onClose: () => void;

  let menuElement: HTMLDivElement;
  let menuStyle = '';

  function updatePosition() {
    if (!menuElement) return;

    const rect = menuElement.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let finalX = x;
    let finalY = y;

    // Check horizontal positioning
    if (x + rect.width > screenWidth) {
      finalX = x - rect.width;
    }

    // Check vertical positioning
    if (y + rect.height > screenHeight) {
      finalY = y - rect.height;
    }

    // Ensure menu stays within screen bounds
    finalX = Math.max(0, Math.min(finalX, screenWidth - rect.width));
    finalY = Math.max(0, Math.min(finalY, screenHeight - rect.height));

    menuStyle = `top: ${finalY}px; left: ${finalX}px`;
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (!(event.target as Element).closest('.context-menu')) {
      onClose();
    }
  };

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    updatePosition();
    // Update position when window is resized
    window.addEventListener('resize', updatePosition);
  });

  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside);
    window.removeEventListener('resize', updatePosition);
  });
</script>

<div
  bind:this={menuElement}
  class="fixed bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 context-menu min-w-[200px]"
  style={menuStyle}
>
  <ul class="py-1">
    {#each items as item}
      {#if item.divider}
        <li class="border-t border-gray-700 my-1"></li>
      {:else}
        <li>
          <button
            class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
            on:click={() => {
              item.action();
              onClose();
            }}
            disabled={item.disabled}
          >
            {#if item.icon}
              <span class="mr-2">
                <svelte:component this={item.icon} size={16} />
              </span>
            {/if}
            <span class="flex-grow">{item.label}</span>
            {#if item.shortcut}
              <span class="ml-4 text-gray-500">{item.shortcut}</span>
            {/if}
          </button>
        </li>
      {/if}
    {/each}
  </ul>
</div>

<style>
  .context-menu {
    min-width: 160px;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
