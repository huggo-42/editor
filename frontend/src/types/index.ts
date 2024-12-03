export interface Tab {
    id: number;
    name: string;
    active: boolean;
    content?: string;
    isDirty?: boolean;
    language?: string;
}

export interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    path: string;
    children?: FileNode[];
    isRenaming?: boolean;
    expanded?: boolean;
    metadata?: {
        size?: number;
        modified?: Date;
        type?: string;
    };
}

export interface ContextMenuItem {
    label: string;
    icon?: any; 
    action: () => void;
    shortcut?: string;
    divider?: boolean;
    disabled?: boolean;
}

export interface EditorState {
    currentFile?: string;
    content?: string;
    isDirty?: boolean;
    language?: string;
    cursor?: {
        line: number;
        column: number;
    };
    selections?: Array<{
        start: { line: number; column: number };
        end: { line: number; column: number };
    }>;
}

export interface Position {
    x: number;
    y: number;
}

export interface GitStatusItem {
    status: 'modified' | 'new' | 'deleted' | 'renamed';
    file: string;
    oldFile?: string;
}

export type FileAction = 
    | { type: 'CREATE_FILE'; path: string; }
    | { type: 'CREATE_FOLDER'; path: string; }
    | { type: 'RENAME'; oldPath: string; newPath: string; }
    | { type: 'DELETE'; path: string; }
    | { type: 'MOVE'; sourcePath: string; targetPath: string; };

export interface FileOperation {
    type: 'success' | 'error';
    message: string;
    action: FileAction;
    timestamp: number;
}

export interface SidebarState {
    collapsed: boolean;
    activeSection?: 'files' | 'git' | 'extensions';
    fileTree: FileNode[];
    gitStatus?: GitStatusItem[];
    isAllCollapsed?: boolean;
}
