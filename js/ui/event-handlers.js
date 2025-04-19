import aesState from "../state/aes-state.js";
import {
  encryptAES,
  decryptAES,
  recomputeFromRound,
} from "../core/aes-operations.js";
import { parseInput, bytesToHexString, hexToText } from "../core/utils.js";
import {
  updateMatrixDisplay,
  updateAllRoundDisplays,
  updateCounters,
} from "./matrix-display.js";
import { displayOperation } from "./operation-display.js";

// Function to handle matrix input changes
function handleMatrixInput(inputElement, round, type) {
  const value = inputElement.value.trim();
  let bytes = [];

  // Parse the input
  if (value) {
    bytes = parseInput(value);
    // Ensure we have 16 bytes
    bytes = bytes.slice(0, 16);
  }

  while (bytes.length < 16) {
    bytes.push(0);
  }

  // Update the matrix display next to the input
  const matrix = inputElement.nextElementSibling;
  if (!matrix) return;

  const cells = matrix.querySelectorAll(".matrix-cell");
  bytes.forEach((byte, index) => {
    if (cells[index]) {
      cells[index].textContent = formatCell(byte);
    }
  });

  // Update the state based on input type
  if (type === "input") {
    aesState.rounds[round - 1].input = [...bytes];
  } else if (type === "key") {
    aesState.rounds[round - 1].key = [...bytes];
  }

  // No automatic recomputation to allow for manual control
}

// Handler for the encrypt button
function handleEncrypt() {
  aesState.isEncryption = true;

  // Get input and key from the UI
  const plaintextInput = document.getElementById("plaintext-input");
  const keyInput = document.getElementById("key-input");

  if (!plaintextInput || !keyInput) {
    console.error("Input elements not found");
    return;
  }

  const plaintext = parseInput(plaintextInput.value);
  const key = parseInput(keyInput.value);

  // Perform encryption
  const ciphertext = encryptAES(plaintext, key);

  // Update the UI to show encryption result
  const displayTitle = document.getElementById("display-title");
  if (displayTitle) {
    displayTitle.textContent = "Encryption Result";
  }

  updateMatrixDisplay("display-matrix", ciphertext);
  updateAllRoundDisplays();

  // Display final result in a nicer format
  displayFinalResult(ciphertext, true);

  // Return the ciphertext for testing/validation
  return ciphertext;
}

// Handler for the decrypt button
function handleDecrypt() {
  aesState.isEncryption = false;

  // Get input and key from the UI
  const ciphertextInput = document.getElementById("plaintext-input");
  const keyInput = document.getElementById("key-input");

  if (!ciphertextInput || !keyInput) {
    console.error("Input elements not found");
    return;
  }

  const ciphertext = parseInput(ciphertextInput.value);
  const key = parseInput(keyInput.value);

  // Perform decryption
  const plaintext = decryptAES(ciphertext, key);

  // Update the UI to show decryption result
  const displayTitle = document.getElementById("display-title");
  if (displayTitle) {
    displayTitle.textContent = "Decryption Result";
  }

  updateMatrixDisplay("display-matrix", plaintext);
  updateAllRoundDisplays();

  // Display final result in a nicer format
  displayFinalResult(plaintext, false);

  // Return the plaintext for testing/validation
  return plaintext;
}

// Handler for the reset button
function handleReset() {
  // Reset all state
  aesState.input.plaintext.fill(0);
  aesState.input.key.fill(0);

  for (let i = 0; i < 10; i++) {
    aesState.rounds[i].input.fill(0);
    aesState.rounds[i].key.fill(0);
    aesState.rounds[i].addRoundKey.fill(0);
    aesState.rounds[i].subBytes.fill(0);
    aesState.rounds[i].shiftRows.fill(0);
    aesState.rounds[i].mixColumns.fill(0);
    aesState.rounds[i].keySchedule.leftShift.fill(0);
    aesState.rounds[i].keySchedule.subBytes.fill(0);
    aesState.rounds[i].keySchedule.xorRcon.fill(0);
    aesState.rounds[i].keySchedule.generated.fill(0);
  }

  // Reset UI
  const plaintextInput = document.getElementById("plaintext-input");
  const keyInput = document.getElementById("key-input");
  const displayTitle = document.getElementById("display-title");

  if (plaintextInput) plaintextInput.value = "";
  if (keyInput) keyInput.value = "";
  if (displayTitle) displayTitle.textContent = "No Operation Selected";

  updateMatrixDisplay("state-matrix", aesState.input.plaintext);
  updateMatrixDisplay("key-matrix", aesState.input.key);
  updateMatrixDisplay("display-matrix", new Array(16).fill(0));

  // Hide the results container if it exists
  const resultContainer = document.getElementById("final-result");
  if (resultContainer) {
    resultContainer.style.display = "none";
  }

  // Hide the comparison container if it exists
  const comparisonContainer = document.getElementById("operation-comparison");
  if (comparisonContainer) {
    comparisonContainer.style.display = "none";
  }

  // Clear the operation description
  const descriptionElement = document.getElementById("operation-description");
  if (descriptionElement) {
    descriptionElement.textContent = "";
  }

  updateAllRoundDisplays();
  updateCounters();
}

