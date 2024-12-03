import { writable } from 'svelte/store';
import { push } from 'svelte-spa-router';

export interface Command {
    id: string;
    label: string;
    shortcut?: string[];
    category?: string;
    action: () => void;
}

function createCommandStore() {
    const { subscribe, update } = writable<Command[]>([
        {
            id: 'go-to-editor',
            label: 'Go to Editor',
            category: 'Navigation',
            shortcut: ['Ctrl', 'Shift', 'E'],
            action: () => push('/editor')
        },
        {
            id: 'go-to-settings',
            label: 'Open Settings',
            category: 'Navigation',
            shortcut: ['Ctrl', ','],
            action: () => push('/configs')
        },
        {
            id: 'toggle-sidebar',
            label: 'Toggle Sidebar',
            category: 'View',
            shortcut: ['Ctrl', 'B'],
            action: () => {
                // We'll implement this later when we add sidebar toggle functionality
                console.log('Toggle sidebar');
            }
        }
    ]);

    return {
        subscribe,
        addCommand: (command: Command) => {
            update(commands => [...commands, command]);
        },
        removeCommand: (id: string) => {
            update(commands => commands.filter(cmd => cmd.id !== id));
        }
    };
}

export const commandStore = createCommandStore();
