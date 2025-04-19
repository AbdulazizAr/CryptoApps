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
import { bytesToHexString } from "./utils.js";
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
  let state = addRoundKey(plaintext, key);
  aesState.rounds[0].input = [...plaintext];
  aesState.rounds[0].key = [...key];
  aesState.rounds[0].addRoundKey = [...state];

  console.log("After initial AddRoundKey:", state);
  console.log("Hex:", bytesToHexString(state)); // Check here

  for (let round = 1; round < 10; round++) {
    console.log(`\n▶ ROUND ${round + 1}`);
    console.log(
      "input to Round " + (round + 1) + ":\n" + bytesToHexString(state)
    );
    console.log("Hex Input:", bytesToHexString(state)); // Check here

    // SubBytes
    console.log("Before SubBytes:", state);
    state = subBytes(state);
    console.log("After SubBytes:", state);
    console.log("After SubBytes (in aes-operations):", round + 1, [...state]);
    console.log("Hex SubBytes:", bytesToHexString(state)); // Check here
    aesState.rounds[round].subBytes = [...state];

    // ShiftRows
    state = shiftRows(state);
    console.log("After ShiftRows:", state);
    console.log("Hex ShiftRows:", bytesToHexString(state)); // Check here
    aesState.rounds[round].shiftRows = [...state];

    // MixColumns
    if (round < 9) {
      state = mixColumns(state);
      console.log("After MixColumns:", state);
      console.log("Hex MixColumns:", bytesToHexString(state)); // Check here
      aesState.rounds[round].mixColumns = [...state];
    }

    // // Key expansion for debugging (This part seems a bit unusual here)
    // const prevKey = aesState.rounds[round - 1].key;
    // const prevKeyLastCol = [prevKey[12], prevKey[13], prevKey[14], prevKey[15]];
    // const rotWord = [
    //   prevKeyLastCol[1],
    //   prevKeyLastCol[2],
    //   prevKeyLastCol[3],
    //   prevKeyLastCol[0],
    // ];
    // const subWord = rotWord.map((b) => sBox[b]);
    // const xorWithRcon = [
    //   subWord[0] ^ rCon[round][0],
    //   subWord[1],
    //   subWord[2],
    //   subWord[3],
    // ];
    // console.log("LeftShift-1 (Key Rotation):", bytesToHexString(rotWord));
    // console.log("SubBytes on Key:", bytesToHexString(subWord));
    // console.log("XOR with Round Constant:", bytesToHexString(xorWithRcon));

    // AddRoundKey
    const roundKey = getRoundKey(keyExpansion(key), round + 1);
    state = addRoundKey(state, roundKey);
    console.log("After AddRoundKey:", state);
    console.log("Hex AddRoundKey:", bytesToHexString(state)); // Check here
    aesState.rounds[round].addRoundKey = [...state];
  }

  // Final round (10) - no MixColumns
  aesState.rounds[9].input = [...state];

  // SubBytes
  state = subBytes(state);
  aesState.rounds[9].subBytes = [...state];

  // ShiftRows
  state = shiftRows(state);
  aesState.rounds[9].shiftRows = [...state];

  // Get the final round key
  const finalRoundKey = getRoundKey(expandedKey, 10);
  aesState.rounds[9].key = [...finalRoundKey];

  // AddRoundKey
  state = addRoundKey(state, finalRoundKey);
  aesState.rounds[9].addRoundKey = [...state];

  // Store MixColumns data as well for UI consistency (just copy the result)
  aesState.rounds[9].mixColumns = [...state];

  console.log("Final Ciphertext:", state);
  console.log("Final Hex:", bytesToHexString(state)); // Check here

  // Return the ciphertext
  return state;
}

