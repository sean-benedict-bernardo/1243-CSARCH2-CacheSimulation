<script lang="ts">
  import { onMount } from "svelte";
  import { CacheMemory } from "$lib/Cache.js";

  const numCacheLines = 8; // Example value, can be changed
  const cacheData: { blocks: { blockNumber: number; age: number }[] }[] = $state([]);
  const inserts: number[] = [];
  let curr = 0;
  let queueNum = 0;
  const wordsPerBlock = 2


  const cache = new CacheMemory(wordsPerBlock, numCacheLines, document);

  for (let i = 0; i < 32; ++i) {
      inserts.push(i%16);
  }

  function padZero(n: number, width = 2) {
      return n.toString().padStart(width, '0');
  }

  function getBlockSetId(set: number, block: number) {
      return `data_${padZero(set)}_${block}`
  }

  function addNext() {
      const newBlock = cache.insert(inserts[curr]);
      curr = (curr + 1) % inserts.length;
      
      console.log(JSON.stringify(newBlock))
      const blockId = getBlockSetId(newBlock.setNumber, newBlock.blockNumber);


      const blockCell = document.getElementById(blockId);
      if (blockCell) {
          blockCell.textContent = newBlock.memBlkNum.toString();
      }
  }

  function generateCacheTable(cacheLines: number) {
      const cacheTable = document.getElementById("cacheTable");
      if (!cacheTable) return

      cacheTable.innerHTML = ""; // Clear existing content
      const blocksPerSet = 4;
      const sets = cacheLines / blocksPerSet;

      // Header
      ["Set", "Block", "MM Block"].forEach((text) => {
          const cell = document.createElement("div");
          cell.className = "cell header";
          cell.textContent = text;
          cacheTable.appendChild(cell);
      });

      for (let set = 0; set < sets; set++) {
          for (let block = 0; block < blocksPerSet; block++) {
              // Set Column (only once per set)
              if (block === 0) {
                  const setCell = document.createElement("div");
                  setCell.className = "cell set-label";
                  setCell.rowSpan = blocksPerSet;
                  setCell.textContent = set.toString();
                  setCell.style.gridRow = `span ${blocksPerSet}`;
                  cacheTable.appendChild(setCell);
              }

              // Block
              const blockCell = document.createElement("div");
              blockCell.className = "cell";
              blockCell.textContent = block.toString();
              cacheTable.appendChild(blockCell);

              // Data
              const dataCell = document.createElement("div");
              dataCell.className = "cell set-row";
              dataCell.id = getBlockSetId(set, block);
              cacheTable.appendChild(dataCell);
          }
      }
  }
  onMount(() => {
    generateCacheTable(numCacheLines);
  });
</script>

<div class="cache-table">
  <div class="row header">
    <div>Set</div>
    <div>Block</div>
    <div>MM Block</div>
    <div>Age</div>
  </div>

  {#each cacheData as set, setIndex}
    {#each set.blocks as block, blockIndex}
      <div class="row">
        {#if blockIndex === 0}
          <div rowspan={set.blocks.length} class="set-number">{setIndex}</div>
        {/if}
        <div>{blockIndex}</div>
        <div>{block.blockNumber}</div>
        <div>{block.age}</div>
      </div>
    {/each}
  {/each}
</div>
