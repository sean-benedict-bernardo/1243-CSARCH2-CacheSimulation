<script>
	export let wordsPerBlockInput;
	export let numCacheLinesInput;
	export let catNs;
	export let matNs;
	export let pendingTestCase;
	export let randomLengthTestCase;
	export let customTestCase;
	export let inserts = [];

	export let isPlaying = false;
	export let resetSimulationState = () => {};
</script>

<div class="flex flex-row gap-8 rounded-xl border border-black bg-base-100 p-4">
	<div>
		Input Parameters
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
					on:input={() => {
						if (catNs < 1 || isNaN(catNs)) catNs = 1;
					}}
					min="1"
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
					on:input={() => {
						if (matNs < 1 || isNaN(matNs)) matNs = 1;
					}}
					min="1"
					disabled={isPlaying}
				/>
			</fieldset>
		</div>
	</div>

	<div class="w-[15rem]">
		Test Case
		<div class="flex w-full flex-col items-start gap-2">
			<fieldset class="fieldset flex w-full flex-col items-start gap-2">
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
						value="random"
						disabled={isPlaying}
					/>
					<span>Random (w/ given length)</span>
				</label>

				<input
					type="number"
					class="input w-full"
					placeholder="Type here"
					bind:value={randomLengthTestCase}
					on:input={() => {
						if (randomLengthTestCase < 1 || isNaN(randomLengthTestCase)) randomLengthTestCase = 1;
					}}
					min="1"
					disabled={pendingTestCase !== 'random' || isPlaying}
				/>

				<label class="inline-flex items-center gap-2">
					<input
						type="radio"
						class="radio size-4 radio-primary"
						name="testcase"
						bind:group={pendingTestCase}
						value="custom"
						disabled={isPlaying}
					/>
					<span>Custom (e.g. 3, 5, 8, 69, 42)</span>
				</label>

				<input
					type="string"
					class="input w-full"
					placeholder="Type here"
					bind:value={customTestCase}
					disabled={pendingTestCase !== 'custom' || isPlaying}
				/>

				<div class="mt-4 w-[15rem] max-w-xs rounded bg-base-200 p-2">
					<p class="mb-1 text-xs font-semibold">Memory Block Sequence:</p>
					<div class="min-h-[1.5em] overflow-x-auto text-xs whitespace-nowrap">
						{#if inserts.length > 0}
							{inserts.join(', ')}
						{:else}
							&nbsp;
						{/if}
					</div>
				</div>

				<div class="flex w-full justify-center">
					<button on:click={resetSimulationState} class="btn mt-2 btn-primary" disabled={isPlaying}>
						Apply Test Case
					</button>
				</div>
			</fieldset>
		</div>
	</div>
</div>
