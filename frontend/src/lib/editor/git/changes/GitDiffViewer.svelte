<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { gitStore } from "@/stores/gitStore";
    import * as monaco from "monaco-editor";

    let container: HTMLElement;
    let editor: monaco.editor.IStandaloneDiffEditor | null = null;

    $: if (editor && $gitStore.fileDiff) {
        const diff = $gitStore.fileDiff;
        if (diff.isBinary) {
            // Show binary file message
            editor.setModel({
                original: monaco.editor.createModel("Binary file not shown", "text"),
                modified: monaco.editor.createModel("Binary file not shown", "text")
            });
        } else {
            // Parse the unified diff to get original and modified content
            const [original, modified] = parseDiff(diff.content);
            editor.setModel({
                original: monaco.editor.createModel(original, getLanguage(diff.path)),
                modified: monaco.editor.createModel(modified, getLanguage(diff.path))
            });
        }
    }

    function getLanguage(path: string): string {
        const ext = path.split('.').pop()?.toLowerCase() || '';
        // Add more mappings as needed
        const langMap: { [key: string]: string } = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'go': 'go',
            'rs': 'rust',
            'svelte': 'html',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'md': 'markdown'
        };
        return langMap[ext] || 'text';
    }

    function parseDiff(diffContent: string): [string, string] {
        const lines = diffContent.split('\n');
        let original = '';
        let modified = '';
        
        // Skip the first two lines (diff header)
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('-')) {
                original += line.substring(1) + '\n';
            } else if (line.startsWith('+')) {
                modified += line.substring(1) + '\n';
            } else if (!line.startsWith('@@')) {
                original += line + '\n';
                modified += line + '\n';
            }
        }

        return [original, modified];
    }

    onMount(() => {
        editor = monaco.editor.createDiffEditor(container, {
            theme: 'vs-dark',
            automaticLayout: true,
            renderSideBySide: true,
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            contextmenu: false
        });
    });

    onDestroy(() => {
        if (editor) {
            editor.dispose();
        }
    });
</script>

<div class="h-full w-full" bind:this={container}></div>

<style>
    div {
        min-height: 0;
    }
</style>
