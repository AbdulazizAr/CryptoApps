# CryptoApps

A collection of 13 interactive cryptography tools from my coursework, built with HTML, CSS, and JavaScript. Each folder includes a short guide, example, and app screenshot.

## Run

Download or clone this repository, then run from its root:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open **http://localhost:8000/**. On Windows, `py` can replace `python`. VS Code Live Server works too. No build or package installation is needed to use the apps.

## Tools

| Tool | What it covers |
| --- | --- |
| [AES-128](aes/) | Encrypt/decrypt a 16-byte block and inspect every round. |
| [AES Key Expansion](aes-key/) | Visualize the ten derived AES-128 round keys. |
| [AES Operations](aes-operations/) | Explore SubBytes, ShiftRows, MixColumns, XOR, and inverses. |
| [DES](des/) | Encrypt/decrypt a single DES block with round details. |
| [DES Operations](des-operations/) | Explore DES permutations, subkeys, S-boxes, and rounds. |
| [Simplified DES](s-des/) | Study the two-round teaching cipher. |
| [Caesar Cipher](caesar/) | Encrypt, decrypt, and recover shifts using a custom alphabet. |
| [Substitution Cipher](substitution/) | Encrypt/decrypt with a custom alphabet permutation. |
| [Vigenère Cipher](vigenere/) | Use a repeating key or recover a known-text keystream. |
| [One-Time Pad](one-time-pad/) | Explore modular addition with an equal-length key. |
| [Hill Cipher](hill/) | Encrypt/decrypt with a 3×3 matrix and inspect its inverse. |
| [MD5](md5/) | Inspect message padding, compression steps, and MD5 digests. |
| [SHA-1](sha1/) | Explore the message schedule, compression steps, and SHA-1 digests. |

## Checks

`npm test` runs 47 calculation and handler tests with Node.js 22+. No dependencies are required for those tests. The screenshot workflow also opens each app in Chromium with example inputs.

The collection leaves out the broken `DESdestroyer.html` draft and the redundant `newDES.html` draft. AES has a complete read-only round trace; minor input/conversion bugs were fixed in the selected tools.

**For learning only.** These are not production security tools. Some pages save sample inputs in browser local storage. DES, classical ciphers, MD5, and SHA-1 are included for study.
