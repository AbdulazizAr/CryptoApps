// Read-only trace built from the same state that produces the final result.
import aesState from '../state/aes-state.js';
export function buildTrace(isEncryption) {
  const rows = [];
  const add = (round, operation, bytes) => rows.push({round, operation, bytes: [...bytes]});
  const rounds = isEncryption ? Array.from({length:11},(_,i)=>i) : Array.from({length:11},(_,i)=>10-i);
  for (const round of rounds) {
    const state = aesState.rounds[round];
    add(round, 'Input', state.input);
    if (isEncryption && round > 0) {
      add(round, 'SubBytes', state.subBytes);
      add(round, 'ShiftRows', state.shiftRows);
      if (round < 10) add(round, 'MixColumns', state.mixColumns);
    } else if (!isEncryption && round < 10) {
      add(round, 'InvShiftRows', state.shiftRows);
      add(round, 'InvSubBytes', state.subBytes);
    }
    add(round, 'Round key', state.key);
    add(round, 'AddRoundKey', state.addRoundKey);
    if (!isEncryption && round > 0 && round < 10) add(round, 'InvMixColumns', state.mixColumns);
  }
  return rows;
}
