import { formatCell } from "../core/utils.js";
import aesState from "../state/aes-state.js";
import { updateMatrixDisplay } from "./matrix-display.js";
import { sBox, rCon } from "../core/constants.js";

// Helper function to format operation name
function formatOperationName(operation) {
  switch (operation) {
    case "addRoundKey":
      return "AddRoundKey";
    case "subBytes":
      return "SubBytes";
    case "shiftRows":
      return "ShiftRows";
    case "mixColumns":
      return "MixColumns";
    case "keyLS1":
      return "LeftShift-1";
    case "keySubBytes":
      return "Key SubBytes";
    case "keyXorRcon":
      return "XOR with Rcon";
    default:
      return operation;
  }
}

// Display an operation's result
function displayOperation(round, operation) {
  let title = `Round ${round}: `;
  let data = [];
  let description = "";

  // Get data and description based on operation
  const roundIndex = round - 1;

  switch (operation) {
    case "addRoundKey":
      title += "AddRoundKey";
      description =
        "XOR each byte of the state with the corresponding byte of the round key.";
      data = aesState.rounds[roundIndex].addRoundKey;
      break;
    case "subBytes":
      title += "SubBytes";
      description =
        "Replace each byte with its corresponding value in the S-box for non-linearity.";
      data = aesState.rounds[roundIndex].subBytes;
      break;
    case "shiftRows":
      title += "ShiftRows";
      description = "Shift the rows of the state cyclically for diffusion.";
      data = aesState.rounds[roundIndex].shiftRows;
      break;
    case "mixColumns":
      title += "MixColumns";
      description =
        "Linear transformation that mixes the columns for diffusion.";
      data = aesState.rounds[roundIndex].mixColumns;
      break;
    case "keyLS1":
      title += "Key LeftShift-1";
      description =
        "Rotate the last column of the previous round key to the left by 1 byte.";
      data = new Array(16).fill(0);
      for (let i = 0; i < 4; i++) {
        data[i] = aesState.rounds[roundIndex].keySchedule.leftShift[i];
      }
      break;
    case "keySubBytes":
      title += "Key SubBytes";
      description =
        "Apply S-box substitution to each byte of the rotated word.";
      data = new Array(16).fill(0);
      for (let i = 0; i < 4; i++) {
        data[i] = aesState.rounds[roundIndex].keySchedule.subBytes[i];
      }
      break;
    case "keyXorRcon":
      title += "Key XOR with Rcon";
      description = "XOR the first byte with a round-dependent constant.";
      data = new Array(16).fill(0);
      for (let i = 0; i < 4; i++) {
        data[i] = aesState.rounds[roundIndex].keySchedule.xorRcon[i];
      }
      break;
    default:
      title = "Unknown Operation";
      description = "Operation not recognized.";
      data = new Array(16).fill(0);
  }

  // Update display title
  const displayTitle = document.getElementById("display-title");
  if (displayTitle) {
    displayTitle.textContent = title;
  }

  // Add or update description element
  let descriptionElement = document.getElementById("operation-description");
  if (!descriptionElement) {
    descriptionElement = document.createElement("div");
    descriptionElement.id = "operation-description";
    descriptionElement.style.textAlign = "center";
    descriptionElement.style.marginBottom = "10px";
    descriptionElement.style.padding = "8px";
    descriptionElement.style.backgroundColor = "#f8f9fa";
    descriptionElement.style.borderRadius = "5px";
    descriptionElement.style.fontSize = "14px";

    const displayMatrix = document.getElementById("display-matrix");
    if (displayMatrix && displayMatrix.parentNode) {
      displayMatrix.parentNode.insertBefore(descriptionElement, displayMatrix);
    }
  }

  descriptionElement.textContent = description;

  // Update matrix display
  updateMatrixDisplay("display-matrix", data);

  // Store current operation for reference
  aesState.currentOperation = {
    round: round,
    operation: operation,
  };

  // If key operations, call specialized visualization
  if (
    operation === "keyLS1" ||
    operation === "keySubBytes" ||
    operation === "keyXorRcon"
  ) {
    visualizeKeySchedule(round);
  } else {
    // For normal operations, call the comparison display
    displayOperationComparison(round, operation);
  }
}

