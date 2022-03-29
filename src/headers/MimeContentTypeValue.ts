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

import { MimeContentType } from "./MimeContentType";
import { MimeMappedHeaderValue } from "./MimeMappedHeaderValue";

export class MimeContentTypeValue extends MimeMappedHeaderValue {
  /**
   * Constructs a new MimeContentTypeValue.
   * @param type
   */
  public constructor(public type: MimeContentType | string | null = null) {
    super();
  }

  public set charset(charset: string) {
    this.set('charset', charset);
  }

  public get charset() {
    return this.get_throw('charset');
  }

  /**
   * Decodes the given raw string or strings to a mime content type value.
   * @param raw the raw string or strings.
   * @return the parsed header value.
   */
  public static decode(raw: string | string[]): MimeContentTypeValue {
    // If the type of raw is a string, split it at ';'s.
    if (typeof raw === "string") {
      raw = raw.split(";");
    }

    // Constructs the result.
    let result: MimeContentTypeValue = new MimeContentTypeValue();

    // Parses the values.
    result.type = raw.shift()!.trim();
    super._decode_map(raw, result);

    // Returns the result.
    return result;
  }

  /**
   * Encodes the current content type header.
   * @return the encoded header.
   */
  public encode(): string {
    let arr: string[] = [];

    // Pushes the type.
    arr.push(this.type!);

    // Adds the other elements.
    arr = arr.concat(super.encode_as_array());

    // Returns the joined array.
    return arr.join("; ");
  }
}
