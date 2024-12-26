<script lang="ts">
    import { gitStore } from "@/stores/gitStore";
    import { fileStore } from "@/stores/fileStore";

    $: if ($gitStore.fileDiff) {
        const diff = $gitStore.fileDiff;
        const virtualPath = `[diff] ${diff.path}`;
        
        if (diff.isBinary) {
            fileStore.openVirtualFile(virtualPath, "Binary file not shown", "text");
        } else {
            fileStore.openVirtualFile(virtualPath, diff.content, "diff");
        }
    }
</script>
