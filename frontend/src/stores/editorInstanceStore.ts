import { writable } from 'svelte/store';
import type TabEditor from '@/lib/editor/core/TabEditor.svelte';

function createEditorStore() {
    const { subscribe, update, set } = writable(new Map<string, TabEditor>());

    return {
        subscribe,
        setEditor: (id: string, editor: TabEditor) => update(editors => {
            editors.set(id, editor);
            return editors;
        }),
        removeEditor: (id: string) => update(editors => {
            editors.delete(id);
            return editors;
        }),
        getEditor: (id: string) => {
            let editor: TabEditor | undefined;
            update(editors => {
                editor = editors.get(id);
                return editors;
            });
            return editor;
        }
    };
}

export const editorInstanceStore = createEditorStore();
