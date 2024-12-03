export interface Position {
    x: number;
    y: number;
}

export interface ContextMenuItem {
    label: string;
    icon?: any; 
    action: () => void;
    shortcut?: string;
    divider?: boolean;
    disabled?: boolean;
}

export interface SidebarState {
    collapsed: boolean;
    activeSection?: 'files' | 'git' | 'extensions';
    fileTree: import('./file.types').FileNode[];
    gitStatus?: import('./git.types').GitStatusItem[];
    isAllCollapsed?: boolean;
}
