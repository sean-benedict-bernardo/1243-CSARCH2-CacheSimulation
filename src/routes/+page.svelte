<script lang="ts">
	import { CacheMemory } from "$lib/Cache.js";
	import TableMemory from "$lib/TableCacheMemory.svelte";
	import SRAMTable from '$lib/TableSRAM.svelte';
	import ActionLogs from '$lib/TableActionLogs.svelte';
	import { onMount } from "svelte";

	const SRAM_BLOCKS = 16;
	const numCacheLines = 8;
	const wordsPerBlock = 2;

	// Reactive Inputs
	let wordsPerBlockInput = wordsPerBlock;
	let numCacheLinesInput = numCacheLines;
	let catNs = 5;
	let matNs = 10;

	// Simulation states
	let inserts: number[] = [];
	let curr = 0;
	let step_num = 1;

	let cacheMemory: {
		set_number: number;
		set_block_number: number;
		main_memory_block: number;
		step: number;
	}[] = [];

	let sramdata: { block: number; step: number }[] = [];

	let logEntries: { hit: boolean; action: string; time: number }[] = [];

	let cache = new CacheMemory(wordsPerBlock, numCacheLines, catNs, matNs);

	// Initialize inputs
	for (let i = 0; i < SRAM_BLOCKS * 2; ++i) {
		inserts.push(i % SRAM_BLOCKS);
	}

	function padZero(n: number, width = 2) {
		return n.toString().padStart(width, '0');
	}

	function getBlockSetId(set: number, block: number) {
		return `data_${padZero(set)}_${block}`;
	}

	function addNext() {
	const memBlk = inserts[curr];

	const newBlock = cache.insert(memBlk) as {
		ctr: number;
		status: string;
		setNumber: number;
		blockNumber: number;
		memBlkNum: number;
		replacedBlock: number | null;
	};

	// REASSIGN to trigger reactivity
	cacheMemory = [...cacheMemory, {
		set_number: newBlock.setNumber,
		set_block_number: newBlock.blockNumber,
		main_memory_block: memBlk,
		step: step_num
	}];

	sramdata = [...sramdata, {
		block: newBlock.blockNumber,
		step: step_num
	}];

	logEntries = [...logEntries, {
		hit: newBlock.status === "Hit",
		action: newBlock.status === "Hit" ? `Read Block ${memBlk}` : `Load Block ${memBlk}`,
		time: step_num
	}];

	curr = (curr + 1) % inserts.length;
	step_num += 1;
    }

</script>


<div class="w-full h-full bg-base-300">
    <h1 class="text-2xl font-bold text-center">Cache Simulator</h1>
    <div class=" w-full ">
        
        <div class="flex flex-row justify-center gap-2">
            <ActionLogs logs={logEntries}/>
            <TableMemory tableLength={4} setSize={4} items={cacheMemory}></TableMemory>
            <SRAMTable addressBits={4} blockSize={1} items={sramdata} />
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
                            <input type="text" class="input" placeholder="Type here" bind:value={catNs}/>
                        </fieldset>
                        <fieldset class="fieldset">
                            <legend class="fieldset-legend">MAT in ns</legend>
                            <input type="text" class="input" placeholder="Type here" bind:value={matNs}/>
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
                <button class="btn btn-xs" onclick={addNext} >Next</button>
                </div>
                <button class="btn btn-xs">Final Snapshot</button>
            </div>
        </div>
    </div>
    
</div>