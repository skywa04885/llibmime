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

export interface MimeEmail {
  name: string | null;
  address: string;
}

export class MimeEmailValue {
  public constructor(public emails: MimeEmail[]) {}

  public get length(): number {
    return this.emails.length;
  }

  /**
   * Encodes the emails.
   */
  public encode(): string {
    let arr: string[] = [];

    for (const email of this.emails) {
      // If there is no name, or it is empty, just push the address only.
      if (!email.name || email.name.length === 0) {
        arr.push(`<${email.address}>`);
        continue;
      }

      // Checks if we need to add quotes to the name.
      if (/^[a-zA-Z_\-.\d\s]+$/.test(email.name)) {
        arr.push(`"${email.name.replace('"', '\\"')}" <${email.address}>`);
      }

      // Pushes the name with address, without quoting them.
      arr.push(`${email.name} <${email.address}>`);
    }

    return arr.join(", ");
  }
}
