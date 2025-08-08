<script>
	export let step_num;
	export let isFinalStep;
	export let isPlaying;
	export let selectedTestCase;

	export let play;
	export let handleNext;
	export let runToFinalStep;
	export let downloadLogs;

	export let numHits;
	export let numMisses;
	export let AAT;
	export let TAT;
</script>

<div class="flex-col justify-center rounded-xl border border-black bg-base-100 p-4 text-center">
	Step {step_num - 1}

	{#if isFinalStep}
		<p class="text-xs text-red-500">Final step reached</p>
	{:else if isPlaying}
		<p class="text-xs text-green-500">Playing...</p>
	{:else}
		<p class="text-xs text-gray-500">
			{selectedTestCase === '' ? 'Apply a Test Case' : 'Ready'}
		</p>
	{/if}

	<div class="divider" style="margin: 0.125rem;"></div>

	<div class="flex flex-col justify-center gap-1">
		<button
			class="btn btn-xs {isPlaying ? 'btn-warning' : 'btn-success'}"
			on:click={play}
			disabled={(isFinalStep && !isPlaying) || selectedTestCase === ''}
		>
			{isPlaying ? 'Stop' : 'Play'}
		</button>
		<button class="btn btn-xs" on:click={handleNext} disabled={selectedTestCase === '' || isPlaying || isFinalStep}>
			Go to Next Step
		</button>
		<button class="btn btn-xs" on:click={runToFinalStep} disabled={selectedTestCase === '' || isPlaying || isFinalStep}>
			Skip to Final Step
		</button>
		<button class="btn btn-xs" on:click={downloadLogs} disabled={isPlaying || step_num - 1 === 0}>
			Download Text Logs
		</button>
	</div>

	<div class="divider" style="margin: 0.125rem;"></div>

	<div class="grid grid-cols-2">
		<p class="text-right text-xs">Access Count:</p>
		<p class="text-xs">{numHits + numMisses}</p>

		<p class="text-right text-xs">Hits:</p>
		<p class="text-xs">{numHits}</p>

		<p class="text-right text-xs">Misses:</p>
		<p class="text-xs">{numMisses}</p>

		<p class="text-right text-xs">Hit Rate:</p>
		<p class="text-xs">
			{isNaN(numHits / (numHits + numMisses))
				? '0.00'
				: ((numHits / (numHits + numMisses)) * 100).toFixed(2)}%
		</p>

		<p class="text-right text-xs">Miss Rate:</p>
		<p class="text-xs">
			{isNaN(numMisses / (numHits + numMisses))
				? '0.00'
				: ((numMisses / (numHits + numMisses)) * 100).toFixed(2)}%
		</p>

		<div class="col-span-full divider" style="margin: 0.125rem;"></div>

		<p class="text-right text-xs">Average Access Time:</p>
		<p class="text-xs">{AAT.toFixed(2)}ns</p>

		<p class="text-right text-xs">Total Access Time:</p>
		<p class="text-xs">{TAT.toFixed(2)}ns</p>
	</div>
</div>
