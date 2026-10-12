import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';

// Do not put the password in command arguments, environment variables or history.
if (!process.stdin.isTTY) throw new Error('Bu komutu etkileşimli terminalde çalıştırın.');
let muted = false;
const output = new Writable({ write(chunk, encoding, callback) { if (!muted) process.stdout.write(chunk, encoding); callback(); } });
const rl = createInterface({ input: process.stdin, output, terminal: true });
const email = (await rl.question('Yönetici e-posta adresi: ')).trim().toLowerCase();
process.stdout.write('Şifre (en az 12 karakter; yazarken görünmez): ');
muted = true;
const password = await rl.question('');
muted = false;
rl.close();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Geçerli bir e-posta adresi girin.');
if (password.length < 12 || password.length > 256) throw new Error('Şifre 12–256 karakter olmalı.');
const salt = randomBytes(16).toString('hex');
console.log('\nNetlify ortam değişkenleri (Functions kapsamı):');
console.log(`ADMIN_EMAIL=${email}`);
console.log(`ADMIN_PASSWORD_HASH=${salt}:${scryptSync(password, salt, 64).toString('hex')}`);
