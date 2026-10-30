// A Bloom filter: a row of bits that answers "have I seen this before?"
// "no" is always right; "maybe" is wrong about `falsePositiveRate` of the time.
// Nothing can be removed: a bit that is 1 never goes back to 0.

// FNV-1a, then MurmurHash3's final mix: turns any string into a 32-bit number with every bit well shuffled
// (plain FNV-1a barely changes its lowest bits between "reel3" and "reel5"). The seed gives a different hash.
function hash(str, seed) {
  let h = (2166136261 ^ seed) >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

export class BloomFilter {
  // size: how many bits; hashes: how many bits each item sets; seed: picks which hash functions
  constructor(size, hashes, seed = 0) {
    this.size = size;
    this.hashes = hashes;
    this.seed = seed;
    this.bits = new Uint8Array(Math.ceil(size / 8));
  }

  // the best size and number of hashes for `items` items at a wanted false "maybe" rate
  static forItems(items, falsePositiveRate) {
    const size = Math.ceil(-items * Math.log(falsePositiveRate) / Math.LN2 ** 2);
    const hashes = Math.max(1, Math.round(size / items * Math.LN2));
    return new BloomFilter(size, hashes);
  }

  // the bit positions for an item: two hashes mixed together, k times (double hashing)
  positions(item) {
    const h1 = hash(item, this.seed), h2 = (hash(item, this.seed ^ 0x9e3779b9) | 1) >>> 0;   // >>> 0: keep it positive
    const out = [];
    for (let i = 0; i < this.hashes; i++) out.push((h1 + i * h2) % this.size);
    return out;
  }

  add(item) {
    for (const p of this.positions(item)) this.bits[p >> 3] |= 1 << (p & 7);
  }

  // false: never seen, guaranteed. true: maybe seen, so check the real list.
  mightContain(item) {
    return this.positions(item).every(p => (this.bits[p >> 3] & (1 << (p & 7))) !== 0);
  }

  get bytes() {
    return this.bits.length;
  }
}
