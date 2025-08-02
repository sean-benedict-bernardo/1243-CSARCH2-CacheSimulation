<script lang="ts">
    import { CacheMemory } from "$lib/Cache.js";
    import TableMemory from "$lib/TableCacheMemory.svelte";
    import SRAMTable from '$lib/TableSRAM.svelte';
    import ActionLogs from '$lib/TableActionLogs.svelte'
    import { onMount } from "svelte";

    const numCacheLines = 8; // Example value, can be changed
    const cacheData: { blocks: { blockNumber: number; age: number }[] }[] = $state([]);
    const inserts: number[] = [];
    let curr = 0;
    let queueNum = 0;
    const wordsPerBlock = 2

    const step_num = 1

    let wordsPerBlockInput = wordsPerBlock;
    let numCacheLinesInput = numCacheLines;
    let catNs = 5;
    let matNs = 10;

    // For test cases
    let customPattern = "";
    let testCaseSelected: string | null = null;

    const cache = new CacheMemory(wordsPerBlock, numCacheLines, catNs, matNs);

    for (let i = 0; i < 32; ++i) {
        inserts.push(i%16);
    }

    function padZero(n: number, width = 2) {
        return n.toString().padStart(width, '0');
    }

    function getBlockSetId(set: number, block: number) {
        return `data_${padZero(set)}_${block}`
    }

    function addNext() {
        const newBlock = cache.insert(inserts[curr]);
        curr = (curr + 1) % inserts.length;
        
        console.log(JSON.stringify(newBlock))
        const blockId = getBlockSetId(newBlock.setNumber, newBlock.blockNumber);


        const blockCell = document.getElementById(blockId);
        if (blockCell) {
            blockCell.textContent = newBlock.memBlkNum.toString();
        }
    }

    function generateCacheTable(cacheLines: number) {
        const cacheTable = document.getElementById("cacheTable");
        if (!cacheTable) return

        cacheTable.innerHTML = ""; // Clear existing content
        const blocksPerSet = 4;
        const sets = cacheLines / blocksPerSet;

        // Header
        ["Set", "Block", "MM Block"].forEach((text) => {
            const cell = document.createElement("div");
            cell.className = "cell header";
            cell.textContent = text;
            cacheTable.appendChild(cell);
        });

        for (let set = 0; set < sets; set++) {
            for (let block = 0; block < blocksPerSet; block++) {
                // Set Column (only once per set)
                if (block === 0) {
                    const setCell = document.createElement("div");
                    setCell.className = "cell set-label";
                    setCell.rowSpan = blocksPerSet;
                    setCell.textContent = set.toString();
                    setCell.style.gridRow = `span ${blocksPerSet}`;
                    cacheTable.appendChild(setCell);
                }

                // Block
                const blockCell = document.createElement("div");
                blockCell.className = "cell";
                blockCell.textContent = block.toString();
                cacheTable.appendChild(blockCell);

                // Data
                const dataCell = document.createElement("div");
                dataCell.className = "cell set-row";
                dataCell.id = getBlockSetId(set, block);
                cacheTable.appendChild(dataCell);
            }
        }
    }
    
    onMount(() => {
        generateCacheTable(numCacheLines);
    });

    const data = [
        {data: 1, set_number:1, set_block_number: 0, main_memory_block: 1, step: 0},
        {data: 2, set_number:1, set_block_number: 2, main_memory_block: 2, step: 1},
        {data: 3, set_number:1, set_block_number: 1, main_memory_block: 3, step: 1},
        {data: 4, set_number:1, set_block_number: 3, main_memory_block: 4, step: 1}
    ]
    const sramdata = [
        { data: '3', address: 0 },
        { data: '5', address: 1 },
        { data: '7', address: 2 },
        { data: '2', address: 3 }
    ]

    let logEntries = [
        { hit: true, action: "Read Block 3", time: 1 },
        { hit: false, action: "Load Block 5", time: 2 },
        { hit: true, action: "Read Block 3", time: 3 }
    ];
    
</script>

<div class="w-full h-full bg-base-300">
    <h1 class="text-2xl font-bold text-center">Cache Simulator</h1>
    <div class=" w-full ">
        
        <div class="flex flex-row justify-center gap-2">
            <ActionLogs logs={logEntries}/>
            <TableMemory tableLength={4} setSize={4} items={data}></TableMemory>
            <SRAMTable addressBits={4} blockSize={4} items={sramdata} />
        </div>
         <div class="divider"></div>
        <div class="flex flex-row gap-2 justify-center ">
            <div class="border border-black p-1 bg-base-100 rounded-xl">
                <p>Cache Simulation Proj.</p>
                <p>by CSARCH2 S12 Grp1</p>

                Specs:
                <ol type="1">
                    <li>4-way Block Set Associative LRU</li>
                    <li>Read Policy: NLT</li>
                </ol>
            </div>
            <div class="flex flex-row gap-0.5 border border-black p-1 bg-base-100 rounded-xl">
                <div>
                    Input Params
                    <div class="flex flex-col">
                        <fieldset class="fieldset">
                            <legend class="fieldset-legend">words per block (m)</legend>
                            <input type="text" class="input" placeholder="Type here" />
                        </fieldset>
                        <fieldset class="fieldset">
                            <legend class="fieldset-legend">blocks in CM (n)</legend>
                            <input type="text" class="input" placeholder="Type here" />
                        </fieldset>
                        <fieldset class="fieldset">
                            <legend class="fieldset-legend">CAT in ns</legend>
                            <input type="text" class="input" placeholder="Type here" />
                        </fieldset>
                        <fieldset class="fieldset">
                            <legend class="fieldset-legend">MAT in ns</legend>
                            <input type="text" class="input" placeholder="Type here" />
                        </fieldset>
                    </div> 
                </div>
                <div>
                    Test Case
                    <div class="flex flex-col items-start gap-2">
                        <fieldset class="fieldset">
                            <legend class="fieldset-legend"><input type="checkbox" class="checkbox size-4" />2n * 2</legend>
                        </fieldset>
                        <fieldset class="fieldset">
                            <legend class="fieldset-legend"><input type="checkbox" class="checkbox size-4" />(n + 2n) * 2</legend>
                        </fieldset>
                        <fieldset class="fieldset">
                            <legend class="fieldset-legend"><input type="checkbox" class="checkbox size-4" />Custom</legend>
                            <input type="text" class="input" placeholder="Type here" />
                        </fieldset>
                    </div>
                </div>
            </div>
            <div class="border-black border flex-col justify-center text-center p-1 bg-base-100 rounded-xl">
                Step {step_num} of 16
                <div class="flex flex-row">
                    <button class="btn btn-xs">Previous</button>
                <button class="btn btn-xs">Next</button>
                </div>
                <button class="btn btn-xs">Final Snapshot</button>
            </div>
        </div>
    </div>
    
</div>