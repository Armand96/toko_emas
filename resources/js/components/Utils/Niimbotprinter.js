// niimbotPrinter.js
// Driver untuk NIIMBOT B1 & B21 (203dpi, printhead 384px, protocol version 3, task "b1").
// Cuma jalan di Chrome/Edge (Chromium) + HTTPS/localhost. Firefox/Safari gak support Web Bluetooth.
// B21 & B1 satu keluarga protokol -- beda cuma prefix nama BLE yang di-advertise.

const SERVICE_UUID = 'e7810a71-73ae-499d-8c15-faa9aef0c3f2';
const CHAR_UUID = 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f';
export const PRINTHEAD_PX = 384; // fixed hardware limit B1 & B21 (~48mm). Bukan sesuatu yg bisa di-config lewat CSS.

// ---------- Frame helpers ----------
function buildFrame(cmd, data = []) {
  const len = data.length;
  let crc = cmd ^ len;
  for (const b of data) crc ^= b;
  return new Uint8Array([0x55, 0x55, cmd, len, ...data, crc, 0xaa, 0xaa]);
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function rowsEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function popcount8(byte) {
  let c = 0;
  while (byte) {
    c += byte & 1;
    byte >>= 1;
  }
  return c;
}

// ---------- Driver ----------
export class NiimbotPrinter {
  constructor() {
    this.device = null;
    this.characteristic = null;
    this._pendingResolvers = new Map();
  }

  // Panggil dari onClick tombol -- Web Bluetooth WAJIB user gesture.
  // B1 advertise nama "B1...", B21 advertise nama "B2...". Kita terima keduanya.
  async connect() {
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'B1' }, { namePrefix: 'B2' }, { namePrefix: 'D1' }],
      optionalServices: [SERVICE_UUID],
    });

    const server = await this.device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    this.characteristic = await service.getCharacteristic(CHAR_UUID);

    await this.characteristic.startNotifications();
    this.characteristic.addEventListener('characteristicvaluechanged', (e) =>
      this._onNotify(new Uint8Array(e.target.value.buffer))
    );

    await this._writeRaw(new Uint8Array([0x03, 0x55, 0x55, 0xc1, 0x01, 0x01, 0xc1, 0xaa, 0xaa]));
    await sleep(50);

    // Handshake WAJIB untuk task `b1`. Skip ini = command "diterima" tapi printer gak pernah nge-print.
    await this._send(0xa5, [1], 0xb5);
    for (const sub of [0x08, 0x0b, 0x0d, 0x0a, 0x07, 0x03, 0x0c, 0x09]) {
      await this._send(0x40, [sub], null);
      await sleep(20);
    }
    await this._send(0xdc, [0x04], 0xd9);
  }

  disconnect() {
    this.device?.gatt?.disconnect();
  }

  _onNotify(bytes) {
    if (bytes.length < 4 || bytes[0] !== 0x55 || bytes[1] !== 0x55) return;
    const cmd = bytes[2];
    const resolvers = this._pendingResolvers.get(cmd);
    if (resolvers && resolvers.length) resolvers.shift()(bytes);
  }

  async _writeRaw(bytes) {
    await this.characteristic.writeValueWithoutResponse(bytes);
  }

  _send(cmd, data, expectCmd, timeoutMs = 5000) {
    const frame = buildFrame(cmd, data);
    const writePromise = this._writeRaw(frame);
    if (expectCmd == null) return writePromise;

    return new Promise((resolve, reject) => {
      const arr = this._pendingResolvers.get(expectCmd) || [];
      arr.push(resolve);
      this._pendingResolvers.set(expectCmd, arr);
      writePromise;
      setTimeout(() => reject(new Error(`Timeout waiting for 0x${expectCmd.toString(16)}`)), timeoutMs);
    });
  }

  // Print satu label. Untuk banyak label dengan isi BEDA-BEDA (nama produk beda dll),
  // panggil ini berkali-kali secara sequential -- setiap label = satu job penuh.
  // bitmap: { widthPx, heightPx, rows: Uint8Array[] }
  async printLabel(bitmap, { density = 3 } = {}) {
    if (bitmap.widthPx > PRINTHEAD_PX) {
      throw new Error(`Lebar bitmap ${bitmap.widthPx}px > printhead (${PRINTHEAD_PX}px). Resize dulu.`);
    }

    await this._send(0x21, [density], 0x31);
    await this._send(0x23, [1], 0x33); // label type: with gaps (die-cut label roll)
    await this._send(0x01, [0, 1, 0, 0, 0, 0, 0], 0x02); // PrintStart, pages=1
    await this._send(0x03, [1], 0x04); // PageStart

    const H = bitmap.heightPx;
    const W = bitmap.widthPx;
    await this._send(0x13, [(H >> 8) & 0xff, H & 0xff, (W >> 8) & 0xff, W & 0xff, 0x00, 1], 0x14);

    let i = 0;
    while (i < bitmap.rows.length) {
      const row = bitmap.rows[i];
      const isBlank = row.every((b) => b === 0);
      let run = 1;
      while (i + run < bitmap.rows.length && run < 200 && rowsEqual(bitmap.rows[i + run], row)) run++;

      const rowHi = (i >> 8) & 0xff;
      const rowLo = i & 0xff;

      if (isBlank) {
        await this._send(0x84, [rowHi, rowLo, run]);
      } else {
        const total = row.reduce((acc, b) => acc + popcount8(b), 0);
        await this._send(0x85, [rowHi, rowLo, 0x00, total & 0xff, (total >> 8) & 0xff, run, ...row]);
      }

      await sleep(10); // WAJIB -- drop row kalau full-speed burst tanpa jeda ini
      i += run;
    }

    await this._send(0xe3, [1], 0xe4); // PageEnd

    const start = Date.now();
    while (Date.now() - start < 25000) {
      const resp = await this._send(0xa3, [1], 0xb3);
      // Frame: [0x55,0x55,cmd,len,...data,crc,0xAA,0xAA] -- data mulai di index 4.
      // page(u16 BE) = data[0..1] = resp[4..5]. SEBELUMNYA salah baca resp[6]/resp[7]
      // (itu print%/feed%, bukan page) -- itu penyebab PrintEnd kekirim kepagian & label kepotong.
      const page = (resp[4] << 8) | resp[5];
      if (page >= 1) break;
      await sleep(200);
    }

    await this._send(0xf3, [1], 0xf4); // PrintEnd
  }
}

// ---------- canvas → bitmap ----------
// Convert isi sebuah <canvas> (yang udah lo gambar sendiri: QR + teks dll) jadi bitmap 1-bit siap print.
export function canvasToBitmap(canvas) {
  const widthPx = canvas.width;
  const heightPx = canvas.height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, widthPx, heightPx).data;

  const stride = Math.ceil(widthPx / 8);
  const rows = [];
  for (let y = 0; y < heightPx; y++) {
    const rowBytes = new Uint8Array(stride);
    for (let x = 0; x < widthPx; x++) {
      const idx = (y * widthPx + x) * 4;
      const luminance = 0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2];
      if (luminance < 128) rowBytes[x >> 3] |= 0x80 >> (x & 7); // no dithering, MSB-first
    }
    rows.push(rowBytes);
  }

  return { widthPx, heightPx, rows };
}