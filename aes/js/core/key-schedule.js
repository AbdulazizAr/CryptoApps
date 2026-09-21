import { sBox, rCon } from "./constants.js";
import aesState from "../state/aes-state.js";

// Key expansion function
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
    // Calculate the index in the expanded key array
    const baseIndex = round * 16;
    const prevRoundIndex = (round - 1) * 16;
    
    // Get the last word of the previous round key
    const lastWord = [
      expandedKey[prevRoundIndex + 12],
      expandedKey[prevRoundIndex + 13],
      expandedKey[prevRoundIndex + 14],
      expandedKey[prevRoundIndex + 15]
    ];
    
    // Apply key schedule core
    // 1. Rotate left by one byte
    const rotWord = [lastWord[1], lastWord[2], lastWord[3], lastWord[0]];
    
    // 2. Apply S-box to each byte
    const subWord = rotWord.map(byte => sBox[byte]);
    
    // 3. XOR with round constant on first byte only
    const rconWord = [
      subWord[0] ^ rCon[round - 1][0],
      subWord[1],
      subWord[2],
      subWord[3]
    ];
    
    // Store the transformed word in the key schedule state
    if (aesState.rounds[round]) {
      aesState.rounds[round].keySchedule.leftShift = [...rotWord];
      aesState.rounds[round].keySchedule.subBytes = [...subWord];
      aesState.rounds[round].keySchedule.xorRcon = [...rconWord];
    }
    
    // First word of the current round key
    expandedKey[baseIndex] = expandedKey[prevRoundIndex] ^ rconWord[0];
    expandedKey[baseIndex + 1] = expandedKey[prevRoundIndex + 1] ^ rconWord[1];
    expandedKey[baseIndex + 2] = expandedKey[prevRoundIndex + 2] ^ rconWord[2];
    expandedKey[baseIndex + 3] = expandedKey[prevRoundIndex + 3] ^ rconWord[3];
    
    // Other three words are just XOR of previous word with word from previous round
    for (let i = 4; i < 16; i++) {
      expandedKey[baseIndex + i] = expandedKey[baseIndex + i - 4] ^ expandedKey[prevRoundIndex + i];
    }
    
    // Store the generated round key in the state
    if (aesState.rounds[round]) {
      aesState.rounds[round].key = expandedKey.slice(baseIndex, baseIndex + 16);
      aesState.rounds[round].keySchedule.generated = [...aesState.rounds[round].key];
    }
  }

  return expandedKey;
}

// Function to get a specific round key from the expanded key
function getRoundKey(expandedKey, round) {
  const startIndex = round * 16;
  return expandedKey.slice(startIndex, startIndex + 16);
}

// Function to update key schedule visualization data for a specific round
function updateKeyScheduleData(round) {
  if (round <= 0 || round > 10) return;
  
  // Expand the key
  const expandedKey = keyExpansion(aesState.input.key);
  
  // Get the last column of the previous round key
  const prevRoundIdx = (round - 1);
  const prevRound = prevRoundIdx >= 0 ? aesState.rounds[prevRoundIdx].key : aesState.input.key;
  
  const lastWord = [
    prevRound[12], prevRound[13], prevRound[14], prevRound[15]
  ];
  
  // 1. Rotate left by one byte
  const rotWord = [lastWord[1], lastWord[2], lastWord[3], lastWord[0]];
  aesState.rounds[round].keySchedule.leftShift = [...rotWord];
  
  // 2. Apply S-box to each byte
  const subWord = rotWord.map(byte => sBox[byte]);
  aesState.rounds[round].keySchedule.subBytes = [...subWord];
  
  // 3. XOR with round constant on first byte only
  const rconWord = [
    subWord[0] ^ rCon[round - 1][0],
    subWord[1],
    subWord[2],
    subWord[3]
  ];
  aesState.rounds[round].keySchedule.xorRcon = [...rconWord];
  
  // Store the full generated round key
  const roundKey = getRoundKey(expandedKey, round);
  aesState.rounds[round].keySchedule.generated = [...roundKey];
  
  // If the key hasn't been manually modified, update it from the key schedule
  if (!aesState.rounds[round].keyModified) {
    aesState.rounds[round].key = [...roundKey];
  }
  
  return roundKey;
}

export { keyExpansion, getRoundKey, updateKeyScheduleData };