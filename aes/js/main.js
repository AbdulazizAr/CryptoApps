import {encryptAES, decryptAES} from './core/aes-operations.js';
import {bytesToHexString} from './core/utils.js';
import {parseBlockHex} from './core/block-input.js';
import {buildTrace} from './core/trace.js';
const get = id => document.getElementById(id);
let lastResult = null;
function processBlock(encrypt) {
  get('error').textContent = '';
  get('trace').replaceChildren();
  lastResult = null;
  try {
    const block = parseBlockHex(get('block').value);
    const key = parseBlockHex(get('key').value);
    const result = encrypt ? encryptAES(block, key) : decryptAES(block, key);
    lastResult = bytesToHexString(result);
    get('result-title').textContent = encrypt ? 'Ciphertext' : 'Plaintext';
    get('result').textContent = lastResult;
    for (const row of buildTrace(encrypt)) {
      const tr = document.createElement('tr');
      for (const text of [row.round, row.operation, bytesToHexString(row.bytes)]) {
        const td = document.createElement('td');
        td.textContent = String(text);
        tr.appendChild(td);
      }
      get('trace').appendChild(tr);
    }
  } catch (error) {
    get('error').textContent = error.message;
    get('result').textContent = 'No result. Check the inputs.';
  }
}
get('aes-form').addEventListener('submit', event => {event.preventDefault();processBlock(true);});
get('decrypt').addEventListener('click', () => processBlock(false));
get('use-result').addEventListener('click', () => {
  if (lastResult) get('block').value = lastResult;
  else get('error').textContent = 'Run an operation first.';
});
get('aes-form').addEventListener('reset', () => {
  lastResult = null;
  get('error').textContent = '';
  get('trace').replaceChildren();
  get('result-title').textContent = 'Result';
  get('result').textContent = 'Run an operation to see its result.';
});
