
<script lang="ts">
  export let addressBits: number;
  export let blockSize: number;
  export let items: { block: number, step: number, hit?: boolean, sram?: boolean }[] = [];

  // Calculate total blocks in the cache
  $: totalBlocks = 2 ** addressBits / blockSize;

  // Create a map of block -> item for easy lookup
  $: blockItemMap = new Map(
    items.map(item => [item.block, item])
  );

  // Generate complete SRAM structure
  $: sramStructure = Array.from({ length: totalBlocks }, (_, blockIndex) => {
    const item = blockItemMap.get(blockIndex);
    
    return {
      block: blockIndex,
      step: item?.step ?? '-',
      item: item
    };
  });

  // Get recent items for highlighting (last 5) and detect hits
  $: recentItemsWithHits = (() => {
    const recent = items.slice(-5);
    const seenBlocks = new Set<number>();
    
    return recent.map(item => {
      const isHit = item.hit ?? seenBlocks.has(item.block);
      seenBlocks.add(item.block);
      
      return { ...item, isHit };
    }).reverse(); // Most recent first for highlighting
  })();

  // Color classes - red for hits (cache memory), yellow for misses (SRAM)
  const hitColors = ['bg-red-800/100', 'bg-red-800/70', 'bg-red-800/40', 'bg-red-800/10', 'bg-red-800/5'];
  const missColors = ['bg-yellow-600/100', 'bg-yellow-600/70', 'bg-yellow-600/40', 'bg-yellow-600/10', 'bg-yellow-600/5'];

  // Create highlight mapping - handle multiple entries for same block by using the most recent occurrence
  $: highlightMap = (() => {
    const map = new Map<number, string>();
    
    // Process from oldest to newest (end to start of reversed array)
    // so that newer highlights override older ones
    for (let i = recentItemsWithHits.length - 1; i >= 0; i--) {
      const item = recentItemsWithHits[i];
      const colors = item.isHit ? hitColors : missColors;
      map.set(item.block, colors[i]);
    }
    
    return map;
  })();

  // Helper function to get highlight class
  const getHighlightClass = (block: number) => highlightMap.get(block) ?? '';

  // Generate table rows
  $: tableRows = Array.from({ length: totalBlocks }, (_, blockIndex) => {
    return Array.from({ length: blockSize }, (_, offsetIndex) => ({
      address: blockIndex * blockSize + offsetIndex,
      block: blockIndex,
      step: sramStructure[blockIndex].step,
      highlightClass: getHighlightClass(blockIndex),
      isFirstInBlock: offsetIndex === 0,
      blockSize: blockSize
    }));
  }).flat();
</script>

<div class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100 max-h-[400px] overflow-y-scroll">
  <table class="table border-collapse w-full bg-base-100">
    <thead class="sticky top-0 z-10 bg-base-200">
      <tr class="border border-black">
        <th class="p-2 border border-black">Block</th>
        <th class="p-2 border border-black">Step</th>
      </tr>
    </thead>
    <tbody>
      {#each tableRows as row}
        <tr class={`border border-black ${row.highlightClass}`}>
          {#if row.isFirstInBlock}
            <td class="text-center border border-black" rowspan={row.blockSize}>
              {row.block}
            </td>
          {/if}
          <td class="text-center border border-black">{row.step}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>