// Function to visualize the key schedule
function visualizeKeySchedule(round) {
  if (round <= 1) {
    console.warn("No key schedule visualization available for Round 1");
    document.getElementById("display-title").textContent =
      "Round 1 does not have key schedule operations";
    return;
  }

  const roundIndex = round - 1;

  // Get the key schedule data
  const leftShift = [...aesState.rounds[roundIndex].keySchedule.leftShift];
  const subBytesKey = [...aesState.rounds[roundIndex].keySchedule.subBytes];
  const xorRcon = [...aesState.rounds[roundIndex].keySchedule.xorRcon];

  // Get the previous round key for word references
  const prevRoundKey = [...aesState.rounds[roundIndex - 1].key];
  const currentRoundKey = [...aesState.rounds[roundIndex].key];

  // Calculate the word numbers for this round
  const baseWordNum = (round - 1) * 4; // W0, W4, W8, etc. for each round

  // Display the key schedule operations in the master display area
  document.getElementById(
    "display-title"
  ).textContent = `Round ${round}: Key Schedule (Words W${baseWordNum} - W${
    baseWordNum + 3
  })`;

  // Create a more detailed display showing the words
  let descriptionElement = document.getElementById("operation-description");
  if (!descriptionElement) {
    descriptionElement = document.createElement("div");
    descriptionElement.id = "operation-description";
    descriptionElement.style.textAlign = "center";
    descriptionElement.style.marginBottom = "10px";
    descriptionElement.style.padding = "8px";
    descriptionElement.style.backgroundColor = "#f8f9fa";
    descriptionElement.style.borderRadius = "5px";
    descriptionElement.style.fontSize = "14px";

    const displayMatrix = document.getElementById("display-matrix");
    if (displayMatrix) {
      displayMatrix.parentNode.insertBefore(descriptionElement, displayMatrix);
    }
  }

  // Extract columns (words) from the keys - correctly mapping from column-major format
  // Each word is a column in the 4x4 matrix
  const prevWords = [
    [prevRoundKey[0], prevRoundKey[1], prevRoundKey[2], prevRoundKey[3]], // First column (word)
    [prevRoundKey[4], prevRoundKey[5], prevRoundKey[6], prevRoundKey[7]], // Second column (word)
    [prevRoundKey[8], prevRoundKey[9], prevRoundKey[10], prevRoundKey[11]], // Third column (word)
    [prevRoundKey[12], prevRoundKey[13], prevRoundKey[14], prevRoundKey[15]], // Fourth column (word)
  ];

  const currWords = [
    [
      currentRoundKey[0],
      currentRoundKey[1],
      currentRoundKey[2],
      currentRoundKey[3],
    ], // First column (word)
    [
      currentRoundKey[4],
      currentRoundKey[5],
      currentRoundKey[6],
      currentRoundKey[7],
    ], // Second column (word)
    [
      currentRoundKey[8],
      currentRoundKey[9],
      currentRoundKey[10],
      currentRoundKey[11],
    ], // Third column (word)
    [
      currentRoundKey[12],
      currentRoundKey[13],
      currentRoundKey[14],
      currentRoundKey[15],
    ], // Fourth column (word)
  ];

  // Create the explanation showing each Word
  descriptionElement.innerHTML = `
    <div style="text-align: left;">
      <p><b>Key Schedule Process for Round ${round}:</b></p>
      <p>Previous Round Key Words (columns of the key matrix):</p>
      <ul>
        <li>W${baseWordNum - 4} = [${formatCell(prevWords[0][0])}, ${formatCell(
    prevWords[0][1]
  )}, ${formatCell(prevWords[0][2])}, ${formatCell(prevWords[0][3])}]</li>
        <li>W${baseWordNum - 3} = [${formatCell(prevWords[1][0])}, ${formatCell(
    prevWords[1][1]
  )}, ${formatCell(prevWords[1][2])}, ${formatCell(prevWords[1][3])}]</li>
        <li>W${baseWordNum - 2} = [${formatCell(prevWords[2][0])}, ${formatCell(
    prevWords[2][1]
  )}, ${formatCell(prevWords[2][2])}, ${formatCell(prevWords[2][3])}]</li>
        <li>W${baseWordNum - 1} = [${formatCell(prevWords[3][0])}, ${formatCell(
    prevWords[3][1]
  )}, ${formatCell(prevWords[3][2])}, ${formatCell(prevWords[3][3])}]</li>
      </ul>
      <p>Key Generation Steps:</p>
      <ol>
        <li>Take W${baseWordNum - 1} and rotate: [${formatCell(
    prevWords[3][0]
  )}, ${formatCell(prevWords[3][1])}, ${formatCell(
    prevWords[3][2]
  )}, ${formatCell(prevWords[3][3])}] → [${formatCell(
    leftShift[0]
  )}, ${formatCell(leftShift[1])}, ${formatCell(leftShift[2])}, ${formatCell(
    leftShift[3]
  )}]</li>
        <li>Apply S-box: [${formatCell(leftShift[0])}, ${formatCell(
    leftShift[1]
  )}, ${formatCell(leftShift[2])}, ${formatCell(leftShift[3])}] → [${formatCell(
    subBytesKey[0]
  )}, ${formatCell(subBytesKey[1])}, ${formatCell(
    subBytesKey[2]
  )}, ${formatCell(subBytesKey[3])}]</li>
        <li>XOR with Rcon[${round - 1}] = [${formatCell(
    rCon[round - 1][0]
  )}, ${formatCell(rCon[round - 1][1])}, ${formatCell(
    rCon[round - 1][2]
  )}, ${formatCell(rCon[round - 1][3])}]</li>
        <li>Result: [${formatCell(xorRcon[0])}, ${formatCell(
    xorRcon[1]
  )}, ${formatCell(xorRcon[2])}, ${formatCell(xorRcon[3])}]</li>
      </ol>
      <p>New Round Key Words:</p>
      <ul>
        <li>W${baseWordNum} = W${baseWordNum - 4} ⊕ transformed W${
    baseWordNum - 1
  } = [${formatCell(currWords[0][0])}, ${formatCell(
    currWords[0][1]
  )}, ${formatCell(currWords[0][2])}, ${formatCell(currWords[0][3])}]</li>
        <li>W${baseWordNum + 1} = W${
    baseWordNum - 3
  } ⊕ W${baseWordNum} = [${formatCell(currWords[1][0])}, ${formatCell(
    currWords[1][1]
  )}, ${formatCell(currWords[1][2])}, ${formatCell(currWords[1][3])}]</li>
        <li>W${baseWordNum + 2} = W${baseWordNum - 2} ⊕ W${
    baseWordNum + 1
  } = [${formatCell(currWords[2][0])}, ${formatCell(
    currWords[2][1]
  )}, ${formatCell(currWords[2][2])}, ${formatCell(currWords[2][3])}]</li>
        <li>W${baseWordNum + 3} = W${baseWordNum - 1} ⊕ W${
    baseWordNum + 2
  } = [${formatCell(currWords[3][0])}, ${formatCell(
    currWords[3][1]
  )}, ${formatCell(currWords[3][2])}, ${formatCell(currWords[3][3])}]</li>
      </ul>
    </div>
  `;

  // Clear any existing comparison container that might interfere
  const existingComparison = document.getElementById("operation-comparison");
  if (existingComparison) {
    existingComparison.style.display = "none";
  }

  // Create a matrix to display the key transformation steps
  const displayMatrix = document.getElementById("display-matrix");
  if (displayMatrix) {
    const cells = displayMatrix.querySelectorAll(".matrix-cell");

    // Clear all cells first
    cells.forEach((cell) => {
      cell.textContent = "--";
      cell.style.backgroundColor = "";
    });

    // Create a compact display showing the key transformation
    // First row: original last word
    for (let i = 0; i < 4; i++) {
      cells[i].textContent = formatCell(prevWords[3][i]);
      cells[i].style.backgroundColor = "#e6f7ff"; // Light blue
    }

    // Second row: after rotation
    for (let i = 0; i < 4; i++) {
      cells[i + 4].textContent = formatCell(leftShift[i]);
      cells[i + 4].style.backgroundColor = "#e6f2ff"; // Slightly lighter blue
    }

    // Third row: after SubBytes
    for (let i = 0; i < 4; i++) {
      cells[i + 8].textContent = formatCell(subBytesKey[i]);
      cells[i + 8].style.backgroundColor = "#d9ecff"; // Even lighter blue
    }

    // Fourth row: after XOR with Rcon
    for (let i = 0; i < 4; i++) {
      cells[i + 12].textContent = formatCell(xorRcon[i]);
      cells[i + 12].style.backgroundColor = "#ccebff"; // Lightest blue
    }
  }
}

