<script lang="ts">
  export let addressBits: number;
  export let blockSize: number;
  export let items: { address: number; data: string | number }[] = [];
  export let steps: { address: number; step: number }[] = [];

  const tableLength = 2 ** addressBits;

  const itemMap = new Map(items.map(item => [item.address, item.data]));
  const stepMap = new Map(steps.map(s => [s.address, s.step]));

  const getBlockNumber = (addr: number) => Math.floor(addr / blockSize);

  const blockStepMap = new Map<number, number>();
  for (const { address, step } of steps) {
    const block = getBlockNumber(address);
    const prev = blockStepMap.get(block) ?? -1;
    if (step > prev) blockStepMap.set(block, step);
  }

  const last3 = items.slice(-3).map(i => i.address);
  const highlightMap = new Map<number, string>();
  const highlightClasses = ['bg-yellow-900', 'bg-yellow-700', 'bg-yellow-600'];

  last3.forEach((addr, i) => {
    highlightMap.set(addr, highlightClasses[highlightClasses.length - 1 - i]);
  });

  type Row = {
    address: number;
    block: number;
    data?: string | number;
    step?: string | number;
    blockStep?: string | number;
    highlightClass: string;
    showBlockCell: boolean;
    rowspan: number;
  };

  // Build grouped rows
  const tableRows: Row[] = [];
  for (let block = 0; block < tableLength / blockSize; block++) {
    const rowspan = blockSize;
    for (let i = 0; i < blockSize; i++) {
      const address = block * blockSize + i;
      const row: Row = {
        address,
        block,
        data: itemMap.get(address) ?? '0',
        step: stepMap.get(address) ?? '-',
        blockStep: blockStepMap.get(block) ?? '-',
        highlightClass: highlightMap.get(address) ?? '',
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
        <th class="p-2 border border-black">Address</th>
        <th class="p-2 border border-black">Data</th>
        <th class="p-2 border border-black">Step</th>
        <th class="p-2 border border-black">Block Step</th>
      </tr>
    </thead>
    <tbody>
      {#each tableRows as row}
        <tr class={`border border-black ${row.highlightClass}`}>
          {#if row.showBlockCell}
            <td class="text-center border border-black" rowspan={row.rowspan}>{row.block}</td>
          {/if}
          <td class="text-center border border-black">{row.address}</td>

          <td class="text-center border border-black">{row.data ?? ''}</td>
          <td class="text-center border border-black">{row.step ?? ''}</td>
          {#if row.showBlockCell}
            <td class="text-center border border-black" rowspan={row.rowspan}>{row.blockStep ?? ''}</td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
