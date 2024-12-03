import { writable, derived } from 'svelte/store';
import type { KeyBinding, KeyBindingConfig, KeyboardContext } from '../types/keyboard';

// Default keybindings configuration
const defaultKeybindings: KeyBindingConfig = {
    // Global shortcuts
    'command.showCommandPalette': {
        defaultBinding: {
            key: 'p',
            modifiers: ['ctrl', 'shift'],
            description: 'Show Command Palette',
            category: 'General',
            context: ['global']
        },
        action: () => {}
    },
    'file.showFileFinder': {
        defaultBinding: {
            key: 'p',
            modifiers: ['ctrl'],
            description: 'Show File Finder',
            category: 'File',
            context: ['global']
        },
        action: () => {}
    },
    'modal.close': {
        defaultBinding: {
            key: 'Escape',
            description: 'Close Modal',
            category: 'General',
            context: ['commandPalette', 'fileFinder', 'aiAssistant']
        },
        action: () => {}
    },

    // Navigation mode shortcuts
    'vim.enableMode': {
        defaultBinding: {
            key: 'j',
            modifiers: ['alt'],
            description: 'Enable Vim Mode',
            category: 'Navigation',
            context: ['commandPalette', 'fileFinder']
        },
        action: () => {}
    },

    // Navigation shortcuts
    'navigation.goToEditor': {
        defaultBinding: {
            key: 'e',
            modifiers: ['ctrl', 'shift'],
            description: 'Go to Editor',
            category: 'Navigation',
            context: ['global']
        },
        action: () => {}
    },
    'navigation.goToSettings': {
        defaultBinding: {
            key: ',',
            modifiers: ['ctrl'],
            description: 'Open Settings',
            category: 'Navigation',
            context: ['global']
        },
        action: () => {}
    },
    'view.toggleLeftSidebar': {
        defaultBinding: {
            key: 'b',
            modifiers: ['ctrl'],
            description: 'Toggle Left Sidebar',
            category: 'View',
            context: ['global']
        },
        action: () => {}
    },
    'view.toggleRightSidebar': {
        defaultBinding: {
            key: 'b',
            modifiers: ['ctrl', 'shift'],
            description: 'Toggle Right Sidebar',
            category: 'View',
            context: ['global']
        },
        action: () => {}
    },

    // AI Assistant shortcuts
    'ai.sendMessage': {
        defaultBinding: {
            key: 'Enter',
            modifiers: ['ctrl'],
            description: 'Send Message',
            category: 'AI Assistant',
            context: ['aiAssistant']
        },
        action: () => {}
    },
    'ai.newConversation': {
        defaultBinding: {
            key: 'n',
            modifiers: ['ctrl'],
            description: 'New Conversation',
            category: 'AI Assistant',
            context: ['aiAssistant']
        },
        action: () => {}
    },

    // Git shortcuts
    'git.commit': {
        defaultBinding: {
            key: 'Enter',
            modifiers: ['ctrl'],
            description: 'Commit Changes',
            category: 'Git',
            context: ['git']
        },
        action: () => {}
    },
    'git.push': {
        defaultBinding: {
            key: 'p',
            modifiers: ['ctrl', 'alt'],
            description: 'Push Changes',
            category: 'Git',
            context: ['git']
        },
        action: () => {}
    },
    'git.pull': {
        defaultBinding: {
            key: 'l',
            modifiers: ['ctrl', 'alt'],
            description: 'Pull Changes',
            category: 'Git',
            context: ['git']
        },
        action: () => {}
    },
    'git.stash': {
        defaultBinding: {
            key: 's',
            modifiers: ['ctrl', 'alt'],
            description: 'Stash Changes',
            category: 'Git',
            context: ['git']
        },
        action: () => {}
    },

    // File Manager shortcuts
    'file.createFile': {
        defaultBinding: {
            key: 'n',
            modifiers: ['ctrl'],
            description: 'New File',
            category: 'File Manager',
            context: ['fileManager']
        },
        action: () => {}
    },
    'file.createFolder': {
        defaultBinding: {
            key: 'n',
            modifiers: ['ctrl', 'shift'],
            description: 'New Folder',
            category: 'File Manager',
            context: ['fileManager']
        },
        action: () => {}
    },
    'file.delete': {
        defaultBinding: {
            key: 'Delete',
            description: 'Delete Selected',
            category: 'File Manager',
            context: ['fileManager']
        },
        action: () => {}
    },
    'file.rename': {
        defaultBinding: {
            key: 'F2',
            description: 'Rename',
            category: 'File Manager',
            context: ['fileManager']
        },
        action: () => {}
    },
    'file.copy': {
        defaultBinding: {
            key: 'c',
            modifiers: ['ctrl'],
            description: 'Copy',
            category: 'File Manager',
            context: ['fileManager']
        },
        action: () => {}
    },
    'file.paste': {
        defaultBinding: {
            key: 'v',
            modifiers: ['ctrl'],
            description: 'Paste',
            category: 'File Manager',
            context: ['fileManager']
        },
        action: () => {}
    }
};

// Store for custom keybindings
const customKeybindings = writable<Record<string, Partial<KeyBinding>>>({});

// Store for current keyboard context
export const currentContext = writable<KeyboardContext>('global');

// Derived store that combines default and custom keybindings
export const keyBindings = derived(
    [customKeybindings, currentContext],
    ([$customKeybindings, $currentContext]) => {
        const bindings: Record<string, KeyBinding> = {};
        
        for (const [command, config] of Object.entries(defaultKeybindings)) {
            bindings[command] = {
                ...config.defaultBinding,
                action: config.action,
                ...($customKeybindings[command] || {})
            };
        }
        
        return Object.fromEntries(
            Object.entries(bindings).filter(([_, binding]) => binding.context.includes($currentContext))
        );
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

// Function to set the current keyboard context
export function setKeyboardContext(context: KeyboardContext) {
    currentContext.set(context);
}