// Function to display a comparison between before/after states of an operation
function displayOperationComparison(round, operation) {
  const roundIndex = round - 1;
  let beforeData = [];
  let afterData = [];
  let keyData = []; // Store key data for debugging and display

  switch (operation) {
    case "addRoundKey":
      // Get the input data (before)
      if (aesState.isEncryption) {
        if (round === 1) {
          beforeData = [...aesState.input.plaintext];
          keyData = [...aesState.input.key]; // Original key for round 1
        } else if (round === 10) {
          beforeData = [...aesState.rounds[roundIndex].shiftRows];
          keyData = [...aesState.rounds[roundIndex].key];
        } else {
          beforeData = [...aesState.rounds[roundIndex].mixColumns];
          keyData = [...aesState.rounds[roundIndex].key];
        }
      } else {
        // For decryption
        if (round === 10) {
          beforeData = [...aesState.input.plaintext]; // Ciphertext
          keyData = [...aesState.rounds[9].key]; // Round 10 key
        } else {
          beforeData = [...aesState.rounds[roundIndex].subBytes];
          keyData = [...aesState.rounds[roundIndex].key];
        }
      }

      // Calculate XOR result manually to ensure correctness
      afterData = new Array(16);
      for (let i = 0; i < 16; i++) {
        afterData[i] = beforeData[i] ^ keyData[i];
      }
      break;

    case "subBytes":
      beforeData = aesState.isEncryption
        ? [...aesState.rounds[roundIndex].input]
        : [...aesState.rounds[roundIndex].shiftRows];
      afterData = [...aesState.rounds[roundIndex].subBytes];
      break;

    case "shiftRows":
      beforeData = aesState.isEncryption
        ? [...aesState.rounds[roundIndex].subBytes]
        : [...aesState.rounds[roundIndex].addRoundKey];
      afterData = [...aesState.rounds[roundIndex].shiftRows];
      break;

    case "mixColumns":
      beforeData = [...aesState.rounds[roundIndex].shiftRows];
      afterData = [...aesState.rounds[roundIndex].mixColumns];
      break;

    default:
      beforeData = new Array(16).fill(0);
      afterData = new Array(16).fill(0);
  }

  // Create or update the comparison container
  let comparisonContainer = document.getElementById("operation-comparison");
  if (!comparisonContainer) {
    comparisonContainer = document.createElement("div");
    comparisonContainer.id = "operation-comparison";
    comparisonContainer.style.display = "flex";
    comparisonContainer.style.justifyContent = "space-between";
    comparisonContainer.style.marginTop = "15px";
    comparisonContainer.style.padding = "10px";
    comparisonContainer.style.backgroundColor = "#f8f9fa";
    comparisonContainer.style.borderRadius = "8px";

    let template = `
      <div style="flex: 1; margin-right: 10px;">
        <div id="before-title" style="font-weight: bold; margin-bottom: 5px; text-align: center;">Before</div>
        <div class="matrix" id="before-matrix" style="margin: 0 auto;">
          ${Array(16).fill('<div class="matrix-cell">--</div>').join("")}
        </div>
      </div>`;

    // For AddRoundKey, show the key in the middle
    if (operation === "addRoundKey") {
      template += `
        <div style="flex: 1; margin: 0 10px;">
          <div id="key-title" style="font-weight: bold; margin-bottom: 5px; text-align: center;">Key</div>
          <div class="matrix" id="key-matrix-display" style="margin: 0 auto;">
            ${Array(16).fill('<div class="matrix-cell">--</div>').join("")}
          </div>
        </div>`;
    }

    template += `
      <div style="flex: 1; margin-left: 10px;">
        <div id="after-title" style="font-weight: bold; margin-bottom: 5px; text-align: center;">After</div>
        <div class="matrix" id="after-matrix" style="margin: 0 auto;">
          ${Array(16).fill('<div class="matrix-cell">--</div>').join("")}
        </div>
      </div>
    `;

    comparisonContainer.innerHTML = template;

    // Add to the DOM after the main display matrix
    const displayMatrix = document.getElementById("display-matrix");
    if (displayMatrix && displayMatrix.parentNode) {
      displayMatrix.parentNode.appendChild(comparisonContainer);
    }
  } else {
    // Show the container if it's hidden
    comparisonContainer.style.display = "flex";

    // Update the container's structure if needed
    if (
      operation === "addRoundKey" &&
      !document.getElementById("key-matrix-display")
    ) {
      // Add the key matrix column if it doesn't exist
      const beforeDiv = document.querySelector(
        "#operation-comparison > div:first-child"
      );
      const keyDiv = document.createElement("div");
      keyDiv.style.flex = "1";
      keyDiv.style.margin = "0 10px";
      keyDiv.innerHTML = `
        <div id="key-title" style="font-weight: bold; margin-bottom: 5px; text-align: center;">Key</div>
        <div class="matrix" id="key-matrix-display" style="margin: 0 auto;">
          ${Array(16).fill('<div class="matrix-cell">--</div>').join("")}
        </div>
      `;
      beforeDiv.parentNode.insertBefore(keyDiv, beforeDiv.nextSibling);
    } else if (
      operation !== "addRoundKey" &&
      document.getElementById("key-matrix-display")
    ) {
      // Remove key matrix column if it exists and we're not showing addRoundKey
      const keyDiv = document.getElementById("key-matrix-display").parentNode;
      if (keyDiv) keyDiv.remove();
    }
  }

  // Update the before matrix
  updateMatrixDisplay("before-matrix", beforeData);

  // Update the after matrix
  updateMatrixDisplay("after-matrix", afterData);

  // Update key matrix if showing AddRoundKey
  if (
    operation === "addRoundKey" &&
    document.getElementById("key-matrix-display")
  ) {
    updateMatrixDisplay("key-matrix-display", keyData);
  }

  // Update the titles to be more specific
  document.getElementById(
    "before-title"
  ).textContent = `Before ${formatOperationName(operation)}`;
  document.getElementById(
    "after-title"
  ).textContent = `After ${formatOperationName(operation)}`;
  if (operation === "addRoundKey" && document.getElementById("key-title")) {
    document.getElementById("key-title").textContent = "Key";
  }
}

