import { writable } from 'svelte/store';

// Store for bottom pane state
export const bottomPaneStore = writable({
    collapsed: false,
    height: 300,
    activeSection: 'terminal',
    isAllCollapsed: false
});
