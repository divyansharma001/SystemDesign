import { BloomFilter } from './bloom.js';

// 1. The small one from the reel: 8 bits, one hash, so f(reel) % 8 picks the spot.
//    Seed 3697 is picked so the spots match the reel (reel1 -> 2, reel3 -> 6, reel4 -> 4, reel5 -> 6).
const small = new BloomFilter(8, 1, 3697);
for (const reel of ['reel1', 'reel3']) {
  small.add(reel);
  console.log(`watched ${reel} -> spot ${small.positions(reel)[0]}`);
}
console.log('bits:', [...Array(8).keys()].map(i => (small.bits[0] >> i) & 1).join(' '));
for (const reel of ['reel4', 'reel5']) {
  console.log(`${reel} -> spot ${small.positions(reel)[0]} -> ${small.mightContain(reel) ? 'maybe seen' : 'never seen'}`);
}

// 2. The real size: a million watched reels at 1% false "maybe"
const WATCHED = 1_000_000, NEW = 1_000_000;
const filter = BloomFilter.forItems(WATCHED, 0.01);

let start = performance.now();
for (let i = 0; i < WATCHED; i++) filter.add(`reel-${i}`);
const addMs = performance.now() - start;

// every reel we added must say "maybe": a Bloom filter never says no to something it has seen
let missed = 0;
for (let i = 0; i < WATCHED; i++) if (!filter.mightContain(`reel-${i}`)) missed++;

// reels never watched: count how many still say "maybe"
start = performance.now();
let wrongMaybe = 0;
for (let i = 0; i < NEW; i++) if (filter.mightContain(`new-reel-${i}`)) wrongMaybe++;
const checkMs = performance.now() - start;

const listBytes = WATCHED * 8;   // the naive way: every reel id as a 64-bit number
const n = x => x.toLocaleString('en-US');
console.log(`\n${n(WATCHED)} reels watched`);
console.log(`bits: ${n(filter.size)}, hashes: ${filter.hashes}`);
console.log(`filter: ${(filter.bytes / 1e6).toFixed(2)} MB  vs  plain list: ${(listBytes / 1e6).toFixed(2)} MB`);
console.log(`watched reels it said "never seen" to: ${missed}`);
console.log(`new reels it said "maybe" to: ${n(wrongMaybe)} of ${n(NEW)} (${(wrongMaybe / NEW * 100).toFixed(2)}%)`);
console.log(`added in ${addMs.toFixed(0)} ms, checked ${n(NEW)} in ${checkMs.toFixed(0)} ms`);
