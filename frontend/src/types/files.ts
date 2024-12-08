export interface FileNode {
    id: string;
    name: string;
    path: string;
    type: 'file' | 'folder';
    expanded?: boolean;
    isRenaming?: boolean;
    children?: FileNode[];
    metadata?: {
        size?: number;
        modified?: Date;
        type?: string;
    };
}

export interface OpenFile {
    path: string;
    content: string;
    isDirty: boolean;
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

export interface Tab extends OpenFile {
    id: number;
    name: string;
    active: boolean;
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

export interface FileState {
    fileTree: FileNode | null;
    activeFilePath: string | null;
    openFiles: Map<string, OpenFile>;
    loading: boolean;
    error: string | null;
}

export interface SidebarState {
    collapsed: boolean;
    activeSection: 'files' | 'git';
    fileTree: FileNode[];
    isAllCollapsed: boolean;
}