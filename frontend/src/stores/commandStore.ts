import { writable, derived } from 'svelte/store';
import { keyBindings, formatKeybinding } from './keyboardStore';

export interface Command {
    id: string;
    label: string;
    category?: string;
    context?: string[];
    shortcut?: string;
    action: () => void;
}

// Create a derived store that combines keyboard shortcuts with commands
export const commandStore = derived(
    keyBindings,
    ($keyBindings) => {
        const commands: Command[] = [];

        // Convert keyboard bindings to commands
        for (const [id, binding] of Object.entries($keyBindings)) {
            commands.push({
                id,
                label: binding.description,
                category: binding.category,
                shortcut: formatKeybinding(binding),
                action: binding.action
            });
        }

        return commands;
    }
);
