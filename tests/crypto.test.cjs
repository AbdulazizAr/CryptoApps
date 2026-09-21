// These tests execute the actual application scripts with a minimal DOM adapter.
// They verify calculations and selected handlers, not browser layout or clipboard APIs.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {load} = require('./dom-harness.cjs');
const root = path.resolve(__dirname, '..');
const page = name => load(path.join(root, name, 'index.html'));
const hex = bytes => Buffer.from(bytes).toString('hex');
const bits = h => BigInt('0x' + h).toString(2).padStart(h.length * 4, '0');
const unbits = b => BigInt('0b' + b).toString(16).padStart(b.length / 4, '0');
const set = (h,id,value) => { h.elements.get(id).value = String(value); };
const val = (h,id) => h.elements.get(id).value;
const output = (h,id) => h.elements.get(id).textContent;

for (const name of ["aes-key", "aes-operations", "des", "des-operations", "s-des", "caesar", "substitution", "vigenere", "one-time-pad", "hill", "md5", "sha1"]) {
  test(`inline script loads: ${name}`, () => page(name));
}

test('AES-128 encrypt/decrypt: known vector and 16 deterministic reference cases', async () => {
  const {encryptAES,decryptAES} = await import(pathToFileURL(path.join(root,'aes/js/core/aes-operations.js')));
  const oldLog = console.log; console.log = () => {};
  try {
    for (let i=0;i<=16;i++) {
      const key = i ? crypto.createHash('sha256').update('key'+i).digest().subarray(0,16) : Buffer.from('000102030405060708090a0b0c0d0e0f','hex');
      const plain = i ? crypto.createHash('sha256').update('plain'+i).digest().subarray(0,16) : Buffer.from('00112233445566778899aabbccddeeff','hex');
      const reference = crypto.createCipheriv('aes-128-ecb',key,null).setAutoPadding(false).update(plain);
      const encrypted = encryptAES([...plain],[...key]);
      assert.equal(hex(encrypted),reference.toString('hex'));
      if (!i) assert.equal(hex(encrypted),'69c4e0d86a7b0430d8cdb78070b4c55a');
      assert.equal(hex(decryptAES(encrypted,[...key])),plain.toString('hex'));
    }
  } finally { console.log = oldLog; }
});

test('AES key expansion: round 1 and round 10 keys', () => {
  const h=page('aes-key');
  assert.equal(hex(h.run('keyExpansion(Array.from({length:16},(_,i)=>i)).slice(4,8).flat()')),'d6aa74fdd2af72fadaa678f1d6ab76fe');
  assert.equal(hex(h.run('keyExpansion(Array.from({length:16},(_,i)=>i)).slice(-4).flat()')),'13111d7fe3944a17f307a78b4d2b30c5');
});

test('AES operations: all 256 S-box entries and inverse operations', async () => {
  const h=page('aes-operations');h.run("generateSBox('0x63')");
  const constants=await import(pathToFileURL(path.join(root,'aes/js/core/constants.js')));
  assert.deepEqual(Array.from(h.run('SBOX')),Array.from(constants.sBox));
  assert.deepEqual(Array.from(h.run('INV_SBOX')),Array.from(constants.invSBox));
  assert.deepEqual(Array.from(h.run('mixColumnsMatrix([[0xdb,0,0,0],[0x13,0,0,0],[0x53,0,0,0],[0x45,0,0,0]]).map(r=>r[0])')),[0x8e,0x4d,0xa1,0xbc]);
  for (let n=0;n<16;n++) {
    const matrix=Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>(n*17+r*4+c)%256));
    for (const [forward,inverse] of [['subBytesMatrix','invSubBytesMatrix'],['shiftRowsMatrix','invShiftRowsMatrix'],['mixColumnsMatrix','invMixColumnsMatrix']]) {
      assert.equal(h.run(`JSON.stringify(${inverse}(${forward}(${JSON.stringify(matrix)})))`),JSON.stringify(matrix));
    }
  }
});

