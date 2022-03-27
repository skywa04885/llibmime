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

import {MimeHeaders} from "./mime-headers";
import {Readable, ReadableOptions, Writable, WritableOptions} from "stream";
import {MimeContentTypeValue} from "./headers/mime-content-type-value";

export const MIME_PARSER_HEADER_END: string = '\r\n\r\n';

export class Mime {
    public constructor(public headers: MimeHeaders, public body: Buffer) { }
}

export class MimeMultipart extends Mime {
  public constructor(headers: MimeHeaders, body: Buffer, sections: Mime[] = []) {
    super(headers, body);
  }
}

export enum MimeParserState {
  Headers,
  Body,
  MultipartBody
}

export class MimeDecoder extends Writable {
  protected _state: MimeParserState = MimeParserState.Headers;
  protected _buffer: Buffer | null = null;
  protected _buffer_byte_offset: number = 0;

  protected _parsed_headers: MimeHeaders = new MimeHeaders();

  public constructor(writable_options: WritableOptions = {}) {
    super(writable_options);
  }

  protected _write_headers(): void {
    // Gets the end index of the headers, if not found set the byte offset (to prevent too long future search), and
    //  return.
    let end_index: number = this._buffer!.indexOf(MIME_PARSER_HEADER_END, this._buffer_byte_offset);
    if (end_index === -1) {
      if (this._buffer!.length > MIME_PARSER_HEADER_END.length) {
        this._buffer_byte_offset = this._buffer!.length - MIME_PARSER_HEADER_END.length;
      }

      return;
    }

    // Gets the header buffer slice.
    const header_buffer: Buffer = this._buffer!.slice(0, end_index);

    // Removes the headers and the end of them from the original buffer, and resets
    //  the byte offset.
    this._buffer = this._buffer!.slice(end_index + MIME_PARSER_HEADER_END.length);
    this._buffer_byte_offset = 0;

    // Encodes the headers to and string, and parses them.
    this._parsed_headers = MimeHeaders.decode(header_buffer.toString('utf-8'));

    // Loops over the headers and gets some useful info from them, and how to handle
    //  the next data in the buffer.
    let content_type_raw: string | null = this._parsed_headers.get('content-type');
    if (!content_type_raw) {
      throw new Error('Content type header is missing, this is required for parsing.')
    }

    // Changes the mode depending on the headers.
    this._state = MimeParserState.Body;
  }

  /**
   * Writes new data to the parser.
   * @param chunk the data chunk.
   * @param encoding the encoding.
   * @param callback when we're done processing.
   */
  public _write(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ) {
    // Adds the chunk to the internal buffer.
    this._buffer = this._buffer === null ? chunk : Buffer.concat([ this._buffer, chunk ]);

    switch (this._state) {
      case MimeParserState.Headers:
        this._write_headers();
        break;
    }

    callback(null);
  }
}

export class MimeEncoder extends Readable {
  public constructor(readable_options: ReadableOptions, public readonly mime: Mime) {
    super(readable_options);
  }


}