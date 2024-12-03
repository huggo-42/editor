<script lang="ts">
  import "./app.css";
  import { onMount, push } from 'svelte';
  import Router from "svelte-spa-router";
  import Welcome from "./routes/Welcome.svelte";
  import Editor from "./routes/Editor.svelte";
  import Configs from "./routes/Configs.svelte";
  import CommandPalette from './lib/components/CommandPalette.svelte';
  import FileFinder from './lib/components/FileFinder.svelte';
  import KeyboardManager from './lib/components/KeyboardManager.svelte';
  import { registerCommand } from './lib/stores/keyboardStore';
  import type { FileItem } from './lib/stores/fileStore';

  const routes = {
    "/": Welcome,
    "/editor": Editor,
    "/configs": Configs,
  };

  let showCommandPalette = false;
  let showFileFinder = false;

  function handleKeydown(event: KeyboardEvent) {
    // Handle Ctrl+Shift+P or Cmd+Shift+P (for Mac)
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
      event.preventDefault();
      showCommandPalette = true;
    }
    // Handle Ctrl+P or Cmd+P (for Mac)
    else if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'p') {
      event.preventDefault();
      showFileFinder = true;
    }
    // Handle Escape key
    if (event.key === 'Escape' && (showCommandPalette || showFileFinder)) {
      event.preventDefault();
      showCommandPalette = false;
      showFileFinder = false;
    }
  }

  function handleFileSelect(event: CustomEvent<FileItem>) {
    const file = event.detail;
    // TODO: Open the file in the editor
    console.log('Opening file:', file.path);
    showFileFinder = false;
  }

  // Register keyboard commands
  registerCommand('command.showCommandPalette', () => showCommandPalette = true);
  registerCommand('file.showFileFinder', () => showFileFinder = true);
  registerCommand('modal.close', () => {
    showCommandPalette = false;
    showFileFinder = false;
  });

  // Register navigation commands
  registerCommand('navigation.goToEditor', () => push('/editor'));
  registerCommand('navigation.goToSettings', () => push('/configs'));
  registerCommand('view.toggleLeftSidebar', () => {
    isLeftSidebarCollapsed = !isLeftSidebarCollapsed;
  });
  registerCommand('view.toggleRightSidebar', () => {
    isRightSidebarCollapsed = !isRightSidebarCollapsed;
  });

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<main class="h-screen">
  <Router {routes} />
  <CommandPalette 
    bind:show={showCommandPalette}
    on:close={() => showCommandPalette = false}
  />
  <FileFinder
    bind:show={showFileFinder}
    on:close={() => showFileFinder = false}
    on:select={handleFileSelect}
  />
  <KeyboardManager />
</main>

<style>
</style>
