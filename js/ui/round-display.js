import { formatCell } from "../core/utils.js";
import { updateMatrixDisplay } from "./matrix-display.js";

// Function to set up round headers toggle
function setupRoundHeadersToggle() {
  const roundHeaders = document.querySelectorAll(".round-header");

  roundHeaders.forEach((header) => {
    // Remove existing listeners by cloning
    const newHeader = header.cloneNode(true);
    header.parentNode.replaceChild(newHeader, header);

    // Add a simple click handler
    newHeader.addEventListener("click", function () {
      this.classList.toggle("active");
      const content = this.nextElementSibling;

      if (content) {
        content.style.display = this.classList.contains("active")
          ? "block"
          : "none";

        // Update arrow
        const arrow = this.querySelector("div:last-child");
        if (arrow) {
          arrow.textContent = this.classList.contains("active") ? "▼" : "▲";
        }
      }
    });
  });
}

// Add recalculate buttons for each round
function addRecalculateButtons(recomputeCallback) {
  // Look for all round elements
  const rounds = document.querySelectorAll(".round");

  for (let i = 0; i < rounds.length; i++) {
    const round = i + 1; // Round numbers are 1-based
    const roundContent = rounds[i].querySelector(".round-content");

    if (!roundContent) {
      console.warn(`Round content not found for round ${round}`);
      continue;
    }

    // Create a container for the button
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "recalculate-container";
    buttonContainer.style.textAlign = "center";
    buttonContainer.style.marginTop = "15px";

    // Create the button
    const recalculateButton = document.createElement("button");
    recalculateButton.textContent = `Recalculate from Round ${round}`;
    recalculateButton.className = "btn";
    recalculateButton.style.backgroundColor = "var(--accent-color)";
    recalculateButton.setAttribute("data-round", round);

    // Add event listener
    recalculateButton.addEventListener("click", function () {
      const roundNum = parseInt(this.getAttribute("data-round"));
      recomputeCallback(roundNum);

      // Visual feedback
      this.textContent = `✓ Recalculated from Round ${roundNum}`;
      setTimeout(() => {
        this.textContent = `Recalculate from Round ${roundNum}`;
      }, 2000);
    });

    // Add to the DOM
    buttonContainer.appendChild(recalculateButton);
    roundContent.appendChild(buttonContainer);
  }
}

// Add visual indicators for round completion status
function addRoundStatusIndicators() {
  const rounds = document.querySelectorAll(".round");

  rounds.forEach((round, index) => {
    const roundHeader = round.querySelector(".round-header");
    if (!roundHeader) return;

    // Create status indicator
    const statusIndicator = document.createElement("div");
    statusIndicator.className = "round-status";
    statusIndicator.style.display = "inline-block";
    statusIndicator.style.width = "10px";
    statusIndicator.style.height = "10px";
    statusIndicator.style.borderRadius = "50%";
    statusIndicator.style.backgroundColor = "#ccc";
    statusIndicator.style.marginLeft = "10px";

    // Insert at the beginning of the first div in the header
    const headerFirstDiv = roundHeader.querySelector("div:first-child");
    if (headerFirstDiv) {
      headerFirstDiv.appendChild(statusIndicator);
    }
  });

  // Add styles for status indicators
  const style = document.createElement("style");
  style.textContent = `
    .round-status.completed {
      background-color: var(--success) !important;
    }
    
    .round-status.modified {
      background-color: var(--warning) !important;
    }
  `;
  document.head.appendChild(style);

  // Return the update function that can be used externally
  return function updateRoundStatus(round, status) {
    const roundElement = document.querySelector(`.round:nth-child(${round})`);
    if (!roundElement) return;

    const statusIndicator = roundElement.querySelector(".round-status");
    if (!statusIndicator) return;

    statusIndicator.className = "round-status";
    if (status === "completed") {
      statusIndicator.classList.add("completed");
    } else if (status === "modified") {
      statusIndicator.classList.add("modified");
    }
  };
}

// Helper function to create a process step for visualization
function createProcessStep(title, data, highlight = false) {
  const step = document.createElement("div");
  step.style.display = "flex";
  step.style.alignItems = "center";
  step.style.backgroundColor = highlight ? "#e6f7ff" : "#fff";
  step.style.padding = "15px";
  step.style.borderRadius = "8px";
  step.style.boxShadow = highlight
    ? "0 0 8px rgba(24, 144, 255, 0.5)"
    : "0 2px 5px rgba(0,0,0,0.05)";
  step.style.border = highlight ? "1px solid #91d5ff" : "1px solid #eee";

  const titleElement = document.createElement("div");
  titleElement.textContent = title;
  titleElement.style.flex = "1";
  titleElement.style.fontWeight = "bold";

  const matrixContainer = document.createElement("div");
  matrixContainer.className = "matrix";
  matrixContainer.style.display = "grid";
  matrixContainer.style.gridTemplateColumns = "repeat(4, 1fr)";
  matrixContainer.style.gap = "2px";
  matrixContainer.style.padding = "8px";
  matrixContainer.style.backgroundColor = "#f0f0f0";
  matrixContainer.style.borderRadius = "5px";

  // Create cells
  for (let i = 0; i < 16; i++) {
    const cell = document.createElement("div");
    cell.className = "matrix-cell";
    cell.textContent = formatCell(data[i] || 0);
    cell.style.width = "30px";
    cell.style.height = "30px";
    cell.style.display = "flex";
    cell.style.alignItems = "center";
    cell.style.justifyContent = "center";
    cell.style.backgroundColor = "white";
    cell.style.border = "1px solid #ddd";
    cell.style.fontFamily = "monospace";
    matrixContainer.appendChild(cell);
  }

  step.appendChild(titleElement);
  step.appendChild(matrixContainer);

  return step;
}

export {
  setupRoundHeadersToggle,
  addRecalculateButtons,
  addRoundStatusIndicators,
  createProcessStep,
};
