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

import { MimeMappedHeaderValue } from "./MimeMappedHeaderValue";
import {MimeContentDispositionType} from "./MimeContentDispositionType";

export class MimeContentDispositionValue extends MimeMappedHeaderValue {
  /**
   * Constructs a new MimeContentTypeValue.
   * @param type
   */
  public constructor(public type: MimeContentDispositionType | string | null = null) {
    super();
  }

  public set filename(filename: string) {
    this.set('filename', filename);
  }

  public get filename() {
    return this.get_throw('filename');
  }

  public set creation_date(date: Date) {
    this.set('creation-date', date.toUTCString());
  }

  public get creation_date() {
    return new Date(this.get_throw('creation-date'));
  }

  public set modification_date(date: Date) {
    this.set('modification-date', date.toUTCString());
  }

  public get modification_date() {
    return new Date(this.get_throw('modification-date'));
  }

  public set read_date(date: Date) {
    this.set('read-date', date.toUTCString());
  }

  public get read_date() {
    return new Date(this.get_throw('read-date'));
  }

  public set size(size: number) {
    this.set('size', size.toString());
  }

  public get size() {
    return parseInt(this.get_throw('size'));
  }

  /**
   * Decodes the given raw string or strings to a mime content disposition value.
   * @param raw the raw string or strings.
   * @return the parsed header value.
   */
  public static decode(raw: string | string[]): MimeContentDispositionValue {
    // If the type of raw is a string, split it at ';'s.
    if (typeof raw === "string") {
      raw = raw.split(";");
    }

    // Constructs the result.
    let result: MimeContentDispositionValue = new MimeContentDispositionValue();

    // Parses the values.
    result.type = raw.shift()!.trim();
    super._decode_map(raw, result);

    // Returns the result.
    return result;
  }

  /**
   * Encodes the current content disposition header.
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
