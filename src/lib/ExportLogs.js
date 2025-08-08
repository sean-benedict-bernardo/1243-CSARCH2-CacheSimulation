
/**
 * Returns the number of digits in an integer.
 * @param {number} n
 * @returns {number}
 */
function getNumDigits(n) {
    n = Math.abs(n);
    if (n === 0) return 1;
    return Math.floor(Math.log10(n)) + 1;
}


/**
 * Creates a log entry from a cache insert event.
 * 
 * @param {Object} cacheInsertEntry
 * @returns string of the log entry
 */

export function createLog(cacheInsertEntry, numDigits = 0) {
    const { ctr, status, setNumber, blockNumber, memBlkNum, replacedBlock } = cacheInsertEntry;

    const counter_str = `[${ctr}]`;

    let str = `${counter_str.padEnd(2 + numDigits, ' ')} ${status.padEnd(4)} - Set ${setNumber} Blk ${blockNumber} - `;

    if (status === "Hit") {
        str += `Updating Age of MM Block ${memBlkNum}`;
    } else if (status === "Miss" && replacedBlock !== null) {
        str += `Replacing MM Block ${replacedBlock} with MM Block ${memBlkNum}`;
    } else {
        str += `Inserting MM Block ${memBlkNum}`;
    }

    return str;
}

/**
 * Creates a formatted log string from an array of cache insert logs.
 * 
 * @param {Array<Object>} cacheInsertLogs array of cache insert logs
 */
export function createLogs(cacheInsertLogs) {
    const numDigits = getNumDigits(cacheInsertLogs.length);

    const sortedLogs = cacheInsertLogs
        .slice()
        .sort((a, b) => a.ctr - b.ctr)
        .map(entry => createLog(entry, numDigits));


    return sortedLogs.join("\n");
}

function createSummary(summary) {
    try {
        let { accessCount, numHits, numMisses, hitRate, missRate, TAT, AAT } = summary;

        // round hitRate, missRate, TAT, and AAT to 2 decimal places
        hitRate = parseFloat(hitRate).toFixed(2);
        missRate = parseFloat(missRate).toFixed(2);
        TAT = parseFloat(TAT).toFixed(2);
        AAT = parseFloat(AAT).toFixed(2);

        const summaryLines = [
            `Access Count: ${accessCount}, Hits: ${numHits}, Misses: ${numMisses}`,
            `Hit Rate: ${hitRate}%, Miss Rate: ${missRate}%`,
            `Total Access Time: ${TAT} ms`,
            `Average Access Time: ${AAT} ms`,
        ];
        return summaryLines.join("\n");
    } catch (error) {
        console.error("Error creating summary:", error);
        return "\nError creating summary.";
    }
}


/**
 * Exports the cache insert logs as a text file.
 * 
 * @param {Array<Object>} cacheInsertLogs
 */
export function exportLogs(cacheInsertLogs, summary) {
    try {
        const logs = createLogs(cacheInsertLogs);
        const summaryStr = createSummary(summary);
        const fullLog = [
            "======================== Cache Memory Summary ========================",
            summaryStr,
            "======================== Cache Memory Logs ==========================",
            logs,
            "=".repeat(70),
        ].join("\n\n");

        console.log(fullLog);

        const blob = new Blob([fullLog], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cache_logs.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    catch (error) {
        console.error("Error exporting logs:", error);
    }
}