// Предполагается подключение:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
const CryptoJS = window.CryptoJS;

/**
 * Fuzzy Extractor (перевод Python-реализации на JavaScript + CryptoJS)
 */
export default class FuzzyExtractor {
  /**
   * @param {number} length   - длина исходного значения в байтах
   * @param {number} hamErr   - максимальное число флипнутых бит
   * @param {number} repErr   - вероятность неудачи восстановления
   * @param {{ hashFunc?: string, secLen?: number, nonceLen?: number }} lockerArgs
   */
  constructor(length, hamErr, repErr = 0.001, lockerArgs = {}) {
    this.parseLockerArgs(lockerArgs);
    this.length    = length;
    this.cipherLen = this.length + this.secLen;

    const bits     = this.length * 8;
    const exponent = hamErr / Math.log(bits);
    const rawCount = Math.pow(bits, exponent) * Math.log2(2 / repErr);
    this.numHelpers = Math.round(rawCount);
    // console.log('numhelpers = ' + this.numHelpers)
  }

  /** Настраивает параметры PBKDF2 и длины */
  parseLockerArgs({ hashFunc = 'sha256', secLen = 2, nonceLen = 16 } = {}) {
    this.hashFunc   = hashFunc;
    this.secLen     = secLen;
    this.nonceLen   = nonceLen;
  }

  generate(value) {
    const vHex = this._toHex(this.embeddingToBinary(value));
    if (vHex.length !== this.length * 2) {
      throw new Error(`Неправильная длина: ожидалось ${this.length} байт`);
    }

    // keyPad = key || 0^secLen
    const keyWA    = CryptoJS.lib.WordArray.random(this.length);
    const keyHex   = keyWA.toString(CryptoJS.enc.Hex);
    const padHex   = '0'.repeat(this.secLen * 2);
    const keyPadHex = keyHex + padHex;

    // генерируем nonce и mask для каждого помощника
    const nonces = Array.from({ length: this.numHelpers }, () =>
      CryptoJS.lib.WordArray.random(this.nonceLen).toString(CryptoJS.enc.Hex)
    );
    const masks  = Array.from({ length: this.numHelpers }, () =>
      CryptoJS.lib.WordArray.random(this.length).toString(CryptoJS.enc.Hex)
    );

    // вычисляем дигесты
    const digests = masks.map((maskHex, i) => {
      const vecHex = andHex(maskHex, vHex);
      // PBKDF2 с 1 итерацией → длина cipherLen байт
      const keySizeWords = this.cipherLen / 4; // CryptoJS keySize в 32-битных словах
      return CryptoJS.PBKDF2(
        CryptoJS.enc.Hex.parse(vecHex),
        CryptoJS.enc.Hex.parse(nonces[i]),
        { keySize: keySizeWords, iterations: 1, hasher: CryptoJS.algo[this.hashFunc.toUpperCase()] }
      ).toString(CryptoJS.enc.Hex);
    });

    // вычисляем ciphers = digest XOR keyPad
    const ciphers = digests.map(dHex => xorHex(dHex, keyPadHex));

    // упаковываем helper
    const helperJson = JSON.stringify({ ciphers, masks, nonces });
    return { keyHex, helperJson };
  }

  
  reproduce(value, helperJson) {
    const { ciphers, masks, nonces } = JSON.parse(helperJson);
    const vHex = this._toHex(this.embeddingToBinary(value));
    if (vHex.length !== this.length * 2) {
      throw new Error(`Неправильная длина: ожидалось ${this.length} байт`);
    }

    // пробуем восстановить
    for (let i = 0; i < this.numHelpers; i++) {
      const vecHex  = andHex(masks[i], vHex);
      const digestHex = CryptoJS.PBKDF2(
        CryptoJS.enc.Hex.parse(vecHex),
        CryptoJS.enc.Hex.parse(nonces[i]),
        { keySize: this.cipherLen / 4, iterations: 1, hasher: CryptoJS.algo[this.hashFunc.toUpperCase()] }
      ).toString(CryptoJS.enc.Hex);
      const plainHex = xorHex(digestHex, ciphers[i]);
      const tail = plainHex.slice(-this.secLen * 2);
      if (/^0+$/.test(tail)) {
        return plainHex.slice(0, -this.secLen * 2);
      }
    }
    return null;
  }

  /** Преобразует WordArray или hex-строку в чистую hex-строку */
  _toHex(value) {
    if (typeof value === 'string') return value;
    if (value.sigBytes != null && value.words) {
      return value.toString(CryptoJS.enc.Hex);
    }
    throw new TypeError('Значение должно быть hex-строкой или WordArray');
  }

  embeddingToBinary(embedding) {
    // // 1) приводим к Float32Array
    // const arr = Float32Array.from(embedding);
    // // 2) L2-нормализация
    // const norm = Math.hypot(...arr);
    // if (norm > 0) {
    //   for (let i = 0; i < arr.length; i++) {
    //     arr[i] /= norm;
    //   }
    // }
    // // 3) бинарация по знаку
    // const bits = Array.from(arr).map(v => (v >= 0 ? 1 : 0));
    // const bits_str = bits.join('')
    // // console.log(bits_str.length)
    // const byteLen = Math.ceil(bits_str.length / 8);
    // const u8 = new Uint8Array(byteLen);
    // for (let i = 0; i < byteLen; i++) {
    //     // берём по 8 бит (или меньше для последнего байта)
    //     const byteBits = bits_str.slice(i * 8, i * 8 + 8).padEnd(8, '0');
    //     u8[i] = parseInt(byteBits, 2);
    // }
    // return CryptoJS.lib.WordArray.create(u8)
    const norm = Math.hypot(...embedding);
    const normed = norm > 0 ? Float32Array.from(embedding, v => v / norm) : embedding;
    const bits = normed.map(v => (v >= 0 ? 1 : 0));
    // упакуем по 8 бит в байт
    const bytes = new Uint8Array(16);
    bits.forEach((bit, i) => {
        const idx = (i / 8) | 0;
        bytes[idx] = (bytes[idx] << 1) | bit;
        if (i % 8 === 7) bytes[idx] = bytes[idx] & 0xff;
    });
    return CryptoJS.lib.WordArray.create(bytes)
    // return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

  }
}

// Утилиты:
function xorHex(a, b) {
  const out = [];
  for (let i = 0; i < a.length; i += 2) {
    const byte = parseInt(a.substr(i,2),16) ^ parseInt(b.substr(i,2),16);
    out.push(byte.toString(16).padStart(2,'0'));
  }
  return out.join('');
}

function andHex(a, b) {
  const out = [];
  for (let i = 0; i < a.length; i += 2) {
    const byte = parseInt(a.substr(i,2),16) & parseInt(b.substr(i,2),16);
    out.push(byte.toString(16).padStart(2,'0'));
  }
  return out.join('');
}
  