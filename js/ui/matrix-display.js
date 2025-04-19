import { formatCell } from "../core/utils.js";
import aesState from "../state/aes-state.js";
import { parseInput } from "../core/utils.js";

// Function to update the display of matrices in the UI
function updateMatrixDisplay(matrixId, data) {
  const matrixCells = document.querySelectorAll(`#${matrixId} .matrix-cell`);

  if (!matrixCells || matrixCells.length === 0) {
    console.warn(`Matrix cells not found for ${matrixId}`);
    return;
  }

  // Define the correct column-major to row-major mapping
  const mapping = [
    0,
    4,
    8,
    12, // First row (columns 0, 1, 2, 3)
    1,
    5,
    9,
    13, // Second row (columns 0, 1, 2, 3)
    2,
    6,
    10,
    14, // Third row (columns 0, 1, 2, 3)
    3,
    7,
    11,
    15, // Fourth row (columns 0, 1, 2, 3)
  ];

  for (let i = 0; i < Math.min(16, matrixCells.length); i++) {
    const displayIndex = i;
    const dataIndex = mapping[i]; // Get the correct index from the mapping

    if (dataIndex < data.length) {
      matrixCells[displayIndex].textContent = formatCell(data[dataIndex]); // Use dataIndex here
    } else {
      matrixCells[displayIndex].textContent = "00";
    }
  }
}

// Function to create matrix cells for visualization
function generateMatrixCells(matrixId, data) {
  const matrix = document.getElementById(matrixId);
  if (!matrix) return;

  matrix.innerHTML = "";

  for (let i = 0; i < 16; i++) {
    const cell = document.createElement("div");
    cell.className = "matrix-cell";
    cell.textContent = formatCell(data[i] || 0);
    matrix.appendChild(cell);
  }
}

// Update input counters for plaintext and key
function updateCounters() {
  const plaintextInput = document.getElementById("plaintext-input");
  const keyInput = document.getElementById("key-input");
  const plaintextCounter = document.getElementById("plaintext-counter");
  const keyCounter = document.getElementById("key-counter");

  if (!plaintextInput || !keyInput || !plaintextCounter || !keyCounter) {
    console.warn("Counter elements not found");
    return;
  }

  // Update plaintext counter
  const plaintextBytes = parseInput(plaintextInput.value);
  plaintextCounter.textContent = `${plaintextBytes.length * 8} bits (${
    plaintextBytes.length
  } bytes)`;

  // Update key counter
  const keyBytes = parseInput(keyInput.value);
  keyCounter.textContent = `${keyBytes.length * 8} bits (${
    keyBytes.length
  } bytes)`;
}

// Update a specific round's UI displays
function updateRoundDisplays(round) {
  const roundIndex = round - 1;

  // Find the round's input and key matrix elements in the UI
  const inputMatrixElement = document.querySelector(
    `.matrix-input[data-round="${round}"][data-type="input"]`
  );
  const keyMatrixElement = document.querySelector(
    `.matrix-input[data-round="${round}"][data-type="key"]`
  );

  if (!inputMatrixElement || !keyMatrixElement) {
    console.warn(`Matrix input elements not found for round ${round}`);
    return;
  }

  const inputMatrix = inputMatrixElement.nextElementSibling;
  const keyMatrix = keyMatrixElement.nextElementSibling;

  if (!inputMatrix || !keyMatrix) {
    console.warn(`Matrix elements not found for round ${round}`);
    return;
  }

  // Update input matrix display
  const inputCells = inputMatrix.querySelectorAll(".matrix-cell");
  aesState.rounds[roundIndex].input.forEach((byte, index) => {
    if (inputCells[index]) {
      inputCells[index].textContent = formatCell(byte);
    }
  });

  // Update key matrix display
  const keyCells = keyMatrix.querySelectorAll(".matrix-cell");
  aesState.rounds[roundIndex].key.forEach((byte, index) => {
    if (keyCells[index]) {
      keyCells[index].textContent = formatCell(byte);
    }
  });
}

// Update all rounds' UI displays
function updateAllRoundDisplays() {
  for (let round = 1; round <= 10; round++) {
    updateRoundDisplays(round);
  }
}

export {
  updateMatrixDisplay,
  generateMatrixCells,
  updateCounters,
  updateRoundDisplays,
  updateAllRoundDisplays,
};
