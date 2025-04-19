import {
  sBox,
  invSBox,
  mul2,
  mul3,
  mul9,
  mul11,
  mul13,
  mul14,
} from "./constants.js";

// Core AES operations
function addRoundKey(state, key) {
  return state.map((byte, i) => byte ^ key[i]);
}

function subBytes(state) {
  return state.map((byte) => sBox[byte]);
}

function invSubBytes(state) {
  return state.map((byte) => invSBox[byte]);
}

function shiftRows(state) {
  // AES state is treated in column-major order
  // Create a new array to hold the result
  const result = new Array(16);

  // Row 0: No shift (s[0,0], s[0,1], s[0,2], s[0,3])
  result[0] = state[0];
  result[4] = state[4];
  result[8] = state[8];
  result[12] = state[12];

  // Row 1: Shift left by 1 (s[1,1], s[1,2], s[1,3], s[1,0])
  result[1] = state[5];
  result[5] = state[9];
  result[9] = state[13];
  result[13] = state[1];

  // Row 2: Shift left by 2 (s[2,2], s[2,3], s[2,0], s[2,1])
  result[2] = state[10];
  result[6] = state[14];
  result[10] = state[2];
  result[14] = state[6];

  // Row 3: Shift left by 3 (s[3,3], s[3,0], s[3,1], s[3,2])
  result[3] = state[15];
  result[7] = state[3];
  result[11] = state[7];
  result[15] = state[11];

  return result;
}

function invShiftRows(state) {
  // Create a new array to hold the result
  const result = new Array(16);

  // Row 0: No shift
  result[0] = state[0];
  result[4] = state[4];
  result[8] = state[8];
  result[12] = state[12];

  // Row 1: Shift right by 1
  result[1] = state[13];
  result[5] = state[1];
  result[9] = state[5];
  result[13] = state[9];

  // Row 2: Shift right by 2
  result[2] = state[10];
  result[6] = state[14];
  result[10] = state[2];
  result[14] = state[6];

  // Row 3: Shift right by 3
  result[3] = state[7];
  result[7] = state[11];
  result[11] = state[15];
  result[15] = state[3];

  return result;
}

function mixColumns(state) {
  const result = new Array(16).fill(0);

  // Process each column
  for (let i = 0; i < 4; i++) {
    const col = i * 4;

    // For each column, apply the matrix multiplication
    result[col] =
      mul2[state[col]] ^ mul3[state[col + 1]] ^ state[col + 2] ^ state[col + 3];
    result[col + 1] =
      state[col] ^ mul2[state[col + 1]] ^ mul3[state[col + 2]] ^ state[col + 3];
    result[col + 2] =
      state[col] ^ state[col + 1] ^ mul2[state[col + 2]] ^ mul3[state[col + 3]];
    result[col + 3] =
      mul3[state[col]] ^ state[col + 1] ^ state[col + 2] ^ mul2[state[col + 3]];
  }

  return result;
}

function invMixColumns(state) {
  const result = new Array(16).fill(0);

  // Process each column
  for (let i = 0; i < 4; i++) {
    const col = i * 4;

    // For each column, apply the inverse matrix multiplication
    result[col] =
      mul14[state[col]] ^
      mul11[state[col + 1]] ^
      mul13[state[col + 2]] ^
      mul9[state[col + 3]];
    result[col + 1] =
      mul9[state[col]] ^
      mul14[state[col + 1]] ^
      mul11[state[col + 2]] ^
      mul13[state[col + 3]];
    result[col + 2] =
      mul13[state[col]] ^
      mul9[state[col + 1]] ^
      mul14[state[col + 2]] ^
      mul11[state[col + 3]];
    result[col + 3] =
      mul11[state[col]] ^
      mul13[state[col + 1]] ^
      mul9[state[col + 2]] ^
      mul14[state[col + 3]];
  }

  return result;
}

export {
  addRoundKey,
  subBytes,
  invSubBytes,
  shiftRows,
  invShiftRows,
  mixColumns,
  invMixColumns,
};
