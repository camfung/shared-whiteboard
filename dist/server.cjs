const import_meta_url = require('url').pathToFileURL(__filename).href;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "node_modules/ws/lib/constants.js"(exports2, module2) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module2.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: /* @__PURE__ */ Symbol("kIsForOnEventAttribute"),
      kListener: /* @__PURE__ */ Symbol("kListener"),
      kStatusCode: /* @__PURE__ */ Symbol("status-code"),
      kWebSocket: /* @__PURE__ */ Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "node_modules/ws/lib/buffer-util.js"(exports2, module2) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module2.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = require("bufferutil");
        module2.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module2.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "node_modules/ws/lib/limiter.js"(exports2, module2) {
    "use strict";
    var kDone = /* @__PURE__ */ Symbol("kDone");
    var kRun = /* @__PURE__ */ Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module2.exports = Limiter;
  }
});

// node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "node_modules/ws/lib/permessage-deflate.js"(exports2, module2) {
    "use strict";
    var zlib = require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = /* @__PURE__ */ Symbol("permessage-deflate");
    var kTotalLength = /* @__PURE__ */ Symbol("total-length");
    var kCallback = /* @__PURE__ */ Symbol("callback");
    var kBuffers = /* @__PURE__ */ Symbol("buffers");
    var kError = /* @__PURE__ */ Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate2 = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [options.isServer=false] Create the instance in either
       *     server or client mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       */
      constructor(options) {
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._maxPayload = this._options.maxPayload | 0;
        this._isServer = !!this._options.isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module2.exports = PerMessageDeflate2;
    function deflateOnData(chunk2) {
      this[kBuffers].push(chunk2);
      this[kTotalLength] += chunk2.length;
    }
    function inflateOnData(chunk2) {
      this[kTotalLength] += chunk2.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk2);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "node_modules/ws/lib/validation.js"(exports2, module2) {
    "use strict";
    var { isUtf8 } = require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module2.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module2.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = require("utf-8-validate");
        module2.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "node_modules/ws/lib/receiver.js"(exports2, module2) {
    "use strict";
    var { Writable } = require("stream");
    var PerMessageDeflate2 = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxBufferedChunks = options.maxBufferedChunks | 0;
        this._maxFragments = options.maxFragments | 0;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._numFragments = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk2, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
          cb(
            this.createError(
              RangeError,
              "Too many buffered chunks",
              false,
              1008,
              "WS_ERR_TOO_MANY_BUFFERED_PARTS"
            )
          );
          return;
        }
        this._bufferedBytes += chunk2.length;
        this._buffers.push(chunk2);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate2.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
          const error = this.createError(
            RangeError,
            "Too many message fragments",
            false,
            1008,
            "WS_ERR_TOO_MANY_BUFFERED_PARTS"
          );
          cb(error);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._numFragments = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module2.exports = Receiver2;
  }
});

// node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "node_modules/ws/lib/sender.js"(exports2, module2) {
    "use strict";
    var { Duplex } = require("stream");
    var { randomFillSync } = require("crypto");
    var {
      types: { isUint8Array }
    } = require("util");
    var PerMessageDeflate2 = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = /* @__PURE__ */ Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else if (isUint8Array(data)) {
            buf.set(data, 2);
          } else {
            throw new TypeError("Second argument must be a string or a Uint8Array");
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module2.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "node_modules/ws/lib/event-target.js"(exports2, module2) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = /* @__PURE__ */ Symbol("kCode");
    var kData = /* @__PURE__ */ Symbol("kData");
    var kError = /* @__PURE__ */ Symbol("kError");
    var kMessage = /* @__PURE__ */ Symbol("kMessage");
    var kReason = /* @__PURE__ */ Symbol("kReason");
    var kTarget = /* @__PURE__ */ Symbol("kTarget");
    var kType = /* @__PURE__ */ Symbol("kType");
    var kWasClean = /* @__PURE__ */ Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module2.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "node_modules/ws/lib/extension.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format2(extensions) {
      return Object.keys(extensions).map((extension2) => {
        let configurations = extensions[extension2];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension2].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module2.exports = { format: format2, parse };
  }
});

// node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "node_modules/ws/lib/websocket.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var https = require("https");
    var http2 = require("http");
    var net = require("net");
    var tls = require("tls");
    var { randomBytes, createHash } = require("crypto");
    var { Duplex, Readable } = require("stream");
    var { URL: URL2 } = require("url");
    var PerMessageDeflate2 = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format: format2, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = /* @__PURE__ */ Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket3 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxBufferedChunks: options.maxBufferedChunks,
          maxFragments: options.maxFragments,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate2.extensionName]) {
          this._extensions[PerMessageDeflate2.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate2.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket3, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket3.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket3, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket3.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket3, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket3.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket3, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket3.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket3.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket3.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket3.prototype.addEventListener = addEventListener;
    WebSocket3.prototype.removeEventListener = removeEventListener;
    module2.exports = WebSocket3;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxBufferedChunks: 256 * 1024,
        maxFragments: 16 * 1024,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL2) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL2(address);
        } catch {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const request = isSecure ? https.request : http2.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate2({
          ...opts.perMessageDeflate,
          isServer: false,
          maxPayload: opts.maxPayload
        });
        opts.headers["Sec-WebSocket-Extensions"] = format2({
          [PerMessageDeflate2.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL2(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket3.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate2.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate2.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxBufferedChunks: opts.maxBufferedChunks,
          maxFragments: opts.maxFragments,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket3.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket3.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket3.CLOSED) return;
      if (websocket.readyState === WebSocket3.OPEN) {
        websocket._readyState = WebSocket3.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket3.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk2 = this.read(this._readableState.length);
        websocket._receiver.write(chunk2);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk2) {
      if (!this[kWebSocket]._receiver.write(chunk2)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket3.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket3.CLOSING;
        this.destroy();
      }
    }
  }
});

// node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "node_modules/ws/lib/stream.js"(exports2, module2) {
    "use strict";
    var WebSocket3 = require_websocket();
    var { Duplex } = require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk2, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk2, encoding, callback);
          });
          return;
        }
        ws.send(chunk2, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module2.exports = createWebSocketStream2;
  }
});

// node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "node_modules/ws/lib/subprotocol.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module2.exports = { parse };
  }
});

// node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "node_modules/ws/lib/websocket-server.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var http2 = require("http");
    var { Duplex } = require("stream");
    var { createHash } = require("crypto");
    var extension2 = require_extension();
    var PerMessageDeflate2 = require_permessage_deflate();
    var subprotocol2 = require_subprotocol();
    var WebSocket3 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=16384] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxBufferedChunks: 256 * 1024,
          maxFragments: 16 * 1024,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket3,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http2.createServer((req, res) => {
            const body = http2.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server2 = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server2.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index2 = req.url.indexOf("?");
          const pathname = index2 !== -1 ? req.url.slice(0, index2) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol2.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate2({
            ...this.options.perMessageDeflate,
            isServer: true,
            maxPayload: this.options.maxPayload
          });
          try {
            const offers = extension2.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate2.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate2.extensionName]);
              extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate2.extensionName]) {
          const params = extensions[PerMessageDeflate2.extensionName].params;
          const value = extension2.format({
            [PerMessageDeflate2.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxBufferedChunks: this.options.maxBufferedChunks,
          maxFragments: this.options.maxFragments,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module2.exports = WebSocketServer2;
    function addListeners(server2, map) {
      for (const event of Object.keys(map)) server2.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server2.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server2) {
      server2._state = CLOSED;
      server2.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http2.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http2.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server2, req, socket, code, message, headers) {
      if (server2.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server2.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// node_modules/lodash.isequal/index.js
var require_lodash = __commonJS({
  "node_modules/lodash.isequal/index.js"(exports2, module2) {
    var LARGE_ARRAY_SIZE = 200;
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    var COMPARE_PARTIAL_FLAG = 1;
    var COMPARE_UNORDERED_FLAG = 2;
    var MAX_SAFE_INTEGER = 9007199254740991;
    var argsTag = "[object Arguments]";
    var arrayTag = "[object Array]";
    var asyncTag = "[object AsyncFunction]";
    var boolTag = "[object Boolean]";
    var dateTag = "[object Date]";
    var errorTag = "[object Error]";
    var funcTag = "[object Function]";
    var genTag = "[object GeneratorFunction]";
    var mapTag = "[object Map]";
    var numberTag = "[object Number]";
    var nullTag = "[object Null]";
    var objectTag = "[object Object]";
    var promiseTag = "[object Promise]";
    var proxyTag = "[object Proxy]";
    var regexpTag = "[object RegExp]";
    var setTag = "[object Set]";
    var stringTag = "[object String]";
    var symbolTag = "[object Symbol]";
    var undefinedTag = "[object Undefined]";
    var weakMapTag = "[object WeakMap]";
    var arrayBufferTag = "[object ArrayBuffer]";
    var dataViewTag = "[object DataView]";
    var float32Tag = "[object Float32Array]";
    var float64Tag = "[object Float64Array]";
    var int8Tag = "[object Int8Array]";
    var int16Tag = "[object Int16Array]";
    var int32Tag = "[object Int32Array]";
    var uint8Tag = "[object Uint8Array]";
    var uint8ClampedTag = "[object Uint8ClampedArray]";
    var uint16Tag = "[object Uint16Array]";
    var uint32Tag = "[object Uint32Array]";
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
    var reIsHostCtor = /^\[object .+?Constructor\]$/;
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
    var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    var freeExports = typeof exports2 == "object" && exports2 && !exports2.nodeType && exports2;
    var freeModule = freeExports && typeof module2 == "object" && module2 && !module2.nodeType && module2;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var freeProcess = moduleExports && freeGlobal.process;
    var nodeUtil = (function() {
      try {
        return freeProcess && freeProcess.binding && freeProcess.binding("util");
      } catch (e) {
      }
    })();
    var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
    function arrayFilter(array2, predicate) {
      var index2 = -1, length = array2 == null ? 0 : array2.length, resIndex = 0, result = [];
      while (++index2 < length) {
        var value = array2[index2];
        if (predicate(value, index2, array2)) {
          result[resIndex++] = value;
        }
      }
      return result;
    }
    function arrayPush(array2, values) {
      var index2 = -1, length = values.length, offset = array2.length;
      while (++index2 < length) {
        array2[offset + index2] = values[index2];
      }
      return array2;
    }
    function arraySome(array2, predicate) {
      var index2 = -1, length = array2 == null ? 0 : array2.length;
      while (++index2 < length) {
        if (predicate(array2[index2], index2, array2)) {
          return true;
        }
      }
      return false;
    }
    function baseTimes(n, iteratee) {
      var index2 = -1, result = Array(n);
      while (++index2 < n) {
        result[index2] = iteratee(index2);
      }
      return result;
    }
    function baseUnary(func) {
      return function(value) {
        return func(value);
      };
    }
    function cacheHas(cache, key) {
      return cache.has(key);
    }
    function getValue(object2, key) {
      return object2 == null ? void 0 : object2[key];
    }
    function mapToArray(map) {
      var index2 = -1, result = Array(map.size);
      map.forEach(function(value, key) {
        result[++index2] = [key, value];
      });
      return result;
    }
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    function setToArray(set) {
      var index2 = -1, result = Array(set.size);
      set.forEach(function(value) {
        result[++index2] = value;
      });
      return result;
    }
    var arrayProto = Array.prototype;
    var funcProto = Function.prototype;
    var objectProto = Object.prototype;
    var coreJsData = root["__core-js_shared__"];
    var funcToString = funcProto.toString;
    var hasOwnProperty2 = objectProto.hasOwnProperty;
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
      return uid ? "Symbol(src)_1." + uid : "";
    })();
    var nativeObjectToString = objectProto.toString;
    var reIsNative = RegExp(
      "^" + funcToString.call(hasOwnProperty2).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    );
    var Buffer2 = moduleExports ? root.Buffer : void 0;
    var Symbol2 = root.Symbol;
    var Uint8Array2 = root.Uint8Array;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var splice = arrayProto.splice;
    var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
    var nativeGetSymbols = Object.getOwnPropertySymbols;
    var nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0;
    var nativeKeys = overArg(Object.keys, Object);
    var DataView2 = getNative(root, "DataView");
    var Map2 = getNative(root, "Map");
    var Promise2 = getNative(root, "Promise");
    var Set2 = getNative(root, "Set");
    var WeakMap2 = getNative(root, "WeakMap");
    var nativeCreate = getNative(Object, "create");
    var dataViewCtorString = toSource(DataView2);
    var mapCtorString = toSource(Map2);
    var promiseCtorString = toSource(Promise2);
    var setCtorString = toSource(Set2);
    var weakMapCtorString = toSource(WeakMap2);
    var symbolProto = Symbol2 ? Symbol2.prototype : void 0;
    var symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
    function Hash(entries) {
      var index2 = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index2 < length) {
        var entry2 = entries[index2];
        this.set(entry2[0], entry2[1]);
      }
    }
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
      this.size = 0;
    }
    function hashDelete(key) {
      var result = this.has(key) && delete this.__data__[key];
      this.size -= result ? 1 : 0;
      return result;
    }
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? void 0 : result;
      }
      return hasOwnProperty2.call(data, key) ? data[key] : void 0;
    }
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate ? data[key] !== void 0 : hasOwnProperty2.call(data, key);
    }
    function hashSet(key, value) {
      var data = this.__data__;
      this.size += this.has(key) ? 0 : 1;
      data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
      return this;
    }
    Hash.prototype.clear = hashClear;
    Hash.prototype["delete"] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;
    function ListCache(entries) {
      var index2 = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index2 < length) {
        var entry2 = entries[index2];
        this.set(entry2[0], entry2[1]);
      }
    }
    function listCacheClear() {
      this.__data__ = [];
      this.size = 0;
    }
    function listCacheDelete(key) {
      var data = this.__data__, index2 = assocIndexOf(data, key);
      if (index2 < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index2 == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index2, 1);
      }
      --this.size;
      return true;
    }
    function listCacheGet(key) {
      var data = this.__data__, index2 = assocIndexOf(data, key);
      return index2 < 0 ? void 0 : data[index2][1];
    }
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }
    function listCacheSet(key, value) {
      var data = this.__data__, index2 = assocIndexOf(data, key);
      if (index2 < 0) {
        ++this.size;
        data.push([key, value]);
      } else {
        data[index2][1] = value;
      }
      return this;
    }
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype["delete"] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;
    function MapCache(entries) {
      var index2 = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index2 < length) {
        var entry2 = entries[index2];
        this.set(entry2[0], entry2[1]);
      }
    }
    function mapCacheClear() {
      this.size = 0;
      this.__data__ = {
        "hash": new Hash(),
        "map": new (Map2 || ListCache)(),
        "string": new Hash()
      };
    }
    function mapCacheDelete(key) {
      var result = getMapData(this, key)["delete"](key);
      this.size -= result ? 1 : 0;
      return result;
    }
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }
    function mapCacheSet(key, value) {
      var data = getMapData(this, key), size = data.size;
      data.set(key, value);
      this.size += data.size == size ? 0 : 1;
      return this;
    }
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype["delete"] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;
    function SetCache(values) {
      var index2 = -1, length = values == null ? 0 : values.length;
      this.__data__ = new MapCache();
      while (++index2 < length) {
        this.add(values[index2]);
      }
    }
    function setCacheAdd(value) {
      this.__data__.set(value, HASH_UNDEFINED);
      return this;
    }
    function setCacheHas(value) {
      return this.__data__.has(value);
    }
    SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
    SetCache.prototype.has = setCacheHas;
    function Stack(entries) {
      var data = this.__data__ = new ListCache(entries);
      this.size = data.size;
    }
    function stackClear() {
      this.__data__ = new ListCache();
      this.size = 0;
    }
    function stackDelete(key) {
      var data = this.__data__, result = data["delete"](key);
      this.size = data.size;
      return result;
    }
    function stackGet(key) {
      return this.__data__.get(key);
    }
    function stackHas(key) {
      return this.__data__.has(key);
    }
    function stackSet(key, value) {
      var data = this.__data__;
      if (data instanceof ListCache) {
        var pairs = data.__data__;
        if (!Map2 || pairs.length < LARGE_ARRAY_SIZE - 1) {
          pairs.push([key, value]);
          this.size = ++data.size;
          return this;
        }
        data = this.__data__ = new MapCache(pairs);
      }
      data.set(key, value);
      this.size = data.size;
      return this;
    }
    Stack.prototype.clear = stackClear;
    Stack.prototype["delete"] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;
    function arrayLikeKeys(value, inherited) {
      var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
      for (var key in value) {
        if ((inherited || hasOwnProperty2.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
        (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
        isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
        isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
        isIndex(key, length)))) {
          result.push(key);
        }
      }
      return result;
    }
    function assocIndexOf(array2, key) {
      var length = array2.length;
      while (length--) {
        if (eq(array2[length][0], key)) {
          return length;
        }
      }
      return -1;
    }
    function baseGetAllKeys(object2, keysFunc, symbolsFunc) {
      var result = keysFunc(object2);
      return isArray(object2) ? result : arrayPush(result, symbolsFunc(object2));
    }
    function baseGetTag(value) {
      if (value == null) {
        return value === void 0 ? undefinedTag : nullTag;
      }
      return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
    }
    function baseIsArguments(value) {
      return isObjectLike(value) && baseGetTag(value) == argsTag;
    }
    function baseIsEqual(value, other, bitmask, customizer, stack) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
    }
    function baseIsEqualDeep(object2, other, bitmask, customizer, equalFunc, stack) {
      var objIsArr = isArray(object2), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object2), othTag = othIsArr ? arrayTag : getTag(other);
      objTag = objTag == argsTag ? objectTag : objTag;
      othTag = othTag == argsTag ? objectTag : othTag;
      var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
      if (isSameTag && isBuffer(object2)) {
        if (!isBuffer(other)) {
          return false;
        }
        objIsArr = true;
        objIsObj = false;
      }
      if (isSameTag && !objIsObj) {
        stack || (stack = new Stack());
        return objIsArr || isTypedArray(object2) ? equalArrays(object2, other, bitmask, customizer, equalFunc, stack) : equalByTag(object2, other, objTag, bitmask, customizer, equalFunc, stack);
      }
      if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
        var objIsWrapped = objIsObj && hasOwnProperty2.call(object2, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty2.call(other, "__wrapped__");
        if (objIsWrapped || othIsWrapped) {
          var objUnwrapped = objIsWrapped ? object2.value() : object2, othUnwrapped = othIsWrapped ? other.value() : other;
          stack || (stack = new Stack());
          return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
        }
      }
      if (!isSameTag) {
        return false;
      }
      stack || (stack = new Stack());
      return equalObjects(object2, other, bitmask, customizer, equalFunc, stack);
    }
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }
    function baseIsTypedArray(value) {
      return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
    }
    function baseKeys(object2) {
      if (!isPrototype(object2)) {
        return nativeKeys(object2);
      }
      var result = [];
      for (var key in Object(object2)) {
        if (hasOwnProperty2.call(object2, key) && key != "constructor") {
          result.push(key);
        }
      }
      return result;
    }
    function equalArrays(array2, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array2.length, othLength = other.length;
      if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
      }
      var stacked = stack.get(array2);
      if (stacked && stack.get(other)) {
        return stacked == other;
      }
      var index2 = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : void 0;
      stack.set(array2, other);
      stack.set(other, array2);
      while (++index2 < arrLength) {
        var arrValue = array2[index2], othValue = other[index2];
        if (customizer) {
          var compared = isPartial ? customizer(othValue, arrValue, index2, other, array2, stack) : customizer(arrValue, othValue, index2, array2, other, stack);
        }
        if (compared !== void 0) {
          if (compared) {
            continue;
          }
          result = false;
          break;
        }
        if (seen) {
          if (!arraySome(other, function(othValue2, othIndex) {
            if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
            result = false;
            break;
          }
        } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
          result = false;
          break;
        }
      }
      stack["delete"](array2);
      stack["delete"](other);
      return result;
    }
    function equalByTag(object2, other, tag, bitmask, customizer, equalFunc, stack) {
      switch (tag) {
        case dataViewTag:
          if (object2.byteLength != other.byteLength || object2.byteOffset != other.byteOffset) {
            return false;
          }
          object2 = object2.buffer;
          other = other.buffer;
        case arrayBufferTag:
          if (object2.byteLength != other.byteLength || !equalFunc(new Uint8Array2(object2), new Uint8Array2(other))) {
            return false;
          }
          return true;
        case boolTag:
        case dateTag:
        case numberTag:
          return eq(+object2, +other);
        case errorTag:
          return object2.name == other.name && object2.message == other.message;
        case regexpTag:
        case stringTag:
          return object2 == other + "";
        case mapTag:
          var convert = mapToArray;
        case setTag:
          var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
          convert || (convert = setToArray);
          if (object2.size != other.size && !isPartial) {
            return false;
          }
          var stacked = stack.get(object2);
          if (stacked) {
            return stacked == other;
          }
          bitmask |= COMPARE_UNORDERED_FLAG;
          stack.set(object2, other);
          var result = equalArrays(convert(object2), convert(other), bitmask, customizer, equalFunc, stack);
          stack["delete"](object2);
          return result;
        case symbolTag:
          if (symbolValueOf) {
            return symbolValueOf.call(object2) == symbolValueOf.call(other);
          }
      }
      return false;
    }
    function equalObjects(object2, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object2), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
      if (objLength != othLength && !isPartial) {
        return false;
      }
      var index2 = objLength;
      while (index2--) {
        var key = objProps[index2];
        if (!(isPartial ? key in other : hasOwnProperty2.call(other, key))) {
          return false;
        }
      }
      var stacked = stack.get(object2);
      if (stacked && stack.get(other)) {
        return stacked == other;
      }
      var result = true;
      stack.set(object2, other);
      stack.set(other, object2);
      var skipCtor = isPartial;
      while (++index2 < objLength) {
        key = objProps[index2];
        var objValue = object2[key], othValue = other[key];
        if (customizer) {
          var compared = isPartial ? customizer(othValue, objValue, key, other, object2, stack) : customizer(objValue, othValue, key, object2, other, stack);
        }
        if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
          result = false;
          break;
        }
        skipCtor || (skipCtor = key == "constructor");
      }
      if (result && !skipCtor) {
        var objCtor = object2.constructor, othCtor = other.constructor;
        if (objCtor != othCtor && ("constructor" in object2 && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
          result = false;
        }
      }
      stack["delete"](object2);
      stack["delete"](other);
      return result;
    }
    function getAllKeys(object2) {
      return baseGetAllKeys(object2, keys, getSymbols);
    }
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
    }
    function getNative(object2, key) {
      var value = getValue(object2, key);
      return baseIsNative(value) ? value : void 0;
    }
    function getRawTag(value) {
      var isOwn = hasOwnProperty2.call(value, symToStringTag), tag = value[symToStringTag];
      try {
        value[symToStringTag] = void 0;
        var unmasked = true;
      } catch (e) {
      }
      var result = nativeObjectToString.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag] = tag;
        } else {
          delete value[symToStringTag];
        }
      }
      return result;
    }
    var getSymbols = !nativeGetSymbols ? stubArray : function(object2) {
      if (object2 == null) {
        return [];
      }
      object2 = Object(object2);
      return arrayFilter(nativeGetSymbols(object2), function(symbol) {
        return propertyIsEnumerable.call(object2, symbol);
      });
    };
    var getTag = baseGetTag;
    if (DataView2 && getTag(new DataView2(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2()) != mapTag || Promise2 && getTag(Promise2.resolve()) != promiseTag || Set2 && getTag(new Set2()) != setTag || WeakMap2 && getTag(new WeakMap2()) != weakMapTag) {
      getTag = function(value) {
        var result = baseGetTag(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString:
              return dataViewTag;
            case mapCtorString:
              return mapTag;
            case promiseCtorString:
              return promiseTag;
            case setCtorString:
              return setTag;
            case weakMapCtorString:
              return weakMapTag;
          }
        }
        return result;
      };
    }
    function isIndex(value, length) {
      length = length == null ? MAX_SAFE_INTEGER : length;
      return !!length && (typeof value == "number" || reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
    }
    function isKeyable(value) {
      var type = typeof value;
      return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
    }
    function isMasked(func) {
      return !!maskSrcKey && maskSrcKey in func;
    }
    function isPrototype(value) {
      var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
      return value === proto;
    }
    function objectToString(value) {
      return nativeObjectToString.call(value);
    }
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {
        }
        try {
          return func + "";
        } catch (e) {
        }
      }
      return "";
    }
    function eq(value, other) {
      return value === other || value !== value && other !== other;
    }
    var isArguments = baseIsArguments(/* @__PURE__ */ (function() {
      return arguments;
    })()) ? baseIsArguments : function(value) {
      return isObjectLike(value) && hasOwnProperty2.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
    };
    var isArray = Array.isArray;
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }
    var isBuffer = nativeIsBuffer || stubFalse;
    function isEqual(value, other) {
      return baseIsEqual(value, other);
    }
    function isFunction(value) {
      if (!isObject(value)) {
        return false;
      }
      var tag = baseGetTag(value);
      return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
    }
    function isLength(value) {
      return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }
    function isObject(value) {
      var type = typeof value;
      return value != null && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
      return value != null && typeof value == "object";
    }
    var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
    function keys(object2) {
      return isArrayLike(object2) ? arrayLikeKeys(object2) : baseKeys(object2);
    }
    function stubArray() {
      return [];
    }
    function stubFalse() {
      return false;
    }
    module2.exports = isEqual;
  }
});

// node_modules/lodash.isequalwith/index.js
var require_lodash2 = __commonJS({
  "node_modules/lodash.isequalwith/index.js"(exports2, module2) {
    var LARGE_ARRAY_SIZE = 200;
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    var UNORDERED_COMPARE_FLAG = 1;
    var PARTIAL_COMPARE_FLAG = 2;
    var MAX_SAFE_INTEGER = 9007199254740991;
    var argsTag = "[object Arguments]";
    var arrayTag = "[object Array]";
    var boolTag = "[object Boolean]";
    var dateTag = "[object Date]";
    var errorTag = "[object Error]";
    var funcTag = "[object Function]";
    var genTag = "[object GeneratorFunction]";
    var mapTag = "[object Map]";
    var numberTag = "[object Number]";
    var objectTag = "[object Object]";
    var promiseTag = "[object Promise]";
    var regexpTag = "[object RegExp]";
    var setTag = "[object Set]";
    var stringTag = "[object String]";
    var symbolTag = "[object Symbol]";
    var weakMapTag = "[object WeakMap]";
    var arrayBufferTag = "[object ArrayBuffer]";
    var dataViewTag = "[object DataView]";
    var float32Tag = "[object Float32Array]";
    var float64Tag = "[object Float64Array]";
    var int8Tag = "[object Int8Array]";
    var int16Tag = "[object Int16Array]";
    var int32Tag = "[object Int32Array]";
    var uint8Tag = "[object Uint8Array]";
    var uint8ClampedTag = "[object Uint8ClampedArray]";
    var uint16Tag = "[object Uint16Array]";
    var uint32Tag = "[object Uint32Array]";
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
    var reIsHostCtor = /^\[object .+?Constructor\]$/;
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
    var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    var freeExports = typeof exports2 == "object" && exports2 && !exports2.nodeType && exports2;
    var freeModule = freeExports && typeof module2 == "object" && module2 && !module2.nodeType && module2;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var freeProcess = moduleExports && freeGlobal.process;
    var nodeUtil = (function() {
      try {
        return freeProcess && freeProcess.binding("util");
      } catch (e) {
      }
    })();
    var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
    function arraySome(array2, predicate) {
      var index2 = -1, length = array2 ? array2.length : 0;
      while (++index2 < length) {
        if (predicate(array2[index2], index2, array2)) {
          return true;
        }
      }
      return false;
    }
    function baseTimes(n, iteratee) {
      var index2 = -1, result = Array(n);
      while (++index2 < n) {
        result[index2] = iteratee(index2);
      }
      return result;
    }
    function baseUnary(func) {
      return function(value) {
        return func(value);
      };
    }
    function getValue(object2, key) {
      return object2 == null ? void 0 : object2[key];
    }
    function isHostObject(value) {
      var result = false;
      if (value != null && typeof value.toString != "function") {
        try {
          result = !!(value + "");
        } catch (e) {
        }
      }
      return result;
    }
    function mapToArray(map) {
      var index2 = -1, result = Array(map.size);
      map.forEach(function(value, key) {
        result[++index2] = [key, value];
      });
      return result;
    }
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    function setToArray(set) {
      var index2 = -1, result = Array(set.size);
      set.forEach(function(value) {
        result[++index2] = value;
      });
      return result;
    }
    var arrayProto = Array.prototype;
    var funcProto = Function.prototype;
    var objectProto = Object.prototype;
    var coreJsData = root["__core-js_shared__"];
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
      return uid ? "Symbol(src)_1." + uid : "";
    })();
    var funcToString = funcProto.toString;
    var hasOwnProperty2 = objectProto.hasOwnProperty;
    var objectToString = objectProto.toString;
    var reIsNative = RegExp(
      "^" + funcToString.call(hasOwnProperty2).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    );
    var Symbol2 = root.Symbol;
    var Uint8Array2 = root.Uint8Array;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var splice = arrayProto.splice;
    var nativeKeys = overArg(Object.keys, Object);
    var DataView2 = getNative(root, "DataView");
    var Map2 = getNative(root, "Map");
    var Promise2 = getNative(root, "Promise");
    var Set2 = getNative(root, "Set");
    var WeakMap2 = getNative(root, "WeakMap");
    var nativeCreate = getNative(Object, "create");
    var dataViewCtorString = toSource(DataView2);
    var mapCtorString = toSource(Map2);
    var promiseCtorString = toSource(Promise2);
    var setCtorString = toSource(Set2);
    var weakMapCtorString = toSource(WeakMap2);
    var symbolProto = Symbol2 ? Symbol2.prototype : void 0;
    var symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
    function Hash(entries) {
      var index2 = -1, length = entries ? entries.length : 0;
      this.clear();
      while (++index2 < length) {
        var entry2 = entries[index2];
        this.set(entry2[0], entry2[1]);
      }
    }
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
    }
    function hashDelete(key) {
      return this.has(key) && delete this.__data__[key];
    }
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? void 0 : result;
      }
      return hasOwnProperty2.call(data, key) ? data[key] : void 0;
    }
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate ? data[key] !== void 0 : hasOwnProperty2.call(data, key);
    }
    function hashSet(key, value) {
      var data = this.__data__;
      data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
      return this;
    }
    Hash.prototype.clear = hashClear;
    Hash.prototype["delete"] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;
    function ListCache(entries) {
      var index2 = -1, length = entries ? entries.length : 0;
      this.clear();
      while (++index2 < length) {
        var entry2 = entries[index2];
        this.set(entry2[0], entry2[1]);
      }
    }
    function listCacheClear() {
      this.__data__ = [];
    }
    function listCacheDelete(key) {
      var data = this.__data__, index2 = assocIndexOf(data, key);
      if (index2 < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index2 == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index2, 1);
      }
      return true;
    }
    function listCacheGet(key) {
      var data = this.__data__, index2 = assocIndexOf(data, key);
      return index2 < 0 ? void 0 : data[index2][1];
    }
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }
    function listCacheSet(key, value) {
      var data = this.__data__, index2 = assocIndexOf(data, key);
      if (index2 < 0) {
        data.push([key, value]);
      } else {
        data[index2][1] = value;
      }
      return this;
    }
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype["delete"] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;
    function MapCache(entries) {
      var index2 = -1, length = entries ? entries.length : 0;
      this.clear();
      while (++index2 < length) {
        var entry2 = entries[index2];
        this.set(entry2[0], entry2[1]);
      }
    }
    function mapCacheClear() {
      this.__data__ = {
        "hash": new Hash(),
        "map": new (Map2 || ListCache)(),
        "string": new Hash()
      };
    }
    function mapCacheDelete(key) {
      return getMapData(this, key)["delete"](key);
    }
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }
    function mapCacheSet(key, value) {
      getMapData(this, key).set(key, value);
      return this;
    }
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype["delete"] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;
    function SetCache(values) {
      var index2 = -1, length = values ? values.length : 0;
      this.__data__ = new MapCache();
      while (++index2 < length) {
        this.add(values[index2]);
      }
    }
    function setCacheAdd(value) {
      this.__data__.set(value, HASH_UNDEFINED);
      return this;
    }
    function setCacheHas(value) {
      return this.__data__.has(value);
    }
    SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
    SetCache.prototype.has = setCacheHas;
    function Stack(entries) {
      this.__data__ = new ListCache(entries);
    }
    function stackClear() {
      this.__data__ = new ListCache();
    }
    function stackDelete(key) {
      return this.__data__["delete"](key);
    }
    function stackGet(key) {
      return this.__data__.get(key);
    }
    function stackHas(key) {
      return this.__data__.has(key);
    }
    function stackSet(key, value) {
      var cache = this.__data__;
      if (cache instanceof ListCache) {
        var pairs = cache.__data__;
        if (!Map2 || pairs.length < LARGE_ARRAY_SIZE - 1) {
          pairs.push([key, value]);
          return this;
        }
        cache = this.__data__ = new MapCache(pairs);
      }
      cache.set(key, value);
      return this;
    }
    Stack.prototype.clear = stackClear;
    Stack.prototype["delete"] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;
    function arrayLikeKeys(value, inherited) {
      var result = isArray(value) || isArguments(value) ? baseTimes(value.length, String) : [];
      var length = result.length, skipIndexes = !!length;
      for (var key in value) {
        if ((inherited || hasOwnProperty2.call(value, key)) && !(skipIndexes && (key == "length" || isIndex(key, length)))) {
          result.push(key);
        }
      }
      return result;
    }
    function assocIndexOf(array2, key) {
      var length = array2.length;
      while (length--) {
        if (eq(array2[length][0], key)) {
          return length;
        }
      }
      return -1;
    }
    function baseGetTag(value) {
      return objectToString.call(value);
    }
    function baseIsEqual(value, other, customizer, bitmask, stack) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || !isObject(value) && !isObjectLike(other)) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, baseIsEqual, customizer, bitmask, stack);
    }
    function baseIsEqualDeep(object2, other, equalFunc, customizer, bitmask, stack) {
      var objIsArr = isArray(object2), othIsArr = isArray(other), objTag = arrayTag, othTag = arrayTag;
      if (!objIsArr) {
        objTag = getTag(object2);
        objTag = objTag == argsTag ? objectTag : objTag;
      }
      if (!othIsArr) {
        othTag = getTag(other);
        othTag = othTag == argsTag ? objectTag : othTag;
      }
      var objIsObj = objTag == objectTag && !isHostObject(object2), othIsObj = othTag == objectTag && !isHostObject(other), isSameTag = objTag == othTag;
      if (isSameTag && !objIsObj) {
        stack || (stack = new Stack());
        return objIsArr || isTypedArray(object2) ? equalArrays(object2, other, equalFunc, customizer, bitmask, stack) : equalByTag(object2, other, objTag, equalFunc, customizer, bitmask, stack);
      }
      if (!(bitmask & PARTIAL_COMPARE_FLAG)) {
        var objIsWrapped = objIsObj && hasOwnProperty2.call(object2, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty2.call(other, "__wrapped__");
        if (objIsWrapped || othIsWrapped) {
          var objUnwrapped = objIsWrapped ? object2.value() : object2, othUnwrapped = othIsWrapped ? other.value() : other;
          stack || (stack = new Stack());
          return equalFunc(objUnwrapped, othUnwrapped, customizer, bitmask, stack);
        }
      }
      if (!isSameTag) {
        return false;
      }
      stack || (stack = new Stack());
      return equalObjects(object2, other, equalFunc, customizer, bitmask, stack);
    }
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) || isHostObject(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }
    function baseIsTypedArray(value) {
      return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objectToString.call(value)];
    }
    function baseKeys(object2) {
      if (!isPrototype(object2)) {
        return nativeKeys(object2);
      }
      var result = [];
      for (var key in Object(object2)) {
        if (hasOwnProperty2.call(object2, key) && key != "constructor") {
          result.push(key);
        }
      }
      return result;
    }
    function equalArrays(array2, other, equalFunc, customizer, bitmask, stack) {
      var isPartial = bitmask & PARTIAL_COMPARE_FLAG, arrLength = array2.length, othLength = other.length;
      if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
      }
      var stacked = stack.get(array2);
      if (stacked && stack.get(other)) {
        return stacked == other;
      }
      var index2 = -1, result = true, seen = bitmask & UNORDERED_COMPARE_FLAG ? new SetCache() : void 0;
      stack.set(array2, other);
      stack.set(other, array2);
      while (++index2 < arrLength) {
        var arrValue = array2[index2], othValue = other[index2];
        if (customizer) {
          var compared = isPartial ? customizer(othValue, arrValue, index2, other, array2, stack) : customizer(arrValue, othValue, index2, array2, other, stack);
        }
        if (compared !== void 0) {
          if (compared) {
            continue;
          }
          result = false;
          break;
        }
        if (seen) {
          if (!arraySome(other, function(othValue2, othIndex) {
            if (!seen.has(othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, customizer, bitmask, stack))) {
              return seen.add(othIndex);
            }
          })) {
            result = false;
            break;
          }
        } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, bitmask, stack))) {
          result = false;
          break;
        }
      }
      stack["delete"](array2);
      stack["delete"](other);
      return result;
    }
    function equalByTag(object2, other, tag, equalFunc, customizer, bitmask, stack) {
      switch (tag) {
        case dataViewTag:
          if (object2.byteLength != other.byteLength || object2.byteOffset != other.byteOffset) {
            return false;
          }
          object2 = object2.buffer;
          other = other.buffer;
        case arrayBufferTag:
          if (object2.byteLength != other.byteLength || !equalFunc(new Uint8Array2(object2), new Uint8Array2(other))) {
            return false;
          }
          return true;
        case boolTag:
        case dateTag:
        case numberTag:
          return eq(+object2, +other);
        case errorTag:
          return object2.name == other.name && object2.message == other.message;
        case regexpTag:
        case stringTag:
          return object2 == other + "";
        case mapTag:
          var convert = mapToArray;
        case setTag:
          var isPartial = bitmask & PARTIAL_COMPARE_FLAG;
          convert || (convert = setToArray);
          if (object2.size != other.size && !isPartial) {
            return false;
          }
          var stacked = stack.get(object2);
          if (stacked) {
            return stacked == other;
          }
          bitmask |= UNORDERED_COMPARE_FLAG;
          stack.set(object2, other);
          var result = equalArrays(convert(object2), convert(other), equalFunc, customizer, bitmask, stack);
          stack["delete"](object2);
          return result;
        case symbolTag:
          if (symbolValueOf) {
            return symbolValueOf.call(object2) == symbolValueOf.call(other);
          }
      }
      return false;
    }
    function equalObjects(object2, other, equalFunc, customizer, bitmask, stack) {
      var isPartial = bitmask & PARTIAL_COMPARE_FLAG, objProps = keys(object2), objLength = objProps.length, othProps = keys(other), othLength = othProps.length;
      if (objLength != othLength && !isPartial) {
        return false;
      }
      var index2 = objLength;
      while (index2--) {
        var key = objProps[index2];
        if (!(isPartial ? key in other : hasOwnProperty2.call(other, key))) {
          return false;
        }
      }
      var stacked = stack.get(object2);
      if (stacked && stack.get(other)) {
        return stacked == other;
      }
      var result = true;
      stack.set(object2, other);
      stack.set(other, object2);
      var skipCtor = isPartial;
      while (++index2 < objLength) {
        key = objProps[index2];
        var objValue = object2[key], othValue = other[key];
        if (customizer) {
          var compared = isPartial ? customizer(othValue, objValue, key, other, object2, stack) : customizer(objValue, othValue, key, object2, other, stack);
        }
        if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, customizer, bitmask, stack) : compared)) {
          result = false;
          break;
        }
        skipCtor || (skipCtor = key == "constructor");
      }
      if (result && !skipCtor) {
        var objCtor = object2.constructor, othCtor = other.constructor;
        if (objCtor != othCtor && ("constructor" in object2 && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
          result = false;
        }
      }
      stack["delete"](object2);
      stack["delete"](other);
      return result;
    }
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
    }
    function getNative(object2, key) {
      var value = getValue(object2, key);
      return baseIsNative(value) ? value : void 0;
    }
    var getTag = baseGetTag;
    if (DataView2 && getTag(new DataView2(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2()) != mapTag || Promise2 && getTag(Promise2.resolve()) != promiseTag || Set2 && getTag(new Set2()) != setTag || WeakMap2 && getTag(new WeakMap2()) != weakMapTag) {
      getTag = function(value) {
        var result = objectToString.call(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : void 0;
        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString:
              return dataViewTag;
            case mapCtorString:
              return mapTag;
            case promiseCtorString:
              return promiseTag;
            case setCtorString:
              return setTag;
            case weakMapCtorString:
              return weakMapTag;
          }
        }
        return result;
      };
    }
    function isIndex(value, length) {
      length = length == null ? MAX_SAFE_INTEGER : length;
      return !!length && (typeof value == "number" || reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
    }
    function isKeyable(value) {
      var type = typeof value;
      return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
    }
    function isMasked(func) {
      return !!maskSrcKey && maskSrcKey in func;
    }
    function isPrototype(value) {
      var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
      return value === proto;
    }
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {
        }
        try {
          return func + "";
        } catch (e) {
        }
      }
      return "";
    }
    function eq(value, other) {
      return value === other || value !== value && other !== other;
    }
    function isArguments(value) {
      return isArrayLikeObject(value) && hasOwnProperty2.call(value, "callee") && (!propertyIsEnumerable.call(value, "callee") || objectToString.call(value) == argsTag);
    }
    var isArray = Array.isArray;
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }
    function isArrayLikeObject(value) {
      return isObjectLike(value) && isArrayLike(value);
    }
    function isEqualWith2(value, other, customizer) {
      customizer = typeof customizer == "function" ? customizer : void 0;
      var result = customizer ? customizer(value, other) : void 0;
      return result === void 0 ? baseIsEqual(value, other, customizer) : !!result;
    }
    function isFunction(value) {
      var tag = isObject(value) ? objectToString.call(value) : "";
      return tag == funcTag || tag == genTag;
    }
    function isLength(value) {
      return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
    function keys(object2) {
      return isArrayLike(object2) ? arrayLikeKeys(object2) : baseKeys(object2);
    }
    module2.exports = isEqualWith2;
  }
});

// node_modules/lodash.throttle/index.js
var require_lodash3 = __commonJS({
  "node_modules/lodash.throttle/index.js"(exports2, module2) {
    var FUNC_ERROR_TEXT = "Expected a function";
    var NAN = 0 / 0;
    var symbolTag = "[object Symbol]";
    var reTrim = /^\s+|\s+$/g;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsOctal = /^0o[0-7]+$/i;
    var freeParseInt = parseInt;
    var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    var nativeMax = Math.max;
    var nativeMin = Math.min;
    var now = function() {
      return root.Date.now();
    };
    function debounce2(func, wait, options) {
      var lastArgs, lastThis, maxWait, result, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
      if (typeof func != "function") {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = toNumber(wait) || 0;
      if (isObject(options)) {
        leading = !!options.leading;
        maxing = "maxWait" in options;
        maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
        trailing = "trailing" in options ? !!options.trailing : trailing;
      }
      function invokeFunc(time) {
        var args = lastArgs, thisArg = lastThis;
        lastArgs = lastThis = void 0;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
      }
      function leadingEdge(time) {
        lastInvokeTime = time;
        timerId = setTimeout(timerExpired, wait);
        return leading ? invokeFunc(time) : result;
      }
      function remainingWait(time) {
        var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime, result2 = wait - timeSinceLastCall;
        return maxing ? nativeMin(result2, maxWait - timeSinceLastInvoke) : result2;
      }
      function shouldInvoke(time) {
        var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime;
        return lastCallTime === void 0 || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
      }
      function timerExpired() {
        var time = now();
        if (shouldInvoke(time)) {
          return trailingEdge(time);
        }
        timerId = setTimeout(timerExpired, remainingWait(time));
      }
      function trailingEdge(time) {
        timerId = void 0;
        if (trailing && lastArgs) {
          return invokeFunc(time);
        }
        lastArgs = lastThis = void 0;
        return result;
      }
      function cancel() {
        if (timerId !== void 0) {
          clearTimeout(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = void 0;
      }
      function flush() {
        return timerId === void 0 ? result : trailingEdge(now());
      }
      function debounced() {
        var time = now(), isInvoking = shouldInvoke(time);
        lastArgs = arguments;
        lastThis = this;
        lastCallTime = time;
        if (isInvoking) {
          if (timerId === void 0) {
            return leadingEdge(lastCallTime);
          }
          if (maxing) {
            timerId = setTimeout(timerExpired, wait);
            return invokeFunc(lastCallTime);
          }
        }
        if (timerId === void 0) {
          timerId = setTimeout(timerExpired, wait);
        }
        return result;
      }
      debounced.cancel = cancel;
      debounced.flush = flush;
      return debounced;
    }
    function throttle(func, wait, options) {
      var leading = true, trailing = true;
      if (typeof func != "function") {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      if (isObject(options)) {
        leading = "leading" in options ? !!options.leading : leading;
        trailing = "trailing" in options ? !!options.trailing : trailing;
      }
      return debounce2(func, wait, {
        "leading": leading,
        "maxWait": wait,
        "trailing": trailing
      });
    }
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
    }
    function toNumber(value) {
      if (typeof value == "number") {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == "function" ? value.valueOf() : value;
        value = isObject(other) ? other + "" : other;
      }
      if (typeof value != "string") {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, "");
      var isBinary = reIsBinary.test(value);
      return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
    }
    module2.exports = throttle;
  }
});

// node_modules/lodash.uniq/index.js
var require_lodash4 = __commonJS({
  "node_modules/lodash.uniq/index.js"(exports2, module2) {
    var LARGE_ARRAY_SIZE = 200;
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    var INFINITY = 1 / 0;
    var funcTag = "[object Function]";
    var genTag = "[object GeneratorFunction]";
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
    var reIsHostCtor = /^\[object .+?Constructor\]$/;
    var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    function arrayIncludes(array2, value) {
      var length = array2 ? array2.length : 0;
      return !!length && baseIndexOf(array2, value, 0) > -1;
    }
    function arrayIncludesWith(array2, value, comparator) {
      var index2 = -1, length = array2 ? array2.length : 0;
      while (++index2 < length) {
        if (comparator(value, array2[index2])) {
          return true;
        }
      }
      return false;
    }
    function baseFindIndex(array2, predicate, fromIndex, fromRight) {
      var length = array2.length, index2 = fromIndex + (fromRight ? 1 : -1);
      while (fromRight ? index2-- : ++index2 < length) {
        if (predicate(array2[index2], index2, array2)) {
          return index2;
        }
      }
      return -1;
    }
    function baseIndexOf(array2, value, fromIndex) {
      if (value !== value) {
        return baseFindIndex(array2, baseIsNaN, fromIndex);
      }
      var index2 = fromIndex - 1, length = array2.length;
      while (++index2 < length) {
        if (array2[index2] === value) {
          return index2;
        }
      }
      return -1;
    }
    function baseIsNaN(value) {
      return value !== value;
    }
    function cacheHas(cache, key) {
      return cache.has(key);
    }
    function getValue(object2, key) {
      return object2 == null ? void 0 : object2[key];
    }
    function isHostObject(value) {
      var result = false;
      if (value != null && typeof value.toString != "function") {
        try {
          result = !!(value + "");
        } catch (e) {
        }
      }
      return result;
    }
    function setToArray(set) {
      var index2 = -1, result = Array(set.size);
      set.forEach(function(value) {
        result[++index2] = value;
      });
      return result;
    }
    var arrayProto = Array.prototype;
    var funcProto = Function.prototype;
    var objectProto = Object.prototype;
    var coreJsData = root["__core-js_shared__"];
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
      return uid ? "Symbol(src)_1." + uid : "";
    })();
    var funcToString = funcProto.toString;
    var hasOwnProperty2 = objectProto.hasOwnProperty;
    var objectToString = objectProto.toString;
    var reIsNative = RegExp(
      "^" + funcToString.call(hasOwnProperty2).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    );
    var splice = arrayProto.splice;
    var Map2 = getNative(root, "Map");
    var Set2 = getNative(root, "Set");
    var nativeCreate = getNative(Object, "create");
    function Hash(entries) {
      var index2 = -1, length = entries ? entries.length : 0;
      this.clear();
      while (++index2 < length) {
        var entry2 = entries[index2];
        this.set(entry2[0], entry2[1]);
      }
    }
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
    }
    function hashDelete(key) {
      return this.has(key) && delete this.__data__[key];
    }
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? void 0 : result;
      }
      return hasOwnProperty2.call(data, key) ? data[key] : void 0;
    }
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate ? data[key] !== void 0 : hasOwnProperty2.call(data, key);
    }
    function hashSet(key, value) {
      var data = this.__data__;
      data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
      return this;
    }
    Hash.prototype.clear = hashClear;
    Hash.prototype["delete"] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;
    function ListCache(entries) {
      var index2 = -1, length = entries ? entries.length : 0;
      this.clear();
      while (++index2 < length) {
        var entry2 = entries[index2];
        this.set(entry2[0], entry2[1]);
      }
    }
    function listCacheClear() {
      this.__data__ = [];
    }
    function listCacheDelete(key) {
      var data = this.__data__, index2 = assocIndexOf(data, key);
      if (index2 < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index2 == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index2, 1);
      }
      return true;
    }
    function listCacheGet(key) {
      var data = this.__data__, index2 = assocIndexOf(data, key);
      return index2 < 0 ? void 0 : data[index2][1];
    }
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }
    function listCacheSet(key, value) {
      var data = this.__data__, index2 = assocIndexOf(data, key);
      if (index2 < 0) {
        data.push([key, value]);
      } else {
        data[index2][1] = value;
      }
      return this;
    }
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype["delete"] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;
    function MapCache(entries) {
      var index2 = -1, length = entries ? entries.length : 0;
      this.clear();
      while (++index2 < length) {
        var entry2 = entries[index2];
        this.set(entry2[0], entry2[1]);
      }
    }
    function mapCacheClear() {
      this.__data__ = {
        "hash": new Hash(),
        "map": new (Map2 || ListCache)(),
        "string": new Hash()
      };
    }
    function mapCacheDelete(key) {
      return getMapData(this, key)["delete"](key);
    }
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }
    function mapCacheSet(key, value) {
      getMapData(this, key).set(key, value);
      return this;
    }
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype["delete"] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;
    function SetCache(values) {
      var index2 = -1, length = values ? values.length : 0;
      this.__data__ = new MapCache();
      while (++index2 < length) {
        this.add(values[index2]);
      }
    }
    function setCacheAdd(value) {
      this.__data__.set(value, HASH_UNDEFINED);
      return this;
    }
    function setCacheHas(value) {
      return this.__data__.has(value);
    }
    SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
    SetCache.prototype.has = setCacheHas;
    function assocIndexOf(array2, key) {
      var length = array2.length;
      while (length--) {
        if (eq(array2[length][0], key)) {
          return length;
        }
      }
      return -1;
    }
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) || isHostObject(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }
    function baseUniq(array2, iteratee, comparator) {
      var index2 = -1, includes = arrayIncludes, length = array2.length, isCommon = true, result = [], seen = result;
      if (comparator) {
        isCommon = false;
        includes = arrayIncludesWith;
      } else if (length >= LARGE_ARRAY_SIZE) {
        var set = iteratee ? null : createSet(array2);
        if (set) {
          return setToArray(set);
        }
        isCommon = false;
        includes = cacheHas;
        seen = new SetCache();
      } else {
        seen = iteratee ? [] : result;
      }
      outer:
        while (++index2 < length) {
          var value = array2[index2], computed2 = iteratee ? iteratee(value) : value;
          value = comparator || value !== 0 ? value : 0;
          if (isCommon && computed2 === computed2) {
            var seenIndex = seen.length;
            while (seenIndex--) {
              if (seen[seenIndex] === computed2) {
                continue outer;
              }
            }
            if (iteratee) {
              seen.push(computed2);
            }
            result.push(value);
          } else if (!includes(seen, computed2, comparator)) {
            if (seen !== result) {
              seen.push(computed2);
            }
            result.push(value);
          }
        }
      return result;
    }
    var createSet = !(Set2 && 1 / setToArray(new Set2([, -0]))[1] == INFINITY) ? noop2 : function(values) {
      return new Set2(values);
    };
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
    }
    function getNative(object2, key) {
      var value = getValue(object2, key);
      return baseIsNative(value) ? value : void 0;
    }
    function isKeyable(value) {
      var type = typeof value;
      return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
    }
    function isMasked(func) {
      return !!maskSrcKey && maskSrcKey in func;
    }
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {
        }
        try {
          return func + "";
        } catch (e) {
        }
      }
      return "";
    }
    function uniq(array2) {
      return array2 && array2.length ? baseUniq(array2) : [];
    }
    function eq(value, other) {
      return value === other || value !== value && other !== other;
    }
    function isFunction(value) {
      var tag = isObject(value) ? objectToString.call(value) : "";
      return tag == funcTag || tag == genTag;
    }
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == "object" || type == "function");
    }
    function noop2() {
    }
    module2.exports = uniq;
  }
});

// server.js
var import_node_http = __toESM(require("node:http"), 1);
var import_node_fs3 = __toESM(require("node:fs"), 1);
var import_node_path4 = __toESM(require("node:path"), 1);
var import_node_url = require("node:url");

// node_modules/ws/wrapper.mjs
var import_stream = __toESM(require_stream(), 1);
var import_extension = __toESM(require_extension(), 1);
var import_permessage_deflate = __toESM(require_permessage_deflate(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_subprotocol = __toESM(require_subprotocol(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);

// node_modules/@tldraw/utils/dist-esm/lib/version.mjs
var TLDRAW_LIBRARY_VERSION_KEY = "__TLDRAW_LIBRARY_VERSIONS__";
function getLibraryVersions() {
  if (globalThis[TLDRAW_LIBRARY_VERSION_KEY]) {
    return globalThis[TLDRAW_LIBRARY_VERSION_KEY];
  }
  const info = {
    versions: [],
    didWarn: false,
    scheduledNotice: null
  };
  Object.defineProperty(globalThis, TLDRAW_LIBRARY_VERSION_KEY, {
    value: info,
    writable: false,
    configurable: false,
    enumerable: false
  });
  return info;
}
function registerTldrawLibraryVersion(name, version, modules) {
  if (!name || !version || !modules) {
    if (true) {
      throw new Error("Missing name/version/module system in built version of tldraw library");
    }
    return;
  }
  const info = getLibraryVersions();
  if (isNextjsDev()) {
    const isDuplicate = info.versions.some(
      (v) => v.name === name && v.version === version && v.modules === modules
    );
    if (isDuplicate) return;
  }
  info.versions.push({ name, version, modules });
  if (!info.scheduledNotice) {
    try {
      info.scheduledNotice = setTimeout(() => {
        info.scheduledNotice = null;
        checkLibraryVersions(info);
      }, 100);
    } catch {
      checkLibraryVersions(info);
    }
  }
}
function checkLibraryVersions(info) {
  if (!info.versions.length) return;
  if (info.didWarn) return;
  const sorted = info.versions.sort((a, b) => compareVersions(a.version, b.version));
  const latestVersion = sorted[sorted.length - 1].version;
  const matchingVersions = /* @__PURE__ */ new Set();
  const nonMatchingVersions = /* @__PURE__ */ new Map();
  for (const lib of sorted) {
    if (nonMatchingVersions.has(lib.name)) {
      matchingVersions.delete(lib.name);
      entry(nonMatchingVersions, lib.name, /* @__PURE__ */ new Set()).add(lib.version);
      continue;
    }
    if (lib.version === latestVersion) {
      matchingVersions.add(lib.name);
    } else {
      matchingVersions.delete(lib.name);
      entry(nonMatchingVersions, lib.name, /* @__PURE__ */ new Set()).add(lib.version);
    }
  }
  if (nonMatchingVersions.size > 0) {
    const message = [
      `${format("[tldraw]", ["bold", "bgRed", "textWhite"])} ${format("You have multiple versions of tldraw libraries installed. This can lead to bugs and unexpected behavior.", ["textRed", "bold"])}`,
      "",
      `The latest version you have installed is ${format(`v${latestVersion}`, ["bold", "textBlue"])}. The following libraries are on the latest version:`,
      ...Array.from(matchingVersions, (name) => `  \u2022 \u2705 ${format(name, ["bold"])}`),
      "",
      `The following libraries are not on the latest version, or have multiple versions installed:`,
      ...Array.from(nonMatchingVersions, ([name, versions]) => {
        const sortedVersions = Array.from(versions).sort(compareVersions).map((v) => format(`v${v}`, v === latestVersion ? ["textGreen"] : ["textRed"]));
        return `  \u2022 \u274C ${format(name, ["bold"])} (${sortedVersions.join(", ")})`;
      })
    ];
    console.log(message.join("\n"));
    info.didWarn = true;
    return;
  }
  const potentialDuplicates = /* @__PURE__ */ new Map();
  for (const lib of sorted) {
    entry(potentialDuplicates, lib.name, { version: lib.version, modules: [] }).modules.push(
      lib.modules
    );
  }
  const duplicates = /* @__PURE__ */ new Map();
  for (const [name, lib] of potentialDuplicates) {
    if (lib.modules.length > 1) duplicates.set(name, lib);
  }
  if (duplicates.size > 0) {
    const message = [
      `${format("[tldraw]", ["bold", "bgRed", "textWhite"])} ${format("You have multiple instances of some tldraw libraries active. This can lead to bugs and unexpected behavior. ", ["textRed", "bold"])}`,
      "",
      "This usually means that your bundler is misconfigured, and is importing the same library multiple times - usually once as an ES Module, and once as a CommonJS module.",
      "",
      "The following libraries have been imported multiple times:",
      ...Array.from(duplicates, ([name, lib]) => {
        const modules = lib.modules.map((m, i) => m === "esm" ? `      ${i + 1}. ES Modules` : `      ${i + 1}. CommonJS`).join("\n");
        return `  \u2022 \u274C ${format(name, ["bold"])} v${lib.version}: 
${modules}`;
      }),
      "",
      "You should configure your bundler to only import one version of each library."
    ];
    console.log(message.join("\n"));
    info.didWarn = true;
    return;
  }
}
function compareVersions(a, b) {
  const aMatch = a.match(/^(\d+)\.(\d+)\.(\d+)(?:-(\w+))?$/);
  const bMatch = b.match(/^(\d+)\.(\d+)\.(\d+)(?:-(\w+))?$/);
  if (!aMatch || !bMatch) return a.localeCompare(b);
  if (aMatch[1] !== bMatch[1]) return Number(aMatch[1]) - Number(bMatch[1]);
  if (aMatch[2] !== bMatch[2]) return Number(aMatch[2]) - Number(bMatch[2]);
  if (aMatch[3] !== bMatch[3]) return Number(aMatch[3]) - Number(bMatch[3]);
  if (aMatch[4] && bMatch[4]) return aMatch[4].localeCompare(bMatch[4]);
  if (aMatch[4]) return 1;
  if (bMatch[4]) return -1;
  return 0;
}
var formats = {
  bold: "1",
  textBlue: "94",
  textRed: "31",
  textGreen: "32",
  bgRed: "41",
  textWhite: "97"
};
function format(value, formatters = []) {
  return `\x1B[${formatters.map((f) => formats[f]).join(";")}m${value}\x1B[m`;
}
function isNextjsDev() {
  try {
    return process.env.NODE_ENV === "development" && "__NEXT_DATA__" in globalThis;
  } catch {
    return false;
  }
}
function entry(map, key, defaultValue) {
  if (map.has(key)) {
    return map.get(key);
  }
  map.set(key, defaultValue);
  return defaultValue;
}

// node_modules/@tldraw/utils/dist-esm/index.mjs
var import_lodash2 = __toESM(require_lodash(), 1);
var import_lodash3 = __toESM(require_lodash2(), 1);
var import_lodash4 = __toESM(require_lodash3(), 1);
var import_lodash5 = __toESM(require_lodash4(), 1);

// node_modules/@tldraw/utils/dist-esm/lib/function.mjs
function omitFromStackTrace(fn) {
  const wrappedFn = (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      if (error instanceof Error && Error.captureStackTrace) {
        Error.captureStackTrace(error, wrappedFn);
      }
      throw error;
    }
  };
  return wrappedFn;
}

// node_modules/@tldraw/utils/dist-esm/lib/control.mjs
var Result = {
  /**
   * Create a successful result containing a value.
   *
   * @param value - The success value to wrap
   * @returns An OkResult containing the value
   */
  ok(value) {
    return { ok: true, value };
  },
  /**
   * Create a failed result containing an error.
   *
   * @param error - The error value to wrap
   * @returns An ErrorResult containing the error
   */
  err(error) {
    return { ok: false, error };
  },
  /**
   * Create a successful result containing an array of values.
   *
   * If any of the results are errors, the returned result will be an error containing the first error.
   *
   * @param results - The array of results to wrap
   * @returns An OkResult containing the array of values
   */
  all(results) {
    return results.every((result) => result.ok) ? Result.ok(results.map((result) => result.value)) : Result.err(results.find((result) => !result.ok)?.error);
  }
};
function exhaustiveSwitchError(value, property) {
  const debugValue = property && value && typeof value === "object" && property in value ? value[property] : value;
  throw new Error(`Unknown switch case ${debugValue}`);
}
var assert = omitFromStackTrace(
  (value, message) => {
    if (!value) {
      throw new Error(message || "Assertion Error");
    }
  }
);
var assertExists = omitFromStackTrace((value, message) => {
  if (value == null) {
    throw new Error(message ?? "value must be defined");
  }
  return value;
});

// node_modules/@tldraw/utils/dist-esm/lib/error.mjs
var annotationsByError = /* @__PURE__ */ new WeakMap();
function annotateError(error, annotations) {
  if (typeof error !== "object" || error === null) return;
  let currentAnnotations = annotationsByError.get(error);
  if (!currentAnnotations) {
    currentAnnotations = { tags: {}, extras: {} };
    annotationsByError.set(error, currentAnnotations);
  }
  if (annotations.tags) {
    currentAnnotations.tags = {
      ...currentAnnotations.tags,
      ...annotations.tags
    };
  }
  if (annotations.extras) {
    currentAnnotations.extras = {
      ...currentAnnotations.extras,
      ...annotations.extras
    };
  }
}

// node_modules/@tldraw/utils/dist-esm/lib/id.mjs
var crypto = globalThis.crypto;
var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
var POOL_SIZE_MULTIPLIER = 128;
var pool;
var poolOffset;
function fillPool(bytes) {
  if (!pool || pool.length < bytes) {
    pool = new Uint8Array(bytes * POOL_SIZE_MULTIPLIER);
    crypto.getRandomValues(pool);
    poolOffset = 0;
  } else if (poolOffset + bytes > pool.length) {
    crypto.getRandomValues(pool);
    poolOffset = 0;
  }
  poolOffset += bytes;
}
function nanoid(size = 21) {
  fillPool(size -= 0);
  let id = "";
  for (let i = poolOffset - size; i < poolOffset; i++) {
    id += urlAlphabet[pool[i] & 63];
  }
  return id;
}
var impl = nanoid;
function uniqueId(size) {
  return impl(size);
}

// node_modules/@tldraw/utils/dist-esm/lib/media/png.mjs
var TABLE = [
  0,
  1996959894,
  3993919788,
  2567524794,
  124634137,
  1886057615,
  3915621685,
  2657392035,
  249268274,
  2044508324,
  3772115230,
  2547177864,
  162941995,
  2125561021,
  3887607047,
  2428444049,
  498536548,
  1789927666,
  4089016648,
  2227061214,
  450548861,
  1843258603,
  4107580753,
  2211677639,
  325883990,
  1684777152,
  4251122042,
  2321926636,
  335633487,
  1661365465,
  4195302755,
  2366115317,
  997073096,
  1281953886,
  3579855332,
  2724688242,
  1006888145,
  1258607687,
  3524101629,
  2768942443,
  901097722,
  1119000684,
  3686517206,
  2898065728,
  853044451,
  1172266101,
  3705015759,
  2882616665,
  651767980,
  1373503546,
  3369554304,
  3218104598,
  565507253,
  1454621731,
  3485111705,
  3099436303,
  671266974,
  1594198024,
  3322730930,
  2970347812,
  795835527,
  1483230225,
  3244367275,
  3060149565,
  1994146192,
  31158534,
  2563907772,
  4023717930,
  1907459465,
  112637215,
  2680153253,
  3904427059,
  2013776290,
  251722036,
  2517215374,
  3775830040,
  2137656763,
  141376813,
  2439277719,
  3865271297,
  1802195444,
  476864866,
  2238001368,
  4066508878,
  1812370925,
  453092731,
  2181625025,
  4111451223,
  1706088902,
  314042704,
  2344532202,
  4240017532,
  1658658271,
  366619977,
  2362670323,
  4224994405,
  1303535960,
  984961486,
  2747007092,
  3569037538,
  1256170817,
  1037604311,
  2765210733,
  3554079995,
  1131014506,
  879679996,
  2909243462,
  3663771856,
  1141124467,
  855842277,
  2852801631,
  3708648649,
  1342533948,
  654459306,
  3188396048,
  3373015174,
  1466479909,
  544179635,
  3110523913,
  3462522015,
  1591671054,
  702138776,
  2966460450,
  3352799412,
  1504918807,
  783551873,
  3082640443,
  3233442989,
  3988292384,
  2596254646,
  62317068,
  1957810842,
  3939845945,
  2647816111,
  81470997,
  1943803523,
  3814918930,
  2489596804,
  225274430,
  2053790376,
  3826175755,
  2466906013,
  167816743,
  2097651377,
  4027552580,
  2265490386,
  503444072,
  1762050814,
  4150417245,
  2154129355,
  426522225,
  1852507879,
  4275313526,
  2312317920,
  282753626,
  1742555852,
  4189708143,
  2394877945,
  397917763,
  1622183637,
  3604390888,
  2714866558,
  953729732,
  1340076626,
  3518719985,
  2797360999,
  1068828381,
  1219638859,
  3624741850,
  2936675148,
  906185462,
  1090812512,
  3747672003,
  2825379669,
  829329135,
  1181335161,
  3412177804,
  3160834842,
  628085408,
  1382605366,
  3423369109,
  3138078467,
  570562233,
  1426400815,
  3317316542,
  2998733608,
  733239954,
  1555261956,
  3268935591,
  3050360625,
  752459403,
  1541320221,
  2607071920,
  3965973030,
  1969922972,
  40735498,
  2617837225,
  3943577151,
  1913087877,
  83908371,
  2512341634,
  3803740692,
  2075208622,
  213261112,
  2463272603,
  3855990285,
  2094854071,
  198958881,
  2262029012,
  4057260610,
  1759359992,
  534414190,
  2176718541,
  4139329115,
  1873836001,
  414664567,
  2282248934,
  4279200368,
  1711684554,
  285281116,
  2405801727,
  4167216745,
  1634467795,
  376229701,
  2685067896,
  3608007406,
  1308918612,
  956543938,
  2808555105,
  3495958263,
  1231636301,
  1047427035,
  2932959818,
  3654703836,
  1088359270,
  936918e3,
  2847714899,
  3736837829,
  1202900863,
  817233897,
  3183342108,
  3401237130,
  1404277552,
  615818150,
  3134207493,
  3453421203,
  1423857449,
  601450431,
  3009837614,
  3294710456,
  1567103746,
  711928724,
  3020668471,
  3272380065,
  1510334235,
  755167117
];
if (typeof Int32Array !== "undefined") {
  TABLE = new Int32Array(TABLE);
}

// node_modules/@tldraw/utils/dist-esm/lib/media/media.mjs
var DEFAULT_SUPPORTED_VECTOR_IMAGE_TYPES = Object.freeze(["image/svg+xml"]);
var DEFAULT_SUPPORTED_STATIC_IMAGE_TYPES = Object.freeze([
  "image/jpeg",
  "image/png",
  "image/webp"
]);
var DEFAULT_SUPPORTED_ANIMATED_IMAGE_TYPES = Object.freeze([
  "image/gif",
  "image/apng",
  "image/avif"
]);
var DEFAULT_SUPPORTED_IMAGE_TYPES = Object.freeze([
  ...DEFAULT_SUPPORTED_STATIC_IMAGE_TYPES,
  ...DEFAULT_SUPPORTED_VECTOR_IMAGE_TYPES,
  ...DEFAULT_SUPPORTED_ANIMATED_IMAGE_TYPES
]);
var DEFAULT_SUPPORT_VIDEO_TYPES = Object.freeze([
  "video/mp4",
  "video/webm",
  "video/quicktime"
]);
var DEFAULT_SUPPORTED_MEDIA_TYPES = Object.freeze([
  ...DEFAULT_SUPPORTED_IMAGE_TYPES,
  ...DEFAULT_SUPPORT_VIDEO_TYPES
]);
var DEFAULT_SUPPORTED_MEDIA_TYPE_LIST = DEFAULT_SUPPORTED_MEDIA_TYPES.join(",");

// node_modules/@tldraw/utils/dist-esm/lib/object.mjs
var import_lodash = __toESM(require_lodash2(), 1);
function hasOwnProperty(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
function getOwnProperty(obj, key) {
  if (!hasOwnProperty(obj, key)) {
    return void 0;
  }
  return obj[key];
}
function objectMapValues(object2) {
  return Object.values(object2);
}
function objectMapEntries(object2) {
  return Object.entries(object2);
}
function* objectMapEntriesIterable(object2) {
  for (const key in object2) {
    if (!Object.prototype.hasOwnProperty.call(object2, key)) continue;
    yield [key, object2[key]];
  }
}
function objectMapFromEntries(entries) {
  return Object.fromEntries(entries);
}
function mapObjectMapValues(object2, mapper) {
  const result = {};
  for (const key in object2) {
    if (!Object.prototype.hasOwnProperty.call(object2, key)) continue;
    result[key] = mapper(key, object2[key]);
  }
  return result;
}

// node_modules/@tldraw/utils/dist-esm/lib/perf.mjs
var PERFORMANCE_COLORS = {
  Good: "#40C057",
  Mid: "#FFC078",
  Poor: "#E03131"
};
var PERFORMANCE_PREFIX_COLOR = PERFORMANCE_COLORS.Good;

// node_modules/@tldraw/utils/dist-esm/lib/fractionalIndexing.mjs
var DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
var ZERO = DIGITS[0];
var LARGEST_DIGIT = DIGITS[DIGITS.length - 1];
var SMALLEST_INTEGER = "A" + ZERO.repeat(26);
var JITTER_BITS = 16;
function getIntegerLength(head) {
  if (head >= "a" && head <= "z") {
    return head.charCodeAt(0) - "a".charCodeAt(0) + 2;
  } else if (head >= "A" && head <= "Z") {
    return "Z".charCodeAt(0) - head.charCodeAt(0) + 2;
  }
  throw new Error("invalid order key head: " + head);
}
function getIntegerPart(key) {
  const integerPartLength = getIntegerLength(key[0]);
  if (integerPartLength > key.length) {
    throw new Error("invalid order key: " + key);
  }
  return key.slice(0, integerPartLength);
}
function digitIndex(char) {
  const code = char.charCodeAt(0);
  if (code <= 57) return code - 48;
  if (code <= 90) return code - 55;
  return code - 61;
}
function validateOrderKey(key) {
  if (key === SMALLEST_INTEGER) {
    throw new Error("invalid order key: " + key);
  }
  const i = getIntegerPart(key);
  if (key.length > i.length && key[key.length - 1] === ZERO) {
    throw new Error("invalid order key: " + key);
  }
}
function midpoint(a, b) {
  if (b != null && a >= b) {
    throw new Error(a + " >= " + b);
  }
  if (a.slice(-1) === ZERO || b && b.slice(-1) === ZERO) {
    throw new Error("trailing zero");
  }
  if (b) {
    let n = 0;
    while ((a[n] || ZERO) === b[n]) {
      n++;
    }
    if (n > 0) {
      return b.slice(0, n) + midpoint(a.slice(n), b.slice(n));
    }
  }
  const digitA = a ? digitIndex(a[0]) : 0;
  const digitB = b != null ? digitIndex(b[0]) : DIGITS.length;
  if (digitB - digitA > 1) {
    const midDigit = Math.round(0.5 * (digitA + digitB));
    return DIGITS[midDigit];
  }
  if (b && b.length > 1) {
    return b.slice(0, 1);
  }
  return DIGITS[digitA] + midpoint(a.slice(1), null);
}
function incrementInteger(x) {
  const [head, ...digs] = x.split("");
  let carry = true;
  for (let i = digs.length - 1; carry && i >= 0; i--) {
    const d = digitIndex(digs[i]) + 1;
    if (d === DIGITS.length) {
      digs[i] = ZERO;
    } else {
      digs[i] = DIGITS[d];
      carry = false;
    }
  }
  if (carry) {
    if (head === "Z") return "a" + ZERO;
    if (head === "z") return null;
    const h = String.fromCharCode(head.charCodeAt(0) + 1);
    if (h > "a") {
      digs.push(ZERO);
    } else {
      digs.pop();
    }
    return h + digs.join("");
  }
  return head + digs.join("");
}
function decrementInteger(x) {
  const [head, ...digs] = x.split("");
  let borrow = true;
  for (let i = digs.length - 1; borrow && i >= 0; i--) {
    const d = digitIndex(digs[i]) - 1;
    if (d === -1) {
      digs[i] = LARGEST_DIGIT;
    } else {
      digs[i] = DIGITS[d];
      borrow = false;
    }
  }
  if (borrow) {
    if (head === "a") return "Z" + LARGEST_DIGIT;
    if (head === "A") return null;
    const h = String.fromCharCode(head.charCodeAt(0) - 1);
    if (h < "Z") {
      digs.push(LARGEST_DIGIT);
    } else {
      digs.pop();
    }
    return h + digs.join("");
  }
  return head + digs.join("");
}
function keyBetweenUnchecked(a, b) {
  if (a != null && b != null && a >= b) {
    throw new Error(a + " >= " + b);
  }
  if (a == null) {
    if (b == null) return "a" + ZERO;
    const ib2 = getIntegerPart(b);
    const fb2 = b.slice(ib2.length);
    if (ib2 === SMALLEST_INTEGER) {
      return ib2 + midpoint("", fb2);
    }
    if (ib2 < b) return ib2;
    const res = decrementInteger(ib2);
    if (res == null) throw new Error("cannot decrement any more");
    return res;
  }
  if (b == null) {
    const ia2 = getIntegerPart(a);
    const fa2 = a.slice(ia2.length);
    const i2 = incrementInteger(ia2);
    return i2 == null ? ia2 + midpoint(fa2, null) : i2;
  }
  const ia = getIntegerPart(a);
  const fa = a.slice(ia.length);
  const ib = getIntegerPart(b);
  const fb = b.slice(ib.length);
  if (ia === ib) {
    return ia + midpoint(fa, fb);
  }
  const i = incrementInteger(ia);
  if (i == null) throw new Error("cannot increment any more");
  if (i < b) return i;
  return ia + midpoint(fa, null);
}
function nKeysBetweenUnchecked(a, b, n) {
  if (n === 0) return [];
  if (n === 1) return [keyBetweenUnchecked(a, b)];
  if (b == null) {
    let c2 = keyBetweenUnchecked(a, b);
    const result = [c2];
    for (let i = 0; i < n - 1; i++) {
      c2 = keyBetweenUnchecked(c2, b);
      result.push(c2);
    }
    return result;
  }
  if (a == null) {
    let c2 = keyBetweenUnchecked(a, b);
    const result = [c2];
    for (let i = 0; i < n - 1; i++) {
      c2 = keyBetweenUnchecked(a, c2);
      result.push(c2);
    }
    result.reverse();
    return result;
  }
  const mid = Math.floor(n / 2);
  const c = keyBetweenUnchecked(a, b);
  return [...nKeysBetweenUnchecked(a, c, mid), c, ...nKeysBetweenUnchecked(c, b, n - mid - 1)];
}
function jitterBetween(low, high) {
  let mid = keyBetweenUnchecked(low, high);
  for (let i = 0; i < JITTER_BITS; i++) {
    if (Math.random() < 0.5) {
      low = mid;
    } else {
      high = mid;
    }
    mid = keyBetweenUnchecked(low, high);
  }
  return mid;
}
function generateNJitteredKeysBetween(a, b, n) {
  if (n === 0) return [];
  if (a != null) validateOrderKey(a);
  if (b != null) validateOrderKey(b);
  const keys = nKeysBetweenUnchecked(a, b, n + 1);
  const result = new Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = jitterBetween(keys[i], keys[i + 1]);
  }
  return result;
}
function generateNKeysBetween(a, b, n) {
  if (n === 0) return [];
  if (a != null) validateOrderKey(a);
  if (b != null) validateOrderKey(b);
  return nKeysBetweenUnchecked(a, b, n);
}

// node_modules/@tldraw/utils/dist-esm/lib/reordering.mjs
var generateKeysFn = process.env.NODE_ENV === "test" ? generateNKeysBetween : generateNJitteredKeysBetween;
var ZERO_INDEX_KEY = "a0";
function validateIndexKey(index2) {
  try {
    validateOrderKey(index2);
  } catch {
    throw new Error("invalid index: " + index2);
  }
}
function getIndexAbove(below = null) {
  return generateKeysFn(below, null, 1)[0];
}
function getIndices(n, start = "a1") {
  return [start, ...generateKeysFn(start, null, n)];
}
function sortByIndex(a, b) {
  if (a.index < b.index) {
    return -1;
  } else if (a.index > b.index) {
    return 1;
  }
  return 0;
}

// node_modules/@tldraw/utils/dist-esm/lib/throttle.mjs
var isTest = () => typeof process !== "undefined" && process.env.NODE_ENV === "test" && // @ts-expect-error
!globalThis.__FORCE_RAF_IN_TESTS__;
var timingVarianceFactor = 0.9;
var getTargetTimePerFrame = (targetFps) => Math.floor(1e3 / targetFps) * timingVarianceFactor;
var FpsScheduler = class {
  targetFps;
  targetTimePerFrame;
  fpsQueue = [];
  frameRaf;
  flushRaf;
  lastFlushTime;
  constructor(targetFps = 120) {
    this.targetFps = targetFps;
    this.targetTimePerFrame = getTargetTimePerFrame(targetFps);
    this.lastFlushTime = -this.targetTimePerFrame;
  }
  updateTargetFps(targetFps) {
    if (targetFps === this.targetFps) return;
    this.targetFps = targetFps;
    this.targetTimePerFrame = getTargetTimePerFrame(targetFps);
    this.lastFlushTime = -this.targetTimePerFrame;
  }
  flush() {
    const queue = this.fpsQueue.splice(0, this.fpsQueue.length);
    for (const fn of queue) {
      fn();
    }
  }
  tick(isOnNextFrame = false) {
    if (this.frameRaf) return;
    const now = Date.now();
    const elapsed = now - this.lastFlushTime;
    if (elapsed < this.targetTimePerFrame) {
      this.frameRaf = requestAnimationFrame(() => {
        this.frameRaf = void 0;
        this.tick(true);
      });
      return;
    }
    if (isOnNextFrame) {
      if (this.flushRaf) return;
      this.lastFlushTime = now;
      this.flush();
    } else {
      if (this.flushRaf) return;
      this.flushRaf = requestAnimationFrame(() => {
        this.flushRaf = void 0;
        this.lastFlushTime = Date.now();
        this.flush();
      });
    }
  }
  /**
   * Creates a throttled version of a function that executes at most once per frame.
   * The default target frame rate is set by the FpsScheduler instance.
   * Subsequent calls within the same frame are ignored, ensuring smooth performance
   * for high-frequency events like mouse movements or scroll events.
   *
   * @param fn - The function to throttle, optionally with a cancel method
   * @returns A throttled function with an optional cancel method to remove pending calls
   *
   * @public
   */
  fpsThrottle(fn) {
    if (isTest()) {
      fn.cancel = () => {
        if (this.frameRaf) {
          cancelAnimationFrame(this.frameRaf);
          this.frameRaf = void 0;
        }
        if (this.flushRaf) {
          cancelAnimationFrame(this.flushRaf);
          this.flushRaf = void 0;
        }
      };
      return fn;
    }
    const throttledFn = () => {
      if (this.fpsQueue.includes(fn)) {
        return;
      }
      this.fpsQueue.push(fn);
      this.tick();
    };
    throttledFn.cancel = () => {
      const index2 = this.fpsQueue.indexOf(fn);
      if (index2 > -1) {
        this.fpsQueue.splice(index2, 1);
      }
    };
    return throttledFn;
  }
  /**
   * Schedules a function to execute on the next animation frame.
   * If the same function is passed multiple times before the frame executes,
   * it will only be called once, effectively batching multiple calls.
   *
   * @param fn - The function to execute on the next frame
   * @returns A cancel function that can prevent execution if called before the next frame
   *
   * @public
   */
  throttleToNextFrame(fn) {
    if (isTest()) {
      fn();
      return () => void 0;
    }
    if (!this.fpsQueue.includes(fn)) {
      this.fpsQueue.push(fn);
      this.tick();
    }
    return () => {
      const index2 = this.fpsQueue.indexOf(fn);
      if (index2 > -1) {
        this.fpsQueue.splice(index2, 1);
      }
    };
  }
};
var defaultScheduler = new FpsScheduler(120);

// node_modules/@tldraw/utils/dist-esm/lib/url.mjs
function safeParseUrl(url, baseUrl) {
  try {
    return new URL(url, baseUrl);
  } catch {
    return;
  }
}

// node_modules/@tldraw/utils/dist-esm/lib/value.mjs
function getStructuredClone() {
  if (typeof globalThis !== "undefined" && globalThis.structuredClone) {
    return [globalThis.structuredClone, true];
  }
  if (typeof global !== "undefined" && global.structuredClone) {
    return [global.structuredClone, true];
  }
  if (typeof window !== "undefined" && window.structuredClone) {
    return [window.structuredClone, true];
  }
  return [(i) => i ? JSON.parse(JSON.stringify(i)) : i, false];
}
var _structuredClone = getStructuredClone();
var structuredClone = _structuredClone[0];
var isNativeStructuredClone = _structuredClone[1];
var STRUCTURED_CLONE_OBJECT_PROTOTYPE = Object.getPrototypeOf(structuredClone({}));

// node_modules/@tldraw/utils/dist-esm/index.mjs
registerTldrawLibraryVersion(
  "@tldraw/utils",
  "5.2.5",
  "esm"
);

// node_modules/@tldraw/validate/dist-esm/lib/validation.mjs
var validation_exports = {};
__export(validation_exports, {
  ArrayOfValidator: () => ArrayOfValidator,
  DictValidator: () => DictValidator,
  ObjectValidator: () => ObjectValidator,
  UnionValidator: () => UnionValidator,
  ValidationError: () => ValidationError,
  Validator: () => Validator,
  any: () => any,
  array: () => array,
  arrayOf: () => arrayOf,
  bigint: () => bigint,
  boolean: () => boolean,
  dict: () => dict,
  httpUrl: () => httpUrl,
  indexKey: () => indexKey,
  integer: () => integer,
  jsonDict: () => jsonDict,
  jsonValue: () => jsonValue,
  linkUrl: () => linkUrl,
  literal: () => literal,
  literalEnum: () => literalEnum,
  model: () => model,
  nonZeroFiniteNumber: () => nonZeroFiniteNumber,
  nonZeroInteger: () => nonZeroInteger,
  nonZeroNumber: () => nonZeroNumber,
  nullable: () => nullable,
  number: () => number,
  numberUnion: () => numberUnion,
  object: () => object,
  optional: () => optional,
  or: () => or,
  positiveInteger: () => positiveInteger,
  positiveNumber: () => positiveNumber,
  setEnum: () => setEnum,
  srcUrl: () => srcUrl,
  string: () => string,
  union: () => union,
  unitInterval: () => unitInterval,
  unknown: () => unknown,
  unknownObject: () => unknownObject
});
var IS_DEV = process.env.NODE_ENV !== "production";
function formatPath(path5) {
  if (!path5.length) {
    return null;
  }
  let formattedPath = "";
  for (const item of path5) {
    if (typeof item === "number") {
      formattedPath += `.${item}`;
    } else if (item.startsWith("(")) {
      if (formattedPath.endsWith(")")) {
        formattedPath = `${formattedPath.slice(0, -1)}, ${item.slice(1)}`;
      } else {
        formattedPath += item;
      }
    } else {
      formattedPath += `.${item}`;
    }
  }
  formattedPath = formattedPath.replace(/id = [^,]+, /, "").replace(/id = [^)]+/, "");
  if (formattedPath.startsWith(".")) {
    return formattedPath.slice(1);
  }
  return formattedPath;
}
var ValidationError = class extends Error {
  /**
   * Creates a new ValidationError with contextual information about where the error occurred.
   *
   * rawMessage - The raw error message without path information
   * path - Array indicating the location in the data structure where validation failed
   */
  constructor(rawMessage, path5 = []) {
    const formattedPath = formatPath(path5);
    const indentedMessage = rawMessage.split("\n").map((line, i) => i === 0 ? line : `  ${line}`).join("\n");
    super(formattedPath ? `At ${formattedPath}: ${indentedMessage}` : indentedMessage);
    this.rawMessage = rawMessage;
    this.path = path5;
  }
  rawMessage;
  path;
  name = "ValidationError";
};
function rethrowPrefixed(path5, err) {
  if (err instanceof ValidationError) {
    throw new ValidationError(err.rawMessage, [path5, ...err.path]);
  }
  throw new ValidationError(err.toString(), [path5]);
}
function typeToString(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  const type = typeof value;
  switch (type) {
    case "bigint":
    case "boolean":
    case "function":
    case "number":
    case "string":
    case "symbol":
      return `a ${type}`;
    case "object":
      return `an ${type}`;
    case "undefined":
      return "undefined";
    default:
      exhaustiveSwitchError(type);
  }
}
var Validator = class _Validator {
  /**
   * Creates a new Validator instance.
   *
   * validationFn - Function that validates and returns a value of type T
   * validateUsingKnownGoodVersionFn - Optional performance-optimized validation function
   * skipSameValueCheck - Internal flag to skip dev check for validators that transform values
   */
  constructor(validationFn, validateUsingKnownGoodVersionFn, skipSameValueCheck = false) {
    this.validationFn = validationFn;
    this.validateUsingKnownGoodVersionFn = validateUsingKnownGoodVersionFn;
    this.skipSameValueCheck = skipSameValueCheck;
  }
  validationFn;
  validateUsingKnownGoodVersionFn;
  skipSameValueCheck;
  /**
   * Validates an unknown value and returns it with the correct type. The returned value is
   * guaranteed to be referentially equal to the passed value.
   *
   * @param value - The unknown value to validate
   * @returns The validated value with type T
   * @throws ValidationError When validation fails
   * @example
   * ```ts
   * import { T } from '@tldraw/validate'
   *
   * const name = T.string.validate("Alice") // Returns "Alice" as string
   * const title = T.string.validate("") // Returns "" (empty strings are valid)
   *
   * // These will throw ValidationError:
   * T.string.validate(123) // Expected string, got a number
   * T.string.validate(null) // Expected string, got null
   * T.string.validate(undefined) // Expected string, got undefined
   * ```
   */
  validate(value) {
    const validated = this.validationFn(value);
    if (IS_DEV && !this.skipSameValueCheck && !Object.is(value, validated)) {
      throw new ValidationError("Validator functions must return the same value they were passed");
    }
    return validated;
  }
  /**
   * Performance-optimized validation using a previously validated value. If the new value
   * is referentially equal to the known good value, returns the known good value immediately.
   *
   * @param knownGoodValue - A previously validated value
   * @param newValue - The new value to validate
   * @returns The validated value, potentially reusing the known good value
   * @throws ValidationError When validation fails
   * @example
   * ```ts
   * import { T } from '@tldraw/validate'
   *
   * const userValidator = T.object({
   *   name: T.string,
   *   settings: T.object({ theme: T.literalEnum('light', 'dark') })
   * })
   *
   * const user = userValidator.validate({ name: "Alice", settings: { theme: "light" } })
   *
   * // Later, with partially changed data:
   * const newData = { name: "Alice", settings: { theme: "dark" } }
   * const updated = userValidator.validateUsingKnownGoodVersion(user, newData)
   * // Only validates the changed 'theme' field for better performance
   * ```
   */
  validateUsingKnownGoodVersion(knownGoodValue, newValue) {
    if (Object.is(knownGoodValue, newValue)) {
      return knownGoodValue;
    }
    if (this.validateUsingKnownGoodVersionFn) {
      return this.validateUsingKnownGoodVersionFn(knownGoodValue, newValue);
    }
    return this.validate(newValue);
  }
  /**
   * Type guard that checks if a value is valid without throwing an error.
   *
   * @param value - The value to check
   * @returns True if the value is valid, false otherwise
   * @example
   * ```ts
   * import { T } from '@tldraw/validate'
   *
   * function processUserInput(input: unknown) {
   *   if (T.string.isValid(input)) {
   *     // input is now typed as string within this block
   *     return input.toUpperCase()
   *   }
   *   if (T.number.isValid(input)) {
   *     // input is now typed as number within this block
   *     return input.toFixed(2)
   *   }
   *   throw new Error('Expected string or number')
   * }
   * ```
   */
  isValid(value) {
    try {
      this.validate(value);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Returns a new validator that also accepts null values.
   *
   * @returns A new validator that accepts T or null
   * @example
   * ```ts
   * import { T } from '@tldraw/validate'
   *
   * const assetValidator = T.object({
   *   id: T.string,
   *   name: T.string,
   *   src: T.srcUrl.nullable(), // Can be null if not loaded yet
   *   mimeType: T.string.nullable()
   * })
   *
   * const asset = assetValidator.validate({
   *   id: "image-123",
   *   name: "photo.jpg",
   *   src: null, // Valid - asset not loaded yet
   *   mimeType: "image/jpeg"
   * })
   * ```
   */
  nullable() {
    return nullable(this);
  }
  /**
   * Returns a new validator that also accepts undefined values.
   *
   * @returns A new validator that accepts T or undefined
   * @example
   * ```ts
   * import { T } from '@tldraw/validate'
   *
   * const shapeConfigValidator = T.object({
   *   type: T.literal('rectangle'),
   *   x: T.number,
   *   y: T.number,
   *   label: T.string.optional(), // Optional property
   *   metadata: T.object({ created: T.string }).optional()
   * })
   *
   * // Both of these are valid:
   * const shape1 = shapeConfigValidator.validate({ type: 'rectangle', x: 0, y: 0 })
   * const shape2 = shapeConfigValidator.validate({
   *   type: 'rectangle', x: 0, y: 0, label: "My Shape"
   * })
   * ```
   */
  optional() {
    return optional(this);
  }
  /**
   * Creates a new validator by refining this validator with additional logic that can transform
   * the validated value to a new type.
   *
   * @param otherValidationFn - Function that transforms/validates the value to type U
   * @returns A new validator that validates to type U
   * @throws ValidationError When validation or refinement fails
   * @example
   * ```ts
   * import { T, ValidationError } from '@tldraw/validate'
   *
   * // Transform string to ensure it starts with a prefix
   * const prefixedIdValidator = T.string.refine((id) => {
   *   return id.startsWith('shape:') ? id : `shape:${id}`
   * })
   *
   * const id1 = prefixedIdValidator.validate("rectangle-123") // Returns "shape:rectangle-123"
   * const id2 = prefixedIdValidator.validate("shape:circle-456") // Returns "shape:circle-456"
   *
   * // Parse and validate JSON strings
   * const jsonValidator = T.string.refine((str) => {
   *   try {
   *     return JSON.parse(str)
   *   } catch {
   *     throw new ValidationError('Invalid JSON string')
   *   }
   * })
   * ```
   */
  refine(otherValidationFn) {
    return new _Validator(
      (value) => {
        return otherValidationFn(this.validate(value));
      },
      (knownGoodValue, newValue) => {
        const validated = this.validateUsingKnownGoodVersion(knownGoodValue, newValue);
        if (Object.is(knownGoodValue, validated)) {
          return knownGoodValue;
        }
        return otherValidationFn(validated);
      },
      true
      // skipSameValueCheck: refine is designed to transform values
    );
  }
  check(nameOrCheckFn, checkFn) {
    if (typeof nameOrCheckFn === "string") {
      return this.refine((value) => {
        try {
          checkFn(value);
        } catch (err) {
          rethrowPrefixed(`(check ${nameOrCheckFn})`, err);
        }
        return value;
      });
    } else {
      return this.refine((value) => {
        nameOrCheckFn(value);
        return value;
      });
    }
  }
};
var ArrayOfValidator = class extends Validator {
  /**
   * Creates a new ArrayOfValidator.
   *
   * itemValidator - Validator used to validate each array element
   */
  constructor(itemValidator) {
    super(
      (value) => {
        const arr = array.validate(value);
        for (let i = 0; i < arr.length; i++) {
          try {
            itemValidator.validate(arr[i]);
          } catch (err) {
            rethrowPrefixed(i, err);
          }
        }
        return arr;
      },
      (knownGoodValue, newValue) => {
        if (Object.is(knownGoodValue, newValue)) {
          return knownGoodValue;
        }
        if (!itemValidator.validateUsingKnownGoodVersion) return this.validate(newValue);
        const arr = array.validate(newValue);
        let isDifferent = knownGoodValue.length !== arr.length;
        for (let i = 0; i < arr.length; i++) {
          const item = arr[i];
          if (i >= knownGoodValue.length) {
            isDifferent = true;
            try {
              itemValidator.validate(item);
            } catch (err) {
              rethrowPrefixed(i, err);
            }
            continue;
          }
          if (Object.is(knownGoodValue[i], item)) {
            continue;
          }
          try {
            const checkedItem = itemValidator.validateUsingKnownGoodVersion(
              knownGoodValue[i],
              item
            );
            if (!Object.is(checkedItem, knownGoodValue[i])) {
              isDifferent = true;
            }
          } catch (err) {
            rethrowPrefixed(i, err);
          }
        }
        return isDifferent ? newValue : knownGoodValue;
      }
    );
    this.itemValidator = itemValidator;
  }
  itemValidator;
  /**
   * Returns a new validator that ensures the array is not empty.
   *
   * @returns A new validator that rejects empty arrays
   * @throws ValidationError When the array is empty
   * @example
   * ```ts
   * const nonEmptyStrings = T.arrayOf(T.string).nonEmpty()
   * nonEmptyStrings.validate(["hello"]) // Valid
   * nonEmptyStrings.validate([]) // Throws ValidationError
   * ```
   */
  nonEmpty() {
    return this.check((value) => {
      if (value.length === 0) {
        throw new ValidationError("Expected a non-empty array");
      }
    });
  }
  /**
   * Returns a new validator that ensures the array has more than one element.
   *
   * @returns A new validator that requires at least 2 elements
   * @throws ValidationError When the array has 1 or fewer elements
   * @example
   * ```ts
   * const multipleItems = T.arrayOf(T.string).lengthGreaterThan1()
   * multipleItems.validate(["a", "b"]) // Valid
   * multipleItems.validate(["a"]) // Throws ValidationError
   * ```
   */
  lengthGreaterThan1() {
    return this.check((value) => {
      if (value.length <= 1) {
        throw new ValidationError("Expected an array with length greater than 1");
      }
    });
  }
};
var ObjectValidator = class _ObjectValidator extends Validator {
  /**
   * Creates a new ObjectValidator.
   *
   * config - Object mapping property names to their validators
   * shouldAllowUnknownProperties - Whether to allow properties not defined in config
   */
  constructor(config, shouldAllowUnknownProperties = false) {
    const configKeys = [];
    const configValidators = [];
    for (const [key, validator] of Object.entries(config)) {
      configKeys.push(key);
      configValidators.push(validator);
    }
    super(
      (object2) => {
        if (typeof object2 !== "object" || object2 === null) {
          throw new ValidationError(`Expected object, got ${typeToString(object2)}`);
        }
        for (let i = 0; i < configKeys.length; i++) {
          const key = configKeys[i];
          try {
            configValidators[i].validate(getOwnProperty(object2, key));
          } catch (err) {
            rethrowPrefixed(key, err);
          }
        }
        if (!shouldAllowUnknownProperties) {
          for (const key in object2) {
            if (!hasOwnProperty(object2, key)) continue;
            if (!hasOwnProperty(config, key)) {
              throw new ValidationError(`Unexpected property`, [key]);
            }
          }
        }
        return object2;
      },
      (knownGoodValue, newValue) => {
        if (Object.is(knownGoodValue, newValue)) {
          return knownGoodValue;
        }
        if (typeof newValue !== "object" || newValue === null) {
          throw new ValidationError(`Expected object, got ${typeToString(newValue)}`);
        }
        let isDifferent = false;
        for (let i = 0; i < configKeys.length; i++) {
          const key = configKeys[i];
          const prev = getOwnProperty(knownGoodValue, key);
          const next = getOwnProperty(newValue, key);
          if (Object.is(prev, next)) {
            continue;
          }
          try {
            const validator = configValidators[i];
            const checked = validator.validateUsingKnownGoodVersion ? validator.validateUsingKnownGoodVersion(prev, next) : validator.validate(next);
            if (!Object.is(checked, prev)) {
              isDifferent = true;
            }
          } catch (err) {
            rethrowPrefixed(key, err);
          }
        }
        if (!shouldAllowUnknownProperties) {
          for (const key in newValue) {
            if (!hasOwnProperty(newValue, key)) continue;
            if (!hasOwnProperty(config, key)) {
              throw new ValidationError(`Unexpected property`, [key]);
            }
          }
        } else if (!isDifferent) {
          for (const key of Object.keys(newValue)) {
            if (!hasOwnProperty(config, key) && !Object.is(getOwnProperty(knownGoodValue, key), getOwnProperty(newValue, key))) {
              isDifferent = true;
              break;
            }
          }
        }
        if (!isDifferent) {
          for (const key in knownGoodValue) {
            if (!hasOwnProperty(knownGoodValue, key)) continue;
            if (!hasOwnProperty(newValue, key)) {
              isDifferent = true;
              break;
            }
          }
        }
        return isDifferent ? newValue : knownGoodValue;
      }
    );
    this.config = config;
    this.shouldAllowUnknownProperties = shouldAllowUnknownProperties;
  }
  config;
  shouldAllowUnknownProperties;
  /**
   * Returns a new validator that allows unknown properties in the validated object.
   *
   * @returns A new ObjectValidator that accepts extra properties
   * @example
   * ```ts
   * const flexibleUser = T.object({ name: T.string }).allowUnknownProperties()
   * flexibleUser.validate({ name: "Alice", extra: "allowed" }) // Valid
   * ```
   */
  allowUnknownProperties() {
    return new _ObjectValidator(this.config, true);
  }
  /**
   * Creates a new ObjectValidator by extending this validator with additional properties.
   *
   * @param extension - Object mapping new property names to their validators
   * @returns A new ObjectValidator that validates both original and extended properties
   * @example
   * ```ts
   * const baseUser = T.object({ name: T.string, age: T.number })
   * const adminUser = baseUser.extend({
   *   permissions: T.arrayOf(T.string),
   *   isAdmin: T.boolean
   * })
   * // adminUser validates: { name: string; age: number; permissions: string[]; isAdmin: boolean }
   * ```
   */
  extend(extension2) {
    return new _ObjectValidator({ ...this.config, ...extension2 });
  }
};
var UnionValidator = class _UnionValidator extends Validator {
  /**
   * Creates a new UnionValidator.
   *
   * key - The discriminator property name used to determine the variant
   * config - Object mapping variant names to their validators
   * unknownValueValidation - Function to handle unknown variants
   * useNumberKeys - Whether the discriminator uses number keys instead of strings
   */
  constructor(key, config, unknownValueValidation, useNumberKeys) {
    super(
      (input) => {
        this.expectObject(input);
        const matchingSchema = this.getMatchingSchema(input);
        if (matchingSchema === void 0) {
          return this.unknownValueValidation(input, this.getVariant(input));
        }
        try {
          return matchingSchema.validate(input);
        } catch (err) {
          rethrowPrefixed(`(${key} = ${this.getVariant(input)})`, err);
        }
      },
      (prevValue, newValue) => {
        this.expectObject(newValue);
        this.expectObject(prevValue);
        const matchingSchema = this.getMatchingSchema(newValue);
        if (matchingSchema === void 0) {
          return this.unknownValueValidation(newValue, this.getVariant(newValue));
        }
        try {
          if (getOwnProperty(prevValue, key) !== getOwnProperty(newValue, key)) {
            return matchingSchema.validate(newValue);
          }
          if (matchingSchema.validateUsingKnownGoodVersion) {
            return matchingSchema.validateUsingKnownGoodVersion(prevValue, newValue);
          } else {
            return matchingSchema.validate(newValue);
          }
        } catch (err) {
          rethrowPrefixed(`(${key} = ${this.getVariant(newValue)})`, err);
        }
      }
    );
    this.key = key;
    this.config = config;
    this.unknownValueValidation = unknownValueValidation;
    this.useNumberKeys = useNumberKeys;
  }
  key;
  config;
  unknownValueValidation;
  useNumberKeys;
  expectObject(value) {
    if (typeof value !== "object" || value === null) {
      throw new ValidationError(`Expected an object, got ${typeToString(value)}`, []);
    }
  }
  getVariant(object2) {
    return getOwnProperty(object2, this.key);
  }
  // Returns the matching schema for the object's variant, or undefined if the variant is
  // unknown. The variant itself is only needed on cold paths (unknown variants and errors),
  // so this avoids allocating a `{ matchingSchema, variant }` result per validation.
  getMatchingSchema(object2) {
    const variant = getOwnProperty(object2, this.key);
    if (!this.useNumberKeys && typeof variant !== "string") {
      throw new ValidationError(
        `Expected a string for key "${this.key}", got ${typeToString(variant)}`
      );
    } else if (this.useNumberKeys) {
      const numVariant = Number(variant);
      if (numVariant - numVariant !== 0) {
        throw new ValidationError(
          `Expected a number for key "${this.key}", got "${variant}"`
        );
      }
    }
    return hasOwnProperty(this.config, variant) ? this.config[variant] : void 0;
  }
  /**
   * Returns a new UnionValidator that can handle unknown variants using the provided function.
   *
   * @param unknownValueValidation - Function to validate/transform unknown variants
   * @returns A new UnionValidator that accepts unknown variants
   * @example
   * ```ts
   * const shapeValidator = T.union('type', { circle: circleValidator })
   *   .validateUnknownVariants((obj, variant) => {
   *     console.warn(`Unknown shape type: ${variant}`)
   *     return obj as UnknownShape
   *   })
   * ```
   */
  validateUnknownVariants(unknownValueValidation) {
    return new _UnionValidator(this.key, this.config, unknownValueValidation, this.useNumberKeys);
  }
};
var DictValidator = class extends Validator {
  /**
   * Creates a new DictValidator.
   *
   * keyValidator - Validator for object keys
   * valueValidator - Validator for object values
   */
  constructor(keyValidator, valueValidator) {
    super(
      (object2) => {
        if (typeof object2 !== "object" || object2 === null) {
          throw new ValidationError(`Expected object, got ${typeToString(object2)}`);
        }
        for (const key in object2) {
          if (!hasOwnProperty(object2, key)) continue;
          try {
            keyValidator.validate(key);
            valueValidator.validate(object2[key]);
          } catch (err) {
            rethrowPrefixed(key, err);
          }
        }
        return object2;
      },
      (knownGoodValue, newValue) => {
        if (typeof newValue !== "object" || newValue === null) {
          throw new ValidationError(`Expected object, got ${typeToString(newValue)}`);
        }
        const newObj = newValue;
        let isDifferent = false;
        let newKeyCount = 0;
        for (const key in newObj) {
          if (!hasOwnProperty(newObj, key)) continue;
          newKeyCount++;
          const next = newObj[key];
          if (!hasOwnProperty(knownGoodValue, key)) {
            isDifferent = true;
            try {
              keyValidator.validate(key);
              valueValidator.validate(next);
            } catch (err) {
              rethrowPrefixed(key, err);
            }
            continue;
          }
          const prev = knownGoodValue[key];
          if (Object.is(prev, next)) {
            continue;
          }
          try {
            const checked = valueValidator.validateUsingKnownGoodVersion ? valueValidator.validateUsingKnownGoodVersion(prev, next) : valueValidator.validate(next);
            if (!Object.is(checked, prev)) {
              isDifferent = true;
            }
          } catch (err) {
            rethrowPrefixed(key, err);
          }
        }
        if (!isDifferent) {
          let oldKeyCount = 0;
          for (const key in knownGoodValue) {
            if (hasOwnProperty(knownGoodValue, key)) {
              oldKeyCount++;
            }
          }
          if (oldKeyCount !== newKeyCount) {
            isDifferent = true;
          }
        }
        return isDifferent ? newValue : knownGoodValue;
      }
    );
    this.keyValidator = keyValidator;
    this.valueValidator = valueValidator;
  }
  keyValidator;
  valueValidator;
};
function typeofValidator(type) {
  return new Validator((value) => {
    if (typeof value !== type) {
      throw new ValidationError(`Expected ${type}, got ${typeToString(value)}`);
    }
    return value;
  });
}
var unknown = new Validator((value) => value);
var any = new Validator((value) => value);
var string = typeofValidator("string");
var number = new Validator((value) => {
  if (Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "number") {
    throw new ValidationError(`Expected number, got ${typeToString(value)}`);
  }
  if (value !== value) {
    throw new ValidationError("Expected a number, got NaN");
  }
  throw new ValidationError(`Expected a finite number, got ${value}`);
});
var positiveNumber = new Validator((value) => {
  if (Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value !== "number") {
    throw new ValidationError(`Expected number, got ${typeToString(value)}`);
  }
  if (value !== value) {
    throw new ValidationError("Expected a number, got NaN");
  }
  if (value < 0) {
    throw new ValidationError(`Expected a positive number, got ${value}`);
  }
  throw new ValidationError(`Expected a finite number, got ${value}`);
});
var nonZeroNumber = new Validator((value) => {
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value !== "number") {
    throw new ValidationError(`Expected number, got ${typeToString(value)}`);
  }
  if (value !== value) {
    throw new ValidationError("Expected a number, got NaN");
  }
  if (value <= 0) {
    throw new ValidationError(`Expected a non-zero positive number, got ${value}`);
  }
  throw new ValidationError(`Expected a finite number, got ${value}`);
});
var nonZeroFiniteNumber = new Validator((value) => {
  if (Number.isFinite(value) && value !== 0) {
    return value;
  }
  if (typeof value !== "number") {
    throw new ValidationError(`Expected number, got ${typeToString(value)}`);
  }
  if (value !== value) {
    throw new ValidationError("Expected a number, got NaN");
  }
  if (value === 0) {
    throw new ValidationError(`Expected a non-zero number, got 0`);
  }
  throw new ValidationError(`Expected a finite number, got ${value}`);
});
var unitInterval = new Validator((value) => {
  if (Number.isFinite(value) && value >= 0 && value <= 1) {
    return value;
  }
  if (typeof value !== "number") {
    throw new ValidationError(`Expected number, got ${typeToString(value)}`);
  }
  if (value !== value) {
    throw new ValidationError("Expected a number, got NaN");
  }
  throw new ValidationError(`Expected a number between 0 and 1, got ${value}`);
});
var integer = new Validator((value) => {
  if (Number.isInteger(value)) {
    return value;
  }
  if (typeof value !== "number") {
    throw new ValidationError(`Expected number, got ${typeToString(value)}`);
  }
  if (value !== value) {
    throw new ValidationError("Expected a number, got NaN");
  }
  if (value - value !== 0) {
    throw new ValidationError(`Expected a finite number, got ${value}`);
  }
  throw new ValidationError(`Expected an integer, got ${value}`);
});
var positiveInteger = new Validator((value) => {
  if (Number.isInteger(value) && value >= 0) {
    return value;
  }
  if (typeof value !== "number") {
    throw new ValidationError(`Expected number, got ${typeToString(value)}`);
  }
  if (value !== value) {
    throw new ValidationError("Expected a number, got NaN");
  }
  if (value - value !== 0) {
    throw new ValidationError(`Expected a finite number, got ${value}`);
  }
  if (value < 0) {
    throw new ValidationError(`Expected a positive integer, got ${value}`);
  }
  throw new ValidationError(`Expected an integer, got ${value}`);
});
var nonZeroInteger = new Validator((value) => {
  if (Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value !== "number") {
    throw new ValidationError(`Expected number, got ${typeToString(value)}`);
  }
  if (value !== value) {
    throw new ValidationError("Expected a number, got NaN");
  }
  if (value - value !== 0) {
    throw new ValidationError(`Expected a finite number, got ${value}`);
  }
  if (value <= 0) {
    throw new ValidationError(`Expected a non-zero positive integer, got ${value}`);
  }
  throw new ValidationError(`Expected an integer, got ${value}`);
});
var boolean = typeofValidator("boolean");
var bigint = typeofValidator("bigint");
function literal(expectedValue) {
  return new Validator((actualValue) => {
    if (actualValue !== expectedValue) {
      throw new ValidationError(`Expected ${expectedValue}, got ${JSON.stringify(actualValue)}`);
    }
    return expectedValue;
  });
}
var array = new Validator((value) => {
  if (!Array.isArray(value)) {
    throw new ValidationError(`Expected an array, got ${typeToString(value)}`);
  }
  return value;
});
function arrayOf(itemValidator) {
  return new ArrayOfValidator(itemValidator);
}
var unknownObject = new Validator((value) => {
  if (typeof value !== "object" || value === null) {
    throw new ValidationError(`Expected object, got ${typeToString(value)}`);
  }
  return value;
});
function object(config) {
  return new ObjectValidator(config);
}
function isPlainObject(value) {
  return typeof value === "object" && value !== null && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null || Object.getPrototypeOf(value) === STRUCTURED_CLONE_OBJECT_PROTOTYPE);
}
function isValidJson(value) {
  if (value === null || typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
    return true;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (!isValidJson(value[i])) return false;
    }
    return true;
  }
  if (isPlainObject(value)) {
    for (const key in value) {
      if (!hasOwnProperty(value, key)) continue;
      if (!isValidJson(value[key])) return false;
    }
    return true;
  }
  return false;
}
var jsonValue = new Validator(
  (value) => {
    if (isValidJson(value)) {
      return value;
    }
    throw new ValidationError(`Expected json serializable value, got ${typeof value}`);
  },
  (knownGoodValue, newValue) => {
    if (Array.isArray(knownGoodValue) && Array.isArray(newValue)) {
      let isDifferent = knownGoodValue.length !== newValue.length;
      for (let i = 0; i < newValue.length; i++) {
        if (i >= knownGoodValue.length) {
          isDifferent = true;
          jsonValue.validate(newValue[i]);
          continue;
        }
        const prev = knownGoodValue[i];
        const next = newValue[i];
        if (Object.is(prev, next)) {
          continue;
        }
        const checked = jsonValue.validateUsingKnownGoodVersion(prev, next);
        if (!Object.is(checked, prev)) {
          isDifferent = true;
        }
      }
      return isDifferent ? newValue : knownGoodValue;
    } else if (isPlainObject(knownGoodValue) && isPlainObject(newValue)) {
      let isDifferent = false;
      for (const key in newValue) {
        if (!hasOwnProperty(newValue, key)) continue;
        if (!hasOwnProperty(knownGoodValue, key)) {
          isDifferent = true;
          jsonValue.validate(newValue[key]);
          continue;
        }
        const prev = knownGoodValue[key];
        const next = newValue[key];
        if (Object.is(prev, next)) {
          continue;
        }
        const checked = jsonValue.validateUsingKnownGoodVersion(prev, next);
        if (!Object.is(checked, prev)) {
          isDifferent = true;
        }
      }
      if (!isDifferent) {
        for (const key in knownGoodValue) {
          if (!hasOwnProperty(knownGoodValue, key)) continue;
          if (!hasOwnProperty(newValue, key)) {
            isDifferent = true;
            break;
          }
        }
      }
      return isDifferent ? newValue : knownGoodValue;
    } else {
      return jsonValue.validate(newValue);
    }
  }
);
function jsonDict() {
  return dict(string, jsonValue);
}
function dict(keyValidator, valueValidator) {
  return new DictValidator(keyValidator, valueValidator);
}
function union(key, config) {
  return new UnionValidator(
    key,
    config,
    (_unknownValue, unknownVariant) => {
      throw new ValidationError(
        `Expected one of ${Object.keys(config).map((key2) => JSON.stringify(key2)).join(" or ")}, got ${JSON.stringify(unknownVariant)}`,
        [key]
      );
    },
    false
  );
}
function numberUnion(key, config) {
  return new UnionValidator(
    key,
    config,
    (unknownValue, unknownVariant) => {
      throw new ValidationError(
        `Expected one of ${Object.keys(config).map((key2) => JSON.stringify(key2)).join(" or ")}, got ${JSON.stringify(unknownVariant)}`,
        [key]
      );
    },
    true
  );
}
function model(name, validator) {
  return new Validator(
    (value) => {
      try {
        return validator.validate(value);
      } catch (err) {
        rethrowPrefixed(name, err);
      }
    },
    (prevValue, newValue) => {
      try {
        if (validator.validateUsingKnownGoodVersion) {
          return validator.validateUsingKnownGoodVersion(prevValue, newValue);
        } else {
          return validator.validate(newValue);
        }
      } catch (err) {
        rethrowPrefixed(name, err);
      }
    }
  );
}
function setEnum(values) {
  return new Validator((value) => {
    if (!values.has(value)) {
      const valuesString = Array.from(values, (value2) => JSON.stringify(value2)).join(" or ");
      throw new ValidationError(`Expected ${valuesString}, got ${value}`);
    }
    return value;
  });
}
function optional(validator) {
  return new Validator(
    (value) => {
      if (value === void 0) return void 0;
      return validator.validate(value);
    },
    (knownGoodValue, newValue) => {
      if (newValue === void 0) return void 0;
      if (validator.validateUsingKnownGoodVersion && knownGoodValue !== void 0) {
        return validator.validateUsingKnownGoodVersion(knownGoodValue, newValue);
      }
      return validator.validate(newValue);
    },
    // Propagate skipSameValueCheck from inner validator to allow refine wrappers
    validator instanceof Validator && validator.skipSameValueCheck
  );
}
function nullable(validator) {
  return new Validator(
    (value) => {
      if (value === null) return null;
      return validator.validate(value);
    },
    (knownGoodValue, newValue) => {
      if (newValue === null) return null;
      if (validator.validateUsingKnownGoodVersion && knownGoodValue !== null) {
        return validator.validateUsingKnownGoodVersion(knownGoodValue, newValue);
      }
      return validator.validate(newValue);
    },
    // Propagate skipSameValueCheck from inner validator to allow refine wrappers
    validator instanceof Validator && validator.skipSameValueCheck
  );
}
function literalEnum(...values) {
  return setEnum(new Set(values));
}
function parseUrl(str) {
  try {
    return new URL(str);
  } catch {
    if (str.startsWith("/") || str.startsWith("./")) {
      try {
        return new URL(str, "http://example.com");
      } catch {
        throw new ValidationError(`Expected a valid url, got ${JSON.stringify(str)}`);
      }
    }
    throw new ValidationError(`Expected a valid url, got ${JSON.stringify(str)}`);
  }
}
var validLinkProtocols = /* @__PURE__ */ new Set(["http:", "https:", "mailto:"]);
var linkUrl = string.check((value) => {
  if (value === "") return;
  const url = parseUrl(value);
  if (!validLinkProtocols.has(url.protocol.toLowerCase())) {
    throw new ValidationError(
      `Expected a valid url, got ${JSON.stringify(value)} (invalid protocol)`
    );
  }
});
var validSrcProtocols = /* @__PURE__ */ new Set(["http:", "https:", "data:", "asset:"]);
var srcUrl = string.check((value) => {
  if (value === "") return;
  const url = parseUrl(value);
  if (!validSrcProtocols.has(url.protocol.toLowerCase())) {
    throw new ValidationError(
      `Expected a valid url, got ${JSON.stringify(value)} (invalid protocol)`
    );
  }
});
var httpUrl = string.check((value) => {
  if (value === "") return;
  const url = parseUrl(value);
  if (!url.protocol.toLowerCase().match(/^https?:$/)) {
    throw new ValidationError(
      `Expected a valid url, got ${JSON.stringify(value)} (invalid protocol)`
    );
  }
});
var indexKey = string.refine((key) => {
  try {
    validateIndexKey(key);
    return key;
  } catch {
    throw new ValidationError(`Expected an index key, got ${JSON.stringify(key)}`);
  }
});
function or(v1, v2) {
  return new Validator((value) => {
    try {
      return v1.validate(value);
    } catch {
      return v2.validate(value);
    }
  });
}

// node_modules/@tldraw/validate/dist-esm/index.mjs
registerTldrawLibraryVersion(
  "@tldraw/validate",
  "5.2.5",
  "esm"
);

// uml-schema.js
var umlProps = {
  name: validation_exports.string,
  fields: validation_exports.arrayOf(validation_exports.string),
  methods: validation_exports.arrayOf(validation_exports.string),
  w: validation_exports.number,
  h: validation_exports.number,
  color: validation_exports.string
};
function umlHeight(fields = [], methods = []) {
  const rows = fields.length + methods.length;
  return 36 + rows * 20 + (methods.length ? 12 : 0) + 12;
}
function umlWidth(name = "", fields = [], methods = []) {
  const rows = [name, ...fields, ...methods];
  const maxLen = Math.max(8, ...rows.map((r) => String(r).length));
  return Math.max(180, Math.round(maxLen * 7.6) + 28);
}

// shapes.js
var COLORS = [
  "black",
  "grey",
  "light-violet",
  "violet",
  "blue",
  "light-blue",
  "yellow",
  "orange",
  "green",
  "light-green",
  "light-red",
  "red"
];
var FILLS = ["none", "semi", "solid", "pattern", "fill"];
var GEO = [
  "rectangle",
  "ellipse",
  "diamond",
  "triangle",
  "trapezoid",
  "rhombus",
  "pentagon",
  "hexagon",
  "octagon",
  "star",
  "cloud",
  "x-box",
  "check-box",
  "heart",
  "oval"
];
var SIZES = ["s", "m", "l", "xl"];
var rid = (p) => p + ":" + Math.random().toString(36).slice(2, 12);
function richText(str) {
  const text = String(str ?? "");
  if (!text) return { type: "doc", content: [{ type: "paragraph" }] };
  const content = text.split("\n").map(
    (line) => line ? { type: "paragraph", content: [{ type: "text", text: line }] } : { type: "paragraph" }
  );
  return { type: "doc", content };
}
var baseShape = (type, x, y, index2, props) => ({
  id: rid("shape"),
  typeName: "shape",
  type,
  x,
  y,
  rotation: 0,
  isLocked: false,
  opacity: 1,
  meta: {},
  parentId: "page:page",
  index: index2,
  props
});
var FONT_SIZES = { s: 18, m: 24, l: 36, xl: 44 };
var SIZE_UP = {
  s: { size: "m", scale: 1 },
  m: { size: "l", scale: 1 },
  l: { size: "xl", scale: 1 },
  xl: { size: "xl", scale: 1.5 }
};
function bumpSize(size = "m") {
  return SIZE_UP[size] || SIZE_UP.m;
}
var GEO_CHAR = 0.62;
var GEO_LINE = 1.4;
var GEO_PAD_X = 32;
var GEO_PAD_Y = 24;
function geoSizeForText(text = "", size = "m", geo = "rectangle", scale = 1, targetW = null) {
  const fs4 = (FONT_SIZES[size] || 24) * (scale || 1);
  const charW = fs4 * GEO_CHAR;
  const lines = String(text || "").split("\n");
  const maxLen = Math.max(1, ...lines.map((l) => l.length));
  const roomy = geo === "rectangle" ? 1 : 1.4;
  const w = targetW != null ? Math.max(80, targetW) : Math.round(Math.max(80, maxLen * charW + GEO_PAD_X) * roomy);
  let rows = lines.length;
  if (targetW != null) {
    const avail = Math.max(charW, w / roomy - GEO_PAD_X);
    const cpl = Math.max(1, Math.floor(avail / charW));
    rows = lines.reduce((n, l) => n + wrappedLines(l, cpl), 0);
  }
  const h = Math.round(Math.max(48, rows * fs4 * GEO_LINE + GEO_PAD_Y) * roomy);
  return { w, h };
}
function buildGeo({ text = "", x = 0, y = 0, w, geo = "rectangle", color = "black", fill = "none", dash = "draw", size = "m", index: index2 }) {
  const { size: s, scale } = bumpSize(size);
  const fit = geoSizeForText(text, s, geo, scale, w != null ? w : null);
  return baseShape("geo", x, y, index2, {
    w: w ?? fit.w,
    h: fit.h,
    geo,
    dash,
    growY: 0,
    url: "",
    scale,
    color,
    labelColor: "black",
    fill,
    size: s,
    font: "draw",
    align: "middle",
    verticalAlign: "middle",
    richText: richText(text)
  });
}
function buildText({ text = "", x = 0, y = 0, color = "black", size = "m", index: index2 }) {
  const { size: s, scale } = bumpSize(size);
  return baseShape("text", x, y, index2, {
    color,
    size: s,
    w: 8,
    font: "draw",
    textAlign: "start",
    autoSize: true,
    scale,
    richText: richText(text)
  });
}
var NOTE_SIZE = 200;
var NOTE_MAX_W = 520;
var NOTE_LABEL_FONT = { s: 18, m: 22, l: 26, xl: 32 };
var NOTE_LINE_HEIGHT = 1.35;
var NOTE_PADDING = 16;
var NOTE_CHAR = 0.62;
function wrappedLines(line, cpl) {
  if (!line) return 1;
  let lines = 1, col = 0;
  for (const word of line.split(" ")) {
    const wlen = word.length || 1;
    const need = col === 0 ? wlen : col + 1 + wlen;
    if (need <= cpl) {
      col = need;
      continue;
    }
    if (col > 0) lines++;
    if (wlen <= cpl) {
      col = wlen;
      continue;
    }
    lines += Math.ceil(wlen / cpl) - 1;
    col = wlen % cpl || cpl;
  }
  return lines;
}
function noteBox(text = "", size = "m") {
  const fontSize = NOTE_LABEL_FONT[size] || NOTE_LABEL_FONT.m;
  const charW = fontSize * NOTE_CHAR;
  const lineHeightPx = Math.round(fontSize * NOTE_LINE_HEIGHT);
  const lines = String(text || "").split("\n");
  const longest = Math.max(1, ...lines.map((l) => l.length));
  const w = Math.min(NOTE_MAX_W, Math.max(NOTE_SIZE, Math.ceil(longest * charW + NOTE_PADDING * 2)));
  const cpl = Math.max(1, Math.floor((w - NOTE_PADDING * 2) / charW));
  const rows = lines.reduce((n, l) => n + wrappedLines(l, cpl), 0);
  const labelHeight = rows * lineHeightPx + NOTE_PADDING * 2;
  return { w, growY: Math.max(0, Math.round(labelHeight - NOTE_SIZE)) };
}
function buildNote({ text = "", x = 0, y = 0, color = "yellow", size = "m", index: index2 }) {
  const { size: s, scale } = bumpSize(size);
  const box = noteBox(text, s);
  const shape = baseShape("note", x, y, index2, {
    color,
    richText: richText(text),
    size: s,
    font: "draw",
    align: "middle",
    verticalAlign: "middle",
    labelColor: "black",
    growY: box.growY,
    fontSizeAdjustment: 1,
    url: "",
    scale,
    textLastEditedBy: null
  });
  shape.meta = { w: box.w };
  return shape;
}
function buildUml({ name = "ClassName", fields = [], methods = [], x = 0, y = 0, w, h, color = "blue", index: index2 }) {
  return baseShape("uml", x, y, index2, {
    name,
    fields,
    methods,
    w: w ?? umlWidth(name, fields, methods),
    h: h ?? umlHeight(fields, methods),
    color
  });
}
function buildArrow({ text = "", color = "black", dash = "draw", size = "m", index: index2, bend = 0 }) {
  const { size: s, scale } = bumpSize(size);
  return baseShape("arrow", 0, 0, index2, {
    kind: "arc",
    elbowMidPoint: 0.5,
    dash,
    size: s,
    fill: "none",
    color,
    labelColor: "black",
    bend,
    start: { x: 0, y: 0 },
    end: { x: 2, y: 0 },
    arrowheadStart: "none",
    arrowheadEnd: "arrow",
    richText: richText(text),
    labelPosition: 0.5,
    font: "draw",
    scale
  });
}
function buildArrowBinding({ arrowId, shapeId, terminal }) {
  return {
    id: rid("binding"),
    typeName: "binding",
    type: "arrow",
    fromId: arrowId,
    toId: shapeId,
    meta: {},
    props: {
      isPrecise: false,
      isExact: false,
      normalizedAnchor: { x: 0.5, y: 0.5 },
      snap: "none",
      terminal
    }
  };
}
function nextIndex(existingIndexKeys) {
  const max = existingIndexKeys.filter(Boolean).sort().pop();
  return getIndexAbove(max || ZERO_INDEX_KEY);
}

// boards.js
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path2 = __toESM(require("node:path"), 1);

// node_modules/@tldraw/sync-core/dist-esm/lib/chunk.mjs
var MAX_CLIENT_SENT_MESSAGE_SIZE_BYTES = 1024 * 1024;
var MAX_BYTES_PER_CHAR = 4;
var MAX_SAFE_MESSAGE_SIZE = MAX_CLIENT_SENT_MESSAGE_SIZE_BYTES / MAX_BYTES_PER_CHAR;
var chunkRe = /^(\d+)_(.*)$/s;
var JsonChunkAssembler = class {
  /**
   * Current assembly state - either 'idle' or tracking chunks being received
   */
  state = "idle";
  /**
   * Processes a single message, which can be either a complete JSON object or a chunk.
   * For complete JSON objects (starting with '\{'), parses immediately.
   * For chunks (prefixed with "\{number\}_"), accumulates until all chunks received.
   *
   * @param msg - The message to process, either JSON or chunk format
   * @returns Result object with data/stringified on success, error object on failure, or null for incomplete chunks
   * 	- `\{ data: object, stringified: string \}` - Successfully parsed complete message
   * 	- `\{ error: Error \}` - Parse error or invalid chunk sequence
   * 	- `null` - Chunk received but more chunks expected
   *
   * @example
   * ```ts
   * const assembler = new JsonChunkAssembler()
   *
   * // Complete JSON message
   * const result = assembler.handleMessage('{"key": "value"}')
   * if (result && 'data' in result) {
   *   console.log(result.data) // { key: "value" }
   * }
   *
   * // Chunked message sequence
   * assembler.handleMessage('2_hel') // null - more chunks expected
   * assembler.handleMessage('1_lo ') // null - more chunks expected
   * assembler.handleMessage('0_wor') // { data: "hello wor", stringified: "hello wor" }
   * ```
   */
  handleMessage(msg) {
    if (msg.startsWith("{")) {
      const error = this.state === "idle" ? void 0 : new Error("Unexpected non-chunk message");
      this.state = "idle";
      return error ? { error } : { data: JSON.parse(msg), stringified: msg };
    } else {
      const match = chunkRe.exec(msg);
      if (!match) {
        this.state = "idle";
        return { error: new Error("Invalid chunk: " + JSON.stringify(msg.slice(0, 20) + "...")) };
      }
      const numChunksRemaining = Number(match[1]);
      const data = match[2];
      if (this.state === "idle") {
        this.state = {
          chunksReceived: [data],
          totalChunks: numChunksRemaining + 1
        };
      } else {
        this.state.chunksReceived.push(data);
        if (numChunksRemaining !== this.state.totalChunks - this.state.chunksReceived.length) {
          this.state = "idle";
          return { error: new Error(`Chunks received in wrong order`) };
        }
      }
      if (this.state.chunksReceived.length === this.state.totalChunks) {
        try {
          const stringified = this.state.chunksReceived.join("");
          const data2 = JSON.parse(stringified);
          return { data: data2, stringified };
        } catch (e) {
          return { error: e };
        } finally {
          this.state = "idle";
        }
      }
      return null;
    }
  }
};

// node_modules/@tldraw/state/dist-esm/lib/helpers.mjs
function isChild(x) {
  return x && typeof x === "object" && "parents" in x;
}
function haveParentsChanged(child) {
  for (let i = 0, n = child.parents.length; i < n; i++) {
    child.parents[i].__unsafe__getWithoutCapture(true);
    if (child.parents[i].lastChangedEpoch !== child.parentEpochs[i]) {
      return true;
    }
  }
  return false;
}
function detach(parent, child) {
  if (!parent.children.remove(child)) {
    return;
  }
  if (parent.children.isEmpty && isChild(parent)) {
    for (let i = 0, n = parent.parents.length; i < n; i++) {
      detach(parent.parents[i], parent);
    }
  }
}
function attach(parent, child) {
  if (!parent.children.add(child)) {
    return;
  }
  if (isChild(parent)) {
    for (let i = 0, n = parent.parents.length; i < n; i++) {
      attach(parent.parents[i], parent);
    }
  }
}
function equals(a, b) {
  const shallowEquals = a === b || Object.is(a, b) || Boolean(a && b && typeof a.equals === "function" && a.equals(b));
  return shallowEquals;
}
function singleton(key, init) {
  const symbol = /* @__PURE__ */ Symbol.for(`com.tldraw.state/${key}`);
  const global2 = globalThis;
  global2[symbol] ??= init();
  return global2[symbol];
}
var EMPTY_ARRAY = singleton("empty_array", () => Object.freeze([]));

// node_modules/@tldraw/state/dist-esm/lib/ArraySet.mjs
var ARRAY_SIZE_THRESHOLD = 8;
var ArraySet = class {
  arraySize = 0;
  array = Array(ARRAY_SIZE_THRESHOLD);
  set = null;
  /**
   * Get whether this ArraySet has any elements.
   *
   * @returns True if this ArraySet has any elements, false otherwise.
   */
  // eslint-disable-next-line tldraw/no-setter-getter
  get isEmpty() {
    if (this.array) {
      return this.arraySize === 0;
    }
    if (this.set) {
      return this.set.size === 0;
    }
    throw new Error("no set or array");
  }
  /**
   * Add an element to the ArraySet if it is not already present.
   *
   * @param elem - The element to add to the set
   * @returns `true` if the element was added, `false` if it was already present
   * @example
   * ```ts
   * const arraySet = new ArraySet<string>()
   *
   * console.log(arraySet.add('hello')) // true
   * console.log(arraySet.add('hello')) // false (already exists)
   * ```
   */
  add(elem) {
    if (this.array) {
      const idx = this.array.indexOf(elem);
      if (idx !== -1) {
        return false;
      }
      if (this.arraySize < ARRAY_SIZE_THRESHOLD) {
        this.array[this.arraySize] = elem;
        this.arraySize++;
        return true;
      } else {
        this.set = new Set(this.array);
        this.array = null;
        this.set.add(elem);
        return true;
      }
    }
    if (this.set) {
      if (this.set.has(elem)) {
        return false;
      }
      this.set.add(elem);
      return true;
    }
    throw new Error("no set or array");
  }
  /**
   * Remove an element from the ArraySet if it is present.
   *
   * @param elem - The element to remove from the set
   * @returns `true` if the element was removed, `false` if it was not present
   * @example
   * ```ts
   * const arraySet = new ArraySet<string>()
   * arraySet.add('hello')
   *
   * console.log(arraySet.remove('hello')) // true
   * console.log(arraySet.remove('hello')) // false (not present)
   * ```
   */
  remove(elem) {
    if (this.array) {
      const idx = this.array.indexOf(elem);
      if (idx === -1) {
        return false;
      }
      this.array[idx] = void 0;
      this.arraySize--;
      if (idx !== this.arraySize) {
        this.array[idx] = this.array[this.arraySize];
        this.array[this.arraySize] = void 0;
      }
      return true;
    }
    if (this.set) {
      if (!this.set.has(elem)) {
        return false;
      }
      this.set.delete(elem);
      return true;
    }
    throw new Error("no set or array");
  }
  /**
   * Execute a callback function for each element in the ArraySet.
   *
   * @param visitor - A function to call for each element in the set
   * @example
   * ```ts
   * const arraySet = new ArraySet<string>()
   * arraySet.add('hello')
   * arraySet.add('world')
   *
   * arraySet.visit((item) => {
   *   console.log(item) // 'hello', 'world'
   * })
   * ```
   */
  visit(visitor) {
    if (this.array) {
      for (let i = 0; i < this.arraySize; i++) {
        const elem = this.array[i];
        if (typeof elem !== "undefined") {
          visitor(elem);
        }
      }
      return;
    }
    if (this.set) {
      this.set.forEach(visitor);
      return;
    }
    throw new Error("no set or array");
  }
  /**
   * Make the ArraySet iterable, allowing it to be used in for...of loops and with spread syntax.
   *
   * @returns An iterator that yields each element in the set
   * @example
   * ```ts
   * const arraySet = new ArraySet<number>()
   * arraySet.add(1)
   * arraySet.add(2)
   *
   * for (const item of arraySet) {
   *   console.log(item) // 1, 2
   * }
   *
   * const items = [...arraySet] // [1, 2]
   * ```
   */
  *[Symbol.iterator]() {
    if (this.array) {
      for (let i = 0; i < this.arraySize; i++) {
        const elem = this.array[i];
        if (typeof elem !== "undefined") {
          yield elem;
        }
      }
    } else if (this.set) {
      yield* this.set;
    } else {
      throw new Error("no set or array");
    }
  }
  /**
   * Check whether an element is present in the ArraySet.
   *
   * @param elem - The element to check for
   * @returns `true` if the element is present, `false` otherwise
   * @example
   * ```ts
   * const arraySet = new ArraySet<string>()
   * arraySet.add('hello')
   *
   * console.log(arraySet.has('hello')) // true
   * console.log(arraySet.has('world')) // false
   * ```
   */
  has(elem) {
    if (this.array) {
      return this.array.indexOf(elem) !== -1;
    } else {
      return this.set.has(elem);
    }
  }
  /**
   * Remove all elements from the ArraySet.
   *
   * @example
   * ```ts
   * const arraySet = new ArraySet<string>()
   * arraySet.add('hello')
   * arraySet.add('world')
   *
   * arraySet.clear()
   * console.log(arraySet.size()) // 0
   * ```
   */
  clear() {
    if (this.set) {
      this.set.clear();
    } else {
      this.arraySize = 0;
      this.array = [];
    }
  }
  /**
   * Get the number of elements in the ArraySet.
   *
   * @returns The number of elements in the set
   * @example
   * ```ts
   * const arraySet = new ArraySet<string>()
   * console.log(arraySet.size()) // 0
   *
   * arraySet.add('hello')
   * console.log(arraySet.size()) // 1
   * ```
   */
  size() {
    if (this.set) {
      return this.set.size;
    } else {
      return this.arraySize;
    }
  }
};

// node_modules/@tldraw/state/dist-esm/lib/isComputed.mjs
function isComputed(value) {
  return !!(value && value.__isComputed === true);
}

// node_modules/@tldraw/state/dist-esm/lib/capture.mjs
var CaptureStackFrame = class {
  constructor(below, child) {
    this.below = below;
    this.child = child;
  }
  below;
  child;
  offset = 0;
  maybeRemoved;
};
var inst = singleton("capture", () => ({ stack: null }));
function startCapturingParents(child) {
  inst.stack = new CaptureStackFrame(inst.stack, child);
  if (child.__debug_ancestor_epochs__) {
    const previousAncestorEpochs = child.__debug_ancestor_epochs__;
    child.__debug_ancestor_epochs__ = null;
    for (const p of child.parents) {
      p.__unsafe__getWithoutCapture(true);
    }
    logChangedAncestors(child, previousAncestorEpochs);
  }
  child.parentSet.clear();
}
function stopCapturingParents() {
  const frame = inst.stack;
  inst.stack = frame.below;
  if (frame.offset < frame.child.parents.length) {
    for (let i = frame.offset; i < frame.child.parents.length; i++) {
      const maybeRemovedParent = frame.child.parents[i];
      if (!frame.child.parentSet.has(maybeRemovedParent)) {
        detach(maybeRemovedParent, frame.child);
      }
    }
    frame.child.parents.length = frame.offset;
    frame.child.parentEpochs.length = frame.offset;
  }
  if (frame.maybeRemoved) {
    for (let i = 0; i < frame.maybeRemoved.length; i++) {
      const maybeRemovedParent = frame.maybeRemoved[i];
      if (!frame.child.parentSet.has(maybeRemovedParent)) {
        detach(maybeRemovedParent, frame.child);
      }
    }
  }
  if (frame.child.__debug_ancestor_epochs__) {
    captureAncestorEpochs(frame.child, frame.child.__debug_ancestor_epochs__);
  }
}
function maybeCaptureParent(p) {
  if (inst.stack) {
    const wasCapturedAlready = inst.stack.child.parentSet.has(p);
    if (wasCapturedAlready) {
      return;
    }
    inst.stack.child.parentSet.add(p);
    if (inst.stack.child.isActivelyListening) {
      attach(p, inst.stack.child);
    }
    if (inst.stack.offset < inst.stack.child.parents.length) {
      const maybeRemovedParent = inst.stack.child.parents[inst.stack.offset];
      if (maybeRemovedParent !== p) {
        if (!inst.stack.maybeRemoved) {
          inst.stack.maybeRemoved = [maybeRemovedParent];
        } else {
          inst.stack.maybeRemoved.push(maybeRemovedParent);
        }
      }
    }
    inst.stack.child.parents[inst.stack.offset] = p;
    inst.stack.child.parentEpochs[inst.stack.offset] = p.lastChangedEpoch;
    inst.stack.offset++;
  }
}
function captureAncestorEpochs(child, ancestorEpochs) {
  for (let i = 0; i < child.parents.length; i++) {
    const parent = child.parents[i];
    const epoch = child.parentEpochs[i];
    ancestorEpochs.set(parent, epoch);
    if (isComputed(parent)) {
      captureAncestorEpochs(parent, ancestorEpochs);
    }
  }
  return ancestorEpochs;
}
function collectChangedAncestors(child, ancestorEpochs) {
  const changeTree = {};
  for (let i = 0; i < child.parents.length; i++) {
    const parent = child.parents[i];
    if (!ancestorEpochs.has(parent)) {
      continue;
    }
    const prevEpoch = ancestorEpochs.get(parent);
    const currentEpoch = parent.lastChangedEpoch;
    if (currentEpoch !== prevEpoch) {
      if (isComputed(parent)) {
        changeTree[parent.name] = collectChangedAncestors(parent, ancestorEpochs);
      } else {
        changeTree[parent.name] = null;
      }
    }
  }
  return changeTree;
}
function logChangedAncestors(child, ancestorEpochs) {
  const changeTree = collectChangedAncestors(child, ancestorEpochs);
  if (Object.keys(changeTree).length === 0) {
    console.log(`Effect(${child.name}) was executed manually.`);
    return;
  }
  let str = isComputed(child) ? `Computed(${child.name}) is recomputing because:` : `Effect(${child.name}) is executing because:`;
  function logParent(tree, indent) {
    const indentStr = "\n" + " ".repeat(indent) + "\u21B3 ";
    for (const [name, val] of Object.entries(tree)) {
      if (val) {
        str += `${indentStr}Computed(${name}) changed`;
        logParent(val, indent + 2);
      } else {
        str += `${indentStr}Atom(${name}) changed`;
      }
    }
  }
  logParent(changeTree, 1);
  console.log(str);
}

// node_modules/@tldraw/state/dist-esm/lib/types.mjs
var RESET_VALUE = /* @__PURE__ */ Symbol.for("com.tldraw.state/RESET_VALUE");

// node_modules/@tldraw/state/dist-esm/lib/HistoryBuffer.mjs
var HistoryBuffer = class {
  /**
   * Creates a new HistoryBuffer with the specified capacity.
   *
   * capacity - Maximum number of diffs to store in the buffer
   * @example
   * ```ts
   * const buffer = new HistoryBuffer<number>(10) // Store up to 10 diffs
   * ```
   */
  constructor(capacity) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }
  capacity;
  /**
   * Current write position in the circular buffer.
   * @internal
   */
  index = 0;
  /**
   * Circular buffer storing range tuples. Uses undefined to represent empty slots.
   * @internal
   */
  buffer;
  /**
   * Adds a diff entry to the history buffer, representing a change between two epochs.
   *
   * If the diff is undefined, the operation is ignored. If the diff is RESET_VALUE,
   * the entire buffer is cleared to indicate that historical tracking should restart.
   *
   * @param lastComputedEpoch - The epoch when the previous value was computed
   * @param currentEpoch - The epoch when the current value was computed
   * @param diff - The diff representing the change, or RESET_VALUE to clear history
   * @example
   * ```ts
   * const buffer = new HistoryBuffer<string>(5)
   * buffer.pushEntry(0, 1, 'added text')
   * buffer.pushEntry(1, 2, RESET_VALUE) // Clears the buffer
   * ```
   */
  pushEntry(lastComputedEpoch, currentEpoch, diff) {
    if (diff === void 0) {
      return;
    }
    if (diff === RESET_VALUE) {
      this.clear();
      return;
    }
    this.buffer[this.index] = [lastComputedEpoch, currentEpoch, diff];
    this.index = (this.index + 1) % this.capacity;
  }
  /**
   * Clears all entries from the history buffer and resets the write position.
   * This is called when a RESET_VALUE diff is encountered.
   *
   * @example
   * ```ts
   * const buffer = new HistoryBuffer<string>(5)
   * buffer.pushEntry(0, 1, 'change')
   * buffer.clear()
   * console.log(buffer.getChangesSince(0)) // RESET_VALUE
   * ```
   */
  clear() {
    this.index = 0;
    this.buffer.fill(void 0);
  }
  /**
   * Retrieves all diffs that occurred since the specified epoch.
   *
   * The method searches backwards through the circular buffer to find changes
   * that occurred after the given epoch. If insufficient history is available
   * or the requested epoch is too old, returns RESET_VALUE indicating that
   * a complete state rebuild is required.
   *
   * @param sinceEpoch - The epoch from which to retrieve changes
   * @returns Array of diffs since the epoch, or RESET_VALUE if history is insufficient
   * @example
   * ```ts
   * const buffer = new HistoryBuffer<string>(5)
   * buffer.pushEntry(0, 1, 'first')
   * buffer.pushEntry(1, 2, 'second')
   * const changes = buffer.getChangesSince(0) // ['first', 'second']
   * const recentChanges = buffer.getChangesSince(1) // ['second']
   * const tooOld = buffer.getChangesSince(-100) // RESET_VALUE
   * ```
   */
  getChangesSince(sinceEpoch) {
    const { index: index2, capacity, buffer } = this;
    for (let i = 0; i < capacity; i++) {
      const offset = (index2 - 1 + capacity - i) % capacity;
      const elem = buffer[offset];
      if (!elem) {
        return RESET_VALUE;
      }
      const [fromEpoch, toEpoch] = elem;
      if (i === 0 && sinceEpoch >= toEpoch) {
        return [];
      }
      if (fromEpoch <= sinceEpoch && sinceEpoch < toEpoch) {
        const len = i + 1;
        const result = new Array(len);
        for (let j = 0; j < len; j++) {
          result[j] = buffer[(offset + j) % capacity][2];
        }
        return result;
      }
    }
    return RESET_VALUE;
  }
};

// node_modules/@tldraw/state/dist-esm/lib/constants.mjs
var GLOBAL_START_EPOCH = -1;

// node_modules/@tldraw/state/dist-esm/lib/transactions.mjs
var Transaction = class {
  constructor(parent, isSync) {
    this.parent = parent;
    this.isSync = isSync;
  }
  parent;
  isSync;
  asyncProcessCount = 0;
  initialAtomValues = /* @__PURE__ */ new Map();
  /**
   * Get whether this transaction is a root (no parents).
   *
   * @public
   */
  // eslint-disable-next-line tldraw/no-setter-getter
  get isRoot() {
    return this.parent === null;
  }
  /**
   * Commit the transaction's changes.
   *
   * @public
   */
  commit() {
    if (inst2.globalIsReacting) {
      for (const atom2 of this.initialAtomValues.keys()) {
        traverseAtomForCleanup(atom2);
      }
    } else if (this.isRoot) {
      flushChanges(this.initialAtomValues.keys());
    } else {
      this.initialAtomValues.forEach((value, atom2) => {
        if (!this.parent.initialAtomValues.has(atom2)) {
          this.parent.initialAtomValues.set(atom2, value);
        }
      });
    }
  }
  /**
   * Abort the transaction.
   *
   * @public
   */
  abort() {
    inst2.globalEpoch++;
    this.initialAtomValues.forEach((value, atom2) => {
      atom2.set(value);
      atom2.historyBuffer?.clear();
    });
    this.commit();
  }
};
var inst2 = singleton("transactions", () => ({
  // The current epoch (global to all atoms).
  globalEpoch: GLOBAL_START_EPOCH + 1,
  // Whether any transaction is reacting.
  globalIsReacting: false,
  currentTransaction: null,
  cleanupReactors: null,
  reactionEpoch: GLOBAL_START_EPOCH + 1
}));
function getReactionEpoch() {
  return inst2.reactionEpoch;
}
function getGlobalEpoch() {
  return inst2.globalEpoch;
}
function getIsReacting() {
  return inst2.globalIsReacting;
}
var traverseReactors;
function traverseChild(child) {
  if (child.lastTraversedEpoch === inst2.globalEpoch) {
    return;
  }
  child.lastTraversedEpoch = inst2.globalEpoch;
  if ("__isEffectScheduler" in child) {
    traverseReactors.add(child);
  } else {
    ;
    child.children.visit(traverseChild);
  }
}
function traverse(reactors, child) {
  traverseReactors = reactors;
  traverseChild(child);
}
function flushChanges(atoms) {
  if (inst2.globalIsReacting) {
    throw new Error("flushChanges cannot be called during a reaction");
  }
  const outerTxn = inst2.currentTransaction;
  try {
    inst2.currentTransaction = null;
    inst2.globalIsReacting = true;
    inst2.reactionEpoch = inst2.globalEpoch;
    const reactors = /* @__PURE__ */ new Set();
    for (const atom2 of atoms) {
      atom2.children.visit((child) => traverse(reactors, child));
    }
    for (const r of reactors) {
      r.maybeScheduleEffect();
    }
    let updateDepth = 0;
    while (inst2.cleanupReactors?.size) {
      if (updateDepth++ > 1e3) {
        throw new Error("Reaction update depth limit exceeded");
      }
      const reactors2 = inst2.cleanupReactors;
      inst2.cleanupReactors = null;
      for (const r of reactors2) {
        r.maybeScheduleEffect();
      }
    }
  } finally {
    inst2.cleanupReactors = null;
    inst2.globalIsReacting = false;
    inst2.currentTransaction = outerTxn;
    traverseReactors = void 0;
  }
}
function atomDidChange(atom2, previousValue) {
  if (inst2.currentTransaction) {
    if (!inst2.currentTransaction.initialAtomValues.has(atom2)) {
      inst2.currentTransaction.initialAtomValues.set(atom2, previousValue);
    }
  } else if (inst2.globalIsReacting) {
    traverseAtomForCleanup(atom2);
  } else {
    flushChanges([atom2]);
  }
}
function traverseAtomForCleanup(atom2) {
  const rs = inst2.cleanupReactors ??= /* @__PURE__ */ new Set();
  atom2.children.visit((child) => traverse(rs, child));
}
function advanceGlobalEpoch() {
  inst2.globalEpoch++;
}
function transaction(fn) {
  const txn = new Transaction(inst2.currentTransaction, true);
  inst2.currentTransaction = txn;
  try {
    let result = void 0;
    let rollback = false;
    try {
      result = fn(() => rollback = true);
    } catch (e) {
      txn.abort();
      throw e;
    }
    if (inst2.currentTransaction !== txn) {
      throw new Error("Transaction boundaries overlap");
    }
    if (rollback) {
      txn.abort();
    } else {
      txn.commit();
    }
    return result;
  } finally {
    inst2.currentTransaction = txn.parent;
  }
}
function transact(fn) {
  if (inst2.currentTransaction) {
    return fn();
  }
  return transaction(fn);
}

// node_modules/@tldraw/state/dist-esm/lib/Atom.mjs
var __Atom__ = class {
  constructor(name, current, options) {
    this.name = name;
    this.current = current;
    this.isEqual = options?.isEqual ?? null;
    if (!options) return;
    if (options.historyLength) {
      this.historyBuffer = new HistoryBuffer(options.historyLength);
    }
    this.computeDiff = options.computeDiff;
  }
  name;
  current;
  /**
   * Custom equality function for comparing values, or null to use default equality.
   * @internal
   */
  isEqual;
  /**
   * Optional function to compute diffs between old and new values.
   * @internal
   */
  computeDiff;
  /**
   * The global epoch when this atom was last changed.
   * @internal
   */
  lastChangedEpoch = getGlobalEpoch();
  /**
   * Set of child signals that depend on this atom.
   * @internal
   */
  children = new ArraySet();
  /**
   * Optional history buffer for tracking changes over time.
   * @internal
   */
  historyBuffer;
  /**
   * Gets the current value without capturing it as a dependency in the current reactive context.
   * This is unsafe because it breaks the reactivity chain - use with caution.
   *
   * @param _ignoreErrors - Unused parameter for API compatibility
   * @returns The current value
   * @internal
   */
  __unsafe__getWithoutCapture(_ignoreErrors) {
    return this.current;
  }
  /**
   * Gets the current value of this atom. When called within a computed signal or reaction,
   * this atom will be automatically captured as a dependency.
   *
   * @returns The current value
   * @example
   * ```ts
   * const count = atom('count', 5)
   * console.log(count.get()) // 5
   * ```
   */
  get() {
    maybeCaptureParent(this);
    return this.current;
  }
  /**
   * Sets the value of this atom to the given value. If the value is the same as the current value, this is a no-op.
   *
   * @param value - The new value to set
   * @param diff - The diff to use for the update. If not provided, the diff will be computed using {@link AtomOptions.computeDiff}
   * @returns The new value
   * @example
   * ```ts
   * const count = atom('count', 0)
   * count.set(5) // count.get() is now 5
   * ```
   */
  set(value, diff) {
    if (this.isEqual?.(this.current, value) ?? equals(this.current, value)) {
      return this.current;
    }
    advanceGlobalEpoch();
    if (this.historyBuffer) {
      this.historyBuffer.pushEntry(
        this.lastChangedEpoch,
        getGlobalEpoch(),
        diff ?? this.computeDiff?.(this.current, value, this.lastChangedEpoch, getGlobalEpoch()) ?? RESET_VALUE
      );
    }
    this.lastChangedEpoch = getGlobalEpoch();
    const oldValue = this.current;
    this.current = value;
    atomDidChange(this, oldValue);
    return value;
  }
  /**
   * Updates the value of this atom using the given updater function. If the returned value is the same as the current value, this is a no-op.
   *
   * @param updater - A function that takes the current value and returns the new value
   * @returns The new value
   * @example
   * ```ts
   * const count = atom('count', 5)
   * count.update(n => n + 1) // count.get() is now 6
   * ```
   */
  update(updater) {
    return this.set(updater(this.current));
  }
  /**
   * Gets all the diffs that have occurred since the given epoch. When called within a computed
   * signal or reaction, this atom will be automatically captured as a dependency.
   *
   * @param epoch - The epoch to get changes since
   * @returns An array of diffs, or RESET_VALUE if history is insufficient
   * @internal
   */
  getDiffSince(epoch) {
    maybeCaptureParent(this);
    if (epoch >= this.lastChangedEpoch) {
      return EMPTY_ARRAY;
    }
    return this.historyBuffer?.getChangesSince(epoch) ?? RESET_VALUE;
  }
};
var _Atom = singleton("Atom", () => __Atom__);
function atom(name, initialValue, options) {
  return new _Atom(name, initialValue, options);
}

// node_modules/@tldraw/state/dist-esm/lib/Computed.mjs
var UNINITIALIZED = /* @__PURE__ */ Symbol.for("com.tldraw.state/UNINITIALIZED");
var WithDiff = singleton(
  "WithDiff",
  () => class WithDiff {
    constructor(value, diff) {
      this.value = value;
      this.diff = diff;
    }
    value;
    diff;
  }
);
var __UNSAFE__Computed = class {
  constructor(name, derive, options) {
    this.name = name;
    this.derive = derive;
    if (options?.historyLength) {
      this.historyBuffer = new HistoryBuffer(options.historyLength);
    }
    this.computeDiff = options?.computeDiff;
    this.isEqual = options?.isEqual ?? equals;
  }
  name;
  derive;
  __isComputed = true;
  lastChangedEpoch = GLOBAL_START_EPOCH;
  lastTraversedEpoch = GLOBAL_START_EPOCH;
  __debug_ancestor_epochs__ = null;
  /**
   * The epoch when the reactor was last checked.
   */
  lastCheckedEpoch = GLOBAL_START_EPOCH;
  parentSet = new ArraySet();
  parents = [];
  parentEpochs = [];
  children = new ArraySet();
  // eslint-disable-next-line tldraw/no-setter-getter
  get isActivelyListening() {
    return !this.children.isEmpty;
  }
  historyBuffer;
  // The last-computed value of this signal.
  state = UNINITIALIZED;
  // If the signal throws an error we stash it so we can rethrow it on the next get()
  error = null;
  computeDiff;
  isEqual;
  __unsafe__getWithoutCapture(ignoreErrors) {
    const isNew = this.lastChangedEpoch === GLOBAL_START_EPOCH;
    const globalEpoch = getGlobalEpoch();
    if (!isNew && (this.lastCheckedEpoch === globalEpoch || this.isActivelyListening && getIsReacting() && this.lastTraversedEpoch < getReactionEpoch() || !haveParentsChanged(this))) {
      this.lastCheckedEpoch = globalEpoch;
      if (this.error) {
        if (!ignoreErrors) {
          throw this.error.thrownValue;
        } else {
          return this.state;
        }
      } else {
        return this.state;
      }
    }
    try {
      startCapturingParents(this);
      const result = this.derive(this.state, this.lastCheckedEpoch);
      const newState = result instanceof WithDiff ? result.value : result;
      const isUninitialized2 = this.state === UNINITIALIZED;
      if (isUninitialized2 || !this.isEqual(this.state, newState)) {
        if (this.historyBuffer && !isUninitialized2) {
          const diff = result instanceof WithDiff ? result.diff : void 0;
          this.historyBuffer.pushEntry(
            this.lastChangedEpoch,
            getGlobalEpoch(),
            diff ?? this.computeDiff?.(this.state, newState, this.lastCheckedEpoch, getGlobalEpoch()) ?? RESET_VALUE
          );
        }
        this.lastChangedEpoch = getGlobalEpoch();
        this.state = newState;
      }
      this.error = null;
      this.lastCheckedEpoch = getGlobalEpoch();
      return this.state;
    } catch (e) {
      if (this.state !== UNINITIALIZED) {
        this.state = UNINITIALIZED;
        this.lastChangedEpoch = getGlobalEpoch();
      }
      this.lastCheckedEpoch = getGlobalEpoch();
      if (this.historyBuffer) {
        this.historyBuffer.clear();
      }
      this.error = { thrownValue: e };
      if (!ignoreErrors) throw e;
      return this.state;
    } finally {
      stopCapturingParents();
    }
  }
  get() {
    try {
      return this.__unsafe__getWithoutCapture();
    } finally {
      maybeCaptureParent(this);
    }
  }
  getDiffSince(epoch) {
    this.__unsafe__getWithoutCapture(true);
    maybeCaptureParent(this);
    if (epoch >= this.lastChangedEpoch) {
      return EMPTY_ARRAY;
    }
    return this.historyBuffer?.getChangesSince(epoch) ?? RESET_VALUE;
  }
};
var _Computed = singleton("Computed", () => __UNSAFE__Computed);

// node_modules/@tldraw/state/dist-esm/lib/EffectScheduler.mjs
var __EffectScheduler__ = class {
  constructor(name, runEffect, options) {
    this.name = name;
    this.runEffect = runEffect;
    this._scheduleEffect = options?.scheduleEffect;
  }
  name;
  runEffect;
  __isEffectScheduler = true;
  /** @internal */
  _isActivelyListening = false;
  /**
   * Whether this scheduler is attached and actively listening to its parents.
   * @public
   */
  // eslint-disable-next-line tldraw/no-setter-getter
  get isActivelyListening() {
    return this._isActivelyListening;
  }
  /** @internal */
  lastTraversedEpoch = GLOBAL_START_EPOCH;
  /** @internal */
  lastReactedEpoch = GLOBAL_START_EPOCH;
  /** @internal */
  _scheduleCount = 0;
  /** @internal */
  __debug_ancestor_epochs__ = null;
  /**
   * The number of times this effect has been scheduled.
   * @public
   */
  // eslint-disable-next-line tldraw/no-setter-getter
  get scheduleCount() {
    return this._scheduleCount;
  }
  /** @internal */
  parentSet = new ArraySet();
  /** @internal */
  parentEpochs = [];
  /** @internal */
  parents = [];
  /** @internal */
  _scheduleEffect;
  /** @internal */
  maybeScheduleEffect() {
    if (!this._isActivelyListening) return;
    if (this.lastReactedEpoch === getGlobalEpoch()) return;
    if (this.parents.length && !haveParentsChanged(this)) {
      this.lastReactedEpoch = getGlobalEpoch();
      return;
    }
    this.scheduleEffect();
  }
  /** @internal */
  scheduleEffect() {
    this._scheduleCount++;
    if (this._scheduleEffect) {
      this._scheduleEffect(this.maybeExecute);
    } else {
      this.execute();
    }
  }
  /** @internal */
  // eslint-disable-next-line tldraw/prefer-class-methods
  maybeExecute = () => {
    if (!this._isActivelyListening) return;
    this.execute();
  };
  /**
   * Makes this scheduler become 'actively listening' to its parents.
   * If it has been executed before it will immediately become eligible to receive 'maybeScheduleEffect' calls.
   * If it has not executed before it will need to be manually executed once to become eligible for scheduling, i.e. by calling `EffectScheduler.execute`.
   * @public
   */
  attach() {
    this._isActivelyListening = true;
    for (let i = 0, n = this.parents.length; i < n; i++) {
      attach(this.parents[i], this);
    }
  }
  /**
   * Makes this scheduler stop 'actively listening' to its parents.
   * It will no longer be eligible to receive 'maybeScheduleEffect' calls until `EffectScheduler.attach` is called again.
   * @public
   */
  detach() {
    this._isActivelyListening = false;
    for (let i = 0, n = this.parents.length; i < n; i++) {
      detach(this.parents[i], this);
    }
  }
  /**
   * Executes the effect immediately and returns the result.
   * @returns The result of the effect.
   * @public
   */
  execute() {
    try {
      startCapturingParents(this);
      const currentEpoch = getGlobalEpoch();
      const result = this.runEffect(this.lastReactedEpoch);
      this.lastReactedEpoch = currentEpoch;
      return result;
    } finally {
      stopCapturingParents();
    }
  }
};
var EffectScheduler = singleton(
  "EffectScheduler",
  () => __EffectScheduler__
);

// node_modules/@tldraw/state/dist-esm/index.mjs
var currentApiVersion = 1;
var actualApiVersion = singleton("apiVersion", () => currentApiVersion);
if (actualApiVersion !== currentApiVersion) {
  throw new Error(
    `You have multiple incompatible versions of @tldraw/state in your app. Please deduplicate the package.`
  );
}
registerTldrawLibraryVersion(
  "@tldraw/state",
  "5.2.5",
  "esm"
);

// node_modules/@tldraw/store/dist-esm/lib/ImmutableMap.mjs
function smi(i32) {
  return i32 >>> 1 & 1073741824 | i32 & 3221225471;
}
var defaultValueOf = Object.prototype.valueOf;
function hash(o) {
  if (o == null) {
    return hashNullish(o);
  }
  if (typeof o.hashCode === "function") {
    return smi(o.hashCode(o));
  }
  const v = valueOf(o);
  if (v == null) {
    return hashNullish(v);
  }
  switch (typeof v) {
    case "boolean":
      return v ? 1108378657 : 1108378656;
    case "number":
      return hashNumber(v);
    case "string":
      return cachedHashString(v);
    case "object":
    case "function":
      return hashJSObj(v);
    case "symbol":
      return hashSymbol(v);
    default:
      if (typeof v.toString === "function") {
        return hashString(v.toString());
      }
      throw new Error("Value type " + typeof v + " cannot be hashed.");
  }
}
function hashNullish(nullish) {
  return nullish === null ? 1108378658 : (
    /* undefined */
    1108378659
  );
}
function hashNumber(n) {
  if (n !== n || n === Infinity) {
    return 0;
  }
  let hash2 = n | 0;
  if (hash2 !== n) {
    hash2 ^= n * 4294967295;
  }
  while (n > 4294967295) {
    n /= 4294967295;
    hash2 ^= n;
  }
  return smi(hash2);
}
function cachedHashString(string2) {
  let hashed = stringHashCache[string2];
  if (hashed === void 0) {
    hashed = hashString(string2);
    if (stringHashCacheCount === STRING_HASH_CACHE_SIZE) {
      stringHashCacheCount = 0;
      stringHashCache = {};
    }
    stringHashCache[string2] = hashed;
    stringHashCacheCount++;
  }
  return hashed;
}
function hashString(string2) {
  let hashed = 0;
  for (let ii = 0; ii < string2.length; ii++) {
    hashed = 31 * hashed + string2.charCodeAt(ii) | 0;
  }
  return smi(hashed);
}
function hashSymbol(sym) {
  let hashed = symbolMap[sym];
  if (hashed !== void 0) {
    return hashed;
  }
  hashed = nextHash();
  symbolMap[sym] = hashed;
  return hashed;
}
function hashJSObj(obj) {
  let hashed = weakMap.get(obj);
  if (hashed !== void 0) {
    return hashed;
  }
  hashed = nextHash();
  weakMap.set(obj, hashed);
  return hashed;
}
function valueOf(obj) {
  return obj.valueOf !== defaultValueOf && typeof obj.valueOf === "function" ? obj.valueOf(obj) : obj;
}
function nextHash() {
  const nextHash2 = ++_objHashUID;
  if (_objHashUID & 1073741824) {
    _objHashUID = 0;
  }
  return nextHash2;
}
var weakMap = /* @__PURE__ */ new WeakMap();
var symbolMap = /* @__PURE__ */ Object.create(null);
var _objHashUID = 0;
var stringHashCache = {};
var stringHashCacheCount = 0;
var STRING_HASH_CACHE_SIZE = 24e3;
var SHIFT = 5;
var SIZE = 1 << SHIFT;
var MASK = SIZE - 1;
var NOT_SET = {};
function MakeRef() {
  return { value: false };
}
function SetRef(ref) {
  if (ref) {
    ref.value = true;
  }
}
function arrCopy(arr, offset = 0) {
  return arr.slice(offset);
}
var OwnerID = class {
};
var ImmutableMap = class _ImmutableMap {
  // @pragma Construction
  // @ts-ignore
  _root;
  // @ts-ignore
  size;
  // @ts-ignore
  __ownerID;
  // @ts-ignore
  __hash;
  // @ts-ignore
  __altered;
  /**
   * Creates a new ImmutableMap instance.
   *
   * @param value - An iterable of key-value pairs to populate the map, or null/undefined for an empty map
   * @example
   * ```ts
   * // Create from array of pairs
   * const map1 = new ImmutableMap([['a', 1], ['b', 2]])
   *
   * // Create empty map
   * const map2 = new ImmutableMap()
   *
   * // Create from another map
   * const map3 = new ImmutableMap(map1)
   * ```
   */
  constructor(value) {
    return value === void 0 || value === null ? emptyMap() : value instanceof _ImmutableMap ? value : emptyMap().withMutations((map) => {
      for (const [k, v] of value) {
        map.set(k, v);
      }
    });
  }
  get(k, notSetValue) {
    return this._root ? this._root.get(0, void 0, k, notSetValue) : notSetValue;
  }
  /**
   * Returns a new ImmutableMap with the specified key-value pair added or updated.
   * If the key already exists, its value is replaced. Otherwise, a new entry is created.
   *
   * @param k - The key to set
   * @param v - The value to associate with the key
   * @returns A new ImmutableMap with the key-value pair set
   * @example
   * ```ts
   * const map = new ImmutableMap([['a', 1]])
   * const updated = map.set('b', 2) // New map with both 'a' and 'b'
   * const replaced = map.set('a', 10) // New map with 'a' updated to 10
   * ```
   */
  set(k, v) {
    return updateMap(this, k, v);
  }
  /**
   * Returns a new ImmutableMap with the specified key removed.
   * If the key doesn't exist, returns the same map instance.
   *
   * @param k - The key to remove
   * @returns A new ImmutableMap with the key removed, or the same instance if key not found
   * @example
   * ```ts
   * const map = new ImmutableMap([['a', 1], ['b', 2]])
   * const smaller = map.delete('a') // New map with only 'b'
   * const same = map.delete('missing') // Returns original map
   * ```
   */
  delete(k) {
    return updateMap(this, k, NOT_SET);
  }
  /**
   * Returns a new ImmutableMap with all specified keys removed.
   * This is more efficient than calling delete() multiple times.
   *
   * @param keys - An iterable of keys to remove
   * @returns A new ImmutableMap with all specified keys removed
   * @example
   * ```ts
   * const map = new ImmutableMap([['a', 1], ['b', 2], ['c', 3]])
   * const smaller = map.deleteAll(['a', 'c']) // New map with only 'b'
   * ```
   */
  deleteAll(keys) {
    return this.withMutations((map) => {
      for (const key of keys) {
        map.delete(key);
      }
    });
  }
  __ensureOwner(ownerID) {
    if (ownerID === this.__ownerID) {
      return this;
    }
    if (!ownerID) {
      if (this.size === 0) {
        return emptyMap();
      }
      this.__ownerID = ownerID;
      this.__altered = false;
      return this;
    }
    return makeMap(this.size, this._root, ownerID, this.__hash);
  }
  /**
   * Applies multiple mutations efficiently by creating a mutable copy,
   * applying all changes, then returning an immutable result.
   * This is more efficient than chaining multiple set/delete operations.
   *
   * @param fn - Function that receives a mutable copy and applies changes
   * @returns A new ImmutableMap with all mutations applied, or the same instance if no changes
   * @example
   * ```ts
   * const map = new ImmutableMap([['a', 1]])
   * const updated = map.withMutations(mutable => {
   *   mutable.set('b', 2)
   *   mutable.set('c', 3)
   *   mutable.delete('a')
   * }) // Efficiently applies all changes at once
   * ```
   */
  withMutations(fn) {
    const mutable = this.asMutable();
    fn(mutable);
    return mutable.wasAltered() ? mutable.__ensureOwner(this.__ownerID) : this;
  }
  /**
   * Checks if this map instance has been altered during a mutation operation.
   * This is used internally to optimize mutations.
   *
   * @returns True if the map was altered, false otherwise
   * @internal
   */
  wasAltered() {
    return this.__altered;
  }
  /**
   * Returns a mutable copy of this map that can be efficiently modified.
   * Multiple changes to the mutable copy are batched together.
   *
   * @returns A mutable copy of this map
   * @internal
   */
  asMutable() {
    return this.__ownerID ? this : this.__ensureOwner(new OwnerID());
  }
  /**
   * Makes the map iterable, yielding key-value pairs.
   *
   * @returns An iterator over [key, value] pairs
   * @example
   * ```ts
   * const map = new ImmutableMap([['a', 1], ['b', 2]])
   * for (const [key, value] of map) {
   *   console.log(key, value) // 'a' 1, then 'b' 2
   * }
   * ```
   */
  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }
  /**
   * Returns an iterable of key-value pairs.
   *
   * @returns An iterable over [key, value] pairs
   * @example
   * ```ts
   * const map = new ImmutableMap([['a', 1], ['b', 2]])
   * const entries = Array.from(map.entries()) // [['a', 1], ['b', 2]]
   * ```
   */
  entries() {
    return new MapIterator(this, ITERATE_ENTRIES, false);
  }
  /**
   * Returns an iterable of keys.
   *
   * @returns An iterable over keys
   * @example
   * ```ts
   * const map = new ImmutableMap([['a', 1], ['b', 2]])
   * const keys = Array.from(map.keys()) // ['a', 'b']
   * ```
   */
  keys() {
    return new MapIterator(this, ITERATE_KEYS, false);
  }
  /**
   * Returns an iterable of values.
   *
   * @returns An iterable over values
   * @example
   * ```ts
   * const map = new ImmutableMap([['a', 1], ['b', 2]])
   * const values = Array.from(map.values()) // [1, 2]
   * ```
   */
  values() {
    return new MapIterator(this, ITERATE_VALUES, false);
  }
};
var ArrayMapNode = class _ArrayMapNode {
  constructor(ownerID, entries) {
    this.ownerID = ownerID;
    this.entries = entries;
  }
  ownerID;
  entries;
  get(_shift, _keyHash, key, notSetValue) {
    const entries = this.entries;
    for (let ii = 0, len = entries.length; ii < len; ii++) {
      if (Object.is(key, entries[ii][0])) {
        return entries[ii][1];
      }
    }
    return notSetValue;
  }
  update(ownerID, _shift, _keyHash, key, value, didChangeSize, didAlter) {
    const removed = value === NOT_SET;
    const entries = this.entries;
    let idx = 0;
    const len = entries.length;
    for (; idx < len; idx++) {
      if (Object.is(key, entries[idx][0])) {
        break;
      }
    }
    const exists = idx < len;
    if (exists ? entries[idx][1] === value : removed) {
      return this;
    }
    SetRef(didAlter);
    if (removed || !exists) SetRef(didChangeSize);
    if (removed && entries.length === 1) {
      return;
    }
    if (!exists && !removed && entries.length >= MAX_ARRAY_MAP_SIZE) {
      return createNodes(ownerID, entries, key, value);
    }
    const isEditable = ownerID && ownerID === this.ownerID;
    const newEntries = isEditable ? entries : arrCopy(entries);
    if (exists) {
      if (removed) {
        if (idx === len - 1) {
          newEntries.pop();
        } else {
          newEntries[idx] = newEntries.pop();
        }
      } else {
        newEntries[idx] = [key, value];
      }
    } else {
      newEntries.push([key, value]);
    }
    if (isEditable) {
      this.entries = newEntries;
      return this;
    }
    return new _ArrayMapNode(ownerID, newEntries);
  }
};
var BitmapIndexedNode = class _BitmapIndexedNode {
  constructor(ownerID, bitmap, nodes) {
    this.ownerID = ownerID;
    this.bitmap = bitmap;
    this.nodes = nodes;
  }
  ownerID;
  bitmap;
  nodes;
  get(shift, keyHash, key, notSetValue) {
    if (keyHash === void 0) {
      keyHash = hash(key);
    }
    const bit = 1 << ((shift === 0 ? keyHash : keyHash >>> shift) & MASK);
    const bitmap = this.bitmap;
    return (bitmap & bit) === 0 ? notSetValue : this.nodes[popCount(bitmap & bit - 1)].get(shift + SHIFT, keyHash, key, notSetValue);
  }
  update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    if (keyHash === void 0) {
      keyHash = hash(key);
    }
    const keyHashFrag = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
    const bit = 1 << keyHashFrag;
    const bitmap = this.bitmap;
    const exists = (bitmap & bit) !== 0;
    if (!exists && value === NOT_SET) {
      return this;
    }
    const idx = popCount(bitmap & bit - 1);
    const nodes = this.nodes;
    const node = exists ? nodes[idx] : void 0;
    const newNode = updateNode(
      node,
      ownerID,
      shift + SHIFT,
      keyHash,
      key,
      value,
      didChangeSize,
      didAlter
    );
    if (newNode === node) {
      return this;
    }
    if (!exists && newNode && nodes.length >= MAX_BITMAP_INDEXED_SIZE) {
      return expandNodes(ownerID, nodes, bitmap, keyHashFrag, newNode);
    }
    if (exists && !newNode && nodes.length === 2 && isLeafNode(nodes[idx ^ 1])) {
      return nodes[idx ^ 1];
    }
    if (exists && newNode && nodes.length === 1 && isLeafNode(newNode)) {
      return newNode;
    }
    const isEditable = ownerID && ownerID === this.ownerID;
    const newBitmap = exists ? newNode ? bitmap : bitmap ^ bit : bitmap | bit;
    const newNodes = exists ? newNode ? setAt(nodes, idx, newNode, isEditable) : spliceOut(nodes, idx, isEditable) : spliceIn(nodes, idx, newNode, isEditable);
    if (isEditable) {
      this.bitmap = newBitmap;
      this.nodes = newNodes;
      return this;
    }
    return new _BitmapIndexedNode(ownerID, newBitmap, newNodes);
  }
};
var HashArrayMapNode = class _HashArrayMapNode {
  constructor(ownerID, count, nodes) {
    this.ownerID = ownerID;
    this.count = count;
    this.nodes = nodes;
  }
  ownerID;
  count;
  nodes;
  get(shift, keyHash, key, notSetValue) {
    if (keyHash === void 0) {
      keyHash = hash(key);
    }
    const idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
    const node = this.nodes[idx];
    return node ? node.get(shift + SHIFT, keyHash, key, notSetValue) : notSetValue;
  }
  update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    if (keyHash === void 0) {
      keyHash = hash(key);
    }
    const idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
    const removed = value === NOT_SET;
    const nodes = this.nodes;
    const node = nodes[idx];
    if (removed && !node) {
      return this;
    }
    const newNode = updateNode(
      node,
      ownerID,
      shift + SHIFT,
      keyHash,
      key,
      value,
      didChangeSize,
      didAlter
    );
    if (newNode === node) {
      return this;
    }
    let newCount = this.count;
    if (!node) {
      newCount++;
    } else if (!newNode) {
      newCount--;
      if (newCount < MIN_HASH_ARRAY_MAP_SIZE) {
        return packNodes(ownerID, nodes, newCount, idx);
      }
    }
    const isEditable = ownerID && ownerID === this.ownerID;
    const newNodes = setAt(nodes, idx, newNode, isEditable);
    if (isEditable) {
      this.count = newCount;
      this.nodes = newNodes;
      return this;
    }
    return new _HashArrayMapNode(ownerID, newCount, newNodes);
  }
};
var HashCollisionNode = class _HashCollisionNode {
  constructor(ownerID, keyHash, entries) {
    this.ownerID = ownerID;
    this.keyHash = keyHash;
    this.entries = entries;
  }
  ownerID;
  keyHash;
  entries;
  get(shift, keyHash, key, notSetValue) {
    const entries = this.entries;
    for (let ii = 0, len = entries.length; ii < len; ii++) {
      if (Object.is(key, entries[ii][0])) {
        return entries[ii][1];
      }
    }
    return notSetValue;
  }
  update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    if (keyHash === void 0) {
      keyHash = hash(key);
    }
    const removed = value === NOT_SET;
    if (keyHash !== this.keyHash) {
      if (removed) {
        return this;
      }
      SetRef(didAlter);
      SetRef(didChangeSize);
      return mergeIntoNode(this, ownerID, shift, keyHash, [key, value]);
    }
    const entries = this.entries;
    let idx = 0;
    const len = entries.length;
    for (; idx < len; idx++) {
      if (Object.is(key, entries[idx][0])) {
        break;
      }
    }
    const exists = idx < len;
    if (exists ? entries[idx][1] === value : removed) {
      return this;
    }
    SetRef(didAlter);
    if (removed || !exists) SetRef(didChangeSize);
    if (removed && len === 2) {
      return new ValueNode(ownerID, this.keyHash, entries[idx ^ 1]);
    }
    const isEditable = ownerID && ownerID === this.ownerID;
    const newEntries = isEditable ? entries : arrCopy(entries);
    if (exists) {
      if (removed) {
        if (idx === len - 1) {
          newEntries.pop();
        } else {
          newEntries[idx] = newEntries.pop();
        }
      } else {
        newEntries[idx] = [key, value];
      }
    } else {
      newEntries.push([key, value]);
    }
    if (isEditable) {
      this.entries = newEntries;
      return this;
    }
    return new _HashCollisionNode(ownerID, this.keyHash, newEntries);
  }
};
var ValueNode = class _ValueNode {
  constructor(ownerID, keyHash, entry2) {
    this.ownerID = ownerID;
    this.keyHash = keyHash;
    this.entry = entry2;
  }
  ownerID;
  keyHash;
  entry;
  get(shift, keyHash, key, notSetValue) {
    return Object.is(key, this.entry[0]) ? this.entry[1] : notSetValue;
  }
  update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    const removed = value === NOT_SET;
    const keyMatch = Object.is(key, this.entry[0]);
    if (keyMatch ? value === this.entry[1] : removed) {
      return this;
    }
    SetRef(didAlter);
    if (removed) {
      SetRef(didChangeSize);
      return;
    }
    if (keyMatch) {
      if (ownerID && ownerID === this.ownerID) {
        this.entry[1] = value;
        return this;
      }
      return new _ValueNode(ownerID, this.keyHash, [key, value]);
    }
    SetRef(didChangeSize);
    return mergeIntoNode(this, ownerID, shift, hash(key), [key, value]);
  }
};
var MapIterator = class {
  constructor(map, _type, _reverse) {
    this._type = _type;
    this._reverse = _reverse;
    this._stack = map._root && mapIteratorFrame(map._root);
  }
  _type;
  _reverse;
  _stack;
  [Symbol.iterator]() {
    return this;
  }
  next() {
    const type = this._type;
    let stack = this._stack;
    while (stack) {
      const node = stack.node;
      const index2 = stack.index++;
      let maxIndex;
      if (node.entry) {
        if (index2 === 0) {
          return mapIteratorValue(type, node.entry);
        }
      } else if ("entries" in node && node.entries) {
        maxIndex = node.entries.length - 1;
        if (index2 <= maxIndex) {
          return mapIteratorValue(type, node.entries[this._reverse ? maxIndex - index2 : index2]);
        }
      } else {
        maxIndex = node.nodes.length - 1;
        if (index2 <= maxIndex) {
          const subNode = node.nodes[this._reverse ? maxIndex - index2 : index2];
          if (subNode) {
            if (subNode.entry) {
              return mapIteratorValue(type, subNode.entry);
            }
            stack = this._stack = mapIteratorFrame(subNode, stack);
          }
          continue;
        }
      }
      stack = this._stack = this._stack.__prev;
    }
    return iteratorDone();
  }
};
function mapIteratorValue(type, entry2) {
  return iteratorValue(type, entry2[0], entry2[1]);
}
function mapIteratorFrame(node, prev) {
  return {
    node,
    index: 0,
    __prev: prev
  };
}
var ITERATE_KEYS = 0;
var ITERATE_VALUES = 1;
var ITERATE_ENTRIES = 2;
function iteratorValue(type, k, v, iteratorResult) {
  const value = type === ITERATE_KEYS ? k : type === ITERATE_VALUES ? v : [k, v];
  if (iteratorResult) {
    iteratorResult.value = value;
  } else {
    iteratorResult = { value, done: false };
  }
  return iteratorResult;
}
function iteratorDone() {
  return { value: void 0, done: true };
}
function makeMap(size, root, ownerID, hash2) {
  const map = Object.create(ImmutableMap.prototype);
  map.size = size;
  map._root = root;
  map.__ownerID = ownerID;
  map.__hash = hash2;
  map.__altered = false;
  return map;
}
var EMPTY_MAP;
function emptyMap() {
  return EMPTY_MAP || (EMPTY_MAP = makeMap(0));
}
function updateMap(map, k, v) {
  let newRoot;
  let newSize;
  if (!map._root) {
    if (v === NOT_SET) {
      return map;
    }
    newSize = 1;
    newRoot = new ArrayMapNode(map.__ownerID, [[k, v]]);
  } else {
    const didChangeSize = MakeRef();
    const didAlter = MakeRef();
    newRoot = updateNode(map._root, map.__ownerID, 0, void 0, k, v, didChangeSize, didAlter);
    if (!didAlter.value) {
      return map;
    }
    newSize = map.size + (didChangeSize.value ? v === NOT_SET ? -1 : 1 : 0);
  }
  if (map.__ownerID) {
    map.size = newSize;
    map._root = newRoot;
    map.__hash = void 0;
    map.__altered = true;
    return map;
  }
  return newRoot ? makeMap(newSize, newRoot) : emptyMap();
}
function updateNode(node, ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
  if (!node) {
    if (value === NOT_SET) {
      return node;
    }
    SetRef(didAlter);
    SetRef(didChangeSize);
    return new ValueNode(ownerID, keyHash, [key, value]);
  }
  return node.update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter);
}
function isLeafNode(node) {
  return node.constructor === ValueNode || node.constructor === HashCollisionNode;
}
function mergeIntoNode(node, ownerID, shift, keyHash, entry2) {
  if (node.keyHash === keyHash) {
    return new HashCollisionNode(ownerID, keyHash, [node.entry, entry2]);
  }
  const idx1 = (shift === 0 ? node.keyHash : node.keyHash >>> shift) & MASK;
  const idx2 = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
  let newNode;
  const nodes = idx1 === idx2 ? [mergeIntoNode(node, ownerID, shift + SHIFT, keyHash, entry2)] : (newNode = new ValueNode(ownerID, keyHash, entry2), idx1 < idx2 ? [node, newNode] : [newNode, node]);
  return new BitmapIndexedNode(ownerID, 1 << idx1 | 1 << idx2, nodes);
}
function createNodes(ownerID, entries, key, value) {
  if (!ownerID) {
    ownerID = new OwnerID();
  }
  let node = new ValueNode(ownerID, hash(key), [key, value]);
  for (let ii = 0; ii < entries.length; ii++) {
    const entry2 = entries[ii];
    node = node.update(ownerID, 0, void 0, entry2[0], entry2[1]);
  }
  return node;
}
function packNodes(ownerID, nodes, count, excluding) {
  let bitmap = 0;
  let packedII = 0;
  const packedNodes = new Array(count);
  for (let ii = 0, bit = 1, len = nodes.length; ii < len; ii++, bit <<= 1) {
    const node = nodes[ii];
    if (node !== void 0 && ii !== excluding) {
      bitmap |= bit;
      packedNodes[packedII++] = node;
    }
  }
  return new BitmapIndexedNode(ownerID, bitmap, packedNodes);
}
function expandNodes(ownerID, nodes, bitmap, including, node) {
  let count = 0;
  const expandedNodes = new Array(SIZE);
  for (let ii = 0; bitmap !== 0; ii++, bitmap >>>= 1) {
    expandedNodes[ii] = bitmap & 1 ? nodes[count++] : void 0;
  }
  expandedNodes[including] = node;
  return new HashArrayMapNode(ownerID, count + 1, expandedNodes);
}
function popCount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function setAt(array2, idx, val, canEdit) {
  const newArray = canEdit ? array2 : arrCopy(array2);
  newArray[idx] = val;
  return newArray;
}
function spliceIn(array2, idx, val, canEdit) {
  const newLen = array2.length + 1;
  if (canEdit && idx + 1 === newLen) {
    array2[idx] = val;
    return array2;
  }
  const newArray = new Array(newLen);
  let after = 0;
  for (let ii = 0; ii < newLen; ii++) {
    if (ii === idx) {
      newArray[ii] = val;
      after = -1;
    } else {
      newArray[ii] = array2[ii + after];
    }
  }
  return newArray;
}
function spliceOut(array2, idx, canEdit) {
  const newLen = array2.length - 1;
  if (canEdit && idx === newLen) {
    array2.pop();
    return array2;
  }
  const newArray = new Array(newLen);
  let after = 0;
  for (let ii = 0; ii < newLen; ii++) {
    if (ii === idx) {
      after = 1;
    }
    newArray[ii] = array2[ii + after];
  }
  return newArray;
}
var MAX_ARRAY_MAP_SIZE = SIZE / 4;
var MAX_BITMAP_INDEXED_SIZE = SIZE / 2;
var MIN_HASH_ARRAY_MAP_SIZE = SIZE / 4;

// node_modules/@tldraw/store/dist-esm/lib/AtomMap.mjs
var AtomMap = class {
  /**
   * Creates a new AtomMap instance.
   *
   * name - A unique name for this map, used for atom identification
   * entries - Optional initial entries to populate the map with
   * @example
   * ```ts
   * // Create an empty map
   * const map = new AtomMap('userMap')
   *
   * // Create a map with initial data
   * const initialData: [string, number][] = [['a', 1], ['b', 2]]
   * const mapWithData = new AtomMap('numbersMap', initialData)
   * ```
   */
  constructor(name, entries) {
    this.name = name;
    let atoms = emptyMap();
    if (entries) {
      atoms = atoms.withMutations((atoms2) => {
        for (const [k, v] of entries) {
          atoms2.set(k, atom(`${name}:${String(k)}`, v));
        }
      });
    }
    this.atoms = atom(`${name}:atoms`, atoms);
  }
  name;
  atoms;
  /**
   * Retrieves the underlying atom for a given key.
   *
   * @param key - The key to retrieve the atom for
   * @returns The atom containing the value, or undefined if the key doesn't exist
   * @internal
   */
  getAtom(key) {
    const valueAtom = this.atoms.__unsafe__getWithoutCapture().get(key);
    if (!valueAtom) {
      this.atoms.get();
      return void 0;
    }
    return valueAtom;
  }
  /**
   * Gets the value associated with a key. Returns undefined if the key doesn't exist.
   * This method is reactive and will cause reactive contexts to update when the value changes.
   *
   * @param key - The key to retrieve the value for
   * @returns The value associated with the key, or undefined if not found
   * @example
   * ```ts
   * const map = new AtomMap('myMap')
   * map.set('name', 'Alice')
   * console.log(map.get('name')) // 'Alice'
   * console.log(map.get('missing')) // undefined
   * ```
   */
  get(key) {
    const value = this.getAtom(key)?.get();
    assert(value !== UNINITIALIZED);
    return value;
  }
  /**
   * Gets the value associated with a key without creating reactive dependencies.
   * This method will not cause reactive contexts to update when the value changes.
   *
   * @param key - The key to retrieve the value for
   * @returns The value associated with the key, or undefined if not found
   * @example
   * ```ts
   * const map = new AtomMap('myMap')
   * map.set('count', 42)
   * const value = map.__unsafe__getWithoutCapture('count') // No reactive subscription
   * ```
   */
  __unsafe__getWithoutCapture(key) {
    const valueAtom = this.atoms.__unsafe__getWithoutCapture().get(key);
    if (!valueAtom) return void 0;
    const value = valueAtom.__unsafe__getWithoutCapture();
    assert(value !== UNINITIALIZED);
    return value;
  }
  /**
   * Checks whether a key exists in the map.
   * This method is reactive and will cause reactive contexts to update when keys are added or removed.
   *
   * @param key - The key to check for
   * @returns True if the key exists in the map, false otherwise
   * @example
   * ```ts
   * const map = new AtomMap('myMap')
   * console.log(map.has('name')) // false
   * map.set('name', 'Alice')
   * console.log(map.has('name')) // true
   * ```
   */
  has(key) {
    const valueAtom = this.getAtom(key);
    if (!valueAtom) {
      return false;
    }
    return valueAtom.get() !== UNINITIALIZED;
  }
  /**
   * Checks whether a key exists in the map without creating reactive dependencies.
   * This method will not cause reactive contexts to update when keys are added or removed.
   *
   * @param key - The key to check for
   * @returns True if the key exists in the map, false otherwise
   * @example
   * ```ts
   * const map = new AtomMap('myMap')
   * map.set('active', true)
   * const exists = map.__unsafe__hasWithoutCapture('active') // No reactive subscription
   * ```
   */
  __unsafe__hasWithoutCapture(key) {
    const valueAtom = this.atoms.__unsafe__getWithoutCapture().get(key);
    if (!valueAtom) return false;
    assert(valueAtom.__unsafe__getWithoutCapture() !== UNINITIALIZED);
    return true;
  }
  /**
   * Sets a value for the given key. If the key already exists, its value is updated.
   * If the key doesn't exist, a new entry is created.
   *
   * @param key - The key to set the value for
   * @param value - The value to associate with the key
   * @returns This AtomMap instance for method chaining
   * @example
   * ```ts
   * const map = new AtomMap('myMap')
   * map.set('name', 'Alice').set('age', 30)
   * ```
   */
  set(key, value) {
    const existingAtom = this.atoms.__unsafe__getWithoutCapture().get(key);
    if (existingAtom) {
      existingAtom.set(value);
    } else {
      this.atoms.update((atoms) => {
        return atoms.set(key, atom(`${this.name}:${String(key)}`, value));
      });
    }
    return this;
  }
  /**
   * Updates an existing value using an updater function.
   *
   * @param key - The key of the value to update
   * @param updater - A function that receives the current value and returns the new value
   * @throws Error if the key doesn't exist in the map
   * @example
   * ```ts
   * const map = new AtomMap('myMap')
   * map.set('count', 5)
   * map.update('count', count => count + 1) // count is now 6
   * ```
   */
  update(key, updater) {
    const valueAtom = this.atoms.__unsafe__getWithoutCapture().get(key);
    if (!valueAtom) {
      throw new Error(`AtomMap: key ${key} not found`);
    }
    const value = valueAtom.__unsafe__getWithoutCapture();
    assert(value !== UNINITIALIZED);
    valueAtom.set(updater(value));
  }
  /**
   * Removes a key-value pair from the map.
   *
   * @param key - The key to remove
   * @returns True if the key existed and was removed, false if it didn't exist
   * @example
   * ```ts
   * const map = new AtomMap('myMap')
   * map.set('temp', 'value')
   * console.log(map.delete('temp')) // true
   * console.log(map.delete('missing')) // false
   * ```
   */
  delete(key) {
    const valueAtom = this.atoms.__unsafe__getWithoutCapture().get(key);
    if (!valueAtom) {
      return false;
    }
    transact(() => {
      valueAtom.set(UNINITIALIZED);
      this.atoms.update((atoms) => {
        return atoms.delete(key);
      });
    });
    return true;
  }
  /**
   * Removes multiple key-value pairs from the map in a single transaction.
   *
   * @param keys - An iterable of keys to remove
   * @returns An array of [key, value] pairs that were actually deleted
   * @example
   * ```ts
   * const map = new AtomMap('myMap')
   * map.set('a', 1).set('b', 2).set('c', 3)
   * const deleted = map.deleteMany(['a', 'c', 'missing'])
   * console.log(deleted) // [['a', 1], ['c', 3]]
   * ```
   */
  deleteMany(keys) {
    return transact(() => {
      const deleted = [];
      const newAtoms = this.atoms.get().withMutations((atoms) => {
        for (const key of keys) {
          const valueAtom = atoms.get(key);
          if (!valueAtom) continue;
          const oldValue = valueAtom.get();
          assert(oldValue !== UNINITIALIZED);
          deleted.push([key, oldValue]);
          atoms.delete(key);
          valueAtom.set(UNINITIALIZED);
        }
      });
      if (deleted.length) {
        this.atoms.set(newAtoms);
      }
      return deleted;
    });
  }
  /**
   * Removes all key-value pairs from the map.
   *
   * @example
   * ```ts
   * const map = new AtomMap('myMap')
   * map.set('a', 1).set('b', 2)
   * map.clear()
   * console.log(map.size) // 0
   * ```
   */
  clear() {
    return transact(() => {
      for (const valueAtom of this.atoms.__unsafe__getWithoutCapture().values()) {
        valueAtom.set(UNINITIALIZED);
      }
      this.atoms.set(emptyMap());
    });
  }
  /**
   * Returns an iterator that yields [key, value] pairs for each entry in the map.
   * This method is reactive and will cause reactive contexts to update when entries change.
   *
   * @returns A generator that yields [key, value] tuples
   * @example
   * ```ts
   * const map = new AtomMap('myMap')
   * map.set('a', 1).set('b', 2)
   * for (const [key, value] of map.entries()) {
   *   console.log(`${key}: ${value}`)
   * }
   * ```
   */
  *entries() {
    for (const [key, valueAtom] of this.atoms.get()) {
      const value = valueAtom.get();
      assert(value !== UNINITIALIZED);
      yield [key, value];
    }
  }
  /**
   * Returns an iterator that yields all keys in the map.
   * This method is reactive and will cause reactive contexts to update when keys change.
   *
   * @returns A generator that yields keys
   * @example
   * ```ts
   * const map = new AtomMap('myMap')
   * map.set('name', 'Alice').set('age', 30)
   * for (const key of map.keys()) {
   *   console.log(key) // 'name', 'age'
   * }
   * ```
   */
  *keys() {
    for (const key of this.atoms.get().keys()) {
      yield key;
    }
  }
  /**
   * Returns an iterator that yields all values in the map.
   * This method is reactive and will cause reactive contexts to update when values change.
   *
   * @returns A generator that yields values
   * @example
   * ```ts
   * const map = new AtomMap('myMap')
   * map.set('name', 'Alice').set('age', 30)
   * for (const value of map.values()) {
   *   console.log(value) // 'Alice', 30
   * }
   * ```
   */
  *values() {
    for (const valueAtom of this.atoms.get().values()) {
      const value = valueAtom.get();
      assert(value !== UNINITIALIZED);
      yield value;
    }
  }
  /**
   * The number of key-value pairs in the map.
   * This property is reactive and will cause reactive contexts to update when the size changes.
   *
   * @returns The number of entries in the map
   * @example
   * ```ts
   * const map = new AtomMap('myMap')
   * console.log(map.size) // 0
   * map.set('a', 1)
   * console.log(map.size) // 1
   * ```
   */
  // eslint-disable-next-line tldraw/no-setter-getter
  get size() {
    return this.atoms.get().size;
  }
  /**
   * Executes a provided function once for each key-value pair in the map.
   * This method is reactive and will cause reactive contexts to update when entries change.
   *
   * @param callbackfn - Function to execute for each entry
   *   - value - The value of the current entry
   *   - key - The key of the current entry
   *   - map - The AtomMap being traversed
   * @param thisArg - Value to use as `this` when executing the callback
   * @example
   * ```ts
   * const map = new AtomMap('myMap')
   * map.set('a', 1).set('b', 2)
   * map.forEach((value, key) => {
   *   console.log(`${key} = ${value}`)
   * })
   * ```
   */
  forEach(callbackfn, thisArg) {
    for (const [key, value] of this.entries()) {
      callbackfn.call(thisArg, value, key, this);
    }
  }
  /**
   * Returns the default iterator for the map, which is the same as entries().
   * This allows the map to be used in for...of loops and other iterable contexts.
   *
   * @returns The same iterator as entries()
   * @example
   * ```ts
   * const map = new AtomMap('myMap')
   * map.set('a', 1).set('b', 2)
   *
   * // These are equivalent:
   * for (const [key, value] of map) {
   *   console.log(`${key}: ${value}`)
   * }
   *
   * for (const [key, value] of map.entries()) {
   *   console.log(`${key}: ${value}`)
   * }
   * ```
   */
  [Symbol.iterator]() {
    return this.entries();
  }
  /**
   * The string tag used by Object.prototype.toString for this class.
   *
   * @example
   * ```ts
   * const map = new AtomMap('myMap')
   * console.log(Object.prototype.toString.call(map)) // '[object AtomMap]'
   * ```
   */
  [Symbol.toStringTag] = "AtomMap";
};

// node_modules/@tldraw/store/dist-esm/lib/isDev.mjs
var import_meta = {};
var _isDev = false;
try {
  _isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
} catch (_e) {
}
try {
  _isDev = _isDev || import_meta.env.DEV || import_meta.env.TEST || import_meta.env.MODE === "development" || import_meta.env.MODE === "test";
} catch (_e) {
}
function isDev() {
  return _isDev;
}

// node_modules/@tldraw/store/dist-esm/lib/devFreeze.mjs
function devFreeze(object2) {
  if (!isDev()) return object2;
  const proto = Object.getPrototypeOf(object2);
  if (proto && !(Array.isArray(object2) || proto === Object.prototype || proto === null || proto === STRUCTURED_CLONE_OBJECT_PROTOTYPE)) {
    console.error("cannot include non-js data in a record", object2);
    throw new Error("cannot include non-js data in a record");
  }
  if (Object.isFrozen(object2)) {
    return object2;
  }
  const propNames = Object.getOwnPropertyNames(object2);
  for (const name of propNames) {
    const value = object2[name];
    if (value && typeof value === "object") {
      devFreeze(value);
    }
  }
  return Object.freeze(object2);
}

// node_modules/@tldraw/store/dist-esm/lib/migrate.mjs
function squashDependsOn(sequence) {
  const result = [];
  for (let i = sequence.length - 1; i >= 0; i--) {
    const elem = sequence[i];
    if (!("id" in elem)) {
      const dependsOn = elem.dependsOn;
      const prev = result[0];
      if (prev) {
        result[0] = {
          ...prev,
          dependsOn: dependsOn.concat(prev.dependsOn ?? [])
        };
      }
    } else {
      result.unshift(elem);
    }
  }
  return result;
}
function createMigrationSequence({
  sequence,
  sequenceId,
  retroactive = true
}) {
  const migrations = {
    sequenceId,
    retroactive,
    sequence: squashDependsOn(sequence)
  };
  validateMigrations(migrations);
  return migrations;
}
function createMigrationIds(sequenceId, versions) {
  return Object.fromEntries(
    objectMapEntries(versions).map(([key, version]) => [key, `${sequenceId}/${version}`])
  );
}
function createRecordMigrationSequence(opts) {
  const sequenceId = opts.sequenceId;
  return createMigrationSequence({
    sequenceId,
    retroactive: opts.retroactive ?? true,
    sequence: opts.sequence.map(
      (m) => "id" in m ? {
        ...m,
        scope: "record",
        filter: (r) => r.typeName === opts.recordType && (m.filter?.(r) ?? true) && (opts.filter?.(r) ?? true)
      } : m
    )
  });
}
function sortMigrations(migrations) {
  if (migrations.length === 0) return [];
  const byId = new Map(migrations.map((m) => [m.id, m]));
  const dependents = /* @__PURE__ */ new Map();
  const inDegree = /* @__PURE__ */ new Map();
  const explicitDeps = /* @__PURE__ */ new Map();
  for (const m of migrations) {
    inDegree.set(m.id, 0);
    dependents.set(m.id, /* @__PURE__ */ new Set());
    explicitDeps.set(m.id, /* @__PURE__ */ new Set());
  }
  for (const m of migrations) {
    const { version, sequenceId } = parseMigrationId(m.id);
    const prevId = `${sequenceId}/${version - 1}`;
    if (byId.has(prevId)) {
      dependents.get(prevId).add(m.id);
      inDegree.set(m.id, inDegree.get(m.id) + 1);
    }
    if (m.dependsOn) {
      for (const depId of m.dependsOn) {
        if (byId.has(depId)) {
          dependents.get(depId).add(m.id);
          explicitDeps.get(m.id).add(depId);
          inDegree.set(m.id, inDegree.get(m.id) + 1);
        }
      }
    }
  }
  const ready = migrations.filter((m) => inDegree.get(m.id) === 0);
  const result = [];
  const processed = /* @__PURE__ */ new Set();
  while (ready.length > 0) {
    let bestCandidate;
    let bestCandidateScore = -Infinity;
    for (const m of ready) {
      let urgencyScore = 0;
      for (const depId of dependents.get(m.id) || []) {
        if (!processed.has(depId)) {
          urgencyScore += 1;
          if (explicitDeps.get(depId).has(m.id)) {
            urgencyScore += 100;
          }
        }
      }
      if (urgencyScore > bestCandidateScore || // Tiebreaker: prefer lower sequence/version
      urgencyScore === bestCandidateScore && m.id.localeCompare(bestCandidate?.id ?? "") < 0) {
        bestCandidate = m;
        bestCandidateScore = urgencyScore;
      }
    }
    const nextMigration = bestCandidate;
    ready.splice(ready.indexOf(nextMigration), 1);
    result.push(nextMigration);
    processed.add(nextMigration.id);
    for (const depId of dependents.get(nextMigration.id) || []) {
      if (!processed.has(depId)) {
        inDegree.set(depId, inDegree.get(depId) - 1);
        if (inDegree.get(depId) === 0) {
          ready.push(byId.get(depId));
        }
      }
    }
  }
  if (result.length !== migrations.length) {
    const unprocessed = migrations.filter((m) => !processed.has(m.id));
    assert(false, `Circular dependency in migrations: ${unprocessed[0].id}`);
  }
  return result;
}
function parseMigrationId(id) {
  const [sequenceId, version] = id.split("/");
  return { sequenceId, version: parseInt(version) };
}
function validateMigrationId(id, expectedSequenceId) {
  if (expectedSequenceId) {
    assert(
      id.startsWith(expectedSequenceId + "/"),
      `Every migration in sequence '${expectedSequenceId}' must have an id starting with '${expectedSequenceId}/'. Got invalid id: '${id}'`
    );
  }
  assert(id.match(/^(.*?)\/(0|[1-9]\d*)$/), `Invalid migration id: '${id}'`);
}
function validateMigrations(migrations) {
  assert(
    !migrations.sequenceId.includes("/"),
    `sequenceId cannot contain a '/', got ${migrations.sequenceId}`
  );
  assert(migrations.sequenceId.length, "sequenceId must be a non-empty string");
  if (migrations.sequence.length === 0) {
    return;
  }
  validateMigrationId(migrations.sequence[0].id, migrations.sequenceId);
  let n = parseMigrationId(migrations.sequence[0].id).version;
  assert(
    n === 1,
    `Expected the first migrationId to be '${migrations.sequenceId}/1' but got '${migrations.sequence[0].id}'`
  );
  for (let i = 1; i < migrations.sequence.length; i++) {
    const id = migrations.sequence[i].id;
    validateMigrationId(id, migrations.sequenceId);
    const m = parseMigrationId(id).version;
    assert(
      m === n + 1,
      `Migration id numbers must increase in increments of 1, expected ${migrations.sequenceId}/${n + 1} but got '${migrations.sequence[i].id}'`
    );
    n = m;
  }
}
var MigrationFailureReason = {
  IncompatibleSubtype: "incompatible-subtype",
  UnknownType: "unknown-type",
  TargetVersionTooNew: "target-version-too-new",
  TargetVersionTooOld: "target-version-too-old",
  MigrationError: "migration-error",
  UnrecognizedSubtype: "unrecognized-subtype"
};

// node_modules/@tldraw/store/dist-esm/lib/RecordType.mjs
var RecordType = class _RecordType {
  /**
   * Creates a new RecordType instance.
   *
   * typeName - The unique type name for records created by this RecordType
   * config - Configuration object for the RecordType
   *   - createDefaultProperties - Function that returns default properties for new records
   *   - validator - Optional validator function for record validation
   *   - scope - Optional scope determining persistence behavior (defaults to 'document')
   *   - ephemeralKeys - Optional mapping of property names to ephemeral status
   * @public
   */
  constructor(typeName, config) {
    this.typeName = typeName;
    this.createDefaultProperties = config.createDefaultProperties;
    this.validator = config.validator ?? { validate: (r) => r };
    this.scope = config.scope ?? "document";
    this.ephemeralKeys = config.ephemeralKeys;
    const ephemeralKeySet = /* @__PURE__ */ new Set();
    if (config.ephemeralKeys) {
      for (const [key, isEphemeral] of objectMapEntries(config.ephemeralKeys)) {
        if (isEphemeral) ephemeralKeySet.add(key);
      }
    }
    this.ephemeralKeySet = ephemeralKeySet;
  }
  typeName;
  /**
   * Factory function that creates default properties for new records.
   * @public
   */
  createDefaultProperties;
  /**
   * Validator function used to validate records of this type.
   * @public
   */
  validator;
  /**
   * Optional configuration specifying which record properties are ephemeral.
   * Ephemeral properties are not included in snapshots or synchronization.
   * @public
   */
  ephemeralKeys;
  /**
   * Set of property names that are marked as ephemeral for efficient lookup.
   * @public
   */
  ephemeralKeySet;
  /**
   * The scope that determines how records of this type are persisted and synchronized.
   * @public
   */
  scope;
  /**
   * Creates a new record of this type with the given properties.
   *
   * Properties are merged with default properties from the RecordType configuration.
   * If no id is provided, a unique id will be generated automatically.
   *
   * @example
   * ```ts
   * const book = Book.create({
   *   title: 'The Great Gatsby',
   *   author: 'F. Scott Fitzgerald'
   * })
   * // Result: { id: 'book:abc123', typeName: 'book', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', inStock: true }
   * ```
   *
   * @param properties - The properties for the new record, including both required and optional fields
   * @returns The newly created record with generated id and typeName
   * @public
   */
  create(properties) {
    const result = {
      ...this.createDefaultProperties(),
      id: properties.id ?? this.createId()
    };
    for (const [k, v] of Object.entries(properties)) {
      if (v !== void 0) {
        result[k] = v;
      }
    }
    result.typeName = this.typeName;
    return result;
  }
  /**
   * Creates a deep copy of an existing record with a new unique id.
   *
   * This method performs a deep clone of all properties while generating a fresh id,
   * making it useful for duplicating records without id conflicts.
   *
   * @example
   * ```ts
   * const originalBook = Book.create({ title: '1984', author: 'George Orwell' })
   * const duplicatedBook = Book.clone(originalBook)
   * // duplicatedBook has same properties but different id
   * ```
   *
   * @param record - The record to clone
   * @returns A new record with the same properties but a different id
   * @public
   */
  clone(record) {
    return { ...structuredClone(record), id: this.createId() };
  }
  /**
   * Create a new ID for this record type.
   *
   * @example
   *
   * ```ts
   * const id = recordType.createId()
   * ```
   *
   * @returns The new ID.
   * @public
   */
  createId(customUniquePart) {
    return this.typeName + ":" + (customUniquePart ?? uniqueId());
  }
  /**
   * Extracts the unique identifier part from a full record id.
   *
   * Record ids have the format `typeName:uniquePart`. This method returns just the unique part.
   *
   * @example
   * ```ts
   * const bookId = Book.createId() // 'book:abc123'
   * const uniquePart = Book.parseId(bookId) // 'abc123'
   * ```
   *
   * @param id - The full record id to parse
   * @returns The unique identifier portion after the colon
   * @throws Error if the id is not valid for this record type
   * @public
   */
  parseId(id) {
    if (!this.isId(id)) {
      throw new Error(`ID "${id}" is not a valid ID for type "${this.typeName}"`);
    }
    return id.slice(this.typeName.length + 1);
  }
  /**
   * Type guard that checks whether a record belongs to this RecordType.
   *
   * This method performs a runtime check by comparing the record's typeName
   * against this RecordType's typeName.
   *
   * @example
   * ```ts
   * if (Book.isInstance(someRecord)) {
   *   // someRecord is now typed as a book record
   *   console.log(someRecord.title)
   * }
   * ```
   *
   * @param record - The record to check, may be undefined
   * @returns True if the record is an instance of this record type
   * @public
   */
  isInstance(record) {
    return record?.typeName === this.typeName;
  }
  /**
   * Type guard that checks whether an id string belongs to this RecordType.
   *
   * Validates that the id starts with this RecordType's typeName followed by a colon.
   * This is more efficient than parsing the full id when you only need to verify the type.
   *
   * @example
   * ```ts
   * if (Book.isId(someId)) {
   *   // someId is now typed as IdOf<BookRecord>
   *   const book = store.get(someId)
   * }
   * ```
   *
   * @param id - The id string to check, may be undefined
   * @returns True if the id belongs to this record type
   * @public
   */
  isId(id) {
    if (!id) return false;
    for (let i = 0; i < this.typeName.length; i++) {
      if (id[i] !== this.typeName[i]) return false;
    }
    return id[this.typeName.length] === ":";
  }
  /**
   * Create a new RecordType that has the same type name as this RecordType and includes the given
   * default properties.
   *
   * @example
   *
   * ```ts
   * const authorType = createRecordType('author', () => ({ living: true }))
   * const deadAuthorType = authorType.withDefaultProperties({ living: false })
   * ```
   *
   * @param createDefaultProperties - A function that returns the default properties of the new RecordType.
   * @returns The new RecordType.
   */
  withDefaultProperties(createDefaultProperties) {
    return new _RecordType(this.typeName, {
      createDefaultProperties,
      validator: this.validator,
      scope: this.scope,
      ephemeralKeys: this.ephemeralKeys
    });
  }
  /**
   * Validates a record against this RecordType's validator and returns it with proper typing.
   *
   * This method runs the configured validator function and throws an error if validation fails.
   * If a previous version of the record is provided, it may use optimized validation.
   *
   * @example
   * ```ts
   * try {
   *   const validBook = Book.validate(untrustedData)
   *   // validBook is now properly typed and validated
   * } catch (error) {
   *   console.log('Validation failed:', error.message)
   * }
   * ```
   *
   * @param record - The unknown record data to validate
   * @param recordBefore - Optional previous version for optimized validation
   * @returns The validated and properly typed record
   * @throws Error if validation fails
   * @public
   */
  validate(record, recordBefore) {
    if (recordBefore && this.validator.validateUsingKnownGoodVersion) {
      return this.validator.validateUsingKnownGoodVersion(recordBefore, record);
    }
    return this.validator.validate(record);
  }
};
function createRecordType(typeName, config) {
  return new RecordType(typeName, {
    createDefaultProperties: () => ({}),
    validator: config.validator,
    scope: config.scope,
    ephemeralKeys: config.ephemeralKeys
  });
}

// node_modules/@tldraw/store/dist-esm/lib/StoreSchema.mjs
function upgradeSchema(schema2) {
  if (schema2.schemaVersion > 2 || schema2.schemaVersion < 1) return Result.err("Bad schema version");
  if (schema2.schemaVersion === 2) return Result.ok(schema2);
  const result = {
    schemaVersion: 2,
    sequences: {
      "com.tldraw.store": schema2.storeVersion
    }
  };
  for (const [typeName, recordVersion] of Object.entries(schema2.recordVersions)) {
    result.sequences[`com.tldraw.${typeName}`] = recordVersion.version;
    if ("subTypeKey" in recordVersion) {
      for (const [subType, version] of Object.entries(recordVersion.subTypeVersions)) {
        result.sequences[`com.tldraw.${typeName}.${subType}`] = version;
      }
    }
  }
  return Result.ok(result);
}
var StoreSchema = class _StoreSchema {
  constructor(types, options) {
    this.types = types;
    this.options = options;
    for (const m of options.migrations ?? []) {
      assert(!this.migrations[m.sequenceId], `Duplicate migration sequenceId ${m.sequenceId}`);
      validateMigrations(m);
      this.migrations[m.sequenceId] = m;
    }
    const allMigrations = Object.values(this.migrations).flatMap((m) => m.sequence);
    this.sortedMigrations = sortMigrations(allMigrations);
    for (const migration of this.sortedMigrations) {
      if (!migration.dependsOn?.length) continue;
      for (const dep of migration.dependsOn) {
        const depMigration = allMigrations.find((m) => m.id === dep);
        assert(depMigration, `Migration '${migration.id}' depends on missing migration '${dep}'`);
      }
    }
  }
  types;
  options;
  /**
   * Creates a new StoreSchema with the given record types and options.
   *
   * This static factory method is the recommended way to create a StoreSchema.
   * It ensures type safety while providing a clean API for schema definition.
   *
   * @param types - Object mapping type names to their RecordType definitions
   * @param options - Optional configuration for migrations, validation, and integrity checking
   * @returns A new StoreSchema instance
   *
   * @example
   * ```ts
   * const Book = createRecordType<Book>('book', { scope: 'document' })
   * const Author = createRecordType<Author>('author', { scope: 'document' })
   *
   * const schema = StoreSchema.create(
   *   {
   *     book: Book,
   *     author: Author
   *   },
   *   {
   *     migrations: [bookMigrations],
   *     onValidationFailure: (failure) => failure.record
   *   }
   * )
   * ```
   *
   * @public
   */
  static create(types, options) {
    return new _StoreSchema(types, options ?? {});
  }
  migrations = {};
  sortedMigrations;
  migrationCache = /* @__PURE__ */ new WeakMap();
  /**
   * Validates a record using its corresponding RecordType validator.
   *
   * This method ensures that records conform to their type definitions before
   * being stored. If validation fails and an onValidationFailure handler is
   * provided, it will be called to potentially recover from the error.
   *
   * @param store - The store instance where validation is occurring
   * @param record - The record to validate
   * @param phase - The lifecycle phase where validation is happening
   * @param recordBefore - The previous version of the record (for updates)
   * @returns The validated record, potentially modified by validation failure handler
   *
   * @example
   * ```ts
   * try {
   *   const validatedBook = schema.validateRecord(
   *     store,
   *     { id: 'book:1', typeName: 'book', title: '', author: 'Jane Doe' },
   *     'createRecord',
   *     null
   *   )
   * } catch (error) {
   *   console.error('Record validation failed:', error)
   * }
   * ```
   *
   * @public
   */
  validateRecord(store, record, phase, recordBefore) {
    try {
      const recordType = getOwnProperty(this.types, record.typeName);
      if (!recordType) {
        throw new Error(`Missing definition for record type ${record.typeName}`);
      }
      return recordType.validate(record, recordBefore ?? void 0);
    } catch (error) {
      if (this.options.onValidationFailure) {
        return this.options.onValidationFailure({
          store,
          record,
          phase,
          recordBefore,
          error
        });
      } else {
        throw error;
      }
    }
  }
  /**
   * Gets all migrations that need to be applied to upgrade from a persisted schema
   * to the current schema version.
   *
   * This method compares the persisted schema with the current schema and determines
   * which migrations need to be applied to bring the data up to date. It handles
   * both regular migrations and retroactive migrations, and caches results for
   * performance.
   *
   * @param persistedSchema - The schema version that was previously persisted
   * @returns A Result containing the list of migrations to apply, or an error message
   *
   * @example
   * ```ts
   * const persistedSchema = {
   *   schemaVersion: 2,
   *   sequences: { 'com.tldraw.book': 1, 'com.tldraw.author': 0 }
   * }
   *
   * const migrationsResult = schema.getMigrationsSince(persistedSchema)
   * if (migrationsResult.ok) {
   *   console.log('Migrations to apply:', migrationsResult.value.length)
   *   // Apply each migration to bring data up to date
   * }
   * ```
   *
   * @public
   */
  getMigrationsSince(persistedSchema) {
    const cached = this.migrationCache.get(persistedSchema);
    if (cached) {
      return cached;
    }
    const upgradeResult = upgradeSchema(persistedSchema);
    if (!upgradeResult.ok) {
      this.migrationCache.set(persistedSchema, upgradeResult);
      return upgradeResult;
    }
    const schema2 = upgradeResult.value;
    const sequenceIdsToInclude = new Set(
      // start with any shared sequences
      Object.keys(schema2.sequences).filter((sequenceId) => this.migrations[sequenceId])
    );
    for (const sequenceId in this.migrations) {
      if (schema2.sequences[sequenceId] === void 0 && this.migrations[sequenceId].retroactive) {
        sequenceIdsToInclude.add(sequenceId);
      }
    }
    if (sequenceIdsToInclude.size === 0) {
      const result2 = Result.ok([]);
      this.migrationCache.set(persistedSchema, result2);
      return result2;
    }
    const allMigrationsToInclude = /* @__PURE__ */ new Set();
    for (const sequenceId of sequenceIdsToInclude) {
      const theirVersion = schema2.sequences[sequenceId];
      if (typeof theirVersion !== "number" && this.migrations[sequenceId].retroactive || theirVersion === 0) {
        for (const migration of this.migrations[sequenceId].sequence) {
          allMigrationsToInclude.add(migration.id);
        }
        continue;
      }
      const theirVersionId = `${sequenceId}/${theirVersion}`;
      const idx = this.migrations[sequenceId].sequence.findIndex((m) => m.id === theirVersionId);
      if (idx === -1) {
        const result2 = Result.err("Incompatible schema?");
        this.migrationCache.set(persistedSchema, result2);
        return result2;
      }
      for (const migration of this.migrations[sequenceId].sequence.slice(idx + 1)) {
        allMigrationsToInclude.add(migration.id);
      }
    }
    const result = Result.ok(
      this.sortedMigrations.filter(({ id }) => allMigrationsToInclude.has(id))
    );
    this.migrationCache.set(persistedSchema, result);
    return result;
  }
  /**
   * Migrates a single persisted record to match the current schema version.
   *
   * This method applies the necessary migrations to transform a record from an
   * older (or newer) schema version to the current version. It supports both
   * forward ('up') and backward ('down') migrations.
   *
   * @param record - The record to migrate
   * @param persistedSchema - The schema version the record was persisted with
   * @param direction - Direction to migrate ('up' for newer, 'down' for older)
   * @returns A MigrationResult containing the migrated record or an error
   *
   * @example
   * ```ts
   * const oldRecord = { id: 'book:1', typeName: 'book', title: 'Old Title', publishDate: '2020-01-01' }
   * const oldSchema = { schemaVersion: 2, sequences: { 'com.tldraw.book': 1 } }
   *
   * const result = schema.migratePersistedRecord(oldRecord, oldSchema, 'up')
   * if (result.type === 'success') {
   *   console.log('Migrated record:', result.value)
   *   // Record now has publishedYear instead of publishDate
   * } else {
   *   console.error('Migration failed:', result.reason)
   * }
   * ```
   *
   * @public
   */
  migratePersistedRecord(record, persistedSchema, direction = "up") {
    const migrations = this.getMigrationsSince(persistedSchema);
    if (!migrations.ok) {
      console.error("Error migrating record", migrations.error);
      return { type: "error", reason: MigrationFailureReason.MigrationError };
    }
    let migrationsToApply = migrations.value;
    if (migrationsToApply.length === 0) {
      return { type: "success", value: record };
    }
    if (!migrationsToApply.every((m) => m.scope === "record")) {
      return {
        type: "error",
        reason: direction === "down" ? MigrationFailureReason.TargetVersionTooOld : MigrationFailureReason.TargetVersionTooNew
      };
    }
    if (direction === "down") {
      if (!migrationsToApply.every((m) => m.scope === "record" && m.down)) {
        return {
          type: "error",
          reason: MigrationFailureReason.TargetVersionTooOld
        };
      }
      migrationsToApply = migrationsToApply.slice().reverse();
    }
    record = structuredClone(record);
    try {
      for (const migration of migrationsToApply) {
        if (migration.scope === "store") throw new Error(
          /* won't happen, just for TS */
        );
        if (migration.scope === "storage") throw new Error(
          /* won't happen, just for TS */
        );
        const shouldApply = migration.filter ? migration.filter(record) : true;
        if (!shouldApply) continue;
        const result = migration[direction](record);
        if (result) {
          record = structuredClone(result);
        }
      }
    } catch (e) {
      console.error("Error migrating record", e);
      return { type: "error", reason: MigrationFailureReason.MigrationError };
    }
    return { type: "success", value: record };
  }
  migrateStorage(storage) {
    const schema2 = storage.getSchema();
    assert(schema2, "Schema is missing.");
    const migrations = this.getMigrationsSince(schema2);
    if (!migrations.ok) {
      console.error("Error migrating store", migrations.error);
      throw new Error(migrations.error);
    }
    const migrationsToApply = migrations.value;
    if (migrationsToApply.length === 0) {
      return;
    }
    storage.setSchema(this.serialize());
    for (const migration of migrationsToApply) {
      if (migration.scope === "record") {
        const updates = [];
        for (const [id, state] of storage.entries()) {
          const shouldApply = migration.filter ? migration.filter(state) : true;
          if (!shouldApply) continue;
          const record = structuredClone(state);
          const result = migration.up(record) ?? record;
          if (!(0, import_lodash2.default)(result, state)) {
            updates.push([id, result]);
          }
        }
        for (const [id, record] of updates) {
          storage.set(id, record);
        }
      } else if (migration.scope === "store") {
        const prevStore = Object.fromEntries(storage.entries());
        let nextStore = structuredClone(prevStore);
        nextStore = migration.up(nextStore) ?? nextStore;
        for (const [id, state] of Object.entries(nextStore)) {
          if (!state) continue;
          if (!(0, import_lodash2.default)(state, prevStore[id])) {
            storage.set(id, state);
          }
        }
        for (const id of Object.keys(prevStore)) {
          if (!nextStore[id]) {
            storage.delete(id);
          }
        }
      } else if (migration.scope === "storage") {
        migration.up(storage);
      } else {
        exhaustiveSwitchError(migration);
      }
    }
    for (const [id, state] of storage.entries()) {
      if (this.getType(state.typeName).scope !== "document") {
        storage.delete(id);
      }
    }
  }
  /**
   * Migrates an entire store snapshot to match the current schema version.
   *
   * This method applies all necessary migrations to bring a persisted store
   * snapshot up to the current schema version. It handles both record-level
   * and store-level migrations, and can optionally mutate the input store
   * for performance.
   *
   * @param snapshot - The store snapshot containing data and schema information
   * @param opts - Options controlling migration behavior
   *   - mutateInputStore - Whether to modify the input store directly (default: false)
   * @returns A MigrationResult containing the migrated store or an error
   *
   * @example
   * ```ts
   * const snapshot = {
   *   schema: { schemaVersion: 2, sequences: { 'com.tldraw.book': 1 } },
   *   store: {
   *     'book:1': { id: 'book:1', typeName: 'book', title: 'Old Book', publishDate: '2020-01-01' }
   *   }
   * }
   *
   * const result = schema.migrateStoreSnapshot(snapshot)
   * if (result.type === 'success') {
   *   console.log('Migrated store:', result.value)
   *   // All records are now at current schema version
   * }
   * ```
   *
   * @public
   */
  migrateStoreSnapshot(snapshot, opts) {
    const migrations = this.getMigrationsSince(snapshot.schema);
    if (!migrations.ok) {
      console.error("Error migrating store", migrations.error);
      return { type: "error", reason: MigrationFailureReason.MigrationError };
    }
    const migrationsToApply = migrations.value;
    if (migrationsToApply.length === 0) {
      return { type: "success", value: snapshot.store };
    }
    const store = Object.assign(
      new Map(objectMapEntries(snapshot.store).map(devFreeze)),
      {
        getSchema: () => snapshot.schema,
        setSchema: (_) => {
        }
      }
    );
    try {
      this.migrateStorage(store);
      if (opts?.mutateInputStore) {
        for (const [id, record] of store.entries()) {
          snapshot.store[id] = record;
        }
        for (const id of Object.keys(snapshot.store)) {
          if (!store.has(id)) {
            delete snapshot.store[id];
          }
        }
        return { type: "success", value: snapshot.store };
      } else {
        return {
          type: "success",
          value: Object.fromEntries(store.entries())
        };
      }
    } catch (e) {
      console.error("Error migrating store", e);
      return { type: "error", reason: MigrationFailureReason.MigrationError };
    }
  }
  /**
   * Creates an integrity checker function for the given store.
   *
   * This method calls the createIntegrityChecker option if provided, allowing
   * custom integrity checking logic to be set up for the store. The integrity
   * checker is used to validate store consistency and catch data corruption.
   *
   * @param store - The store instance to create an integrity checker for
   * @returns An integrity checker function, or undefined if none is configured
   *
   * @internal
   */
  createIntegrityChecker(store) {
    return this.options.createIntegrityChecker?.(store) ?? void 0;
  }
  /**
   * Serializes the current schema to a SerializedSchemaV2 format.
   *
   * This method creates a serialized representation of the current schema,
   * capturing the latest version number for each migration sequence.
   * The result can be persisted and later used to determine what migrations
   * need to be applied when loading data.
   *
   * @returns A SerializedSchemaV2 object representing the current schema state
   *
   * @example
   * ```ts
   * const serialized = schema.serialize()
   * console.log(serialized)
   * // {
   * //   schemaVersion: 2,
   * //   sequences: {
   * //     'com.tldraw.book': 3,
   * //     'com.tldraw.author': 2
   * //   }
   * // }
   *
   * // Store this with your data for future migrations
   * localStorage.setItem('schema', JSON.stringify(serialized))
   * ```
   *
   * @public
   */
  serialize() {
    return {
      schemaVersion: 2,
      sequences: Object.fromEntries(
        Object.values(this.migrations).map(({ sequenceId, sequence }) => [
          sequenceId,
          sequence.length ? parseMigrationId(sequence.at(-1).id).version : 0
        ])
      )
    };
  }
  /**
   * Serializes a schema representing the earliest possible version.
   *
   * This method creates a serialized schema where all migration sequences
   * are set to version 0, representing the state before any migrations
   * have been applied. This is used in specific legacy scenarios.
   *
   * @returns A SerializedSchema with all sequences set to version 0
   *
   * @deprecated This is only here for legacy reasons, don't use it unless you have david's blessing!
   * @internal
   */
  serializeEarliestVersion() {
    return {
      schemaVersion: 2,
      sequences: Object.fromEntries(
        Object.values(this.migrations).map(({ sequenceId }) => [sequenceId, 0])
      )
    };
  }
  /**
   * Gets the RecordType definition for a given type name.
   *
   * This method retrieves the RecordType associated with the specified
   * type name, which contains the record's validation, creation, and
   * other behavioral logic.
   *
   * @param typeName - The name of the record type to retrieve
   * @returns The RecordType definition for the specified type
   *
   * @throws Will throw an error if the record type does not exist
   *
   * @internal
   */
  getType(typeName) {
    const type = getOwnProperty(this.types, typeName);
    assert(type, "record type does not exist");
    return type;
  }
};

// node_modules/@tldraw/store/dist-esm/index.mjs
registerTldrawLibraryVersion(
  "@tldraw/store",
  "5.2.5",
  "esm"
);

// node_modules/@tldraw/sync-core/dist-esm/lib/diff.mjs
var RecordOpType = {
  Put: "put",
  Patch: "patch",
  Remove: "remove"
};
var ValueOpType = {
  Put: "put",
  Delete: "delete",
  Append: "append",
  Patch: "patch"
};
function diffRecord(prev, next, legacyAppendMode = false) {
  return diffObject(prev, next, /* @__PURE__ */ new Set(["props", "meta"]), legacyAppendMode);
}
function diffObject(prev, next, nestedKeys, legacyAppendMode) {
  if (prev === next) {
    return null;
  }
  let result = null;
  for (const key of Object.keys(prev)) {
    if (!(key in next)) {
      if (!result) result = {};
      result[key] = [ValueOpType.Delete];
      continue;
    }
    const prevValue = prev[key];
    const nextValue = next[key];
    if (nestedKeys?.has(key) || Array.isArray(prevValue) && Array.isArray(nextValue) || typeof prevValue === "string" && typeof nextValue === "string") {
      const diff = diffValue(prevValue, nextValue, legacyAppendMode);
      if (diff) {
        if (!result) result = {};
        result[key] = diff;
      }
    } else if (!(0, import_lodash2.default)(prevValue, nextValue)) {
      if (!result) result = {};
      result[key] = [ValueOpType.Put, nextValue];
    }
  }
  for (const key of Object.keys(next)) {
    if (!(key in prev)) {
      if (!result) result = {};
      result[key] = [ValueOpType.Put, next[key]];
    }
  }
  return result;
}
function diffValue(valueA, valueB, legacyAppendMode) {
  if (Object.is(valueA, valueB)) return null;
  if (Array.isArray(valueA) && Array.isArray(valueB)) {
    return diffArray(valueA, valueB, legacyAppendMode);
  } else if (typeof valueA === "string" && typeof valueB === "string") {
    if (!legacyAppendMode && valueB.startsWith(valueA)) {
      const appendedText = valueB.slice(valueA.length);
      return [ValueOpType.Append, appendedText, valueA.length];
    }
    return [ValueOpType.Put, valueB];
  } else if (!valueA || !valueB || typeof valueA !== "object" || typeof valueB !== "object") {
    return (0, import_lodash2.default)(valueA, valueB) ? null : [ValueOpType.Put, valueB];
  } else {
    const diff = diffObject(valueA, valueB, void 0, legacyAppendMode);
    return diff ? [ValueOpType.Patch, diff] : null;
  }
}
function diffArray(prevArray, nextArray, legacyAppendMode) {
  if (Object.is(prevArray, nextArray)) return null;
  if (prevArray.length === nextArray.length) {
    const maxPatchIndexes = Math.max(prevArray.length / 5, 1);
    const toPatchIndexes = [];
    for (let i = 0; i < prevArray.length; i++) {
      if (!(0, import_lodash2.default)(prevArray[i], nextArray[i])) {
        toPatchIndexes.push(i);
        if (toPatchIndexes.length > maxPatchIndexes) {
          return [ValueOpType.Put, nextArray];
        }
      }
    }
    if (toPatchIndexes.length === 0) {
      return null;
    }
    const diff = {};
    for (const i of toPatchIndexes) {
      const prevItem = prevArray[i];
      const nextItem = nextArray[i];
      if (!prevItem || !nextItem) {
        diff[i] = [ValueOpType.Put, nextItem];
      } else if (typeof prevItem === "object" && typeof nextItem === "object") {
        const op = diffValue(prevItem, nextItem, legacyAppendMode);
        if (op) {
          diff[i] = op;
        }
      } else {
        diff[i] = [ValueOpType.Put, nextItem];
      }
    }
    return [ValueOpType.Patch, diff];
  }
  for (let i = 0; i < prevArray.length; i++) {
    if (!(0, import_lodash2.default)(prevArray[i], nextArray[i])) {
      return [ValueOpType.Put, nextArray];
    }
  }
  return [ValueOpType.Append, nextArray.slice(prevArray.length), prevArray.length];
}
function applyObjectDiff(object2, objectDiff) {
  if (!object2 || typeof object2 !== "object") return object2;
  const isArray = Array.isArray(object2);
  let newObject = void 0;
  const set = (k, v) => {
    if (!newObject) {
      if (isArray) {
        newObject = [...object2];
      } else {
        newObject = { ...object2 };
      }
    }
    if (isArray) {
      newObject[Number(k)] = v;
    } else {
      newObject[k] = v;
    }
  };
  for (const [key, op] of Object.entries(objectDiff)) {
    switch (op[0]) {
      case ValueOpType.Put: {
        const value = op[1];
        if (!(0, import_lodash2.default)(object2[key], value)) {
          set(key, value);
        }
        break;
      }
      case ValueOpType.Append: {
        const value = op[1];
        const offset = op[2];
        const currentValue = object2[key];
        if (Array.isArray(currentValue) && Array.isArray(value) && currentValue.length === offset) {
          set(key, [...currentValue, ...value]);
        } else if (typeof currentValue === "string" && typeof value === "string" && currentValue.length === offset) {
          set(key, currentValue + value);
        }
        break;
      }
      case ValueOpType.Patch: {
        if (object2[key] && typeof object2[key] === "object") {
          const diff = op[1];
          const patched = applyObjectDiff(object2[key], diff);
          if (patched !== object2[key]) {
            set(key, patched);
          }
        }
        break;
      }
      case ValueOpType.Delete: {
        if (key in object2) {
          if (!newObject) {
            if (isArray) {
              console.error("Can't delete array item yet (this should never happen)");
              newObject = [...object2];
            } else {
              newObject = { ...object2 };
            }
          }
          delete newObject[key];
        }
      }
    }
  }
  return newObject ?? object2;
}

// node_modules/@tldraw/sync-core/dist-esm/lib/interval.mjs
function interval(cb, timeout) {
  const i = setInterval(cb, timeout);
  return () => clearInterval(i);
}

// node_modules/@tldraw/sync-core/dist-esm/lib/protocol.mjs
var TLSYNC_PROTOCOL_VERSION = 8;
function getTlsyncProtocolVersion() {
  return TLSYNC_PROTOCOL_VERSION;
}
var TLIncompatibilityReason = {
  ClientTooOld: "clientTooOld",
  ServerTooOld: "serverTooOld",
  InvalidRecord: "invalidRecord",
  InvalidOperation: "invalidOperation"
};

// node_modules/@tldraw/sync-core/dist-esm/lib/TLSyncClient.mjs
var TLSyncErrorCloseEventCode = 4099;
var TLSyncErrorCloseEventReason = {
  /** Room or resource not found */
  NOT_FOUND: "NOT_FOUND",
  /** User lacks permission to access the room */
  FORBIDDEN: "FORBIDDEN",
  /** User authentication required or invalid */
  NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
  /** Unexpected server error occurred */
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  /** Client protocol version too old */
  CLIENT_TOO_OLD: "CLIENT_TOO_OLD",
  /** Server protocol version too old */
  SERVER_TOO_OLD: "SERVER_TOO_OLD",
  /** Client sent invalid or corrupted record data */
  INVALID_RECORD: "INVALID_RECORD",
  /** Client exceeded rate limits */
  RATE_LIMITED: "RATE_LIMITED",
  /** Room has reached maximum capacity */
  ROOM_FULL: "ROOM_FULL"
};
var TLSyncError = class extends Error {
  constructor(message, reason) {
    super(message);
    this.reason = reason;
  }
  reason;
};
var PING_INTERVAL = 5e3;
var MAX_TIME_TO_WAIT_FOR_SERVER_INTERACTION_BEFORE_RESETTING_CONNECTION = PING_INTERVAL * 2;

// node_modules/@tldraw/sync-core/dist-esm/lib/ClientWebSocketAdapter.mjs
var INACTIVE_MAX_DELAY = 1e3 * 60 * 5;

// node_modules/@tldraw/tlschema/dist-esm/misc/id-validator.mjs
function idValidator(prefix) {
  return validation_exports.string.refine((id) => {
    if (!id.startsWith(`${prefix}:`)) {
      throw new Error(`${prefix} ID must start with "${prefix}:"`);
    }
    return id;
  });
}

// node_modules/@tldraw/tlschema/dist-esm/assets/TLBaseAsset.mjs
var assetIdValidator = idValidator("asset");
function createAssetValidator(type, props, meta) {
  const propsValidator = props instanceof validation_exports.Validator ? props : props ? validation_exports.object(props) : validation_exports.jsonValue;
  return validation_exports.object({
    id: assetIdValidator,
    typeName: validation_exports.literal("asset"),
    type: validation_exports.literal(type),
    props: propsValidator,
    meta: meta ? validation_exports.object(meta) : validation_exports.jsonValue
  });
}

// node_modules/@tldraw/tlschema/dist-esm/assets/TLBookmarkAsset.mjs
var bookmarkAssetProps = {
  title: validation_exports.string,
  description: validation_exports.string,
  image: validation_exports.string,
  favicon: validation_exports.string,
  src: validation_exports.srcUrl.nullable()
};
var bookmarkAssetValidator = createAssetValidator(
  "bookmark",
  validation_exports.object(bookmarkAssetProps)
);
var Versions = createMigrationIds("com.tldraw.asset.bookmark", {
  MakeUrlsValid: 1,
  AddFavicon: 2
});
var bookmarkAssetMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.asset.bookmark",
  recordType: "asset",
  filter: (asset) => asset.type === "bookmark",
  sequence: [
    {
      id: Versions.MakeUrlsValid,
      up: (asset) => {
        if (!validation_exports.srcUrl.isValid(asset.props.src)) {
          asset.props.src = "";
        }
      },
      down: (_asset) => {
      }
    },
    {
      id: Versions.AddFavicon,
      up: (asset) => {
        if (!validation_exports.srcUrl.isValid(asset.props.favicon)) {
          asset.props.favicon = "";
        }
      },
      down: (asset) => {
        delete asset.props.favicon;
      }
    }
  ]
});

// node_modules/@tldraw/tlschema/dist-esm/assets/TLImageAsset.mjs
var imageAssetProps = {
  w: validation_exports.number,
  h: validation_exports.number,
  name: validation_exports.string,
  isAnimated: validation_exports.boolean,
  mimeType: validation_exports.string.nullable(),
  src: validation_exports.srcUrl.nullable(),
  fileSize: validation_exports.nonZeroNumber.optional(),
  pixelRatio: validation_exports.positiveNumber.optional()
};
var imageAssetValidator = createAssetValidator(
  "image",
  validation_exports.object(imageAssetProps)
);
var Versions2 = createMigrationIds("com.tldraw.asset.image", {
  AddIsAnimated: 1,
  RenameWidthHeight: 2,
  MakeUrlsValid: 3,
  AddFileSize: 4,
  MakeFileSizeOptional: 5,
  AddPixelRatio: 6
});
var imageAssetMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.asset.image",
  recordType: "asset",
  filter: (asset) => asset.type === "image",
  sequence: [
    {
      id: Versions2.AddIsAnimated,
      up: (asset) => {
        asset.props.isAnimated = false;
      },
      down: (asset) => {
        delete asset.props.isAnimated;
      }
    },
    {
      id: Versions2.RenameWidthHeight,
      up: (asset) => {
        asset.props.w = asset.props.width;
        asset.props.h = asset.props.height;
        delete asset.props.width;
        delete asset.props.height;
      },
      down: (asset) => {
        asset.props.width = asset.props.w;
        asset.props.height = asset.props.h;
        delete asset.props.w;
        delete asset.props.h;
      }
    },
    {
      id: Versions2.MakeUrlsValid,
      up: (asset) => {
        if (!validation_exports.srcUrl.isValid(asset.props.src)) {
          asset.props.src = "";
        }
      },
      down: (_asset) => {
      }
    },
    {
      id: Versions2.AddFileSize,
      up: (asset) => {
        asset.props.fileSize = -1;
      },
      down: (asset) => {
        delete asset.props.fileSize;
      }
    },
    {
      id: Versions2.MakeFileSizeOptional,
      up: (asset) => {
        if (asset.props.fileSize === -1) {
          asset.props.fileSize = void 0;
        }
      },
      down: (asset) => {
        if (asset.props.fileSize === void 0) {
          asset.props.fileSize = -1;
        }
      }
    },
    {
      id: Versions2.AddPixelRatio,
      up: (_asset) => {
      },
      down: (asset) => {
        delete asset.props.pixelRatio;
      }
    }
  ]
});

// node_modules/@tldraw/tlschema/dist-esm/assets/TLVideoAsset.mjs
var videoAssetProps = {
  w: validation_exports.number,
  h: validation_exports.number,
  name: validation_exports.string,
  isAnimated: validation_exports.boolean,
  mimeType: validation_exports.string.nullable(),
  src: validation_exports.srcUrl.nullable(),
  fileSize: validation_exports.number.optional()
};
var videoAssetValidator = createAssetValidator(
  "video",
  validation_exports.object(videoAssetProps)
);
var Versions3 = createMigrationIds("com.tldraw.asset.video", {
  AddIsAnimated: 1,
  RenameWidthHeight: 2,
  MakeUrlsValid: 3,
  AddFileSize: 4,
  MakeFileSizeOptional: 5
});
var videoAssetMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.asset.video",
  recordType: "asset",
  filter: (asset) => asset.type === "video",
  sequence: [
    {
      id: Versions3.AddIsAnimated,
      up: (asset) => {
        asset.props.isAnimated = false;
      },
      down: (asset) => {
        delete asset.props.isAnimated;
      }
    },
    {
      id: Versions3.RenameWidthHeight,
      up: (asset) => {
        asset.props.w = asset.props.width;
        asset.props.h = asset.props.height;
        delete asset.props.width;
        delete asset.props.height;
      },
      down: (asset) => {
        asset.props.width = asset.props.w;
        asset.props.height = asset.props.h;
        delete asset.props.w;
        delete asset.props.h;
      }
    },
    {
      id: Versions3.MakeUrlsValid,
      up: (asset) => {
        if (!validation_exports.srcUrl.isValid(asset.props.src)) {
          asset.props.src = "";
        }
      },
      down: (_asset) => {
      }
    },
    {
      id: Versions3.AddFileSize,
      up: (asset) => {
        asset.props.fileSize = -1;
      },
      down: (asset) => {
        delete asset.props.fileSize;
      }
    },
    {
      id: Versions3.MakeFileSizeOptional,
      up: (asset) => {
        if (asset.props.fileSize === -1) {
          asset.props.fileSize = void 0;
        }
      },
      down: (asset) => {
        if (asset.props.fileSize === void 0) {
          asset.props.fileSize = -1;
        }
      }
    }
  ]
});

// node_modules/@tldraw/tlschema/dist-esm/misc/geometry-types.mjs
var vecModelValidator = validation_exports.object({
  x: validation_exports.number,
  y: validation_exports.number,
  z: validation_exports.number.optional()
});
var boxModelValidator = validation_exports.object({
  x: validation_exports.number,
  y: validation_exports.number,
  w: validation_exports.number,
  h: validation_exports.number
});

// node_modules/@tldraw/tlschema/dist-esm/misc/TLOpacity.mjs
var opacityValidator = validation_exports.unitInterval;

// node_modules/@tldraw/tlschema/dist-esm/shapes/TLBaseShape.mjs
var parentIdValidator = validation_exports.string.refine((id) => {
  if (!id.startsWith("page:") && !id.startsWith("shape:")) {
    throw new Error('Parent ID must start with "page:" or "shape:"');
  }
  return id;
});
var shapeIdValidator = idValidator("shape");
function createShapeValidator(type, props, meta) {
  return validation_exports.object({
    id: shapeIdValidator,
    typeName: validation_exports.literal("shape"),
    x: validation_exports.number,
    y: validation_exports.number,
    rotation: validation_exports.number,
    index: validation_exports.indexKey,
    parentId: parentIdValidator,
    type: validation_exports.literal(type),
    isLocked: validation_exports.boolean,
    opacity: opacityValidator,
    props: props ? validation_exports.object(props) : validation_exports.jsonValue,
    meta: meta ? validation_exports.object(meta) : validation_exports.jsonValue
  });
}

// node_modules/@tldraw/tlschema/dist-esm/bindings/TLBaseBinding.mjs
var bindingIdValidator = idValidator("binding");
function createBindingValidator(type, props, meta) {
  return validation_exports.object({
    id: bindingIdValidator,
    typeName: validation_exports.literal("binding"),
    type: validation_exports.literal(type),
    fromId: shapeIdValidator,
    toId: shapeIdValidator,
    props: props ? validation_exports.object(props) : validation_exports.jsonValue,
    meta: meta ? validation_exports.object(meta) : validation_exports.jsonValue
  });
}

// node_modules/@tldraw/tlschema/dist-esm/records/TLBinding.mjs
var rootBindingVersions = createMigrationIds("com.tldraw.binding", {});
var rootBindingMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.binding",
  recordType: "binding",
  sequence: []
});
function createBindingId(id) {
  return `binding:${id ?? uniqueId()}`;
}
function createBindingPropsMigrationSequence(migrations) {
  return migrations;
}
function createBindingPropsMigrationIds(bindingType, ids) {
  return mapObjectMapValues(ids, (_k, v) => `com.tldraw.binding.${bindingType}/${v}`);
}
function createBindingRecordType(bindings) {
  return createRecordType("binding", {
    scope: "document",
    validator: validation_exports.model(
      "binding",
      validation_exports.union(
        "type",
        mapObjectMapValues(
          bindings,
          (type, { props, meta }) => createBindingValidator(type, props, meta)
        )
      )
    )
  }).withDefaultProperties(() => ({
    meta: {}
  }));
}

// node_modules/@tldraw/tlschema/dist-esm/misc/TLRichText.mjs
var richTextValidator = validation_exports.object({
  type: validation_exports.string,
  content: validation_exports.arrayOf(validation_exports.unknown),
  attrs: validation_exports.any.optional()
});
function toRichText(text) {
  const lines = text.split("\n");
  const content = lines.map((text2) => {
    if (!text2) {
      return {
        type: "paragraph"
      };
    }
    return {
      type: "paragraph",
      content: [{ type: "text", text: text2 }]
    };
  });
  return {
    type: "doc",
    content
  };
}

// node_modules/@tldraw/tlschema/dist-esm/styles/StyleProp.mjs
var StyleProp = class _StyleProp {
  /** @internal */
  constructor(id, defaultValue, type) {
    this.id = id;
    this.defaultValue = defaultValue;
    this.type = type;
  }
  id;
  defaultValue;
  type;
  /**
   * Define a new {@link StyleProp}.
   *
   * @param uniqueId - Each StyleProp must have a unique ID. We recommend you prefix this with
   * your app/library name.
   * @param options -
   * - `defaultValue`: The default value for this style prop.
   *
   * - `type`: Optionally, describe what type of data you expect for this style prop.
   *
   * @example
   * ```ts
   * import {T} from '@tldraw/validate'
   * import {StyleProp} from '@tldraw/tlschema'
   *
   * const MyLineWidthProp = StyleProp.define('myApp:lineWidth', {
   *   defaultValue: 1,
   *   type: T.number,
   * })
   * ```
   * @public
   */
  static define(uniqueId3, options) {
    const { defaultValue, type = validation_exports.any } = options;
    return new _StyleProp(uniqueId3, defaultValue, type);
  }
  /**
   * Define a new {@link StyleProp} as a list of possible values.
   *
   * @param uniqueId - Each StyleProp must have a unique ID. We recommend you prefix this with
   * your app/library name.
   * @param options -
   * - `defaultValue`: The default value for this style prop.
   *
   * - `values`: An array of possible values of this style prop.
   *
   * @example
   * ```ts
   * import {StyleProp} from '@tldraw/tlschema'
   *
   * const MySizeProp = StyleProp.defineEnum('myApp:size', {
   *   defaultValue: 'medium',
   *   values: ['small', 'medium', 'large'],
   * })
   * ```
   */
  static defineEnum(uniqueId3, options) {
    const { defaultValue, values } = options;
    return new EnumStyleProp(uniqueId3, defaultValue, values);
  }
  setDefaultValue(value) {
    this.defaultValue = value;
  }
  validate(value) {
    return this.type.validate(value);
  }
  validateUsingKnownGoodVersion(prevValue, newValue) {
    if (this.type.validateUsingKnownGoodVersion) {
      return this.type.validateUsingKnownGoodVersion(prevValue, newValue);
    } else {
      return this.validate(newValue);
    }
  }
};
var EnumStyleProp = class extends StyleProp {
  /** @internal */
  constructor(id, defaultValue, values) {
    super(id, defaultValue, validation_exports.literalEnum(...values));
    this.values = [...values];
  }
  values;
  /**
   * Add new values to this enum style prop at runtime. This is useful for extending
   * the built-in styles with custom values (e.g. adding custom colors). Be sure to
   * also modify the associated types.
   *
   * @param newValues - The new values to add.
   *
   * @public
   */
  addValues(...newValues) {
    for (const v of newValues) {
      if (!this.values.includes(v)) {
        this.values.push(v);
      }
    }
    ;
    this.type = validation_exports.literalEnum(...this.values);
  }
  /**
   * Remove values from this enum style prop at runtime. This is useful for narrowing
   * the built-in styles with custom values (e.g. adding custom colors). Be sure to
   * also modify the associated types.
   *
   * @param valuesToRemove - The values to remove.
   *
   * @public
   */
  removeValues(...valuesToRemove) {
    for (const v of valuesToRemove) {
      if (this.values.includes(v)) {
        this.values.splice(this.values.indexOf(v), 1);
      }
    }
    ;
    this.type = validation_exports.literalEnum(...this.values);
  }
};

// node_modules/@tldraw/tlschema/dist-esm/records/TLShape.mjs
var rootShapeVersions = createMigrationIds("com.tldraw.shape", {
  AddIsLocked: 1,
  HoistOpacity: 2,
  AddMeta: 3,
  AddWhite: 4
});
var rootShapeMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.shape",
  recordType: "shape",
  sequence: [
    {
      id: rootShapeVersions.AddIsLocked,
      up: (record) => {
        record.isLocked = false;
      },
      down: (record) => {
        delete record.isLocked;
      }
    },
    {
      id: rootShapeVersions.HoistOpacity,
      up: (record) => {
        record.opacity = Number(record.props.opacity ?? "1");
        delete record.props.opacity;
      },
      down: (record) => {
        const opacity = record.opacity;
        delete record.opacity;
        record.props.opacity = opacity < 0.175 ? "0.1" : opacity < 0.375 ? "0.25" : opacity < 0.625 ? "0.5" : opacity < 0.875 ? "0.75" : "1";
      }
    },
    {
      id: rootShapeVersions.AddMeta,
      up: (record) => {
        record.meta = {};
      }
    },
    {
      id: rootShapeVersions.AddWhite,
      up: (_record) => {
      },
      down: (record) => {
        if (record.props.color === "white") {
          record.props.color = "black";
        }
      }
    }
  ]
});
function getShapePropKeysByStyle(props) {
  const propKeysByStyle = /* @__PURE__ */ new Map();
  for (const [key, prop] of Object.entries(props)) {
    if (prop instanceof StyleProp) {
      if (propKeysByStyle.has(prop)) {
        throw new Error(
          `Duplicate style prop ${prop.id}. Each style prop can only be used once within a shape.`
        );
      }
      propKeysByStyle.set(prop, key);
    }
  }
  return propKeysByStyle;
}
function createShapePropsMigrationSequence(migrations) {
  return migrations;
}
function createShapePropsMigrationIds(shapeType, ids) {
  return mapObjectMapValues(ids, (_k, v) => `com.tldraw.shape.${shapeType}/${v}`);
}
function createShapeRecordType(shapes) {
  return createRecordType("shape", {
    scope: "document",
    validator: validation_exports.model(
      "shape",
      validation_exports.union(
        "type",
        mapObjectMapValues(
          shapes,
          (type, { props, meta }) => createShapeValidator(type, props, meta)
        )
      )
    )
  }).withDefaultProperties(() => ({
    x: 0,
    y: 0,
    rotation: 0,
    isLocked: false,
    opacity: 1,
    meta: {}
  }));
}

// node_modules/@tldraw/tlschema/dist-esm/recordsWithProps.mjs
function processPropsMigrations(typeName, records2) {
  const result = [];
  for (const [subType, { migrations }] of Object.entries(records2)) {
    const sequenceId = `com.tldraw.${typeName}.${subType}`;
    if (!migrations) {
      result.push(
        createMigrationSequence({
          sequenceId,
          retroactive: true,
          sequence: []
        })
      );
    } else if ("sequenceId" in migrations) {
      assert(
        sequenceId === migrations.sequenceId,
        `sequenceId mismatch for ${subType} ${RecordType} migrations. Expected '${sequenceId}', got '${migrations.sequenceId}'`
      );
      result.push(migrations);
    } else if ("sequence" in migrations) {
      result.push(
        createMigrationSequence({
          sequenceId,
          retroactive: true,
          sequence: migrations.sequence.map(
            (m) => "id" in m ? createPropsMigration(typeName, subType, m) : m
          )
        })
      );
    } else {
      result.push(
        createMigrationSequence({
          sequenceId,
          retroactive: true,
          sequence: Object.keys(migrations.migrators).map((k) => Number(k)).sort((a, b) => a - b).map(
            (version) => ({
              id: `${sequenceId}/${version}`,
              scope: "record",
              filter: (r) => r.typeName === typeName && r.type === subType,
              up: (record) => {
                const result2 = migrations.migrators[version].up(record);
                if (result2) {
                  return result2;
                }
              },
              down: (record) => {
                const result2 = migrations.migrators[version].down(record);
                if (result2) {
                  return result2;
                }
              }
            })
          )
        })
      );
    }
  }
  return result;
}
function createPropsMigration(typeName, subType, m) {
  return {
    id: m.id,
    dependsOn: m.dependsOn,
    scope: "record",
    filter: (r) => r.typeName === typeName && r.type === subType,
    up: (record) => {
      const result = m.up(record.props);
      if (result) {
        record.props = result;
      }
    },
    down: typeof m.down === "function" ? (record) => {
      const result = m.down(record.props);
      if (result) {
        record.props = result;
      }
    } : void 0
  };
}

// node_modules/@tldraw/tlschema/dist-esm/styles/TLColorStyle.mjs
var defaultColorNames = [
  "black",
  "grey",
  "light-violet",
  "violet",
  "blue",
  "light-blue",
  "yellow",
  "orange",
  "green",
  "light-green",
  "light-red",
  "red",
  "white"
];
var DefaultColorStyle = StyleProp.defineEnum("tldraw:color", {
  defaultValue: "black",
  values: defaultColorNames
});
var DefaultLabelColorStyle = StyleProp.defineEnum("tldraw:labelColor", {
  defaultValue: "black",
  values: defaultColorNames
});

// node_modules/@tldraw/tlschema/dist-esm/styles/TLDashStyle.mjs
var DefaultDashStyle = StyleProp.defineEnum("tldraw:dash", {
  defaultValue: "draw",
  values: ["draw", "solid", "dashed", "dotted", "none"]
});

// node_modules/@tldraw/tlschema/dist-esm/styles/TLFillStyle.mjs
var DefaultFillStyle = StyleProp.defineEnum("tldraw:fill", {
  defaultValue: "none",
  values: ["none", "semi", "solid", "pattern", "fill", "lined-fill"]
});

// node_modules/@tldraw/tlschema/dist-esm/styles/TLFontStyle.mjs
var DefaultFontStyle = StyleProp.defineEnum("tldraw:font", {
  defaultValue: "draw",
  values: ["draw", "sans", "serif", "mono"]
});

// node_modules/@tldraw/tlschema/dist-esm/styles/TLSizeStyle.mjs
var DefaultSizeStyle = StyleProp.defineEnum("tldraw:size", {
  defaultValue: "m",
  values: ["s", "m", "l", "xl"]
});

// node_modules/@tldraw/tlschema/dist-esm/shapes/TLArrowShape.mjs
var arrowKinds = ["arc", "elbow"];
var ArrowShapeKindStyle = StyleProp.defineEnum("tldraw:arrowKind", {
  defaultValue: "arc",
  values: arrowKinds
});
var arrowheadTypes = [
  "arrow",
  "triangle",
  "square",
  "dot",
  "pipe",
  "diamond",
  "inverted",
  "bar",
  "none"
];
var ArrowShapeArrowheadStartStyle = StyleProp.defineEnum("tldraw:arrowheadStart", {
  defaultValue: "none",
  values: arrowheadTypes
});
var ArrowShapeArrowheadEndStyle = StyleProp.defineEnum("tldraw:arrowheadEnd", {
  defaultValue: "arrow",
  values: arrowheadTypes
});
var arrowShapeProps = {
  kind: ArrowShapeKindStyle,
  labelColor: DefaultLabelColorStyle,
  color: DefaultColorStyle,
  fill: DefaultFillStyle,
  dash: DefaultDashStyle,
  size: DefaultSizeStyle,
  arrowheadStart: ArrowShapeArrowheadStartStyle,
  arrowheadEnd: ArrowShapeArrowheadEndStyle,
  font: DefaultFontStyle,
  start: vecModelValidator,
  end: vecModelValidator,
  bend: validation_exports.number,
  richText: richTextValidator,
  labelPosition: validation_exports.number,
  scale: validation_exports.nonZeroNumber,
  elbowMidPoint: validation_exports.number
};
var arrowShapeVersions = createShapePropsMigrationIds("arrow", {
  AddLabelColor: 1,
  AddIsPrecise: 2,
  AddLabelPosition: 3,
  ExtractBindings: 4,
  AddScale: 5,
  AddElbow: 6,
  AddRichText: 7,
  AddRichTextAttrs: 8
});
function propsMigration(migration) {
  return createPropsMigration("shape", "arrow", migration);
}
var arrowShapeMigrations = createMigrationSequence({
  sequenceId: "com.tldraw.shape.arrow",
  retroactive: false,
  sequence: [
    propsMigration({
      id: arrowShapeVersions.AddLabelColor,
      up: (props) => {
        props.labelColor = "black";
      },
      down: "retired"
    }),
    propsMigration({
      id: arrowShapeVersions.AddIsPrecise,
      up: ({ start, end }) => {
        if (start.type === "binding") {
          start.isPrecise = !(start.normalizedAnchor.x === 0.5 && start.normalizedAnchor.y === 0.5);
        }
        if (end.type === "binding") {
          end.isPrecise = !(end.normalizedAnchor.x === 0.5 && end.normalizedAnchor.y === 0.5);
        }
      },
      down: ({ start, end }) => {
        if (start.type === "binding") {
          if (!start.isPrecise) {
            start.normalizedAnchor = { x: 0.5, y: 0.5 };
          }
          delete start.isPrecise;
        }
        if (end.type === "binding") {
          if (!end.isPrecise) {
            end.normalizedAnchor = { x: 0.5, y: 0.5 };
          }
          delete end.isPrecise;
        }
      }
    }),
    propsMigration({
      id: arrowShapeVersions.AddLabelPosition,
      up: (props) => {
        props.labelPosition = 0.5;
      },
      down: (props) => {
        delete props.labelPosition;
      }
    }),
    {
      id: arrowShapeVersions.ExtractBindings,
      scope: "storage",
      up: (storage) => {
        const updates = [];
        for (const record of storage.values()) {
          if (record.typeName !== "shape" || record.type !== "arrow") continue;
          const arrow = record;
          const newArrow = structuredClone(arrow);
          const { start, end } = arrow.props;
          if (start.type === "binding") {
            const id = createBindingId();
            const binding = {
              typeName: "binding",
              id,
              type: "arrow",
              fromId: arrow.id,
              toId: start.boundShapeId,
              meta: {},
              props: {
                terminal: "start",
                normalizedAnchor: start.normalizedAnchor,
                isExact: start.isExact,
                isPrecise: start.isPrecise
              }
            };
            updates.push([id, binding]);
            newArrow.props.start = { x: 0, y: 0 };
          } else {
            delete newArrow.props.start.type;
          }
          if (end.type === "binding") {
            const id = createBindingId();
            const binding = {
              typeName: "binding",
              id,
              type: "arrow",
              fromId: arrow.id,
              toId: end.boundShapeId,
              meta: {},
              props: {
                terminal: "end",
                normalizedAnchor: end.normalizedAnchor,
                isExact: end.isExact,
                isPrecise: end.isPrecise
              }
            };
            updates.push([id, binding]);
            newArrow.props.end = { x: 0, y: 0 };
          } else {
            delete newArrow.props.end.type;
          }
          updates.push([arrow.id, newArrow]);
        }
        for (const [id, record] of updates) {
          storage.set(id, record);
        }
      }
    },
    propsMigration({
      id: arrowShapeVersions.AddScale,
      up: (props) => {
        props.scale = 1;
      },
      down: (props) => {
        delete props.scale;
      }
    }),
    propsMigration({
      id: arrowShapeVersions.AddElbow,
      up: (props) => {
        props.kind = "arc";
        props.elbowMidPoint = 0.5;
      },
      down: (props) => {
        delete props.kind;
        delete props.elbowMidPoint;
      }
    }),
    propsMigration({
      id: arrowShapeVersions.AddRichText,
      up: (props) => {
        props.richText = toRichText(props.text);
        delete props.text;
      }
      // N.B. Explicitly no down state so that we force clients to update.
      // down: (props) => {
      // 	delete props.richText
      // },
    }),
    propsMigration({
      id: arrowShapeVersions.AddRichTextAttrs,
      up: (_props) => {
      },
      down: (props) => {
        if (props.richText && "attrs" in props.richText) {
          delete props.richText.attrs;
        }
      }
    })
  ]
});

// node_modules/@tldraw/tlschema/dist-esm/bindings/TLArrowBinding.mjs
var ElbowArrowSnap = validation_exports.literalEnum("center", "edge-point", "edge", "none");
var arrowBindingProps = {
  terminal: validation_exports.literalEnum("start", "end"),
  normalizedAnchor: vecModelValidator,
  isExact: validation_exports.boolean,
  isPrecise: validation_exports.boolean,
  snap: ElbowArrowSnap
};
var arrowBindingVersions = createBindingPropsMigrationIds("arrow", {
  AddSnap: 1
});
var arrowBindingMigrations = createBindingPropsMigrationSequence({
  sequence: [
    { dependsOn: [arrowShapeVersions.ExtractBindings] },
    {
      id: arrowBindingVersions.AddSnap,
      up: (props) => {
        props.snap = "none";
      },
      down: (props) => {
        delete props.snap;
      }
    }
  ]
});

// node_modules/@tldraw/tlschema/dist-esm/records/TLCamera.mjs
var cameraValidator = validation_exports.model(
  "camera",
  validation_exports.object({
    typeName: validation_exports.literal("camera"),
    id: idValidator("camera"),
    x: validation_exports.number,
    y: validation_exports.number,
    z: validation_exports.number,
    meta: validation_exports.jsonValue
  })
);
var cameraVersions = createMigrationIds("com.tldraw.camera", {
  AddMeta: 1
});
var cameraMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.camera",
  recordType: "camera",
  sequence: [
    {
      id: cameraVersions.AddMeta,
      up: (record) => {
        ;
        record.meta = {};
      }
    }
  ]
});
var CameraRecordType = createRecordType("camera", {
  validator: cameraValidator,
  scope: "session"
}).withDefaultProperties(
  () => ({
    x: 0,
    y: 0,
    z: 1,
    meta: {}
  })
);

// node_modules/@tldraw/tlschema/dist-esm/misc/TLCursor.mjs
var TL_CURSOR_TYPES = /* @__PURE__ */ new Set([
  "none",
  "default",
  "pointer",
  "cross",
  "grab",
  "rotate",
  "grabbing",
  "resize-edge",
  "resize-corner",
  "text",
  "move",
  "ew-resize",
  "ns-resize",
  "nesw-resize",
  "nwse-resize",
  "nesw-rotate",
  "nwse-rotate",
  "swne-rotate",
  "senw-rotate",
  "zoom-in",
  "zoom-out"
]);
var cursorTypeValidator = validation_exports.setEnum(TL_CURSOR_TYPES);
var cursorValidator = validation_exports.object({
  type: cursorTypeValidator,
  rotation: validation_exports.number
});

// node_modules/@tldraw/tlschema/dist-esm/misc/TLColor.mjs
var TL_CANVAS_UI_COLOR_TYPES = /* @__PURE__ */ new Set([
  "accent",
  "white",
  "black",
  "selection-stroke",
  "selection-fill",
  "laser",
  "muted-1"
]);
var canvasUiColorTypeValidator = validation_exports.setEnum(TL_CANVAS_UI_COLOR_TYPES);

// node_modules/@tldraw/tlschema/dist-esm/misc/TLScribble.mjs
var TL_SCRIBBLE_STATES = /* @__PURE__ */ new Set([
  "starting",
  "paused",
  "active",
  "complete",
  "stopping"
]);
var scribbleValidator = validation_exports.object({
  id: validation_exports.string,
  points: validation_exports.arrayOf(vecModelValidator),
  size: validation_exports.positiveNumber,
  color: canvasUiColorTypeValidator,
  opacity: validation_exports.number,
  state: validation_exports.setEnum(TL_SCRIBBLE_STATES),
  delay: validation_exports.number,
  shrink: validation_exports.number,
  taper: validation_exports.boolean
});

// node_modules/@tldraw/tlschema/dist-esm/records/TLPage.mjs
var pageIdValidator = idValidator("page");
var pageValidator = validation_exports.model(
  "page",
  validation_exports.object({
    typeName: validation_exports.literal("page"),
    id: pageIdValidator,
    name: validation_exports.string,
    index: validation_exports.indexKey,
    meta: validation_exports.jsonValue
  })
);
var pageVersions = createMigrationIds("com.tldraw.page", {
  AddMeta: 1
});
var pageMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.page",
  recordType: "page",
  sequence: [
    {
      id: pageVersions.AddMeta,
      up: (record) => {
        record.meta = {};
      }
    }
  ]
});
var PageRecordType = createRecordType("page", {
  validator: pageValidator,
  scope: "document"
}).withDefaultProperties(() => ({
  meta: {}
}));

// node_modules/@tldraw/tlschema/dist-esm/records/TLUser.mjs
var userIdValidator = idValidator("user");
var userVersions = createMigrationIds("com.tldraw.user", {
  Initial: 1
});
var userMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.user",
  recordType: "user",
  sequence: [
    {
      id: userVersions.Initial,
      up: (_record) => {
      }
    }
  ]
});
function createUserRecordType(config) {
  const metaConfig = config?.meta;
  const metaValidator = metaConfig ? validation_exports.object(
    Object.fromEntries(
      Object.entries(metaConfig).map(([key, v]) => [
        key,
        new validation_exports.Validator((value) => {
          if (value === void 0) return void 0;
          return v.validate(value);
        })
      ])
    )
  ).allowUnknownProperties() : validation_exports.jsonValue;
  const validator = validation_exports.model(
    "user",
    validation_exports.object({
      typeName: validation_exports.literal("user"),
      id: userIdValidator,
      name: validation_exports.string,
      color: validation_exports.string,
      imageUrl: validation_exports.string,
      meta: metaValidator
    })
  );
  return createRecordType("user", {
    validator,
    scope: "document"
  }).withDefaultProperties(() => ({
    name: "",
    color: "",
    imageUrl: "",
    meta: {}
  }));
}
var userValidator = validation_exports.model(
  "user",
  validation_exports.object({
    typeName: validation_exports.literal("user"),
    id: userIdValidator,
    name: validation_exports.string,
    color: validation_exports.string,
    imageUrl: validation_exports.string,
    meta: validation_exports.jsonValue
  })
);
var UserRecordType = createUserRecordType();

// node_modules/@tldraw/tlschema/dist-esm/records/TLInstance.mjs
var instanceIdValidator = idValidator("instance");
function createInstanceRecordType(stylesById) {
  const stylesForNextShapeValidators = {};
  for (const [id, style] of stylesById) {
    stylesForNextShapeValidators[id] = validation_exports.optional(style);
  }
  const instanceTypeValidator = validation_exports.model(
    "instance",
    validation_exports.object({
      typeName: validation_exports.literal("instance"),
      id: idValidator("instance"),
      currentPageId: pageIdValidator,
      followingUserId: userIdValidator.nullable(),
      brush: boxModelValidator.nullable(),
      opacityForNextShape: opacityValidator,
      stylesForNextShape: validation_exports.object(stylesForNextShapeValidators),
      cursor: cursorValidator,
      scribbles: validation_exports.arrayOf(scribbleValidator),
      isFocusMode: validation_exports.boolean,
      isDebugMode: validation_exports.boolean,
      isToolLocked: validation_exports.boolean,
      exportBackground: validation_exports.boolean,
      screenBounds: boxModelValidator,
      insets: validation_exports.arrayOf(validation_exports.boolean),
      zoomBrush: boxModelValidator.nullable(),
      isPenMode: validation_exports.boolean,
      isGridMode: validation_exports.boolean,
      chatMessage: validation_exports.string,
      isChatting: validation_exports.boolean,
      highlightedUserIds: validation_exports.arrayOf(userIdValidator),
      isFocused: validation_exports.boolean,
      devicePixelRatio: validation_exports.number,
      isCoarsePointer: validation_exports.boolean,
      isHoveringCanvas: validation_exports.boolean.nullable(),
      openMenus: validation_exports.arrayOf(validation_exports.string),
      isChangingStyle: validation_exports.boolean,
      isReadonly: validation_exports.boolean,
      meta: validation_exports.jsonValue,
      duplicateProps: validation_exports.object({
        shapeIds: validation_exports.arrayOf(idValidator("shape")),
        offset: validation_exports.object({
          x: validation_exports.number,
          y: validation_exports.number
        })
      }).nullable(),
      cameraState: validation_exports.literalEnum("idle", "moving")
    })
  );
  return createRecordType("instance", {
    validator: instanceTypeValidator,
    scope: "session",
    ephemeralKeys: {
      currentPageId: false,
      meta: false,
      followingUserId: true,
      opacityForNextShape: true,
      stylesForNextShape: true,
      brush: true,
      cursor: true,
      scribbles: true,
      isFocusMode: true,
      isDebugMode: true,
      isToolLocked: true,
      exportBackground: true,
      screenBounds: true,
      insets: true,
      zoomBrush: true,
      isPenMode: true,
      isGridMode: true,
      chatMessage: true,
      isChatting: true,
      highlightedUserIds: true,
      isFocused: true,
      devicePixelRatio: true,
      isCoarsePointer: true,
      isHoveringCanvas: true,
      openMenus: true,
      isChangingStyle: true,
      isReadonly: true,
      duplicateProps: true,
      cameraState: true
    }
  }).withDefaultProperties(
    () => ({
      followingUserId: null,
      opacityForNextShape: 1,
      stylesForNextShape: {},
      brush: null,
      scribbles: [],
      cursor: {
        type: "default",
        rotation: 0
      },
      isFocusMode: false,
      exportBackground: false,
      isDebugMode: false,
      isToolLocked: false,
      screenBounds: { x: 0, y: 0, w: 1080, h: 720 },
      insets: [false, false, false, false],
      zoomBrush: null,
      isGridMode: false,
      isPenMode: false,
      chatMessage: "",
      isChatting: false,
      highlightedUserIds: [],
      isFocused: false,
      devicePixelRatio: typeof window === "undefined" ? 1 : window.devicePixelRatio,
      isCoarsePointer: false,
      isHoveringCanvas: null,
      openMenus: [],
      isChangingStyle: false,
      isReadonly: false,
      meta: {},
      duplicateProps: null,
      cameraState: "idle"
    })
  );
}
var instanceVersions = createMigrationIds("com.tldraw.instance", {
  AddTransparentExportBgs: 1,
  RemoveDialog: 2,
  AddToolLockMode: 3,
  RemoveExtraPropsForNextShape: 4,
  AddLabelColor: 5,
  AddFollowingUserId: 6,
  RemoveAlignJustify: 7,
  AddZoom: 8,
  AddVerticalAlign: 9,
  AddScribbleDelay: 10,
  RemoveUserId: 11,
  AddIsPenModeAndIsGridMode: 12,
  HoistOpacity: 13,
  AddChat: 14,
  AddHighlightedUserIds: 15,
  ReplacePropsForNextShapeWithStylesForNextShape: 16,
  AddMeta: 17,
  RemoveCursorColor: 18,
  AddLonelyProperties: 19,
  ReadOnlyReadonly: 20,
  AddHoveringCanvas: 21,
  AddScribbles: 22,
  AddInset: 23,
  AddDuplicateProps: 24,
  RemoveCanMoveCamera: 25,
  AddCameraState: 26
});
var instanceMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.instance",
  recordType: "instance",
  sequence: [
    {
      id: instanceVersions.AddTransparentExportBgs,
      up: (instance) => {
        return { ...instance, exportBackground: true };
      }
    },
    {
      id: instanceVersions.RemoveDialog,
      up: ({ dialog: _, ...instance }) => {
        return instance;
      }
    },
    {
      id: instanceVersions.AddToolLockMode,
      up: (instance) => {
        return { ...instance, isToolLocked: false };
      }
    },
    {
      id: instanceVersions.RemoveExtraPropsForNextShape,
      up: ({ propsForNextShape, ...instance }) => {
        return {
          ...instance,
          propsForNextShape: Object.fromEntries(
            Object.entries(propsForNextShape).filter(
              ([key]) => [
                "color",
                "labelColor",
                "dash",
                "fill",
                "size",
                "font",
                "align",
                "verticalAlign",
                "icon",
                "geo",
                "arrowheadStart",
                "arrowheadEnd",
                "spline"
              ].includes(key)
            )
          )
        };
      }
    },
    {
      id: instanceVersions.AddLabelColor,
      up: ({ propsForNextShape, ...instance }) => {
        return {
          ...instance,
          propsForNextShape: {
            ...propsForNextShape,
            labelColor: "black"
          }
        };
      }
    },
    {
      id: instanceVersions.AddFollowingUserId,
      up: (instance) => {
        return { ...instance, followingUserId: null };
      }
    },
    {
      id: instanceVersions.RemoveAlignJustify,
      up: (instance) => {
        let newAlign = instance.propsForNextShape.align;
        if (newAlign === "justify") {
          newAlign = "start";
        }
        return {
          ...instance,
          propsForNextShape: {
            ...instance.propsForNextShape,
            align: newAlign
          }
        };
      }
    },
    {
      id: instanceVersions.AddZoom,
      up: (instance) => {
        return { ...instance, zoomBrush: null };
      }
    },
    {
      id: instanceVersions.AddVerticalAlign,
      up: (instance) => {
        return {
          ...instance,
          propsForNextShape: {
            ...instance.propsForNextShape,
            verticalAlign: "middle"
          }
        };
      }
    },
    {
      id: instanceVersions.AddScribbleDelay,
      up: (instance) => {
        if (instance.scribble !== null) {
          return { ...instance, scribble: { ...instance.scribble, delay: 0 } };
        }
        return { ...instance };
      }
    },
    {
      id: instanceVersions.RemoveUserId,
      up: ({ userId: _, ...instance }) => {
        return instance;
      }
    },
    {
      id: instanceVersions.AddIsPenModeAndIsGridMode,
      up: (instance) => {
        return { ...instance, isPenMode: false, isGridMode: false };
      }
    },
    {
      id: instanceVersions.HoistOpacity,
      up: ({ propsForNextShape: { opacity, ...propsForNextShape }, ...instance }) => {
        return { ...instance, opacityForNextShape: Number(opacity ?? "1"), propsForNextShape };
      }
    },
    {
      id: instanceVersions.AddChat,
      up: (instance) => {
        return { ...instance, chatMessage: "", isChatting: false };
      }
    },
    {
      id: instanceVersions.AddHighlightedUserIds,
      up: (instance) => {
        return { ...instance, highlightedUserIds: [] };
      }
    },
    {
      id: instanceVersions.ReplacePropsForNextShapeWithStylesForNextShape,
      up: ({ propsForNextShape: _, ...instance }) => {
        return { ...instance, stylesForNextShape: {} };
      }
    },
    {
      id: instanceVersions.AddMeta,
      up: (record) => {
        return {
          ...record,
          meta: {}
        };
      }
    },
    {
      id: instanceVersions.RemoveCursorColor,
      up: (record) => {
        const { color: _, ...cursor } = record.cursor;
        return {
          ...record,
          cursor
        };
      }
    },
    {
      id: instanceVersions.AddLonelyProperties,
      up: (record) => {
        return {
          ...record,
          canMoveCamera: true,
          isFocused: false,
          devicePixelRatio: 1,
          isCoarsePointer: false,
          openMenus: [],
          isChangingStyle: false,
          isReadOnly: false
        };
      }
    },
    {
      id: instanceVersions.ReadOnlyReadonly,
      up: ({ isReadOnly: _isReadOnly, ...record }) => {
        return {
          ...record,
          isReadonly: _isReadOnly
        };
      }
    },
    {
      id: instanceVersions.AddHoveringCanvas,
      up: (record) => {
        return {
          ...record,
          isHoveringCanvas: null
        };
      }
    },
    {
      id: instanceVersions.AddScribbles,
      up: ({ scribble: _, ...record }) => {
        return {
          ...record,
          scribbles: []
        };
      }
    },
    {
      id: instanceVersions.AddInset,
      up: (record) => {
        return {
          ...record,
          insets: [false, false, false, false]
        };
      },
      down: ({ insets: _, ...record }) => {
        return {
          ...record
        };
      }
    },
    {
      id: instanceVersions.AddDuplicateProps,
      up: (record) => {
        return {
          ...record,
          duplicateProps: null
        };
      },
      down: ({ duplicateProps: _, ...record }) => {
        return {
          ...record
        };
      }
    },
    {
      id: instanceVersions.RemoveCanMoveCamera,
      up: ({ canMoveCamera: _, ...record }) => {
        return {
          ...record
        };
      },
      down: (instance) => {
        return { ...instance, canMoveCamera: true };
      }
    },
    {
      id: instanceVersions.AddCameraState,
      up: (record) => {
        return { ...record, cameraState: "idle" };
      },
      down: ({ cameraState: _, ...record }) => {
        return record;
      }
    }
  ]
});
var TLINSTANCE_ID = "instance:instance";

// node_modules/@tldraw/tlschema/dist-esm/records/TLPageState.mjs
var instancePageStateValidator = validation_exports.model(
  "instance_page_state",
  validation_exports.object({
    typeName: validation_exports.literal("instance_page_state"),
    id: idValidator("instance_page_state"),
    pageId: pageIdValidator,
    selectedShapeIds: validation_exports.arrayOf(shapeIdValidator),
    hintingShapeIds: validation_exports.arrayOf(shapeIdValidator),
    erasingShapeIds: validation_exports.arrayOf(shapeIdValidator),
    hoveredShapeId: shapeIdValidator.nullable(),
    editingShapeId: shapeIdValidator.nullable(),
    croppingShapeId: shapeIdValidator.nullable(),
    focusedGroupId: shapeIdValidator.nullable(),
    meta: validation_exports.jsonValue
  })
);
var instancePageStateVersions = createMigrationIds("com.tldraw.instance_page_state", {
  AddCroppingId: 1,
  RemoveInstanceIdAndCameraId: 2,
  AddMeta: 3,
  RenameProperties: 4,
  RenamePropertiesAgain: 5
});
var instancePageStateMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.instance_page_state",
  recordType: "instance_page_state",
  sequence: [
    {
      id: instancePageStateVersions.AddCroppingId,
      up(instance) {
        instance.croppingShapeId = null;
      }
    },
    {
      id: instancePageStateVersions.RemoveInstanceIdAndCameraId,
      up(instance) {
        delete instance.instanceId;
        delete instance.cameraId;
      }
    },
    {
      id: instancePageStateVersions.AddMeta,
      up: (record) => {
        record.meta = {};
      }
    },
    {
      id: instancePageStateVersions.RenameProperties,
      // this migration is cursed: it was written wrong and doesn't do anything.
      // rather than replace it, I've added another migration below that fixes it.
      up: (_record) => {
      },
      down: (_record) => {
      }
    },
    {
      id: instancePageStateVersions.RenamePropertiesAgain,
      up: (record) => {
        record.selectedShapeIds = record.selectedIds;
        delete record.selectedIds;
        record.hintingShapeIds = record.hintingIds;
        delete record.hintingIds;
        record.erasingShapeIds = record.erasingIds;
        delete record.erasingIds;
        record.hoveredShapeId = record.hoveredId;
        delete record.hoveredId;
        record.editingShapeId = record.editingId;
        delete record.editingId;
        record.croppingShapeId = record.croppingShapeId ?? record.croppingId ?? null;
        delete record.croppingId;
        record.focusedGroupId = record.focusLayerId;
        delete record.focusLayerId;
      },
      down: (record) => {
        record.selectedIds = record.selectedShapeIds;
        delete record.selectedShapeIds;
        record.hintingIds = record.hintingShapeIds;
        delete record.hintingShapeIds;
        record.erasingIds = record.erasingShapeIds;
        delete record.erasingShapeIds;
        record.hoveredId = record.hoveredShapeId;
        delete record.hoveredShapeId;
        record.editingId = record.editingShapeId;
        delete record.editingShapeId;
        record.croppingId = record.croppingShapeId;
        delete record.croppingShapeId;
        record.focusLayerId = record.focusedGroupId;
        delete record.focusedGroupId;
      }
    }
  ]
});
var InstancePageStateRecordType = createRecordType(
  "instance_page_state",
  {
    validator: instancePageStateValidator,
    scope: "session",
    ephemeralKeys: {
      pageId: false,
      selectedShapeIds: false,
      // editingShapeId is set with `history: 'ignore'`, so entering the editing
      // state is never undoable. Marking it ephemeral keeps undo/redo from
      // reapplying a stale editingShapeId (e.g. after a shape it pointed at was
      // deleted), which could leave the editor pointing at a missing shape.
      editingShapeId: true,
      croppingShapeId: false,
      meta: false,
      hintingShapeIds: true,
      erasingShapeIds: true,
      hoveredShapeId: true,
      focusedGroupId: true
    }
  }
).withDefaultProperties(
  () => ({
    editingShapeId: null,
    croppingShapeId: null,
    selectedShapeIds: [],
    hoveredShapeId: null,
    erasingShapeIds: [],
    hintingShapeIds: [],
    focusedGroupId: null,
    meta: {}
  })
);

// node_modules/@tldraw/tlschema/dist-esm/records/TLPointer.mjs
var pointerValidator = validation_exports.model(
  "pointer",
  validation_exports.object({
    typeName: validation_exports.literal("pointer"),
    id: idValidator("pointer"),
    x: validation_exports.number,
    y: validation_exports.number,
    lastActivityTimestamp: validation_exports.number,
    meta: validation_exports.jsonValue
  })
);
var pointerVersions = createMigrationIds("com.tldraw.pointer", {
  AddMeta: 1
});
var pointerMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.pointer",
  recordType: "pointer",
  sequence: [
    {
      id: pointerVersions.AddMeta,
      up: (record) => {
        record.meta = {};
      }
    }
  ]
});
var PointerRecordType = createRecordType("pointer", {
  validator: pointerValidator,
  scope: "session"
}).withDefaultProperties(
  () => ({
    x: 0,
    y: 0,
    lastActivityTimestamp: 0,
    meta: {}
  })
);
var TLPOINTER_ID = PointerRecordType.createId("pointer");

// node_modules/@tldraw/tlschema/dist-esm/records/TLPresence.mjs
var instancePresenceValidator = validation_exports.model(
  "instance_presence",
  validation_exports.object({
    typeName: validation_exports.literal("instance_presence"),
    id: idValidator("instance_presence"),
    userId: userIdValidator,
    userName: validation_exports.string,
    lastActivityTimestamp: validation_exports.number.nullable(),
    followingUserId: userIdValidator.nullable(),
    cursor: validation_exports.object({
      x: validation_exports.number,
      y: validation_exports.number,
      type: cursorTypeValidator,
      rotation: validation_exports.number
    }).nullable(),
    color: validation_exports.string,
    camera: validation_exports.object({
      x: validation_exports.number,
      y: validation_exports.number,
      z: validation_exports.number
    }).nullable(),
    screenBounds: boxModelValidator.nullable(),
    selectedShapeIds: validation_exports.arrayOf(idValidator("shape")),
    currentPageId: idValidator("page"),
    brush: boxModelValidator.nullable(),
    scribbles: validation_exports.arrayOf(scribbleValidator),
    chatMessage: validation_exports.string,
    meta: validation_exports.jsonValue
  })
);
var instancePresenceVersions = createMigrationIds("com.tldraw.instance_presence", {
  AddScribbleDelay: 1,
  RemoveInstanceId: 2,
  AddChatMessage: 3,
  AddMeta: 4,
  RenameSelectedShapeIds: 5,
  NullableCameraCursor: 6
});
var instancePresenceMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.instance_presence",
  recordType: "instance_presence",
  sequence: [
    {
      id: instancePresenceVersions.AddScribbleDelay,
      up: (instance) => {
        if (instance.scribble !== null) {
          instance.scribble.delay = 0;
        }
      }
    },
    {
      id: instancePresenceVersions.RemoveInstanceId,
      up: (instance) => {
        delete instance.instanceId;
      }
    },
    {
      id: instancePresenceVersions.AddChatMessage,
      up: (instance) => {
        instance.chatMessage = "";
      }
    },
    {
      id: instancePresenceVersions.AddMeta,
      up: (record) => {
        record.meta = {};
      }
    },
    {
      id: instancePresenceVersions.RenameSelectedShapeIds,
      up: (_record) => {
      }
    },
    {
      id: instancePresenceVersions.NullableCameraCursor,
      up: (_record) => {
      },
      down: (record) => {
        if (record.camera === null) {
          record.camera = { x: 0, y: 0, z: 1 };
        }
        if (record.lastActivityTimestamp === null) {
          record.lastActivityTimestamp = 0;
        }
        if (record.cursor === null) {
          record.cursor = { type: "default", x: 0, y: 0, rotation: 0 };
        }
        if (record.screenBounds === null) {
          record.screenBounds = { x: 0, y: 0, w: 1, h: 1 };
        }
      }
    }
  ]
});
var InstancePresenceRecordType = createRecordType(
  "instance_presence",
  {
    validator: instancePresenceValidator,
    scope: "presence"
  }
).withDefaultProperties(() => ({
  lastActivityTimestamp: null,
  followingUserId: null,
  color: "#FF0000",
  camera: null,
  cursor: null,
  screenBounds: null,
  selectedShapeIds: [],
  brush: null,
  scribbles: [],
  chatMessage: "",
  meta: {}
}));

// node_modules/@tldraw/tlschema/dist-esm/records/TLAsset.mjs
var assetVersions = createMigrationIds("com.tldraw.asset", {
  AddMeta: 1
});
var assetMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.asset",
  recordType: "asset",
  sequence: [
    {
      id: assetVersions.AddMeta,
      up: (record) => {
        ;
        record.meta = {};
      }
    }
  ]
});
function createAssetRecordType(assets) {
  return createRecordType("asset", {
    scope: "document",
    validator: validation_exports.model(
      "asset",
      validation_exports.union(
        "type",
        mapObjectMapValues(
          assets,
          (type, { props, meta }) => createAssetValidator(type, props, meta)
        )
      )
    )
  }).withDefaultProperties(() => ({
    meta: {}
  }));
}
var AssetRecordType = createRecordType("asset", {
  scope: "document"
}).withDefaultProperties(() => ({
  meta: {}
}));

// node_modules/@tldraw/tlschema/dist-esm/records/TLCustomRecord.mjs
function createCustomRecordType(typeName, config) {
  return createRecordType(typeName, {
    scope: config.scope,
    validator: config.validator
  }).withDefaultProperties(config.createDefaultProperties ?? (() => ({})));
}
function processCustomRecordMigrations(records2) {
  const result = [];
  for (const [typeName, config] of Object.entries(records2)) {
    const sequenceId = `com.tldraw.${typeName}`;
    const { migrations } = config;
    if (!migrations) {
      result.push(
        createMigrationSequence({
          sequenceId,
          retroactive: true,
          sequence: []
        })
      );
    } else if ("sequenceId" in migrations) {
      assert(
        sequenceId === migrations.sequenceId,
        `sequenceId mismatch for ${typeName} custom record migrations. Expected '${sequenceId}', got '${migrations.sequenceId}'`
      );
      result.push(migrations);
    } else if ("sequence" in migrations) {
      result.push(
        createMigrationSequence({
          sequenceId,
          retroactive: true,
          sequence: migrations.sequence.map((m) => {
            if (!("id" in m)) return m;
            return {
              id: m.id,
              dependsOn: m.dependsOn,
              scope: "record",
              filter: (r) => r.typeName === typeName,
              up: (record) => {
                const result2 = m.up(record);
                if (result2) return result2;
              },
              down: typeof m.down === "function" ? (record) => {
                const result2 = m.down(record);
                if (result2) return result2;
              } : void 0
            };
          })
        })
      );
    }
  }
  return result;
}

// node_modules/@tldraw/tlschema/dist-esm/records/TLDocument.mjs
var documentValidator = validation_exports.model(
  "document",
  validation_exports.object({
    typeName: validation_exports.literal("document"),
    id: validation_exports.literal("document:document"),
    gridSize: validation_exports.number,
    name: validation_exports.string,
    meta: validation_exports.jsonValue
  })
);
var documentVersions = createMigrationIds("com.tldraw.document", {
  AddName: 1,
  AddMeta: 2
});
var documentMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.document",
  recordType: "document",
  sequence: [
    {
      id: documentVersions.AddName,
      up: (document2) => {
        ;
        document2.name = "";
      },
      down: (document2) => {
        delete document2.name;
      }
    },
    {
      id: documentVersions.AddMeta,
      up: (record) => {
        ;
        record.meta = {};
      }
    }
  ]
});
var DocumentRecordType = createRecordType("document", {
  validator: documentValidator,
  scope: "document"
}).withDefaultProperties(
  () => ({
    gridSize: 10,
    name: "",
    meta: {}
  })
);
var TLDOCUMENT_ID = DocumentRecordType.createId("document");

// node_modules/@tldraw/tlschema/dist-esm/shapes/TLBookmarkShape.mjs
var bookmarkShapeProps = {
  w: validation_exports.nonZeroNumber,
  h: validation_exports.nonZeroNumber,
  assetId: assetIdValidator.nullable(),
  url: validation_exports.linkUrl
};
var Versions4 = createShapePropsMigrationIds("bookmark", {
  NullAssetId: 1,
  MakeUrlsValid: 2
});
var bookmarkShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: Versions4.NullAssetId,
      up: (props) => {
        if (props.assetId === void 0) {
          props.assetId = null;
        }
      },
      down: "retired"
    },
    {
      id: Versions4.MakeUrlsValid,
      up: (props) => {
        if (!validation_exports.linkUrl.isValid(props.url)) {
          props.url = "";
        }
      },
      down: (_props) => {
      }
    }
  ]
});

// node_modules/@tldraw/tlschema/dist-esm/misc/b64Vecs.mjs
var FIRST_POINT_B64_LENGTH = 16;
var FIRST_POINT_2D_B64_LENGTH = 12;
var DEFAULT_PRESSURE = 0.5;
var DIM_2D = 2;
var DIM_3D = 3;
var BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var B64_LOOKUP = new Uint8Array(128);
for (let i = 0; i < 64; i++) {
  B64_LOOKUP[BASE64_CHARS.charCodeAt(i)] = i;
}
var SIX_BIT_MASK = 63;
var PADDING_CHAR_CODE = "=".charCodeAt(0);
var POW2 = new Float64Array(31);
for (let i = 0; i < 31; i++) {
  POW2[i] = Math.pow(2, i - 15);
}
var POW2_SUBNORMAL = Math.pow(2, -14) / 1024;
var MANTISSA = new Float64Array(1024);
for (let i = 0; i < 1024; i++) {
  MANTISSA[i] = 1 + i / 1024;
}
function nativeGetFloat16(dataView, offset) {
  return dataView.getFloat16(offset, true);
}
function fallbackGetFloat16(dataView, offset) {
  return float16BitsToNumber(dataView.getUint16(offset, true));
}
var getFloat16 = typeof DataView.prototype.getFloat16 === "function" ? nativeGetFloat16 : fallbackGetFloat16;
function nativeSetFloat16(dataView, offset, value) {
  ;
  dataView.setFloat16(offset, value, true);
}
function fallbackSetFloat16(dataView, offset, value) {
  dataView.setUint16(offset, numberToFloat16Bits(value), true);
}
var setFloat16 = typeof DataView.prototype.setFloat16 === "function" ? nativeSetFloat16 : fallbackSetFloat16;
function nativeBase64ToUint8Array(base64) {
  return Uint8Array.fromBase64(base64);
}
function fallbackBase64ToUint8Array(base64) {
  const paddedLength = base64.length;
  let padding = 0;
  if (paddedLength > 0 && base64.charCodeAt(paddedLength - 1) === PADDING_CHAR_CODE) {
    padding++;
    if (paddedLength > 1 && base64.charCodeAt(paddedLength - 2) === PADDING_CHAR_CODE) {
      padding++;
    }
  }
  const numBytes = Math.floor(paddedLength * 3 / 4) - padding;
  const bytes = new Uint8Array(numBytes);
  let byteIndex = 0;
  const fullGroups = Math.floor((paddedLength - padding) / 4) * 4;
  for (let i = 0; i < fullGroups; i += 4) {
    const c0 = B64_LOOKUP[base64.charCodeAt(i)];
    const c1 = B64_LOOKUP[base64.charCodeAt(i + 1)];
    const c2 = B64_LOOKUP[base64.charCodeAt(i + 2)];
    const c3 = B64_LOOKUP[base64.charCodeAt(i + 3)];
    const bitmap = c0 << 18 | c1 << 12 | c2 << 6 | c3;
    bytes[byteIndex++] = bitmap >> 16 & 255;
    bytes[byteIndex++] = bitmap >> 8 & 255;
    bytes[byteIndex++] = bitmap & 255;
  }
  if (padding === 1) {
    const c0 = B64_LOOKUP[base64.charCodeAt(fullGroups)];
    const c1 = B64_LOOKUP[base64.charCodeAt(fullGroups + 1)];
    const c2 = B64_LOOKUP[base64.charCodeAt(fullGroups + 2)];
    const bitmap = c0 << 18 | c1 << 12 | c2 << 6;
    bytes[byteIndex++] = bitmap >> 16 & 255;
    bytes[byteIndex++] = bitmap >> 8 & 255;
  } else if (padding === 2) {
    const c0 = B64_LOOKUP[base64.charCodeAt(fullGroups)];
    const c1 = B64_LOOKUP[base64.charCodeAt(fullGroups + 1)];
    const bitmap = c0 << 18 | c1 << 12;
    bytes[byteIndex++] = bitmap >> 16 & 255;
  }
  return bytes;
}
function nativeUint8ArrayToBase64(uint8Array) {
  return uint8Array.toBase64();
}
function fallbackUint8ArrayToBase64(uint8Array) {
  const len = uint8Array.length;
  const fullGroups = Math.floor(len / 3) * 3;
  let result = "";
  for (let i = 0; i < fullGroups; i += 3) {
    const byte1 = uint8Array[i];
    const byte2 = uint8Array[i + 1];
    const byte3 = uint8Array[i + 2];
    const bitmap = byte1 << 16 | byte2 << 8 | byte3;
    result += BASE64_CHARS[bitmap >> 18 & SIX_BIT_MASK] + // bits 23–18 (top sextet)
    BASE64_CHARS[bitmap >> 12 & SIX_BIT_MASK] + // bits 17–12
    BASE64_CHARS[bitmap >> 6 & SIX_BIT_MASK] + // bits 11–6
    BASE64_CHARS[bitmap & SIX_BIT_MASK];
  }
  const remaining = len - fullGroups;
  if (remaining === 1) {
    const bitmap = uint8Array[fullGroups] << 16;
    result += BASE64_CHARS[bitmap >> 18 & SIX_BIT_MASK] + BASE64_CHARS[bitmap >> 12 & SIX_BIT_MASK] + "==";
  } else if (remaining === 2) {
    const bitmap = uint8Array[fullGroups] << 16 | uint8Array[fullGroups + 1] << 8;
    result += BASE64_CHARS[bitmap >> 18 & SIX_BIT_MASK] + BASE64_CHARS[bitmap >> 12 & SIX_BIT_MASK] + BASE64_CHARS[bitmap >> 6 & SIX_BIT_MASK] + "=";
  }
  return result;
}
var uint8ArrayToBase64 = typeof Uint8Array.prototype.toBase64 === "function" ? nativeUint8ArrayToBase64 : fallbackUint8ArrayToBase64;
var base64ToUint8Array = typeof Uint8Array.fromBase64 === "function" ? nativeBase64ToUint8Array : fallbackBase64ToUint8Array;
function float16BitsToNumber(bits) {
  const sign = bits >> 15;
  const exp = bits >> 10 & 31;
  const frac = bits & 1023;
  if (exp === 0) {
    return sign ? -frac * POW2_SUBNORMAL : frac * POW2_SUBNORMAL;
  }
  if (exp === 31) {
    return frac ? NaN : sign ? -Infinity : Infinity;
  }
  const magnitude = POW2[exp] * MANTISSA[frac];
  return sign ? -magnitude : magnitude;
}
function numberToFloat16Bits(value) {
  if (value === 0) return Object.is(value, -0) ? 32768 : 0;
  if (!Number.isFinite(value)) {
    if (Number.isNaN(value)) return 32256;
    return value > 0 ? 31744 : 64512;
  }
  const sign = value < 0 ? 1 : 0;
  value = Math.abs(value);
  const exp = Math.floor(Math.log2(value));
  let expBiased = exp + 15;
  if (expBiased >= 31) {
    return sign << 15 | 31744;
  }
  if (expBiased <= 0) {
    const frac2 = Math.round(value * Math.pow(2, 14) * 1024);
    return sign << 15 | frac2 & 1023;
  }
  const mantissa = value / Math.pow(2, exp) - 1;
  let frac = Math.round(mantissa * 1024);
  if (frac >= 1024) {
    frac = 0;
    expBiased++;
    if (expBiased >= 31) {
      return sign << 15 | 31744;
    }
  }
  return sign << 15 | expBiased << 10 | frac;
}
var b64Vecs = class _b64Vecs {
  /**
   * Encode a single point (x, y, z) to 8 base64 characters using legacy Float16 encoding.
   * Each coordinate is encoded as a Float16 value, resulting in 6 bytes total.
   *
   * @param x - The x coordinate
   * @param y - The y coordinate
   * @param z - The z coordinate
   * @returns An 8-character base64 string representing the point
   * @internal
   */
  static _legacyEncodePoint(x, y, z) {
    const buffer = new Uint8Array(6);
    const dataView = new DataView(buffer.buffer);
    setFloat16(dataView, 0, x);
    setFloat16(dataView, 2, y);
    setFloat16(dataView, 4, z);
    return uint8ArrayToBase64(buffer);
  }
  /**
   * Convert an array of VecModels to a base64 string using legacy Float16 encoding.
   * Uses Float16 encoding for each coordinate (x, y, z). If a point's z value is
   * undefined, it defaults to 0.5.
   *
   * @param points - An array of VecModel objects to encode
   * @returns A base64-encoded string containing all points
   * @internal Used only for migrations from legacy format
   */
  static _legacyEncodePoints(points) {
    if (points.length === 0) return "";
    const buffer = new Uint8Array(points.length * 6);
    const dataView = new DataView(buffer.buffer);
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const offset = i * 6;
      setFloat16(dataView, offset, p.x);
      setFloat16(dataView, offset + 2, p.y);
      setFloat16(dataView, offset + 4, p.z ?? 0.5);
    }
    return uint8ArrayToBase64(buffer);
  }
  /**
   * Convert a legacy base64 string back to an array of VecModels.
   * Decodes Float16-encoded coordinates (x, y, z) from the base64 string.
   *
   * @param base64 - The base64-encoded string containing point data
   * @returns An array of VecModel objects decoded from the string
   * @internal Used only for migrations from legacy format
   */
  static _legacyDecodePoints(base64) {
    const bytes = base64ToUint8Array(base64);
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const result = [];
    for (let offset = 0; offset < bytes.length; offset += 6) {
      result.push({
        x: getFloat16(dataView, offset),
        y: getFloat16(dataView, offset + 2),
        z: getFloat16(dataView, offset + 4)
      });
    }
    return result;
  }
  /**
   * Encode an array of VecModels using delta encoding for improved precision.
   * The first point is stored as Float32 (high precision for absolute position),
   * subsequent points are stored as Float16 deltas from the previous point.
   * This provides full precision for the starting position and excellent precision
   * for deltas between consecutive points (which are typically small values).
   *
   * Format:
   * - First point: 3 Float32 values = 12 bytes = 16 base64 chars
   * - Delta points: 3 Float16 values each = 6 bytes = 8 base64 chars each
   *
   * @param points - An array of VecModel objects to encode
   * @param dim - Encoding dimension; `2` routes through the 2D variant (drops z), `3` (default) keeps x, y, z
   * @returns A base64-encoded string containing delta-encoded points
   * @public
   */
  static encodePoints(points, dim) {
    if (dim === DIM_2D) return _b64Vecs.encodePoints2D(points);
    if (points.length === 0) return "";
    const firstPointBytes = 12;
    const deltaBytes = (points.length - 1) * 6;
    const totalBytes = firstPointBytes + deltaBytes;
    const buffer = new Uint8Array(totalBytes);
    const dataView = new DataView(buffer.buffer);
    const first = points[0];
    dataView.setFloat32(0, first.x, true);
    dataView.setFloat32(4, first.y, true);
    dataView.setFloat32(8, first.z ?? 0.5, true);
    let prevX = first.x;
    let prevY = first.y;
    let prevZ = first.z ?? 0.5;
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      const z = p.z ?? 0.5;
      const offset = firstPointBytes + (i - 1) * 6;
      setFloat16(dataView, offset, p.x - prevX);
      setFloat16(dataView, offset + 2, p.y - prevY);
      setFloat16(dataView, offset + 4, z - prevZ);
      prevX = p.x;
      prevY = p.y;
      prevZ = z;
    }
    return uint8ArrayToBase64(buffer);
  }
  /**
   * Decode a delta-encoded base64 string back to an array of absolute VecModels.
   * The first point is stored as Float32 (high precision), subsequent points are
   * Float16 deltas that are accumulated to reconstruct absolute positions.
   *
   * @param base64 - The base64-encoded string containing delta-encoded point data
   * @param dim - Encoding dimension; `2` expects x/y only (z supplied as 0.5), `3` (default) expects x/y/z
   * @returns An array of VecModel objects with absolute coordinates
   * @public
   */
  static decodePoints(base64, dim) {
    if (dim === DIM_2D) return _b64Vecs.decodePoints2D(base64);
    if (base64.length === 0) return [];
    const bytes = base64ToUint8Array(base64);
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const result = [];
    let x = dataView.getFloat32(0, true);
    let y = dataView.getFloat32(4, true);
    let z = dataView.getFloat32(8, true);
    result.push({ x, y, z });
    const firstPointBytes = 12;
    for (let offset = firstPointBytes; offset < bytes.length; offset += 6) {
      x += getFloat16(dataView, offset);
      y += getFloat16(dataView, offset + 2);
      z += getFloat16(dataView, offset + 4);
      result.push({ x, y, z });
    }
    return result;
  }
  /**
   * Get the first point from a delta-encoded base64 string.
   * The first point is stored as Float32 for full precision.
   *
   * @param b64Points - The delta-encoded base64 string
   * @param dim - Encoding dimension; `2` expects x/y only (z supplied as 0.5), `3` (default) expects x/y/z
   * @returns The first point as a VecModel, or null if the string is too short
   * @public
   */
  static decodeFirstPoint(b64Points, dim) {
    if (dim === DIM_2D) return _b64Vecs.decodeFirstPoint2D(b64Points);
    if (b64Points.length < FIRST_POINT_B64_LENGTH) return null;
    const bytes = base64ToUint8Array(b64Points.slice(0, FIRST_POINT_B64_LENGTH));
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return {
      x: dataView.getFloat32(0, true),
      y: dataView.getFloat32(4, true),
      z: dataView.getFloat32(8, true)
    };
  }
  /**
   * Get the last point from a delta-encoded base64 string.
   * Requires decoding all points to accumulate deltas.
   *
   * @param b64Points - The delta-encoded base64 string
   * @param dim - Encoding dimension; `2` expects x/y only (z supplied as 0.5), `3` (default) expects x/y/z
   * @returns The last point as a VecModel, or null if the string is too short
   * @public
   */
  static decodeLastPoint(b64Points, dim) {
    if (dim === DIM_2D) return _b64Vecs.decodeLastPoint2D(b64Points);
    if (b64Points.length < FIRST_POINT_B64_LENGTH) return null;
    const bytes = base64ToUint8Array(b64Points);
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let x = dataView.getFloat32(0, true);
    let y = dataView.getFloat32(4, true);
    let z = dataView.getFloat32(8, true);
    const firstPointBytes = 12;
    for (let offset = firstPointBytes; offset < bytes.length; offset += 6) {
      x += getFloat16(dataView, offset);
      y += getFloat16(dataView, offset + 2);
      z += getFloat16(dataView, offset + 4);
    }
    return { x, y, z };
  }
  /**
   * Encode an array of VecModels as 2D delta-encoded points, dropping z entirely.
   * Use for draw shapes from devices that don't report pressure, where z is a
   * constant 0.5 and storing it wastes ~33% of per-point bytes.
   *
   * Format:
   * - First point: 2 Float32 values (x, y) = 8 bytes
   * - Delta points: 2 Float16 values (dx, dy) = 4 bytes each
   *
   * @param points - An array of VecModel objects to encode (z is discarded)
   * @returns A base64-encoded string containing 2D delta-encoded points
   * @public
   */
  static encodePoints2D(points) {
    if (points.length === 0) return "";
    const firstPointBytes = 8;
    const deltaBytes = (points.length - 1) * 4;
    const buffer = new Uint8Array(firstPointBytes + deltaBytes);
    const dataView = new DataView(buffer.buffer);
    const first = points[0];
    dataView.setFloat32(0, first.x, true);
    dataView.setFloat32(4, first.y, true);
    let prevX = first.x;
    let prevY = first.y;
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      const offset = firstPointBytes + (i - 1) * 4;
      setFloat16(dataView, offset, p.x - prevX);
      setFloat16(dataView, offset + 2, p.y - prevY);
      prevX = p.x;
      prevY = p.y;
    }
    return uint8ArrayToBase64(buffer);
  }
  /**
   * Decode a 2D delta-encoded base64 string back to an array of absolute VecModels.
   * The z coordinate is always set to 0.5 (the default pressure value) so downstream
   * consumers don't need a separate code path.
   *
   * @param base64 - The base64-encoded string containing 2D delta-encoded point data
   * @returns An array of VecModel objects with absolute (x, y) and z = 0.5
   * @public
   */
  static decodePoints2D(base64) {
    if (base64.length === 0) return [];
    const bytes = base64ToUint8Array(base64);
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const result = [];
    let x = dataView.getFloat32(0, true);
    let y = dataView.getFloat32(4, true);
    result.push({ x, y, z: DEFAULT_PRESSURE });
    const firstPointBytes = 8;
    for (let offset = firstPointBytes; offset < bytes.length; offset += 4) {
      x += getFloat16(dataView, offset);
      y += getFloat16(dataView, offset + 2);
      result.push({ x, y, z: DEFAULT_PRESSURE });
    }
    return result;
  }
  /**
   * Get the first point from a 2D delta-encoded base64 string.
   *
   * @param b64Points - The 2D delta-encoded base64 string
   * @returns The first point with z = 0.5, or null if the string is too short
   * @public
   */
  static decodeFirstPoint2D(b64Points) {
    if (b64Points.length < FIRST_POINT_2D_B64_LENGTH) return null;
    const bytes = base64ToUint8Array(b64Points.slice(0, FIRST_POINT_2D_B64_LENGTH));
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return {
      x: dataView.getFloat32(0, true),
      y: dataView.getFloat32(4, true),
      z: DEFAULT_PRESSURE
    };
  }
  /**
   * Get the last point from a 2D delta-encoded base64 string.
   * Requires decoding all points to accumulate deltas.
   *
   * @param b64Points - The 2D delta-encoded base64 string
   * @returns The last point with z = 0.5, or null if the string is too short
   * @public
   */
  static decodeLastPoint2D(b64Points) {
    if (b64Points.length < FIRST_POINT_2D_B64_LENGTH) return null;
    const bytes = base64ToUint8Array(b64Points);
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let x = dataView.getFloat32(0, true);
    let y = dataView.getFloat32(4, true);
    const firstPointBytes = 8;
    for (let offset = firstPointBytes; offset < bytes.length; offset += 4) {
      x += getFloat16(dataView, offset);
      y += getFloat16(dataView, offset + 2);
    }
    return { x, y, z: DEFAULT_PRESSURE };
  }
  /**
   * Whether an encoded path contains only a single point (a "dot"), inferred from
   * the encoded length without decoding — cheap enough for the render path.
   *
   * The single-point length depends on the encoding dimension, so this takes the
   * segment's `dim`: a one-point path is `FIRST_POINT_B64_LENGTH` chars (3D) or
   * `FIRST_POINT_2D_B64_LENGTH` chars (2D). Keeping this beside the layout constants
   * is deliberate — it is the single source of truth for "how long is one point", so
   * callers never hard-code a length threshold (which silently breaks when a new
   * encoding is added).
   *
   * @param b64Points - The encoded path string
   * @param dim - Encoding dimension; `2` for (x, y), `3` (default) for (x, y, z)
   * @returns true if the path encodes exactly one point
   * @public
   */
  static isSinglePoint(b64Points, dim) {
    return b64Points.length <= (dim === DIM_2D ? FIRST_POINT_2D_B64_LENGTH : FIRST_POINT_B64_LENGTH);
  }
};

// node_modules/@tldraw/tlschema/dist-esm/shapes/TLDrawShape.mjs
var DrawShapeSegment = validation_exports.object({
  type: validation_exports.literalEnum("free", "straight"),
  path: validation_exports.string,
  dim: validation_exports.literalEnum(DIM_2D, DIM_3D).optional()
});
var drawShapeProps = {
  color: DefaultColorStyle,
  fill: DefaultFillStyle,
  dash: DefaultDashStyle,
  size: DefaultSizeStyle,
  segments: validation_exports.arrayOf(DrawShapeSegment),
  isComplete: validation_exports.boolean,
  isClosed: validation_exports.boolean,
  isPen: validation_exports.boolean,
  scale: validation_exports.nonZeroNumber,
  scaleX: validation_exports.nonZeroFiniteNumber,
  scaleY: validation_exports.nonZeroFiniteNumber
};
var Versions5 = createShapePropsMigrationIds("draw", {
  AddInPen: 1,
  AddScale: 2,
  Base64: 3,
  LegacyPointsConversion: 4,
  OmitNonPressureZ: 5
});
var drawShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: Versions5.AddInPen,
      up: (props) => {
        const { points } = props.segments[0];
        if (points.length === 0) {
          props.isPen = false;
          return;
        }
        let isPen = !(points[0].z === 0 || points[0].z === 0.5);
        if (points[1]) {
          isPen = isPen && !(points[1].z === 0 || points[1].z === 0.5);
        }
        props.isPen = isPen;
      },
      down: "retired"
    },
    {
      id: Versions5.AddScale,
      up: (props) => {
        props.scale = 1;
      },
      down: (props) => {
        delete props.scale;
      }
    },
    {
      id: Versions5.Base64,
      up: (props) => {
        props.segments = props.segments.map((segment) => {
          if (segment.path !== void 0) return segment;
          const { points, ...rest } = segment;
          const vecModels = Array.isArray(points) ? points : b64Vecs._legacyDecodePoints(points);
          return {
            ...rest,
            path: b64Vecs.encodePoints(vecModels)
          };
        });
        props.scaleX = props.scaleX ?? 1;
        props.scaleY = props.scaleY ?? 1;
      },
      down: (props) => {
        props.segments = props.segments.map((segment) => {
          const { path: path5, ...rest } = segment;
          return {
            ...rest,
            points: b64Vecs.decodePoints(path5)
          };
        });
        delete props.scaleX;
        delete props.scaleY;
      }
    },
    {
      id: Versions5.LegacyPointsConversion,
      up: (props) => {
        props.segments = props.segments.map((segment) => {
          if (segment.path !== void 0) return segment;
          const { points, ...rest } = segment;
          const vecModels = Array.isArray(points) ? points : b64Vecs._legacyDecodePoints(points);
          return {
            ...rest,
            path: b64Vecs.encodePoints(vecModels)
          };
        });
      },
      down: (_props) => {
      }
    },
    {
      id: Versions5.OmitNonPressureZ,
      up: (_props) => {
      },
      down: (props) => {
        props.segments = props.segments.map((segment) => {
          if (segment.dim === void 0) return segment;
          const { dim, ...rest } = segment;
          return dim === DIM_2D ? { ...rest, path: b64Vecs.encodePoints(b64Vecs.decodePoints(segment.path, DIM_2D)) } : rest;
        });
      }
    }
  ]
});

// node_modules/@tldraw/tlschema/dist-esm/shapes/TLEmbedShape.mjs
var TLDRAW_APP_RE = /(^\/r\/[^/]+\/?$)/;
var EMBED_DEFINITIONS = [
  {
    hostnames: ["beta.tldraw.com", "tldraw.com", "localhost:3000"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const urlObj = safeParseUrl(url);
      if (urlObj && urlObj.pathname.match(TLDRAW_APP_RE)) {
        return url;
      }
      return;
    }
  },
  {
    hostnames: ["figma.com"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const urlObj = safeParseUrl(url);
      if (urlObj && urlObj.pathname.match(/^\/embed\/?$/)) {
        const outUrl = urlObj.searchParams.get("url");
        if (outUrl) {
          return outUrl;
        }
      }
      return;
    }
  },
  {
    hostnames: ["google.*"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const urlObj = safeParseUrl(url);
      if (!urlObj) return;
      const matches = urlObj.pathname.match(/^\/maps\/embed\/v1\/view\/?$/);
      if (matches && urlObj.searchParams.has("center") && urlObj.searchParams.get("zoom")) {
        const zoom = urlObj.searchParams.get("zoom");
        const [lat, lon] = urlObj.searchParams.get("center").split(",");
        return `https://www.google.com/maps/@${lat},${lon},${zoom}z`;
      }
      return;
    }
  },
  {
    hostnames: ["val.town"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const urlObj = safeParseUrl(url);
      const matches = urlObj && urlObj.pathname.match(/\/embed\/(.+)\/?/);
      if (matches) {
        return `https://www.val.town/v/${matches[1]}`;
      }
      return;
    }
  },
  {
    hostnames: ["codesandbox.io"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const urlObj = safeParseUrl(url);
      const matches = urlObj && urlObj.pathname.match(/\/embed\/([^/]+)\/?/);
      if (matches) {
        return `https://codesandbox.io/s/${matches[1]}`;
      }
      return;
    }
  },
  {
    hostnames: ["codepen.io"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const CODEPEN_EMBED_REGEXP = /https:\/\/codepen.io\/([^/]+)\/embed\/([^/]+)/;
      const matches = url.match(CODEPEN_EMBED_REGEXP);
      if (matches) {
        const [_, user, id] = matches;
        return `https://codepen.io/${user}/pen/${id}`;
      }
      return;
    }
  },
  {
    hostnames: ["scratch.mit.edu"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const SCRATCH_EMBED_REGEXP = /https:\/\/scratch.mit.edu\/projects\/embed\/([^/]+)/;
      const matches = url.match(SCRATCH_EMBED_REGEXP);
      if (matches) {
        const [_, id] = matches;
        return `https://scratch.mit.edu/projects/${id}`;
      }
      return;
    }
  },
  {
    hostnames: ["*.youtube.com", "youtube.com", "youtu.be"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const urlObj = safeParseUrl(url);
      if (!urlObj) return;
      const hostname = urlObj.hostname.replace(/^www./, "");
      if (hostname === "youtube.com") {
        const matches = urlObj.pathname.match(/^\/embed\/([^/]+)\/?/);
        if (matches) {
          return `https://www.youtube.com/watch?v=${matches[1]}`;
        }
      }
      return;
    }
  },
  {
    hostnames: ["calendar.google.*"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const urlObj = safeParseUrl(url);
      const srcQs = urlObj?.searchParams.get("src");
      if (urlObj?.pathname.match(/\/calendar\/embed/) && srcQs) {
        urlObj.pathname = "/calendar/u/0";
        const keys = Array.from(urlObj.searchParams.keys());
        for (const key of keys) {
          urlObj.searchParams.delete(key);
        }
        urlObj.searchParams.set("cid", srcQs);
        return urlObj.href;
      }
      return;
    }
  },
  {
    hostnames: ["docs.google.*"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const urlObj = safeParseUrl(url);
      if (urlObj?.pathname.match(/^\/presentation/) && urlObj?.pathname.match(/\/embed\/?$/)) {
        urlObj.pathname = urlObj.pathname.replace(/\/embed$/, "/pub");
        const keys = Array.from(urlObj.searchParams.keys());
        for (const key of keys) {
          urlObj.searchParams.delete(key);
        }
        return urlObj.href;
      }
      return;
    }
  },
  {
    hostnames: ["gist.github.com"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const urlObj = safeParseUrl(url);
      if (urlObj && urlObj.pathname.match(/\/([^/]+)\/([^/]+)/)) {
        if (!url.split("/").pop()) return;
        return url;
      }
      return;
    }
  },
  {
    hostnames: ["replit.com"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const urlObj = safeParseUrl(url);
      if (urlObj && urlObj.pathname.match(/\/@([^/]+)\/([^/]+)/) && urlObj.searchParams.has("embed")) {
        urlObj.searchParams.delete("embed");
        return urlObj.href;
      }
      return;
    }
  },
  {
    hostnames: ["felt.com"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const urlObj = safeParseUrl(url);
      if (urlObj && urlObj.pathname.match(/^\/embed\/map\//)) {
        urlObj.pathname = urlObj.pathname.replace(/^\/embed/, "");
        return urlObj.href;
      }
      return;
    }
  },
  {
    hostnames: ["open.spotify.com"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const urlObj = safeParseUrl(url);
      if (urlObj && urlObj.pathname.match(/^\/embed\/(artist|album)\//)) {
        return urlObj.origin + urlObj.pathname.replace(/^\/embed/, "");
      }
      return;
    }
  },
  {
    hostnames: ["vimeo.com", "player.vimeo.com"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const urlObj = safeParseUrl(url);
      if (urlObj && urlObj.hostname === "player.vimeo.com") {
        const matches = urlObj.pathname.match(/^\/video\/([^/]+)\/?$/);
        if (matches) {
          return "https://vimeo.com/" + matches[1];
        }
      }
      return;
    }
  },
  {
    hostnames: ["observablehq.com"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const urlObj = safeParseUrl(url);
      if (urlObj && urlObj.pathname.match(/^\/embed\/@([^/]+)\/([^/]+)\/?$/)) {
        return `${urlObj.origin}${urlObj.pathname.replace("/embed", "")}#cell-*`;
      }
      if (urlObj && urlObj.pathname.match(/^\/embed\/([^/]+)\/?$/)) {
        return `${urlObj.origin}${urlObj.pathname.replace("/embed", "/d")}#cell-*`;
      }
      return;
    }
  },
  {
    hostnames: ["desmos.com"],
    canEditWhileLocked: true,
    fromEmbedUrl: (url) => {
      const urlObj = safeParseUrl(url);
      if (urlObj && urlObj.hostname === "www.desmos.com" && urlObj.pathname.match(/^\/calculator\/([^/]+)\/?$/) && urlObj.search === "?embed" && urlObj.hash === "") {
        return url.replace("?embed", "");
      }
      return;
    }
  }
];
var embedShapeProps = {
  w: validation_exports.nonZeroNumber,
  h: validation_exports.nonZeroNumber,
  url: validation_exports.string
};
var Versions6 = createShapePropsMigrationIds("embed", {
  GenOriginalUrlInEmbed: 1,
  RemoveDoesResize: 2,
  RemoveTmpOldUrl: 3,
  RemovePermissionOverrides: 4
});
var embedShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: Versions6.GenOriginalUrlInEmbed,
      // add tmpOldUrl property
      up: (props) => {
        try {
          const url = props.url;
          const host = new URL(url).host.replace("www.", "");
          let originalUrl;
          for (const localEmbedDef of EMBED_DEFINITIONS) {
            if (localEmbedDef.hostnames.includes(host)) {
              try {
                originalUrl = localEmbedDef.fromEmbedUrl(url);
              } catch (err) {
                console.warn(err);
              }
            }
          }
          props.tmpOldUrl = props.url;
          props.url = originalUrl ?? "";
        } catch {
          props.url = "";
          props.tmpOldUrl = props.url;
        }
      },
      down: "retired"
    },
    {
      id: Versions6.RemoveDoesResize,
      up: (props) => {
        delete props.doesResize;
      },
      down: "retired"
    },
    {
      id: Versions6.RemoveTmpOldUrl,
      up: (props) => {
        delete props.tmpOldUrl;
      },
      down: "retired"
    },
    {
      id: Versions6.RemovePermissionOverrides,
      up: (props) => {
        delete props.overridePermissions;
      },
      down: "retired"
    }
  ]
});

// node_modules/@tldraw/tlschema/dist-esm/shapes/TLFrameShape.mjs
var frameShapeProps = {
  w: validation_exports.nonZeroNumber,
  h: validation_exports.nonZeroNumber,
  name: validation_exports.string,
  // because shape colors are an option, we don't want them to be picked up by the editor as a
  // style prop by default, so instead of a proper style we just supply an equivalent validator.
  // Check `FrameShapeUtil.configure` for how we replace this with the original
  // `DefaultColorStyle` style when the option is turned on.
  // We delegate to DefaultColorStyle.validate so custom colors from themes are
  // picked up automatically.
  color: { validate: (v) => DefaultColorStyle.validate(v) }
};
var Versions7 = createShapePropsMigrationIds("frame", {
  AddColorProp: 1
});
var frameShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: Versions7.AddColorProp,
      up: (props) => {
        props.color = "black";
      },
      down: (props) => {
        delete props.color;
      }
    }
  ]
});

// node_modules/@tldraw/tlschema/dist-esm/styles/TLHorizontalAlignStyle.mjs
var DefaultHorizontalAlignStyle = StyleProp.defineEnum("tldraw:horizontalAlign", {
  defaultValue: "middle",
  values: ["start", "middle", "end", "start-legacy", "end-legacy", "middle-legacy"]
});

// node_modules/@tldraw/tlschema/dist-esm/styles/TLVerticalAlignStyle.mjs
var DefaultVerticalAlignStyle = StyleProp.defineEnum("tldraw:verticalAlign", {
  defaultValue: "middle",
  values: ["start", "middle", "end"]
});

// node_modules/@tldraw/tlschema/dist-esm/shapes/TLGeoShape.mjs
var GeoShapeGeoStyle = StyleProp.defineEnum("tldraw:geo", {
  defaultValue: "rectangle",
  values: [
    "cloud",
    "rectangle",
    "ellipse",
    "triangle",
    "diamond",
    "pentagon",
    "hexagon",
    "octagon",
    "star",
    "rhombus",
    "rhombus-2",
    "oval",
    "trapezoid",
    "arrow-right",
    "arrow-left",
    "arrow-up",
    "arrow-down",
    "x-box",
    "check-box",
    "heart"
  ]
});
var geoShapeProps = {
  geo: GeoShapeGeoStyle,
  dash: DefaultDashStyle,
  url: validation_exports.linkUrl,
  w: validation_exports.nonZeroNumber,
  h: validation_exports.nonZeroNumber,
  growY: validation_exports.positiveNumber,
  scale: validation_exports.nonZeroNumber,
  // Text properties
  labelColor: DefaultLabelColorStyle,
  color: DefaultColorStyle,
  fill: DefaultFillStyle,
  size: DefaultSizeStyle,
  font: DefaultFontStyle,
  align: DefaultHorizontalAlignStyle,
  verticalAlign: DefaultVerticalAlignStyle,
  richText: richTextValidator
};
var geoShapeVersions = createShapePropsMigrationIds("geo", {
  AddUrlProp: 1,
  AddLabelColor: 2,
  RemoveJustify: 3,
  AddCheckBox: 4,
  AddVerticalAlign: 5,
  MigrateLegacyAlign: 6,
  AddCloud: 7,
  MakeUrlsValid: 8,
  AddScale: 9,
  AddRichText: 10,
  AddRichTextAttrs: 11
});
var geoShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: geoShapeVersions.AddUrlProp,
      up: (props) => {
        props.url = "";
      },
      down: "retired"
    },
    {
      id: geoShapeVersions.AddLabelColor,
      up: (props) => {
        props.labelColor = "black";
      },
      down: "retired"
    },
    {
      id: geoShapeVersions.RemoveJustify,
      up: (props) => {
        if (props.align === "justify") {
          props.align = "start";
        }
      },
      down: "retired"
    },
    {
      id: geoShapeVersions.AddCheckBox,
      up: (_props) => {
      },
      down: "retired"
    },
    {
      id: geoShapeVersions.AddVerticalAlign,
      up: (props) => {
        props.verticalAlign = "middle";
      },
      down: "retired"
    },
    {
      id: geoShapeVersions.MigrateLegacyAlign,
      up: (props) => {
        let newAlign;
        switch (props.align) {
          case "start":
            newAlign = "start-legacy";
            break;
          case "end":
            newAlign = "end-legacy";
            break;
          default:
            newAlign = "middle-legacy";
            break;
        }
        props.align = newAlign;
      },
      down: "retired"
    },
    {
      id: geoShapeVersions.AddCloud,
      up: (_props) => {
      },
      down: "retired"
    },
    {
      id: geoShapeVersions.MakeUrlsValid,
      up: (props) => {
        if (!validation_exports.linkUrl.isValid(props.url)) {
          props.url = "";
        }
      },
      down: (_props) => {
      }
    },
    {
      id: geoShapeVersions.AddScale,
      up: (props) => {
        props.scale = 1;
      },
      down: (props) => {
        delete props.scale;
      }
    },
    {
      id: geoShapeVersions.AddRichText,
      up: (props) => {
        props.richText = toRichText(props.text);
        delete props.text;
      }
      // N.B. Explicitly no down state so that we force clients to update.
      // down: (props) => {
      // 	delete props.richText
      // },
    },
    {
      id: geoShapeVersions.AddRichTextAttrs,
      up: (_props) => {
      },
      down: (props) => {
        if (props.richText && "attrs" in props.richText) {
          delete props.richText.attrs;
        }
      }
    }
  ]
});

// node_modules/@tldraw/tlschema/dist-esm/shapes/TLGroupShape.mjs
var groupShapeProps = {};
var groupShapeMigrations = createShapePropsMigrationSequence({ sequence: [] });

// node_modules/@tldraw/tlschema/dist-esm/shapes/TLHighlightShape.mjs
var highlightShapeProps = {
  color: DefaultColorStyle,
  size: DefaultSizeStyle,
  segments: validation_exports.arrayOf(DrawShapeSegment),
  isComplete: validation_exports.boolean,
  isPen: validation_exports.boolean,
  scale: validation_exports.nonZeroNumber,
  scaleX: validation_exports.nonZeroFiniteNumber,
  scaleY: validation_exports.nonZeroFiniteNumber
};
var Versions8 = createShapePropsMigrationIds("highlight", {
  AddScale: 1,
  Base64: 2,
  LegacyPointsConversion: 3,
  OmitNonPressureZ: 4
});
var highlightShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: Versions8.AddScale,
      up: (props) => {
        props.scale = 1;
      },
      down: (props) => {
        delete props.scale;
      }
    },
    {
      id: Versions8.Base64,
      up: (props) => {
        props.segments = props.segments.map((segment) => {
          if (segment.path !== void 0) return segment;
          const { points, ...rest } = segment;
          const vecModels = Array.isArray(points) ? points : b64Vecs._legacyDecodePoints(points);
          return {
            ...rest,
            path: b64Vecs.encodePoints(vecModels)
          };
        });
        props.scaleX = props.scaleX ?? 1;
        props.scaleY = props.scaleY ?? 1;
      },
      down: (props) => {
        props.segments = props.segments.map((segment) => {
          const { path: path5, ...rest } = segment;
          return {
            ...rest,
            points: b64Vecs.decodePoints(path5)
          };
        });
        delete props.scaleX;
        delete props.scaleY;
      }
    },
    {
      id: Versions8.LegacyPointsConversion,
      up: (props) => {
        props.segments = props.segments.map((segment) => {
          if (segment.path !== void 0) return segment;
          const { points, ...rest } = segment;
          const vecModels = Array.isArray(points) ? points : b64Vecs._legacyDecodePoints(points);
          return {
            ...rest,
            path: b64Vecs.encodePoints(vecModels)
          };
        });
      },
      down: (_props) => {
      }
    },
    {
      id: Versions8.OmitNonPressureZ,
      up: (_props) => {
      },
      down: (props) => {
        props.segments = props.segments.map((segment) => {
          if (segment.dim === void 0) return segment;
          const { dim, ...rest } = segment;
          return dim === DIM_2D ? { ...rest, path: b64Vecs.encodePoints(b64Vecs.decodePoints(segment.path, DIM_2D)) } : rest;
        });
      }
    }
  ]
});

// node_modules/@tldraw/tlschema/dist-esm/shapes/TLImageShape.mjs
var ImageShapeCrop = validation_exports.object({
  topLeft: vecModelValidator,
  bottomRight: vecModelValidator,
  isCircle: validation_exports.boolean.optional()
});
var imageShapeProps = {
  w: validation_exports.nonZeroNumber,
  h: validation_exports.nonZeroNumber,
  playing: validation_exports.boolean,
  url: validation_exports.linkUrl,
  assetId: assetIdValidator.nullable(),
  crop: ImageShapeCrop.nullable(),
  flipX: validation_exports.boolean,
  flipY: validation_exports.boolean,
  altText: validation_exports.string
};
var Versions9 = createShapePropsMigrationIds("image", {
  AddUrlProp: 1,
  AddCropProp: 2,
  MakeUrlsValid: 3,
  AddFlipProps: 4,
  AddAltText: 5
});
var imageShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: Versions9.AddUrlProp,
      up: (props) => {
        props.url = "";
      },
      down: "retired"
    },
    {
      id: Versions9.AddCropProp,
      up: (props) => {
        props.crop = null;
      },
      down: (props) => {
        delete props.crop;
      }
    },
    {
      id: Versions9.MakeUrlsValid,
      up: (props) => {
        if (!validation_exports.linkUrl.isValid(props.url)) {
          props.url = "";
        }
      },
      down: (_props) => {
      }
    },
    {
      id: Versions9.AddFlipProps,
      up: (props) => {
        props.flipX = false;
        props.flipY = false;
      },
      down: (props) => {
        delete props.flipX;
        delete props.flipY;
      }
    },
    {
      id: Versions9.AddAltText,
      up: (props) => {
        props.altText = "";
      },
      down: (props) => {
        delete props.altText;
      }
    }
  ]
});

// node_modules/@tldraw/tlschema/dist-esm/shapes/TLLineShape.mjs
var LineShapeSplineStyle = StyleProp.defineEnum("tldraw:spline", {
  defaultValue: "line",
  values: ["cubic", "line"]
});
var lineShapePointValidator = validation_exports.object({
  id: validation_exports.string,
  index: validation_exports.indexKey,
  x: validation_exports.number,
  y: validation_exports.number
});
var lineShapeProps = {
  color: DefaultColorStyle,
  dash: DefaultDashStyle,
  size: DefaultSizeStyle,
  spline: LineShapeSplineStyle,
  points: validation_exports.dict(validation_exports.string, lineShapePointValidator),
  scale: validation_exports.nonZeroNumber
};
var lineShapeVersions = createShapePropsMigrationIds("line", {
  AddSnapHandles: 1,
  RemoveExtraHandleProps: 2,
  HandlesToPoints: 3,
  PointIndexIds: 4,
  AddScale: 5
});
var lineShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: lineShapeVersions.AddSnapHandles,
      up: (props) => {
        for (const handle of Object.values(props.handles)) {
          ;
          handle.canSnap = true;
        }
      },
      down: "retired"
    },
    {
      id: lineShapeVersions.RemoveExtraHandleProps,
      up: (props) => {
        props.handles = objectMapFromEntries(
          Object.values(props.handles).map((handle) => [
            handle.index,
            {
              x: handle.x,
              y: handle.y
            }
          ])
        );
      },
      down: (props) => {
        const handles = Object.entries(props.handles).map(([index2, handle]) => ({ index: index2, ...handle })).sort(sortByIndex);
        props.handles = Object.fromEntries(
          handles.map((handle, i) => {
            const id = i === 0 ? "start" : i === handles.length - 1 ? "end" : `handle:${handle.index}`;
            return [
              id,
              {
                id,
                type: "vertex",
                canBind: false,
                canSnap: true,
                index: handle.index,
                x: handle.x,
                y: handle.y
              }
            ];
          })
        );
      }
    },
    {
      id: lineShapeVersions.HandlesToPoints,
      up: (props) => {
        const sortedHandles = Object.entries(props.handles).map(([index2, { x, y }]) => ({ x, y, index: index2 })).sort(sortByIndex);
        props.points = sortedHandles.map(({ x, y }) => ({ x, y }));
        delete props.handles;
      },
      down: (props) => {
        const indices = getIndices(props.points.length);
        props.handles = Object.fromEntries(
          props.points.map((handle, i) => {
            const index2 = indices[i];
            return [
              index2,
              {
                x: handle.x,
                y: handle.y
              }
            ];
          })
        );
        delete props.points;
      }
    },
    {
      id: lineShapeVersions.PointIndexIds,
      up: (props) => {
        const indices = getIndices(props.points.length);
        props.points = Object.fromEntries(
          props.points.map((point, i) => {
            const id = indices[i];
            return [
              id,
              {
                id,
                index: id,
                x: point.x,
                y: point.y
              }
            ];
          })
        );
      },
      down: (props) => {
        const sortedHandles = Object.values(props.points).sort(sortByIndex);
        props.points = sortedHandles.map(({ x, y }) => ({ x, y }));
      }
    },
    {
      id: lineShapeVersions.AddScale,
      up: (props) => {
        props.scale = 1;
      },
      down: (props) => {
        delete props.scale;
      }
    }
  ]
});

// node_modules/@tldraw/tlschema/dist-esm/shapes/TLNoteShape.mjs
var noteShapeProps = {
  color: DefaultColorStyle,
  labelColor: DefaultLabelColorStyle,
  size: DefaultSizeStyle,
  font: DefaultFontStyle,
  fontSizeAdjustment: validation_exports.positiveNumber.nullable(),
  align: DefaultHorizontalAlignStyle,
  verticalAlign: DefaultVerticalAlignStyle,
  growY: validation_exports.positiveNumber,
  url: validation_exports.linkUrl,
  richText: richTextValidator,
  scale: validation_exports.nonZeroNumber,
  textLastEditedBy: validation_exports.string.nullable()
};
var Versions10 = createShapePropsMigrationIds("note", {
  AddUrlProp: 1,
  RemoveJustify: 2,
  MigrateLegacyAlign: 3,
  AddVerticalAlign: 4,
  MakeUrlsValid: 5,
  AddFontSizeAdjustment: 6,
  AddScale: 7,
  AddLabelColor: 8,
  AddRichText: 9,
  AddRichTextAttrs: 10,
  AddFirstEditedBy: 11,
  MakeFontSizeAdjustmentRatio: 12,
  RenameFirstEditedByToLast: 13
});
var noteShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: Versions10.AddUrlProp,
      up: (props) => {
        props.url = "";
      },
      down: "retired"
    },
    {
      id: Versions10.RemoveJustify,
      up: (props) => {
        if (props.align === "justify") {
          props.align = "start";
        }
      },
      down: "retired"
    },
    {
      id: Versions10.MigrateLegacyAlign,
      up: (props) => {
        switch (props.align) {
          case "start":
            props.align = "start-legacy";
            return;
          case "end":
            props.align = "end-legacy";
            return;
          default:
            props.align = "middle-legacy";
            return;
        }
      },
      down: "retired"
    },
    {
      id: Versions10.AddVerticalAlign,
      up: (props) => {
        props.verticalAlign = "middle";
      },
      down: "retired"
    },
    {
      id: Versions10.MakeUrlsValid,
      up: (props) => {
        if (!validation_exports.linkUrl.isValid(props.url)) {
          props.url = "";
        }
      },
      down: (_props) => {
      }
    },
    {
      id: Versions10.AddFontSizeAdjustment,
      up: (props) => {
        props.fontSizeAdjustment = 0;
      },
      down: (props) => {
        delete props.fontSizeAdjustment;
      }
    },
    {
      id: Versions10.AddScale,
      up: (props) => {
        props.scale = 1;
      },
      down: (props) => {
        delete props.scale;
      }
    },
    {
      id: Versions10.AddLabelColor,
      up: (props) => {
        props.labelColor = "black";
      },
      down: (props) => {
        delete props.labelColor;
      }
    },
    {
      id: Versions10.AddRichText,
      up: (props) => {
        props.richText = toRichText(props.text);
        delete props.text;
      }
      // N.B. Explicitly no down state so that we force clients to update.
      // down: (props) => {
      // 	delete props.richText
      // },
    },
    {
      id: Versions10.AddRichTextAttrs,
      up: (_props) => {
      },
      down: (props) => {
        if (props.richText && "attrs" in props.richText) {
          delete props.richText.attrs;
        }
      }
    },
    {
      id: Versions10.AddFirstEditedBy,
      up: (props) => {
        props.textFirstEditedBy = null;
      },
      down: (props) => {
        delete props.textFirstEditedBy;
      }
    },
    {
      id: Versions10.MakeFontSizeAdjustmentRatio,
      up: (props) => {
        props.fontSizeAdjustment = props.fontSizeAdjustment === 0 ? 1 : null;
      },
      down: (props) => {
        props.fontSizeAdjustment = 0;
      }
    },
    {
      id: Versions10.RenameFirstEditedByToLast,
      up: (props) => {
        props.textLastEditedBy = props.textFirstEditedBy ?? null;
        delete props.textFirstEditedBy;
      },
      down: (props) => {
        props.textFirstEditedBy = props.textLastEditedBy ?? null;
        delete props.textLastEditedBy;
      }
    }
  ]
});

// node_modules/@tldraw/tlschema/dist-esm/styles/TLTextAlignStyle.mjs
var DefaultTextAlignStyle = StyleProp.defineEnum("tldraw:textAlign", {
  defaultValue: "start",
  values: ["start", "middle", "end"]
});

// node_modules/@tldraw/tlschema/dist-esm/shapes/TLTextShape.mjs
var textShapeProps = {
  color: DefaultColorStyle,
  size: DefaultSizeStyle,
  font: DefaultFontStyle,
  textAlign: DefaultTextAlignStyle,
  w: validation_exports.nonZeroNumber,
  richText: richTextValidator,
  scale: validation_exports.nonZeroNumber,
  autoSize: validation_exports.boolean
};
var Versions11 = createShapePropsMigrationIds("text", {
  RemoveJustify: 1,
  AddTextAlign: 2,
  AddRichText: 3,
  AddRichTextAttrs: 4
});
var textShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: Versions11.RemoveJustify,
      up: (props) => {
        if (props.align === "justify") {
          props.align = "start";
        }
      },
      down: "retired"
    },
    {
      id: Versions11.AddTextAlign,
      up: (props) => {
        props.textAlign = props.align;
        delete props.align;
      },
      down: (props) => {
        props.align = props.textAlign;
        delete props.textAlign;
      }
    },
    {
      id: Versions11.AddRichText,
      up: (props) => {
        props.richText = toRichText(props.text);
        delete props.text;
      }
      // N.B. Explicitly no down state so that we force clients to update.
      // down: (props) => {
      // 	delete props.richText
      // },
    },
    {
      id: Versions11.AddRichTextAttrs,
      up: (_props) => {
      },
      down: (props) => {
        if (props.richText && "attrs" in props.richText) {
          delete props.richText.attrs;
        }
      }
    }
  ]
});

// node_modules/@tldraw/tlschema/dist-esm/shapes/TLVideoShape.mjs
var videoShapeProps = {
  w: validation_exports.nonZeroNumber,
  h: validation_exports.nonZeroNumber,
  time: validation_exports.number,
  playing: validation_exports.boolean,
  autoplay: validation_exports.boolean,
  url: validation_exports.linkUrl,
  assetId: assetIdValidator.nullable(),
  altText: validation_exports.string
};
var Versions12 = createShapePropsMigrationIds("video", {
  AddUrlProp: 1,
  MakeUrlsValid: 2,
  AddAltText: 3,
  AddAutoplay: 4
});
var videoShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: Versions12.AddUrlProp,
      up: (props) => {
        props.url = "";
      },
      down: "retired"
    },
    {
      id: Versions12.MakeUrlsValid,
      up: (props) => {
        if (!validation_exports.linkUrl.isValid(props.url)) {
          props.url = "";
        }
      },
      down: (_props) => {
      }
    },
    {
      id: Versions12.AddAltText,
      up: (props) => {
        props.altText = "";
      },
      down: (props) => {
        delete props.altText;
      }
    },
    {
      id: Versions12.AddAutoplay,
      up: (props) => {
        props.autoplay = true;
      },
      down: (props) => {
        delete props.autoplay;
      }
    }
  ]
});

// node_modules/@tldraw/tlschema/dist-esm/store-migrations.mjs
var Versions13 = createMigrationIds("com.tldraw.store", {
  RemoveCodeAndIconShapeTypes: 1,
  AddInstancePresenceType: 2,
  RemoveTLUserAndPresenceAndAddPointer: 3,
  RemoveUserDocument: 4,
  FixIndexKeys: 5
});
var storeMigrations = createMigrationSequence({
  sequenceId: "com.tldraw.store",
  retroactive: false,
  sequence: [
    {
      id: Versions13.RemoveCodeAndIconShapeTypes,
      scope: "storage",
      up: (storage) => {
        for (const [id, record] of storage.entries()) {
          if (record.typeName === "shape" && "type" in record && (record.type === "icon" || record.type === "code")) {
            storage.delete(id);
          }
        }
      }
    },
    {
      id: Versions13.AddInstancePresenceType,
      scope: "storage",
      up(_storage) {
      }
    },
    {
      // remove user and presence records and add pointer records
      id: Versions13.RemoveTLUserAndPresenceAndAddPointer,
      scope: "storage",
      up: (storage) => {
        for (const [id, record] of storage.entries()) {
          if (record.typeName.match(/^(user|user_presence)$/)) {
            storage.delete(id);
          }
        }
      }
    },
    {
      // remove user document records
      id: Versions13.RemoveUserDocument,
      scope: "storage",
      up: (storage) => {
        for (const [id, record] of storage.entries()) {
          if (record.typeName.match("user_document")) {
            storage.delete(id);
          }
        }
      }
    },
    {
      id: Versions13.FixIndexKeys,
      scope: "record",
      up: (record) => {
        if (["shape", "page"].includes(record.typeName) && "index" in record) {
          const recordWithIndex = record;
          if (recordWithIndex.index.endsWith("0") && recordWithIndex.index !== "a0") {
            recordWithIndex.index = recordWithIndex.index.slice(0, -1) + getNRandomBase62Digits(3);
          }
          if (record.typeName === "shape" && recordWithIndex.type === "line") {
            const lineShape = recordWithIndex;
            for (const [_, point] of objectMapEntries(lineShape.props.points)) {
              if (point.index.endsWith("0") && point.index !== "a0") {
                point.index = point.index.slice(0, -1) + getNRandomBase62Digits(3);
              }
            }
          }
        }
      },
      down: () => {
      }
    }
  ]
});
var BASE_62_DIGITS_WITHOUT_ZERO = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
var getRandomBase62Digit = () => {
  return BASE_62_DIGITS_WITHOUT_ZERO.charAt(
    Math.floor(Math.random() * BASE_62_DIGITS_WITHOUT_ZERO.length)
  );
};
var getNRandomBase62Digits = (n) => {
  return Array.from({ length: n }, getRandomBase62Digit).join("");
};

// node_modules/@tldraw/tlschema/dist-esm/TLStore.mjs
function redactRecordForErrorReporting(record) {
  if (record.typeName === "asset") {
    if ("src" in record) {
      record.src = "<redacted>";
    }
    if ("src" in record.props) {
      record.props.src = "<redacted>";
    }
  }
}
function onValidationFailure({
  error,
  phase,
  record,
  recordBefore
}) {
  const isExistingValidationIssue = (
    // if we're initializing the store for the first time, we should
    // allow invalid records so people can load old buggy data:
    phase === "initialize"
  );
  annotateError(error, {
    tags: {
      origin: "store.validateRecord",
      storePhase: phase,
      isExistingValidationIssue
    },
    extras: {
      recordBefore: recordBefore ? redactRecordForErrorReporting(structuredClone(recordBefore)) : void 0,
      recordAfter: redactRecordForErrorReporting(structuredClone(record))
    }
  });
  throw error;
}
function getDefaultPages() {
  return [
    PageRecordType.create({
      id: "page:page",
      name: "Page 1",
      index: "a1",
      meta: {}
    })
  ];
}
function createIntegrityChecker(store) {
  const $pageIds = store.query.ids("page");
  const $pageStates = store.query.records("instance_page_state");
  const ensureStoreIsUsable = () => {
    if (!store.has(TLDOCUMENT_ID)) {
      store.put([DocumentRecordType.create({ id: TLDOCUMENT_ID, name: store.props.defaultName })]);
      return ensureStoreIsUsable();
    }
    if (!store.has(TLPOINTER_ID)) {
      store.put([PointerRecordType.create({ id: TLPOINTER_ID })]);
      return ensureStoreIsUsable();
    }
    const pageIds = $pageIds.get();
    if (pageIds.size === 0) {
      store.put(getDefaultPages());
      return ensureStoreIsUsable();
    }
    const getFirstPageId = () => [...pageIds].map((id) => store.get(id)).sort(sortByIndex)[0].id;
    const instanceState = store.get(TLINSTANCE_ID);
    if (!instanceState) {
      store.put([
        store.schema.types.instance.create({
          id: TLINSTANCE_ID,
          currentPageId: getFirstPageId(),
          exportBackground: true
        })
      ]);
      return ensureStoreIsUsable();
    } else if (!pageIds.has(instanceState.currentPageId)) {
      store.put([{ ...instanceState, currentPageId: getFirstPageId() }]);
      return ensureStoreIsUsable();
    }
    const missingPageStateIds = /* @__PURE__ */ new Set();
    const missingCameraIds = /* @__PURE__ */ new Set();
    for (const id of pageIds) {
      const pageStateId = InstancePageStateRecordType.createId(id);
      const pageState = store.get(pageStateId);
      if (!pageState) {
        missingPageStateIds.add(pageStateId);
      }
      const cameraId = CameraRecordType.createId(id);
      if (!store.has(cameraId)) {
        missingCameraIds.add(cameraId);
      }
    }
    if (missingPageStateIds.size > 0) {
      store.put(
        [...missingPageStateIds].map(
          (id) => InstancePageStateRecordType.create({
            id,
            pageId: InstancePageStateRecordType.parseId(id)
          })
        )
      );
    }
    if (missingCameraIds.size > 0) {
      store.put([...missingCameraIds].map((id) => CameraRecordType.create({ id })));
    }
    const pageStates = $pageStates.get();
    for (const pageState of pageStates) {
      if (!pageIds.has(pageState.pageId)) {
        store.remove([pageState.id]);
        continue;
      }
      if (pageState.croppingShapeId && !store.has(pageState.croppingShapeId)) {
        store.put([{ ...pageState, croppingShapeId: null }]);
        return ensureStoreIsUsable();
      }
      if (pageState.focusedGroupId && !store.has(pageState.focusedGroupId)) {
        store.put([{ ...pageState, focusedGroupId: null }]);
        return ensureStoreIsUsable();
      }
      if (pageState.hoveredShapeId && !store.has(pageState.hoveredShapeId)) {
        store.put([{ ...pageState, hoveredShapeId: null }]);
        return ensureStoreIsUsable();
      }
      const filteredSelectedIds = pageState.selectedShapeIds.filter((id) => store.has(id));
      if (filteredSelectedIds.length !== pageState.selectedShapeIds.length) {
        store.put([{ ...pageState, selectedShapeIds: filteredSelectedIds }]);
        return ensureStoreIsUsable();
      }
      const filteredHintingIds = pageState.hintingShapeIds.filter((id) => store.has(id));
      if (filteredHintingIds.length !== pageState.hintingShapeIds.length) {
        store.put([{ ...pageState, hintingShapeIds: filteredHintingIds }]);
        return ensureStoreIsUsable();
      }
      const filteredErasingIds = pageState.erasingShapeIds.filter((id) => store.has(id));
      if (filteredErasingIds.length !== pageState.erasingShapeIds.length) {
        store.put([{ ...pageState, erasingShapeIds: filteredErasingIds }]);
        return ensureStoreIsUsable();
      }
    }
  };
  return ensureStoreIsUsable;
}

// node_modules/@tldraw/tlschema/dist-esm/createTLSchema.mjs
var defaultShapeSchemas = {
  arrow: { migrations: arrowShapeMigrations, props: arrowShapeProps },
  bookmark: { migrations: bookmarkShapeMigrations, props: bookmarkShapeProps },
  draw: { migrations: drawShapeMigrations, props: drawShapeProps },
  embed: { migrations: embedShapeMigrations, props: embedShapeProps },
  frame: { migrations: frameShapeMigrations, props: frameShapeProps },
  geo: { migrations: geoShapeMigrations, props: geoShapeProps },
  group: { migrations: groupShapeMigrations, props: groupShapeProps },
  highlight: { migrations: highlightShapeMigrations, props: highlightShapeProps },
  image: { migrations: imageShapeMigrations, props: imageShapeProps },
  line: { migrations: lineShapeMigrations, props: lineShapeProps },
  note: { migrations: noteShapeMigrations, props: noteShapeProps },
  text: { migrations: textShapeMigrations, props: textShapeProps },
  video: { migrations: videoShapeMigrations, props: videoShapeProps }
};
var defaultBindingSchemas = {
  arrow: { migrations: arrowBindingMigrations, props: arrowBindingProps }
};
var defaultAssetSchemas = {
  image: { migrations: imageAssetMigrations, props: imageAssetProps },
  video: { migrations: videoAssetMigrations, props: videoAssetProps },
  bookmark: { migrations: bookmarkAssetMigrations, props: bookmarkAssetProps }
};
function createTLSchema({
  shapes = defaultShapeSchemas,
  bindings = defaultBindingSchemas,
  assets = defaultAssetSchemas,
  user,
  records: records2 = {},
  migrations
} = {}) {
  const stylesById = /* @__PURE__ */ new Map();
  for (const shape of objectMapValues(shapes)) {
    for (const style of getShapePropKeysByStyle(shape.props ?? {}).keys()) {
      if (stylesById.has(style.id) && stylesById.get(style.id) !== style) {
        throw new Error(`Multiple StyleProp instances with the same id: ${style.id}`);
      }
      stylesById.set(style.id, style);
    }
  }
  const ShapeRecordType = createShapeRecordType(shapes);
  const BindingRecordType = createBindingRecordType(bindings);
  const _AssetRecordType = createAssetRecordType(assets);
  const InstanceRecordType = createInstanceRecordType(stylesById);
  const CustomUserRecordType = user ? createUserRecordType(user) : UserRecordType;
  const builtInTypeNames = /* @__PURE__ */ new Set([
    "asset",
    "binding",
    "camera",
    "document",
    "instance",
    "instance_page_state",
    "page",
    "instance_presence",
    "pointer",
    "shape",
    "store",
    "user"
  ]);
  const customRecordTypes = {};
  for (const [typeName, config] of Object.entries(records2)) {
    if (builtInTypeNames.has(typeName)) {
      throw new Error(
        `Custom record type name '${typeName}' conflicts with tldraw's built-in record type of that name. Choose a different name instead.`
      );
    }
    customRecordTypes[typeName] = createCustomRecordType(typeName, config);
  }
  return StoreSchema.create(
    {
      asset: _AssetRecordType,
      binding: BindingRecordType,
      camera: CameraRecordType,
      document: DocumentRecordType,
      instance: InstanceRecordType,
      instance_page_state: InstancePageStateRecordType,
      page: PageRecordType,
      instance_presence: InstancePresenceRecordType,
      pointer: PointerRecordType,
      shape: ShapeRecordType,
      user: CustomUserRecordType,
      ...customRecordTypes
    },
    {
      migrations: [
        storeMigrations,
        assetMigrations,
        cameraMigrations,
        documentMigrations,
        instanceMigrations,
        instancePageStateMigrations,
        pageMigrations,
        instancePresenceMigrations,
        pointerMigrations,
        rootShapeMigrations,
        userMigrations,
        ...processPropsMigrations("asset", assets),
        ...processPropsMigrations("shape", shapes),
        ...processPropsMigrations("binding", bindings),
        ...processCustomRecordMigrations(records2),
        ...user?.migrations ?? [],
        ...migrations ?? []
      ],
      onValidationFailure,
      createIntegrityChecker
    }
  );
}

// node_modules/@tldraw/tlschema/dist-esm/index.mjs
registerTldrawLibraryVersion(
  "@tldraw/tlschema",
  "5.2.5",
  "esm"
);

// node_modules/@tldraw/sync-core/dist-esm/lib/MicrotaskNotifier.mjs
var MicrotaskNotifier = class {
  listeners = /* @__PURE__ */ new Set();
  notify(...props) {
    queueMicrotask(() => {
      for (const listener of this.listeners) {
        try {
          listener(...props);
        } catch (error) {
          console.error("Error in MicrotaskNotifier listener", error);
        }
      }
    });
  }
  register(_listener) {
    let didDelete = false;
    queueMicrotask(() => {
      if (didDelete) return;
      this.listeners.add(_listener);
    });
    return () => {
      if (didDelete) return;
      didDelete = true;
      this.listeners.delete(_listener);
    };
  }
};

// node_modules/@tldraw/sync-core/dist-esm/lib/InMemorySyncStorage.mjs
var TOMBSTONE_PRUNE_BUFFER_SIZE = 1e3;
var MAX_TOMBSTONES = 5e3;
function computeTombstonePruning({
  tombstones,
  documentClock,
  maxTombstones = MAX_TOMBSTONES,
  pruneBufferSize = TOMBSTONE_PRUNE_BUFFER_SIZE
}) {
  if (tombstones.length <= maxTombstones) {
    return null;
  }
  let cutoff = pruneBufferSize + tombstones.length - maxTombstones;
  while (cutoff < tombstones.length && tombstones[cutoff - 1]?.clock === tombstones[cutoff]?.clock) {
    cutoff++;
  }
  const oldestRemaining = tombstones[cutoff];
  const newTombstoneHistoryStartsAtClock = oldestRemaining?.clock ?? documentClock;
  const idsToDelete = tombstones.slice(0, cutoff).map((t) => t.id);
  return { newTombstoneHistoryStartsAtClock, idsToDelete };
}
var DEFAULT_INITIAL_SNAPSHOT = {
  documentClock: 0,
  tombstoneHistoryStartsAtClock: 0,
  schema: createTLSchema().serialize(),
  documents: [
    {
      state: DocumentRecordType.create({ id: TLDOCUMENT_ID }),
      lastChangedClock: 0
    },
    {
      state: PageRecordType.create({
        id: "page:page",
        name: "Page 1",
        index: "a1"
      }),
      lastChangedClock: 0
    }
  ]
};
var InMemorySyncStorage = class {
  /** @internal */
  documents;
  /** @internal */
  tombstones;
  /** @internal */
  schema;
  /** @internal */
  documentClock;
  /** @internal */
  tombstoneHistoryStartsAtClock;
  notifier = new MicrotaskNotifier();
  onChange(callback) {
    return this.notifier.register(callback);
  }
  constructor({
    snapshot = DEFAULT_INITIAL_SNAPSHOT,
    onChange
  } = {}) {
    const maxClockValue = Math.max(
      0,
      ...Object.values(snapshot.tombstones ?? {}),
      ...Object.values(snapshot.documents.map((d) => d.lastChangedClock))
    );
    this.documents = new AtomMap(
      "room documents",
      snapshot.documents.map((d) => [
        d.state.id,
        { state: devFreeze(d.state), lastChangedClock: d.lastChangedClock }
      ])
    );
    const documentClock = Math.max(maxClockValue, snapshot.documentClock ?? snapshot.clock ?? 0);
    this.documentClock = atom("document clock", documentClock);
    const tombstoneHistoryStartsAtClock = Math.min(
      snapshot.tombstoneHistoryStartsAtClock ?? documentClock,
      documentClock
    );
    this.tombstoneHistoryStartsAtClock = atom(
      "tombstone history starts at clock",
      tombstoneHistoryStartsAtClock
    );
    this.schema = atom("schema", snapshot.schema ?? createTLSchema().serializeEarliestVersion());
    this.tombstones = new AtomMap(
      "room tombstones",
      // If the tombstone history starts now (or we didn't have the
      // tombstoneHistoryStartsAtClock) then there are no tombstones
      tombstoneHistoryStartsAtClock === documentClock ? [] : objectMapEntries(snapshot.tombstones ?? {})
    );
    if (onChange) {
      this.onChange(onChange);
    }
  }
  transaction(callback, opts) {
    const clockBefore = this.documentClock.get();
    const trackChanges = opts?.emitChanges === "always";
    const txn = new InMemorySyncStorageTransaction(this);
    let result;
    let changes;
    try {
      result = transaction(() => {
        return callback(txn);
      });
      if (trackChanges) {
        changes = txn.getChangesSince(clockBefore)?.diff;
      }
    } catch (error) {
      console.error("Error in transaction", error);
      throw error;
    } finally {
      txn.close();
    }
    if (typeof result === "object" && result && "then" in result && typeof result.then === "function") {
      const err = new Error("Transaction must return a value, not a promise");
      console.error(err);
      throw err;
    }
    const clockAfter = this.documentClock.get();
    const didChange = clockAfter > clockBefore;
    if (didChange) {
      this.notifier.notify({ id: opts?.id, documentClock: clockAfter });
    }
    return { documentClock: clockAfter, didChange: clockAfter > clockBefore, result, changes };
  }
  getClock() {
    return this.documentClock.get();
  }
  /** @internal */
  pruneTombstones = (0, import_lodash4.default)(
    () => {
      if (this.tombstones.size > MAX_TOMBSTONES) {
        const tombstones = Array.from(this.tombstones.entries()).map(([id, clock]) => ({ id, clock })).sort((a, b) => a.clock - b.clock);
        const result = computeTombstonePruning({
          tombstones,
          documentClock: this.documentClock.get()
        });
        if (result) {
          this.tombstoneHistoryStartsAtClock.set(result.newTombstoneHistoryStartsAtClock);
          this.tombstones.deleteMany(result.idsToDelete);
        }
      }
    },
    1e3,
    // prevent this from running synchronously to avoid blocking requests
    { leading: false }
  );
  getSnapshot() {
    return {
      tombstoneHistoryStartsAtClock: this.tombstoneHistoryStartsAtClock.get(),
      documentClock: this.documentClock.get(),
      documents: Array.from(this.documents.values()),
      tombstones: Object.fromEntries(this.tombstones.entries()),
      schema: this.schema.get()
    };
  }
};
var InMemorySyncStorageTransaction = class {
  constructor(storage) {
    this.storage = storage;
    this._clock = this.storage.documentClock.get();
  }
  storage;
  _clock;
  _closed = false;
  /** @internal */
  close() {
    this._closed = true;
  }
  assertNotClosed() {
    assert(!this._closed, "Transaction has ended, iterator cannot be consumed");
  }
  getClock() {
    return this._clock;
  }
  didIncrementClock = false;
  getNextClock() {
    if (!this.didIncrementClock) {
      this.didIncrementClock = true;
      this._clock = this.storage.documentClock.set(this.storage.documentClock.get() + 1);
    }
    return this._clock;
  }
  get(id) {
    this.assertNotClosed();
    return this.storage.documents.get(id)?.state;
  }
  set(id, record) {
    this.assertNotClosed();
    assert(id === record.id, `Record id mismatch: key does not match record.id`);
    const clock = this.getNextClock();
    if (this.storage.tombstones.has(id)) {
      this.storage.tombstones.delete(id);
    }
    this.storage.documents.set(id, {
      state: devFreeze(record),
      lastChangedClock: clock
    });
  }
  delete(id) {
    this.assertNotClosed();
    if (!this.storage.documents.has(id)) return;
    const clock = this.getNextClock();
    this.storage.documents.delete(id);
    this.storage.tombstones.set(id, clock);
    this.storage.pruneTombstones();
  }
  *entries() {
    this.assertNotClosed();
    for (const [id, record] of this.storage.documents.entries()) {
      this.assertNotClosed();
      yield [id, record.state];
    }
  }
  *keys() {
    this.assertNotClosed();
    for (const key of this.storage.documents.keys()) {
      this.assertNotClosed();
      yield key;
    }
  }
  *values() {
    this.assertNotClosed();
    for (const record of this.storage.documents.values()) {
      this.assertNotClosed();
      yield record.state;
    }
  }
  getSchema() {
    this.assertNotClosed();
    return this.storage.schema.get();
  }
  setSchema(schema2) {
    this.assertNotClosed();
    this.storage.schema.set(schema2);
  }
  getChangesSince(sinceClock) {
    this.assertNotClosed();
    const clock = this.storage.documentClock.get();
    if (sinceClock === clock) return void 0;
    if (sinceClock > clock) {
      sinceClock = -1;
    }
    const diff = { puts: {}, deletes: [] };
    const wipeAll = sinceClock < this.storage.tombstoneHistoryStartsAtClock.get();
    for (const doc of this.storage.documents.values()) {
      if (wipeAll || doc.lastChangedClock > sinceClock) {
        diff.puts[doc.state.id] = doc.state;
      }
    }
    if (!wipeAll) {
      for (const [id, clock2] of this.storage.tombstones.entries()) {
        if (clock2 > sinceClock) {
          diff.deletes.push(id);
        }
      }
    }
    return { diff, wipeAll };
  }
};

// node_modules/@tldraw/sync-core/dist-esm/lib/RoomSession.mjs
var RoomSessionState = {
  /** Session is waiting for the initial connect message from the client */
  AwaitingConnectMessage: "awaiting-connect-message",
  /** Session is disconnected but waiting for final cleanup before removal */
  AwaitingRemoval: "awaiting-removal",
  /** Session is fully connected and actively synchronizing */
  Connected: "connected"
};
var SESSION_START_WAIT_TIME = 1e4;
var SESSION_REMOVAL_WAIT_TIME = 5e3;
var SESSION_IDLE_TIMEOUT = 2e4;

// node_modules/@tldraw/sync-core/dist-esm/lib/TLSyncStorage.mjs
function toNetworkDiff(diff) {
  const networkDiff = {};
  for (const [id, put2] of objectMapEntriesIterable(diff.puts)) {
    if (Array.isArray(put2)) {
      const patch = diffRecord(put2[0], put2[1]);
      if (patch) {
        networkDiff[id] = [RecordOpType.Patch, patch];
      }
    } else {
      networkDiff[id] = [RecordOpType.Put, put2];
    }
  }
  for (const id of diff.deletes) {
    networkDiff[id] = [RecordOpType.Remove];
  }
  return networkDiff;
}
function loadSnapshotIntoStorage(txn, schema2, snapshot) {
  snapshot = convertStoreSnapshotToRoomSnapshot(snapshot);
  assert(snapshot.schema, "Schema is required");
  const docIds = /* @__PURE__ */ new Set();
  for (const doc of snapshot.documents) {
    docIds.add(doc.state.id);
    const existing = txn.get(doc.state.id);
    if ((0, import_lodash2.default)(existing, doc.state)) continue;
    txn.set(doc.state.id, doc.state);
  }
  for (const id of txn.keys()) {
    if (!docIds.has(id)) {
      txn.delete(id);
    }
  }
  txn.setSchema(snapshot.schema);
  schema2.migrateStorage(txn);
}
function convertStoreSnapshotToRoomSnapshot(snapshot) {
  if ("documents" in snapshot) return snapshot;
  return {
    clock: 0,
    documentClock: 0,
    documents: objectMapValues(snapshot.store).map((state) => ({
      state,
      lastChangedClock: 0
    })),
    schema: snapshot.schema,
    tombstones: {}
  };
}

// node_modules/@tldraw/sync-core/dist-esm/lib/SQLiteSyncStorage.mjs
var textEncoder = new TextEncoder();
var textDecoder = new TextDecoder();

// node_modules/@tldraw/sync-core/dist-esm/lib/ServerSocketAdapter.mjs
var ServerSocketAdapter = class {
  /**
   * Creates a new ServerSocketAdapter instance.
   *
   * opts - Configuration options for the adapter
   */
  constructor(opts) {
    this.opts = opts;
  }
  opts;
  /**
   * Checks if the underlying WebSocket connection is currently open and ready to send messages.
   *
   * @returns True if the connection is open (readyState === 1), false otherwise
   */
  // eslint-disable-next-line tldraw/no-setter-getter
  get isOpen() {
    return this.opts.ws.readyState === 1;
  }
  /**
   * Sends a sync protocol message to the connected client. The message is JSON stringified
   * before being sent through the WebSocket. If configured, the onBeforeSendMessage callback
   * is invoked before sending.
   *
   * @param msg - The sync protocol message to send
   */
  // see TLRoomSocket for details on why this accepts a union and not just arrays
  sendMessage(msg) {
    const message = JSON.stringify(msg);
    this.opts.onBeforeSendMessage?.(msg, message);
    this.opts.ws.send(message);
  }
  /**
   * Closes the WebSocket connection with an optional close code and reason.
   *
   * @param code - Optional close code (default: 1000 for normal closure)
   * @param reason - Optional human-readable reason for closing
   */
  close(code, reason) {
    this.opts.ws.close(code, reason);
  }
};

// node_modules/nanoevents/index.js
var createNanoEvents = () => ({
  events: {},
  emit(event, ...args) {
    let callbacks = this.events[event] || [];
    for (let i = 0, length = callbacks.length; i < length; i++) {
      callbacks[i](...args);
    }
  },
  on(event, cb) {
    this.events[event]?.push(cb) || (this.events[event] = [cb]);
    return () => {
      this.events[event] = this.events[event]?.filter((i) => cb !== i);
    };
  }
});

// node_modules/@tldraw/sync-core/dist-esm/lib/recordDiff.mjs
function diffAndValidateRecord(prevState, newState, recordType, legacyAppendMode = false) {
  const diff = diffRecord(prevState, newState, legacyAppendMode);
  if (!diff) return;
  try {
    recordType.validate(newState);
  } catch (error) {
    throw new TLSyncError(error.message, TLSyncErrorCloseEventReason.INVALID_RECORD);
  }
  return diff;
}
function applyAndDiffRecord(prevState, diff, recordType, legacyAppendMode = false) {
  const newState = applyObjectDiff(prevState, diff);
  if (newState === prevState) return;
  const actualDiff = diffAndValidateRecord(prevState, newState, recordType, legacyAppendMode);
  if (!actualDiff) return;
  return [actualDiff, newState];
}
function validateRecord(state, recordType) {
  try {
    recordType.validate(state);
  } catch (error) {
    throw new TLSyncError(error.message, TLSyncErrorCloseEventReason.INVALID_RECORD);
  }
}

// node_modules/@tldraw/sync-core/dist-esm/lib/TLSyncRoom.mjs
var DATA_MESSAGE_DEBOUNCE_INTERVAL = 1e3 / 60;
var timeSince = (time) => Date.now() - time;
var TLSyncRoom = class {
  // A table of connected clients
  sessions = /* @__PURE__ */ new Map();
  lastDocumentClock = 0;
  pruneTimer = null;
  pruneSessions = (0, import_lodash4.default)(() => {
    if (this.pruneTimer) {
      clearTimeout(this.pruneTimer);
      this.pruneTimer = null;
    }
    for (const client of this.sessions.values()) {
      switch (client.state) {
        case RoomSessionState.Connected: {
          const hasTimedOut = timeSince(client.lastInteractionTime) > this.sessionIdleTimeout;
          if (hasTimedOut || !client.socket.isOpen) {
            this.cancelSession(client.sessionId);
          }
          break;
        }
        case RoomSessionState.AwaitingConnectMessage: {
          const hasTimedOut = timeSince(client.sessionStartTime) > SESSION_START_WAIT_TIME;
          if (hasTimedOut || !client.socket.isOpen) {
            this.removeSession(client.sessionId);
          } else {
            this.scheduleFollowUpPrune();
          }
          break;
        }
        case RoomSessionState.AwaitingRemoval: {
          const hasTimedOut = timeSince(client.cancellationTime) > SESSION_REMOVAL_WAIT_TIME;
          if (hasTimedOut) {
            this.removeSession(client.sessionId);
          } else {
            this.scheduleFollowUpPrune();
          }
          break;
        }
        default: {
          exhaustiveSwitchError(client);
        }
      }
    }
  }, 1e3);
  scheduleFollowUpPrune() {
    if (this.pruneTimer) return;
    this.pruneTimer = setTimeout(this.pruneSessions, SESSION_REMOVAL_WAIT_TIME + 100);
  }
  presenceStore = new PresenceStore();
  disposables = [];
  _isClosed = false;
  /**
   * Close the room and clean up all resources. Disconnects all sessions
   * and stops background processes.
   */
  close() {
    this.disposables.forEach((d) => d());
    this.sessions.forEach((session) => {
      session.socket.close();
    });
    this._isClosed = true;
  }
  /**
   * Check if the room has been closed and is no longer accepting connections.
   *
   * @returns True if the room is closed
   */
  isClosed() {
    return this._isClosed;
  }
  events = createNanoEvents();
  // Storage layer for documents, tombstones, and clocks
  storage;
  serializedSchema;
  documentTypes;
  presenceType;
  log;
  schema;
  sessionIdleTimeout;
  constructor(opts) {
    this.schema = opts.schema;
    this.log = opts.log;
    this.onPresenceChange = opts.onPresenceChange;
    this.storage = opts.storage;
    this.sessionIdleTimeout = opts.clientTimeout ?? SESSION_IDLE_TIMEOUT;
    assert(
      isNativeStructuredClone,
      "TLSyncRoom is supposed to run either on Cloudflare Workersor on a 18+ version of Node.js, which both support the native structuredClone API"
    );
    this.serializedSchema = JSON.parse(JSON.stringify(this.schema.serialize()));
    this.documentTypes = new Set(
      Object.values(this.schema.types).filter((t) => t.scope === "document").map((t) => t.typeName)
    );
    const presenceTypes = new Set(
      Object.values(this.schema.types).filter((t) => t.scope === "presence")
    );
    if (presenceTypes.size > 1) {
      throw new Error(
        `TLSyncRoom: exactly zero or one presence type is expected, but found ${presenceTypes.size}`
      );
    }
    this.presenceType = presenceTypes.values().next()?.value ?? null;
    const { documentClock } = this.storage.transaction((txn) => {
      this.schema.migrateStorage(txn);
    });
    this.lastDocumentClock = documentClock;
    this.disposables.push(
      this.storage.onChange(({ id }) => {
        if (id !== this.internalTxnId) {
          this.broadcastExternalStorageChanges();
        }
      })
    );
    this.disposables.push(() => {
      this.pruneSessions.cancel();
      if (this.pruneTimer) {
        clearTimeout(this.pruneTimer);
        this.pruneTimer = null;
      }
    });
    if (Number.isFinite(this.sessionIdleTimeout) && this.sessionIdleTimeout > 0) {
      const pruneIntervalMs = Math.min(2e3, Math.floor(this.sessionIdleTimeout / 4));
      this.disposables.push(interval(() => this.pruneSessions(), pruneIntervalMs));
    }
  }
  broadcastExternalStorageChanges() {
    this.storage.transaction((txn) => {
      this.broadcastChanges(txn);
      this.lastDocumentClock = txn.getClock();
    });
  }
  /**
   * Send a message to a particular client. Debounces data events
   *
   * @param sessionId - The id of the session to send the message to.
   * @param message - The message to send. UNSAFE Any diffs must have been downgraded already if necessary
   */
  _unsafe_sendMessage(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.log?.warn?.("Tried to send message to unknown session", message.type);
      return;
    }
    if (session.state !== RoomSessionState.Connected) {
      this.log?.warn?.("Tried to send message to disconnected client", message.type);
      return;
    }
    if (session.socket.isOpen) {
      if (message.type !== "patch" && message.type !== "push_result") {
        if (message.type !== "pong") {
          this._flushDataMessages(sessionId);
        }
        session.socket.sendMessage(message);
      } else {
        if (session.debounceTimer === null) {
          session.socket.sendMessage({ type: "data", data: [message] });
          session.debounceTimer = setTimeout(
            () => this._flushDataMessages(sessionId),
            DATA_MESSAGE_DEBOUNCE_INTERVAL
          );
        } else {
          session.outstandingDataMessages.push(message);
        }
      }
    } else {
      this.cancelSession(session.sessionId);
    }
  }
  // needs to accept sessionId and not a session because the session might be dead by the time
  // the timer fires
  _flushDataMessages(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session || session.state !== RoomSessionState.Connected) {
      return;
    }
    session.debounceTimer = null;
    if (session.outstandingDataMessages.length > 0) {
      const data = session.outstandingDataMessages;
      session.outstandingDataMessages = [];
      session.socket.sendMessage({ type: "data", data });
    }
  }
  /** @internal */
  removeSession(sessionId, fatalReason) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.log?.warn?.("Tried to remove unknown session");
      return;
    }
    this.sessions.delete(sessionId);
    try {
      if (fatalReason) {
        session.socket.close(TLSyncErrorCloseEventCode, fatalReason);
      } else {
        session.socket.close();
      }
    } catch {
    }
    const presence = this.presenceStore.get(session.presenceId ?? "");
    if (presence) {
      this.presenceStore.delete(session.presenceId);
      this.broadcastPatch({
        puts: {},
        deletes: [session.presenceId]
      });
    }
    this.events.emit("session_removed", { sessionId, meta: session.meta });
    if (this.sessions.size === 0) {
      this.events.emit("room_became_empty");
    }
  }
  cancelSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }
    if (session.state === RoomSessionState.AwaitingRemoval) {
      this.log?.warn?.("Tried to cancel session that is already awaiting removal");
      return;
    }
    this.sessions.set(sessionId, {
      state: RoomSessionState.AwaitingRemoval,
      sessionId,
      presenceId: session.presenceId,
      socket: session.socket,
      cancellationTime: Date.now(),
      meta: session.meta,
      isReadonly: session.isReadonly,
      requiresLegacyRejection: session.requiresLegacyRejection,
      supportsStringAppend: session.supportsStringAppend
    });
    try {
      session.socket.close();
    } catch {
    }
    this.scheduleFollowUpPrune();
  }
  internalTxnId = "TLSyncRoom.txn";
  /**
   * Broadcast a patch to all connected clients except the one with the sessionId provided.
   *
   * @param diff - The TLSyncForwardDiff with full records (used for migration)
   * @param networkDiff - Optional pre-computed NetworkDiff for sessions not needing migration.
   *                      If not provided, will be computed from recordsDiff.
   * @param sourceSessionId - Optional session ID to exclude from the broadcast
   */
  broadcastPatch(diff, networkDiff, sourceSessionId) {
    const unmigrated = networkDiff ?? toNetworkDiff(diff);
    if (!unmigrated) return this;
    this.sessions.forEach((session) => {
      if (session.state !== RoomSessionState.Connected) return;
      if (sourceSessionId === session.sessionId) return;
      if (!session.socket.isOpen) {
        this.cancelSession(session.sessionId);
        return;
      }
      const diffResult = this.migrateDiffOrRejectSession(
        session.sessionId,
        session.serializedSchema,
        session.requiresDownMigrations,
        diff
      );
      if (!diffResult.ok) return;
      this._unsafe_sendMessage(session.sessionId, {
        type: "patch",
        diff: diffResult.value,
        serverClock: this.lastDocumentClock
      });
    });
    return this;
  }
  /**
   * Send a custom message to a connected client. Useful for application-specific
   * communication that doesn't involve document synchronization.
   *
   * @param sessionId - The ID of the session to send the message to
   * @param data - The custom payload to send (will be JSON serialized)
   * @example
   * ```ts
   * // Send a custom notification
   * room.sendCustomMessage('user-123', {
   *   type: 'notification',
   *   message: 'Document saved successfully'
   * })
   *
   * // Send user-specific data
   * room.sendCustomMessage('user-456', {
   *   type: 'user_permissions',
   *   canEdit: true,
   *   canDelete: false
   * })
   * ```
   */
  sendCustomMessage(sessionId, data) {
    this._unsafe_sendMessage(sessionId, { type: "custom", data });
  }
  /**
   * Register a new client session with the room. The session will be in an awaiting
   * state until it sends a connect message with protocol handshake.
   *
   * @param opts - Session configuration
   *   - sessionId - Unique identifier for this session
   *   - socket - WebSocket adapter for communication
   *   - meta - Application-specific metadata for this session
   *   - isReadonly - Whether this session can modify documents
   * @returns This room instance for method chaining
   * @example
   * ```ts
   * room.handleNewSession({
   *   sessionId: crypto.randomUUID(),
   *   socket: new WebSocketAdapter(ws),
   *   meta: { userId: '123', name: 'Alice', avatar: 'url' },
   *   isReadonly: !hasEditPermission
   * })
   * ```
   *
   * @internal
   */
  handleNewSession(opts) {
    const { sessionId, socket, meta, isReadonly } = opts;
    const existing = this.sessions.get(sessionId);
    this.sessions.set(sessionId, {
      state: RoomSessionState.AwaitingConnectMessage,
      sessionId,
      socket,
      presenceId: existing?.presenceId ?? this.presenceType?.createId() ?? null,
      sessionStartTime: Date.now(),
      meta,
      isReadonly: isReadonly ?? false,
      // this gets set later during handleConnectMessage
      requiresLegacyRejection: false,
      supportsStringAppend: true
    });
    return this;
  }
  /**
   * Resume a previously-connected session directly into `Connected` state, bypassing the
   * connect handshake. Used after server hibernation when the WebSocket is still alive but
   * all in-memory state has been lost.
   *
   * @internal
   */
  handleResumedSession(opts) {
    const {
      sessionId,
      socket,
      meta,
      isReadonly,
      serializedSchema,
      presenceId,
      presenceRecord,
      requiresLegacyRejection,
      supportsStringAppend
    } = opts;
    const migrations = this.schema.getMigrationsSince(serializedSchema);
    const requiresDownMigrations = migrations.ok ? migrations.value.length > 0 : false;
    this.sessions.set(sessionId, {
      state: RoomSessionState.Connected,
      sessionId,
      socket,
      presenceId: presenceId ?? this.presenceType?.createId() ?? null,
      serializedSchema,
      requiresDownMigrations,
      lastInteractionTime: Date.now(),
      debounceTimer: null,
      outstandingDataMessages: [],
      meta,
      isReadonly,
      requiresLegacyRejection,
      supportsStringAppend
    });
    if (presenceRecord && presenceId) {
      this.presenceStore.set(presenceId, presenceRecord);
    }
  }
  /**
   * Checks if all connected sessions support string append operations (protocol version 8+).
   * If any client is on an older version, returns false to enable legacy append mode.
   *
   * @returns True if all connected sessions are on protocol version 8 or higher
   */
  getCanEmitStringAppend() {
    for (const session of this.sessions.values()) {
      if (session.state === RoomSessionState.Connected) {
        if (!session.supportsStringAppend) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * When we send a diff to a client, if that client is on a lower version than us, we need to make
   * the diff compatible with their version. This method takes a TLSyncForwardDiff (which has full
   * records) and migrates all records down to the client's schema version, returning a NetworkDiff.
   *
   * For updates (entries with [before, after] tuples), both records are migrated and a patch is
   * computed from the migrated versions, preserving efficient patch semantics even across versions.
   *
   * If a migration fails, the session will be rejected.
   *
   * @param sessionId - The session ID (for rejection on migration failure)
   * @param serializedSchema - The client's schema to migrate to
   * @param requiresDownMigrations - Whether the client needs down migrations
   * @param diff - The TLSyncForwardDiff containing full records to migrate
   * @param unmigrated - Optional pre-computed NetworkDiff for when no migration is needed
   * @returns A NetworkDiff with migrated records, or a migration failure
   */
  migrateDiffOrRejectSession(sessionId, serializedSchema, requiresDownMigrations, diff, unmigrated) {
    if (!requiresDownMigrations) {
      return Result.ok(unmigrated ?? toNetworkDiff(diff) ?? {});
    }
    const result = {};
    for (const [id, put2] of objectMapEntriesIterable(diff.puts)) {
      if (Array.isArray(put2)) {
        const [from, to] = put2;
        const fromResult = this.schema.migratePersistedRecord(from, serializedSchema, "down");
        if (fromResult.type === "error") {
          this.rejectSession(sessionId, TLSyncErrorCloseEventReason.CLIENT_TOO_OLD);
          return Result.err(fromResult.reason);
        }
        const toResult = this.schema.migratePersistedRecord(to, serializedSchema, "down");
        if (toResult.type === "error") {
          this.rejectSession(sessionId, TLSyncErrorCloseEventReason.CLIENT_TOO_OLD);
          return Result.err(toResult.reason);
        }
        const patch = diffRecord(fromResult.value, toResult.value);
        if (patch) {
          result[id] = [RecordOpType.Patch, patch];
        }
      } else {
        const migrationResult = this.schema.migratePersistedRecord(put2, serializedSchema, "down");
        if (migrationResult.type === "error") {
          this.rejectSession(sessionId, TLSyncErrorCloseEventReason.CLIENT_TOO_OLD);
          return Result.err(migrationResult.reason);
        }
        result[id] = [RecordOpType.Put, migrationResult.value];
      }
    }
    for (const id of diff.deletes) {
      result[id] = [RecordOpType.Remove];
    }
    return Result.ok(result);
  }
  /**
   * Process an incoming message from a client session. Handles connection requests,
   * data synchronization pushes, and ping/pong for connection health.
   *
   * @param sessionId - The ID of the session that sent the message
   * @param message - The client message to process
   * @example
   * ```ts
   * // Typically called by WebSocket message handlers
   * websocket.onMessage((data) => {
   *   const message = JSON.parse(data)
   *   room.handleMessage(sessionId, message)
   * })
   * ```
   */
  async handleMessage(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.log?.warn?.("Received message from unknown session");
      return;
    }
    try {
      switch (message.type) {
        case "connect": {
          return this.handleConnectRequest(session, message);
        }
        case "push": {
          return this.handlePushRequest(session, message);
        }
        case "ping": {
          if (session.state === RoomSessionState.Connected) {
            session.lastInteractionTime = Date.now();
          }
          return this._unsafe_sendMessage(session.sessionId, { type: "pong" });
        }
        default: {
          exhaustiveSwitchError(message);
        }
      }
    } catch (e) {
      if (e instanceof TLSyncError) {
        this.rejectSession(session.sessionId, e.reason);
      } else {
        throw e;
      }
    }
  }
  /**
   * Reject and disconnect a session due to incompatibility or other fatal errors.
   * Sends appropriate error messages before closing the connection.
   *
   * @param sessionId - The session to reject
   * @param fatalReason - The reason for rejection (optional)
   * @example
   * ```ts
   * // Reject due to version mismatch
   * room.rejectSession('user-123', TLSyncErrorCloseEventReason.CLIENT_TOO_OLD)
   *
   * // Reject due to permission issue
   * room.rejectSession('user-456', 'Insufficient permissions')
   * ```
   */
  rejectSession(sessionId, fatalReason) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    if (!fatalReason) {
      this.removeSession(sessionId);
      return;
    }
    if (session.requiresLegacyRejection) {
      try {
        if (session.socket.isOpen) {
          let legacyReason;
          switch (fatalReason) {
            case TLSyncErrorCloseEventReason.CLIENT_TOO_OLD:
              legacyReason = TLIncompatibilityReason.ClientTooOld;
              break;
            case TLSyncErrorCloseEventReason.SERVER_TOO_OLD:
              legacyReason = TLIncompatibilityReason.ServerTooOld;
              break;
            case TLSyncErrorCloseEventReason.INVALID_RECORD:
              legacyReason = TLIncompatibilityReason.InvalidRecord;
              break;
            default:
              legacyReason = TLIncompatibilityReason.InvalidOperation;
              break;
          }
          session.socket.sendMessage({
            type: "incompatibility_error",
            reason: legacyReason
          });
        }
      } catch {
      } finally {
        this.removeSession(sessionId);
      }
    } else {
      this.removeSession(sessionId, fatalReason);
    }
  }
  forceAllReconnect() {
    for (const session of this.sessions.values()) {
      this.removeSession(session.sessionId);
    }
  }
  broadcastChanges(txn) {
    const changes = txn.getChangesSince(this.lastDocumentClock);
    if (!changes) return;
    const { wipeAll, diff } = changes;
    this.lastDocumentClock = txn.getClock();
    if (wipeAll) {
      this.forceAllReconnect();
      return;
    }
    this.broadcastPatch(diff);
  }
  /**
   * Work out whether a client we can't reconcile schemas with is running a newer or older SDK
   * than us.
   */
  getVersionMismatchReason(theirSchema) {
    const ourSchema = this.serializedSchema;
    if (theirSchema.schemaVersion > ourSchema.schemaVersion) {
      return TLSyncErrorCloseEventReason.SERVER_TOO_OLD;
    }
    if (theirSchema.schemaVersion === 2 && ourSchema.schemaVersion === 2) {
      for (const [sequenceId, theirVersion] of Object.entries(theirSchema.sequences)) {
        const ourVersion = ourSchema.sequences[sequenceId];
        if (ourVersion === void 0 || theirVersion > ourVersion) {
          return TLSyncErrorCloseEventReason.SERVER_TOO_OLD;
        }
      }
    }
    return TLSyncErrorCloseEventReason.CLIENT_TOO_OLD;
  }
  handleConnectRequest(session, message) {
    let theirProtocolVersion = message.protocolVersion;
    if (theirProtocolVersion === 5) {
      theirProtocolVersion = 6;
    }
    session.requiresLegacyRejection = theirProtocolVersion === 6;
    if (theirProtocolVersion === 6) {
      theirProtocolVersion++;
    }
    if (theirProtocolVersion === 7) {
      theirProtocolVersion++;
      session.supportsStringAppend = false;
    }
    if (theirProtocolVersion == null || theirProtocolVersion < getTlsyncProtocolVersion()) {
      this.rejectSession(session.sessionId, TLSyncErrorCloseEventReason.CLIENT_TOO_OLD);
      return;
    } else if (theirProtocolVersion > getTlsyncProtocolVersion()) {
      this.rejectSession(session.sessionId, TLSyncErrorCloseEventReason.SERVER_TOO_OLD);
      return;
    }
    if (message.schema == null) {
      this.rejectSession(session.sessionId, TLSyncErrorCloseEventReason.CLIENT_TOO_OLD);
      return;
    }
    const migrations = this.schema.getMigrationsSince(message.schema);
    if (!migrations.ok) {
      this.rejectSession(session.sessionId, this.getVersionMismatchReason(message.schema));
      return;
    }
    if (migrations.value.some((m) => m.scope !== "record" || !m.down)) {
      this.rejectSession(session.sessionId, TLSyncErrorCloseEventReason.CLIENT_TOO_OLD);
      return;
    }
    const sessionSchema = (0, import_lodash2.default)(message.schema, this.serializedSchema) ? this.serializedSchema : message.schema;
    const requiresDownMigrations = migrations.value.length > 0;
    const connect = async (msg) => {
      this.sessions.set(session.sessionId, {
        state: RoomSessionState.Connected,
        sessionId: session.sessionId,
        presenceId: session.presenceId,
        socket: session.socket,
        serializedSchema: sessionSchema,
        requiresDownMigrations,
        lastInteractionTime: Date.now(),
        debounceTimer: null,
        outstandingDataMessages: [],
        supportsStringAppend: session.supportsStringAppend,
        meta: session.meta,
        isReadonly: session.isReadonly,
        requiresLegacyRejection: session.requiresLegacyRejection
      });
      this._unsafe_sendMessage(session.sessionId, msg);
    };
    const { documentClock, result } = this.storage.transaction((txn) => {
      this.broadcastChanges(txn);
      const docChanges = txn.getChangesSince(message.lastServerClock);
      const presenceDiff = this.migrateDiffOrRejectSession(
        session.sessionId,
        sessionSchema,
        requiresDownMigrations,
        {
          // Exclude the connecting session's own presence — it will push fresh
          // data immediately after connecting. Sending the stale record back
          // would leave an orphaned presence in the client's local store (the
          // server never echoes a session's own updates back to it).
          puts: Object.fromEntries(
            [...this.presenceStore.values()].filter((p) => p.id !== session.presenceId).map((p) => [p.id, p])
          ),
          deletes: []
        }
      );
      if (!presenceDiff.ok) return null;
      let docDiff = null;
      if (docChanges && sessionSchema !== this.serializedSchema) {
        const migrated = this.migrateDiffOrRejectSession(
          session.sessionId,
          sessionSchema,
          requiresDownMigrations,
          docChanges.diff
        );
        if (!migrated.ok) return null;
        docDiff = migrated.value;
      } else if (docChanges) {
        docDiff = toNetworkDiff(docChanges.diff);
      }
      return {
        type: "connect",
        connectRequestId: message.connectRequestId,
        hydrationType: docChanges?.wipeAll ? "wipe_all" : "wipe_presence",
        protocolVersion: getTlsyncProtocolVersion(),
        schema: this.schema.serialize(),
        serverClock: txn.getClock(),
        diff: { ...presenceDiff.value, ...docDiff },
        isReadonly: session.isReadonly
      };
    });
    this.lastDocumentClock = documentClock;
    if (result) {
      connect(result);
    }
  }
  handlePushRequest(session, message) {
    if (session && session.state !== RoomSessionState.Connected) {
      return;
    }
    if (session) {
      session.lastInteractionTime = Date.now();
    }
    const legacyAppendMode = !this.getCanEmitStringAppend();
    const propagateOp = (changes2, id, op, before, after) => {
      if (!changes2.diffs) changes2.diffs = { networkDiff: {}, diff: { puts: {}, deletes: [] } };
      changes2.diffs.networkDiff[id] = op;
      switch (op[0]) {
        case RecordOpType.Put:
          changes2.diffs.diff.puts[id] = op[1];
          break;
        case RecordOpType.Patch:
          assert(before && after, "before and after are required for patches");
          changes2.diffs.diff.puts[id] = [before, after];
          break;
        case RecordOpType.Remove:
          changes2.diffs.diff.deletes.push(id);
          break;
        default:
          exhaustiveSwitchError(op[0]);
      }
    };
    const addDocument = (storage, changes2, id, _state) => {
      const res = session ? this.schema.migratePersistedRecord(_state, session.serializedSchema, "up") : { type: "success", value: _state };
      if (res.type === "error") {
        throw new TLSyncError(res.reason, TLSyncErrorCloseEventReason.CLIENT_TOO_OLD);
      }
      const { value: state } = res;
      const doc = storage.get(id);
      if (doc) {
        const recordType = assertExists(getOwnProperty(this.schema.types, doc.typeName));
        const diff = diffAndValidateRecord(doc, state, recordType);
        if (diff) {
          storage.set(id, state);
          propagateOp(changes2, id, [RecordOpType.Patch, diff], doc, state);
        }
      } else {
        const recordType = assertExists(getOwnProperty(this.schema.types, state.typeName));
        validateRecord(state, recordType);
        storage.set(id, state);
        propagateOp(changes2, id, [RecordOpType.Put, state], void 0, void 0);
      }
      return Result.ok(void 0);
    };
    const patchDocument = (storage, changes2, id, patch) => {
      const doc = storage.get(id);
      if (!doc) return;
      const recordType = assertExists(getOwnProperty(this.schema.types, doc.typeName));
      const downgraded = session ? this.schema.migratePersistedRecord(doc, session.serializedSchema, "down") : { type: "success", value: doc };
      if (downgraded.type === "error") {
        throw new TLSyncError(downgraded.reason, TLSyncErrorCloseEventReason.CLIENT_TOO_OLD);
      }
      if (downgraded.value === doc) {
        const diff = applyAndDiffRecord(doc, patch, recordType, legacyAppendMode);
        if (diff) {
          storage.set(id, diff[1]);
          propagateOp(changes2, id, [RecordOpType.Patch, diff[0]], doc, diff[1]);
        }
      } else {
        const patched = applyObjectDiff(downgraded.value, patch);
        const upgraded = session ? this.schema.migratePersistedRecord(patched, session.serializedSchema, "up") : { type: "success", value: patched };
        if (upgraded.type === "error") {
          throw new TLSyncError(upgraded.reason, TLSyncErrorCloseEventReason.CLIENT_TOO_OLD);
        }
        const diff = diffAndValidateRecord(doc, upgraded.value, recordType, legacyAppendMode);
        if (diff) {
          storage.set(id, upgraded.value);
          propagateOp(changes2, id, [RecordOpType.Patch, diff], doc, upgraded.value);
        }
      }
    };
    const { result, documentClock, changes } = this.storage.transaction(
      (txn) => {
        this.broadcastChanges(txn);
        const docChanges = { diffs: null };
        const presenceChanges = { diffs: null };
        if (this.presenceType && session?.presenceId && "presence" in message && message.presence) {
          if (!session) throw new Error("session is required for presence pushes");
          const id = session.presenceId;
          const [type, val] = message.presence;
          const { typeName } = this.presenceType;
          switch (type) {
            case RecordOpType.Put: {
              addDocument(this.presenceStore, presenceChanges, id, {
                ...val,
                id,
                typeName
              });
              break;
            }
            case RecordOpType.Patch: {
              patchDocument(this.presenceStore, presenceChanges, id, {
                ...val,
                id: [ValueOpType.Put, id],
                typeName: [ValueOpType.Put, typeName]
              });
              break;
            }
          }
        }
        if (message.diff && !session?.isReadonly) {
          for (const [id, op] of objectMapEntriesIterable(message.diff)) {
            switch (op[0]) {
              case RecordOpType.Put: {
                if (!this.documentTypes.has(op[1].typeName)) {
                  throw new TLSyncError(
                    "invalid record",
                    TLSyncErrorCloseEventReason.INVALID_RECORD
                  );
                }
                addDocument(txn, docChanges, id, op[1]);
                break;
              }
              case RecordOpType.Patch: {
                patchDocument(txn, docChanges, id, op[1]);
                break;
              }
              case RecordOpType.Remove: {
                const doc = txn.get(id);
                if (!doc) {
                  continue;
                }
                txn.delete(id);
                propagateOp(docChanges, id, op, doc, void 0);
                break;
              }
            }
          }
        }
        return { docChanges, presenceChanges };
      },
      { id: this.internalTxnId, emitChanges: "when-different" }
    );
    this.lastDocumentClock = documentClock;
    let pushResult;
    if (changes && session) {
      result.docChanges.diffs = { networkDiff: toNetworkDiff(changes) ?? {}, diff: changes };
    }
    if ((0, import_lodash2.default)(result.docChanges.diffs?.networkDiff, message.diff)) {
      pushResult = {
        type: "push_result",
        clientClock: message.clientClock,
        serverClock: documentClock,
        action: "commit"
      };
    } else if (!result.docChanges.diffs?.networkDiff) {
      pushResult = {
        type: "push_result",
        clientClock: message.clientClock,
        serverClock: documentClock,
        action: "discard"
      };
    } else if (session) {
      const diff = this.migrateDiffOrRejectSession(
        session.sessionId,
        session.serializedSchema,
        session.requiresDownMigrations,
        result.docChanges.diffs.diff,
        result.docChanges.diffs.networkDiff
      );
      if (diff.ok) {
        pushResult = {
          type: "push_result",
          clientClock: message.clientClock,
          serverClock: documentClock,
          action: { rebaseWithDiff: diff.value }
        };
      }
    }
    if (session && pushResult) {
      this._unsafe_sendMessage(session.sessionId, pushResult);
    }
    if (result.docChanges.diffs || result.presenceChanges.diffs) {
      this.broadcastPatch(
        {
          puts: {
            ...result.docChanges.diffs?.diff.puts,
            ...result.presenceChanges.diffs?.diff.puts
          },
          deletes: [
            ...result.docChanges.diffs?.diff.deletes ?? [],
            ...result.presenceChanges.diffs?.diff.deletes ?? []
          ]
        },
        {
          ...result.docChanges.diffs?.networkDiff,
          ...result.presenceChanges.diffs?.networkDiff
        },
        session?.sessionId
      );
    }
    if (result.presenceChanges.diffs) {
      queueMicrotask(() => {
        this.onPresenceChange?.();
      });
    }
  }
  /**
   * Handle the event when a client disconnects. Cleans up the session and
   * removes any presence information.
   *
   * @param sessionId - The session that disconnected
   * @example
   * ```ts
   * websocket.onClose(() => {
   *   room.handleClose(sessionId)
   * })
   * ```
   */
  handleClose(sessionId) {
    this.cancelSession(sessionId);
  }
};
var PresenceStore = class {
  presences = new AtomMap("presences");
  get(id) {
    return this.presences.get(id);
  }
  set(id, state) {
    this.presences.set(id, state);
  }
  delete(id) {
    this.presences.delete(id);
  }
  values() {
    return this.presences.values();
  }
};

// node_modules/@tldraw/sync-core/dist-esm/lib/TLSocketRoom.mjs
function stripPresenceForSnapshot(record) {
  if (record.typeName !== "instance_presence") return record;
  const stripped = { ...record };
  stripped.scribbles = [];
  stripped.chatMessage = "";
  stripped.selectedShapeIds = [];
  stripped.brush = null;
  return stripped;
}
var TLSocketRoom = class {
  /**
   * Creates a new TLSocketRoom instance for managing collaborative document synchronization.
   *
   * opts - Configuration options for the room
   *   - initialSnapshot - Optional initial document state to load
   *   - schema - Store schema defining record types and validation
   *   - clientTimeout - Milliseconds to wait before disconnecting inactive clients
   *   - log - Optional logger for warnings and errors
   *   - onSessionRemoved - Called when a client session is removed
   *   - onBeforeSendMessage - Called before sending messages to clients
   *   - onAfterReceiveMessage - Called after receiving messages from clients
   *   - onDataChange - Called when document data changes
   *   - onPresenceChange - Called when presence data changes
   */
  constructor(opts) {
    this.opts = opts;
    if (opts.storage && opts.initialSnapshot) {
      throw new Error("Cannot provide both storage and initialSnapshot options");
    }
    const storage = opts.storage ? opts.storage : new InMemorySyncStorage({
      snapshot: convertStoreSnapshotToRoomSnapshot(
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        opts.initialSnapshot ?? DEFAULT_INITIAL_SNAPSHOT
      )
    });
    if ("onDataChange" in opts && opts.onDataChange) {
      this.disposables.add(
        storage.onChange(() => {
          opts.onDataChange?.();
        })
      );
    }
    this.room = new TLSyncRoom({
      onPresenceChange: opts.onPresenceChange,
      schema: opts.schema ?? createTLSchema(),
      log: opts.log,
      storage,
      clientTimeout: opts.clientTimeout
    });
    this.storage = storage;
    this.room.events.on("session_removed", (args) => {
      this.clearSnapshotTimer(args.sessionId);
      this.sessions.delete(args.sessionId);
      if (this.opts.onSessionRemoved) {
        this.opts.onSessionRemoved(this, {
          sessionId: args.sessionId,
          numSessionsRemaining: this.room.sessions.size,
          meta: args.meta
        });
      }
    });
    this.log = "log" in opts ? opts.log : { error: console.error };
  }
  opts;
  room;
  sessions = /* @__PURE__ */ new Map();
  log;
  storage;
  disposables = /* @__PURE__ */ new Set();
  snapshotTimers = /* @__PURE__ */ new Map();
  /**
   * Returns the number of active sessions.
   * Note that this is not the same as the number of connected sockets!
   * Sessions time out a few moments after sockets close, to smooth over network hiccups.
   *
   * @returns the number of active sessions
   */
  getNumActiveSessions() {
    return this.room.sessions.size;
  }
  /**
   * Handles a new client WebSocket connection, creating a session within the room.
   * This should be called whenever a client establishes a WebSocket connection to join
   * the collaborative document.
   *
   * @param opts - Connection options
   *   - sessionId - Unique identifier for the client session (typically from browser tab)
   *   - socket - WebSocket-like object for client communication
   *   - isReadonly - Whether the client can modify the document (defaults to false)
   *   - meta - Additional session metadata (required if SessionMeta is not void)
   *
   * @example
   * ```ts
   * // Handle new WebSocket connection
   * room.handleSocketConnect({
   *   sessionId: 'user-session-abc123',
   *   socket: webSocketConnection,
   *   isReadonly: !userHasEditPermission
   * })
   * ```
   *
   * @example
   * ```ts
   * // With session metadata
   * room.handleSocketConnect({
   *   sessionId: 'session-xyz',
   *   socket: ws,
   *   meta: { userId: 'user-123', name: 'Alice' }
   * })
   * ```
   */
  handleSocketConnect(opts) {
    const { sessionId, socket, isReadonly = false } = opts;
    const handleSocketMessage = (event) => this.handleSocketMessage(sessionId, event.data);
    const handleSocketError = this.handleSocketError.bind(this, sessionId);
    const handleSocketClose = this.handleSocketClose.bind(this, sessionId);
    this.sessions.set(sessionId, {
      assembler: new JsonChunkAssembler(),
      socket,
      unlisten: () => {
        socket.removeEventListener?.("message", handleSocketMessage);
        socket.removeEventListener?.("close", handleSocketClose);
        socket.removeEventListener?.("error", handleSocketError);
      }
    });
    this.room.handleNewSession({
      sessionId,
      isReadonly,
      socket: new ServerSocketAdapter({
        ws: socket,
        onBeforeSendMessage: this.opts.onBeforeSendMessage ? (message, stringified) => this.opts.onBeforeSendMessage({
          sessionId,
          message,
          stringified,
          meta: this.room.sessions.get(sessionId)?.meta
        }) : void 0
      }),
      meta: "meta" in opts ? opts.meta : void 0
    });
    socket.addEventListener?.("message", handleSocketMessage);
    socket.addEventListener?.("close", handleSocketClose);
    socket.addEventListener?.("error", handleSocketError);
  }
  clearSnapshotTimer(sessionId) {
    const t = this.snapshotTimers.get(sessionId);
    if (t) {
      clearTimeout(t);
      this.snapshotTimers.delete(sessionId);
    }
  }
  scheduleDebouncedSnapshot(sessionId) {
    if (!this.opts.onSessionSnapshot) return;
    this.clearSnapshotTimer(sessionId);
    this.snapshotTimers.set(
      sessionId,
      setTimeout(() => {
        this.snapshotTimers.delete(sessionId);
        const snapshot = this.getSessionSnapshot(sessionId);
        if (snapshot) this.opts.onSessionSnapshot(sessionId, snapshot);
      }, 5e3)
    );
  }
  /**
   * Processes a message received from a client WebSocket. Use this method in server
   * environments where WebSocket event listeners cannot be attached directly to socket
   * instances (e.g., Bun.serve, Cloudflare Workers with WebSocket hibernation).
   *
   * The method handles message chunking/reassembly and forwards complete messages
   * to the underlying sync room for processing.
   *
   * @param sessionId - Session identifier matching the one used in handleSocketConnect
   * @param message - Raw message data from the client (string or binary)
   *
   * @example
   * ```ts
   * // In a Bun.serve handler
   * server.upgrade(req, {
   *   data: { sessionId, room },
   *   upgrade(res, req) {
   *     // Connection established
   *   },
   *   message(ws, message) {
   *     const { sessionId, room } = ws.data
   *     room.handleSocketMessage(sessionId, message)
   *   }
   * })
   * ```
   */
  handleSocketMessage(sessionId, message) {
    const assembler = this.sessions.get(sessionId)?.assembler;
    if (!assembler) {
      this.log?.warn?.("Received message from unknown session", sessionId);
      return;
    }
    try {
      const messageString = typeof message === "string" ? message : new TextDecoder().decode(message);
      const res = assembler.handleMessage(messageString);
      if (!res) {
        return;
      }
      if ("data" in res) {
        if (this.opts.onAfterReceiveMessage) {
          const session = this.room.sessions.get(sessionId);
          if (session) {
            this.opts.onAfterReceiveMessage({
              sessionId,
              message: res.data,
              stringified: res.stringified,
              meta: session.meta
            });
          }
        }
        this.room.handleMessage(sessionId, res.data).catch((error) => {
          this.log?.error?.(error);
          this.room.rejectSession(sessionId, TLSyncErrorCloseEventReason.UNKNOWN_ERROR);
        });
        this.room.pruneSessions();
        this.scheduleDebouncedSnapshot(sessionId);
      } else {
        this.log?.error?.("Error assembling message", res.error);
        this.handleSocketError(sessionId);
      }
    } catch (e) {
      this.log?.error?.(e);
      this.room.rejectSession(sessionId, TLSyncErrorCloseEventReason.UNKNOWN_ERROR);
    }
  }
  /**
   * Handles a WebSocket error for the specified session. Use this in server environments
   * where socket event listeners cannot be attached directly. This will initiate cleanup
   * and session removal for the affected client.
   *
   * @param sessionId - Session identifier matching the one used in handleSocketConnect
   *
   * @example
   * ```ts
   * // In a custom WebSocket handler
   * socket.addEventListener('error', () => {
   *   room.handleSocketError(sessionId)
   * })
   * ```
   */
  handleSocketError(sessionId) {
    this.clearSnapshotTimer(sessionId);
    this.room.handleClose(sessionId);
  }
  /**
   * Handles a WebSocket close event for the specified session. Use this in server
   * environments where socket event listeners cannot be attached directly. This will
   * initiate cleanup and session removal for the disconnected client.
   *
   * @param sessionId - Session identifier matching the one used in handleSocketConnect
   *
   * @example
   * ```ts
   * // In a custom WebSocket handler
   * socket.addEventListener('close', () => {
   *   room.handleSocketClose(sessionId)
   * })
   * ```
   */
  handleSocketClose(sessionId) {
    this.clearSnapshotTimer(sessionId);
    this.room.handleClose(sessionId);
  }
  /**
   * Resumes a previously-connected session directly into `Connected` state, bypassing
   * the connect handshake. Use this after server hibernation (e.g., Cloudflare Durable
   * Object hibernation) when WebSocket connections survived but all in-memory state was lost.
   *
   * The session is restored using a {@link SessionStateSnapshot} previously obtained
   * via {@link TLSocketRoom.getSessionSnapshot}. The client is unaware the server restarted and
   * continues sending messages normally.
   *
   * Unlike {@link TLSocketRoom.handleSocketConnect}, this method does NOT attach WebSocket event
   * listeners. In hibernation environments, events are delivered via class methods
   * (e.g., `webSocketMessage`) rather than `addEventListener`.
   *
   * @param opts - Resume options
   *   - sessionId - Unique identifier for the client session
   *   - socket - WebSocket-like object for client communication
   *   - snapshot - Session state snapshot from {@link TLSocketRoom.getSessionSnapshot}
   *   - meta - Additional session metadata (required if SessionMeta is not void)
   *
   * @example
   * ```ts
   * // After Cloudflare DO hibernation wake
   * for (const ws of ctx.getWebSockets()) {
   *   const data = ws.deserializeAttachment()
   *   room.handleSocketResume({
   *     sessionId: data.sessionId,
   *     socket: ws,
   *     snapshot: data.snapshot,
   *   })
   * }
   * ```
   */
  handleSocketResume(opts) {
    const { sessionId, socket, snapshot } = opts;
    this.sessions.set(sessionId, {
      assembler: new JsonChunkAssembler(),
      socket,
      unlisten: () => {
      }
    });
    this.room.handleResumedSession({
      sessionId,
      isReadonly: snapshot.isReadonly,
      serializedSchema: snapshot.serializedSchema,
      presenceId: snapshot.presenceId,
      presenceRecord: snapshot.presenceRecord,
      requiresLegacyRejection: snapshot.requiresLegacyRejection,
      supportsStringAppend: snapshot.supportsStringAppend,
      socket: new ServerSocketAdapter({
        ws: socket,
        onBeforeSendMessage: this.opts.onBeforeSendMessage ? (message, stringified) => this.opts.onBeforeSendMessage({
          sessionId,
          message,
          stringified,
          meta: this.room.sessions.get(sessionId)?.meta
        }) : void 0
      }),
      meta: "meta" in opts ? opts.meta : void 0
    });
  }
  /**
   * Returns a snapshot of a connected session's state that can be persisted and later
   * used with {@link TLSocketRoom.handleSocketResume} to restore the session after hibernation.
   *
   * Returns `null` if the session doesn't exist or isn't in the `Connected` state.
   *
   * @param sessionId - The session to snapshot
   *
   * @example
   * ```ts
   * // Store snapshot in a Cloudflare WebSocket attachment
   * const snapshot = room.getSessionSnapshot(sessionId)
   * if (snapshot) {
   *   ws.serializeAttachment({ sessionId, snapshot })
   * }
   * ```
   */
  getSessionSnapshot(sessionId) {
    const session = this.room.sessions.get(sessionId);
    if (!session || session.state !== RoomSessionState.Connected) {
      return null;
    }
    let presenceRecord = null;
    if (session.presenceId) {
      const record = this.room.presenceStore.get(session.presenceId);
      if (record) {
        presenceRecord = stripPresenceForSnapshot(record);
      }
    }
    return {
      serializedSchema: session.serializedSchema,
      isReadonly: session.isReadonly,
      presenceId: session.presenceId,
      presenceRecord,
      requiresLegacyRejection: session.requiresLegacyRejection,
      supportsStringAppend: session.supportsStringAppend
    };
  }
  /**
   * Returns the current document clock value. The clock is a monotonically increasing
   * integer that increments with each document change, providing a consistent ordering
   * of changes across the distributed system.
   *
   * @returns The current document clock value
   *
   * @example
   * ```ts
   * const clock = room.getCurrentDocumentClock()
   * console.log(`Document is at version ${clock}`)
   * ```
   */
  getCurrentDocumentClock() {
    return this.storage.getClock();
  }
  /**
   * Retrieves a deeply cloned copy of a record from the document store.
   * Returns undefined if the record doesn't exist. The returned record is
   * safe to mutate without affecting the original store data.
   *
   * @param id - Unique identifier of the record to retrieve
   * @returns Deep clone of the record, or undefined if not found
   *
   * @example
   * ```ts
   * const shape = room.getRecord('shape:abc123')
   * if (shape) {
   *   console.log('Shape position:', shape.x, shape.y)
   *   // Safe to modify without affecting store
   *   shape.x = 100
   * }
   * ```
   */
  getRecord(id) {
    return this.storage.transaction((txn) => {
      return structuredClone(txn.get(id));
    }).result;
  }
  /**
   * Returns information about all active sessions in the room. Each session
   * represents a connected client with their current connection status and metadata.
   *
   * @returns Array of session information objects containing:
   *   - sessionId - Unique session identifier
   *   - isConnected - Whether the session has an active WebSocket connection
   *   - isReadonly - Whether the session can modify the document
   *   - meta - Custom session metadata
   *
   * @example
   * ```ts
   * const sessions = room.getSessions()
   * console.log(`Room has ${sessions.length} active sessions`)
   *
   * for (const session of sessions) {
   *   console.log(`${session.sessionId}: ${session.isConnected ? 'online' : 'offline'}`)
   *   if (session.isReadonly) {
   *     console.log('  (read-only access)')
   *   }
   * }
   * ```
   */
  getSessions() {
    return [...this.room.sessions.values()].map((session) => {
      return {
        sessionId: session.sessionId,
        isConnected: session.state === RoomSessionState.Connected,
        isReadonly: session.isReadonly,
        meta: session.meta
      };
    });
  }
  /**
   * Creates a complete snapshot of the current document state, including all records
   * and synchronization metadata. This snapshot can be persisted to storage and used
   * to restore the room state later or revert to a previous version.
   *
   * @returns Complete room snapshot including documents, clock values, and tombstones
   * @deprecated if you need to do this use
   *
   * @example
   * ```ts
   * // Capture current state for persistence
   * const snapshot = room.getCurrentSnapshot()
   * await saveToDatabase(roomId, JSON.stringify(snapshot))
   *
   * // Later, restore from snapshot
   * const savedSnapshot = JSON.parse(await loadFromDatabase(roomId))
   * const newRoom = new TLSocketRoom({ initialSnapshot: savedSnapshot })
   * ```
   */
  getCurrentSnapshot() {
    if (this.storage.getSnapshot) {
      return this.storage.getSnapshot();
    }
    throw new Error("getCurrentSnapshot is not supported for this storage type");
  }
  /**
   * Retrieves all presence records from the document store. Presence records
   * contain ephemeral user state like cursor positions and selections.
   *
   * @returns Object mapping record IDs to presence record data
   * @internal
   */
  getPresenceRecords() {
    const result = {};
    for (const presence of this.room.presenceStore.values()) {
      result[presence.id] = presence;
    }
    return result;
  }
  /**
   * Loads a document snapshot, completely replacing the current room state.
   * This will disconnect all current clients and update the document to match
   * the provided snapshot. Use this for restoring from backups or implementing
   * document versioning.
   *
   * @param snapshot - Room or store snapshot to load
   *
   * @example
   * ```ts
   * // Restore from a saved snapshot
   * const backup = JSON.parse(await loadBackup(roomId))
   * room.loadSnapshot(backup)
   *
   * // All clients will be disconnected and need to reconnect
   * // to see the restored document state
   * ```
   */
  loadSnapshot(snapshot) {
    this.storage.transaction((txn) => {
      loadSnapshotIntoStorage(txn, this.room.schema, snapshot);
    });
  }
  /**
   * Executes a transaction to modify the document store. Changes made within the
   * transaction are atomic and will be synchronized to all connected clients.
   * The transaction provides isolation from concurrent changes until it commits.
   *
   * @param updater - Function that receives store methods to make changes
   *   - store.get(id) - Retrieve a record (safe to mutate, but must call put() to commit)
   *   - store.put(record) - Save a modified record
   *   - store.getAll() - Get all records in the store
   *   - store.delete(id) - Remove a record from the store
   * @returns Promise that resolves when the transaction completes
   *
   * @example
   * ```ts
   * // Update multiple shapes in a single transaction
   * await room.updateStore(store => {
   *   const shape1 = store.get('shape:abc123')
   *   const shape2 = store.get('shape:def456')
   *
   *   if (shape1) {
   *     shape1.x = 100
   *     store.put(shape1)
   *   }
   *
   *   if (shape2) {
   *     shape2.meta.approved = true
   *     store.put(shape2)
   *   }
   * })
   * ```
   *
   * @example
   * ```ts
   * // Async transaction with external API call
   * await room.updateStore(async store => {
   *   const doc = store.get('document:main')
   *   if (doc) {
   *     doc.lastModified = await getCurrentTimestamp()
   *     store.put(doc)
   *   }
   * })
   * ```
   * @deprecated use the storage.transaction method instead
   */
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  async updateStore(updater) {
    if (this.isClosed()) {
      throw new Error("Cannot update store on a closed room");
    }
    const ctx = new StoreUpdateContext(
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      Object.fromEntries(this.getCurrentSnapshot().documents.map((d) => [d.state.id, d.state])),
      this.room.schema
    );
    try {
      await updater(ctx);
    } finally {
      ctx.close();
    }
    this.storage.transaction((txn) => {
      for (const [id, record] of Object.entries(ctx.updates.puts)) {
        txn.set(id, record);
      }
      for (const id of ctx.updates.deletes) {
        txn.delete(id);
      }
    });
  }
  /**
   * Sends a custom message to a specific client session. This allows sending
   * application-specific data that doesn't modify the document state, such as
   * notifications, chat messages, or custom commands.
   *
   * @param sessionId - Target session identifier
   * @param data - Custom payload to send (will be JSON serialized)
   *
   * @example
   * ```ts
   * // Send a notification to a specific user
   * room.sendCustomMessage('session-123', {
   *   type: 'notification',
   *   message: 'Your changes have been saved'
   * })
   *
   * // Send a chat message
   * room.sendCustomMessage('session-456', {
   *   type: 'chat',
   *   from: 'Alice',
   *   text: 'Great work on this design!'
   * })
   * ```
   */
  sendCustomMessage(sessionId, data) {
    this.room.sendCustomMessage(sessionId, data);
  }
  /**
   * Immediately removes a session from the room and closes its WebSocket connection.
   * The client will attempt to reconnect automatically unless a fatal reason is provided.
   *
   * @param sessionId - Session identifier to remove
   * @param fatalReason - Optional fatal error reason that prevents reconnection
   *
   * @example
   * ```ts
   * // Kick a user (they can reconnect)
   * room.closeSession('session-troublemaker')
   *
   * // Permanently ban a user
   * room.closeSession('session-banned', 'PERMISSION_DENIED')
   *
   * // Close session due to inactivity
   * room.closeSession('session-idle', 'TIMEOUT')
   * ```
   */
  closeSession(sessionId, fatalReason) {
    this.room.rejectSession(sessionId, fatalReason);
  }
  /**
   * Closes the room and disconnects all connected clients. This should be called
   * when shutting down the room permanently, such as during server shutdown or
   * when the room is no longer needed. Once closed, the room cannot be reopened.
   *
   * @example
   * ```ts
   * // Clean shutdown when no users remain
   * if (room.getNumActiveSessions() === 0) {
   *   await persistSnapshot(room.getCurrentSnapshot())
   *   room.close()
   * }
   *
   * // Server shutdown
   * process.on('SIGTERM', () => {
   *   for (const room of activeRooms.values()) {
   *     room.close()
   *   }
   * })
   * ```
   */
  close() {
    this.room.close();
    for (const sessionId of this.snapshotTimers.keys()) {
      this.clearSnapshotTimer(sessionId);
    }
    this.disposables.forEach((d) => d());
    this.disposables.clear();
  }
  /**
   * Checks whether the room has been permanently closed. Closed rooms cannot
   * accept new connections or process further changes.
   *
   * @returns True if the room is closed, false if still active
   *
   * @example
   * ```ts
   * if (room.isClosed()) {
   *   console.log('Room has been shut down')
   *   // Create a new room or redirect users
   * } else {
   *   // Room is still accepting connections
   *   room.handleSocketConnect({ sessionId, socket })
   * }
   * ```
   */
  isClosed() {
    return this.room.isClosed();
  }
};
var StoreUpdateContext = class {
  constructor(snapshot, schema2) {
    this.snapshot = snapshot;
    this.schema = schema2;
  }
  snapshot;
  schema;
  updates = {
    puts: {},
    deletes: /* @__PURE__ */ new Set()
  };
  put(record) {
    if (this._isClosed) throw new Error("StoreUpdateContext is closed");
    const recordType = getOwnProperty(this.schema.types, record.typeName);
    if (!recordType) {
      throw new Error(`Missing definition for record type ${record.typeName}`);
    }
    const recordBefore = this.snapshot[record.id] ?? void 0;
    recordType.validate(record, recordBefore);
    if (record.id in this.snapshot && (0, import_lodash2.default)(this.snapshot[record.id], record)) {
      delete this.updates.puts[record.id];
    } else {
      this.updates.puts[record.id] = structuredClone(record);
    }
    this.updates.deletes.delete(record.id);
  }
  delete(recordOrId) {
    if (this._isClosed) throw new Error("StoreUpdateContext is closed");
    const id = typeof recordOrId === "string" ? recordOrId : recordOrId.id;
    delete this.updates.puts[id];
    if (this.snapshot[id]) {
      this.updates.deletes.add(id);
    }
  }
  get(id) {
    if (this._isClosed) throw new Error("StoreUpdateContext is closed");
    if (hasOwnProperty(this.updates.puts, id)) {
      return structuredClone(this.updates.puts[id]);
    }
    if (this.updates.deletes.has(id)) {
      return null;
    }
    return structuredClone(this.snapshot[id] ?? null);
  }
  getAll() {
    if (this._isClosed) throw new Error("StoreUpdateContext is closed");
    const result = Object.values(this.updates.puts);
    for (const [id, record] of Object.entries(this.snapshot)) {
      if (!this.updates.deletes.has(id) && !hasOwnProperty(this.updates.puts, id)) {
        result.push(record);
      }
    }
    return structuredClone(result);
  }
  _isClosed = false;
  close() {
    this._isClosed = true;
  }
};

// node_modules/@tldraw/sync-core/dist-esm/index.mjs
registerTldrawLibraryVersion(
  "@tldraw/sync-core",
  "5.2.5",
  "esm"
);

// data-dir.js
var import_node_os = __toESM(require("node:os"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var DATA_DIR = process.env.WB_DATA_DIR || import_node_path.default.join(import_node_os.default.homedir(), ".shared-whiteboard");

// boards.js
var SNAP_DIR = import_node_path2.default.join(DATA_DIR, "snapshots");
var INDEX_FILE = import_node_path2.default.join(DATA_DIR, "boards.json");
var FOLDERS_FILE = import_node_path2.default.join(DATA_DIR, "folders.json");
import_node_fs.default.mkdirSync(SNAP_DIR, { recursive: true });
var schema = createTLSchema({
  shapes: { ...defaultShapeSchemas, uml: { props: umlProps } },
  bindings: defaultBindingSchemas
});
var rooms = /* @__PURE__ */ new Map();
var saveTimers = /* @__PURE__ */ new Map();
function loadIndex() {
  try {
    return JSON.parse(import_node_fs.default.readFileSync(INDEX_FILE, "utf8"));
  } catch {
    return [];
  }
}
function saveIndex(index2) {
  import_node_fs.default.writeFileSync(INDEX_FILE, JSON.stringify(index2, null, 2));
}
var index = loadIndex();
function loadFolders() {
  try {
    return JSON.parse(import_node_fs.default.readFileSync(FOLDERS_FILE, "utf8"));
  } catch {
    return [];
  }
}
function saveFolders(f) {
  import_node_fs.default.writeFileSync(FOLDERS_FILE, JSON.stringify(f, null, 2));
}
var folders = loadFolders();
function uniqueId2(name, taken, fallback) {
  const base = String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || fallback;
  let id = base;
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  return id;
}
function slugify(name) {
  return uniqueId2(name, new Set(index.map((b) => b.id)), "board");
}
function folderExists(id) {
  return id != null && folders.some((f) => f.id === id);
}
function touch(id) {
  const b = index.find((x) => x.id === id);
  if (b) {
    b.updatedAt = Date.now();
    saveIndex(index);
  }
}
function snapPath(id) {
  return import_node_path2.default.join(SNAP_DIR, `${id}.json`);
}
function readSnapshot(id) {
  try {
    return JSON.parse(import_node_fs.default.readFileSync(snapPath(id), "utf8"));
  } catch {
    return null;
  }
}
function scheduleSave(id) {
  clearTimeout(saveTimers.get(id));
  saveTimers.set(
    id,
    setTimeout(() => {
      const room = rooms.get(id);
      if (!room) return;
      try {
        import_node_fs.default.writeFileSync(snapPath(id), JSON.stringify(room.getCurrentSnapshot()));
        touch(id);
      } catch (e) {
        console.error(`[whiteboard] save failed for ${id}:`, e.message);
      }
    }, 800)
  );
}
function listBoards() {
  return index.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).map((b) => ({ id: b.id, name: b.name, folderId: b.folderId ?? null, updatedAt: b.updatedAt, shapes: shapeCount(b.id) }));
}
function shapeCount(id) {
  const room = rooms.get(id);
  const snap = room ? room.getCurrentSnapshot() : readSnapshot(id);
  if (!snap?.documents) return 0;
  return snap.documents.filter((d) => d.state?.typeName === "shape").length;
}
function boardExists(id) {
  return index.some((b) => b.id === id);
}
function findBoards(query) {
  const q = String(query || "").trim().toLowerCase();
  const byId = index.find((b) => b.id.toLowerCase() === q);
  if (byId) return [{ id: byId.id, name: byId.name }];
  return index.filter((b) => b.name.toLowerCase() === q).map((b) => ({ id: b.id, name: b.name }));
}
function createBoard(name, folderId) {
  const clean = String(name || "").trim() || "Untitled";
  const id = slugify(clean);
  const now = Date.now();
  const folder = folderExists(folderId) ? folderId : null;
  index.push({ id, name: clean, folderId: folder, createdAt: now, updatedAt: now });
  saveIndex(index);
  return { id, name: clean, folderId: folder };
}
function renameBoard(id, name) {
  const b = index.find((x) => x.id === id);
  if (!b) throw new Error(`board ${id} not found`);
  b.name = String(name || "").trim() || b.name;
  b.updatedAt = Date.now();
  saveIndex(index);
  return { id: b.id, name: b.name };
}
function deleteBoard(id) {
  const room = rooms.get(id);
  if (room) {
    try {
      room.close();
    } catch {
    }
    rooms.delete(id);
  }
  clearTimeout(saveTimers.get(id));
  try {
    import_node_fs.default.rmSync(snapPath(id));
  } catch {
  }
  index = index.filter((b) => b.id !== id);
  saveIndex(index);
  return { deleted: id };
}
function listFolders() {
  return folders.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).map((f) => ({ id: f.id, name: f.name, updatedAt: f.updatedAt, boards: index.filter((b) => (b.folderId ?? null) === f.id).length }));
}
function createFolder(name) {
  const clean = String(name || "").trim() || "Untitled";
  const id = uniqueId2(clean, new Set(folders.map((f) => f.id)), "folder");
  const now = Date.now();
  folders.push({ id, name: clean, createdAt: now, updatedAt: now });
  saveFolders(folders);
  return { id, name: clean };
}
function renameFolder(id, name) {
  const f = folders.find((x) => x.id === id);
  if (!f) throw new Error(`folder ${id} not found`);
  f.name = String(name || "").trim() || f.name;
  f.updatedAt = Date.now();
  saveFolders(folders);
  return { id: f.id, name: f.name };
}
function deleteFolder(id) {
  if (!folderExists(id)) throw new Error(`folder ${id} not found`);
  const inside = index.filter((b) => (b.folderId ?? null) === id).map((b) => b.id);
  for (const bid of inside) deleteBoard(bid);
  folders = folders.filter((f) => f.id !== id);
  saveFolders(folders);
  return { deleted: id, boards: inside };
}
function moveBoards(ids, folderId) {
  const target = folderId == null ? null : folderId;
  if (target != null && !folderExists(target)) throw new Error(`folder ${target} not found`);
  const set = new Set(Array.isArray(ids) ? ids : [ids]);
  const now = Date.now();
  const moved = [];
  for (const b of index) {
    if (!set.has(b.id)) continue;
    b.folderId = target;
    b.updatedAt = now;
    moved.push(b.id);
  }
  saveIndex(index);
  return { moved, folderId: target };
}
function getRoom(id) {
  let room = rooms.get(id);
  if (room) return room;
  if (!boardExists(id)) {
    const now = Date.now();
    index.push({ id, name: id, createdAt: now, updatedAt: now });
    saveIndex(index);
  }
  const initialSnapshot = readSnapshot(id) || void 0;
  room = new TLSocketRoom({ schema, initialSnapshot, onDataChange: () => scheduleSave(id) });
  rooms.set(id, room);
  return room;
}

// templates.js
var import_node_fs2 = __toESM(require("node:fs"), 1);
var import_node_path3 = __toESM(require("node:path"), 1);
var FILE = import_node_path3.default.join(DATA_DIR, "templates.json");
import_node_fs2.default.mkdirSync(DATA_DIR, { recursive: true });
var rid2 = (p) => p + ":" + Math.random().toString(36).slice(2, 12);
function load() {
  try {
    return JSON.parse(import_node_fs2.default.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
}
function save(list) {
  import_node_fs2.default.writeFileSync(FILE, JSON.stringify(list, null, 2));
}
var templates = load();
function listTemplates() {
  return templates.map((t) => ({
    name: t.name,
    shapes: t.records.filter((r) => r.typeName === "shape").length,
    updatedAt: t.updatedAt
  }));
}
function saveTemplate(name, records2) {
  const clean = String(name || "").trim();
  if (!clean) throw new Error("template name required");
  const shapes = (records2 || []).filter((r) => r?.typeName === "shape");
  if (shapes.length === 0) throw new Error("template needs at least one shape");
  const entry2 = { name: clean, records: records2, updatedAt: Date.now() };
  const i = templates.findIndex((t) => t.name.toLowerCase() === clean.toLowerCase());
  if (i >= 0) templates[i] = entry2;
  else templates.push(entry2);
  save(templates);
  return { name: clean, shapes: shapes.length };
}
function getTemplate(name) {
  const q = String(name || "").trim().toLowerCase();
  return templates.find((t) => t.name.toLowerCase() === q) || null;
}
function deleteTemplate(name) {
  const q = String(name || "").trim().toLowerCase();
  templates = templates.filter((t) => t.name.toLowerCase() !== q);
  save(templates);
  return { deleted: name };
}
function stampRecords(template, x, y, existingIndexKeys) {
  const shapes = template.records.filter((r) => r.typeName === "shape");
  const bindings = template.records.filter((r) => r.typeName === "binding");
  const minX = Math.min(...shapes.map((s) => s.x));
  const minY = Math.min(...shapes.map((s) => s.y));
  const idMap = {};
  for (const s of shapes) idMap[s.id] = rid2("shape");
  const out = [];
  let idx = nextIndex(existingIndexKeys);
  for (const s of shapes) {
    out.push({ ...s, id: idMap[s.id], parentId: "page:page", index: idx, x: x + (s.x - minX), y: y + (s.y - minY) });
    idx = getIndexAbove(idx);
  }
  for (const b of bindings) {
    if (idMap[b.fromId] && idMap[b.toId]) {
      out.push({ ...b, id: rid2("binding"), fromId: idMap[b.fromId], toId: idMap[b.toId] });
    }
  }
  return out;
}

// server.js
var PORT = Number(process.env.WB_PORT || 5858);
var HOST = process.env.WB_HOST || "127.0.0.1";
var DIST = import_node_path4.default.join(import_node_path4.default.dirname((0, import_node_url.fileURLToPath)(import_meta_url)), "web", "dist");
var MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff", ".map": "application/json" };
function serveStatic(res, pathname) {
  if (!import_node_fs3.default.existsSync(DIST)) return false;
  const rel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let file = import_node_path4.default.join(DIST, rel);
  if (!file.startsWith(DIST)) return false;
  if (!import_node_fs3.default.existsSync(file) || import_node_fs3.default.statSync(file).isDirectory()) file = import_node_path4.default.join(DIST, "index.html");
  if (!import_node_fs3.default.existsSync(file)) return false;
  res.writeHead(200, { "content-type": MIME[import_node_path4.default.extname(file)] || "application/octet-stream" });
  import_node_fs3.default.createReadStream(file).pipe(res);
  return true;
}
function records(room) {
  return room.getCurrentSnapshot().documents.map((d) => d.state);
}
function shapeIndexKeys(room) {
  return records(room).filter((r) => r.typeName === "shape").map((r) => r.index);
}
function checkEnum(name, value, allowed) {
  if (value == null) return;
  if (!allowed.includes(value)) throw new Error(`invalid ${name} "${value}". allowed: ${allowed.join(", ")}`);
}
function extractText(props) {
  const rt = props?.richText;
  if (!rt || !rt.content) return void 0;
  const walk = (nodes) => (nodes || []).map((n) => n.type === "text" ? n.text || "" : n.content ? walk(n.content) : "").join("");
  return rt.content.map((p) => walk(p.content)).join("\n").trim() || void 0;
}
function mapShape(r) {
  const s = {
    id: r.id,
    type: r.type,
    geo: r.props?.geo,
    x: Math.round(r.x),
    y: Math.round(r.y),
    w: r.props?.w,
    h: r.props?.h,
    color: r.props?.color,
    text: extractText(r.props)
  };
  if (r.type === "uml") {
    s.name = r.props?.name;
    s.fields = r.props?.fields;
    s.methods = r.props?.methods;
    delete s.text;
  }
  return s;
}
function arrowLinkMap(recs) {
  const m = {};
  for (const b of recs) if (b.typeName === "binding") (m[b.fromId] ??= {})[b.props?.terminal] = b.toId;
  return m;
}
function attachLinks(shapes, linkMap) {
  for (const s of shapes) if (s.type === "arrow" && linkMap[s.id]) s.link = linkMap[s.id];
  return shapes;
}
function haystack(s) {
  return (s.type === "uml" ? [s.name, ...s.fields || [], ...s.methods || []].join(" ") : s.text || "").toLowerCase();
}
function shapeFilter({ ids, type, color, text } = {}) {
  const idSet = ids && ids.length ? new Set(ids) : null;
  const needle = text != null && text !== "" ? String(text).toLowerCase() : null;
  return (s) => {
    if (idSet && !idSet.has(s.id)) return false;
    if (type && s.type !== type) return false;
    if (color && s.color !== color) return false;
    if (needle != null && !haystack(s).includes(needle)) return false;
    return true;
  };
}
function truncate(str, n) {
  if (str == null) return void 0;
  return str.length > n ? `${str.slice(0, n - 1)}\u2026` : str;
}
function indexShape(s) {
  const o = { id: s.id, type: s.type, label: truncate(s.type === "uml" ? s.name : s.text, 60) };
  if (s.link) o.link = s.link;
  return o;
}
function textShape(s) {
  if (s.type === "arrow") {
    const o = { id: s.id };
    if (s.link) o.link = s.link;
    if (s.text) o.text = s.text;
    return o;
  }
  const t = s.type === "uml" ? [s.name, ...s.fields || [], ...s.methods || []].filter(Boolean).join(" / ") : s.text;
  return t ? { id: s.id, text: t } : null;
}
function clockOf(snap) {
  return snap.documentClock ?? snap.clock ?? 0;
}
function parseQuery(url) {
  const sp = url.searchParams;
  const q = {};
  for (const k of ["type", "color", "text", "fields"]) {
    const v = sp.get(k);
    if (v) q[k] = v;
  }
  const ids = sp.get("ids");
  if (ids) q.ids = ids.split(",").map((s) => s.trim()).filter(Boolean);
  const since = sp.get("since");
  if (since != null && since !== "" && !Number.isNaN(Number(since))) q.since = Number(since);
  return q;
}
function boardView(room, q = {}) {
  const snap = room.getCurrentSnapshot();
  const clock = clockOf(snap);
  const allRecs = snap.documents.map((d) => d.state);
  const linkMap = arrowLinkMap(allRecs);
  const filter = shapeFilter(q);
  if (q.since != null) {
    const shapes2 = attachLinks(
      snap.documents.filter((d) => (d.lastChangedClock ?? 0) > q.since).map((d) => d.state).filter((r) => r.typeName === "shape").map(mapShape).filter(filter),
      linkMap
    );
    const deleted = Object.entries(snap.tombstones || {}).filter(([id, c]) => c > q.since && String(id).startsWith("shape:")).map(([id]) => id);
    return { since: q.since, clock, shapes: shapes2, deleted, counts: { shapes: shapes2.length, deleted: deleted.length } };
  }
  const shapes = attachLinks(allRecs.filter((r) => r.typeName === "shape").map(mapShape).filter(filter), linkMap);
  const bindings = allRecs.filter((r) => r.typeName === "binding");
  return { shapes, clock, counts: { shapes: shapes.length, bindings: bindings.length } };
}
function summarize(room) {
  return boardView(room);
}
function boardSummary(room) {
  const snap = room.getCurrentSnapshot();
  const recs = snap.documents.map((d) => d.state);
  const shapes = recs.filter((r) => r.typeName === "shape");
  const bindings = recs.filter((r) => r.typeName === "binding");
  const byType = {};
  for (const s of shapes) {
    const t = s.type;
    byType[t] = (byType[t] || 0) + 1;
  }
  return { clock: clockOf(snap), counts: { shapes: shapes.length, bindings: bindings.length }, byType };
}
function queryShapes(room, q = {}) {
  const snap = room.getCurrentSnapshot();
  const allRecs = snap.documents.map((d) => d.state);
  const linkMap = arrowLinkMap(allRecs);
  const full = attachLinks(allRecs.filter((r) => r.typeName === "shape").map(mapShape).filter(shapeFilter(q)), linkMap);
  const shapes = q.fields === "index" ? full.map(indexShape) : q.fields === "text" ? full.map(textShape).filter(Boolean) : full;
  return { shapes, clock: clockOf(snap), counts: { shapes: shapes.length } };
}
function neighborsView(room, seedIds, hops) {
  const snap = room.getCurrentSnapshot();
  const allRecs = snap.documents.map((d) => d.state);
  const linkMap = arrowLinkMap(allRecs);
  const shapeIds = new Set(allRecs.filter((r) => r.typeName === "shape").map((r) => r.id));
  const adj = /* @__PURE__ */ new Map();
  const link = (a, b, arrow) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a).push({ node: b, arrow });
  };
  for (const [arrow, ends] of Object.entries(linkMap)) {
    if (!ends.start || !ends.end) continue;
    link(ends.start, ends.end, arrow);
    link(ends.end, ends.start, arrow);
  }
  const seeds = seedIds.filter((id) => shapeIds.has(id));
  const missing = seedIds.filter((id) => !shapeIds.has(id));
  const visited = new Set(seeds);
  const arrows = /* @__PURE__ */ new Set();
  let frontier = [...seeds];
  for (let h = 0; h < Math.max(1, hops); h++) {
    const next = [];
    for (const n of frontier) for (const e of adj.get(n) || []) {
      arrows.add(e.arrow);
      if (!visited.has(e.node)) {
        visited.add(e.node);
        next.push(e.node);
      }
    }
    frontier = next;
  }
  const want = /* @__PURE__ */ new Set([...visited, ...arrows]);
  const shapes = attachLinks(allRecs.filter((r) => r.typeName === "shape" && want.has(r.id)).map(mapShape), linkMap);
  return { seeds, ...missing.length ? { missing } : {}, hops: Math.max(1, hops), clock: clockOf(snap), shapes, counts: { shapes: shapes.length } };
}
function overlapReport(room) {
  const NODE = /* @__PURE__ */ new Set(["geo", "uml", "note", "text"]);
  const all = records(room).filter((r) => r.typeName === "shape" && NODE.has(r.type) && r.props?.w != null).map((r) => ({ id: r.id, x: r.x, y: r.y, w: r.props.w, h: r.props.h }));
  const contains = (a, b) => a.id !== b.id && a.x <= b.x + 0.5 && a.y <= b.y + 0.5 && a.x + a.w >= b.x + b.w - 0.5 && a.y + a.h >= b.y + b.h - 0.5;
  const containerIds = new Set(all.filter((a) => all.some((b) => contains(a, b))).map((a) => a.id));
  const rects = all.filter((r) => !containerIds.has(r.id));
  let overlapArea = 0, pairs = 0, worst = null;
  const offenders = {};
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const A = rects[i], B = rects[j];
      const ix = Math.max(0, Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x));
      const iy = Math.max(0, Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y));
      const area = ix * iy;
      if (area <= 0) continue;
      overlapArea += area;
      pairs++;
      offenders[A.id] = (offenders[A.id] || 0) + area;
      offenders[B.id] = (offenders[B.id] || 0) + area;
      if (!worst || area > worst.area) worst = { a: A.id, b: B.id, area: Math.round(area) };
    }
  }
  const totalArea = rects.reduce((s, r) => s + r.w * r.h, 0) || 1;
  const ratio = overlapArea / totalArea;
  const topOffenders = Object.entries(offenders).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, a]) => ({ id, area: Math.round(a) }));
  return {
    leafNodes: rects.length,
    containers: containerIds.size,
    overlappingPairs: pairs,
    overlapArea: Math.round(overlapArea),
    overlapRatio: Math.round(ratio * 1e3) / 1e3,
    verdict: pairs === 0 ? "clean" : ratio < 0.03 ? "minor" : "bad",
    worstPair: worst,
    topOffenders
  };
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => data += c);
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}
function json(res, code, obj) {
  res.writeHead(code, { "content-type": "application/json", "access-control-allow-origin": "*" });
  res.end(JSON.stringify(obj));
}
async function put(room, ...recs) {
  await room.updateStore((store) => {
    for (const r of recs) store.put(r);
  });
}
function applyUpdate(store, b) {
  checkEnum("color", b.color, COLORS);
  checkEnum("fill", b.fill, FILLS);
  const rec = store.get(b.id);
  if (!rec) throw new Error(`shape ${b.id} not found`);
  const next = { ...rec, props: { ...rec.props } };
  if (b.x != null) next.x = b.x;
  if (b.y != null) next.y = b.y;
  if (b.w != null && "w" in next.props) next.props.w = b.w;
  if (b.color != null && "color" in next.props) next.props.color = b.color;
  if (b.fill != null && "fill" in next.props) next.props.fill = b.fill;
  if (b.text != null && "richText" in next.props) next.props.richText = richText(b.text);
  if (b.name != null && "name" in next.props) next.props.name = String(b.name);
  if (Array.isArray(b.fields) && "fields" in next.props) next.props.fields = b.fields.map(String);
  if (Array.isArray(b.methods) && "methods" in next.props) next.props.methods = b.methods.map(String);
  if (rec.type === "geo") {
    const targetW = b.w != null ? b.w : next.props.w;
    const fit = geoSizeForText(extractText(next.props) || "", next.props.size, next.props.geo, next.props.scale, targetW);
    next.props.w = fit.w;
    next.props.h = fit.h;
  }
  if (rec.type === "uml") {
    next.props.h = umlHeight(next.props.fields, next.props.methods);
    if (b.w == null) next.props.w = umlWidth(next.props.name, next.props.fields, next.props.methods);
  }
  if (rec.type === "note" && b.text != null) {
    const box = noteBox(extractText(next.props) || "", next.props.size);
    next.props.growY = box.growY;
    next.meta = { ...next.meta, w: box.w };
  }
  store.put(next);
  return next.id;
}
function moveEnclosed(store, id, dx, dy) {
  const c = store.get(id);
  if (!c || c.props?.w == null) throw new Error(`container "${id}" not found (must be a box with a size)`);
  const NODE = /* @__PURE__ */ new Set(["geo", "uml", "note", "text"]);
  const cx = c.x, cy = c.y, cw = c.props.w, ch = c.props.h;
  const inside = (s) => s.id !== id && s.typeName === "shape" && NODE.has(s.type) && s.props?.w != null && s.x >= cx - 0.5 && s.y >= cy - 0.5 && s.x + s.props.w <= cx + cw + 0.5 && s.y + s.props.h <= cy + ch + 0.5;
  const targets = [c, ...store.getAll().filter(inside)];
  for (const s of targets) store.put({ ...s, x: s.x + dx, y: s.y + dy });
  return targets.map((s) => s.id);
}
function applyMoveContainer(store, b) {
  const c = store.get(b.id);
  if (!c || c.props?.w == null) throw new Error(`container "${b.id}" not found (must be a box with a size)`);
  const dx = b.x != null ? b.x - c.x : b.dx || 0;
  const dy = b.y != null ? b.y - c.y : b.dy || 0;
  return moveEnclosed(store, b.id, dx, dy);
}
function spaceLayout(store, gap, containerId) {
  const NODE = /* @__PURE__ */ new Set(["geo", "uml", "note", "text"]);
  const rects = store.getAll().filter((r) => r.typeName === "shape" && NODE.has(r.type) && r.props?.w != null).map((r) => ({ id: r.id, type: r.type, x: r.x, y: r.y, w: r.props.w, h: r.props.h }));
  if (rects.length < 2) return 0;
  const PAD = Math.max(16, Math.round(gap / 2));
  const byId = new Map(rects.map((r) => [r.id, r]));
  const areaOf = (r) => r.w * r.h;
  const contains = (a, b) => a.id !== b.id && a.x <= b.x + 0.5 && a.y <= b.y + 0.5 && a.x + a.w >= b.x + b.w - 0.5 && a.y + a.h >= b.y + b.h - 0.5;
  const parent = /* @__PURE__ */ new Map();
  for (const r of rects) {
    let best = null;
    for (const c of rects) if (contains(c, r) && (!best || areaOf(c) < areaOf(best))) best = c;
    parent.set(r.id, best);
  }
  const children = /* @__PURE__ */ new Map();
  for (const r of rects) {
    const p = parent.get(r.id);
    if (p) {
      const a = children.get(p.id) || [];
      a.push(r);
      children.set(p.id, a);
    }
  }
  const isC = (r) => children.has(r.id);
  const desc = (r) => {
    const o = [];
    const st = [...children.get(r.id) || []];
    while (st.length) {
      const x = st.pop();
      o.push(x);
      if (children.has(x.id)) st.push(...children.get(x.id));
    }
    return o;
  };
  const move = (r, dx, dy) => {
    r.x += dx;
    r.y += dy;
    if (isC(r)) for (const d of desc(r)) {
      d.x += dx;
      d.y += dy;
    }
  };
  const sep = (m) => {
    for (let it = 0; it < 400; it++) {
      let mv = false;
      for (let i = 0; i < m.length; i++) for (let j = i + 1; j < m.length; j++) {
        const A = m[i], B = m[j];
        const dx = B.x + B.w / 2 - (A.x + A.w / 2), dy = B.y + B.h / 2 - (A.y + A.h / 2);
        const ox = (A.w + B.w) / 2 + gap - Math.abs(dx), oy = (A.h + B.h) / 2 + gap - Math.abs(dy);
        if (ox > 0 && oy > 0) {
          if (ox <= oy) {
            const p = ox / 2 * (dx < 0 ? -1 : 1);
            move(A, -p, 0);
            move(B, p, 0);
          } else {
            const p = oy / 2 * (dy < 0 ? -1 : 1);
            move(A, 0, -p);
            move(B, 0, p);
          }
          mv = true;
        }
      }
      if (!mv) break;
    }
  };
  const grow = (c) => {
    const k = children.get(c.id);
    if (!k || !k.length) return;
    const mnX = Math.min(...k.map((x) => x.x)), mnY = Math.min(...k.map((x) => x.y));
    const mxX = Math.max(...k.map((x) => x.x + x.w)), mxY = Math.max(...k.map((x) => x.y + x.h));
    c.x = mnX - PAD;
    c.y = mnY - PAD;
    c.w = mxX - mnX + 2 * PAD;
    c.h = mxY - mnY + 2 * PAD;
  };
  const layout = (m) => {
    for (const x of m) if (isC(x)) {
      layout(children.get(x.id));
      grow(x);
    }
    if (m.length > 1) sep(m);
  };
  let affected;
  if (containerId) {
    const c = byId.get(containerId);
    if (!c) throw new Error(`container "${containerId}" not found`);
    if (!isC(c)) throw new Error(`"${containerId}" has no nodes inside it to space`);
    const ox = c.x, oy = c.y;
    layout(children.get(c.id));
    grow(c);
    move(c, ox - c.x, oy - c.y);
    affected = /* @__PURE__ */ new Set([c.id, ...desc(c).map((d) => d.id)]);
  } else {
    layout(rects.filter((r) => !parent.get(r.id)));
    affected = new Set(rects.map((r) => r.id));
  }
  for (const id of affected) {
    const r = byId.get(id);
    const rec = store.get(id);
    if (!rec) continue;
    const next = { ...rec, x: Math.round(r.x), y: Math.round(r.y) };
    if (isC(r) && rec.type === "geo") next.props = { ...rec.props, w: Math.round(r.w), h: Math.round(r.h) };
    store.put(next);
  }
  return affected.size;
}
function reflowArrowLabels(store) {
  const all = store.getAll();
  const NODE_TYPES = /* @__PURE__ */ new Set(["geo", "uml", "note", "text"]);
  const nodeRects = [];
  for (const r of all) {
    if (r.typeName !== "shape" || !NODE_TYPES.has(r.type)) continue;
    const w = r.props?.w, h = r.props?.h;
    if (w == null || h == null) continue;
    nodeRects.push({ x: r.x, y: r.y, w, h });
  }
  const overlapArea = (ax, ay, aw, ah) => {
    let area = 0;
    for (const b of nodeRects) {
      const ix = Math.max(0, Math.min(ax + aw, b.x + b.w) - Math.max(ax, b.x));
      const iy = Math.max(0, Math.min(ay + ah, b.y + b.h) - Math.max(ay, b.y));
      area += ix * iy;
    }
    return area;
  };
  const byId = new Map(all.map((r) => [r.id, r]));
  const bindings = all.filter((r) => r.typeName === "binding" && r.type === "arrow");
  for (const arrow of all) {
    if (arrow.typeName !== "shape" || arrow.type !== "arrow") continue;
    const text = extractText(arrow.props);
    if (!text) continue;
    const own = bindings.filter((b) => b.fromId === arrow.id);
    const startB = own.find((b) => b.props?.terminal === "start");
    const endB = own.find((b) => b.props?.terminal === "end");
    if (!startB || !endB) continue;
    const s = byId.get(startB.toId), e = byId.get(endB.toId);
    if (!s || !e) continue;
    if (s.props?.w == null || s.props?.h == null || e.props?.w == null || e.props?.h == null) continue;
    const sx = s.x + s.props.w / 2, sy = s.y + s.props.h / 2;
    const ex = e.x + e.props.w / 2, ey = e.y + e.props.h / 2;
    const lines = text.split("\n");
    const labelW = Math.max(...lines.map((l) => l.length)) * 11 + 16;
    const labelH = lines.length * 24 + 8;
    let bestT = 0.5, bestArea = Infinity;
    for (const t2 of [0.5, 0.35, 0.65, 0.25, 0.75, 0.15, 0.85]) {
      const cx = sx + (ex - sx) * t2, cy = sy + (ey - sy) * t2;
      const area = overlapArea(cx - labelW / 2, cy - labelH / 2, labelW, labelH);
      if (area < bestArea) {
        bestArea = area;
        bestT = t2;
      }
    }
    const t = Math.max(0.05, Math.min(0.95, bestT));
    if (Math.abs(t - (arrow.props?.labelPosition ?? 0.5)) > 1e-3) {
      store.put({ ...arrow, props: { ...arrow.props, labelPosition: t } });
    }
  }
}
function boardId(url) {
  return url.searchParams.get("board") || url.searchParams.get("room") || "main";
}
function roomFor(url) {
  return getRoom(boardId(url));
}
function expandOps(rawOps, defaults = {}) {
  const out = [];
  for (const raw of rawOps) {
    const op = { ...defaults, ...raw };
    if (op.op === "col" || op.op === "row") {
      const horizontal = op.op === "row";
      const step = Number.isFinite(op.step) ? op.step : horizontal ? 200 : 50;
      const x0 = op.x ?? 0;
      const y0 = op.y ?? 0;
      const { op: _op, items, x: _x, y: _y, step: _step, ...shared } = op;
      const list = Array.isArray(items) ? items : [];
      list.forEach((it, i) => {
        const item = typeof it === "string" ? { text: it } : it || {};
        out.push({
          op: item.op || "node",
          ...shared,
          ...item,
          x: horizontal ? x0 + i * step : x0,
          y: horizontal ? y0 : y0 + i * step
        });
      });
    } else {
      out.push(op);
    }
  }
  return out;
}
var server = import_node_http.default.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;
  const M = req.method;
  try {
    if (M === "GET" && p === "/health") return json(res, 200, { ok: true });
    if (M === "GET" && p === "/boards") return json(res, 200, { boards: listBoards() });
    if (M === "POST" && p === "/boards") {
      const b = await readBody(req);
      return json(res, 200, createBoard(b.name, b.folderId));
    }
    if (M === "POST" && p === "/boards/rename") {
      const b = await readBody(req);
      return json(res, 200, renameBoard(b.id, b.name));
    }
    if (M === "POST" && p === "/boards/delete") {
      const b = await readBody(req);
      const ids = Array.isArray(b.ids) ? b.ids : b.id ? [b.id] : [];
      return json(res, 200, { deleted: ids.map((id) => deleteBoard(id).deleted) });
    }
    if (M === "POST" && p === "/boards/move") {
      const b = await readBody(req);
      return json(res, 200, moveBoards(b.ids ?? b.id, b.folderId ?? null));
    }
    if (M === "GET" && p === "/boards/find") {
      return json(res, 200, { matches: findBoards(url.searchParams.get("q")) });
    }
    if (M === "GET" && p === "/folders") return json(res, 200, { folders: listFolders() });
    if (M === "POST" && p === "/folders") {
      const b = await readBody(req);
      return json(res, 200, createFolder(b.name));
    }
    if (M === "POST" && p === "/folders/rename") {
      const b = await readBody(req);
      return json(res, 200, renameFolder(b.id, b.name));
    }
    if (M === "POST" && p === "/folders/delete") {
      const b = await readBody(req);
      return json(res, 200, deleteFolder(b.id));
    }
    if (M === "GET" && p === "/templates") return json(res, 200, { templates: listTemplates() });
    if (M === "POST" && p === "/templates") {
      const b = await readBody(req);
      return json(res, 200, saveTemplate(b.name, b.records));
    }
    if (M === "POST" && p === "/templates/delete") {
      const b = await readBody(req);
      return json(res, 200, deleteTemplate(b.name));
    }
    if (M === "POST" && p === "/templates/save-from") {
      const b = await readBody(req);
      const recs = records(roomFor(url));
      const idSet = new Set(b.ids || []);
      const shapes = recs.filter((r) => r.typeName === "shape" && idSet.has(r.id));
      const bindings = recs.filter((r) => r.typeName === "binding" && idSet.has(r.fromId) && idSet.has(r.toId));
      return json(res, 200, saveTemplate(b.name, [...shapes, ...bindings]));
    }
    if (M === "POST" && p === "/templates/stamp") {
      const b = await readBody(req);
      const t = getTemplate(b.name);
      if (!t) throw new Error(`no template "${b.name}"`);
      const room = roomFor(url);
      const out = stampRecords(t, b.x ?? 0, b.y ?? 0, shapeIndexKeys(room));
      await put(room, ...out);
      return json(res, 200, { stamped: t.name, count: out.length });
    }
    if (M === "GET" && p === "/snapshot") return json(res, 200, roomFor(url).getCurrentSnapshot());
    if (M === "GET" && p === "/board") {
      if (!boardExists(boardId(url))) return json(res, 404, { error: `board "${boardId(url)}" not found` });
      return json(res, 200, { board: boardId(url), ...boardView(roomFor(url), parseQuery(url)) });
    }
    if (M === "GET" && p === "/shapes") {
      if (!boardExists(boardId(url))) return json(res, 404, { error: `board "${boardId(url)}" not found` });
      return json(res, 200, { board: boardId(url), ...queryShapes(roomFor(url), parseQuery(url)) });
    }
    if (M === "GET" && p === "/summary") {
      if (!boardExists(boardId(url))) return json(res, 404, { error: `board "${boardId(url)}" not found` });
      return json(res, 200, { board: boardId(url), ...boardSummary(roomFor(url)) });
    }
    if (M === "GET" && p === "/neighbors") {
      if (!boardExists(boardId(url))) return json(res, 404, { error: `board "${boardId(url)}" not found` });
      const ids = (url.searchParams.get("ids") || "").split(",").map((s) => s.trim()).filter(Boolean);
      if (!ids.length) return json(res, 400, { error: "neighbors needs ids" });
      const hops = Number(url.searchParams.get("hops")) || 1;
      return json(res, 200, { board: boardId(url), ...neighborsView(roomFor(url), ids, hops) });
    }
    if (M === "GET" && p === "/overlap") {
      if (!boardExists(boardId(url))) return json(res, 404, { error: `board "${boardId(url)}" not found` });
      return json(res, 200, overlapReport(roomFor(url)));
    }
    if (M === "POST") {
      const b = await readBody(req);
      const room = roomFor(url);
      if (p === "/node") {
        checkEnum("color", b.color, COLORS);
        checkEnum("fill", b.fill, FILLS);
        checkEnum("shape", b.shape, GEO);
        checkEnum("size", b.size, SIZES);
        const rec = buildGeo({ text: b.text, x: b.x ?? 0, y: b.y ?? 0, w: b.w, geo: b.shape, color: b.color, fill: b.fill, size: b.size, index: nextIndex(shapeIndexKeys(room)) });
        await put(room, rec);
        return json(res, 200, { id: rec.id });
      }
      if (p === "/text") {
        checkEnum("color", b.color, COLORS);
        checkEnum("size", b.size, SIZES);
        const rec = buildText({ text: b.text, x: b.x ?? 0, y: b.y ?? 0, color: b.color, size: b.size, index: nextIndex(shapeIndexKeys(room)) });
        await put(room, rec);
        return json(res, 200, { id: rec.id });
      }
      if (p === "/note") {
        checkEnum("color", b.color, COLORS);
        const rec = buildNote({ text: b.text, x: b.x ?? 0, y: b.y ?? 0, color: b.color, index: nextIndex(shapeIndexKeys(room)) });
        await put(room, rec);
        return json(res, 200, { id: rec.id });
      }
      if (p === "/uml") {
        checkEnum("color", b.color, COLORS);
        const rec = buildUml({
          name: b.name,
          fields: b.fields || [],
          methods: b.methods || [],
          x: b.x ?? 0,
          y: b.y ?? 0,
          w: b.w,
          color: b.color,
          index: nextIndex(shapeIndexKeys(room))
        });
        await put(room, rec);
        return json(res, 200, { id: rec.id });
      }
      if (p === "/uml/add") {
        let out = null;
        await room.updateStore((store) => {
          const rec = store.get(b.id);
          if (!rec || rec.type !== "uml") throw new Error(`uml shape ${b.id} not found`);
          const props = { ...rec.props, fields: [...rec.props.fields], methods: [...rec.props.methods] };
          if (b.field != null) props.fields.push(String(b.field));
          if (b.method != null) props.methods.push(String(b.method));
          props.h = umlHeight(props.fields, props.methods);
          props.w = umlWidth(props.name, props.fields, props.methods);
          store.put({ ...rec, props });
          out = rec.id;
        });
        return json(res, 200, { id: out });
      }
      if (p === "/connect") {
        checkEnum("color", b.color, COLORS);
        const ids = new Set(records(room).map((r) => r.id));
        if (!ids.has(b.fromId) || !ids.has(b.toId)) throw new Error(`fromId/toId not found (${b.fromId} -> ${b.toId})`);
        const arrow = buildArrow({ text: b.text, color: b.color, dash: b.dashed ? "dashed" : "draw", index: nextIndex(shapeIndexKeys(room)) });
        await put(
          room,
          arrow,
          buildArrowBinding({ arrowId: arrow.id, shapeId: b.fromId, terminal: "start" }),
          buildArrowBinding({ arrowId: arrow.id, shapeId: b.toId, terminal: "end" })
        );
        return json(res, 200, { id: arrow.id });
      }
      if (p === "/update") {
        let updated = null;
        await room.updateStore((store) => {
          updated = applyUpdate(store, b);
        });
        return json(res, 200, { id: updated });
      }
      if (p === "/move-container") {
        let moved = [];
        await room.updateStore((store) => {
          moved = applyMoveContainer(store, b);
        });
        return json(res, 200, { moved });
      }
      if (p === "/space") {
        const gap = Number.isFinite(b.gap) ? b.gap : 60;
        let touched = 0;
        await room.updateStore((store) => {
          touched = spaceLayout(store, gap, b.container);
          reflowArrowLabels(store);
        });
        return json(res, 200, { touched, gap, ...b.container ? { container: b.container } : {} });
      }
      if (p === "/delete") {
        const ids = Array.isArray(b.ids) ? b.ids : b.id ? [b.id] : [];
        await room.updateStore((store) => {
          const idSet = new Set(ids);
          for (const r of store.getAll()) {
            if (r.typeName === "binding" && (idSet.has(r.fromId) || idSet.has(r.toId))) store.delete(r.id);
          }
          for (const id of ids) store.delete(id);
        });
        return json(res, 200, { deleted: ids });
      }
      if (p === "/clear") {
        await room.updateStore((store) => {
          for (const r of store.getAll()) if (r.typeName === "shape" || r.typeName === "binding") store.delete(r.id);
        });
        return json(res, 200, { ok: true });
      }
      if (p === "/batch") {
        const ops = expandOps(Array.isArray(b.ops) ? b.ops : [], b.defaults && typeof b.defaults === "object" ? b.defaults : {});
        const refs = {};
        await room.updateStore((store) => {
          let idx = nextIndex(store.getAll().filter((r) => r.typeName === "shape").map((r) => r.index));
          const takeIdx = () => {
            const cur = idx;
            idx = getIndexAbove(idx);
            return cur;
          };
          const rid3 = (x) => x != null && refs[x] != null ? refs[x] : x;
          for (const op of ops) {
            const k = op.op;
            if (k === "node") {
              checkEnum("color", op.color, COLORS);
              checkEnum("fill", op.fill, FILLS);
              checkEnum("shape", op.shape, GEO);
              checkEnum("size", op.size, SIZES);
              const rec = buildGeo({ text: op.text, x: op.x ?? 0, y: op.y ?? 0, w: op.w, geo: op.shape, color: op.color, fill: op.fill, size: op.size, index: takeIdx() });
              store.put(rec);
              if (op.ref) refs[op.ref] = rec.id;
            } else if (k === "text") {
              checkEnum("color", op.color, COLORS);
              checkEnum("size", op.size, SIZES);
              const rec = buildText({ text: op.text, x: op.x ?? 0, y: op.y ?? 0, color: op.color, size: op.size, index: takeIdx() });
              store.put(rec);
              if (op.ref) refs[op.ref] = rec.id;
            } else if (k === "note") {
              checkEnum("color", op.color, COLORS);
              const rec = buildNote({ text: op.text, x: op.x ?? 0, y: op.y ?? 0, color: op.color, index: takeIdx() });
              store.put(rec);
              if (op.ref) refs[op.ref] = rec.id;
            } else if (k === "uml") {
              checkEnum("color", op.color, COLORS);
              const rec = buildUml({ name: op.name, fields: op.fields || [], methods: op.methods || [], x: op.x ?? 0, y: op.y ?? 0, w: op.w, color: op.color, index: takeIdx() });
              store.put(rec);
              if (op.ref) refs[op.ref] = rec.id;
            } else if (k === "connect") {
              checkEnum("color", op.color, COLORS);
              const from = rid3(op.from ?? op.fromId), to = rid3(op.to ?? op.toId);
              if (!store.get(from) || !store.get(to)) throw new Error(`connect: from/to not found (${from} -> ${to})`);
              const arrow = buildArrow({ text: op.text, color: op.color, dash: op.dashed ? "dashed" : "draw", index: takeIdx() });
              store.put(arrow);
              store.put(buildArrowBinding({ arrowId: arrow.id, shapeId: from, terminal: "start" }));
              store.put(buildArrowBinding({ arrowId: arrow.id, shapeId: to, terminal: "end" }));
              if (op.ref) refs[op.ref] = arrow.id;
            } else if (k === "update" || k === "move") {
              applyUpdate(store, { ...op, id: rid3(op.id) });
            } else if (k === "move_container") {
              applyMoveContainer(store, { ...op, id: rid3(op.id) });
            } else if (k === "space") {
              spaceLayout(store, Number.isFinite(op.gap) ? op.gap : 60, op.container ? rid3(op.container) : void 0);
            } else if (k === "delete") {
              const ids = (Array.isArray(op.ids) ? op.ids : [op.id]).map(rid3);
              const idSet = new Set(ids);
              for (const r of store.getAll()) if (r.typeName === "binding" && (idSet.has(r.fromId) || idSet.has(r.toId))) store.delete(r.id);
              for (const id of ids) store.delete(id);
            } else {
              throw new Error(`unknown op "${k}" (use node|text|note|uml|connect|update|move|delete)`);
            }
          }
          reflowArrowLabels(store);
        });
        return json(res, 200, { refs, count: ops.length });
      }
      if (p === "/mutate") {
        await room.updateStore((store) => {
          for (const rec of b.puts || []) store.put(rec);
          for (const d of b.deletes || []) store.delete(d);
        });
        return json(res, 200, { ok: true, ...summarize(room) });
      }
      if (p === "/reflow-labels") {
        await room.updateStore((store) => reflowArrowLabels(store));
        return json(res, 200, { ok: true });
      }
    }
    if (M === "GET" && serveStatic(res, p)) return;
    json(res, 404, { error: "not found" });
  } catch (err) {
    json(res, 400, { error: String(err?.message || err) });
  }
});
var wss = new import_websocket_server.default({ noServer: true });
server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const m = url.pathname.match(/^\/connect\/(.+)$/);
  if (!m) return socket.destroy();
  const id = decodeURIComponent(m[1]);
  const sessionId = url.searchParams.get("sessionId") || `sess-${Math.random().toString(36).slice(2)}`;
  wss.handleUpgrade(req, socket, head, (ws) => {
    getRoom(id).handleSocketConnect({ sessionId, socket: ws });
  });
});
server.listen(PORT, HOST, () => {
  console.log(`[whiteboard] sync backend on http://${HOST}:${PORT}`);
  console.log(`[whiteboard] boards: ${listBoards().map((b) => b.id).join(", ") || "(none yet)"}`);
});
/*! Bundled license information:

@tldraw/utils/dist-esm/lib/bind.mjs:
  (*!
   * MIT License: https://github.com/NoHomey/bind-decorator/blob/master/License
   * Copyright (c) 2016 Ivo Stratev
   *)

@tldraw/utils/dist-esm/lib/id.mjs:
  (*!
   * MIT License: https://github.com/ai/nanoid/blob/main/LICENSE
   * Modified code originally from <https://github.com/ai/nanoid>
   * Copyright 2017 Andrey Sitnik <andrey@sitnik.ru>
   *
   * `nanoid` is currently only distributed as an ES module. Some tools (jest, playwright) don't
   * properly support ESM-only code yet, and tldraw itself is distributed as both an ES module and a
   * CommonJS module. By including nanoid here, we can make sure it works well in every environment
   * where tldraw is used. We can also remove some unused features like custom alphabets.
   *)

@tldraw/utils/dist-esm/lib/media/apng.mjs:
  (*!
   * MIT License: https://github.com/vHeemstra/is-apng/blob/main/license
   * Copyright (c) Philip van Heemstra
   *)

@tldraw/utils/dist-esm/lib/media/gif.mjs:
  (*!
   * MIT License
   * Modified code originally from <https://github.com/qzb/is-animated>
   * Copyright (c) 2016 Józef Sokołowski <j.k.sokolowski@gmail.com>
   *)

@tldraw/utils/dist-esm/lib/media/png.mjs:
  (*!
   * MIT License: https://github.com/alexgorbatchev/crc/blob/master/LICENSE
   * Copyright: 2014 Alex Gorbatchev
   * Code: crc32, https://github.com/alexgorbatchev/crc/blob/master/src/calculators/crc32.ts
   *)

@tldraw/utils/dist-esm/lib/media/webp.mjs:
  (*!
   * MIT License: https://github.com/sindresorhus/is-webp/blob/main/license
   * Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
   *)

@tldraw/store/dist-esm/lib/ImmutableMap.mjs:
  (*!
   * This file was lovingly and delicately extracted from Immutable.js
   * MIT License: https://github.com/immutable-js/immutable-js/blob/main/LICENSE
   * Copyright (c) 2014-present, Lee Byron and other contributors.
   *)
*/
