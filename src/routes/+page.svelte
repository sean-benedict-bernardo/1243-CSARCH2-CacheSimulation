<script lang="ts">
	import { CacheMemory } from '$lib/Cache.js';
	import TableMemory from '$lib/TableCacheMemory.svelte';
	import SRAMTable from '$lib/TableSRAM.svelte';
	import ActionLogs from '$lib/TableActionLogs.svelte';
	import { onMount } from 'svelte';

	let pendingTestCase: string = '';

	let selectedTestCase: string = '';
	let customTestCase: string = '';

	const SRAM_BLOCKS = 16;
	let wordsPerBlock = 2;
	let numCacheLines = 8;

	// Reactive Inputs
	let wordsPerBlockInput: number = wordsPerBlock;
	let numCacheLinesInput: number = numCacheLines;
	let catNs: number = 5;
	let matNs: number = 10;

	let numHits: number = 0;
	let numMisses: number = 0;

    let TAT: number = 0; // Total Access Time
    let AAT: number = 0; // Average Access Time

	// Input Verification after change (FUNCTIONALITY PUT IN RESETSIMULATION)
    // $: if (wordsPerBlockInput !== wordsPerBlock || numCacheLinesInput !== numCacheLines) {
    //     const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;

    //     // verify that wordsPerBlockInput is a power of 2 and at least 2
    //     if (wordsPerBlockInput < 2) {
    //         throw new Error('Words per block must be at least 2.');
    //     } else if (!isPowerOfTwo(wordsPerBlockInput)) {
    //         throw new Error('Words per block must be a power of 2.');
	// 	}

	// 	// verify that number of blocks is
	// 	// a power of 2 and at least than 4
	// 	if (numCacheLinesInput < 4 || !isPowerOfTwo(numCacheLinesInput)) {
	// 		throw new Error('Number of cache lines must be a power of 2.');
	// 	}

	// 	cache = new CacheMemory(wordsPerBlockInput, numCacheLinesInput, catNs, matNs);
	// 	cacheMemory = [];
	// 	sramdata = [];
	// 	logEntries = [];
	// 	curr = 0;
	// 	step_num = 1;
	// }

	// Simulation states
	let inserts: number[] = [];
	let curr = 0;
	let step_num = 1;

	let cacheMemory: {
		set_number: number;
		set_block_number: number;
		main_memory_block: number;
		step: number;
		hit: boolean;
	}[] = [];

	let sramdata: { block: number; step: number; hit: boolean; }[] = [];

	let logEntries: { hit: boolean; action: string; time: number }[] = [];

	let cache = new CacheMemory(wordsPerBlockInput, numCacheLinesInput, catNs, matNs);

	// Check if final step already reached
	$: isFinalStep = inserts.length > 0 && curr >= inserts.length;

	function padZero(n: number, width = 2) {
		return n.toString().padStart(width, '0');
	}

	function getBlockSetId(set: number, block: number) {
		return `data_${padZero(set)}_${block}`;
	}

	function addNext() {
		if (curr >= inserts.length) {
			// Optional: Show a message or disable the button
			console.log("Simulation complete. No more steps.");
			return;
		}

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
		cacheMemory = [
			...cacheMemory,
			{
				set_number: newBlock.setNumber,
				set_block_number: newBlock.blockNumber,
				main_memory_block: memBlk,
				step: step_num,
				hit: newBlock.status === "Hit"
			}
		];

		sramdata = [
			...sramdata,
			{
				block: memBlk,
				step: step_num,
				hit: newBlock.status === "Hit"
			}
		];

		logEntries = [
			...logEntries,
			{
				hit: newBlock.status === 'Hit',
				action: newBlock.status === 'Hit'
					? `Read Block ${memBlk}`
					: `Load Block ${memBlk}`,
				time: step_num
			}
		];

		const stats = cache.getStats() as {
        hits: number,
        misses: number,
    };

		numHits = stats.hits;
		numMisses = stats.misses;

		curr += 1;
		step_num += 1;

		TAT = cache.calculateTotalAccessTime();
		AAT = cache.calculateAverageAccessTime();

		console.log(sramdata);
	}

	function runToFinalStep() {
		while (curr < inserts.length) {
			addNext();
		}
	}

    function remPrev() {
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
            step: step_num,
						hit: newBlock.status === "Hit"
        }];

        sramdata = [...sramdata, {
            block: memBlk,
            step: step_num,
						hit: newBlock.status === "Hit"
        }];

        logEntries = [...logEntries, {
            hit: newBlock.status === "Hit",
            action: newBlock.status === "Hit" ? `Read Block ${memBlk}` : `Load Block ${memBlk}`,
            time: step_num
        }];

        curr = (curr - 1) % inserts.length;
        step_num = step_num > 0 ? step_num - 1 : step_num;

        console.log(sramdata)
    }

	// TODO: Reset Orange Shades
	function resetSimulationState() {
		console.log("Reset Started");

		const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;

		if (wordsPerBlockInput < 2) {
			alert('Words per block must be at least 2.');
			return;
		} else if (!isPowerOfTwo(wordsPerBlockInput)) {
			alert('Words per block must be a power of 2.');
			return;
		}

		if (numCacheLinesInput < 4 || !isPowerOfTwo(numCacheLinesInput)) {
			alert('Number of cache lines must be a power of 2 and at least 4.');
			return;
		}

		wordsPerBlock = wordsPerBlockInput;
		numCacheLines = numCacheLinesInput;
		selectedTestCase = pendingTestCase;

		cache = new CacheMemory(wordsPerBlockInput, numCacheLinesInput, catNs, matNs);
		cacheMemory = [];
		sramdata = [];
		logEntries = [];
		inserts = [];

		cacheMemory = [...cacheMemory];
		sramdata = [...sramdata];
		logEntries = [...logEntries];
		inserts = [...inserts];

		curr = 0;
		step_num = 1;
		numHits = 0;
		numMisses = 0;
		TAT = 0;
		AAT = 0;

		const n = numCacheLinesInput;

		if (selectedTestCase === '2n*2') {
			for (let repeat = 0; repeat < 2; ++repeat) {
				for (let i = 0; i < 2 * n; ++i) {
					inserts.push(i);
				}
			}
		} else if (selectedTestCase === '(n+2n)*2') {
			for (let i = 0; i < n; ++i) inserts.push(i);
			for (let i = 1; i < 2 * n; ++i) inserts.push(i);
			for (let i = 0; i < n; ++i) inserts.push(i);
			for (let i = 1; i < 2 * n; ++i) inserts.push(i);
		} else if (selectedTestCase === 'custom') {
			if (customTestCase.trim().length > 0) {
				inserts = customTestCase
					.split(',')
					.map(s => parseInt(s.trim()))
					.filter(n => !isNaN(n));
			}
		}

		console.log("Reset Success");
	}




