import { Promise } from "es6-promise"
declare let DecoderModule: any;

enum AccountingProperty {
  GET_ACCCOUNTING_SYMBOL_COUNT,
  GET_ACCCOUNTING_SYMBOL_NAME,
  GET_ACCCOUNTING_SYMBOL_BITS,
  GET_ACCCOUNTING_SYMBOL_SAMPLES,
  GET_ACCCOUNTING_SYMBOL_CONTEXT_X,
  GET_ACCCOUNTING_SYMBOL_CONTEXT_Y
}

export class AccountingSymbol {
  constructor(public name: string, public bits: number, public samples: number, public x: number, public y: number) {
    // ...
  }
}

type AccountingSymbolMap = { [name: string]: AccountingSymbol };

export class Accounting {
  symbols: AccountingSymbol [] = null;
  frameSymbols: AccountingSymbolMap = null;
  constructor(symbols: AccountingSymbol [] = []) {
    this.symbols = symbols;
  }
  createFrameSymbols() {
    if (this.frameSymbols) {
      return this.frameSymbols;
    }
    this.frameSymbols = Object.create(null);
    this.frameSymbols = Accounting.flatten(this.symbols);
    return this.frameSymbols;
  }

  static flatten(sybmols: AccountingSymbol []): AccountingSymbolMap {
    let map = Object.create(null);
    sybmols.forEach(symbol => {
      let s = map[symbol.name];
      if (!s) {
        s = map[symbol.name] = new AccountingSymbol(symbol.name, 0, 0, symbol.x, symbol.y);
      }
      s.bits += symbol.bits;
      s.samples += symbol.samples;
    });
    let ret = Object.create(null);
    let names = [];
    for (let name in map) names.push(name);
    // Sort by bits.
    names.sort((a, b) => map[b].bits - map[a].bits);
    names.forEach(name => {
      ret[name] = map[name];
    });
    return ret;
  }

  static getSortedSymbolNames(accountings: Accounting []): string [] {
    let set = {};
    accountings.forEach(accounting => {
      let frameSymbols = accounting.createFrameSymbols();
      for (let name in frameSymbols) {
        set[name] = undefined;
      }
    });
    let names = Object.keys(set);
    names.sort();
    return names;
  }
}

interface Internal {
  _read_frame (): number;
  _get_plane (pli: number): number;
  _get_plane_stride (pli: number): number;
  _get_plane_width (pli: number): number;
  _get_plane_height (pli: number): number;
  _get_mi_cols_and_rows(): number;
  _get_tile_cols_and_rows_log2(): number;
  _get_frame_count(): number;
  _get_frame_width(): number;
  _get_frame_height(): number;
  _open_file(): number;

  // _get_property(p: Property): number;
  _get_accounting_property(p: AccountingProperty, i: number): number;
  // _get_mi_property(p: MIProperty, mi_col: number, mi_row: number, i: number): number;

  _get_predicted_plane_buffer(pli: number): number;
  _get_predicted_plane_stride(pli: number): number;

  FS: any;
  HEAPU8: Uint8Array;
  UTF8ToString(p: number): string;
}

export class AnalyzerFrame {
  accounting: Accounting;
}

export class Analyzer {
  file: string;
  decoder: string;
  native: Internal;
  HEAPU8: Uint8Array;
  buffer: Uint8Array;
  frameNumber: number = -1;
  lastDecodeFrameTime: number = 0;
  frames: AnalyzerFrame [] = [];
  // frameErrors: ErrorMetrics [] = [];
  // frameModes: FrameModeMetrics [] = [];
  // frameBlockSizes: FrameBlockSizeMetrics [] = [];
  // y4mFile: Y4MFile;
  constructor (native: Internal) {
    this.native = native;
    this.HEAPU8 = native.HEAPU8;
    this.buffer = new Uint8Array(0);
  }

  openFileBytes(buffer: Uint8Array) {
    this.buffer = buffer;
    this.native.FS.writeFile("/tmp/input.ivf", buffer, { encoding: "binary" });
    this.native._open_file();
  }

  readFrame(): Promise<AnalyzerFrame> {
    return Promise.resolve(this.readFrameSync());
  }
  readFrameSync(): AnalyzerFrame {
    let s = performance.now();
    if (this.native._read_frame() != 0) {
      return null;
    }
    this.frameNumber ++;

    this.lastDecodeFrameTime = performance.now() - s;

    let frame = new AnalyzerFrame();
    frame.accounting = this.getAccounting();
    // this.accountings.push(this.getAccounting());
    // this.frameErrors.push(this.getFrameError());
    // this.frameModes.push(this.getFrameModeMetrics());
    // this.frameBlockSizes.push(this.getFrameBlockSizeMetrics());
    this.frames[this.frameNumber] = frame;
    return frame;
  }

  getAccountingProperty(p: AccountingProperty, i: number = 0) {
    return this.native._get_accounting_property(p, i);
  }

  getString(i: number): string {
    return this.native.UTF8ToString(i);
  }

  getAccounting(): Accounting {
    var accounting = new Accounting();
    let count = this.getAccountingProperty(AccountingProperty.GET_ACCCOUNTING_SYMBOL_COUNT);
    let nameMap = [];
    for (let i = 0; i < count; i++) {
      let nameAddress = this.getAccountingProperty(AccountingProperty.GET_ACCCOUNTING_SYMBOL_NAME, i);
      if (nameMap[nameAddress] === undefined) {
        nameMap[nameAddress] = this.getString(nameAddress);
      }
      let name = nameMap[nameAddress];
      let bits = this.getAccountingProperty(AccountingProperty.GET_ACCCOUNTING_SYMBOL_BITS, i);
      let samples = this.getAccountingProperty(AccountingProperty.GET_ACCCOUNTING_SYMBOL_SAMPLES, i);
      let x = this.getAccountingProperty(AccountingProperty.GET_ACCCOUNTING_SYMBOL_CONTEXT_X, i);
      let y = this.getAccountingProperty(AccountingProperty.GET_ACCCOUNTING_SYMBOL_CONTEXT_Y, i);
      accounting.symbols.push(new AccountingSymbol(name, bits, samples, x, y));
    }
    return accounting;
  }

  static downloadFile(path: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      let self = this;
      xhr.open("GET", path, true);
      xhr.responseType = "arraybuffer";
      xhr.send();
      xhr.addEventListener("progress", (e) => {
        let progress = (e.loaded / e.total) * 100;
      });
      xhr.addEventListener("load", function () {
        if (xhr.status != 200) {
          return;
        }
        resolve(new Uint8Array(this.response));
      });
    });
  }

  static fileExists(url: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      let self = this;
      xhr.open("HEAD", url, true);
      xhr.send();
      xhr.addEventListener("load", function () {
        if (xhr.status != 404) {
          resolve(true);
        }
        resolve(false);
      });
    });
  }

  static loadDecoder(url: string): Promise<Analyzer> {
    return new Promise((resolve, reject) => {
      let s = document.createElement('script');
      let self = this;
      s.onload = function () {
        var aom = null;
        var Module = {
          noExitRuntime: true,
          preRun: [],
          postRun: [function() {
            console.info(`Loaded Decoder: ${url}.`);
          }],
          memoryInitializerPrefixURL: "bin/",
          arguments: ['input.ivf', 'output.raw']
        };
        resolve(new Analyzer(DecoderModule(Module)));
      }
      s.setAttribute('src', url);
      document.body.appendChild(s);
    });
  }
}
