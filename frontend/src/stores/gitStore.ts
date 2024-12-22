import { writable, get } from 'svelte/store';
import { 
    IsGitRepository, 
    InitGitRepository, 
    GetGitStatus, 
    StageFile, 
    UnstageFile, 
    DiscardChanges, 
    Commit, 
    ListBranches, 
    GetCurrentBranch,
    ListCommits,
    ListCommitsAfter,
    ListCommitsByBranch,
    ListCommitsByAuthor,
    SearchCommits,
    GetHeadCommit,
    GetFileDiff
} from '@/lib/wailsjs/go/main/App';
import { fileStore } from '@/stores/fileStore';
import type { service } from '@/lib/wailsjs/go/models';

interface GitState {
    gitStatus: service.FileStatus[];
    stagedExpanded: boolean;
    changesExpanded: boolean;
    isRepository: boolean;
    isLoading: boolean;
    isQuickRefreshing: boolean;
    loadingFiles: Set<string>;
    error: string | null;
    branches: service.BranchInfo[];
    currentBranch: string | null;
    commits: service.CommitInfo[];
    commitsLoading: boolean;
    commitsError: string | null;
    HEAD: service.CommitInfo | null;
    initialized: boolean;
    // Diff view state
    selectedFile: string | null;
    selectedFileStaged: boolean;
    fileDiff: service.FileDiff | null;
    isDiffLoading: boolean;
    diffError: string | null;
}

