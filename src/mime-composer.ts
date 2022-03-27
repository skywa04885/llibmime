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

import pug from "pug";
import { MimeContentType } from "./headers/mime-content-type";
import { MimeHeaders } from "./mime-headers";
import { MimeContentTransferEncoding } from "./headers/mime-content-transfer-encoding";
import { Mime } from "./mime";

export class MimeComposerAttachment { }

export class MimeComposerFileAttachment extends MimeComposerAttachment {

}

export class MimeComposerBufferAttachment extends MimeComposerAttachment {

}

export class MimeComposer {
  protected _headers: MimeHeaders = new MimeHeaders();

  public constructor() {}


  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Add Pug
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Adds a new pug rendered section.
   * @param type the type.
   * @param transfer_Encoding the transfer encoding.
   * @param template the template.
   * @param locals the locals for rendering the template.
   */
  public add_pug_section(
    type: MimeContentType,
    transfer_Encoding: MimeContentTransferEncoding,
    template: pug.compileTemplate,
    locals: { [key: string]: any }
  ): void {
    this.add_text_section(type, transfer_Encoding, template(locals));
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Add Text
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  protected static readonly _ADD_TEXT_SECTION__ALLOWED_TYPES = [
    MimeContentType.TextPlain,
    MimeContentType.TextHTML,
  ];

  protected static readonly _ADD_TEXT_SECTION__ALLOWED_TRANSFER_ENCODINGS = [
    MimeContentTransferEncoding.Hex,
    MimeContentTransferEncoding.Base64,
    MimeContentTransferEncoding.QuotedPrintable,
    MimeContentTransferEncoding._8Bit,
    MimeContentTransferEncoding._7Bit,
  ];

  /**
   * Adds a new text section to the mime message.
   * @param type the type.
   * @param transfer_encoding the transfer encoding.
   * @param data the data.
   */
  public add_text_section(
    type: MimeContentType,
    transfer_encoding: MimeContentTransferEncoding,
    data: Buffer | string
  ) {
    // Checks if the types are allowed.
    if (!MimeComposer._ADD_TEXT_SECTION__ALLOWED_TYPES.includes(type)) {
      throw new Error(`Type ${type} is not valid for an text section!`);
    } else if (
      !MimeComposer._ADD_TEXT_SECTION__ALLOWED_TRANSFER_ENCODINGS.includes(
        transfer_encoding
      )
    ) {
      throw new Error(
        `Content transfer encoding ${transfer_encoding} is not valid for an text section!`
      );
    }

    // If the data is not a buffer yet, turn it into a buffer.
    if (typeof data === "string") {
      data = Buffer.from(data, "utf-8");
    }

    // Creates the headers.
    let headers: MimeHeaders = new MimeHeaders();
    headers.set("content-type", type);
    headers.set("content-transfer-encoding", transfer_encoding);

    // Creates the section.
    this._push_alternative_section(new Mime(headers, data));
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Add Attachment
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Generate Boundary
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  protected static readonly _GENERATE_BOUNDARY__DICT: string =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_";

  /**
   * Generates a random boundary string for a multipart mime message.
   * @param boundary_length the boundary length.
   */
  public static generate_boundary(boundary_length: number = 30) {
    // Initializes the result.
    let result: string = "";

    // Generates the specified number of random chars and adds them to the result.
    for (let i = 0; i < boundary_length; ++i) {
      const random_index: number =
        Math.random() * this._GENERATE_BOUNDARY__DICT.length;
      result += this._GENERATE_BOUNDARY__DICT[random_index];
    }

    // Returns the result.
    return result;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Generate Message ID
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  protected static readonly _GENERATE_MESSAGE_ID__DICT: string =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_";

  /**
   * Generates a random message id.
   * @param domain the domain.
   * @param random_length the random length.
   */
  public static generate_message_id(
    domain: string,
    random_length: number = 20
  ): string {
    // Initializes the result.
    let result: string = "";

    // Generates the specified number of random chars and adds them to the result.
    for (let i = 0; i < random_length; ++i) {
      const random_index: number =
        Math.random() * this._GENERATE_BOUNDARY__DICT.length;
      result += this._GENERATE_BOUNDARY__DICT[random_index];
    }

    // Adds the domain to the result.
    result += "@";
    result += domain;

    // Returns the reuslt.
    return result;
  }
}
