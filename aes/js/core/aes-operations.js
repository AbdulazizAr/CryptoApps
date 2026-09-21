import aesState from "../state/aes-state.js";
import {
  addRoundKey,
  subBytes,
  invSubBytes,
  shiftRows,
  invShiftRows,
  mixColumns,
  invMixColumns,
} from "./aes-core.js";
import { keyExpansion, getRoundKey } from "./key-schedule.js";
import { bytesToHexString, formatCell } from "./utils.js";
import { sBox, invSBox, rCon } from "./constants.js";



// Main encryption function
function encryptAES(plaintext, key) {
  console.log("encryptAES started");

  // Ensure plaintext and key are padded to 16 bytes
  plaintext = plaintext.slice(0, 16);
  while (plaintext.length < 16) plaintext.push(0);

  key = key.slice(0, 16);
  while (key.length < 16) key.push(0);

  // Expand the key
  const expandedKey = keyExpansion(key);

  // Store initial state for visualization
  aesState.input.plaintext = [...plaintext];
  aesState.input.key = [...key];

  // Initial round key addition (Round 0)
  console.log("plaintext", bytesToHexString(plaintext));
  let state = addRoundKey(plaintext, key);
  aesState.rounds[0].input = [...plaintext];
  aesState.rounds[0].key = [...key];
  aesState.rounds[0].addRoundKey = [...state];

  console.log("After initial AddRoundKey:", bytesToHexString(state));

  for (let round = 1; round <= 10; round++) {
    console.log(`\n▶ ROUND ${round}`);
    console.log("input to Round " + round + ":\n" + bytesToHexString(state));
    
    // Store the input state for this round
    aesState.rounds[round].input = [...state];

    // SubBytes
    state = subBytes(state);
    console.log("After SubBytes:", bytesToHexString(state));
    aesState.rounds[round].subBytes = [...state];

    // ShiftRows
    state = shiftRows(state);
    console.log("After ShiftRows:", bytesToHexString(state));
    aesState.rounds[round].shiftRows = [...state];

    // MixColumns
    if (round < 10) {
      state = mixColumns(state);
      console.log("After MixColumns:", bytesToHexString(state));
      aesState.rounds[round].mixColumns = [...state];
    }

    // AddRoundKey
    const roundKey = getRoundKey(expandedKey, round);
    aesState.rounds[round].key = [...roundKey];
    state = addRoundKey(state, roundKey);
    console.log("After AddRoundKey:", bytesToHexString(state));
    aesState.rounds[round].addRoundKey = [...state];
    
    // Update key schedule visualization data
    updateKeyScheduleVisualization(round, expandedKey);
  }

  console.log("Final Result:", bytesToHexString(state));

  // Return the ciphertext
  return state;
}

// Main decryption function with debug logs
function decryptAES(ciphertext, key) {
  console.log("decryptAES started");
  // Ensure ciphertext and key are 16 bytes
  ciphertext = ciphertext.slice(0, 16);
  while (ciphertext.length < 16) ciphertext.push(0);
  key = key.slice(0, 16);
  while (key.length < 16) key.push(0);

  // Expand the key
  const expandedKey = keyExpansion(key);

  // Store initial state for visualization
  aesState.input.plaintext = [...ciphertext]; // For decryption, this is the ciphertext
  aesState.input.key = [...key];

  let state = [...ciphertext];
  console.log("ciphertext", bytesToHexString(ciphertext));

  // Initial AddRoundKey with the last round key (round 10 for AES-128)
  const initialRoundKey = getRoundKey(expandedKey, 10);
  aesState.rounds[10].input = [...state];
  aesState.rounds[10].key = [...initialRoundKey];
  state = addRoundKey(state, initialRoundKey);
  console.log("\n▶ INITIAL ROUND");
  console.log("After Initial AddRoundKey:", bytesToHexString(state));
  aesState.rounds[10].addRoundKey = [...state];

  // Main rounds (9 down to 1)
  for (let round = 9; round >= 1; round--) {
    console.log(`\n▶ ROUND ${round}`);
    console.log("Input to Round " + round + ":", bytesToHexString(state));
    aesState.rounds[round].input = [...state];

    // Step 1: InvShiftRows
    state = invShiftRows(state);
    console.log("After InvShiftRows:", bytesToHexString(state));
    aesState.rounds[round].shiftRows = [...state];

    // Step 2: InvSubBytes
    state = invSubBytes(state);
    console.log("After InvSubBytes:", bytesToHexString(state));
    aesState.rounds[round].subBytes = [...state];

    // Step 3: AddRoundKey
    const roundKey = getRoundKey(expandedKey, round);
    aesState.rounds[round].key = [...roundKey];
    state = addRoundKey(state, roundKey);
    console.log("After AddRoundKey:", bytesToHexString(state));
    aesState.rounds[round].addRoundKey = [...state];

    // Step 4: InvMixColumns
    state = invMixColumns(state);
    console.log("After InvMixColumns:", bytesToHexString(state));
    aesState.rounds[round].mixColumns = [...state];
    
    // Update key schedule visualization
    updateKeyScheduleVisualization(round, expandedKey);
  }

  // Final round (round 0) - no InvMixColumns
  console.log("\n▶ FINAL ROUND (0)");
  console.log("Input to Final Round:", bytesToHexString(state));
  aesState.rounds[0].input = [...state];

  // Step 1: InvShiftRows
  state = invShiftRows(state);
  console.log("After InvShiftRows:", bytesToHexString(state));
  aesState.rounds[0].shiftRows = [...state];

  // Step 2: InvSubBytes
  state = invSubBytes(state);
  console.log("After InvSubBytes:", bytesToHexString(state));
  aesState.rounds[0].subBytes = [...state];

  // Step 3: AddRoundKey (with original key)
  const finalRoundKey = getRoundKey(expandedKey, 0);
  aesState.rounds[0].key = [...finalRoundKey];
  state = addRoundKey(state, finalRoundKey);
  console.log("After AddRoundKey:", bytesToHexString(state));
  aesState.rounds[0].addRoundKey = [...state];

  console.log("\nFinal Decrypted Output:", bytesToHexString(state));
  return state;
}

// Function to update key schedule visualization data
function updateKeyScheduleVisualization(round, expandedKey) {
  if (round <= 0) return; // Round 0 has no key schedule visualization
  
  // Get the last column of the previous round key
  const prevKeyLastCol = [
    expandedKey[(round - 1) * 16 + 12],
    expandedKey[(round - 1) * 16 + 13],
    expandedKey[(round - 1) * 16 + 14],
    expandedKey[(round - 1) * 16 + 15],
  ];

  // RotWord - Rotate the word left by one byte
  const rotWord = [
    prevKeyLastCol[1],
    prevKeyLastCol[2],
    prevKeyLastCol[3],
    prevKeyLastCol[0],
  ];
  aesState.rounds[round].keySchedule.leftShift = [...rotWord];

  // SubWord - Apply S-box to each byte
  const subWord = rotWord.map((byte) => sBox[byte]);
  aesState.rounds[round].keySchedule.subBytes = [...subWord];

  // XOR with Rcon
  const xorWithRcon = [
    subWord[0] ^ rCon[round - 1][0],
    subWord[1],
    subWord[2],
    subWord[3],
  ];
  aesState.rounds[round].keySchedule.xorRcon = [...xorWithRcon];

  // Full key generation for reference
  const roundKey = getRoundKey(expandedKey, round);
  aesState.rounds[round].keySchedule.generated = [...roundKey];
}


export { encryptAES, decryptAES };
