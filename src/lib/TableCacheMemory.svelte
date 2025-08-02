<script lang="ts">
  export let items: { 
    set_number: number;
    set_block_number: number; 
    main_memory_block: number;

    step: number;
  }[] = [];
  export let tableLength: number;
  export let setSize: number;

  function padZero(n: number, width = 2) {
    return n.toString().padStart(width, '0');
  } 

  function getBlockSetId(set: number, block: number) {
      return `data_${padZero(set)}_${block}`
  }

  const makeKey = (set: number, block: number) => `${set}-${block}`;

  // Lookup map: "set-block" → item
  const itemMap = new Map(items.map(item => [makeKey(item.set_number, item.set_block_number), item]));

  // Build full fixed-size grid
  const cacheSet = Array.from({ length: tableLength }, (_, setIdx) => {
    const rows = Array.from({ length: setSize }, (_, blockIdx) => {
      const key = makeKey(setIdx, blockIdx);
      return {
        set_number: setIdx,
        set_block_number: blockIdx,
        key,
        item: itemMap.get(key) ?? {
          set_number: setIdx,
          set_block_number: blockIdx,
          main_memory_block: '-',
          data: 0,
          step: '-'
        }

      };
    });
    return {
      set_number: setIdx,
      rows
    };
  });

  // Get last 3 data items
  const highlightItems = items.slice(-3);
  const highlightMap = new Map<string, string>();

  highlightItems.forEach((item, idx) => {
    const key = makeKey(item.set_number, item.set_block_number);
    const classes = ['bg-yellow-900', 'bg-yellow-700', 'bg-yellow-600'];
    highlightMap.set(key, classes[highlightItems.length - 1 - idx]);
  });
  console.log(highlightMap)
  const getHighlightClass = (key: string) => {
      return highlightMap.get(key) ?? ''
    };
</script>

<div class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100 max-h-[400px] overflow-y-scroll ">
  <table class="table border-collapse w-full bg-base-100">
    <thead class="sticky top-0 z-10 bg-base-200">
      <tr class="border border-black ">
        <th class="p-2 border border-black">Set</th>
        <th class="p-2">Block</th>
        <th class="p-2">MM block</th>

        <th class="p-2">Step</th>
      </tr>
    </thead>
    <tbody>
      {#each cacheSet as set, setIdx}
        {#each set.rows as row, rowIdx}
          <tr class="border border-black {getHighlightClass(row.key)}">
            {#if rowIdx === 0}
              <td class="text-center border border-black" rowspan={setSize}>
                {set.set_number}
              </td>
            {/if}
            <td class="text-center border border-black">{row.set_block_number}</td>
            <td class="text-center border border-black" id={getBlockSetId(setIdx, rowIdx)}>{row.item?.main_memory_block ?? ''}</td>
            <td class="text-center border border-black">{row.item?.step ?? ''}</td>
          </tr>
        {/each}
      {/each}
    </tbody>
  </table>
</div>