function createGitStore() {
    const { subscribe, set, update } = writable<GitState>({
        gitStatus: [],
        stagedExpanded: true,
        changesExpanded: true,
        isRepository: false,
        isLoading: true,
        isQuickRefreshing: false,
        loadingFiles: new Set(),
        error: null,
        branches: [],
        currentBranch: null,
        commits: [],
        commitsLoading: false,
        commitsError: null,
        HEAD: null,
        initialized: false,
        
        // Diff view initial state
        selectedFile: null,
        selectedFileStaged: false,
        fileDiff: null,
        isDiffLoading: false,
        diffError: null
    });

    return {
        subscribe,

        async checkRepository() {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                const state = get(this);
                
                // If already initialized and is a repository, just return
                if (state.initialized && state.isRepository) {
                    return;
                }

                update(state => ({ ...state, isLoading: true, error: null }));
                const isRepo = await IsGitRepository(projectPath);
                update(state => ({ ...state, isRepository: isRepo }));

                // If it's a repository, get the initial status and branches
                if (isRepo) {
                    await Promise.all([
                        this.refreshStatus(),
                        this.refreshBranches(),
                        this.loadInitialCommits()
                    ]);
                }
                
                update(state => ({ ...state, isLoading: false, initialized: true }));
            } catch (error) {
                update(state => ({
                    ...state,
                    isLoading: false,
                    error: `Failed to check repository status: ${error}`,
                    initialized: false
                }));
            }
        },

        async loadInitialCommits() {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                update(state => ({ ...state, commitsLoading: true, commitsError: null }));

                // Load only first 20 commits initially
                const commits = await ListCommits(projectPath, {
                    limit: 20,
                    offset: 0
                });

                update(state => ({
                    ...state,
                    commits,
                    commitsLoading: false
                }));
            } catch (error) {
                update(state => ({
                    ...state,
                    commitsLoading: false,
                    commitsError: `Failed to load commits: ${error}`
                }));
            }
        },

        async quickRefresh() {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                update(state => ({ ...state, isQuickRefreshing: true }));

                const oldHEAD = get(this).HEAD;

                // Run all refreshes in parallel
                await Promise.all([
                    this.getHeadCommit(),
                    this.refreshStatus(true)
                ]);

                // Check if HEAD changed
                const currentState = get(this);
                if (oldHEAD?.hash !== currentState.HEAD?.hash) {
                    await this.loadInitialCommits();
                }

                update(state => ({ ...state, isQuickRefreshing: false }));
            } catch (error) {
                update(state => ({ 
                    ...state, 
                    isQuickRefreshing: false,
                    error: `Failed to refresh: ${error}` 
                }));
            }
        },

        async refreshStatus(isQuickRefresh = false) {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                // Don't clear the list immediately, just set loading state
                if (isQuickRefresh) {
                    update(state => ({ ...state, isQuickRefreshing: true, error: null }));
                } else {
                    update(state => ({ ...state, isLoading: true, error: null }));
                }

                const status = await GetGitStatus(projectPath);

                // Only update once we have the new data
                update(state => ({
                    ...state,
                    gitStatus: status,
                    isLoading: false,
                    error: null
                }));
            } catch (error) {
                update(state => ({
                    ...state,
                    isLoading: false,
                    error: `Failed to get repository status: ${error}`
                }));
            }
        },

        async initRepository() {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                update(state => ({ ...state, isLoading: true, error: null }));
                await InitGitRepository(projectPath);
                update(state => ({ ...state, isRepository: true, isLoading: false }));

                // Get initial status after initialization
                await this.refreshStatus();
            } catch (error) {
                update(state => ({
                    ...state,
                    isLoading: false,
                    error: `Failed to initialize repository: ${error}`
                }));
            }
        },

        async init() {
            const projectPath = get(fileStore).currentProjectPath;
            if (!projectPath) {
                return;
            }

            update(state => ({ ...state, isLoading: true, error: null }));
            try {
                const [isRepo, branches, currentBranch, status] = await Promise.all([
                    IsGitRepository(projectPath),
                    ListBranches(projectPath),
                    GetCurrentBranch(projectPath),
                    GetGitStatus(projectPath)
                ]);

                update(state => ({ 
                    ...state, 
                    isRepository: isRepo,
                    branches,
                    currentBranch,
                    gitStatus: status
                }));

                if (isRepo) {
                    await this.getCommits();
                }
            } catch (error) {
                update(state => ({ ...state, error: error instanceof Error ? error.message : 'Failed to initialize git' }));
            } finally {
                update(state => ({ ...state, isLoading: false }));
            }
        },

        toggleStagedExpanded: () => update(state => ({
            ...state,
            stagedExpanded: !state.stagedExpanded
        })),

        toggleChangesExpanded: () => update(state => ({
            ...state,
            changesExpanded: !state.changesExpanded
        })),

        setGitStatus: (status: service.FileStatus[]) => update(state => ({
            ...state,
            gitStatus: status
        })),

        async stageFile(file: string): Promise<void> {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                // Add to loading set but keep existing status
                update(state => ({
                    ...state,
                    loadingFiles: new Set([...state.loadingFiles, file])
                }));

                // Optimistically update the UI
                update(state => {
                    const gitStatus = state.gitStatus?.map(item => {
                        if (item.file === file) {
                            return {
                                ...item,
                                staged: true,
                                // Change status from '?' to 'A' for untracked files
                                status: item.status === '?' ? 'A' : item.status
                            };
                        }
                        return item;
                    }) || [];
                    return { ...state, gitStatus };
                });

                await StageFile(projectPath, file);
                // No need to refresh if the operation succeeded
            } catch (error) {
                update(state => ({
                    ...state,
                    error: `Failed to stage file: ${error}`
                }));
                // Only refresh if there was an error
                await this.refreshStatus();
            } finally {
                update(state => {
                    const loadingFiles = new Set(state.loadingFiles);
                    loadingFiles.delete(file);
                    return { ...state, loadingFiles };
                });
            }
        },

        async unstageFile(file: string) {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                update(state => ({
                    ...state,
                    loadingFiles: new Set([...state.loadingFiles, file])
                }));

                // Optimistically update the UI by moving the file to unstaged
                update(state => ({
                    ...state,
                    gitStatus: state.gitStatus.map(item =>
                        item.file === file
                            ? { ...item, staged: false }
                            : item
                    )
                }));

                await UnstageFile(projectPath, file);
                // No need to refresh if the operation succeeded
            } catch (error) {
                update(state => ({
                    ...state,
                    error: `Failed to unstage file: ${error}`
                }));
                // Only refresh if there was an error
                await this.refreshStatus();
            } finally {
                update(state => {
                    const loadingFiles = new Set(state.loadingFiles);
                    loadingFiles.delete(file);
                    return { ...state, loadingFiles };
                });
            }
        },

        async discardChanges(file: string): Promise<void> {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                update(state => ({
                    ...state,
                    loadingFiles: new Set([...state.loadingFiles, file])
                }));

                // Optimistically update the UI by removing the file from the list
                update(state => ({
                    ...state,
                    gitStatus: state.gitStatus?.filter(item => item.file !== file) || []
                }));

                await DiscardChanges(projectPath, file);
            } catch (error) {
                update(state => ({
                    ...state,
                    error: `Failed to discard changes: ${error}`
                }));
                // Only refresh if there was an error
                await this.refreshStatus();
            } finally {
                update(state => {
                    const loadingFiles = new Set(state.loadingFiles);
                    loadingFiles.delete(file);
                    return { ...state, loadingFiles };
                });
            }
        },

        async commit(message: string): Promise<void> {
            const projectPath = get(fileStore).currentProjectPath;
            if (!projectPath) {
                return;
            }

            try {
                await Commit(projectPath, message);
                await this.getCommits(); // This will also update HEAD
                await this.refreshStatus();
            } catch (error) {
                console.error('Failed to commit:', error);
            }
        },

        async refreshBranches() {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                const [branches, currentBranch] = await Promise.all([
                    ListBranches(projectPath),
                    GetCurrentBranch(projectPath)
                ]);

                update(state => ({
                    ...state,
                    branches,
                    currentBranch,
                    error: null
                }));
            } catch (error) {
                update(state => ({
                    ...state,
                    error: `Failed to get branch information: ${error}`
                }));
            }
        },

        async getCommits(filter: service.CommitFilter = { limit: 20 }) {
            const projectPath = get(fileStore).currentProjectPath;
            if (!projectPath) {
                return;
            }

            update(state => ({ ...state, commitsLoading: true, commitsError: null }));
            try {
                const commits = await ListCommits(projectPath, filter);
                const head = commits.find(c => c.hash === commits[0]?.hash) || null;
                update(state => ({ ...state, commits, HEAD: head }));
            } catch (error) {
                update(state => ({ ...state, commitsError: error instanceof Error ? error.message : 'Failed to load commits' }));
            } finally {
                update(state => ({ ...state, commitsLoading: false }));
            }
        },

        async getCommitsAfter(offsetHash: string, limit: number) {
            const projectPath = get(fileStore).currentProjectPath;
            if (!projectPath) {
                return;
            }

            update(state => ({ ...state, commitsLoading: true, commitsError: null }));
            try {
                const newCommits = await ListCommitsAfter(projectPath, offsetHash, limit);
                update(state => ({ 
                    ...state, 
                    commits: [...state.commits, ...newCommits]
                }));
            } catch (error) {
                update(state => ({ ...state, commitsError: error.message }));
            } finally {
                update(state => ({ ...state, commitsLoading: false }));
            }
        },

        async getBranchCommits(branch: string, limit: number) {
            const projectPath = get(fileStore).currentProjectPath;
            if (!projectPath) {
                return;
            }

            update(state => ({ ...state, commitsLoading: true, commitsError: null }));
            try {
                const commits = await ListCommitsByBranch(projectPath, branch, limit);
                update(state => ({ ...state, commits }));
            } catch (error) {
                update(state => ({ ...state, commitsError: error.message }));
            } finally {
                update(state => ({ ...state, commitsLoading: false }));
            }
        },

        async getAuthorCommits(author: string, limit: number) {
            const projectPath = get(fileStore).currentProjectPath;
            if (!projectPath) {
                return;
            }

            update(state => ({ ...state, commitsLoading: true, commitsError: null }));
            try {
                const commits = await ListCommitsByAuthor(projectPath, author, limit);
                update(state => ({ ...state, commits }));
            } catch (error) {
                update(state => ({ ...state, commitsError: error.message }));
            } finally {
                update(state => ({ ...state, commitsLoading: false }));
            }
        },

        async searchCommits(query: string, limit: number) {
            const projectPath = get(fileStore).currentProjectPath;
            if (!projectPath) {
                return;
            }

            update(state => ({ ...state, commitsLoading: true, commitsError: null }));
            try {
                const commits = await SearchCommits(projectPath, query, limit);
                update(state => ({ ...state, commits }));
            } catch (error) {
                update(state => ({ ...state, commitsError: error.message }));
            } finally {
                update(state => ({ ...state, commitsLoading: false }));
            }
        },

        async loadMoreCommits(limit: number) {
            const state = get(this);
            if (state.commits.length === 0) {
                return;
            }

            const lastCommit = state.commits[state.commits.length - 1];
            const newCommits = await this.getCommitsAfter(lastCommit.hash, limit);
            
            if (newCommits) {
                update(state => ({ 
                    ...state, 
                    commits: [...state.commits, ...newCommits]
                }));
            }
        },

        async getHeadCommit() {
            const projectPath = get(fileStore).currentProjectPath;
            if (!projectPath) {
                return;
            }

            try {
                const head = await GetHeadCommit(projectPath);
                update(state => ({ ...state, HEAD: head }));
                return head;
            } catch (error) {
                console.error('Failed to get head commit:', error);
            }
        },

        // Load the diff for the selected file
        async getDiff(file: string, staged: boolean) {
            update(state => ({
                ...state,
                selectedFile: file,
                selectedFileStaged: staged,
                isDiffLoading: true,
                diffError: null
            }));

            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    throw new Error('No project path');
                }

                const diff = await GetFileDiff(projectPath, file, staged);
                console.log(JSON.stringify(diff, null, 2));
                update(state => ({
                    ...state,
                    fileDiff: diff,
                    isDiffLoading: false
                }));
            } catch (error) {
                update(state => ({
                    ...state,
                    fileDiff: null,
                    isDiffLoading: false,
                    diffError: `Failed to load diff: ${error}`
                }));
            }
        },

        clearFileSelection() {
            update(state => ({
                ...state,
                selectedFile: null,
                selectedFileStaged: false,
                fileDiff: null,
                isDiffLoading: false,
                diffError: null
            }));
        },

        reset() {
            set({
                gitStatus: [],
                stagedExpanded: true,
                changesExpanded: true,
                isRepository: false,
                isLoading: false,
                isQuickRefreshing: false,
                loadingFiles: new Set(),
                error: null,
                branches: [],
                currentBranch: null,
                commits: [],
                commitsLoading: false,
                commitsError: null,
                HEAD: null,
                initialized: false,
                selectedFile: null,
                selectedFileStaged: false,
                fileDiff: null,
                isDiffLoading: false,
                diffError: null
            });
        }
    };
}

export const gitStore = createGitStore();
