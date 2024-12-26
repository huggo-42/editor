// Map file extensions to Monaco editor language identifiers
export const languageMap: Record<string, string> = {
    // Web
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'json': 'json',
    'svelte': 'svelte',
    'vue': 'vue',

    // Programming Languages
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'cpp',
    'hpp': 'cpp',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'rb': 'ruby',
    'php': 'php',
    'pl': 'perl',
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',

    // Markup/Config
    'md': 'markdown',
    'markdown': 'markdown',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'xml': 'xml',
    'svg': 'xml',

    // Default
    'txt': 'plaintext'
};

export function getLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    return languageMap[ext] || 'plaintext';
}
