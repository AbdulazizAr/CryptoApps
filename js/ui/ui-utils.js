// Function to enhance UI interactions with visual feedback and effects
function enhanceUIInteractions() {
  // Add CSS for highlighting active operations
  const style = document.createElement("style");
  style.textContent = `
    .active-operation {
      background-color: var(--accent-color) !important;
      box-shadow: 0 0 8px rgba(244, 196, 48, 0.7) !important;
    }
    
    .matrix-cell {
      transition: background-color 0.3s;
    }
    
    .highlight-cell {
      background-color: rgba(244, 196, 48, 0.3);
    }
    
    .round-header.active {
      background-color: var(--secondary-color) !important;
    }
    
    .round-input-modified {
      border-color: var(--accent-color) !important;
      box-shadow: 0 0 5px var(--accent-color) !important;
    }
  `;
  document.head.appendChild(style);

  // Add hover effect to matrix cells to show coordinates
  const allMatrixCells = document.querySelectorAll(".matrix-cell");
  allMatrixCells.forEach((cell, index) => {
    // Calculate row and column (assuming 4x4 matrix)
    const row = Math.floor((index % 16) / 4);
    const col = index % 4;

    cell.addEventListener("mouseenter", function () {
      this.setAttribute("title", `Position: [${row},${col}]`);
      this.classList.add("highlight-cell");
    });

    cell.addEventListener("mouseleave", function () {
      this.classList.remove("highlight-cell");
    });
  });

  // Enhance the matrix input fields
  const matrixInputs = document.querySelectorAll(".matrix-input");
  matrixInputs.forEach((input) => {
    // Add indicator when input is modified
    input.addEventListener("input", function () {
      this.classList.add("round-input-modified");
    });
  });

  // Make round headers more responsive
  const roundHeaders = document.querySelectorAll(".round-header");
  roundHeaders.forEach((header) => {
    header.style.cursor = "pointer";
  });
}

// Function to add tooltips for AES operations
function addOperationTooltips() {
  const tooltips = {
    addRoundKey:
      "AddRoundKey: XORs each byte of the state matrix with a byte from the round key",
    subBytes:
      "SubBytes: Substitutes each byte with its corresponding value in the S-box for non-linearity",
    shiftRows: "ShiftRows: Shifts the rows of the state matrix for diffusion",
    mixColumns: "MixColumns: Mixes data within each column for diffusion",
    keyLS1:
      "LeftShift-1: Rotates the last column of the previous round key to the left by one position",
    keySubBytes:
      "SubBytes on Key: Applies the S-box to each byte of the rotated word",
    keyXorRcon:
      "XOR with Rcon: XORs the first byte with a round-dependent constant",
  };

  const operationButtons = document.querySelectorAll(".btn-display");
  operationButtons.forEach((button) => {
    const operation = button.getAttribute("data-operation");
    if (tooltips[operation]) {
      button.setAttribute("title", tooltips[operation]);
    }
  });
}

// Function to highlight changes between states for better visualization
function highlightStateChanges(beforeState, afterState) {
  // Create an array to track which cells changed
  const changedIndices = [];

  // Find cells that changed
  for (let i = 0; i < 16; i++) {
    if (beforeState[i] !== afterState[i]) {
      changedIndices.push(i);
    }
  }

  return changedIndices;
}

// Function to set up export/import functionality
function setupExportImport(aesState) {
  // Create export/import buttons
  const buttonGroup = document.querySelector(".button-group");
  if (!buttonGroup) return;

  const exportButton = document.createElement("button");
  exportButton.textContent = "Export State";
  exportButton.className = "btn";
  exportButton.style.backgroundColor = "var(--info)";

  const importButton = document.createElement("button");
  importButton.textContent = "Import State";
  importButton.className = "btn";
  importButton.style.backgroundColor = "var(--warning)";

  buttonGroup.appendChild(exportButton);
  buttonGroup.appendChild(importButton);

  // Export functionality
  exportButton.addEventListener("click", function () {
    const stateToExport = {
      input: aesState.input,
      rounds: aesState.rounds,
      isEncryption: aesState.isEncryption,
    };

    const jsonString = JSON.stringify(stateToExport);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "aes_state.json";
    a.click();

    URL.revokeObjectURL(url);

    // Visual feedback
    exportButton.textContent = "✓ Exported";
    setTimeout(() => {
      exportButton.textContent = "Export State";
    }, 2000);
  });

  // Import functionality
  importButton.addEventListener("click", function () {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const importedState = JSON.parse(e.target.result);

          // Update the state
          aesState.input = importedState.input;
          aesState.rounds = importedState.rounds;
          aesState.isEncryption = importedState.isEncryption;

          // Update UI
          updateMatrixDisplay("state-matrix", aesState.input.plaintext);
          updateMatrixDisplay("key-matrix", aesState.input.key);

          // Update input fields
          document.getElementById("plaintext-input").value =
            "0x" + bytesToHexString(aesState.input.plaintext);
          document.getElementById("key-input").value =
            "0x" + bytesToHexString(aesState.input.key);

          // Update all round displays
          updateAllRoundDisplays();
          updateCounters();

          // Visual feedback
          importButton.textContent = "✓ Imported";
          setTimeout(() => {
            importButton.textContent = "Import State";
          }, 2000);
        } catch (error) {
          console.error("Error importing state:", error);
          alert("Error importing state: " + error.message);
        }
      };
      reader.readAsText(file);
    });

    input.click();
  });
}

// Function to animate operations for visual learning
function animateOperation(operation, round, aesState) {
  const roundIndex = round - 1;
  let beforeState = [];
  let afterState = [];

  // Get before and after states based on operation
  switch (operation) {
    case "addRoundKey":
      // The input depends on where in the algorithm we are
      if (aesState.isEncryption) {
        if (round === 1) {
          beforeState = [...aesState.input.plaintext];
        } else if (round === 10) {
          beforeState = [...aesState.rounds[roundIndex].shiftRows];
        } else {
          beforeState = [...aesState.rounds[roundIndex].mixColumns];
        }
      } else {
        // For decryption
        if (round === 10) {
          beforeState = [...aesState.input.plaintext]; // Ciphertext
        } else {
          beforeState = [...aesState.rounds[roundIndex].subBytes];
        }
      }
      afterState = [...aesState.rounds[roundIndex].addRoundKey];
      break;

    case "subBytes":
      beforeState = [...aesState.rounds[roundIndex].input];
      afterState = [...aesState.rounds[roundIndex].subBytes];
      break;

    case "shiftRows":
      beforeState = [...aesState.rounds[roundIndex].subBytes];
      afterState = [...aesState.rounds[roundIndex].shiftRows];
      break;

    case "mixColumns":
      beforeState = [...aesState.rounds[roundIndex].shiftRows];
      afterState = [...aesState.rounds[roundIndex].mixColumns];
      break;
  }

  // Get the changed indices
  const changedIndices = highlightStateChanges(beforeState, afterState);

  // Get the matrix cells
  const displayMatrix = document.getElementById("display-matrix");
  if (!displayMatrix) return;

  const cells = displayMatrix.querySelectorAll(".matrix-cell");

  // Apply animation to changed cells
  changedIndices.forEach((index) => {
    if (cells[index]) {
      cells[index].style.transition = "background-color 0.3s ease";
      cells[index].style.backgroundColor = "#ffeb3b"; // Highlight yellow

      // Revert back after a delay
      setTimeout(() => {
        cells[index].style.backgroundColor = "";
      }, 1000);
    }
  });
}

export {
  enhanceUIInteractions,
  addOperationTooltips,
  highlightStateChanges,
  setupExportImport,
  animateOperation,
};
