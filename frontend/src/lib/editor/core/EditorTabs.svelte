<script lang="ts">
    import { X, Circle, ChevronLeft, ChevronRight } from "lucide-svelte";
    import { fileStore } from '@/stores/fileStore';
    import { editorInstanceStore } from '@/stores/editorInstanceStore';
    import TabEditor from "./TabEditor.svelte";
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let tabsContainer: HTMLDivElement;
    let editorsContainer: HTMLDivElement;

    // Convert open files to tabs
    $: tabs = Array.from($fileStore.openFiles.entries()).map(([path, file]) => ({
        id: path,
        name: path.split('/').pop() || '',
        active: path === $fileStore.activeFilePath,
        isDirty: file.isDirty
    }));

    function setActiveTab(id: string) {
        fileStore.setActiveFile(id);
        scrollToTab(id);
        dispatch('change', { id });
    }

    function handleCloseTab(id: string) {
        const file = $fileStore.openFiles.get(id);
        if (file?.isDirty) {
            dispatch('closeRequest', { id });
        } else {
            closeTab(id);
        }
    }

    function closeTab(id: string) {
        editorInstanceStore.removeEditor(id);
        fileStore.closeFile(id);
        dispatch('close', { id });
    }

    function scrollToTab(id: string) {
        if (tabsContainer) {
            const tabElement = tabsContainer.querySelector(`[data-tab-id="${id}"]`);
            if (tabElement) {
                const containerWidth = tabsContainer.offsetWidth;
                const tabWidth = (tabElement as HTMLElement).offsetWidth;
                const tabLeft = (tabElement as HTMLElement).offsetLeft;
                const scrollLeft = tabLeft - (containerWidth - tabWidth) / 2;
                
                tabsContainer.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
        }
    }

    function scrollTabs(direction: 'left' | 'right') {
        if (tabsContainer) {
            const scrollAmount = 200;
            const newScrollLeft = tabsContainer.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            tabsContainer.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    }

    function handleMouseUp(event: MouseEvent, id: string) {
        if (event.button === 1) { // Middle click
            event.preventDefault();
            handleCloseTab(id);
        }
    }

    function handleWheel(event: WheelEvent) {
        if (!event.shiftKey) return;
        event.preventDefault();
        
        if (tabsContainer) {
            tabsContainer.scrollLeft += event.deltaY;
        }
    }

    // Watch for active file changes and scroll to active tab
    $: if ($fileStore.activeFilePath) {
        setTimeout(() => scrollToTab($fileStore.activeFilePath!), 0);
    }

    // Layout all editors
    export function layout() {
        $editorInstanceStore.forEach(editor => editor?.layout());
    }
</script>

{#if tabs.length > 0}
<div class="flex flex-col h-full">
    <!-- Tabs -->
    <div class="flex items-center bg-gray-900 border-b border-gray-700">
        <div class="flex-1 flex items-center overflow-y-hidden overflow-x-auto scrollbar-hide relative" 
            bind:this={tabsContainer}
            on:wheel={handleWheel}>
            {#each tabs as tab (tab.id)}
                <button class="flex items-center h-[35px] px-4 border-r border-gray-700 hover:bg-gray-700 transition-colors duration-200 gap-2 group whitespace-nowrap relative"
                    class:bg-gray-800={tab.active}
                    class:after:absolute={tab.active}
                    class:after:top-0={tab.active}
                    class:after:left-0={tab.active}
                    class:after:right-0={tab.active}
                    class:after:h-[2px]={tab.active}
                    class:after:bg-blue-500={tab.active}
                    data-tab-id={tab.id}
                    on:click={() => setActiveTab(tab.id)}
                    on:mouseup={(e) => handleMouseUp(e, tab.id)}>
                    {#if tab.isDirty}
                        <Circle size={8} class="text-gray-500" />
                    {/if}
                    <span class="truncate">{tab.name}</span>
                    <button class="opacity-0 group-hover:opacity-100  transition-opacity duration-200 hover:rounded-sm p-0.5 hover:bg-gray-600"
                        on:click|stopPropagation={() => handleCloseTab(tab.id)}>
                        <X size={14} />
                    </button>
                </button>
            {/each}
        </div>
        <div class="flex items-center gap-1 border-l border-gray-700 bg-gray-900 pl-1 sticky right-0">
            <button
                on:click={() => scrollTabs('left')}
                class="p-1.5 hover:bg-gray-800 transition-colors duration-200 text-gray-400 hover:text-gray-300"
            >
                <ChevronLeft size={16} />
            </button>
            <button
                on:click={() => scrollTabs('right')}
                class="p-1.5 hover:bg-gray-800 transition-colors duration-200 text-gray-400 hover:text-gray-300"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    </div>

    <!-- Editors -->
    <div class="flex-1 relative" bind:this={editorsContainer}>
        {#each tabs as tab (tab.id)}
            <TabEditor 
                filepath={tab.id}
                active={tab.active}
                on:mount={(event) => {
                    const editor = event.detail;
                    if (editor) {
                        editorInstanceStore.setEditor(tab.id, editor);
                    }
                }}
            />
        {/each}
    </div>
</div>
{/if}

<style>
    /* Hide default scrollbar */
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }

    /* Custom scrollbar overlay */
    .scrollbar-hide:hover::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
        background: rgba(156, 163, 175, 0.3);
        pointer-events: none;
        opacity: 0;
        animation: fadeIn 0.2s ease forwards;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
</style>
