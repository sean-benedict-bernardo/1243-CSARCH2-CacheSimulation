<script lang="ts">
	import { CacheMemory } from '$lib/Cache.js';
	import TableMemory from '$lib/TableCacheMemory.svelte';
	import SRAMTable from '$lib/TableSRAM.svelte';
	import ActionLogs from '$lib/TableActionLogs.svelte';
	import { onMount } from 'svelte';
	import { exportLogs, createLogs } from '$lib/ExportLogs.js'

	// Audio Context and Sound Effects
	let audioContext: AudioContext | null = null;
	let isSoundEnabled: boolean = true;

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

	let sramdata: { block: number; step: number; hit: boolean; }[] = [];

	let logEntries: { hit: boolean; action: string; }[] = [];

	let cache = new CacheMemory(wordsPerBlockInput, numCacheLinesInput, catNs, matNs);

	// Check if final step already reached
	$: isFinalStep = inserts.length > 0 && curr >= inserts.length;

	// Stop playing when final step is reached
	$: if (isFinalStep && isPlaying) {
		stopPlay();
	}

	// Initialize Audio Context
	function initAudioContext() {
		if (!audioContext) {
			audioContext = new (window.AudioContext)();
		}
		return audioContext;
	}

	// Sound effect for cache hit (higher pitch, shorter duration)
	function playCacheHitSound() {
		if (!isSoundEnabled) return;
		
		const ctx = initAudioContext();
		const oscillator = ctx.createOscillator();
		const gainNode = ctx.createGain();
		
		oscillator.connect(gainNode);
		gainNode.connect(ctx.destination);
		
		// Quick, pleasant beep for cache hit
		oscillator.frequency.setValueAtTime(800, ctx.currentTime);
		oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
		
		gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
		
		oscillator.type = 'sine';
		oscillator.start(ctx.currentTime);
		oscillator.stop(ctx.currentTime + 0.15);
	}

	// Sound effect for cache miss (lower pitch, longer duration)
	function playCacheMissSound() {
		if (!isSoundEnabled) return;
		
		const ctx = initAudioContext();
		const oscillator = ctx.createOscillator();
		const gainNode = ctx.createGain();
		
		oscillator.connect(gainNode);
		gainNode.connect(ctx.destination);
		
		// Deeper, longer sound for cache miss
		oscillator.frequency.setValueAtTime(300, ctx.currentTime);
		oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
		
		gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
		
		oscillator.type = 'sawtooth';
		oscillator.start(ctx.currentTime);
		oscillator.stop(ctx.currentTime + 0.4);
	}

	// Alternative: White noise burst for cache miss
	function playCacheMissNoise() {
		if (!isSoundEnabled) return;
		
		const ctx = initAudioContext();
		const bufferSize = ctx.sampleRate * 0.2; // 200ms of noise
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const output = buffer.getChannelData(0);
		
		// Generate white noise
		for (let i = 0; i < bufferSize; i++) {
			output[i] = Math.random() * 2 - 1;
		}
		
		const source = ctx.createBufferSource();
		const gainNode = ctx.createGain();
		const filter = ctx.createBiquadFilter();
		
		source.buffer = buffer;
		source.connect(filter);
		filter.connect(gainNode);
		gainNode.connect(ctx.destination);
		
		// Low-pass filter to make it less harsh
		filter.type = 'lowpass';
		filter.frequency.setValueAtTime(400, ctx.currentTime);
		
		gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
		
		source.start(ctx.currentTime);
		source.stop(ctx.currentTime + 0.2);
	}

	// Play completion sound when simulation finishes
	function playCompletionSound() {
		if (!isSoundEnabled) return;
		
		const ctx = initAudioContext();
		
		// Play a rising chord progression
		const frequencies = [523.25, 659.25, 783.99]; // C, E, G notes
		
		frequencies.forEach((freq, index) => {
			const oscillator = ctx.createOscillator();
			const gainNode = ctx.createGain();
			
			oscillator.connect(gainNode);
			gainNode.connect(ctx.destination);
			
			oscillator.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.2);
			gainNode.gain.setValueAtTime(0.05, ctx.currentTime + index * 0.2);
			gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.2 + 0.3);
			
			oscillator.type = 'sine';
			oscillator.start(ctx.currentTime + index * 0.2);
			oscillator.stop(ctx.currentTime + index * 0.2 + 0.3);
		});
	}

	function padZero(n: number, width = 2) {
		return n.toString().padStart(width, '0');
	}

	function getBlockSetId(set: number, block: number) {
		return `data_${padZero(set)}_${block}`;
	}

	let whyShouldIInvestInQuantumComputing = [] as {
			ctr: number;
			status: string;
			setNumber: number;
			blockNumber: number;
			memBlkNum: number;
			replacedBlock: number | null;
		}[]

	function downloadLogs(){
		exportLogs(whyShouldIInvestInQuantumComputing)
	}

	function addNext() {
		if (curr >= inserts.length) {
			// Optional: Show a message or disable the button
			console.log("Simulation complete. No more steps.");
			playCompletionSound()
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

		whyShouldIInvestInQuantumComputing = [
			...whyShouldIInvestInQuantumComputing,
			newBlock	
		]
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
					: `Load Block ${memBlk}`
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

		playCacheMissNoise()
		newBlock.status === "Hit" ? playCacheHitSound () : playCacheMissSound()

		console.log(sramdata);
	}

	function runToFinalStep() {
		stopPlay(); // Stop play mode if running
		while (curr < inserts.length) {
			addNext();
		}

		playCompletionSound()
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

	async function play() {
		if (isPlaying) {
			stopPlay();
			return;
		}

		if (isFinalStep) {
			console.log("Simulation already complete.");
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
		console.log("Reset Started");

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
		whyShouldIInvestInQuantumComputing = [],
		
		cacheMemory = [...cacheMemory];
		sramdata = [...sramdata];
		logEntries = [...logEntries];
		inserts = [...inserts];
		whyShouldIInvestInQuantumComputing = [...whyShouldIInvestInQuantumComputing]

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

	// Cleanup on component destroy
	onMount(() => {
		return () => {
			stopPlay();
		};
	});

</script>

<div class="h-full w-full bg-base-300">
	<h1 class="text-center text-2xl font-bold">Cache Simulator</h1>
	<div class=" w-full">
		<div class="flex flex-row justify-center gap-4">
			<ActionLogs logs={logEntries} />
			<TableMemory tableLength={numCacheLines / 4} setSize={4} items={cacheMemory}></TableMemory>
			<SRAMTable addressBits={10} blockSize={1} items={sramdata} />
		</div>
		<div class="divider m-1"></div>
		<div class="flex flex-row justify-center gap-4">
			<div class="rounded-2xl border border-black bg-base-100 p-4 shadow-md space-y-2 max-w-md">
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
			<div class="flex flex-row gap-8 rounded-xl border border-black bg-base-100 p-4">
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
								disabled={isPlaying}
							/>
						</fieldset>
						<fieldset class="fieldset">
							<legend class="fieldset-legend">blocks in CM (n)</legend>
							<input
								type="number"
								class="input"
								placeholder="Type here"
								bind:value={numCacheLinesInput}
								disabled={isPlaying}
							/>
						</fieldset>
						<fieldset class="fieldset">
							<legend class="fieldset-legend">CAT in ns</legend>
							<input 
								type="number" 
								class="input" 
								placeholder="Type here" 
								bind:value={catNs}
								disabled={isPlaying}
							/>
						</fieldset>
						<fieldset class="fieldset">
							<legend class="fieldset-legend">MAT in ns</legend>
							<input 
								type="number" 
								class="input" 
								placeholder="Type here" 
								bind:value={matNs}
								disabled={isPlaying}
							/>
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
								disabled={isPlaying}
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
								disabled={isPlaying}
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
								disabled={isPlaying}
							  />
							  <span>Custom</span>
							</label>
						  
							<input
							  type="text"
							  class="input w-full"
							  placeholder="Type here"
							  bind:value={customTestCase}
							  disabled={pendingTestCase !== 'custom' || isPlaying}
							/>
							
							<button 
							  onclick={resetSimulationState} 
							  class="btn btn-primary mt-2"
							  disabled={isPlaying}
							>
							  Apply Test Case
							</button>
						  </fieldset>
						  
					</div>
				</div>
			</div>
			<div
				class="flex-col justify-center rounded-xl border border-black bg-base-100 p-4 text-center"
			>
				Step {step_num}
				{#if isFinalStep}
					<p class="text-xs text-red-500">Final step reached</p>
				{/if}
				{#if isPlaying}
					<p class="text-xs text-green-500">Playing...</p>
				{/if}
				<div class="flex flex-row justify-center gap-1">
					<button 
						class="btn btn-xs {isPlaying ? 'btn-warning' : 'btn-success'}" 
						onclick={play}
						disabled={isFinalStep && !isPlaying}
					>
						{isPlaying ? 'Stop' : 'Play'}
					</button>
					<button 
						class="btn btn-xs" 
						onclick={handleNext}
						disabled={isPlaying || isFinalStep}
					>
						Next
					</button>
					<button 
						class="btn btn-xs" 
						onclick={downloadLogs}
					>
						Download
					</button>
				</div>
				<button 
					class="btn btn-xs" 
					onclick={runToFinalStep}
					disabled={isPlaying || isFinalStep}
				>
					Final Snapshot
				</button>

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