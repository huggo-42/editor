export function fuzzySearch<T>(
    items: T[],
    query: string,
    getter: (item: T) => string
): T[] {
    const searchQuery = query.toLowerCase();
    return items
        .map(item => {
            const str = getter(item).toLowerCase();
            let score = 0;
            let lastMatchIndex = -1;
            let matches = 0;

            for (let i = 0; i < searchQuery.length; i++) {
                const searchChar = searchQuery[i];
                const found = str.indexOf(searchChar, lastMatchIndex + 1);
                
                if (found === -1) {
                    return { item, score: -1 };
                }

                // Consecutive matches score higher
                if (found === lastMatchIndex + 1) {
                    score += 2;
                }

                // Characters closer to the start score higher
                score += 1 / (found + 1);
                
                lastMatchIndex = found;
                matches++;
            }

            // Complete matches score higher
            if (matches === searchQuery.length) {
                score += 1;
            }

            // Exact matches score highest
            if (str === searchQuery) {
                score += 2;
            }

            return { item, score };
        })
        .filter(({ score }) => score > -1)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item);
}
