<script lang="ts">
  export let logs: { hit: boolean; action: string; time: number }[] = [];
</script>

<div class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100 max-h-[400px] overflow-y-scroll">
  <table class="table table-zebra w-full">
    <thead class="sticky top-0 z-10 bg-base-200">
      <tr>
        <th>#</th>
        <th>Action</th>
        <th>Time</th>
        <th>Result</th>
      </tr>
    </thead>
    <tbody>
      {#each logs as { hit, action, time }, i}
        <tr>
          <td class="text-center">{i + 1}</td>
          <td>{action}</td>
          <td class="text-center">{time}</td>
          <td class="text-center">
            {#if hit}
              <span class="badge badge-success">HIT</span>
            {:else}
              <span class="badge badge-error">MISS</span>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
