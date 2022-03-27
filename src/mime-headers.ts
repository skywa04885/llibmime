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

//////////////////////////////////////////////////////////////////////////////////////
// Constants
//////////////////////////////////////////////////////////////////////////////////////

export const MIME_HEADER_KEY_REGEXP: RegExp = /^([a-zA-Z_]+[a-zA-Z0-9_\-]+)$/;
export const MIME_HEADER_NON_ASCII_ENCODED_REGEXP: RegExp = /=\?[a-zA-Z0-9_\-]+\?[a-zA-Z]\?[^\?]*\?=/g;
export const MIME_HEADER_SEPARATOR: string = ": ";

//////////////////////////////////////////////////////////////////////////////////////
// Header Encoder
//////////////////////////////////////////////////////////////////////////////////////

export interface MimeHeaderEncodeOptions {
  max_line_length?: number;
  add_newline?: boolean;
  utf8_support?: boolean; // If not UTF8 support, stick to ASCII.
  first_level_wsp_count?: number;
  second_Level_wsp_count?: number;
}

/**
 * Encodes the mime header with the given key and value.
 * @param key the key.
 * @param value the value.
 * @param options the options.
 * @return string the encoded header.
 */
export function mime_header_encode(
  key: string,
  value: string,
  options: MimeHeaderEncodeOptions = {}
): string {
  // Makes sure the key is valid.
  if (!key.match(MIME_HEADER_KEY_REGEXP)) {
    throw new Error("Invalid key.");
  }

  // Gets the default options.
  const max_line_length: number = options.max_line_length ?? 78;
  const add_newline: boolean = options.add_newline ?? true;
  const first_level_wsp_count: number = options.first_level_wsp_count ?? 8;
  const second_level_wsp_count: number = options.second_Level_wsp_count ?? 9;

  // If there is a max line length, make sure the key fits.
  if (
    max_line_length &&
    key.length + MIME_HEADER_SEPARATOR.length > max_line_length
  ) {
    throw new Error("Key is too large to fit in a single line, key must");
  }

  // Initializes some state variables.
  let lines: string[] = [];
  let line: string = `${key}: `;
  let line_empty: boolean = false; // If the line is empty (excluding initial added whitespace).

  // Creates the function for a new line, with second level folding.
  function new_line(wsp_count: number) {
    // Adds the line to the lines.
    lines.push(line);

    // Creates a new line with a two WSP chars, and updates the length.
    line = " ".repeat(wsp_count);

    // Sets the line empty to true.
    line_empty = true;
  }

  // Adds an segment to the current line.
  function add_line_segment(segment: string) {
    // Adds the data segment to the line.
    line += segment;

    // Sets the line empty to false.
    line_empty = false;
  }

  // Starts wrapping the segments.
  const segments: string[] = value.split(" ");
  segments.forEach((segment: string, index: number): void => {
    // Gets the number of remaining chars in the line.
    const line_remaining: number = max_line_length - line.length;

    ////////////////////////////////////////////////////////////
    // The segment fits in the remaining space.
    ////////////////////////////////////////////////////////////

    if (segment.length + 1 <= line_remaining) {
      // Checks if the line is not empty (if it is not the first segment in line)
      //  if so add whitespace in front of it.
      if (!line_empty && index !== 0) {
        line += " ";
      }

      // Adds the segment to the line, and increments the size of the line.
      add_line_segment(segment);

      // Checks if the line is full, if so create a new one.
      if (line.length === max_line_length) {
        new_line(first_level_wsp_count);
      }

      return;
    }

    ////////////////////////////////////////////////////////////
    // The segment fits in the remaining space.
    ////////////////////////////////////////////////////////////

    if (segment.length <= max_line_length - first_level_wsp_count) {
      // Creates the new line.
      new_line(first_level_wsp_count);

      // Adds the segment to the line.
      add_line_segment(segment);

      // Checks if the line is full, if so create a new one.
      if (line.length === max_line_length) {
        new_line(first_level_wsp_count);
      }

      return;
    }

    ////////////////////////////////////////////////////////////
    // The segment needs to be put in a second level wrap.
    ////////////////////////////////////////////////////////////

    // If the current line is not empty, create a new line. We want to put this on a new first level line
    //  so that we can find both levels in the future.
    if (!line_empty) {
      new_line(first_level_wsp_count);
    }

    // Starts wrapping the second level data.
    let segment_start: number = 0;
    while (true) {
      // Gets the remaining length in the line.
      const line_remaining: number = max_line_length - line.length;

      // Calculates the end of the segment we're going to add.
      let segment_length: number = segment.length - segment_start;
      if (segment_length > line_remaining) {
        segment_length = line_remaining;
      }

      // Adds the segment to the line, and creates the new second level line.
      add_line_segment(
        segment.substring(segment_start, segment_start + segment_length)
      );

      // Sets the segment start to the current end.
      segment_start += segment_length;

      // Adds the newline, and if the last break.
      if (segment_start === segment.length) {
        if (index + 1 < segments.length) {
          new_line(first_level_wsp_count);
        }
        break;
      }

      new_line(second_level_wsp_count);
    }
  });

  // Checks if there still is something in the new line,
  //  if so create the line.
  if (line.length !== 0) {
    lines.push(line); // We don't care about resetting stuff.
  }

  // Creates the result.
  let result: string = lines.join("\r\n");

  // Checks if we need to add a newline.
  if (add_newline) {
    result += "\r\n";
  }

  return result;
}

