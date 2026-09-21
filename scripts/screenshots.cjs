// Capture real Chromium views with example inputs for the tool READMEs.
const {chromium} = require('playwright');
const {readFileSync} = require('node:fs');
const assert = require('node:assert/strict');
const apps = JSON.parse(readFileSync('scripts/apps.json','utf8'));
(async () => {
  const browser = await chromium.launch();
  const failures = [];
  try {
    for (const app of apps) {
      const context = await browser.newContext({viewport:{width:1280,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('dialog', dialog => dialog.dismiss());
      try {
        await page.goto(`http://127.0.0.1:8000/${app}/`, {waitUntil:'networkidle'});
        switch (app) {
          case 'aes':
            await page.getByRole('button',{name:'Encrypt',exact:true}).click();
            assert.equal(await page.locator('#result').textContent(),'69c4e0d86a7b0430d8cdb78070b4c55a');
            break;
          case 'aes-key':
            await page.locator('#keyInput').fill('0x000102030405060708090a0b0c0d0e0f');
            await page.locator('#expandKeyBtn').click();
            break;
          case 'aes-operations':
            await page.locator('#xorInput1').fill('0x00112233445566778899aabbccddeeff');
            await page.locator('#xorInput2').fill('0x000102030405060708090a0b0c0d0e0f');
            await page.locator('#xorBtn').click();
            break;
          case 'des':
            await page.locator('#input-text').fill('0x0123456789ABCDEF');
            await page.locator('#input-key').fill('0x133457799BBCDFF1');
            await page.locator('#output-format').selectOption('hex');
            await page.locator('#encrypt-btn').click();
            assert.equal(await page.locator('#result').inputValue(),'85E813540F0AB405');
            break;
          case 'des-operations':
            await page.locator('#plaintextInput').fill('0x0123456789ABCDEF');
            await page.locator('#keyInput').fill('0x133457799BBCDFF1');
            await page.locator('#processBtn').click();
            assert.equal(await page.locator('#resultHex').textContent(),'0x85E813540F0AB405');
            break;
          case 's-des':
            await page.locator('#input-text').fill('11010111');
            await page.locator('#input-key').fill('1010000010');
            await page.locator('#encrypt-btn').click();
            assert.equal(await page.locator('#final-output').inputValue(),'10101000');
            break;
          case 'caesar':
            await page.locator('#caesarAlphabet').fill('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
            await page.locator('#plainText').fill('HELLO');
            await page.locator('#shiftAmount').fill('3');
            await page.getByRole('button',{name:/Encrypt/}).click();
            assert.equal(await page.locator('#cipherText').inputValue(),'KHOOR');
            break;
          case 'substitution':
            await page.locator('#customAlphabet').fill('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
            await page.locator('#substitutionKey').fill('QWERTYUIOPASDFGHJKLZXCVBNM');
            await page.locator('#inputText').fill('HELLO');
            await page.getByRole('button',{name:/Encrypt/}).click();
            assert.equal(await page.locator('#output').textContent(),'ITSSG');
            break;
          case 'vigenere':
          case 'one-time-pad': {
            const prefix=app==='vigenere'?'vigenere':'otp';
            await page.locator(`#${prefix}Plaintext`).fill('ATTACKATDAWN');
            await page.locator(`#${prefix}Key`).fill(app==='vigenere'?'LEMON':'LEMONLEMONLE');
            assert.equal(await page.locator(`#${prefix}Ciphertext`).inputValue(),'LXFOPVEFRNHR');
            break;
          }
          case 'hill': {
            const cells=page.locator('#matrixInputs input');
            for(const [i,value] of [6,24,1,13,16,10,20,17,15].entries())await cells.nth(i).fill(String(value));
            await page.locator('#hillPlaintext').fill('ACT');
            await page.getByRole('button',{name:/Encrypt/}).click();
            assert.equal(await page.locator('#hillOutput').textContent(),'Encrypted: POH');
            break;
          }
          case 'md5':
          case 'sha1':
            await page.locator('#messageInput').fill('abc');
            await page.evaluate(name => name==='md5'?calculateHash():handleCalculate(),app);
            break;
        }
        await page.evaluate(() => window.scrollTo(0,0));
        if(errors.length)throw new Error(errors.join('; '));
        await page.screenshot({path:`${app}/screenshot.png`,animations:'disabled'});
        console.log(`PASS ${app}: browser example and screenshot`);
      } catch(error) {
        failures.push(app);
        console.error(`FAIL ${app}: ${error.stack}`);
      } finally {await context.close();}
    }
  } finally {await browser.close();}
  if(failures.length)throw new Error(`Browser checks failed: ${failures.join(', ')}`);
})().catch(error=>{console.error(error);process.exitCode=1;});
