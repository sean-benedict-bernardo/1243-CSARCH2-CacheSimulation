<script lang="ts">
  export let items: {
    set_number: number;
    set_block_number: number;
    main_memory_block: number;
    step: number;
    hit?: boolean;
  }[] = [];

  export let tableLength: number;
  export let setSize: number;

  function padZero(n: number, width = 2) {
    return n.toString().padStart(width, '0');
  }

  function getBlockSetId(set: number, block: number) {
    return `data_${padZero(set)}_${block}`;
  }

  // Create a unique key for each set-block combination
  const makeKey = (set: number, block: number) => `${set}-${block}`;

  // Map items by their set-block key for quick lookup
  $: itemLookup = new Map(
    items.map(item => [
      makeKey(item.set_number, item.set_block_number), 
      item
    ])
  );

  // Generate the complete cache structure
  $: cacheStructure = Array.from({ length: tableLength }, (_, setIndex) => ({
    setNumber: setIndex,
    blocks: Array.from({ length: setSize }, (_, blockIndex) => {
      const key = makeKey(setIndex, blockIndex);
      const item = itemLookup.get(key);
      
      return {
        setNumber: setIndex,
        blockNumber: blockIndex,
        key,
        mainMemoryBlock: item?.main_memory_block ?? '-',
        step: item?.step ?? '-'
      };
    })
  }));

  // Get recent items for highlighting (last 5) and detect hits
  $: recentItemsWithHits = (() => {
    const recent = items.slice(-5);
    const seenKeys = new Set<string>();
    
    return recent.map(item => {
      const key = makeKey(item.set_number, item.set_block_number);
      const isHit = item.hit ?? seenKeys.has(key); // Use explicit hit or detect repetition
      seenKeys.add(key);
      
      return { ...item, isHit, key };
    }).reverse(); // Most recent first for highlighting
  })();

  // Color classes for hits and misses
  const hitColors = ['bg-green-600/100', 'bg-green-600/70', 'bg-green-600/40', 'bg-green-600/10', 'bg-green-600/5'];
  const missColors = ['bg-yellow-600/100', 'bg-yellow-600/70', 'bg-yellow-600/40', 'bg-yellow-600/10', 'bg-yellow-600/5'];

  // Create highlight mapping - handle multiple entries for same key by using the most recent occurrence
  $: highlightMap = (() => {
    const map = new Map<string, string>();
    
    // Process from oldest to newest (end to start of reversed array)
    // so that newer highlights override older ones
    for (let i = recentItemsWithHits.length - 1; i >= 0; i--) {
      const item = recentItemsWithHits[i];
      const colors = item.isHit ? hitColors : missColors;
      map.set(item.key, colors[i]);
    }
    
    return map;
  })();

  // Helper function to get highlight class
  const getHighlightClass = (key: string) => highlightMap.get(key) ?? '';
</script>

<div class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100 max-h-[400px] overflow-y-scroll">
  <table class="table border-collapse w-full bg-base-100">
    <thead class="sticky top-0 z-10 bg-base-200">
      <tr class="border border-black">
        <th class="p-2 border border-black">Set</th>
        <th class="p-2 border border-black">Block</th>
        <th class="p-2 border border-black">MM block</th>
        <th class="p-2 border border-black">Step</th>
      </tr>
    </thead>
    <tbody>
      {#each cacheStructure as set}
        {#each set.blocks as block, blockIndex}
          <tr class="border border-black {getHighlightClass(block.key)}">
            {#if blockIndex === 0}
              <td class="text-center border border-black" rowspan={setSize}>
                {set.setNumber}
              </td>
            {/if}
            <td class="text-center border border-black">{block.blockNumber}</td>
            <td class="text-center border border-black" id={getBlockSetId(set.setNumber, blockIndex)}>
              {block.mainMemoryBlock}
            </td>
            <td class="text-center border border-black">{block.step}</td>
          </tr>
        {/each}
      {/each}
    </tbody>
  </table>
</div>