# 1243 CSARCH2 Cache Memory Simulator

By CSARCH2 - S12 Grp 1 consisting of 
- ANCHETA, Liam
- BERNARDO, Sean Benedict
- CAMPO, Roan Cedric
- CESAR, Jusper Angelo
- CHAN, Enzo Rafael

## Machine Project Specifications



## Detailed Test Case Analysis

### Assumptions

In all test cases, the following assumptions are followed.
- Cache Access Time = `c` ns
- Memory Access Time = `m` ns
- Number of Cache Blocks = `n`
- Number of Words/Block = `w`

### Miss Penalty

In a non load-through setting, whenever a cache miss happens, information is read from the main memory and a block is copied from the main memory onto the cache (cache line fill), then the data is then transferred from the cache to the CPU [1].

Going through this, we first check and access the cache memory to see if the data we're trying to fetch is there, which takes `c` ns. After which, we read and copy the main memory block to the cache line for each word, which takes `(m` ns`) * w`. Finally, it takes `c` ns to transfer the data from the cache to CPU.

This totals to `(2c + m * w)` ns of miss penalty.

### Test Case 0: up to n cache blocks

This is not an official test case, but rather a common occurence in the first two official test cases.

In a 4-way set-associative (SA) cache, the cache is divided into sets, each containing 4 blocks (ways). If the cache has `n` total blocks, then there are `n/4` sets.

When accessing main memory blocks `0` to `n−1`, all `n` blocks will be mapped into the cache using:

> Set Index = Block Address mod (Number of Sets)

Since each block is mapped to a set based on modulo indexing and there are `n` unique blocks being accessed, every set will receive exactly 4 blocks — completely filling the cache with no replacement occurring (assuming an empty initial cache).

To put simply, CACHE MISS count = `n` and more importantly, **fills up the entire cache**.

This also applies to MM blocks `n` to `2n-1` with the exact same logic.

### Test Case 1: up to 2n cache blocks, repeating the sequence twice.

Breaking this sequence by halves:

1. In the first half of the sequence from blocks `0` to `2n-1`, since there are n cache blocks, MM blocks `0` to `n-1` will first occupy the whole cache, all of which are a CACHE MISS. Then, since our replacement algorithm is LRU, and that block `k` and `k+n` (where `k` is an arbitrary integer from `0` to `n-1`) will simply be put in the same set as `k = k+n (mod n/4)`, then MM blocks `n` to `2n-1` will simply **replace ALL** MM blocks from `0` to `n-1` in the cache one by one. Thus, current count of CACHE MISS = `2n` for the first half.

2. In the second half of the sequence from `0` to `2n-1`, the final snapshot would be blocks `n` to `2n-1`. With a similar logic, MM blocks `0` to `n-1` will simply replace ALL MM blocks `n` to `2n-1` in the cache one by one, and the same thing happens once again, where MM blocks `n` to `2n-1` will replace ALL MM blocks `0` to `n-1` in the cache one by one. Thus, current count of CACHE MISS = `2n` for the second half, totalling to 4n CACHE MISS counts.

With this, our Cache Hit count = `0`, Cache Miss count = `4n`, Cache Hit Rate = `0`, Cache Miss Rate = `1`.

Memory Access Count is simply equal to Cache Miss count which triggers memory access times the number of words in the block, which totals to `4n * w`.

Following the formula, Average Access Time would be hit rate * hit time + miss rate * miss penalty which is equivalent to `(2c + m * w)` ns.

Total Access Time would then be `4n * (c ns + (m ns) * (w) + (c ns) * (w))` = `4n * (c + m * w + c * w)` ns
where `4n` is the # of misses, `c` ns is the cache check, `m ns * w` is the memory read and copy of data to cache, and `c ns * w` being the cache read for each word since this is Non Load-Through.

To summarize:
- Memory Access Count = `4n * w`
- Cache Hit count = `0`
- Cache Miss count = `4n`
- Cache Hit rate = `0`
- Cache Miss rate = `1`
- Average Access Time = `(2c + m * w)` ns
- Total Access Time = `4n * (c + m * w + c * w)` ns

