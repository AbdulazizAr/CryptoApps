// Strict byte input for the single-block AES interface.
export function parseBlockHex(text) {
  const clean = text.trim().replace(/^0x/i, '').replace(/\s/g, '');
  if (!/^[0-9a-fA-F]{32}$/.test(clean)) {
    throw new Error('Enter exactly 32 hexadecimal digits (16 bytes) for both the block and key.');
  }
  return clean.match(/../g).map(byte => Number.parseInt(byte, 16));
}