for (const name of ['des','des-operations']) {
  test(`${name}: known vector and 16 reference encrypt/decrypt cases`, () => {
    const h=page(name);
    for(let i=0;i<=16;i++) {
      const key=i?crypto.createHash('sha256').update('des-key'+i).digest().subarray(0,8):Buffer.from('133457799BBCDFF1','hex');
      const plain=i?crypto.createHash('sha256').update('des-plain'+i).digest().subarray(0,8):Buffer.from('0123456789ABCDEF','hex');
      // EDE3 with three identical keys is equivalent to single DES.
      const reference=crypto.createCipheriv('des-ede3',Buffer.concat([key,key,key]),null).setAutoPadding(false).update(plain).toString('hex');
      const k=bits(key.toString('hex')),p=bits(plain.toString('hex'));
      let got,back;
      if(name==='des') {
        got=h.run(`encrypt('${p}','${k}')`);back=h.run(`decrypt('${got}','${k}')`);
      } else {
        h.run(`testKeys=generateSubkeys(bitsStringToArray('${k}')).subkeys`);
        got=h.run(`bitsArrayToString(desEncrypt(bitsStringToArray('${p}'),testKeys).ciphertext)`);
        back=h.run(`bitsArrayToString(desDecrypt(bitsStringToArray('${got}'),testKeys).ciphertext)`);
      }
      assert.equal(unbits(got),reference);assert.equal(back,p);
      if(!i)assert.equal(unbits(got),'85e813540f0ab405');
    }
  });
}

test('DES input/output preserves all 64 bits',()=>{
  const h=page('des');
  for(const value of ['133457799BBCDFF1','FFFFFFFFFFFFFFFF','0123456789ABCDEF']) {
    assert.equal(h.run(`convertToBinary('0x${value}',64)`),bits(value));
    assert.equal(h.run(`convertToBinary('${BigInt('0x'+value)}',64)`),bits(value));
    assert.equal(h.run(`formatOutput('${bits(value)}','hex')`),value);
  }
  assert.equal(h.run("convertToBinary('0b101',64)"),'101'.padStart(64,'0'));
});

test('S-DES: known vector, subkeys, and all 256 plaintext round trips',()=>{
  const h=page('s-des');set(h,'input-key','1010000010');set(h,'input-text','11010111');h.run('processSDES()');
  assert.equal(val(h,'key-k1'),'10100100');assert.equal(val(h,'key-k2'),'01000011');assert.equal(val(h,'final-output'),'10101000');
  for(let i=0;i<256;i++) {
    const plain=i.toString(2).padStart(8,'0');set(h,'input-text',plain);h.run("currentOperation='encrypt';processSDES()");
    set(h,'input-text',val(h,'final-output'));h.run("currentOperation='decrypt';processSDES()");assert.equal(val(h,'final-output'),plain);
  }
});

for (const algorithm of ['md5','sha1']) {
  for (const message of ['', 'abc','a'.repeat(55),'a'.repeat(56),'a'.repeat(63),'a'.repeat(64),'a'.repeat(65),'a'.repeat(120),'مرحبا🔐']) {
    test(`${algorithm}: UTF-8 reference, ${Buffer.byteLength(message)} bytes`,()=>{
      const h=page(algorithm);
      const expression=algorithm==='md5'?`calculateMD5(${JSON.stringify(message)}).hexHash`:`calculateSHA1(${JSON.stringify(message)}).hash.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('')`;
      assert.equal(h.run(expression),crypto.createHash(algorithm).update(message).digest('hex'));
    });
  }
}

test('MD5 repeated calls clear prior multi-block history',()=>{
  const h=page('md5');h.run(`calculateMD5('${'a'.repeat(120)}')`);h.run("calculateMD5('abc')");assert.equal(h.run('multiBlockHashes.length'),0);
});