// Main decryption function
function decryptAES(ciphertext, key) {
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

  // Initial state is the ciphertext
  let state = [...ciphertext];

  // Initial round (for decryption, this is the final round of encryption in reverse)
  // AddRoundKey with the final round key
  const finalRoundKey = getRoundKey(expandedKey, 10);
  state = addRoundKey(state, finalRoundKey);

  // Store the state for visualization
  aesState.rounds[9].input = [...ciphertext];
  aesState.rounds[9].key = [...finalRoundKey];
  aesState.rounds[9].addRoundKey = [...state];

  // InvShiftRows
  state = invShiftRows(state);
  aesState.rounds[9].shiftRows = [...state];

  // InvSubBytes
  state = invSubBytes(state);
  aesState.rounds[9].subBytes = [...state];

  // Main rounds (9-1) in reverse order
  for (let round = 9; round >= 1; round--) {
    // Get the round key for the current round
    const roundKey = getRoundKey(expandedKey, round);

    // AddRoundKey
    state = addRoundKey(state, roundKey);

    // Store for previous round visualization
    aesState.rounds[round - 1].input = [...state];
    aesState.rounds[round - 1].key = [...roundKey];
    aesState.rounds[round - 1].addRoundKey = [...state];

    // InvMixColumns (except for the last round which is round 0)
    state = invMixColumns(state);
    aesState.rounds[round - 1].mixColumns = [...state];

    // InvShiftRows
    state = invShiftRows(state);
    aesState.rounds[round - 1].shiftRows = [...state];

    // InvSubBytes
    state = invSubBytes(state);
    aesState.rounds[round - 1].subBytes = [...state];

    // Store key schedule information in the appropriate round for visualization
    if (round < 10) {
      // Get the last column of the previous round key
      const prevKeyLastCol = [
        expandedKey[(round - 1) * 16 + 12],
        expandedKey[(round - 1) * 16 + 13],
        expandedKey[(round - 1) * 16 + 14],
        expandedKey[(round - 1) * 16 + 15],
      ];

      // RotWord
      const rotWord = [
        prevKeyLastCol[1],
        prevKeyLastCol[2],
        prevKeyLastCol[3],
        prevKeyLastCol[0],
      ];
      aesState.rounds[round].keySchedule.leftShift = [...rotWord];

      // SubBytes
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
      aesState.rounds[round].keySchedule.generated = [...roundKey];
    }
  }

  // Final round (for decryption, this is round 0)
  // AddRoundKey with the initial key
  const initialKey = getRoundKey(expandedKey, 0);
  state = addRoundKey(state, initialKey);

  // Store for visualization (this is not part of the rounds[] array since we use 0-based index)
  aesState.rounds[0].key = [...initialKey]; // We already stored the input earlier

  // Return the plaintext
  return state;
}

// Function to handle recalculation of rounds for visualization
function recomputeFromRound(startRound) {
  // Validate the start round
  if (startRound < 1 || startRound > 10) {
    console.error("Invalid round number for recomputation:", startRound);
    return;
  }

  if (aesState.isEncryption) {
    // Handle encryption recomputation
    recomputeEncryptionFromRound(startRound);
  } else {
    // Handle decryption recomputation
    recomputeDecryptionFromRound(startRound);
  }

  // Update all UI displays for affected rounds
  for (let round = startRound; round <= 10; round++) {
    updateRoundDisplays(round);
  }

  // If we recalculated all the way to the end, update the final result display
  if (startRound <= 10) {
    const finalResult = aesState.isEncryption
      ? aesState.rounds[9].addRoundKey // Final round output for encryption
      : aesState.rounds[0].addRoundKey; // Final round output for decryption

    // Update the display matrix to show the final result
    document.getElementById("display-title").textContent = aesState.isEncryption
      ? "Encryption Result"
      : "Decryption Result";
    updateMatrixDisplay("display-matrix", finalResult);
  }
}

