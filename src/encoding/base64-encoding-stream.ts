/*
    Copyright 2022 Luke A.C.A. Rieff (Skywa04885)

    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
    to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
    and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import {Transform, TransformCallback, TransformOptions} from "stream";

export interface Base64EncodingStreamOptions {
    max_line_length?: number;
    line_separator?: string;
    input_encoding?: BufferEncoding;
    output_encoding?: BufferEncoding;
}

export class Base64EncodingStream extends Transform {
    // Instance Option variables.
    protected _max_line_length: number | null;
    protected _line_separator: string;
    // Instance Variables.
    protected _remainder: Buffer | null = null;
    protected _current_line_length: number = 0;

    /**
     * Constructs a new Base64 encoding stream.
     * @param options the options.
     * @param transform_options the stream options.
     */
    public constructor(options: Base64EncodingStreamOptions = {}, transform_options: TransformOptions = {}) {
        super(transform_options);

        // Sets the configuration variables.
        if (options.max_line_length && options.max_line_length < 1) {
            throw new Error('The line length MUST at least be 1!');
        }

        this._max_line_length = options.max_line_length ?? null
        this._line_separator = options.line_separator ?? '\r\n';

        // Sets the output and input encoding.
        this.setEncoding(options.output_encoding ?? 'utf-8');
        this.setDefaultEncoding(options.input_encoding ?? 'utf-8');
    }

    /**
     * Gets called when we need to create lines from the Base64 data.
     * @param base64 the base64 data.
     * @param end if this is the last data, if so add a newline anyway.
     */
    protected _base64_create_lines(base64: string, end: boolean = false): void{
        // If there is no max line length. just push the full base64 string.
        if (this._max_line_length === null) {
            this.push(Buffer.from(base64));
            return;
        }

        // Starts looping over the lines, and pushes them to the stream.
        let line_start: number = 0;
        while (true) {
            // Gets the length of the current line to create.
            let line_length: number = base64.length - line_start;
            if (line_length > this._max_line_length) {
                line_length = this._max_line_length;
            }

            // If the line length is zero, break.
            if (line_length === 0) {
                break;
            }

            // Creates, and pushes the line.
            let line: string = base64.substring(line_start, line_start + line_length);
            if (line_length === this._max_line_length || end) {
                line += '\r\n';
            }
            this.push(Buffer.from(line));

            // Adds the line length to the start index.
            line_start += line_length;
        }
    }

    /**
     * Handles a chunk while transforming.
     * @param chunk the chunk to encode.
     * @param encoding the encoding.
     * @param callback the callback.
     */
    public _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
        // If there is a remainder of the previous chunk, add it to the beginning, and
        //  remove the remainder.
        if (this._remainder) {
            chunk = Buffer.concat([ this._remainder, chunk ]);
            this._remainder = null;
        }

        // Gets the number of bytes we can read from the chunk, this just simply integer division by three
        //  since three bytes are four base64 chars, we get the remainder by simply getting the remainer LOL.
        const n: number = Math.floor(chunk.length / 3);
        const rem_n: number = chunk.length % 3;

        // If there is a remainder store it, and remove the remainder from the current chunk.
        if (rem_n > 0) {
            this._remainder = chunk.slice(chunk.length - rem_n, chunk.length);
            chunk = chunk.slice(0, chunk.length - rem_n);
        }

        // Encodes the current chunk to base64, and stores it in a string, I know it might look faster if we'd do this
        //  ourselves and add it to the buffer immediately, but this is JS, so it actually might take longer than using
        //  the native code this calls ;(.
        const encoded: string = chunk.toString('base64');

        // Encodes the data to lines.
        this._base64_create_lines(encoded);

        // Calls the callback.
        callback();
    }

    /**
     * Gets called at the stream end, and writes the final bytes.
     * @param callback the callback to call.
     */
    public _flush(callback: TransformCallback): void {
        // Checks if there is a remaining part.
        if (this._remainder !== null) {
            // Encodes the remaining part, and sets it to null.
            const encoded: string = this._remainder.toString('base64');
            this._remainder = null;

            // Encodes the data to lines.
            this._base64_create_lines(encoded);
        }

        // Calls the callback.
        callback();
    }
}