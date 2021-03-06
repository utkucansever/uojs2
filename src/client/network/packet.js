import { PacketTypes, MaximumPacketSize } from './constants';
import { StringUtils } from '../utils';

export class Packet {
    constructor(data) {
        this.data = new Uint8Array(data);
        this.position = 0; //TODO seek
    }
    resize(newSize) {
        newSize = Math.min(newSize, MaximumPacketSize);
        const newBuffer = new Uint8Array(newSize);

        for(let i = 0; i < newSize /*this.data.length*/; i++) {
            newBuffer[i] = this.data[i];
        }

        this.data = newBuffer;
        this.position = Math.min(newSize - 1, this.position);
    }

    clone() {
        return new Packet(this.data);
    }

    size() {
        return this.data.length;
    }

    getId() {
        return ~~this.data[0];
    }

    nextInt() {
        const v = this.getInt(this.position);
        this.position += 4;
        return v;
    }
    nextShort() {
        const value = this.getShort(this.position);
        this.position += 2;
        return value;
    }
    nextByte() {
        return this.getByte(this.position++);
    }
    nextString(length) {
        const str = this.getString(this.position, length);
        this.position += length;
        return str;
    }
    nextUnicodeString(length) {
        return String.fromCharCode.apply(null, this.nextArray(length));
    }
    nextArray(length) {
        const arr = this.getArray(this.position, length);
        this.position += length;
        return arr;
    }
    getArray(offset, size) {
        return this.data.subarray(offset, offset + size);
    }
    getNumber(offset, size) {
        let result = 0;
        for(let i = 0; i < size; i++) {
            result |= (this.data[offset + i] & 0xFF) << (8 * (size - i - 1));
        }
        return result;
    }

    getString(offset, length) {
        let buffer = '';
        for(let i = 0; i < length; i++) {
            buffer += String.fromCharCode(this.data[offset + i]);
        }
        return StringUtils.trim(buffer);
    }

    getByte(offset) {
        return this.getNumber(offset, 1);
    }

    getShort(offset) {
        return this.getNumber(offset, 2);
    }

    getInt(offset) {
        return this.getNumber(offset, 4);
    }

    append() {
        for(let i = 0; i < arguments.length; i++) {
            let arg = arguments[i];
            let t = typeof(arg);

            if (t === 'number') {
                // just assume t is a byte
                this.data[this.position++] = arg & 0xFF;
            } else if (t === 'string') {
                // iterate through the string
                for(let j = 0; j < arg.length; j++) {
                    this.data[this.position++] = arg.charCodeAt(j) & 0xFF;
                }
            } else if (arg instanceof Array) {
                for(let j = 0; j < arg.length; j++) {
                    this.data[this.position++] = arg[j] & 0xFF;
                }
            } else {
                // unknown type
                throw `cannot append type ${t}`;
            }
        }
    }
    appendShort(value) {
        this.append((value >> 8) & 0xFF, (value) & 0xFF);
    }
    toArray() {
        return Array.prototype.slice.call(this.data);
    }
    toBuffer() {
        return this.data.buffer;
    }

    toString() {
        if (!this.data.length) {
            return '[Packet: empty]';
        }

        const initialByte = this.data[0];

        if (PacketTypes[initialByte]) {
            return `[Packet: ${PacketTypes[initialByte][0]}]`;
        }
        return `[Packet: Unknown 0x${this.data[0].toString(16)}]`;
    }

    toASCIIString() {
        if (!this.data.length) {
            return '[Packet: empty]';
        }

        const asciiString = Array.prototype.map.call(this.data, x => {
            if (x < 0x7F && x > 0x1F) {
                return String.fromCharCode(x);
            }
            return '?';
        }).join('');

        return `[Packet: "${asciiString}"]`;
    }

    toPrettyString() {
        if (!this.data.length) {
            return '[Packet: empty]';
        }

        const prettyString = Array.prototype.map.call(this.data, x => x.toString(16)).join(', ').toUpperCase();
        const initialByte = this.data[0];
        if (PacketTypes[initialByte]) {
            return `[Packet(${PacketTypes[initialByte][0]}): ${prettyString}]`;
        }
        return `[Packet: ${prettyString}]`;
    }

    get expectedSize() {
        const initialByte = this.data[0];
        return PacketTypes[initialByte][1];
    }
    get variableSize() {
        //TODO check position > 3?
        return this.getShort(1);
    }
    /**
     * Skips to the beginning of the data portion of the packet.
     */
    begin() {
        if (this.expectedSize === -1) {
            this.position = 3;
        } else {
            this.position = 1;
        }
    }
}
