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

export default aesState;
