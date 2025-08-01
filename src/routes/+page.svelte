<script lang="ts">
  import { onMount } from "svelte";
  import { CacheMemory } from "$lib/Cache.js";

  const numCacheLines = 8; // Example value, can be changed

  const inserts: number[] = [];
  let curr = 0;
  let queueNum = 0;
  const wordsPerBlock = 2

  const cache = new CacheMemory(wordsPerBlock, numCacheLines, document);

  for (let i = 0; i < 32; ++i) {
      inserts.push(i%16);
  }

  function padZero(n, width = 2) {
      return n.toString().padStart(width, '0');
  }

  function getBlockSetId(set, block) {
      return `data_${padZero(set)}_${block}`
  }

  function addNext() {
      const newBlock = cache.insert(inserts[curr]);
      curr = (curr + 1) % inserts.length;
      
      console.log(JSON.stringify(newBlock))
      const blockId = getBlockSetId(newBlock.setNumber, newBlock.blockNumber);


      const blockCell = document.getElementById(blockId);
      if (blockCell) {
          blockCell.textContent = newBlock.memBlkNum;
      }
  }

  function generateCacheTable(cacheLines) {
      const cacheTable = document.getElementById("cacheTable");
      cacheTable.innerHTML = ""; // Clear existing content

      const blocksPerSet = 4;
      const sets = cacheLines / blocksPerSet;

      // Header
      ["Set", "Block", "MM Block"].forEach(text => {
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
                  setCell.textContent = set;
                  setCell.style.gridRow = `span ${blocksPerSet}`;
                  cacheTable.appendChild(setCell);
              }

              // Block
              const blockCell = document.createElement("div");
              blockCell.className = "cell";
              blockCell.textContent = block;
              cacheTable.appendChild(blockCell);

              // Data
              const dataCell = document.createElement("div");
              dataCell.className = "cell set-row";
              dataCell.id = getBlockSetId(set, block);
              cacheTable.appendChild(dataCell);
          }
      }
  }
  document.addEventListener("DOMContentLoaded", () => {
      generateCacheTable(numCacheLines);
  });
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
