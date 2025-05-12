import {Web3} from 'web3';
// import { fromPrivateKey } from 'ethereumjs-wallet/dist.browser';
const CryptoJS = window.CryptoJS;

export function encryptHex_Node(plainHex, password) {
  // 1) Преобразуем hex в WordArray
  const dataWA = CryptoJS.enc.Hex.parse(plainHex);
  // 2) Шифруем AES-CTR (через режим Stream)
  const key = CryptoJS.SHA256(password);
  const iv  = CryptoJS.lib.WordArray.create(new Uint8Array(16)); // нулевой IV
  const encrypted = CryptoJS.AES.encrypt(dataWA, key, {
    iv,
    mode: CryptoJS.mode.CTR,
    padding: CryptoJS.pad.NoPadding
  });
  // 3) Получаем результат в hex
  // encrypted.ciphertext — это WordArray с сырыми байтами шифротекста
  return encrypted.ciphertext.toString(CryptoJS.enc.Hex); // 64 hex-символа
}


export function deriveEthAddressFromKey(privateKey) {
    const web3 = new Web3();
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    return account.address;
}

export function shrinkHexWithSHA256(hex) {
    const wordArr = CryptoJS.enc.Hex.parse(hex);
    const full = CryptoJS.SHA256(wordArr).toString(CryptoJS.enc.Hex);
    return full.slice(0, 64);
}
// export function float32ToString(f32) {
//     let str = '';
//     for (let i = 0; i < f32.length; i++) {
//         if (f32[i] > 0) {
//             str += '1';
//         } else {
//             str += '0';
//         }
//     }
//     return parseInt(str, 2).toString(16).toUpperCase();
// }