// Helper function for encryption recomputation
function recomputeEncryptionFromRound(startRound) {
  // Expand the key once
  const expandedKey = keyExpansion(aesState.input.key);

  // For first round, we start with the input plaintext
  if (startRound === 1) {
    // Initial AddRoundKey with the original key

    let state = addRoundKey(aesState.input.plaintext, aesState.input.key);
    aesState.rounds[0].input = [...aesState.input.plaintext];
    aesState.rounds[0].key = [...aesState.input.key];
    aesState.rounds[0].addRoundKey = [...state];
    startRound = 2; // Continue with round 2
  }

  // Start state is the output of the previous round
  let state = [...aesState.rounds[startRound - 2].addRoundKey];

  // Recompute all subsequent rounds
  for (let round = startRound - 1; round < 10; round++) {
    // Store round input
    aesState.rounds[round].input = [...state];

    // SubBytes
    state = subBytes(state);
    aesState.rounds[round].subBytes = [...state];

    // ShiftRows
    state = shiftRows(state);
    aesState.rounds[round].shiftRows = [...state];

    // MixColumns (except for final round)
    if (round < 9) {
      state = mixColumns(state);
      aesState.rounds[round].mixColumns = [...state];
    }

    // Get the round key
    const roundKey = getRoundKey(expandedKey, round + 1);
    aesState.rounds[round].key = [...roundKey];

    // AddRoundKey
    state = addRoundKey(state, roundKey);
    aesState.rounds[round].addRoundKey = [...state];

    // Special case for the final round
    if (round === 9) {
      // Store the result in mixColumns for UI consistency
      aesState.rounds[round].mixColumns = [...state];
    }

    // Update key schedule information
    if (round > 0) {
      // Get the last column of the previous round key
      const prevKeyLastCol = [
        expandedKey[(round - 1) * 16 + 12],
        expandedKey[(round - 1) * 16 + 13],
        expandedKey[(round - 1) * 16 + 14],
        expandedKey[(round - 1) * 16 + 15],
      ];

      // RotWord
      const rotWord = [
        prevKeyLastCol[1],
        prevKeyLastCol[2],
        prevKeyLastCol[3],
        prevKeyLastCol[0],
      ];
      aesState.rounds[round].keySchedule.leftShift = [...rotWord];

      // SubBytes
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
      aesState.rounds[round].keySchedule.generated = [...roundKey];
    }
  }
}

// Helper function for decryption recomputation
function recomputeDecryptionFromRound(startRound) {
  // We're working in reverse for decryption
  const expandedKey = keyExpansion(aesState.input.key);

  // For round 10 (first round in decryption), we start with the input ciphertext
  if (startRound === 10) {
    // Get the final round key
    const finalRoundKey = getRoundKey(expandedKey, 10);

    // Initial AddRoundKey with the final round key
    let state = addRoundKey(aesState.input.plaintext, finalRoundKey);
    aesState.rounds[9].input = [...aesState.input.plaintext];
    aesState.rounds[9].key = [...finalRoundKey];
    aesState.rounds[9].addRoundKey = [...state];

    // Apply InvShiftRows and InvSubBytes to prepare for the next round
    state = invShiftRows(state);
    aesState.rounds[9].shiftRows = [...state];

    state = invSubBytes(state);
    aesState.rounds[9].subBytes = [...state];

    startRound = 9; // Continue with round 9
  }

  // Start state is the output of the next round (remember we're going backward)
  let state = [...aesState.rounds[startRound].subBytes];

  // Recompute in reverse order, from startRound down to 1
  for (let round = startRound; round >= 1; round--) {
    // Get the round key for this round
    const roundKey = getRoundKey(expandedKey, round);

    // AddRoundKey
    state = addRoundKey(state, roundKey);
    aesState.rounds[round - 1].input = [...state];
    aesState.rounds[round - 1].key = [...roundKey];
    aesState.rounds[round - 1].addRoundKey = [...state];

    // InvMixColumns (except for the first round)
    state = invMixColumns(state);
    aesState.rounds[round - 1].mixColumns = [...state];

    // InvShiftRows
    state = invShiftRows(state);
    aesState.rounds[round - 1].shiftRows = [...state];

    // InvSubBytes
    state = invSubBytes(state);
    aesState.rounds[round - 1].subBytes = [...state];

    // Update key schedule information if needed
    if (round < 10) {
      // Store key schedule information in the appropriate round
      const prevKeyLastCol = [
        expandedKey[(round - 1) * 16 + 12],
        expandedKey[(round - 1) * 16 + 13],
        expandedKey[(round - 1) * 16 + 14],
        expandedKey[(round - 1) * 16 + 15],
      ];

      // RotWord
      const rotWord = [
        prevKeyLastCol[1],
        prevKeyLastCol[2],
        prevKeyLastCol[3],
        prevKeyLastCol[0],
      ];
      aesState.rounds[round].keySchedule.leftShift = [...rotWord];

      // SubBytes
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
      aesState.rounds[round].keySchedule.generated = [...roundKey];
    }
  }

  // Final round: just apply AddRoundKey with the initial key
  const initialKey = getRoundKey(expandedKey, 0);
  state = addRoundKey(state, initialKey);
  aesState.rounds[0].addRoundKey = [...state]; // This is the plaintext result
}

export {
  encryptAES,
  decryptAES,
  recomputeFromRound,
  recomputeEncryptionFromRound,
  recomputeDecryptionFromRound,
};
