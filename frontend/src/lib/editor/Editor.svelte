<script lang="ts">
    import * as monaco from 'monaco-editor';
    import { onMount, onDestroy } from 'svelte';
    import { fileStore } from '@/stores/fileStore';
    import { editorConfigStore } from '@/stores/editorConfigStore';
    import { initVimMode, VimMode } from 'monaco-vim';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let editorContainer: HTMLElement;
    let editor: monaco.editor.IStandaloneCodeEditor;
    let currentModel: monaco.editor.ITextModel | null = null;
    let vimMode: { dispose: () => void } | null = null;
    let vimStatusBar: HTMLElement;
    let vimEnabled = false;

    // Load editor config on mount
    onMount(async () => {
        await editorConfigStore.loadConfig();
    });

    // Watch for config changes
    $: if (editor && $editorConfigStore) {
        const config = $editorConfigStore.editor;
        editor.updateOptions({
            theme: config.theme,
            fontSize: config.fontSize,
            tabSize: config.tabSize,
            wordWrap: config.wordWrap ? 'on' : 'off',
            lineNumbers: config.lineNumbers ? 'on' : 'off',
            minimap: {
                enabled: config.minimap
            }
        });

        // Watch for vim config changes
        if (vimStatusBar && $editorConfigStore.editor.vim?.enabled !== vimEnabled) {
            vimEnabled = $editorConfigStore.editor.vim?.enabled || false;
            if (vimEnabled && !vimMode) {
                // Enable Vim mode
                vimMode = initVimMode(editor, vimStatusBar);
            } else if (!vimEnabled && vimMode) {
                // Disable Vim mode
                vimMode.dispose();
                vimMode = null;
            }
        }
    }

    function getLanguageFromPath(path: string): string {
        const ext = path.split('.').pop()?.toLowerCase() || '';
        switch (ext) {
            case 'js':
                return 'javascript';
            case 'jsx':
                return 'javascript';
            case 'ts':
                return 'typescript';
            case 'tsx':
                return 'typescript';
            case 'html':
                return 'html';
            case 'svelte':
                return 'html'; // Use HTML highlighting for Svelte
            case 'go':
                return 'go';
            case 'py':
                return 'python';
            case 'json':
                return 'json';
            case 'md':
                return 'markdown';
            case 'css':
                return 'css';
            default:
                return 'plaintext';
        }
    }

    // Subscribe to active file changes
    $: if ($fileStore.activeFilePath && $fileStore.openFiles.has($fileStore.activeFilePath)) {
        const file = $fileStore.openFiles.get($fileStore.activeFilePath)!;
        updateEditor(file);
    }

    async function updateEditor(file: { path: string; content: string; language: string }) {
        if (!editor) return;

        // Create or get model for this file
        let model = monaco.editor.getModel(monaco.Uri.file(file.path));
        if (!model) {
            model = monaco.editor.createModel(
                file.content,
                getLanguageFromPath(file.path),
                monaco.Uri.file(file.path)
            );
        } else {
            const currentValue = model.getValue();
            // Only update if content actually changed
            if (currentValue !== file.content) {
                model.setValue(file.content);
            }
        }

        // Set the model as current
        editor.setModel(model);
        
        // Focus the editor after setting the model
        editor.focus();

        // Set as current model
        currentModel = model;

        // Listen for content changes
        const disposable = model.onDidChangeContent(() => {
            const currentContent = model.getValue();
            if (currentContent !== file.content) {
                fileStore.updateFileContent(file.path, currentContent, true);
            }
        });

        // Add command for saving
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
            if (file.path) {
                try {
                    await fileStore.saveFile(file.path);
                } catch (error) {
                    console.error('Error saving file:', error);
                }
            }
        });

        return () => disposable.dispose();
    }

    // Function to handle keyboard events
    function handleKeydown(event: KeyboardEvent) {
        // If vim mode is enabled, prevent Ctrl+P and show fuzzy finder
        if (vimEnabled && event.ctrlKey && event.key.toLowerCase() === 'p') {
            event.preventDefault();
            event.stopPropagation();
            dispatch('showFileFinder');
        }
    }

    onMount(() => {
        // Create editor with initial config
        const config = $editorConfigStore.editor;

        // Register the showFileFinder command
        monaco.editor.addCommand({
            id: 'editor.showFileFinder',
            run: () => dispatch('showFileFinder')
        });

        editor = monaco.editor.create(editorContainer, {
            theme: config.theme,
            fontSize: config.fontSize,
            tabSize: config.tabSize,
            wordWrap: config.wordWrap ? 'on' : 'off',
            lineNumbers: config.lineNumbers ? 'on' : 'off',
            minimap: {
                enabled: config.minimap
            },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 10,
            renderLineHighlight: 'all',
            scrollbar: {
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
            }
        });

        // Initialize vim mode if enabled in config
        vimEnabled = config.vim?.enabled || false;
        if (vimEnabled) {
            window.addEventListener('keydown', handleKeydown, true);
            vimMode = initVimMode(editor, vimStatusBar);
            
            // Define custom :w command for saving
            VimMode.Vim.defineEx('write', 'w', () => {
                console.log('Saving file...');
                fileStore.saveFile(fileStore.getActiveFilepath() || '');
            });

            // Setup Ctrl+P for file finder using action system
            VimMode.Vim.defineAction('showFileFinder', (_cm: any) => {
                dispatch('showFileFinder');
            });
            VimMode.Vim.mapCommand('<C-p>', 'action', 'showFileFinder', {}, { context: 'normal' });
        }

        // Set initial content if there's an active file
        if ($fileStore.activeFilePath) {
            const file = $fileStore.openFiles.get($fileStore.activeFilePath);
            if (file) updateEditor(file);
        }
    });

    onDestroy(() => {
        if (vimMode) {
            vimMode.dispose();
        }
        if (currentModel) {
            currentModel.dispose();
        }
        if (editor) {
            editor.dispose();
        }
        // Remove keyboard event listener
        window.removeEventListener('keydown', handleKeydown, true);
    });
</script>

<div class="flex flex-col h-full">
    <div
        bind:this={editorContainer}
        class="w-full flex-1"
    />
    <div 
        bind:this={vimStatusBar}
        class="h-6 bg-gray-800 border-t border-gray-700 px-2 flex items-center text-sm absolute bottom-0 right-0 left-0 z-10"
        class:hidden={!vimEnabled}
    />
</div>
