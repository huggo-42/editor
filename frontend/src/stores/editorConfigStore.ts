import { writable } from 'svelte/store';
import type { service } from '@/lib/wailsjs/go/models';
import { GetEditorConfig } from '@/lib/wailsjs/go/main/App';

type EditorConfig = service.EditorConfig;

const defaultConfig: EditorConfig = {
    editor: {
        theme: 'vs-dark',
        fontSize: 14,
        tabSize: 4,
        wordWrap: true,
        lineNumbers: true,
        minimap: false,
        vim: {
            enabled: false,
            mode: 'normal'
        }
    },
    keyboard: {
        customBindings: {}
    }
};

function createEditorConfigStore() {
    const { subscribe, set } = writable<EditorConfig>(defaultConfig);

    return {
        subscribe,
        
        // Load config from backend
        loadConfig: async () => {
            try {
                const config = await GetEditorConfig();
                set(config || defaultConfig);
            } catch (error) {
                console.error('Error loading editor config:', error);
                set(defaultConfig);
            }
        }
    };
}

export const editorConfigStore = createEditorConfigStore();
