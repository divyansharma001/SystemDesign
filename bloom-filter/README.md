# Bloom filter

How an app can remember every reel you've watched without keeping a list of them.

A Bloom filter is a row of bits, all 0.
When you watch a reel, a few hash functions each pick a spot, and those spots become 1.
To check a new reel, look at its spots:

- If even one is 0, you have never seen it. This answer is always right.
- If all are 1, you have maybe seen it (other reels could have set those bits), so check the real list.

The catch: a 1 never goes back to 0, so nothing can be removed.

## Run it

```
node demo.js
```

No packages needed.

```
watched reel1 -> spot 2
watched reel3 -> spot 6
bits: 0 0 1 0 0 0 1 0
reel4 -> spot 4 -> never seen
reel5 -> spot 6 -> maybe seen

1,000,000 reels watched
bits: 9,585,059, hashes: 7
filter: 1.20 MB  vs  plain list: 8.00 MB
watched reels it said "never seen" to: 0
new reels it said "maybe" to: 9,840 of 1,000,000 (0.98%)
```

## Files

| File | What it does |
|---|---|
| `bloom.js` | The filter: `add`, `mightContain`, and `BloomFilter.forItems(n, rate)` to pick the size and number of hashes |
| `demo.js` | The 8-bit example from the video, then a million reels with real memory and error numbers |

Full write-up: https://divyanshsharma.com/blog/bloom-filters
