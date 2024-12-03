<script lang="ts">
    import { X } from "lucide-svelte";
    import type { Tab } from "@/types/editor.types";

    let tabs = [
        { id: 1, name: "App.tsx", active: true },
        { id: 2, name: "LeftSidebar.tsx", active: false },
        { id: 3, name: "Editor.tsx", active: false },
    ] satisfies Tab[];

    function setActiveTab(id: number) {
        tabs = tabs.map((tab) => ({ ...tab, active: tab.id === id }));
    }

    function closeTab(id: number) {
        const newTabs = tabs.filter((tab) => tab.id !== id);
        if (newTabs.length > 0 && !newTabs.some((tab) => tab.active)) {
            newTabs[0].active = true;
        }
        tabs = newTabs;
    }

    const editorContent = `
import React, { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('Component mounted');
  }, []);

  return (
    <main>
      <h1>Welcome to React</h1>
      <p>Edit <code>src/App.tsx</code> and save to reload.</p>
      <button onClick={() => setCount(count + 1)}>
        Clicks: {count}
      </button>
    </main>
  );
}

export default Counter;
  `.trim();
</script>

<div class="flex flex-col h-full">
    <div class="flex bg-slate-800 text-sm">
        {#each tabs as tab (tab.id)}
            <button
                class="flex items-center px-4 py-2 border-r border-gray-800 cursor-pointer {tab.active
                    ? 'bg-gray-900'
                    : 'bg-gray-800 hover:bg-gray-700'} transition-colors duration-200"
                on:click={() => setActiveTab(tab.id)}
            >
                <span>{tab.name}</span>
                <button
                    on:click|stopPropagation={() => closeTab(tab.id)}
                    class="ml-2 text-gray-400 hover:text-gray-100 transition-colors duration-200"
                    aria-label="Close {tab.name}"
                >
                    <X size={14} />
                </button>
            </button>
        {/each}
    </div>
    <div class="flex-grow bg-gray-950 p-4 overflow-auto">
        <pre class="font-mono text-sm text-gray-300">
            <code>{editorContent}</code>
        </pre>
    </div>
</div>
