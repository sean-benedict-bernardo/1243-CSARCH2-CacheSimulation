<script lang="ts">
  export let addressBits: number;
  export let blockSize: number;
  export let items: { block: number, step: number }[] = [];

  $: tableLength = 2 ** addressBits;

  // 🔁 Reactive stepMap based on item insertions
  $: stepMap = (() => {
    const map = new Map<number, number>();
    items.forEach(({ block, step }, index) => {
      if (!map.has(block)) {
        map.set(block, index + 1); // step = index + 1
      }
      if (!map.has(step)){
        map.set(block, step)
      }
    });
    return map;
  })();

  // 🔁 Reactive highlight mapping (last 3 blocks)
  $: highlightClasses = ['bg-yellow-600/100', 'bg-yellow-600/70', 'bg-yellow-600/40', 'bg-yellow-600/10'];
  $: last3 = items.slice(-4).map(i => i.block);
  $: highlightMap = (() => {
    const map = new Map<number, string>();
    last3.forEach((block, i) => {
      map.set(block, highlightClasses[highlightClasses.length - 1 - i]);
    });
    return map;
  })();

  type Row = {
    address: number;
    block: number;
    step?: string | number;
    highlightClass: string;
    showBlockCell: boolean;
    rowspan: number;
  };

  // 🔁 Reactive table rows based on items, stepMap, etc.
  $: tableRows = (() => {
    const rows: Row[] = [];
    for (let block = 0; block < tableLength / blockSize; block++) {
      const rowspan = blockSize;
      for (let i = 0; i < blockSize; i++) {
        const address = block * blockSize + i;
        rows.push({
          address,
          block,
          step: stepMap.get(block) ?? '-',
          highlightClass: highlightMap.get(block) ?? '',
          showBlockCell: i === 0,
          rowspan
        });
      }
    }
    return rows;
  })();
</script>


<div class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100 max-h-[400px] overflow-y-scroll ">
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
          {#if row.showBlockCell}
            <td class="text-center border border-black" rowspan={row.rowspan}>{row.block}</td>
          {/if}

          <td class="text-center border border-black">{row.step ?? ''}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
