<script lang="ts">
	import { CacheMemory } from '$lib/Cache.js';
	import TableMemory from '$lib/TableCacheMemory.svelte';
	import SRAMTable from '$lib/TableSRAM.svelte';
	import ActionLogs from '$lib/TableActionLogs.svelte';
	import { onMount } from 'svelte';
	import { exportLogs, createLogs } from '$lib/ExportLogs.js';

	import {
		playCacheHitSound,
		playCacheMissSound,
		playCompletionSound,
		playCacheMissNoise
	} from '$lib/SoundEffects.js';
	import MenuTitle from '$lib/MenuTitle.svelte';
	import MenuConfig from '$lib/MenuConfig.svelte';
	import MenuControllerStats from '$lib/MenuControllerStats.svelte';

	// Audio Context and Sound Effects
	let audioContext: AudioContext | null = null;
	let isSoundEnabled: boolean = true;

	let pendingTestCase: string = '';

	let selectedTestCase: string = '';
	let customTestCase: string = '';
	let randomLengthTestCase: number = 16;

	const SRAM_BLOCKS = 16;
	let wordsPerBlock = 2;
	let numCacheLines = 8;

	// Reactive Inputs
	let wordsPerBlockInput: number = wordsPerBlock;
	let numCacheLinesInput: number = numCacheLines;
	let catNs: number = 5;
	let matNs: number = 10;

	// Play button timing constant
	const playNs: number = 100; // Base delay for play mode in nanoseconds

	let numHits: number = 0;
	let numMisses: number = 0;

	let TAT: number = 0; // Total Access Time
	let AAT: number = 0; // Average Access Time

	// Play mode state
	let isPlaying: boolean = false;
	let playTimeoutId: number | null = null;

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

	let sramdata: { block: number; step: number; hit: boolean }[] = [];

	let logEntries: { hit: boolean; action: string }[] = [];

	let cache = new CacheMemory(wordsPerBlockInput, numCacheLinesInput, catNs, matNs);

	// Check if final step already reached
	$: isFinalStep = inserts.length > 0 && curr >= inserts.length;

	// Stop playing when final step is reached
	$: if (isFinalStep && isPlaying) {
		stopPlay();
	}

	let whyShouldIInvestInQuantumComputing = [] as {
		ctr: number;
		status: string;
		setNumber: number;
		blockNumber: number;
		memBlkNum: number;
		replacedBlock: number | null;
	}[];

	function downloadLogs() {
		if (whyShouldIInvestInQuantumComputing.length === 0) {
			alert('No logs to export. Please run the simulation first.');
			return;
		}

		const accessCount = numHits + numMisses;

		const bingchilling = {
			accessCount,
			numHits,
			numMisses,
			hitRate: isNaN(numHits / accessCount) ? 0 : (numHits / accessCount) * 100,
			missRate: isNaN(numMisses / accessCount) ? 0 : (numMisses / accessCount) * 100,
			TAT,
			AAT
		};

		exportLogs(whyShouldIInvestInQuantumComputing, bingchilling);
	}

	function addNext(isFinalSnapshot: boolean = false) {
		if (curr >= inserts.length) {
			// Optional: Show a message or disable the button
			console.log('Simulation complete. No more steps.');
			playCompletionSound(audioContext, isSoundEnabled);
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

		whyShouldIInvestInQuantumComputing = [...whyShouldIInvestInQuantumComputing, newBlock];
		// REASSIGN to trigger reactivity
		cacheMemory = [
			...cacheMemory,
			{
				set_number: newBlock.setNumber,
				set_block_number: newBlock.blockNumber,
				main_memory_block: memBlk,
				step: step_num,
				hit: newBlock.status === 'Hit'
			}
		];

		sramdata = [
			...sramdata,
			{
				block: memBlk,
				step: step_num,
				hit: newBlock.status === 'Hit'
			}
		];

		logEntries = [
			...logEntries,
			{
				hit: newBlock.status === 'Hit',
				action: newBlock.status === 'Hit' ? `Read Block ${memBlk}` : `Load Block ${memBlk}`
			}
		];

		const stats = cache.getStats() as {
			hits: number;
			misses: number;
		};

		numHits = stats.hits;
		numMisses = stats.misses;

		curr += 1;
		step_num += 1;

		TAT = cache.calculateTotalAccessTime();
		AAT = cache.calculateAverageAccessTime();

		if (isFinalSnapshot) return;

		newBlock.status === 'Hit'
			? playCacheHitSound(audioContext, isSoundEnabled)
			: playCacheMissSound(audioContext, isSoundEnabled);
	}

	function runToFinalStep() {
		stopPlay(); // Stop play mode if running
		while (curr < inserts.length) {
			addNext(true);
		}

		playCompletionSound(audioContext, isSoundEnabled);
	}

	function calculatePlayDelay(): number {
		// Calculate delay based on whether the next operation will be a hit or miss
		if (curr >= inserts.length) return 0;

		const memBlk = inserts[curr];
		// Preview if this will be a hit or miss without actually inserting
		const wouldBeHit = cache.wouldHit(memBlk);

		// Use CAT for hits, MAT for misses, plus base play delay
		const accessTime = wouldBeHit ? catNs : matNs;

		// Convert nanoseconds to milliseconds for setTimeout (1ms = 1,000,000ns)
		// Scale down for reasonable visualization speed
		return (accessTime + playNs) / 1000; // Divide by 1000 to make it reasonable for UI
	}

	// Initialize Audio Context
	function initAudioContext() {
		if (!audioContext) {
			audioContext = new window.AudioContext();
		}
		return audioContext;
	}

	async function play() {
		if (selectedTestCase === '') {
			alert('Please select a test case before playing.');
			return;
		} else if (inserts.length === 0) {
			alert('Memory sequence is empty. Please add memory blocks.');
			return;
		}

		if (isPlaying) {
			stopPlay();
			return;
		}

		if (isFinalStep) {
			playCompletionSound(audioContext, isSoundEnabled);
			console.log('Simulation already complete.');
			return;
		}

		isPlaying = true;
		scheduleNextStep();
	}

	function scheduleNextStep() {
		if (!isPlaying || isFinalStep) {
			stopPlay();
			return;
		}

		const delay = calculatePlayDelay();

		playTimeoutId = window.setTimeout(() => {
			if (isPlaying && !isFinalStep) {
				addNext();
				scheduleNextStep(); // Schedule the next step
			}
		}, delay);
	}

	function stopPlay() {
		isPlaying = false;
		if (playTimeoutId !== null) {
			clearTimeout(playTimeoutId);
			playTimeoutId = null;
		}
	}

	function handleNext() {
		stopPlay(); // Stop play mode when manually stepping
		addNext();
	}

	// TODO: Reset Orange Shades
	function resetSimulationState() {
		console.log('Reset Started');

		stopPlay(); // Stop play mode when resetting

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
		((whyShouldIInvestInQuantumComputing = []), (cacheMemory = [...cacheMemory]));
		sramdata = [...sramdata];
		logEntries = [...logEntries];
		inserts = [...inserts];
		whyShouldIInvestInQuantumComputing = [...whyShouldIInvestInQuantumComputing];

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
		} else if (selectedTestCase === 'random') {
			if (randomLengthTestCase <= 0 || isNaN(randomLengthTestCase)) {
				alert('Please enter a valid positive number for random length.');
				return;
			}
			let i = randomLengthTestCase;
			while (i--) {
				inserts.push(Math.floor(Math.random() * 1023));
			}
		} else if (selectedTestCase === 'custom') {
			if (customTestCase.trim().length > 0) {
				inserts = customTestCase
					.split(',')
					.map((s) => Math.floor(parseFloat(s.trim())))
					.filter((n) => !isNaN(n) && 0 <= n && n <= 1023);
			}
		}

		initAudioContext();
		console.log('Reset Success');
	}

	// Cleanup on component destroy
	onMount(() => {
		initAudioContext();
		return () => {
			stopPlay();
		};
	});
</script>

<div class="h-full w-full bg-base-300">
	<h1 class="p-2 text-center text-2xl font-bold">Cache Simulator</h1>
	<div class=" w-full">
		<div class="flex flex-row justify-center gap-4">
			<ActionLogs logs={logEntries} />
			<TableMemory tableLength={numCacheLines / 4} setSize={4} items={cacheMemory}></TableMemory>
			<SRAMTable addressBits={10} blockSize={1} items={sramdata} />
		</div>
		<div class="divider m-1"></div>
		<div class="flex flex-row justify-center gap-4">
			<MenuTitle />
			<MenuConfig
				bind:wordsPerBlockInput
				bind:numCacheLinesInput
				bind:catNs
				bind:matNs
				bind:pendingTestCase
				bind:randomLengthTestCase
				bind:customTestCase
				{inserts}
				{isPlaying}
				{resetSimulationState}
			/>
			<MenuControllerStats
				{step_num}
				{isFinalStep}
				{isPlaying}
				{selectedTestCase}
				{numHits}
				{numMisses}
				{AAT}
				{TAT}
				{play}
				{handleNext}
				{runToFinalStep}
				{downloadLogs}
			/>
		</div>
	</div>
</div>
