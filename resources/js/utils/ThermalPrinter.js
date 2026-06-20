const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

const BLE_SERVICE = '000018f0-0000-1000-8000-00805f9b34fb';
const BLE_CHAR = '00002af1-0000-1000-8000-00805f9b34fb';

const BLE_SERVICE_ALT = '0000ff00-0000-1000-8000-00805f9b34fb';
const BLE_CHAR_ALT = '0000ff02-0000-1000-8000-00805f9b34fb';

const ALIGN_LEFT = [ESC, 0x61, 0x00];
const ALIGN_CENTER = [ESC, 0x61, 0x01];
const ALIGN_RIGHT = [ESC, 0x61, 0x02];
const BOLD_ON = [ESC, 0x45, 0x01];
const BOLD_OFF = [ESC, 0x45, 0x00];
const FONT_NORMAL = [ESC, 0x21, 0x00];
const FONT_DOUBLE_HEIGHT = [ESC, 0x21, 0x10];
const INIT = [ESC, 0x40];
const FEED_AND_CUT = [GS, 0x56, 0x41, 0x03];

const encoder = new TextEncoder();

function textToBytes(text) {
    return encoder.encode(text);
}

function buildLine(left, right, width = 32) {
    const gap = width - left.length - right.length;
    if (gap <= 0) return left + ' ' + right;
    return left + ' '.repeat(gap) + right;
}

function dashedLine(width = 32) {
    return '-'.repeat(width);
}

// ── CONNECTION ADAPTERS ──────────────────────────────────────

let activeAdapter = null;

const BleAdapter = {
    type: 'bluetooth',
    device: null,
    characteristic: null,

    isAvailable() {
        return !!navigator.bluetooth;
    },

    async connect() {
        if (this.device?.gatt?.connected && this.characteristic) return;

        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { services: [BLE_SERVICE] },
                { services: [BLE_SERVICE_ALT] },
            ],
            optionalServices: [BLE_SERVICE, BLE_SERVICE_ALT],
        });

        device.addEventListener('gattserverdisconnected', () => {
            this.device = null;
            this.characteristic = null;
            if (activeAdapter === this) activeAdapter = null;
        });

        const server = await device.gatt.connect();

        let service, characteristic;
        try {
            service = await server.getPrimaryService(BLE_SERVICE);
            characteristic = await service.getCharacteristic(BLE_CHAR);
        } catch {
            service = await server.getPrimaryService(BLE_SERVICE_ALT);
            characteristic = await service.getCharacteristic(BLE_CHAR_ALT);
        }

        this.device = device;
        this.characteristic = characteristic;
    },

    async send(data) {
        const CHUNK = 100;
        for (let i = 0; i < data.length; i += CHUNK) {
            const chunk = data.slice(i, i + CHUNK);
            await this.characteristic.writeValueWithoutResponse(new Uint8Array(chunk));
            await new Promise((r) => setTimeout(r, 30));
        }
    },

    disconnect() {
        if (this.device?.gatt?.connected) this.device.gatt.disconnect();
        this.device = null;
        this.characteristic = null;
    },

    isConnected() {
        return !!(this.device?.gatt?.connected && this.characteristic);
    },
};

const SerialAdapter = {
    type: 'usb',
    port: null,
    writer: null,

    isAvailable() {
        return !!navigator.serial;
    },

    async connect() {
        if (this.port?.readable && this.writer) return;

        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });

        this.port = port;
        this.writer = port.writable.getWriter();
    },

    async send(data) {
        const CHUNK = 512;
        for (let i = 0; i < data.length; i += CHUNK) {
            const chunk = data.slice(i, i + CHUNK);
            await this.writer.write(new Uint8Array(chunk));
            await new Promise((r) => setTimeout(r, 10));
        }
    },

    async disconnect() {
        if (this.writer) {
            await this.writer.close().catch(() => {});
            this.writer = null;
        }
        if (this.port) {
            await this.port.close().catch(() => {});
            this.port = null;
        }
    },

    isConnected() {
        return !!(this.port?.readable && this.writer);
    },
};

// ── RECEIPT BUILDERS ─────────────────────────────────────────

