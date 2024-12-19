import { get, writable } from 'svelte/store';
import { AddProject, GetRecentProjects, OpenProjectFolder } from '@/lib/wailsjs/go/main/App';
import { fileStore } from './fileStore';
import type { db } from '@/lib/wailsjs/go/models';

export interface ProjectState {
    currentProject: db.Project | null;
    recentProjects: db.Project[];
    loading: boolean;
    error: string | null;
}

// Load initial state from localStorage
const savedState = localStorage.getItem('projectState');
const initialState: ProjectState = savedState ? JSON.parse(savedState) : {
    currentProject: null,
    recentProjects: [],
    loading: false,
    error: null
};

function createProjectStore() {
    const { subscribe, set, update } = writable<ProjectState>(initialState);

    // Save state changes to localStorage
    subscribe(state => {
        localStorage.setItem('projectState', JSON.stringify(state));
    });

    return {
        subscribe,

        // Load recent projects
        async loadRecentProjects() {
            update(state => ({ ...state, loading: true, error: null }));
            try {
                const projects = await GetRecentProjects();
                update(state => ({ ...state, recentProjects: projects, loading: false }));
            } catch (err) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: err instanceof Error ? err.message : 'Failed to load recent projects'
                }));
            }
        },

        // Open project folder dialog
        async openProjectFolder() {
            try {
                const path = await OpenProjectFolder();
                if (!path) return null;

                // Extract project name from path
                const name = path.split('/').pop() || path;
                return { name, path };
            } catch (err) {
                update(state => ({
                    ...state,
                    error: err instanceof Error ? err.message : 'Failed to open project folder'
                }));
                return null;
            }
        },

        // Add project
        async addProject(project: db.Project) {
            update(state => ({ ...state, loading: true, error: null }));
            try {
                await AddProject(project);
                await fileStore.loadProjectFiles(project.Path);
                update(state => ({
                    ...state,
                    currentProject: project,
                    loading: false
                }));
                await this.loadRecentProjects();
            } catch (err) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: err instanceof Error ? err.message : 'Failed to add project'
                }));
            }
        },

        // Set current project
        async setCurrentProject(project: db.Project) {
            update(state => ({ ...state, loading: true, error: null }));
            try {
                // First set the current project path in fileStore to handle open files
                await fileStore.setCurrentProject(project.Path);
                
                // Then update the project store state
                update(state => ({
                    ...state,
                    currentProject: project,
                    loading: false
                }));
            } catch (err) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: err instanceof Error ? err.message : 'Failed to set current project'
                }));
            }
        },

        // Reset store
        reset() {
            localStorage.removeItem('projectState');
            set(initialState);
        }
    };
}

export const projectStore = createProjectStore();
