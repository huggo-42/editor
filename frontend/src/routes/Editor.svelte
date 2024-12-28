<script lang="ts">
    import { X, Circle, ChevronLeft, ChevronRight } from "lucide-svelte";
    import { onMount, onDestroy } from 'svelte';
    import type { SidebarState } from "@/types/ui";
    import LeftSidebar from "@/lib/editor/LeftSidebar.svelte";
    import RightSidebar from "@/lib/editor/RightSidebar.svelte";
    import ResizeHandle from "@/lib/components/ResizeHandle.svelte";
    import Topbar from "@/lib/editor/Topbar.svelte";
    import BottomBar from "@/lib/editor/BottomBar.svelte";
    import { fileStore } from '@/stores/fileStore';
    import { projectStore } from '@/stores/project';
    import { gitStore } from '@/stores/gitStore';
    import { registerCommand, setKeyboardContext } from '@/stores/keyboardStore';
    import { get } from 'svelte/store';
    import EditorTabs from "@/lib/editor/core/EditorTabs.svelte";
    import FileFinderPallete from "@/lib/components/palletes/FileFinderPallete.svelte";
    import GitCommitPallete from "@/lib/components/palletes/GitCommitPallete.svelte";
    import Modal from "@/lib/components/Modal.svelte";
    import BottomPane from "@/lib/editor/panes/BottomPane.svelte";
    import { focusStore } from '@/stores/focusStore';
    import { bottomPaneStore } from '@/stores/bottomPaneStore';

    let editorTabs: { layout: () => void } | null = null;


    // Sidebar states
    let leftSidebarState: SidebarState = {
        collapsed: false,
        activeSection: 'files',
        isAllCollapsed: false
    };

    let rightSidebarCollapsed = false;
    let isSourceControlActive = false;
    let isExplorerActive = true;
    let showCommandPalette = false;
    let showFileFinder = false;
    let showCommitSearch = false;

    // Sidebar widths and heights
    let leftSidebarWidth = 300;
    let rightSidebarWidth = 600;

    function handleResize(event: CustomEvent) {
        // Call layout on the EditorTabs component
        editorTabs?.layout();

        // Force a re-render of the bottom pane
        bottomPaneStore.update(state => ({ ...state, height: event.detail.height }));
    }

    // Source control state
    $: modifiedFilesCount = $gitStore.gitStatus.length;

    let showCloseConfirmModal = false;
    let fileToClose: string | null = null;

    function handleCloseRequest(event: CustomEvent<{ id: string }>) {
        fileToClose = event.detail.id;
        showCloseConfirmModal = true;
    }

    function confirmCloseTab() {
        if (fileToClose) {
            fileStore.closeFile(fileToClose);
            fileToClose = null;
            showCloseConfirmModal = false;
        }
    }

    function setActiveTab(id: string) {
        fileStore.setActiveFile(id);
    }

    // Watch for active file changes
    $: if ($fileStore.activeFilePath) {
        // Wait for the DOM to update before scrolling
        setTimeout(() => setActiveTab($fileStore.activeFilePath), 0);
    }

    function toggleSourceControl() {
        isSourceControlActive = !isSourceControlActive;
        if (isSourceControlActive) {
            leftSidebarState.activeSection = 'git';
            leftSidebarState.collapsed = false;
            isExplorerActive = false;
        } else {
            leftSidebarState.activeSection = 'files';
        }
    }

    function toggleExplorer() {
        isExplorerActive = !isExplorerActive;
        if (isExplorerActive) {
            leftSidebarState.activeSection = 'files';
            leftSidebarState.collapsed = false;
            isSourceControlActive = false;
        } else {
            // When deactivating explorer, we don't switch to another view
            leftSidebarState.collapsed = true;
        }
    }

    onMount(() => {
        const state = get(projectStore);
        if (state.currentProject?.Path) {
            fileStore.loadProjectFiles(state.currentProject.Path);
        }
        
        setKeyboardContext('global');

        // Register terminal shortcut
        registerCommand('terminal.open', () => {
            // Save current focus
            focusStore.focus('editor', $fileStore.activeFilePath || 'editor');
            
            // Just set the active section, no collapsing
            bottomPaneStore.update(state => ({
                ...state,
                activeSection: 'terminal'
            }));
        });

        // Register return to previous shortcut
        registerCommand('terminal.returnToPrevious', () => {
            // Just focus back, no collapsing
            focusStore.restorePrevious();
        });

        registerCommand('file.showFileFinder', () => showFileFinder = true);
        registerCommand('git.showCommitPalette', () => showCommitSearch = true);

        // Register sidebar toggle commands
        registerCommand('view.toggleLeftSidebar', () => {
            leftSidebarState.collapsed = !leftSidebarState.collapsed;
        });
        registerCommand('view.toggleRightSidebar', () => {
            rightSidebarCollapsed = !rightSidebarCollapsed;
        });
    });

    onDestroy(() => {
        setKeyboardContext('global');
    });

