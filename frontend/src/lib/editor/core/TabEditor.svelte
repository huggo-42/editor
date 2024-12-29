<script lang="ts">
    import * as monaco from "monaco-editor";
    import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import { fileStore } from "@/stores/fileStore";
    import { editorConfigStore } from "@/stores/editorConfigStore";
    import { editorStateStore } from "@/stores/editorStateStore";
    import { initVimMode, VimMode } from "monaco-vim";
    import { focusStore } from "@/stores/focusStore";
    import Breadcrumbs from "@/lib/editor/Breadcrumbs.svelte";
    import DiffHeader from "@/lib/editor/git/changes/DiffHeader.svelte";
    import { addKeyboardContext } from "@/stores/keyboardStore";
    import { GetFileContent } from "@/lib/wailsjs/go/main/App";
    import type { service } from '@/lib/wailsjs/go/models';

    const dispatch = createEventDispatcher();

    export let filepath: string;
    export let active = false;

    let editor: monaco.editor.IStandaloneCodeEditor | monaco.editor.IStandaloneDiffEditor;
    let modifiedEditor: monaco.editor.IStandaloneCodeEditor;
    let editorContainer: HTMLElement;
    let vimMode: { dispose: () => void } | null = null;
    let vimStatusBar: HTMLElement;
    let vimEnabled = false;
    let editorId = focusStore.generateId("editor");
    let decorationCollection: monaco.editor.IEditorDecorationsCollection;

    // Get file content and language
    $: file = $fileStore.openFiles.get(filepath);
    $: content = file?.content ?? "";
    $: language = file?.language ?? "plaintext";
    $: isDiff = filepath?.startsWith("[diff]") ?? false;
    $: state = $editorStateStore[filepath];
    $: if (isDiff && file?.hunks) {
        updateDiffDecorations(file!.hunks!);
    }

    // Helper function to get editor content
    function getEditorContent(): string {
        if (!editor) return "";

        if (isDiff) {
            return (editor as monaco.editor.IStandaloneDiffEditor).getModifiedEditor().getValue();
        } else {
            return (editor as monaco.editor.IStandaloneCodeEditor).getValue();
        }
    }

    function parseDiff(diffContent: string): {
        original: string;
        modified: string;
    } {
        const lines = diffContent.split("\n");
        let original = "";
        let modified = "";
        let contentStarted = false;

        for (const line of lines) {
            // Skip the first two lines (--- and +++)
            if (line.startsWith("---") || line.startsWith("+++")) {
                continue;
            }

            // If we find an @@ line, mark content as started
            if (line.startsWith("@@")) {
                contentStarted = true;
                continue;
            }

            // If we haven't found an @@ line and we're past the headers,
            // treat everything as content
            if (
                !contentStarted &&
                !line.startsWith("---") &&
                !line.startsWith("+++")
            ) {
                contentStarted = true;
            }

            if (!contentStarted) {
                continue;
            }

            if (line.startsWith("-")) {
                original += line.slice(1) + "\n";
            } else if (line.startsWith("+")) {
                modified += line.slice(1) + "\n";
            } else {
                original += line + "\n";
                modified += line + "\n";
            }
        }

        return { original: original.trimEnd(), modified: modified.trimEnd() };
    }


    function updateDiffDecorations(hunks: service.Hunk[]) {
        if (!editor || !hunks) return;

        // Get the modified editor from diff editor
        if (isDiff) {
            modifiedEditor = (editor as monaco.editor.IStandaloneDiffEditor).getModifiedEditor();
        } else {
            modifiedEditor = editor as monaco.editor.IStandaloneCodeEditor;
        }

        // Create decoration collection if it doesn't exist
        if (!decorationCollection) {
            decorationCollection = modifiedEditor.createDecorationsCollection();
        }

        // Create new decorations for each hunk
        const newDecorations = [];
        for (const hunk of hunks) {
            // Line decorations for changes
            for (const change of hunk.changes) {
                if (change.type !== 'context') {
                    newDecorations.push({
                        range: new monaco.Range(change.lineNum, 1, change.lineNum, 1),
                        options: {
                            isWholeLine: true,
                            className: `diff-line diff-line-${change.type}`,
                            glyphMarginClassName: `glyph-${change.type}`,
                            glyphMarginHoverMessage: { value: change.type === 'add' ? 'Stage addition' : 'Stage deletion' }
                        }
                    });
                }
            }
        }

        // Set new decorations
        decorationCollection.set(newDecorations);

        // Add click handler for the glyph margin
        modifiedEditor.onMouseDown((e) => {
            if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
                const line = e.target.position.lineNumber;
                const decoration = newDecorations.find(d => d.range.startLineNumber === line);
                if (decoration) {
                    console.log('Clicked glyph margin at line:', line);
                    // TODO: Implement stage/unstage
                }
            }
        });
    }

    onMount(() => {
        if (!editorContainer) return;

        // Add keyboard context
        addKeyboardContext("editor");

        // Create editor with initial config
        const config = $editorConfigStore.editor;
        const baseOptions: monaco.editor.IStandaloneEditorConstructionOptions =
            {
                theme: config.theme,
                fontSize: config.fontSize,
                tabSize: config.tabSize,
                wordWrap: config.wordWrap ? "on" : "off",
                lineNumbers: config.lineNumbers
                    ? config.relativeLines
                        ? "relative"
                        : "on"
                    : "off",
                minimap: { enabled: config.minimap },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                glyphMargin: true, // Enable glyph margin
                folding: true,
                lineDecorationsWidth: 10,
                renderLineHighlight: "all",
                scrollbar: {
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10,
                },
                stickyScroll: {
                    enabled: config.stickyScroll,
                },
            };

        // Setup Monaco worker
        self.MonacoEnvironment = {
            getWorker: function (_moduleId: string, label: string) {
                return new EditorWorker();
            },
        };

        // Create editor
        if (isDiff) {
            editor = monaco.editor.createDiffEditor(editorContainer, {
                ...baseOptions,
                readOnly: true,
                originalEditable: false,
                renderSideBySide: false,
                ignoreTrimWhitespace: false,
                enableSplitViewResizing: false,
            });

            const { original, modified } = parseDiff(content);
            const originalModel = monaco.editor.createModel(original, language);
            const modifiedModel = monaco.editor.createModel(modified, language);

            (editor as monaco.editor.IStandaloneDiffEditor).setModel({
                original: originalModel,
                modified: modifiedModel,
            });

            // Get the modified editor and create decoration collection
            modifiedEditor = (editor as monaco.editor.IStandaloneDiffEditor).getModifiedEditor();
            decorationCollection = modifiedEditor.createDecorationsCollection();

            // Apply initial decorations if hunks exist
            if (file?.hunks) {
                updateDiffDecorations(file.hunks);
            }

            return () => {
                originalModel.dispose();
                modifiedModel.dispose();
                if (decorationCollection) {
                    decorationCollection.clear();
                }
            };
        } else {
            editor = monaco.editor.create(editorContainer, {
                ...baseOptions,
                value: content,
                language,
            });

            const currentFile = monaco.editor.createModel(content, language);
            editor.setModel(currentFile); // Set the model to the editor

            // Watch for content changes
            const disposable = editor.onDidChangeModelContent(() => {
                const value = getEditorContent();
                if (value !== content) {
                    fileStore.updateFileContent(filepath, value);
                }
            });

            // Save file on Ctrl+S
            editor.addCommand(
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                async () => {
                    try {
                        await fileStore.saveFile(filepath);
                    } catch (error) {
                        console.error("Error saving file:", error);
                    }
                },
            );

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
            wordWrap: config.wordWrap ? "on" : "off",
            lineNumbers: config.lineNumbers
                ? config.relativeLines
                    ? "relative"
                    : "on"
                : "off",
            minimap: {
                enabled: config.minimap,
            },
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
                modified: modifiedModel,
            });
        } else {
            (editor as monaco.editor.IStandaloneCodeEditor).setValue(content);
        }
    }

    // Watch for vim status bar mount and config changes
    $: if (editor && vimStatusBar && $editorConfigStore.editor.vim?.enabled && !vimMode && !isDiff) {
        vimMode = initVimMode(editor, vimStatusBar);
        vimEnabled = true;
    } else if ((editor && !$editorConfigStore.editor.vim?.enabled && vimMode) || (vimMode && isDiff)) {
        vimMode.dispose();
        vimMode = null;
        vimEnabled = false;
    }

    // Handle active state
    $: if (editor && active) {
        editor.focus();
        focusStore.focus("editor", editorId);
    }

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
        .diff-line {
            position: relative;
        }
        
        .diff-line-add {
            background-color: rgba(40, 167, 69, 0.1);
        }
        
        .diff-line-delete {
            background-color: rgba(220, 53, 69, 0.1);
        }

        .glyph-add {
            background-color: #28a745;
            border-radius: 50%;
            margin-left: 5px;
            cursor: pointer;
        }
        
        .glyph-delete {
            background-color: #dc3545;
            border-radius: 50%;
            margin-left: 5px;
            cursor: pointer;
        }

        .glyph-add:hover, .glyph-delete:hover {
            opacity: 0.8;
        }
    `;
    document.head.appendChild(styles);
</script>

<div class="h-full relative flex flex-grow flex-col" class:hidden={!active}>
    {#if filepath}
        {#if filepath.startsWith("[diff]")}
            <DiffHeader {filepath} />
        {:else}
            <Breadcrumbs {filepath} />
        {/if}
    {/if}
    
    <div class="flex-1 relative">
        <div
            bind:this={editorContainer}
            class="w-full h-full"
        />
    </div>

    {#if $editorConfigStore.editor.vim?.enabled}
        <div 
            bind:this={vimStatusBar}
            class="vim-status-bar bg-gray-700 absolute bottom-0 left-0 text-gray-300 px-2 py-0.5 text-sm z-50"
        />
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
