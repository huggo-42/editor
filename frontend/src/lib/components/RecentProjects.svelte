<script lang="ts">
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import {
        OpenProjectFolder,
        GetRecentProjects,
        AddProject,
    } from "@/lib/wailsjs/go/main/App";
    import type { db, sql } from "@/lib/wailsjs/go/models";
    import { Clock, FolderOpen, ChevronRight } from "lucide-svelte";
    import { projectStore } from "@/stores/project";

    let recentProjects: db.Project[] = [];
    let loading = true;
    let error: string | null = null;

    onMount(async () => {
        try {
            recentProjects = await GetRecentProjects();
        } catch (err: unknown) {
            error = err instanceof Error ? err.message : "Unknown error";
        } finally {
            loading = false;
        }
    });

    async function openProject(projectId?: number) {
        // Opening existing project
        const project = recentProjects.find((p) => p.ID === projectId);

        if (project) {
            const updatedProject = await AddProject(project.Name, project.Path);
            // Update the project in the list
            recentProjects = recentProjects.map((p) =>
                p.ID === updatedProject.ID ? updatedProject : p,
            );
            
            // Set current project and navigate to editor
            await projectStore.setCurrentProject(updatedProject);
            push("/editor");
        }
    }

    async function handleOpenFolder() {
        // Opening new project
        const path = await OpenProjectFolder();
        if (!path) return; // User cancelled

        // Extract project name from path (last folder name)
        const name = path.split("/").pop() || path;

        const project = await AddProject(name, path);
        if (project) {
            await projectStore.setCurrentProject(project);
            push("/editor");
        }
    }

    function formatDate(date: sql.NullTime): string {
        if (!date.Valid) return "Never";
        const today = new Date();

        const recordDate = new Date(date.Time);
        const diffInMs = today.getTime() - recordDate.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 60) {
            return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
        } else if (diffInDays < 7) {
            return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
        } else {
            return recordDate.toLocaleDateString('en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    }
</script>

<!-- Left Column - Recent Projects -->
<div
    class="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700"
>
    <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold flex items-center gap-2">
            <Clock size={20} /> Recent Projects
        </h2>
        <button
            class="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
        >
            View All <ChevronRight size={16} />
        </button>
    </div>

    <div class="space-y-4">
        {#each recentProjects as project}
            <button
                class="w-full group overflow-hidden"
                on:click={() => openProject(project.ID)}
            >
                <div
                    class="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition-all border border-gray-700 hover:border-gray-600 relative"
                >
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                            <FolderOpen size={18} class="text-blue-400" />
                            <div class="text-left">
                                <h3
                                    class="font-medium group-hover:text-blue-400 transition-colors"
                                >
                                    {project.Name}
                                </h3>
                                <p class="text-sm text-gray-400 mt-1">
                                    {project.Path}
                                </p>
                            </div>
                        </div>
                        <span class="text-xs text-gray-500 absolute top-4 right-4"
                            >{formatDate(project.LastOpened)}</span
                        >
                    </div>
                </div>
            </button>
        {/each}

        <button
            on:click={handleOpenFolder}
            class="w-full bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition-all border border-gray-700 hover:border-blue-500 border-dashed flex items-center justify-center gap-2 text-gray-400 hover:text-blue-400"
        >
            <FolderOpen size={18} />
            Open Folder
        </button>
    </div>
</div>