//////////////////////////////////////////////////////////////////////////////////////
// Header Decoder
//////////////////////////////////////////////////////////////////////////////////////

/*
  Holy fuck this is a complex thing to do!
*/

/**
 * Decodes the given header into a key/value pair.
 * @param raw the raw header.
 * @return the key, value in a string.
 */
export function mime_header_decode(raw: string): string[] {
  const lines: string[] = raw.split(/\r?\n/);

  // Gets the widths of all the whitespace in each line.
  const lines_whitespace_widths: number[] = lines
    .slice(1)
    .map((line: string): number => {
      let match: RegExpMatchArray | null = line.match(/^\s+/);
      return match ? match[0].length : 0;
    });

  // Maps the widths with their occurence count.
  const widths: { [key: number]: number } = {};
  lines_whitespace_widths.forEach((width: number) => {
    if (!widths[width]) {
      widths[width] = 1;
      return;
    }

    ++widths[width];
  });

  // Gets the number of unique widths.
  const number_of_unique_widths: number = Object.keys(widths).length;
  if (number_of_unique_widths > 2) {
    throw new Error(
      `Header folding may only have two levels, we've got: ${number_of_unique_widths}`
    );
  }

  // Creates the result string.
  let result: string;

  // Checks if we're dealing with a single line header.
  if (number_of_unique_widths === 0) {
    result = raw;
  }

  // Checks if we're dealing with a second level header fold.
  if (number_of_unique_widths === 2) {
    // Gets the first and second level widths.
    const second_level_width: number = Math.max(
      ...Object.keys(widths).map((width) => parseInt(width))
    );

    // Joins the second level folds.
    for (let i = lines.length - 1; i > 0; --i) {
      if (lines_whitespace_widths[i - 1] === second_level_width) {
        lines[i - 1] += lines[i].substring(second_level_width);
        lines.splice(i, 1);
      }
    }
  }

  // Checks if we're dealing with a first level header fold.
  if (number_of_unique_widths === 1 || number_of_unique_widths === 2) {
    // Removes the whitespace.
    result = lines.map((line: string) => line.replace(/^\s+/, "")).join(" ");
  }

  // Gets the split index.
  const index: number = result!.indexOf(":");
  if (index === -1) {
    throw new Error(`Missing ':' separator, '${result!}'`);
  }

  // Gets the key, value pair.
  const key: string = result!.substring(0, index).trim();
  const value: string = result!.substring(index + 1).trim();

  // Returns the result.
  return [key, value];
}

//////////////////////////////////////////////////////////////////////////////////////
// Headers
//////////////////////////////////////////////////////////////////////////////////////

export class MimeHeaders {
  protected _map: { [key: string]: string } = {};

  /**
   * Sets a header.
   * @param key the key (will be transformed to lower case).
   * @param value the value.
   * @param lower disables lowercase transform, better for performance.
   */
  public set(key: string, value: string, lower: boolean = true): void {
    if (lower) {
      key = key.toLowerCase();
    }

    this._map[key] = value;
  }

  /**
   * Gets a header.
   * @param key the key.
   * @param lower disables lowercase transform, better for performance.
   */
  public get(key: string, lower: boolean = true): string | null {
    if (lower) {
      key = key.toLowerCase();
    }

    return this._map[key] ?? null;
  }

  /**
   * Gets all the header key/ value pairs.
   */
  public *pairs(): Generator<string[]> {
    for (const pair of Object.entries(this._map)) {
      yield pair;
    }
  }

  /**
   * Encodes the headers.
   * @param options the header encode options
   * @return the encoded headers.
   */
  public encode(options: MimeHeaderEncodeOptions = {}): string {
    return Object.entries(this._map)
      .map(([key, value]: string[]) => {
        return mime_header_encode(key, value, options);
      })
      .join("");
  }

  /**
   * Decodes the given headers.
   * @param raw the raw headers.
   */
  public static decode(raw: string): MimeHeaders {
    // Gets all the lines.
    const lines: string[] = raw.split(/\r?\n/);

    // Checks if the last line is empty (may be or may not), if so pop it off.
    if (lines[lines.length - 1].trim().length === 0) {
      lines.pop();
    }

    // Joins the header lines.
    for (let i = lines.length - 1; i >= 0; --i) {
      if (lines[i].match(/^\s+/)) {
        lines[i - 1] += `\r\n${lines[i]}`;
        lines.splice(i, 1);
      }
    }

    // Creates the mime headers structure, and parses all the headers
    //  and sets them in the structure.
    const mime_headers: MimeHeaders = new MimeHeaders();
    lines.forEach((line: string) => {
      const [key, value] = mime_header_decode(line);
      mime_headers.set(key, value);
    });
    return mime_headers;
  }
}
