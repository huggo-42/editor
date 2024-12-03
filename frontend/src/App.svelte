<script lang="ts">
  import "./app.css";
  import { onMount } from 'svelte';
  import Router from "svelte-spa-router";
  import Welcome from "./routes/Welcome.svelte";
  import Editor from "./routes/Editor.svelte";
  import Configs from "./routes/Configs.svelte";
  import CommandPalette from './lib/components/CommandPalette.svelte';

  const routes = {
    "/": Welcome,
    "/editor": Editor,
    "/configs": Configs,
  };

  let showCommandPalette = false;

  function handleKeydown(event: KeyboardEvent) {
    // Handle Ctrl+Shift+P or Cmd+Shift+P (for Mac)
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
      event.preventDefault();
      showCommandPalette = true;
    }
    // Handle Escape key
    if (event.key === 'Escape' && showCommandPalette) {
      event.preventDefault();
      showCommandPalette = false;
    }
  }

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
</main>

<style>
</style>
