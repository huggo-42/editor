<script lang="ts">
    import { X } from "lucide-svelte";
    import { onMount, onDestroy } from 'svelte';
    import type { Tab } from "@/types/editor.types";
    import type { SidebarState } from "@/types/ui.types";
    import type { FileNode } from "@/types/file.types";
    import LeftSidebar from "@/lib/editor/LeftSidebar.svelte";
    import RightSidebar from "@/lib/editor/RightSidebar.svelte";
    import ResizeHandle from "@/lib/editor/ResizeHandle.svelte";
    import Topbar from "@/lib/editor/Topbar.svelte";
    import BottomBar from "@/lib/editor/BottomBar.svelte";
    import { fileStore, type FileItem } from '../lib/stores/fileStore';
    import { tooltip } from '@/lib/actions/tooltip';
    import { Search } from "lucide-svelte";
    import { File } from "lucide-svelte";
    import { setKeyboardContext } from '../lib/stores/keyboardStore';

    // Tab state
    let tabs = [
        { id: 1, name: "App.tsx", active: true },
        { id: 2, name: "LeftSidebar.tsx", active: false },
        { id: 3, name: "Editor.tsx", active: false },
    ] satisfies Tab[];

    // Initial file tree
    const initialFileTree: FileNode[] = [
        {
            id: '1',
            name: 'src',
            type: 'folder',
            path: '/src',
            expanded: true,
            children: [
                { id: '2', name: 'lib', type: 'folder', path: '/src/lib', children: [] },
                { id: '3', name: 'routes', type: 'folder', path: '/src/routes', children: [] },
                { id: '4', name: 'App.tsx', type: 'file', path: '/src/App.tsx' },
                { id: '5', name: 'main.ts', type: 'file', path: '/src/main.ts' },
            ]
        },
        { id: '6', name: 'package.json', type: 'file', path: '/package.json' }
    ];

    // Sidebar states
    let leftSidebarState: SidebarState = {
        collapsed: true,
        activeSection: 'files',
        fileTree: initialFileTree,
        isAllCollapsed: false
    };

    function updateSidebarState(newState: Partial<SidebarState>) {
        leftSidebarState = { ...leftSidebarState, ...newState };
    }

    let rightSidebarCollapsed = false;

    // Sidebar widths
    let leftSidebarWidth = 300;
    let rightSidebarWidth = 300;

    // Source control state
    let modifiedFilesCount = 2; // This would be dynamically updated based on git status

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

    const WORKSPACE_PATH = '/home/nathanael/Documents/Trabalhos/Sideprojects/EditAI';

    let isLeftSidebarCollapsed = true;
    let isRightSidebarCollapsed = false;
    let isSourceControlActive = false;
    let isExplorerActive = true;
    let showCommandPalette = false;
    let showFileFinder = false;

    onMount(() => {
        setKeyboardContext('editor');
        // For now, let's add some example files
        const fileItems: FileItem[] = [
            {
                path: 'frontend/src/routes/Editor.svelte',
                name: 'Editor.svelte',
                type: 'file'
            },
            {
                path: 'frontend/src/lib/components/FileFinder.svelte',
                name: 'FileFinder.svelte',
                type: 'file'
            },
            {
                path: 'frontend/src/lib/stores/fileStore.ts',
                name: 'fileStore.ts',
                type: 'file'
            }
        ];
        
        fileStore.setFiles(fileItems);
    });

    onDestroy(() => {
        setKeyboardContext('global');
    });
</script>

<div class="flex flex-col h-screen bg-gray-900 text-gray-300">
    <Topbar 
        bind:isLeftSidebarCollapsed
        bind:isRightSidebarCollapsed
        bind:isSourceControlActive
        bind:isExplorerActive
        onToggleLeftSidebar={() => isLeftSidebarCollapsed = !isLeftSidebarCollapsed}
        onToggleRightSidebar={() => isRightSidebarCollapsed = !isRightSidebarCollapsed}
        onToggleSourceControl={() => isSourceControlActive = !isSourceControlActive}
        onToggleExplorer={() => isExplorerActive = !isExplorerActive}
        showCommandPalette={() => showCommandPalette = true}
        showFileFinder={() => showFileFinder = true}
    />
    
    <div class="flex flex-1 overflow-hidden">
        {#if !isLeftSidebarCollapsed}
            <div style="width: {leftSidebarWidth}px" class="flex-shrink-0">
                <LeftSidebar state={leftSidebarState} />
            </div>
            <ResizeHandle 
                side="left" 
                currentWidth={leftSidebarWidth}
                onResize={(width) => leftSidebarWidth = width} 
            />
        {/if}
        
        <main class="flex-1 flex flex-col min-w-0 max-w-full">
            <div class="flex items-center border-b border-gray-800 bg-gray-900">
                <div class="flex overflow-x-auto">
                    {#each tabs as tab (tab.id)}
                        <button
                            class="flex items-center h-[34px] px-4 border-r border-gray-800 cursor-pointer {tab.active
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
            </div>
            
            <div class="flex-1 overflow-auto p-4 bg-gray-950">
                <pre class="font-mono text-sm">
                    <code>{editorContent}</code>
                </pre>
            </div>
        </main>
        
        {#if !isRightSidebarCollapsed}
            <ResizeHandle 
                side="right" 
                currentWidth={rightSidebarWidth}
                onResize={(width) => rightSidebarWidth = width} 
            />
            <div style="width: {rightSidebarWidth}px" class="flex-shrink-0">
                <RightSidebar collapsed={isRightSidebarCollapsed} />
            </div>
        {/if}
    </div>
    
    <BottomBar />
</div>