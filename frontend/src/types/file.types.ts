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
