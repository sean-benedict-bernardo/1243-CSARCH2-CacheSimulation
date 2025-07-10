document.addEventListener('DOMContentLoaded', () => {
    const inserts = [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7];

    const cache = new Cache(2, 8);
    inserts.forEach((blockNumber, index) => {
        cache.insert(blockNumber);
    });
});