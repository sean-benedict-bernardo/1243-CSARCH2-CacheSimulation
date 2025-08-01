
const CAT = 5, MAT = 10, SET_SIZE = 4, IS_DEBUG = true;

export function debug(document: Document, message: string) {
    if (!IS_DEBUG) return

    const debug = document.getElementById("debug")
        
    if (debug != null) debug.innerHTML += `<p>${message}</p>`;
}

export class CacheBlock {
    blockNumber = 0;
    age = 0;

    /**
     * @param {int} blockNumber - MM block number 
     * @param {int} age - time when block was inserted or last accessed
     */
    constructor(blockNumber: number, age: number) {
        this.blockNumber = blockNumber; // Block number
        this.age = age;

    }

    /**
     * Get the block number.
     * @returns {int} - The block number.
     */
    get_blockNumber() {
        return this.blockNumber;
    }

    /**
     * Get the age of the block.
     * @returns {int} - The age of the block, representing the time when it was inserted or last accessed.
     */
    get_age() {
        return this.age;
    }

    /**
     * Update the age of the block for cache hit.
     * @param {int} age
     */
    update(age: number) {
        this.age = age;
    }
}

export class CacheSet {
    private setNumber = 0;
    private blocks: CacheBlock[] = [];
    private doc: Document

    /**
     * @param {int} setNumber - The set number in the cache.
     */
    constructor(setNumber: number, doc: Document) {
        this.setNumber = setNumber; // Set number
        this.blocks = []; // Initialize blocks array
        this.doc = doc
    }

    /**
     * checks if a block is within the set.
     * @param {int} blockNumber MM block number
     * @return {int} index of the block in the set if found, -1 if not found or set is empty.
     */
    isInSet(blockNumber: number) {
        for (let i = 0; i < this.blocks.length; i++)
            if (this.blocks[i].blockNumber === blockNumber)
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
        if (this.blocks.length === 0) {
            return -1; // No blocks in the set
        }

        let earliestBlockIndex = 0, earliestBlock = this.blocks[0].age;
        for (let i = 1; i < this.blocks.length; i++) {
            if (this.blocks[i].age < earliestBlock) {
                earliestBlock = this.blocks[i].age;
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
    insertBlock(cacheBlock: CacheBlock) {
        // check if the cacheBlock is an instance of CacheBlock
        // user should not be able to reach this error
        if (!(cacheBlock instanceof CacheBlock)) {
            throw new Error("Invalid block type. Must be an instance of CacheBlock.");
        }

        let packet = {
            setNumber: this.setNumber,
            blockNumber: 0,
            memBlkNum: cacheBlock.blockNumber,
            cacheBlock: cacheBlock
        }

        // check if the block number is already in the set

        // Cache Hit
        const blockIndex = this.isInSet(cacheBlock.blockNumber);

        if (blockIndex !== -1) {
            // If the block is already in the set, update its age and return it
            this.blocks[blockIndex].update(cacheBlock.age);
            debug(this.doc,`Cache Hit: Updated block ${cacheBlock.blockNumber} in set ${this.setNumber}.`);
            
            packet.blockNumber = blockIndex;
            packet.cacheBlock = this.blocks[blockIndex];

            return packet
        }

        // Cache Miss
        if (this.blocks.length < SET_SIZE) {
            this.blocks.push(cacheBlock); // Add block if there's space

            debug(this.doc, `Cache Miss: Inserting block ${cacheBlock.blockNumber} into set ${this.setNumber}.`);

            // get index of latest block
            const latestBlockIndex = this.blocks.length - 1;
            packet.blockNumber = latestBlockIndex;
            return packet;
        } else {
            // If the set is full, replace the newest block

            // find the index of the block with the earliest age
            let earliestBlockIndex = this.findEarliestBlock();

            // cache the block to be replaced for returning
            let replacedBlock = this.blocks[earliestBlockIndex];


            packet.blockNumber = earliestBlockIndex;
            // replace block with the new one
            this.blocks[earliestBlockIndex] = cacheBlock; // Replace the block
            debug(this.doc, `Cache Miss: Inserting block ${cacheBlock.blockNumber}, Replacing block ${replacedBlock.blockNumber} in set ${this.setNumber}.`);
            return packet
        }
    }

    getBlocks() {
        return this.blocks;
    }
}

export class CacheMemory {
    statistics = {
        hits: 0,
        misses: 0,
    }

    private age = 0;
    private cache: CacheSet[] = [];
    private wordsPerBlock = 0;
    private numBlocks = 0;
    private numSets = 0;
    private document: Document;

    constructor(wordsPerBlock: number, numBlocks: number, document: Document) {
        // verify inputs, errors will be thrown if invalid
        this.verifyInputs(wordsPerBlock, numBlocks);

        this.wordsPerBlock = wordsPerBlock;
        this.numBlocks = numBlocks;

        // initialize the cache
        this.cache = [];
        this.numSets = Math.floor(this.numBlocks / SET_SIZE); // int

        this.document = document
        // create the sets
        for (let i = 0; i < this.numSets; i++) {
            this.cache.push(new CacheSet(i, this.document));
        }
    }

    
    // Constructor Auxiliary Functions


    /**
     * Verifies the following fields:
     * @param {*} wordsPerBlock - number of words per block, to be checked if it's a power of 2 greater than or equal to 2
     * @param {*} numBlocks - number of blocks in the cache, to be checked if it is a power of 2
     * @throws {Error} if wordsPerBlock or numBlocks fails the verification
     */
    private verifyInputs(wordsPerBlock: number, numBlocks: number) {
        // verify that  wordsPerBlock is a power of 2
        if (wordsPerBlock < 2) {
            throw new Error("Words per block must be at least 2.");
        } else if (Math.log2(wordsPerBlock) % 1 !== 0) {
            throw new Error("Words per block must be a power of 2.");
        }

        // verify that number of blocks is
        // a power of 2 and at least than 4
        if (numBlocks < 4 || (Math.log2(numBlocks) % 1 !== 0)) {
            throw new Error("Number of blocks must be a power of 2.");
        }
    }


    // Actual cache stuff begins


    /**
     * Calculates the set number based on the block number.
     * @param {int} blockNumber 
     * @returns set number
     */
    private getSetNumber(blockNumber: number) {
        // calculate the set number based on the block number
        return blockNumber % this.numSets;
    }


    /**
     * Inserts a block into the cache.
     * @param {int} blockNumber MM Block number to be inserted into the cache.
     */
    insert(blockNumber: number) {
        const setNumber = this.getSetNumber(blockNumber);
        const set = this.cache[setNumber];

        // Create a new CacheBlock with the current age
        const cacheBlock = new CacheBlock(blockNumber, this.age);

        // Check if the block is already in the set
        const blockIndex = set.isInSet(blockNumber);

        // increment hit or miss counters
        if (blockIndex !== -1)
            this.statistics.misses++;
        else
            this.statistics.hits++;

        // perform insert operation
        const insertedBlock = set.insertBlock(cacheBlock);

        this.age++; // Increment the global age counter
        return insertedBlock;
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