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
import {
  mime_content_type_from_file_extension,
  MimeContentType,
  PLAIN_TEXT_MIME_CONTENT_TYPES,
} from "./headers/MimeContentType";
import {MimeHeaders} from "./MimeHeaders";
import path from "path";
import {MimeEmailValue} from "./headers/MimeEmailValue";
import {MimeDateValue} from "./headers/MimeDateValue";
import {MimeContentTypeValue} from "./headers/MimeContentTypeValue";

export class MimeComposerSection {
  public constructor(public type: MimeContentType) {}
}

export class MimeComposerBufferSection extends MimeComposerSection {
  public constructor(type: MimeContentType, public buffer: Buffer) {
    super(type);
  }
}

export class MimeComposerPugSection extends MimeComposerSection {
  public constructor(
    type: MimeContentType,
    public compile_template: pug.compileTemplate,
    public locals: { [key: string]: any }
  ) {
    super(type);
  }
}

export class MimeComposerAttachment {
  public constructor(public type: MimeContentType, public file_name: string) {}
}

export class MimeComposerFileAttachment extends MimeComposerAttachment {
  public constructor(
    type: MimeContentType,
    file_name: string,
    public path: string
  ) {
    super(type, file_name);
  }

  /**
   * Creates a new mime composer file attachment from an file.
   * @param file_path the file path.
   * @param type the type (optional, auto detect).
   */
  public static from_file(
    file_path: string,
    type: MimeContentType | null = null
  ): MimeComposerFileAttachment {
    // If there is no type yet, get it from the file extension.
    if (type === null) {
      const extension: string = path.extname(file_path);

      // Gets the type from the extension, and if there is none throw an error
      //  because te file format is not supported.
      type = mime_content_type_from_file_extension(extension);
      if (type === null) {
        throw new Error(
          `File extension ${extension} is not (yet) supported, if required modify and make a pull req.`
        );
      }
    }

    // Returns the result.
    const file_name: string = path.basename(file_path);
    return new MimeComposerFileAttachment(type, file_name, file_path);
  }
}

export class MimeComposerBufferAttachment extends MimeComposerAttachment {
  public constructor(
    type: MimeContentType,
    file_name: string,
    public buffer: Buffer
  ) {
    super(type, file_name);
  }
}

export class MimeComposition {
  protected _headers: MimeHeaders = new MimeHeaders();
  protected _attachments: MimeComposerAttachment[] = [];
  protected _sections: MimeComposerSection[] = [];

  public readonly boundary: string;
  public readonly message_id: string;

  public constructor(domain: string) {
    // Gets the boundary and message id.
    this.boundary = MimeComposition.generate_boundary();
    this.message_id = MimeComposition.generate_message_id(domain);

    // Sets the content type.
    let content_type: MimeContentTypeValue = new MimeContentTypeValue(
      MimeContentType.MultipartMixed
    );
    content_type.set("boundary", this.boundary);
    this._headers.set("content-type", content_type.encode());

    // Sets the message id.
    this._headers.set(
      "message-id",
      new MimeEmailValue([{ name: null, address: this.message_id }]).encode()
    );
  }

  public get headers(): MimeHeaders {
    return this._headers;
  }

  public get sections(): MimeComposerSection[] {
    return this._sections;
  }

  public get attachments(): MimeComposerAttachment[] {
    return this._attachments;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Add Headers
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Sets the subject.
   * @param subject the subject.
   */
  public set subject(subject: string) {
    this._headers.set("subject", subject);
  }

  /**
   * Sets the from header.
   * @param from the from.
   */
  public set from(from: MimeEmailValue | string) {
    if (typeof from === "string") {
      this._headers.set("from", from);
      return;
    }

    if (from.length !== 1) {
      throw new Error("From must have 1 email address, not more.");
    }

    this._headers.set("from", from.encode());
  }

  /**
   * Sets the to header.
   * @param to the to.
   */
  public set to(to: MimeEmailValue | string) {
    if (typeof to === "string") {
      this._headers.set("to", to);
      return;
    }

    if (to.length < 1) {
      throw new Error("To must have at least 1 email address.");
    }

    this._headers.set("to", to.encode());
  }

  /**
   * Sets the date header.
   * @param date the date.
   */
  public set date(date: MimeDateValue | string) {
    if (typeof date === "string") {
      this._headers.set("date", date);
      return;
    }

    this._headers.set("date", date.encode());
  }

  /**
   * Sets the mailer.
   * @param mailer
   */
  public set x_mailer(mailer: string) {
    this._headers.set("x-mailer", mailer);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Add Sections
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Adds a new pug rendered section.
   * @param type the type.
   * @param compile_template the template.
   * @param locals the locals for rendering the template.
   */
  public add_pug_section(
    type: MimeContentType,
    compile_template: pug.compileTemplate,
    locals: { [key: string]: any }
  ): void {
    this._sections.push(
      new MimeComposerPugSection(type, compile_template, locals)
    );
  }

  /**
   * Adds a new text section to the composer.
   * @param type the type.
   * @param data the data.
   */
  public add_text_section(type: MimeContentType, data: Buffer | string): void {
    // Turns the string into a buffer, if needed.
    if (typeof data === "string") {
      data = Buffer.from(data, "utf-8");
    }

    // Creates the section.
    this._sections.push(new MimeComposerBufferSection(type, data));
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Add Attachment
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Adds a new file attachment.
   * @param file_path the path of the file.
   * @param type the (optional, auto detect) file type.
   */
  public add_file_attachment(
    file_path: string,
    type: MimeContentType | null = null
  ): void {
    this._attachments.push(
      MimeComposerFileAttachment.from_file(file_path, type)
    );
  }

  /**
   * Adds a new buffer file attachment.
   * @param file_name the file name.
   * @param type the data type.
   * @param buffer the data.
   */
  public add_buffer_attachment(
    file_name: string,
    type: MimeContentType,
    buffer: Buffer
  ): void {
    // Creates the section.
    this._attachments.push(
      new MimeComposerBufferAttachment(type, file_name, buffer)
    );
  }

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
    let result: string = "Ffeir";

    // Generates the specified number of random chars and adds them to the result.
    for (let i = 0; i < boundary_length; ++i) {
      const random_index: number = Math.floor(
        Math.random() * this._GENERATE_BOUNDARY__DICT.length
      );
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
    random_length: number = 40
  ): string {
    // Initializes the result.
    let result: string = "";

    // Generates the specified number of random chars and adds them to the result.
    for (let i = 0; i < random_length; ++i) {
      const random_index: number = Math.floor(
        Math.random() * this._GENERATE_BOUNDARY__DICT.length
      );
      result += this._GENERATE_BOUNDARY__DICT[random_index];
    }

    // Adds the domain to the result.
    result += "@";
    result += domain;

    // Returns the reuslt.
    return result;
  }
}
