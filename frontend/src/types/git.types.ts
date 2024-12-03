export interface GitStatusItem {
    status: 'modified' | 'new' | 'deleted' | 'renamed';
    file: string;
    oldFile?: string;
    staged: boolean;
}
