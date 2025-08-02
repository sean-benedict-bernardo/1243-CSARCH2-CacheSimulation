<script lang="ts">
	import { CacheMemory } from '$lib/Cache.js';
	import TableMemory from '$lib/TableCacheMemory.svelte';
	import SRAMTable from '$lib/TableSRAM.svelte';
	import ActionLogs from '$lib/TableActionLogs.svelte';
	import { onMount } from 'svelte';

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

    $: if (wordsPerBlockInput !== wordsPerBlock || numCacheLinesInput !== numCacheLines) {
        const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;

        // verify that wordsPerBlockInput is a power of 2 and at least 2
        if (wordsPerBlockInput < 2) {
            throw new Error('Words per block must be at least 2.');
        } else if (!isPowerOfTwo(wordsPerBlockInput)) {
            throw new Error('Words per block must be a power of 2.');
		}

		// verify that number of blocks is
		// a power of 2 and at least than 4
		if (numCacheLinesInput < 4 || !isPowerOfTwo(numCacheLinesInput)) {
			throw new Error('Number of cache lines must be a power of 2.');
		}

		cache = new CacheMemory(wordsPerBlockInput, numCacheLinesInput, catNs, matNs);
		cacheMemory = [];
		sramdata = [];
		logEntries = [];
		curr = 0;
		step_num = 1;
	}

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

	let cache = new CacheMemory(wordsPerBlockInput, numCacheLinesInput, catNs, matNs);

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
		cacheMemory = [
			...cacheMemory,
			{
				set_number: newBlock.setNumber,
				set_block_number: newBlock.blockNumber,
				main_memory_block: memBlk,
				step: step_num
			}
		];

		sramdata = [
			...sramdata,
			{
				block: memBlk,
				step: step_num
			}
		];

		logEntries = [
			...logEntries,
			{
				hit: newBlock.status === 'Hit',
				action: newBlock.status === 'Hit' ? `Read Block ${memBlk}` : `Load Block ${memBlk}`,
				time: step_num
			}
		];

		const stats = cache.getStats();
		numHits = stats.hits;
		numMisses = stats.misses;

		curr = (curr + 1) % inserts.length;
		step_num += 1;

        TAT = cache.calculateTotalAccessTime();
        AAT = cache.calculateAverageAccessTime();

		console.log(sramdata);
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
			<div class="rounded-xl border border-black bg-base-100 p-1">
				<p>Cache Simulation Proj.</p>
				<p>by CSARCH2 S12 Grp1</p>

				Specs:
				<ol type="1">
					<li>4-way Block Set Associative LRU</li>
					<li>Read Policy: NLT</li>
				</ol>
			</div>
			<div class="flex flex-row gap-0.5 rounded-xl border border-black bg-base-100 p-1">
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
						<fieldset class="fieldset">
							<legend class="fieldset-legend">
								<input
									type="radio"
									class="radio size-4 radio-primary"
									name="testcase"
									bind:group={selectedTestCase}
									value="2n*2"
									checked
								/>
								2n * 2
							</legend>
							<legend class="fieldset-legend">
								<input
									type="radio"
									class="radio size-4 radio-primary"
									name="testcase"
									bind:group={selectedTestCase}
									value="(n+2n)*2"
								/>
								(n + 2n) * 2
							</legend>
							<legend class="fieldset-legend">
								<input
									type="radio"
									class="radio size-4 radio-primary"
									name="testcase"
									bind:group={selectedTestCase}
									value="custom"
								/>
								Custom
							</legend>

							<input
								type="text"
								class="input"
								placeholder="Type here"
								bind:value={customTestCase}
								disabled={selectedTestCase !== 'custom'}
							/>
						</fieldset>
					</div>
				</div>
			</div>
			<div
				class="flex-col justify-center rounded-xl border border-black bg-base-100 p-1 text-center"
			>
				Step {step_num}
				<div class="flex flex-row">
					<button class="btn btn-xs" onclick={addNext}>Next</button>
				</div>
				<button class="btn btn-xs">Final Snapshot</button>

				<div class="divider"></div>

				<div class="flex flex-col">
					<p>Hits: {numHits}</p>
					<p>Misses: {numMisses}</p>
					<p>Hit Rate: {isNaN(numHits / (numHits + numMisses)) ? '0.00' : ((numHits / (numHits + numMisses)) * 100).toFixed(2)}%</p>
                    <div class="divider"></div>
                    <p>Access Times</p>
                    <p>Average: {AAT}</p>
                    <p>Total: {TAT}</p>
				</div>
			</div>
		</div>
	</div>
</div>
