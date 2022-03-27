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
import {Base64EncodingStreamOptions} from "./base64-encoding-stream";

export interface SmtpEncodingStreamOptions {
    line_separator?: string;
    input_encoding?: BufferEncoding;
    output_encoding?: BufferEncoding;
}

export class SmtpEncodingStream extends Transform {
    // Instance Option variables.
    protected _line_separator: string;

    /**
     * Constructs a new SMTP encoding stream.
     * @param options the options.
     * @param transform_options the stream options.
     */
    public constructor(options: Base64EncodingStreamOptions = {}, transform_options: TransformOptions = {}) {
        super(transform_options);

        // Sets the configuration variables.
        this._line_separator = options.line_separator ?? '\r\n';

        // Sets the output and input encoding.
        this.setEncoding(options.output_encoding ?? 'utf-8');
        this.setDefaultEncoding(options.input_encoding ?? 'utf-8');
    }

    /**
     * Handles a chunk while transforming.
     * @param chunk the chunk to encode.
     * @param encoding the encoding.
     * @param callback the callback.
     */
    public _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback) {

    }
}