// Function to display detailed explanations for operations
function displayOperationExplanation(round, operation) {
  const roundIndex = round - 1;
  let explanation = "";

  switch (operation) {
    case "addRoundKey":
      explanation = `
        <h3>AddRoundKey Explanation</h3>
        <p>This operation combines each byte of the state with the corresponding byte of the round key using XOR (⊕).</p>
        <p>For example, if the first byte of the state is <code>${formatCell(
          aesState.rounds[roundIndex].input[0]
        )}</code> 
        and the first byte of the round key is <code>${formatCell(
          aesState.rounds[roundIndex].key[0]
        )}</code>, 
        then the result is <code>${formatCell(
          aesState.rounds[roundIndex].input[0] ^
            aesState.rounds[roundIndex].key[0]
        )}</code>.</p>
        <p>This operation provides security by combining the key with the data.</p>
      `;
      break;
    case "subBytes":
      explanation = `
        <h3>SubBytes Explanation</h3>
        <p>This operation substitutes each byte in the state with its corresponding value in the S-box.</p>
        <p>For example, the byte <code>${formatCell(
          aesState.rounds[roundIndex].input[0]
        )}</code> is replaced with 
        <code>${formatCell(
          sBox[aesState.rounds[roundIndex].input[0]]
        )}</code> from the S-box.</p>
        <p>This provides non-linearity to the cipher, making it resistant to differential and linear cryptanalysis.</p>
      `;
      break;
    case "shiftRows":
      explanation = `
        <h3>ShiftRows Explanation</h3>
        <p>This operation shifts the rows of the state to provide diffusion:</p>
        <ul>
          <li>Row 0: No shift</li>
          <li>Row 1: Shift left by 1 byte</li>
          <li>Row 2: Shift left by 2 bytes</li>
          <li>Row 3: Shift left by 3 bytes</li>
        </ul>
        <p>This ensures that the bytes from each column are spread out to different columns.</p>
      `;
      break;
    case "mixColumns":
      explanation = `
        <h3>MixColumns Explanation</h3>
        <p>This operation transforms each column using a linear transformation in GF(2^8).</p>
        <p>Each column is multiplied by a fixed matrix:</p>
        <pre>
        [ 02 03 01 01 ]
        [ 01 02 03 01 ]
        [ 01 01 02 03 ]
        [ 03 01 01 02 ]
        </pre>
        <p>This provides diffusion across columns and helps ensure that each bit affects many bits in subsequent rounds.</p>
      `;
      break;
    case "keyLS1":
    case "keySubBytes":
    case "keyXorRcon":
      // These cases are handled by visualizeKeySchedule
      return;
  }

  // Add the explanation to a display element if it's present
  if (explanation) {
    let explainElement = document.getElementById(
      "operation-explanation-detail"
    );
    if (!explainElement) {
      explainElement = document.createElement("div");
      explainElement.id = "operation-explanation-detail";
      explainElement.style.marginTop = "15px";
      explainElement.style.padding = "10px";
      explainElement.style.backgroundColor = "#f0f8ff";
      explainElement.style.borderRadius = "8px";
      explainElement.style.border = "1px solid #d0e5ff";

      // Find the operation comparison container to insert after
      const comparisonContainer = document.getElementById(
        "operation-comparison"
      );
      if (comparisonContainer && comparisonContainer.parentNode) {
        comparisonContainer.parentNode.insertBefore(
          explainElement,
          comparisonContainer.nextSibling
        );
      } else {
        // Fallback to adding after display matrix
        const displayMatrix = document.getElementById("display-matrix");
        if (displayMatrix && displayMatrix.parentNode) {
          displayMatrix.parentNode.appendChild(explainElement);
        }
      }
    }

    explainElement.innerHTML = explanation;
    explainElement.style.display = "block";
  }
}

export {
  formatOperationName,
  displayOperation,
  visualizeKeySchedule,
  displayOperationComparison,
  displayOperationExplanation,
};
