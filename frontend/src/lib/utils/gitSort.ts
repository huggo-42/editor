import type { service } from "@/lib/wailsjs/go/models";

export function compareFiles(a: string, b: string) {
    const aName = a.split('/').pop() || '';
    const bName = b.split('/').pop() || '';
    
    // Helper to check if string starts with dot or number
    const startsWithDotOrNumber = (str: string) => /^[.0-9]/.test(str);
    
    const aHasDotOrNumber = startsWithDotOrNumber(aName);
    const bHasDotOrNumber = startsWithDotOrNumber(bName);
    
    // If one has dot/number and other doesn't, prioritize dot/number
    if (aHasDotOrNumber && !bHasDotOrNumber) return -1;
    if (!aHasDotOrNumber && bHasDotOrNumber) return 1;
    
    // Otherwise, normal alphabetical sort
    return a.localeCompare(b);
}

export function sortGitFiles(files: service.FileStatus[], hierarchical: boolean): service.FileStatus[] {
    if (!hierarchical) {
        // Simple sort by filename
        return [...files].sort((a, b) => compareFiles(a.file, b.file));
    }

    // Group files by directory
    const filesByDir = files.reduce((acc, file) => {
        const parts = file.file.split('/');
        const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
        if (!acc[dir]) {
            acc[dir] = [];
        }
        acc[dir].push(file);
        return acc;
    }, {} as Record<string, service.FileStatus[]>);

    // Sort files within each directory and concatenate
    return Object.entries(filesByDir)
        // Sort directories
        .sort(([dirA], [dirB]) => dirA.localeCompare(dirB))
        // Sort files within each directory and flatten
        .flatMap(([_, dirFiles]) => 
            dirFiles.sort((a, b) => compareFiles(a.file.split('/').pop() || '', b.file.split('/').pop() || ''))
        );
}
