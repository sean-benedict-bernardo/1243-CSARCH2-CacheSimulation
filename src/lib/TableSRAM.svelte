<script lang="ts">
  export let addressBits: number;
  export let blockSize: number;
  export let items: { block: number }[] = [];

  const tableLength = 2 ** addressBits;

  // Map each block to its first insertion step (based on order of appearance)
  const stepMap = new Map<number, number>();
  items.forEach(({ block }, index) => {
    if (!stepMap.has(block)) {
      stepMap.set(block, index + 1); // step = index + 1
    }
  });

  // Highlight the last 3 inserted blocks
  const last3 = items.slice(-3).map(i => i.block);
  const highlightMap = new Map<number, string>();
  const highlightClasses = ['bg-yellow-900', 'bg-yellow-700', 'bg-yellow-600'];
  last3.forEach((block, i) => {
    highlightMap.set(block, highlightClasses[highlightClasses.length - 1 - i]);
  });

  type Row = {
    address: number;
    block: number;
    step?: string | number;
    highlightClass: string;
    showBlockCell: boolean;
    rowspan: number;
  };

  // Build grouped table rows
  const tableRows: Row[] = [];
  for (let block = 0; block < tableLength / blockSize; block++) {
    const rowspan = blockSize;
    for (let i = 0; i < blockSize; i++) {
      const address = block * blockSize + i;
      const row: Row = {
        address,
        block,
        step: stepMap.get(block) ?? '-',
        highlightClass: highlightMap.get(block) ?? '',
        showBlockCell: i === 0,
        rowspan
      };
      tableRows.push(row);
    }
  }
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
