import { writable, derived } from 'svelte/store';
import type { KeyBinding, KeyBindingConfig } from '../types/keyboard';

// Default keybindings configuration
const defaultKeybindings: KeyBindingConfig = {
    'command.showCommandPalette': {
        defaultBinding: {
            key: 'p',
            modifiers: ['ctrl', 'shift'],
            description: 'Show Command Palette',
            category: 'General'
        },
        action: () => {} // Will be set when registering commands
    },
    'file.showFileFinder': {
        defaultBinding: {
            key: 'p',
            modifiers: ['ctrl'],
            description: 'Show File Finder',
            category: 'File'
        },
        action: () => {}
    },
    'modal.close': {
        defaultBinding: {
            key: 'Escape',
            description: 'Close Modal',
            category: 'General'
        },
        action: () => {}
    },
    'vim.enableMode': {
        defaultBinding: {
            key: 'j',
            modifiers: ['alt'],
            description: 'Enable Vim Mode',
            category: 'Navigation'
        },
        action: () => {}
    }
};

// Store for custom keybindings
const customKeybindings = writable<Record<string, Partial<KeyBinding>>>({});

// Derived store that combines default and custom keybindings
export const keyBindings = derived(
    [customKeybindings],
    ([$customKeybindings]) => {
        const bindings: Record<string, KeyBinding> = {};
        
        for (const [command, config] of Object.entries(defaultKeybindings)) {
            bindings[command] = {
                ...config.defaultBinding,
                action: config.action,
                ...($customKeybindings[command] || {})
            };
        }
        
        return bindings;
    }
);

// Function to register a command's action
export function registerCommand(command: string, action: () => void) {
    if (defaultKeybindings[command]) {
        defaultKeybindings[command].action = action;
        // Trigger store update
        customKeybindings.update(k => ({ ...k }));
    }
}

// Function to update custom keybinding
export function updateKeybinding(command: string, binding: Partial<KeyBinding>) {
    customKeybindings.update(bindings => ({
        ...bindings,
        [command]: binding
    }));
}

// Helper function to format keybinding for display
export function formatKeybinding(binding: KeyBinding): string {
    const modifiers = binding.modifiers || [];
    const parts = [
        ...modifiers.map(mod => mod.charAt(0).toUpperCase() + mod.slice(1)),
        binding.key.toUpperCase()
    ];
    return parts.join('+');
}

// Function to check if a keyboard event matches a keybinding
export function matchesKeybinding(event: KeyboardEvent, binding: KeyBinding): boolean {
    const modifiers = binding.modifiers || [];
    
    const modifierMatch = 
        modifiers.includes('ctrl') === event.ctrlKey &&
        modifiers.includes('alt') === event.altKey &&
        modifiers.includes('shift') === event.shiftKey &&
        modifiers.includes('meta') === event.metaKey;
        
    return modifierMatch && event.key.toLowerCase() === binding.key.toLowerCase();
}

// Function to handle global keyboard events
export function handleKeyboardEvent(event: KeyboardEvent) {
    const currentBindings = keyBindings.get();
    
    for (const binding of Object.values(currentBindings)) {
        if (matchesKeybinding(event, binding)) {
            event.preventDefault();
            binding.action();
            return;
        }
    }
}
