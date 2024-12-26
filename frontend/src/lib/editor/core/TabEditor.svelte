<script lang="ts">
    import * as monaco from 'monaco-editor';
    import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import { fileStore } from '@/stores/fileStore';
    import { editorConfigStore } from '@/stores/editorConfigStore';
    import { editorStateStore } from '@/stores/editorStateStore';
    import { initVimMode, VimMode } from 'monaco-vim';
    import { focusStore } from '@/stores/focusStore';
    import Breadcrumbs from "@/lib/editor/Breadcrumbs.svelte";
    import DiffHeader from "@/lib/editor/git/changes/DiffHeader.svelte";
    import { addKeyboardContext } from '@/stores/keyboardStore';
    import { GetFileContent } from '@/lib/wailsjs/go/main/App';

    const dispatch = createEventDispatcher();

    export let filepath: string;
    export let active = false;

    let editorContainer: HTMLElement;
    let editor: monaco.editor.IStandaloneCodeEditor | monaco.editor.IStandaloneDiffEditor;
    let vimMode: { dispose: () => void } | null = null;
    let vimStatusBar: HTMLElement;
    let vimEnabled = false;
    let editorId = focusStore.generateId('editor');

    // Get file content and language
    $: file = $fileStore.openFiles.get(filepath);
    $: content = file?.content || '';
    $: language = file?.language || 'plaintext';
    $: isDiff = file?.type === 'diff';
    $: state = $editorStateStore[filepath];

    // Export layout function for parent to call
    export function layout() {
        if (editor) {
            editor.layout();
        }
    }

    // Helper function to get editor content
    function getEditorContent(): string {
        if (!editor) return '';
        
        if (isDiff) {
            const diffEditor = editor as monaco.editor.IStandaloneDiffEditor;
            return diffEditor.getModifiedEditor().getValue();
        } else {
            return (editor as monaco.editor.IStandaloneCodeEditor).getValue();
        }
    }

    function parseDiff(diffContent: string): { original: string; modified: string } {
        const lines = diffContent.split('\n');
        let original = '';
        let modified = '';
        let contentStarted = false;
        
        for (const line of lines) {
            // Skip the first two lines (--- and +++)
            if (line.startsWith('---') || line.startsWith('+++')) {
                continue;
            }
            
            // If we find an @@ line, mark content as started
            if (line.startsWith('@@')) {
                contentStarted = true;
                continue;
            }
            
            // If we haven't found an @@ line and we're past the headers,
            // treat everything as content
            if (!contentStarted && !line.startsWith('---') && !line.startsWith('+++')) {
                contentStarted = true;
            }
            
            if (!contentStarted) {
                continue;
            }

            if (line.startsWith('-')) {
                original += line.slice(1) + '\n';
            } else if (line.startsWith('+')) {
                modified += line.slice(1) + '\n';
            } else {
                original += line + '\n';
                modified += line + '\n';
            }
        }
        
        return { original: original.trimEnd(), modified: modified.trimEnd() };
    }

    onMount(() => {
        if (!editorContainer) return;

        // Add keyboard context
        addKeyboardContext('editor');

        // Create editor with initial config
        const config = $editorConfigStore.editor;
        const baseOptions = {
            theme: config.theme,
            fontSize: config.fontSize,
            tabSize: config.tabSize,
            wordWrap: config.wordWrap ? 'on' : 'off',
            lineNumbers: config.lineNumbers ? (config.relativeLines ? 'relative' : 'on') : 'off',
            minimap: { enabled: config.minimap },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 10,
            renderLineHighlight: 'all',
            scrollbar: {
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
            },
            stickyScroll: {
                enabled: config.stickyScroll
            }
        };

        // Setup Monaco worker
        self.MonacoEnvironment = {
            getWorker: function (_moduleId: string, label: string) {
                return new EditorWorker();
            }
        };

        if (isDiff) {
            editor = monaco.editor.createDiffEditor(editorContainer, {
                ...baseOptions,
                readOnly: true,
                originalEditable: false,
                modifiedEditable: false,
                renderSideBySide: false,
                ignoreTrimWhitespace: false,
                enableSplitViewResizing: false
            });

            const { original, modified } = parseDiff(content);
            const originalModel = monaco.editor.createModel(original, language);
            const modifiedModel = monaco.editor.createModel(modified, language);
            
            (editor as monaco.editor.IStandaloneDiffEditor).setModel({
                original: originalModel,
                modified: modifiedModel
            });

            return () => {
                originalModel.dispose();
                modifiedModel.dispose();
            };
        } else {
            editor = monaco.editor.create(editorContainer, {
                ...baseOptions,
                value: content,
                language
            });

            // Setup vim mode if enabled
            if (config.vimMode) {
                vimStatusBar = document.createElement('div');
                vimStatusBar.className = 'vim-status-bar absolute bottom-0 left-0 bg-gray-800 text-gray-300 px-2 py-0.5 text-sm';
                editorContainer.appendChild(vimStatusBar);
                vimMode = initVimMode(editor, vimStatusBar);
                vimEnabled = true;
            }

            // Watch for content changes
            const disposable = editor.onDidChangeModelContent(() => {
                const value = getEditorContent();
                if (value !== content) {
                    fileStore.updateFileContent(filepath, value);
                }
            });

            // Save file on Ctrl+S
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
                try {
                    await fileStore.saveFile(filepath);
                } catch (error) {
                    console.error('Error saving file:', error);
                }
            });

            return () => {
                disposable.dispose();
            };
        }

    });

    onDestroy(() => {
        if (editor) {
            // Cleanup vim mode
            if (vimMode) {
                vimMode.dispose();
            }

            // Dispose editor
            editor.dispose();
        }
    });

    // Watch for config changes
    $: if (editor && $editorConfigStore) {
        const config = $editorConfigStore.editor;
        editor.updateOptions({
            theme: config.theme,
            fontSize: config.fontSize,
            tabSize: config.tabSize,
            wordWrap: config.wordWrap ? 'on' : 'off',
            lineNumbers: config.lineNumbers ? (config.relativeLines ? 'relative' : 'on') : 'off',
            minimap: {
                enabled: config.minimap
            }
        });
    }

    // Watch for content changes from fileStore
    $: if (editor && content !== getEditorContent()) {
        if (isDiff) {
            const { original, modified } = parseDiff(content);
            const originalModel = monaco.editor.createModel(original, language);
            const modifiedModel = monaco.editor.createModel(modified, language);
            
            (editor as monaco.editor.IStandaloneDiffEditor).setModel({
                original: originalModel,
                modified: modifiedModel
            });
        } else {
            (editor as monaco.editor.IStandaloneCodeEditor).setValue(content);
        }
    }

    // Handle active state
    $: if (editor && active) {
        editor.focus();
        focusStore.focus('editor', editorId);
    }
</script>

<div class="h-full relative flex flex-col" class:hidden={!active}>
    {#if filepath}
        {#if filepath.startsWith('[diff]')}
            <DiffHeader {filepath} />
        {:else}
            <Breadcrumbs {filepath} />
        {/if}
    {/if}
    <div bind:this={editorContainer} class="flex-1 relative" />
    {#if vimEnabled}
        <div class="vim-status-bar" bind:this={vimStatusBar} />
    {/if}
</div>

<style>
    .vim-status-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 20px;
        background-color: #1e1e1e;
        color: #d4d4d4;
        padding: 0 8px;
        font-family: monospace;
        font-size: 12px;
        line-height: 20px;
        z-index: 1;
    }
</style>
