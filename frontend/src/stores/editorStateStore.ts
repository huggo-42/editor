import { writable, get } from 'svelte/store';
import type * as monaco from 'monaco-editor';

export type EditorState = {
    cursorPosition: monaco.Position;
    selection: monaco.Selection | null;
    scrollTop: number;
    scrollLeft: number;
    viewState: monaco.editor.ICodeEditorViewState | null;
};

type EditorStates = {
    [filePath: string]: EditorState;
};

function createEditorStateStore() {
    const { subscribe, set, update } = writable<EditorStates>({});

    return {
        subscribe,

        // Save the editor state for a file
        saveState: (filePath: string, editor: monaco.editor.IStandaloneCodeEditor) => {
            try {
                const viewState = editor.saveViewState();
                const position = editor.getPosition();
                const selection = editor.getSelection();
                const scrollTop = editor.getScrollTop();
                const scrollLeft = editor.getScrollLeft();

                if (!position) return;

                update(states => ({
                    ...states,
                    [filePath]: {
                        cursorPosition: position,
                        selection: selection,
                        scrollTop,
                        scrollLeft,
                        viewState
                    }
                }));
            } catch (error) {
                console.error('Error saving editor state:', error);
            }
        },

        // Restore the editor state for a file
        restoreState: (filePath: string, editor: monaco.editor.IStandaloneCodeEditor) => {
            try {
                const states = get(editorStateStore);
                const state = states[filePath];

                if (!state) {
                    return;
                }

                // First restore the view state
                if (state.viewState) {
                    editor.restoreViewState(state.viewState);
                }

                // Then set position and selection
                if (state.selection) {
                    editor.setSelection(state.selection);
                }
                editor.setPosition(state.cursorPosition);

                // Finally set scroll position
                editor.setScrollTop(state.scrollTop);
                editor.setScrollLeft(state.scrollLeft);

                // Force the editor to focus
                editor.focus();
            } catch (error) {
                console.error('Error restoring editor state:', error);
            }
        },

        // Remove state for a closed tab
        removeTab: (filePath: string) => {
            update(states => {
                const newStates = { ...states };
                delete newStates[filePath];
                return newStates;
            });
        },

        // Debug: get current states
        debug: () => {
            const states = get(editorStateStore);
            return states;
        }
    };
}

export const editorStateStore = createEditorStateStore();
