import { sBox, rCon } from "./constants.js";

// Key expansion functions
function keyExpansion(key) {
  // For AES-128, we need 11 round keys (initial + 10 rounds)
  // Each round key is 16 bytes (4 words)
  const expandedKey = new Array(11 * 16);

  // First round key is the original key
  for (let i = 0; i < 16; i++) {
    expandedKey[i] = key[i];
  }

  // Generate the remaining round keys
  for (let round = 1; round <= 10; round++) {
    // Get the last 4 bytes of the previous round key (last column)
    let temp = [
      expandedKey[round * 16 - 4],
      expandedKey[round * 16 - 3],
      expandedKey[round * 16 - 2],
      expandedKey[round * 16 - 1],
    ];

    // Perform operations on temp
    // 1. Rotate left by one byte
    temp = [temp[1], temp[2], temp[3], temp[0]];

    // 2. Apply S-box to each byte
    for (let i = 0; i < 4; i++) {
      temp[i] = sBox[temp[i]];
    }

    // 3. XOR with round constant (only first byte)
    temp[0] ^= rCon[round - 1][0];

    // Generate new round key
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const idx = round * 16 + i * 4 + j;
        const prevIdx = (round - 1) * 16 + i * 4 + j;

        if (i === 0) {
          // First column of this round key
          expandedKey[idx] = expandedKey[prevIdx] ^ temp[j];
        } else {
          // Other columns - XOR with previous column in this round key
          expandedKey[idx] =
            expandedKey[prevIdx] ^ expandedKey[round * 16 + (i - 1) * 4 + j];
        }
      }
    }
  }

  return expandedKey;
}

function getRoundKey(expandedKey, round) {
  // Return a specific round key from the expanded key
  return expandedKey.slice(round * 16, (round + 1) * 16);
}
//BLOCK1B
// AES-128 Encryption/Decryption Tool - Encryption and Decryption Implementation

// Initialize the main state object to store all AES operations data
const aesState = {
  input: {
    plaintext: new Array(16).fill(0),
    key: new Array(16).fill(0),
  },
  rounds: [], // Will hold state for each round
  currentOperation: null,
  isEncryption: true,
};

// Initialize for 10 rounds (AES-128)
for (let i = 0; i < 10; i++) {
  aesState.rounds.push({
    roundNumber: i + 1,
    input: new Array(16).fill(0),
    key: new Array(16).fill(0),
    addRoundKey: new Array(16).fill(0),
    subBytes: new Array(16).fill(0),
    shiftRows: new Array(16).fill(0),
    mixColumns: new Array(16).fill(0),
    keySchedule: {
      leftShift: new Array(4).fill(0),
      subBytes: new Array(4).fill(0),
      xorRcon: new Array(4).fill(0),
      generated: new Array(16).fill(0),
    },
  });
}

export { keyExpansion, getRoundKey };