</script>

<div class="flex flex-col h-screen bg-gray-900 text-gray-300">
    <Topbar 
        bind:isLeftSidebarCollapsed={leftSidebarState.collapsed}
        bind:isRightSidebarCollapsed={rightSidebarCollapsed}
        onToggleSourceControl={toggleSourceControl}
        bind:isSourceControlActive
        bind:isExplorerActive
        {modifiedFilesCount}
        onToggleLeftSidebar={() => leftSidebarState.collapsed = !leftSidebarState.collapsed}
        onToggleRightSidebar={() => rightSidebarCollapsed = !rightSidebarCollapsed}
        onToggleExplorer={toggleExplorer}
        showCommandPalette={() => showCommandPalette = true}
        showFileFinder={() => showFileFinder = true}
    />
    
    <div class="flex flex-1 overflow-hidden">
        <!-- Left sidebar -->
        <div
            class="h-full"
            class:w-0={leftSidebarState.collapsed}
            class:w-auto={!leftSidebarState.collapsed}
            style={!leftSidebarState.collapsed ? `width: ${leftSidebarWidth}px` : ''}
        >
            <LeftSidebar bind:state={leftSidebarState} />
        </div>

        {#if !leftSidebarState.collapsed}
            <ResizeHandle
                orientation="vertical"
                side="right"
                bind:size={leftSidebarWidth}
                minSize={200}
                maxSize={600}
                on:resize={handleResize}
            />
        {/if}

        <!-- Main editor area -->
        <div class="flex-1 flex flex-col overflow-hidden">
            <EditorTabs
                bind:this={editorTabs}
                on:closeRequest={handleCloseRequest}
            />

                {#if !$bottomPaneStore.collapsed}
                    <ResizeHandle 
                        orientation="horizontal" 
                        side="top"
                        size={$bottomPaneStore.height}
                        maxSize={800}
                        on:resize={(event) => {
                            handleResize(event);
                            bottomPaneStore.update(state => ({ ...state, height: event.detail.size }));
                        }}
                    />
                {/if}

                <!-- Bottom pane -->
                <div class="flex flex-col overflow-hidden"
                    class:hidden={$bottomPaneStore.collapsed}
                    style:height={`${$bottomPaneStore.height}px`}
                >
                    <BottomPane />
                </div>
        </div>

        {#if !rightSidebarCollapsed}
            <ResizeHandle
                orientation="vertical"
                side="left"
                bind:size={rightSidebarWidth}
                minSize={200}
                maxSize={800}
                on:resize={handleResize}
            />
        {/if}

        <!-- Right sidebar -->
        <div
            class="h-full"
            class:w-0={rightSidebarCollapsed}
            class:w-auto={!rightSidebarCollapsed}
            style={!rightSidebarCollapsed ? `width: ${rightSidebarWidth}px` : ''}
        >
            <RightSidebar bind:collapsed={rightSidebarCollapsed} />
        </div>
    </div>

    <BottomBar />

    <FileFinderPallete 
        bind:show={showFileFinder} 
        on:close={() => showFileFinder = false} 
        on:select={({ detail }) => fileStore.setActiveFile(detail.path)}
    />

    <GitCommitPallete
        bind:show={showCommitSearch}
        on:close={() => showCommitSearch = false}
    />

    <Modal
        bind:show={showCloseConfirmModal}
        title="Unsaved Changes"
        confirmText="Discard"
        on:confirm={confirmCloseTab}
    >
        <p>You have unsaved changes in this file. Do you want to discard them?</p>
    </Modal>
</div>

<style>
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
</style>