function buildKwitansiData({ branch, order_id, created_at, user, customer, details, sub_total, grand_total, payment_type, formatCurrency }) {
    const W = 32;
    let data = [];

    data.push(...INIT);

    data.push(...ALIGN_CENTER);
    data.push(...BOLD_ON);
    data.push(...FONT_DOUBLE_HEIGHT);
    data.push(...textToBytes(branch?.branch_name ?? 'Toko Emas'));
    data.push(LF);
    data.push(...FONT_NORMAL);
    data.push(...BOLD_OFF);

    if (branch?.address) {
        data.push(...textToBytes(branch.address));
        data.push(LF);
    }

    data.push(...textToBytes('KWITANSI PENJUALAN'));
    data.push(LF);

    data.push(...ALIGN_LEFT);
    data.push(...textToBytes(dashedLine(W)));
    data.push(LF);

    data.push(...textToBytes(buildLine('Order ID', order_id || '-', W)));
    data.push(LF);
    data.push(...textToBytes(buildLine('Tanggal', created_at || '-', W)));
    data.push(LF);
    data.push(...textToBytes(buildLine('Kasir', user?.name || '-', W)));
    data.push(LF);
    data.push(...textToBytes(buildLine('Customer', customer?.customer_name || '-', W)));
    data.push(LF);

    data.push(...textToBytes(dashedLine(W)));
    data.push(LF);

    (details || []).forEach((item) => {
        const name = item.product?.product_name ?? '-';
        data.push(...BOLD_ON);
        data.push(...textToBytes(name));
        data.push(LF);
        data.push(...BOLD_OFF);

        let info = item.inventory_code || '';
        if (item.inventory?.berat) info += ` ${item.inventory.berat}g`;
        if (item.inventory?.karat) info += ` ${item.inventory.karat}K`;
        if (info) {
            data.push(...textToBytes('  ' + info));
            data.push(LF);
        }

        const price = formatCurrency ? formatCurrency(item.price) : `Rp${item.price}`;
        data.push(...ALIGN_RIGHT);
        data.push(...textToBytes(price));
        data.push(LF);
        data.push(...ALIGN_LEFT);
    });

    data.push(...textToBytes(dashedLine(W)));
    data.push(LF);

    const subTotalStr = formatCurrency ? formatCurrency(sub_total) : `Rp${sub_total}`;
    const grandTotalStr = formatCurrency ? formatCurrency(grand_total) : `Rp${grand_total}`;

    data.push(...textToBytes(buildLine('Sub Total', subTotalStr, W)));
    data.push(LF);

    data.push(...BOLD_ON);
    data.push(...textToBytes(buildLine('TOTAL', grandTotalStr, W)));
    data.push(LF);
    data.push(...BOLD_OFF);

    data.push(...textToBytes(buildLine('Bayar', payment_type === 'TRANSFER' ? 'Transfer' : 'Tunai', W)));
    data.push(LF);

    data.push(...textToBytes(dashedLine(W)));
    data.push(LF);

    data.push(...ALIGN_CENTER);
    data.push(...textToBytes('Terima kasih atas kepercayaan Anda'));
    data.push(LF, LF, LF, LF);

    data.push(...FEED_AND_CUT);

    return data;
}

function buildBarcodeLabel({ barcode, label }) {
    let data = [];

    data.push(...ALIGN_LEFT);
    data.push(...BOLD_ON);
    data.push(...textToBytes(barcode || '-'));
    data.push(LF);
    data.push(...BOLD_OFF);

    if (label) {
        data.push(...textToBytes(label));
        data.push(LF);
    }

    data.push(...textToBytes(dashedLine(32)));
    data.push(LF);

    return data;
}

function buildBarcodeLabelsData(items) {
    let data = [...INIT];
    items.forEach((item) => data.push(...buildBarcodeLabel(item)));
    data.push(LF, LF, LF);
    data.push(...FEED_AND_CUT);
    return data;
}

// ── PUBLIC API ───────────────────────────────────────────────

const ThermalPrinter = {
    getAvailableMethods() {
        const methods = [];
        if (BleAdapter.isAvailable()) methods.push('bluetooth');
        if (SerialAdapter.isAvailable()) methods.push('usb');
        methods.push('browser');
        return methods;
    },

    isSupported() {
        return BleAdapter.isAvailable() || SerialAdapter.isAvailable();
    },

    getConnectionType() {
        if (activeAdapter?.isConnected()) return activeAdapter.type;
        return null;
    },

    isConnected() {
        return !!activeAdapter?.isConnected();
    },

    async connect(method) {
        if (method === 'bluetooth') {
            await BleAdapter.connect();
            activeAdapter = BleAdapter;
        } else if (method === 'usb') {
            await SerialAdapter.connect();
            activeAdapter = SerialAdapter;
        } else {
            const adapter = BleAdapter.isAvailable() ? BleAdapter : SerialAdapter;
            await adapter.connect();
            activeAdapter = adapter;
        }
        return activeAdapter.type;
    },

    disconnect() {
        activeAdapter?.disconnect();
        activeAdapter = null;
    },

    async printKwitansi(data) {
        if (!activeAdapter?.isConnected()) {
            await this.connect();
        }
        const bytes = buildKwitansiData(data);
        await activeAdapter.send(bytes);
    },

    async printBarcodeLabels(items) {
        if (!activeAdapter?.isConnected()) {
            await this.connect();
        }
        const bytes = buildBarcodeLabelsData(items);
        await activeAdapter.send(bytes);
    },

    async printRaw(bytes) {
        if (!activeAdapter?.isConnected()) {
            await this.connect();
        }
        await activeAdapter.send(Array.from(bytes));
    },
};

export default ThermalPrinter;
