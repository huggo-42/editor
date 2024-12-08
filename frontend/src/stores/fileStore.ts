import { writable, get } from 'svelte/store';
import type { service } from '@/lib/wailsjs/go/models';
import { GetProjectFiles, GetFileContent, SaveFile } from '@/lib/wailsjs/go/main/App';

type FileNode = service.FileNode;

interface OpenFile {
    path: string;
    content: string;
    isDirty: boolean;
    language: string;
    cursor: { line: number; column: number };
}

interface FileState {
    fileTree: FileNode[] | null;
    activeFilePath: string | null;
    currentProjectPath: string | null;
    openFiles: Map<string, OpenFile>;
    loading: boolean;
    error: string | null;
}

// Load initial state from localStorage
const savedState = localStorage.getItem('fileState');
const initialState: FileState = savedState ? {
    ...JSON.parse(savedState),
    // Convert the openFiles object back to a Map
    openFiles: new Map(Object.entries(JSON.parse(savedState).openFiles || {}))
} : {
    fileTree: null,
    activeFilePath: null,
    currentProjectPath: null,
    openFiles: new Map(),
    loading: false,
    error: null,
};

function createFileStore() {
    const { subscribe, set, update } = writable<FileState>(initialState);

    // Save state changes to localStorage
    subscribe(state => {
        // Convert Map to object for JSON serialization
        const serializedState = {
            ...state,
            openFiles: Object.fromEntries(state.openFiles)
        };
        localStorage.setItem('fileState', JSON.stringify(serializedState));
    });

    return {
        subscribe,
        
        // Clear all state and localStorage
        clearState() {
            localStorage.removeItem('fileState');
            set({
                fileTree: null,
                activeFilePath: null,
                currentProjectPath: null,
                openFiles: new Map(),
                loading: false,
                error: null,
            });
        },

        // Set current project
        setCurrentProject(projectPath: string) {
            // Clear existing state when opening a new project
            if (projectPath !== get({ subscribe }).currentProjectPath) {
                this.clearState();
            }
            update(state => ({ ...state, currentProjectPath: projectPath }));
            return this.loadProjectFiles();
        },

        // Load project files
        async loadProjectFiles(path?: string) {
            const state = get({ subscribe });
            if (!path && !state.currentProjectPath) return;

            path = path || (state.currentProjectPath ?? undefined);
            update(state => ({ ...state, loading: true, error: null }));

            try {
                const rootNode = await GetProjectFiles(path!);
                update(state => ({ 
                    ...state, 
                    fileTree: rootNode.children || [],
                    loading: false
                }));
            } catch (err) {
                update(state => ({
                    ...state,
                    error: err instanceof Error ? err.message : 'Failed to load project files',
                    loading: false
                }));
            }
        },

        // Open a file
        async openFile(path: string) {
            const state = get({ subscribe });
            if (state.openFiles.has(path)) {
                update(state => ({ ...state, activeFilePath: path }));
                return;
            }

            try {
                const content = await GetFileContent(path);
                update(state => {
                    const newOpenFiles = new Map(state.openFiles);
                    const openFile: OpenFile = {
                        path,
                        content,
                        isDirty: false,
                        language: path.split('.').pop() || 'text',
                        cursor: { line: 0, column: 0 }
                    };
                    newOpenFiles.set(path, openFile);
                    return {
                        ...state,
                        openFiles: newOpenFiles,
                        activeFilePath: path
                    };
                });
            } catch (err) {
                update(state => ({
                    ...state,
                    error: err instanceof Error ? err.message : 'Failed to open file'
                }));
            }
        },

        // Close a file
        closeFile(path: string) {
            update(state => {
                const newOpenFiles = new Map(state.openFiles);
                newOpenFiles.delete(path);
                
                const activeFilePath = state.activeFilePath === path
                    ? Array.from(newOpenFiles.keys())[0] || null
                    : state.activeFilePath;
                
                return { ...state, openFiles: newOpenFiles, activeFilePath };
            });
        },

        // Refresh files
        async refreshFiles() {
            return this.loadProjectFiles();
        },

        // Set active file
        setActiveFile(path: string | null) {
            update(state => ({ ...state, activeFilePath: path }));
        },

        // Get currently open file
        getActiveFilepath() {
            return get({ subscribe }).activeFilePath;
        },

        // Mark file as dirty
        markAsDirty(path: string) {
            update(state => {
                const file = state.openFiles.get(path);
                if (!file || file.isDirty) return state; // Skip if already dirty

                const newOpenFiles = new Map(state.openFiles);
                newOpenFiles.set(path, { ...file, isDirty: true });
                return { ...state, openFiles: newOpenFiles };
            });
        },

        // Update file content
        updateFileContent(path: string, content: string, isDirty = true) {
            update(state => {
                const file = state.openFiles.get(path);
                if (!file) return state;

                const newOpenFiles = new Map(state.openFiles);
                newOpenFiles.set(path, { ...file, content, isDirty });
                return { ...state, openFiles: newOpenFiles };
            });
        },

        // Save file content
        async saveFile(path: string) {
            const state = get({ subscribe });
            const file = state.openFiles.get(path);
            if (!file) return;
            
            try {
                const content = file.content;
                await SaveFile(path, content);
                
                // Update the store to mark file as not dirty
                update(state => {
                    const file = state.openFiles.get(path);
                    if (file) {
                        const newOpenFiles = new Map(state.openFiles);
                        newOpenFiles.set(path, { 
                            ...file, 
                            isDirty: false 
                        });
                        return { ...state, openFiles: newOpenFiles };
                    }
                    return state;
                });
            } catch (err) {
                update(state => ({
                    ...state,
                    error: err instanceof Error ? err.message : 'Failed to save file'
                }));
            }
        },

        // Reset store
        reset() {
            localStorage.removeItem('fileState');
            set(initialState);
        }
    };
}

export const fileStore = createFileStore();
