const CAT = 5, MAT = 10, SET_SIZE = 4, IS_DEBUG = true;

function debug(message) {
    if (IS_DEBUG)
        console.log(message);
}

class CacheBlock {
    #blockNumber = 0;
    #age = 0;

    /**
     * @param {int} blockNumber - MM block number 
     * @param {int} age - time when block was inserted or last accessed
     */
    constructor(blockNumber, age) {
        this.#blockNumber = blockNumber; // Block number
        this.#age = age;
    }

    /**
     * Get the block number.
     * @returns {int} - The block number.
     */
    get blockNumber() {
        return this.#blockNumber;
    }

    /**
     * Get the age of the block.
     * @returns {int} - The age of the block, representing the time when it was inserted or last accessed.
     */
    get age() {
        return this.#age;
    }

    /**
     * Update the age of the block for cache hit.
     * @param {int} age
     */
    update(age) {
        this.#age = age;
    }
}

class CacheSet {
    #setNumber = 0;
    #blocks = [];

    /**
     * @param {int} setNumber - The set number in the cache.
     */
    constructor(setNumber) {
        this.#setNumber = setNumber; // Set number
        this.#blocks = []; // Initialize blocks array
    }

    /**
     * checks if a block is within the set.
     * @param {int} blockNumber MM block number
     * @return {int} index of the block in the set if found, -1 if not found or set is empty.
     */
    isInSet(blockNumber) {
        for (let i = 0; i < this.#blocks.length; i++)
            if (this.#blocks[i].blockNumber === blockNumber)
                return i;
        return -1; // Block not found in the set
    }

    /**
     * Finds the index of the block with the earliest age in the set.
     * @returns {int} - The index of the block with the earliest age, or -1 if the set is empty.
     */
    findEarliestBlock() {
        // We find the earliest block as our replacement policy is LRU.

        // find the index of the block with the earliest age
        // this should not happen, otherwise the code is wrong
        if (this.#blocks.length === 0) {
            return -1; // No blocks in the set
        }

        let earliestBlockIndex = 0, earliestBlock = this.#blocks[0].age;
        for (let i = 1; i < this.#blocks.length; i++) {
            if (this.#blocks[i].age < earliestBlock) {
                earliestBlock = this.#blocks[i].age;
                earliestBlockIndex = i;
            }
        }
        return earliestBlockIndex; // Return the index of the block with the earliest age
    }

    /**
     * Inserts a CacheBlock into the set.
     * 
     * @param {*} cacheBlock 
     * @returns {CacheBlock} - The inserted cache block
     * @throws {Error} if cacheBlock is not an instance of CacheBlock or if the block number does not belong to this set.
     */
    insertBlock(cacheBlock) {
        // check if the cacheBlock is an instance of CacheBlock
        // user should not be able to reach this error
        if (!(cacheBlock instanceof CacheBlock)) {
            throw new Error("Invalid block type. Must be an instance of CacheBlock.");
        }

        let packet = {
            setNumber: this.#setNumber,
            blockNumber: 0,
            memBlkNum: cacheBlock.blockNumber,
            replacedBlock: null
        }

        // check if the block number is already in the set

        // Cache Hit
        const blockIndex = this.isInSet(cacheBlock.blockNumber);
        if (blockIndex !== -1) {
            // If the block is already in the set, update its age and return it
            this.#blocks[blockIndex].update(cacheBlock.age);
            debug(`Cache Hit: Updated block ${cacheBlock.blockNumber} in set ${this.#setNumber}.`);
            packet.blockNumber = blockIndex;
            packet.cacheBlock = this.#blocks[blockIndex];
            return packet;
        }

        // Cache Miss
        if (this.#blocks.length < SET_SIZE) {
            this.#blocks.push(cacheBlock); // Add block if there's space
            debug(`Cache Miss: Inserting block ${cacheBlock.blockNumber} into set ${this.#setNumber}.`);

            // get index of latest block
            const latestBlockIndex = this.#blocks.length - 1;
            packet.blockNumber = latestBlockIndex;
            return packet;
        } else {
            // If the set is full, replace the newest block

            // find the index of the block with the earliest age
            let earliestBlockIndex = this.findEarliestBlock();

            // cache the block to be replaced for returning
            let replacedBlock = this.#blocks[earliestBlockIndex];

            packet.blockNumber = earliestBlockIndex;
            packet.replacedBlock = replacedBlock;

            // replace block with the new one
            this.#blocks[earliestBlockIndex] = cacheBlock; // Replace the block
            debug(`Cache Miss: Inserting block ${cacheBlock.blockNumber}, Replacing block ${replacedBlock.blockNumber} in set ${this.#setNumber}.`);
            return packet
        }
    }

    getBlocks() {
        return this.#blocks;
    }
}

class Cache {
    statistics = {
        hits: 0,
        misses: 0,
    }

    #age = 0;

    constructor(wordsPerBlock, numBlocks) {
        // verify inputs, errors will be thrown if invalid
        this.#verifyInputs(wordsPerBlock, numBlocks);

        this.wordsPerBlock = wordsPerBlock;
        this.numBlocks = numBlocks;

        // initialize the cache
        this.cache = [];
        this.numSets = Math.floor(this.numBlocks / SET_SIZE); // int

        // create the sets
        for (let i = 0; i < this.numSets; i++) {
            this.cache.push(new CacheSet(i));
        }
    }


    // Constructor Auxiliary Functions


    /**
     * Verifies the following fields:
     * @param {*} wordsPerBlock - number of words per block, to be checked if it's a power of 2 greater than or equal to 2
     * @param {*} numBlocks - number of blocks in the cache, to be checked if it is a power of 2
     * @throws {Error} if wordsPerBlock or numBlocks fails the verification
     */
    #verifyInputs(wordsPerBlock, numBlocks) {
        const isPowerOfTwo = (n) => n > 0 && (n & (n - 1)) === 0;

        wordsPerBlock = Math.floor(wordsPerBlock);
        numBlocks = Math.floor(numBlocks);

        // verify that  wordsPerBlock is a power of 2
        if (wordsPerBlock < 2) {
            throw new Error("Words per block must be at least 2.");
        } else if (!isPowerOfTwo(wordsPerBlock)) {
            throw new Error("Words per block must be a power of 2.");
        }

        // verify that number of blocks is
        // a power of 2 and at least than 4
        if (numBlocks < 4 || !isPowerOfTwo(numBlocks)) {
            throw new Error("Number of blocks must be a power of 2.");
        }
    }


    // Actual cache stuff begins


    /**
     * Calculates the set number based on the block number.
     * @param {int} blockNumber 
     * @returns set number
     */
    #getSetNumber(blockNumber) {
        // calculate the set number based on the block number
        return blockNumber % this.numSets;
    }

