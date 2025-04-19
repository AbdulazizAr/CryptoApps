import aesState from "./state/aes-state.js";
import { encryptAES, decryptAES } from "./core/aes-operations.js";
import {
  updateMatrixDisplay,
  updateAllRoundDisplays,
  updateCounters,
} from "./ui/matrix-display.js";
import { setupInputHandlers } from "./ui/event-handlers.js";
import { enhanceUIInteractions, addOperationTooltips } from "./ui/ui-utils.js";
import { setupRoundHeadersToggle } from "./ui/round-display.js"; // Import the correct function

// Main initialization function
function initializeAESApplication() {
  // Fix round headers toggle first - use the imported function
  setupRoundHeadersToggle();

  // Set up input handlers
  setupInputHandlers();

  // Initialize UI enhancements
  enhanceUIInteractions();
  addOperationTooltips();

  // Update all displays with initial state
  updateMatrixDisplay("state-matrix", aesState.input.plaintext);
  updateMatrixDisplay("key-matrix", aesState.input.key);
  updateAllRoundDisplays();
  updateCounters();

  console.log("AES-128 Encryption/Decryption Tool initialized");
}

// Single DOM content loaded event
document.addEventListener("DOMContentLoaded", function () {
  // Give the DOM time to fully render
  // initializeAESApplication;
  setTimeout(initializeAESApplication, 100);
});
