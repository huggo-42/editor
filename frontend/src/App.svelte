<script lang="ts">
  import "./app.css";
  import { onMount, onDestroy } from "svelte";
  import Router from "svelte-spa-router";
  import Welcome from "@/routes/Welcome.svelte";
  import Editor from "@/routes/Editor.svelte";
  import Configs from "@/routes/Configs.svelte";
  import CommandPalette from "@/lib/components/palletes/CommandPalette.svelte";
  import BranchPalette from "@/lib/components/palletes/BranchPalette.svelte";
  import KeyboardManager from "@/lib/components/KeyboardManager.svelte";
  import { registerCommand } from "./stores/keyboardStore";
  import { editorConfigStore } from "./stores/editorConfigStore";

  const routes = {
    "/": Welcome,
    "/editor": Editor,
    "/configs": Configs,
  };

  let showCommandPalette = false;
  let showBranchPalette = false;

  onMount(async () => {
    // Load editor config first
    await editorConfigStore.loadConfig();

    // Register commands after config is loaded
    registerCommand("command.showCommandPalette", () => showCommandPalette = true);
    registerCommand("git.showBranchPalette", () => showBranchPalette = true);
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

  <BranchPalette
    show={showBranchPalette}
    on:close={() => (showBranchPalette = false)}
  />
</main>
