import { writable } from 'svelte/store';

export interface FileItem {
    path: string;
    name: string;
    type: 'file' | 'directory';
}

function createFileStore() {
    const { subscribe, set, update } = writable<FileItem[]>([]);

    return {
        subscribe,
        setFiles: (files: FileItem[]) => set(files),
        addFile: (file: FileItem) => update(files => [...files, file]),
        clear: () => set([])
    };
}

export const fileStore = createFileStore();
