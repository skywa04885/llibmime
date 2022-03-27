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

export class MimeMappedHeaderValue {
  protected _map: { [key: string]: string } = {};

  /**
   * Gets a value from the map.
   * @param key the key.
   * @param standardized if the key is already standardized.
   */
  public get(key: string, standardized: boolean = false): string | null {
    // Standardizes the key.
    if (!standardized) {
      key = key.trim().toLowerCase();
    }

    // Returns the result.
    return this._map[key] ?? null;
  }

  /**
   * Puts a key/ value pair into the map.
   * @param key the key.
   * @param value the value.
   * @param standardized if the key is already standardized.
   */
  public set(key: string, value: string, standardized: boolean = false): void {
    // Standardizes the key.
    if (!standardized) {
      key = key.trim().toLowerCase();
    }

    // Removes the start quote.
    let start: number = 0;
    if (value.startsWith('"')) {
      start += 1;
    }

    // Removes the end quote.
    let end: number = value.length;
    if (value.endsWith('"')) {
      end -= 1;
    }

    // Sets the value with a possible quote removal.
    this._map[key] = value.substring(start, end);
  }

  /**
   * Gets a number value.
   * @param key the key for the value.
   */
  public get_number(key: string): number | null {
    const str: string | null = this._map[key];
    if (str === null) {
      return null;
    }

    return parseInt(str);
  }

  /**
   * Decodes the given string or strings, into a key/ value map.
   * @param raw the raw string/ string array.
   * @param result the result map to put the data into.
   */
  protected static _decode_map(
    raw: string | string[],
    result: MimeMappedHeaderValue
  ) {
    // If the type of raw is a string, split it at ';'s.
    if (typeof raw === "string") {
      raw = raw.split(";");
    }

    // Loops over all the pairs, and gets the key/ values.
    raw.forEach((pair: string): void => {
      // Trims the pair.
      pair = pair.trim();

      // Makes sure there is a separator.
      const index: number = pair.indexOf("=");
      if (index === -1) {
        throw new Error("Invalid pair in mime content type.");
      }

      // Inserts the key/ value pair.
      result.set(pair.substring(0, index), pair.substring(index + 1));
    });
  }
}
