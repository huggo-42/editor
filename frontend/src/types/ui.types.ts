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

import type { FileNode } from "./file.types";

export interface SidebarState {
    collapsed: boolean;
    activeSection: 'files' | 'git';
    fileTree: FileNode[];
    isAllCollapsed: boolean;
}