test('Caesar encrypt, decrypt, shift recovery, negative/large shifts, validation',()=>{
  const h=page('caesar');set(h,'caesarAlphabet','ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  for(const shift of [3,29,-23,-49]) {
    set(h,'plainText','HELLO');set(h,'shiftAmount',shift);h.run('encryptCaesar()');assert.equal(val(h,'cipherText'),'KHOOR');
    h.run('decryptCaesar()');assert.equal(val(h,'plainText'),'HELLO');
  }
  h.run('detectShift()');assert.equal(Number(val(h,'shiftAmount')),3);
  set(h,'caesarAlphabet','AABC');h.run('encryptCaesar()');assert.match(output(h,'caesarOutput'),/unique alphabet/);
  set(h,'caesarAlphabet','ABC');set(h,'plainText','<');set(h,'cipherText','>');h.run('detectShift()');assert.equal(output(h,'caesarOutput'),'❌ Characters not in the custom alphabet: <, >');
});

test('Substitution encrypt/decrypt and duplicate-key rejection',()=>{
  const h=page('substitution');set(h,'customAlphabet','ABCDEFGHIJKLMNOPQRSTUVWXYZ');set(h,'substitutionKey','QWERTYUIOPASDFGHJKLZXCVBNM');set(h,'inputText','HELLO');h.run('encrypt()');assert.equal(output(h,'output'),'ITSSG');
  set(h,'inputText','ITSSG');h.run('decrypt()');assert.equal(output(h,'output'),'HELLO');
  set(h,'substitutionKey','A'.repeat(26));h.run('decrypt()');assert.match(output(h,'output'),/exactly once/);
});