// Function to display the final result in a user-friendly format
function displayFinalResult(result, isEncryption) {
  // Create or get the result container
  let resultContainer = document.getElementById("final-result");
  if (!resultContainer) {
    resultContainer = document.createElement("div");
    resultContainer.id = "final-result";
    resultContainer.style.marginTop = "20px";
    resultContainer.style.padding = "15px";
    resultContainer.style.backgroundColor = "#f0f8ff";
    resultContainer.style.borderRadius = "8px";
    resultContainer.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";

    // Create the structure for the result display
    resultContainer.innerHTML = `
      <div id="result-title" style="font-size: 18px; font-weight: bold; margin-bottom: 10px; text-align: center; color: var(--primary-color);"></div>
      <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">
        <div style="flex: 1; min-width: 250px;">
          <div style="font-weight: bold; margin-bottom: 5px;">Hex Format:</div>
          <input id="result-hex" type="text" class="input-field" style="width: 100%;" readonly>
        </div>
        <div style="flex: 1; min-width: 250px;">
          <div style="font-weight: bold; margin-bottom: 5px;">Text Representation:</div>
          <input id="result-text" type="text" class="input-field" style="width: 100%;" readonly>
        </div>
      </div>
      <div style="text-align: center; margin-top: 15px;">
        <button id="copy-hex-btn" class="btn" style="background-color: var(--info); margin-right: 10px;">Copy Hex</button>
        <button id="copy-text-btn" class="btn" style="background-color: var(--secondary-color);">Copy Text</button>
      </div>
    `;

    // Add it to the DOM
    const operationDisplay = document.querySelector(".operation-display");
    if (operationDisplay) {
      operationDisplay.appendChild(resultContainer);
    }

    // Add event listeners for the copy buttons
    document
      .getElementById("copy-hex-btn")
      .addEventListener("click", function () {
        const hexValue = document.getElementById("result-hex").value;
        navigator.clipboard
          .writeText(hexValue)
          .then(() => {
            this.textContent = "Copied!";
            setTimeout(() => {
              this.textContent = "Copy Hex";
            }, 2000);
          })
          .catch((err) => {
            console.error("Could not copy text: ", err);
            alert("Failed to copy to clipboard");
          });
      });

    document
      .getElementById("copy-text-btn")
      .addEventListener("click", function () {
        const textValue = document.getElementById("result-text").value;
        navigator.clipboard
          .writeText(textValue)
          .then(() => {
            this.textContent = "Copied!";
            setTimeout(() => {
              this.textContent = "Copy Text";
            }, 2000);
          })
          .catch((err) => {
            console.error("Could not copy text: ", err);
            alert("Failed to copy to clipboard");
          });
      });
  }

  // Update the result container
  resultContainer.style.display = "block";
  document.getElementById("result-title").textContent = isEncryption
    ? "Encryption Result (Ciphertext)"
    : "Decryption Result (Plaintext)";

  // Set the hex and text values
  document.getElementById("result-hex").value = "0x" + bytesToHexString(result);
  document.getElementById("result-text").value = hexToText(result);
}

// Set up input handlers for the UI
function setupInputHandlers() {
  // Set up main input fields
  const plaintextInput = document.getElementById("plaintext-input");
  const keyInput = document.getElementById("key-input");

  if (plaintextInput) {
    plaintextInput.addEventListener("input", () => {
      updateCounters();
      const bytes = parseInput(plaintextInput.value);
      aesState.input.plaintext = bytes.slice(0, 16);
      while (aesState.input.plaintext.length < 16)
        aesState.input.plaintext.push(0);
      updateMatrixDisplay("state-matrix", aesState.input.plaintext);
    });
  }

  if (keyInput) {
    keyInput.addEventListener("input", () => {
      updateCounters();
      const bytes = parseInput(keyInput.value);
      aesState.input.key = bytes.slice(0, 16);
      while (aesState.input.key.length < 16) aesState.input.key.push(0);
      updateMatrixDisplay("key-matrix", aesState.input.key);
    });
  }

  // Set up encrypt, decrypt, and reset buttons
  const encryptBtn = document.querySelector(".btn-encrypt");
  if (encryptBtn) {
    encryptBtn.addEventListener("click", handleEncrypt);
  }

  const decryptBtn = document.querySelector(".btn-decrypt");
  if (decryptBtn) {
    decryptBtn.addEventListener("click", handleDecrypt);
  }

  const resetBtn = document.querySelector(".btn-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", handleReset);
  }

  // Set up operation display buttons
  const displayButtons = document.querySelectorAll(".btn-display");
  displayButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const round = parseInt(button.getAttribute("data-round"));
      const operation = button.getAttribute("data-operation");

      displayOperation(round, operation);

      // Highlight the active button
      displayButtons.forEach((btn) => btn.classList.remove("active-operation"));
      button.classList.add("active-operation");
    });
  });

  // Set up matrix inputs for rounds
  const matrixInputs = document.querySelectorAll(".matrix-input");
  matrixInputs.forEach((input) => {
    input.addEventListener("input", () => {
      const round = parseInt(input.getAttribute("data-round"));
      const type = input.getAttribute("data-type");
      handleMatrixInput(input, round, type);
    });
  });
}

export {
  handleMatrixInput,
  handleEncrypt,
  handleDecrypt,
  handleReset,
  displayFinalResult,
  setupInputHandlers,
};
