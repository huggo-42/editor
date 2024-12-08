import { writable } from 'svelte/store';

interface EditorSession {
    // Add any non-vim related session state here if needed
}

const defaultSession: EditorSession = {
    // Add default values for any session state
};

function createEditorSessionStore() {
    const { subscribe, update, set } = writable<EditorSession>(defaultSession);

    return {
        subscribe,
        reset: () => set(defaultSession)
    };
}

export const editorSessionStore = createEditorSessionStore();