test('Hill ACT -> POH, inverse, negative entries and invalid input',()=>{
  const h=page('hill');set(h,'hillAlphabet','ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  h.run('matrixFields.forEach((f,i)=>f.value=String([6,24,1,13,16,10,20,17,15][i]))');
  set(h,'hillPlaintext','ACT');h.run('encryptHill()');assert.equal(output(h,'hillOutput'),'Encrypted: POH');
  set(h,'hillPlaintext','POH');h.run('decryptHill()');assert.equal(output(h,'hillOutput'),'Decrypted: ACT');
  h.run("matrixFields[0].value='-20'");set(h,'hillPlaintext','ACT');h.run('encryptHill()');assert.equal(output(h,'hillOutput'),'Encrypted: POH');
  set(h,'hillPlaintext','AC?');h.run('encryptHill()');assert.match(output(h,'hillOutput'),/outside the alphabet/);
  h.run("matrixFields.forEach(f=>f.value='0')");h.run('decryptHill()');assert.match(output(h,'hillOutput'),/not invertible/);
  h.run("matrixFields[0].value='x'");h.run('encryptHill()');assert.match(output(h,'hillOutput'),/integer matrix values/);
});

for(const [name,prefix,fn,key] of [['vigenere','vigenere','syncFields','LEMON'],['one-time-pad','otp','syncOTP','LEMONLEMONLE']]) {
  test(`${name}: known vector, decryption, and invalid key handling`,()=>{
    const h=page(name);set(h,prefix+'Alphabet','ABCDEFGHIJKLMNOPQRSTUVWXYZ');set(h,prefix+'Plaintext','ATTACKATDAWN');set(h,prefix+'Key',key);
    h.run(`${fn}({target:plainField})`);assert.equal(val(h,prefix+'Ciphertext'),'LXFOPVEFRNHR');
    set(h,prefix+'Plaintext','');h.run(`${fn}({target:cipherField})`);assert.equal(val(h,prefix+'Plaintext'),'ATTACKATDAWN');
    set(h,prefix+'Key','?');h.run(`${fn}({target:plainField})`);assert.equal(val(h,prefix+'Ciphertext'),'');assert.match(output(h,'cipherStatus'),/Every message/);
    if(name==='one-time-pad') {set(h,prefix+'Key','LEMON');h.run(`${fn}({target:plainField})`);assert.match(output(h,'cipherStatus'),/same length/);}
  });
}

test('Vigenere keystream recovery',()=>{
  const h=page('vigenere');set(h,'vigenereAlphabet','ABCDEFGHIJKLMNOPQRSTUVWXYZ');set(h,'vigenerePlaintext','ATTACKATDAWN');set(h,'vigenereCiphertext','LXFOPVEFRNHR');h.events.find(e=>e.id==='recoverKey').fn();assert.equal(val(h,'vigenereKey'),'LEMONLEMONLE');
});

test('AES trace follows every round and the final result in both directions', async()=>{
  const base=path.join(root,'aes/js/core');
  const {encryptAES,decryptAES}=await import(pathToFileURL(path.join(base,'aes-operations.js')));
  const {buildTrace}=await import(pathToFileURL(path.join(base,'trace.js')));
  const {parseBlockHex}=await import(pathToFileURL(path.join(base,'block-input.js')));
  const plain=parseBlockHex('00112233445566778899aabbccddeeff'),key=parseBlockHex('000102030405060708090a0b0c0d0e0f');
  const oldLog=console.log;console.log=()=>{};
  try {
    const encrypted=encryptAES(plain,key),rows=buildTrace(true);
    assert.equal(new Set(rows.map(r=>r.round)).size,11);
    assert.equal(hex(rows.find(r=>r.round===1&&r.operation==='SubBytes').bytes),'63cab7040953d051cd60e0e7ba70e18c');
    assert.equal(hex(rows.at(-1).bytes),hex(encrypted));
    for(let round=1;round<=10;round++)assert.equal(hex(rows.find(r=>r.round===round&&r.operation==='Input').bytes),hex(rows.filter(r=>r.round===round-1).at(-1).bytes));
    const decrypted=decryptAES(encrypted,key),inverse=buildTrace(false);
    assert.equal(new Set(inverse.map(r=>r.round)).size,11);
    assert.equal(hex(inverse.at(-1).bytes),hex(decrypted));
    assert.equal(hex(decrypted),hex(plain));
    for(let round=9;round>=0;round--)assert.equal(hex(inverse.find(r=>r.round===round&&r.operation==='Input').bytes),hex(inverse.filter(r=>r.round===round+1).at(-1).bytes));
  } finally {console.log=oldLog;}
});

test('AES block input accepts formatted hex and rejects malformed or partial blocks',async()=>{
  const {parseBlockHex}=await import(pathToFileURL(path.join(root,'aes/js/core/block-input.js')));
  assert.equal(hex(parseBlockHex('0X00 11 22 33 44 55 66 77 88 99 AA BB CC DD EE FF')),'00112233445566778899aabbccddeeff');
  for(const input of ['', '00','z'.repeat(32),'a'.repeat(33),'0x'+ '0'.repeat(31),'hello'])assert.throws(()=>parseBlockHex(input),/exactly 32/);
});

test('AES form handlers: encrypt, use result, decrypt, reject invalid input, reset',async()=>{
  const h=load(path.join(root,'aes/index.html'));
  h.elements.get('trace').replaceChildren=function(){this.children=[];};
  const previousDocument=global.document,oldLog=console.log;
  global.document=h.c.document;console.log=()=>{};
  try {
    await import(pathToFileURL(path.join(root,'aes/js/main.js')));
    const event=(id,type)=>h.events.find(e=>e.id===id&&e.type===type).fn;
    event('aes-form','submit')({preventDefault(){}});
    assert.equal(output(h,'result'),'69c4e0d86a7b0430d8cdb78070b4c55a');
    assert.ok(h.elements.get('trace').children.length>60);
    event('use-result','click')();event('decrypt','click')();assert.equal(output(h,'result'),'00112233445566778899aabbccddeeff');
    set(h,'block','invalid');event('decrypt','click')();assert.match(output(h,'error'),/exactly 32/);assert.equal(h.elements.get('trace').children.length,0);
    event('aes-form','reset')();assert.equal(output(h,'error'),'');
  } finally {global.document=previousDocument;console.log=oldLog;}
});
