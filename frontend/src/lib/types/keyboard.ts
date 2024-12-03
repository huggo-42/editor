export type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta';
export type KeyBinding = {
    key: string;
    modifiers?: ModifierKey[];
    description: string;
    category?: string;
    action: () => void;
};

export type KeyBindingConfig = {
    [command: string]: {
        defaultBinding: Omit<KeyBinding, 'action'>;
        action: () => void;
    };
};
