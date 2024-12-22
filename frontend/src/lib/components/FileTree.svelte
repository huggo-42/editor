<script lang="ts">
    import { Edit, FolderPlus, Plus, Trash2 } from "lucide-svelte";
    import FileTreeItem from "@/lib/editor/FileTreeItem.svelte";
    import ContextMenu from "@/lib/editor/ContextMenu.svelte";
    import type { service } from "@/lib/wailsjs/go/models";
    import { fileStore } from "@/stores/fileStore";
    import { LoadDirectoryContents } from "@/lib/wailsjs/go/main/App";
    import { onMount } from "svelte";

    type FileNode = service.FileNode;
    type FileTreeContextMenuEvent = CustomEvent<{ event: MouseEvent, item: FileNode }>;

    export let isAllCollapsed = false;
    export let key = 0; // Add key prop to force re-render

    let contextMenu = {
        show: false,
        x: 0,
        y: 0,
        targetItem: null as FileNode | null,
    };

    const currentProjectRootNode: service.FileNode = {
        name: $fileStore.activeFilePath as string,
        path: $fileStore.currentProjectPath as string,
        type: "",
        children: [],
    };

    let tempNode: FileNode | null = null;
    $: fileTree = $fileStore.fileTree || [];

    function addNodeToTree(node: FileNode, parentPath: string) {
        if (!parentPath || parentPath === $fileStore.currentProjectPath) {
            // Add to root level
            if (!fileTree.some(item => item.path === node.path)) {
                fileTree = [...fileTree, node];
            }
        } else {
            // Add to the correct parent folder
            const updateNode = (items: FileNode[]): FileNode[] => {
                return items.map(item => {
                    if (item.path === parentPath) {
                        // Found the parent directory, add the new node to its children
                        return {
                            ...item,
                            children: [...(item.children || []), node],
                            isLoaded: true
                        };
                    } else if (item.type === "directory" && item.children) {
                        // Keep searching in subdirectories
                        const updatedChildren = updateNode(item.children);
                        if (updatedChildren !== item.children) {
                            return { ...item, children: updatedChildren };
                        }
                    }
                    return item;
                });
            };

            fileTree = updateNode(fileTree);
        }
    }

    function removeNodeFromTree(items: FileNode[], path: string): FileNode[] {
        return items.filter(item => item.path !== path);
    }

    async function handleContextMenuAction(action: string) {
        if (!contextMenu.targetItem) return;

        switch (action) {
            case "rename":
                const item = contextMenu.targetItem;
                if (item) {
                    const fileTreeItem = document.querySelector(
                        `[data-path="${item.path}"]`,
                    );
                    if (fileTreeItem) {
                        fileTreeItem.dispatchEvent(
                            new CustomEvent("startRename"),
                        );
                    }
                }
                break;
            case "delete":
                if (
                    confirm(
                        `Are you sure you want to delete ${contextMenu.targetItem.name}?`,
                    )
                ) {
                    try {
                        await fileStore.deleteFile(contextMenu.targetItem.path);
                    } catch (error) {
                        console.error("Failed to delete:", error);
                    }
                }
                break;
            case "newFile":
            case "newFolder":
                const isFolder = action === "newFolder";
                const targetPath = contextMenu.targetItem.path;
                const targetDir = contextMenu.targetItem.type === "directory" 
                    ? targetPath 
                    : targetPath.substring(0, targetPath.lastIndexOf("/"));
                
                const newPath = `${targetDir}/New ${isFolder ? "Folder" : "File"}`;
                tempNode = {
                    name: `New ${isFolder ? "Folder" : "File"}`,
                    path: newPath,
                    type: isFolder ? "directory" : "file",
                    children: [],
                    isRenaming: true,
                };

                // Add the node to the correct parent in the tree
                addNodeToTree(tempNode!, targetDir);

                // Wait for the DOM to update with the new node
                setTimeout(() => {
                    const fileTreeItem = document.querySelector(
                        `[data-path="${newPath}"]`
                    );
                    if (fileTreeItem) {
                        fileTreeItem.dispatchEvent(
                            new CustomEvent("startRename")
                        );
                    }
                }, 0);
                break;
        }
    }

    function handleContextMenu(e: FileTreeContextMenuEvent) {
        const { event, item } = e.detail;
        contextMenu = {
            show: true,
            x: event.clientX,
            y: event.clientY,
            targetItem: item
        };
    }

    async function handleRename(path: string, newName: string) {
        try {
            const parentPath = path.substring(0, path.lastIndexOf("/"));
            const newPath = `${parentPath}/${newName}`;
            
            if (tempNode) {
                try {
                    // Create the file/directory without refreshing
                    if (tempNode.type === "directory") {
                        await fileStore.createDirectory(newPath);
                    } else {
                        await fileStore.createFile(newPath);
                    }

                    // Remove temporary node
                    fileTree = removeNodeFromTree(fileTree, tempNode.path);
                    tempNode = null;

                    // Now refresh to show the actual file
                    await fileStore.loadDirectoryContents(parentPath);
                    await fileStore.refreshFiles();
                } catch (error) {
                    console.error('Failed to create:', error);
                    // Remove the temporary node on failure
                    fileTree = removeNodeFromTree(fileTree, tempNode.path);
                    tempNode = null;
                }
            } else {
                // This is a rename operation
                await fileStore.renameFile(path, newPath);
                // Full refresh after rename
                await fileStore.refreshFiles();
            }
        } catch (error) {
            console.error("Failed to rename:", error);
        }
    }

    function handleCloseContextMenu() {
        contextMenu.show = false;
    }

    onMount(() => {
        const root = document.querySelector('.filetree-root');
        if (root) {
            root.addEventListener('filetree:contextmenu', ((e: FileTreeContextMenuEvent) => {
                e.stopPropagation();
                handleContextMenu(e);
            }) as EventListener);
        }
    });
