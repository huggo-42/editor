<script>
  import "./app.css";
  
  import Router from "svelte-spa-router";
  import Welcome from "./routes/Welcome.svelte";
  import Editor from "./routes/Editor.svelte";
  import Configs from "./routes/Configs.svelte";

  const routes = {
    "/": Welcome,
    "/editor": Editor,
    "/configs": Configs,
  };
</script>

<main>
  <Router {routes} />
</main>

<style>
</style>
