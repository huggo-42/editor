<script lang="ts">
  import "./app.css";
  import { onMount, onDestroy } from "svelte";
  import Router from "svelte-spa-router";
  import Welcome from "@/routes/Welcome.svelte";
  import Editor from "@/routes/Editor.svelte";
  import Configs from "@/routes/Configs.svelte";
  import CommandPalette from "@/lib/components/CommandPalette.svelte";
  import KeyboardManager from "@/lib/components/KeyboardManager.svelte";
  import { registerCommand } from "./stores/keyboardStore";

  const routes = {
    "/": Welcome,
    "/editor": Editor,
    "/configs": Configs,
  };

  let showCommandPalette = false;

  onMount(() => {
    registerCommand("command.showCommandPalette", () => showCommandPalette = true);
  });

  onDestroy(() => {
    // Cleanup
  });
</script>

<KeyboardManager />

<main class="h-screen">
  <Router {routes} />

  <CommandPalette
    show={showCommandPalette}
    on:close={() => (showCommandPalette = false)}
  />
</main>