</script>

<div class="h-full w-full bg-base-300">
	<h1 class="text-center text-2xl font-bold">Cache Simulator</h1>
	<div class=" w-full">
		<div class="flex flex-row justify-center gap-2">
			<ActionLogs logs={logEntries} />
			<TableMemory tableLength={numCacheLines / 4} setSize={4} items={cacheMemory}></TableMemory>
			<SRAMTable addressBits={10} blockSize={1} items={sramdata} />
		</div>
		<div class="divider"></div>
		<div class="flex flex-row justify-center gap-2">
			<div class="rounded-2xl border border-black bg-base-100 px-4 py-3 shadow-md space-y-2 max-w-md">
				<h1 class="text-xl font-semibold text-center">Cache Simulation Project</h1>
				<p class="text-center text-sm text-gray-600">by CSARCH2 S12 · Group 1</p>
			  
				<div>
				  <h2 class="font-medium text-base underline mb-1">Specs</h2>
				  <ol class="list-decimal list-inside text-sm space-y-1">
					<li>4-way Block Set Associative LRU</li>
					<li>Read Policy: Non-Load-Through</li>
				  </ol>
				</div>
			</div>
			<div class="flex flex-row gap-8 rounded-xl border border-black bg-base-100 p-1">
				<div>
					Input Params
					<div class="flex flex-col">
						<fieldset class="fieldset">
							<legend class="fieldset-legend">words per block (m)</legend>
							<input
								type="number"
								class="input"
								placeholder="Type here"
								bind:value={wordsPerBlockInput}
							/>
						</fieldset>
						<fieldset class="fieldset">
							<legend class="fieldset-legend">blocks in CM (n)</legend>
							<input
								type="number"
								class="input"
								placeholder="Type here"
								bind:value={numCacheLinesInput}
							/>
						</fieldset>
						<fieldset class="fieldset">
							<legend class="fieldset-legend">CAT in ns</legend>
							<input type="number" class="input" placeholder="Type here" bind:value={catNs} />
						</fieldset>
						<fieldset class="fieldset">
							<legend class="fieldset-legend">MAT in ns</legend>
							<input type="number" class="input" placeholder="Type here" bind:value={matNs} />
						</fieldset>
					</div>
				</div>
				<div>
					Test Case
					<div class="flex flex-col items-start gap-2">
						<fieldset class="fieldset flex flex-col items-start gap-2">
							<label class="inline-flex items-center gap-2">
							  <input
								type="radio"
								class="radio size-4 radio-primary"
								name="testcase"
								bind:group={pendingTestCase}
								value="2n*2"
							  />
							  <span>2n * 2</span>
							</label>
						  
							<label class="inline-flex items-center gap-2">
							  <input
								type="radio"
								class="radio size-4 radio-primary"
								name="testcase"
								bind:group={pendingTestCase}
								value="(n+2n)*2"
							  />
							  <span>(n + 2n) * 2</span>
							</label>
						  
							<label class="inline-flex items-center gap-2">
							  <input
								type="radio"
								class="radio size-4 radio-primary"
								name="testcase"
								bind:group={pendingTestCase}
								value="custom"
							  />
							  <span>Custom</span>
							</label>
						  
							<input
							  type="text"
							  class="input w-full"
							  placeholder="Type here"
							  bind:value={customTestCase}
							  disabled={pendingTestCase !== 'custom'}
							/>
							
							<button 
							  onclick={resetSimulationState} 
							  class="btn btn-primary mt-2"
							>
							  Apply Test Case
							</button>
						  </fieldset>
						  
					</div>
				</div>
			</div>
			<div
				class="flex-col justify-center rounded-xl border border-black bg-base-100 p-1 text-center"
			>
				Step {step_num}
				{#if isFinalStep}
					<p class="text-xs text-red-500">Final step reached</p>
				{/if}
				<div class="flex flex-row">
					<button class="btn btn-xs" onclick={addNext}>Next</button>
				</div>
				<button class="btn btn-xs" onclick={runToFinalStep}>Final Snapshot</button>

				<div class="divider"></div>

				<div class="flex flex-col">
					<p>Access Count: {numHits + numMisses}</p>
					<p>Hits: {numHits}</p>
					<p>Misses: {numMisses}</p>
					<p>Hit Rate: {isNaN(numHits / (numHits + numMisses)) ? '0.00' : ((numHits / (numHits + numMisses)) * 100).toFixed(2)}%</p>
					<p>Miss Rate: {isNaN(numMisses / (numHits + numMisses)) ? '0.00' : ((numMisses / (numHits + numMisses)) * 100).toFixed(2)}%</p>
                    <div class="divider"></div>
                    <p>Access Times</p>
                    <p>Average: {AAT.toFixed(2)}ns</p>
                    <p>Total: {TAT.toFixed(2)}ns</p>
					<p><br></p>
				</div>
			</div>
		</div>
	</div>
</div>
