// Utility functions for data conversion and formatting
function textToHex(text) {
  let result = [];
  for (let i = 0; i < text.length; i++) {
    result.push(text.charCodeAt(i));
  }
  return result;
}

function hexToText(bytes) {
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i]);
  }
  return result;
}

function hexStringToBytes(hexString) {
  // Remove 0x prefix if present
  hexString = hexString.startsWith("0x") ? hexString.slice(2) : hexString;

  // Ensure even length
  if (hexString.length % 2 !== 0) {
    hexString = "0" + hexString;
  }

  let result = [];
  for (let i = 0; i < hexString.length; i += 2) {
    result.push(parseInt(hexString.substr(i, 2), 16));
  }
  return result;
}

function binaryStringToBytes(binString) {
  // Remove 0b prefix if present
  binString = binString.startsWith("0b") ? binString.slice(2) : binString;

  // Pad to multiple of 8
  while (binString.length % 8 !== 0) {
    binString = "0" + binString;
  }

  let result = [];
  for (let i = 0; i < binString.length; i += 8) {
    result.push(parseInt(binString.substr(i, 8), 2));
  }
  return result;
}

function parseInput(input) {
  input = input.trim();

  if (input.startsWith("0x")) {
    return hexStringToBytes(input);
  } else if (input.startsWith("0b")) {
    return binaryStringToBytes(input);
  } else {
    // Check if it's a space-separated hex string (e.g., "32 43 f6 a8")
    const hexPattern = /^[0-9a-fA-F\s]+$/;
    if (hexPattern.test(input)) {
      // Split by whitespace and convert each part to a byte
      return input.split(/\s+/).map((hex) => parseInt(hex, 16));
    } else {
      // Treat as text
      return textToHex(input);
    }
  }
}

function bytesToHexString(bytes) {
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function formatCell(value) {
  return value.toString(16).padStart(2, "0");
}

export {
  textToHex,
  hexToText,
  hexStringToBytes,
  binaryStringToBytes,
  parseInput,
  bytesToHexString,
  formatCell,
};
