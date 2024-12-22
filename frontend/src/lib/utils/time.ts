// Format date to relative time (e.g., "2 hours ago", "3 days ago")
export function formatRelativeTime(date: string) {
    const now = new Date();
    const commitDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - commitDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
    return commitDate.toLocaleDateString();
}