    /**
     * @param {boolean} isHit - true if the block is a hit, false if it is a miss
     */
    calculateTime(isHit) {
        // TODO: calculate time based on hit or miss
    }


    /**
     * Inserts a block into the cache.
     * @param {int} blockNumber MM Block number to be inserted into the cache.
     * @returns {Object} - An object containing Hit or Miss, the set number, block number, replaced block if applicable.
     */
    insert(blockNumber) {
        const setNumber = this.#getSetNumber(blockNumber);
        const set = this.cache[setNumber];

        // Create a new CacheBlock with the current age
        const cacheBlock = new CacheBlock(blockNumber, this.#age);

        // Check if the block is already in the set
        const blockIndex = set.isInSet(blockNumber);

        // increment hit or miss counters
        if (blockIndex !== -1)
            this.statistics.misses++;
        else
            this.statistics.hits++;

        // perform insert operation
        const insertedBlock = set.insertBlock(cacheBlock);

        let returnObj = {
            status: (blockIndex !== -1) ? "Hit" : "Miss",
            setNumber: setNumber,
            blockNumber: insertedBlock.blockNumber,
            memBlkNum: insertedBlock.memBlkNum,
            replacedBlock: (insertedBlock.replacedBlock) ? insertedBlock.replacedBlock.blockNumber : null,
        }

        this.#age++; // Increment the global age counter
        return returnObj;
    }


    /**
     * Returns the cache statistics.
     * @returns {Object} - Statistics object containing hits and misses
     */
    getStats() {
        return this.statistics;
    }

    /**
     * maps the cache memory to JSON format
     * @return {Object} - JSON object representing the cache
     */
    getCache() {
        let cacheJSON = []
        for (const element of this.cache) {
            const set = element;
            cacheJSON.push({
                blocks: set.getBlocks().map(block => ({
                    blockNumber: block.blockNumber,
                    age: block.age
                }))
            });
        }
        return cacheJSON;
    }
}