</script>

<div class="h-full overflow-auto flex flex-col filetree-root">
    <div class="flex-shrink-0">
        {#if $fileStore.loading}
            <div class="p-4 text-sm text-gray-500">Loading files...</div>
        {:else if $fileStore.error}
            <div class="p-4 text-sm text-red-500">{$fileStore.error}</div>
        {:else}
            {#each fileTree as item (item.path)}
                <FileTreeItem
                    {item}
                    onContextMenu={handleContextMenu}
                    onRename={(path, newName) => handleRename(path, newName)}
                    {isAllCollapsed}
                />
            {/each}
        {/if}
    </div>

    <!-- Empty space that fills remaining height -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="flex-grow min-h-[20px]"
        on:contextmenu|preventDefault={(e) => {
            // For empty space, create a synthetic event with the root directory
            const customEvent = new CustomEvent('filetree:contextmenu', {
                detail: {
                    event: e,
                    item: {
                        name: $fileStore.currentProjectPath.split('/').pop() || '',
                        path: $fileStore.currentProjectPath,
                        type: 'directory',
                        children: fileTree,
                        isLoaded: true
                    }
                },
                bubbles: true,
                composed: true,
                cancelable: true
            });
            e.target.dispatchEvent(customEvent);
        }}
    />

    {#if contextMenu.show}
        <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            on:close={handleCloseContextMenu}
            items={contextMenu.targetItem?.path !== $fileStore.currentProjectPath
                ? [
                      {
                          label: "New File",
                          icon: Plus,
                          action: () => handleContextMenuAction("newFile"),
                      },
                      {
                          label: "New Folder",
                          icon: FolderPlus,
                          action: () => handleContextMenuAction("newFolder"),
                      },
                      {
                          label: "Rename",
                          icon: Edit,
                          action: () => handleContextMenuAction("rename"),
                      },
                      {
                          label: "Delete",
                          icon: Trash2,
                          action: () => handleContextMenuAction("delete"),
                      },
                  ]
                : [
                      {
                          label: "New File",
                          icon: Plus,
                          action: () => handleContextMenuAction("newFile"),
                      },
                      {
                          label: "New Folder",
                          icon: FolderPlus,
                          action: () => handleContextMenuAction("newFolder"),
                      },
                  ]}
            on:action={({ detail }) => handleContextMenuAction(detail)}
            onClose={handleCloseContextMenu}
        />
    {/if}
</div>
