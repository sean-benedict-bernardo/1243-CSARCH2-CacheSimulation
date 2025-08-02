/**
 * Creates a log entry from a cache insert event.
 * 
 * @param {Object} cacheInsertEntry
 * @returns string of the log entry
 */

function createLog(cacheInsertEntry) {
    const { ctr, status, setNumber, blockNumber, memBlkNum, replacedBlock } = cacheInsertEntry;

    let str = `[${ctr}] Cache ${status}:`

    if (status === "Hit") {
        str += ` Updating MM Block ${memBlkNum} in Set ${setNumber} Block ${blockNumber}`;
    } else {
        str += ` Inserting MM Block ${memBlkNum} into Set ${setNumber} Block ${blockNumber}`;

        if (replacedBlock !== null) {
            str += `; Replacing MM Block: ${replacedBlock}`;
        }
    }

    return str;
}

/**
 * Creates a formatted log string from an array of cache insert logs.
 * 
 * @param {Array<Object>} cacheInsertLogs array of cache insert logs
 */
function createLogs(cacheInsertLogs) {
    const sortedLogs = cacheInsertLogs
        .slice()
        .sort((a, b) => a.ctr - b.ctr)
        .map(createLog);


    return sortedLogs.join("\n");
}
/**
 * Exports the cache insert logs as a text file.
 * 
 * @param {Array<Object>} cacheInsertLogs
 */
function exportLogs(cacheInsertLogs) {
    const logs = createLogs(cacheInsertLogs);
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'cache_logs.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}