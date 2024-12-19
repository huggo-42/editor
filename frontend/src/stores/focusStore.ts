import { writable, get } from 'svelte/store';

export type FocusContext = {
    id: string;
    component: string;
    timestamp: number;
    metadata?: Record<string, any>;
};

type FocusState = {
    activeContext: FocusContext | null;
    previousContext: FocusContext | null;
    focusStack: FocusContext[];
};

function createFocusStore() {
    const { subscribe, set, update } = writable<FocusState>({
        activeContext: null,
        previousContext: null,
        focusStack: [],
    });

    return {
        subscribe,
        
        // Generate a unique component ID
        generateId: (component: string): string => {
            return `${component}-${Math.random().toString(36).substring(2, 11)}`;
        },

        // Set focus to a new context
        focus: (component: string, id: string, metadata?: Record<string, any>) => {
            update(state => {
                const newContext: FocusContext = {
                    id,
                    component,
                    timestamp: Date.now(),
                    metadata
                };

                return {
                    activeContext: newContext,
                    previousContext: state.activeContext,
                    focusStack: [newContext, ...state.focusStack]
                };
            });
        },

        // Restore focus to the previous context
        restorePrevious: () => {
            update(state => {
                if (!state.previousContext) return state;

                return {
                    activeContext: state.previousContext,
                    previousContext: null,
                    focusStack: state.focusStack.filter(ctx => ctx.id !== state.previousContext?.id)
                };
            });
        },

        // Clear focus state
        clear: () => {
            set({
                activeContext: null,
                previousContext: null,
                focusStack: []
            });
        },

        // Check if a component has focus
        hasFocus: (component: string, id: string): boolean => {
            const state = get(focusStore);
            return state.activeContext?.component === component && state.activeContext?.id === id;
        }
    };
}

export const focusStore = createFocusStore();
