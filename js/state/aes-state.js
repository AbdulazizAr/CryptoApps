// Initialize the main state object to store all AES operations data
const aesState = {
  input: {
    plaintext: new Array(16).fill(0),
    key: new Array(16).fill(0),
  },
  rounds: [], // Will hold state for each encryption round
  decryptionRounds: [], // Will hold state for each decryption round
  currentOperation: null,
  isEncryption: true,
};

// Initialize for 11 steps of encryption (Round 0 to Round 10)
for (let i = 0; i <= 10; i++) {
  aesState.rounds.push({
    roundNumber: i, // Round number 0 to 10 for encryption
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

// Initialize for 11 steps of decryption (Mirroring encryption rounds in reverse)
for (let i = 0; i <= 10; i++) {
  aesState.decryptionRounds.push({
    roundNumber: i, // Round number 0 to 10 for decryption (reverse order)
    input: new Array(16).fill(0),
    key: new Array(16).fill(0),
    addRoundKey: new Array(16).fill(0),
    invSubBytes: new Array(16).fill(0),
    invShiftRows: new Array(16).fill(0),
    invMixColumns: new Array(16).fill(0),
  });
}

export default aesState;