### Test Case 2: Start at block 0, repeat the sequence in the middle two times up to n-1 blocks, after
which continue up to 2n

To put simply, our sequence would be `0`, `1` to `n-1`, `1` to `n-1`, `n` to `2n-1`, then repeat

Breaking the **FIRST ITERATION** down per part:

1. In the first part, block `0` is a cache miss. Current CACHE MISS: `1`

2. In the second part, blocks `1` to `n-1` are also cache misses. This would also imply MM blocks `0` to `n-1` fill up all n cache blocks. Current CACHE MISS: `n`.

3. In the third part, blocks `1` to `n-1` are filled in the cache blocks, so they are cache hits. Current CACHE HIT: `n-1`.

4. Finally, blocks `n` to `2n-1` are all new blocks. Similar to the logic with the first test case, MM blocs `n` to `2n-1` will replace MM blocks `0` to `n-1`. Current CACHE MISS: `2n`.

Breaking the **SECOND ITERATION** down per part:

1. In the first and second parts, blocks `0` to `n-1` simply replaces MM blocks `n` to `2n-1` in the cache. Current CACHE MISS: `3n`

2. Notice that by the third part, we're at the exact same position we are as the third part in the first iteration. Thus, CACHE HIT = `2n-2` and CACHE MISS = `4n`.

Similarly, Memory Access Count would be CACHE MISS * # of words per block = `4n * w`. Cache Hit Rate is `(2n-2)/(2n-2 + 4n)` or `(n-1)/(3n-1)`. Cache Miss Rate is then `2n/(3n-1)`.

Average Access Time once again follows hit rate * hit time + miss rate * miss penalty = `(n-1)/(3n-1) * c + 2n/(3n-1) * (2c + m * w)` ns.

Total Access Time would then be

- HIT: `(2n-2)` times, transfer cache to CPU for all words = `c * w` ns. In total, it's `(2n-2) * c * w` ns.

- MISS: Similar to Test Case 1, `4n * (c + m * w + c * w)` ns

totalling to: `(2n-2) * (c * w) + 4n * (c + m * w + c * w)` ns.

To summarize:
- Memory Access Count = `4n * w`
- Cache Hit count = `2n-2`
- Cache Miss count = `4n`
- Cache Hit rate = `(n-1)/(3n-1)`
- Cache Miss rate = `2n/(3n-1)`
- Average Access Time = `(n-1)/(3n-1) * c + 2n/(3n-1) * (2c + m * w)` ns
- Total Access Time = `(2n-2) * (c * w) + 4n * (c + m * w + c * w)` ns

### Test Case 3: 64 MM blocks, any

As Test Case 3 is very open-ended, we let `H` = Cache Hit count. Then, Cache Miss count = `64-H`. Assume `H` is a nonnegative integer less than or equal to 64.

By definition, our Hit Rate would be `H/64`, whereas our Miss Rate would be `(64-H)/64`.

Memory Access Count would then be Cache Miss * # of words/block, or `(64-H) * w`.

Following the formula, Average Access Time would be `(H/64) * c + (64-H)/64 * (2c + m * w)` ns.

Finally, total access time can be broken down to:

- HIT: `H * (c * w)` ns
- MISS: `(64 - H) * (c + m * w + c * w)` ns

totalling to: `H * (c * w) + (64 - H) * (c + m * w + c * w)` ns.

To summarize:
- Memory Access Count = `(64-H) * w`
- Cache Hit count = `H`
- Cache Miss count = `64-H`
- Cache Hit rate = `H/64`
- Cache Miss rate = `(64-H)/64`
- Average Access Time = `(H/64) * c + (64-H)/64 * (2c + m * w)` ns
- Total Access Time = `H * (c * w) + (64 - H) * (c + m * w + c * w)` ns

## References
[1] R. Uy, “Cache Memory” lecture slides, De La Salle University, Manila, Philippines, Aug. 2025.
