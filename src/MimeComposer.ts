import { MimeContentDispositionValue } from "./headers/MimeContentDispositionValue";
import { MimeContentDispositionType } from "./headers/MimeContentDispositionType";
import fs from "fs";
import util from "util";
import {
  MimeContentType,
  PLAIN_TEXT_MIME_CONTENT_TYPES,
} from "./headers/MimeContentType";
import { MimeContentTransferEncoding } from "./headers/MimeContentTransferEncoding";
import { mime_header_encode, MimeHeaders } from "./MimeHeaders";
import { Readable } from "stream";
import {
  MimeComposerAttachment,
  MimeComposerBufferAttachment,
  MimeComposerBufferSection,
  MimeComposerFileAttachment,
  MimeComposerPugSection,
  MimeComposition,
} from "./MimeComposition";
import {
  Base64EncoderStream,
  QuotedPrintableEncodeStream,
} from "llibencoding";
import { MimeContentTypeValue } from "./headers/MimeContentTypeValue";

/**
 * Generates the content disposition header value for the given attachment.
 * @param attachment the attachment.
 * @return the generated content disposition header.
 */
async function content_disposition_value_from_attachment(
  attachment: MimeComposerAttachment
): Promise<MimeContentDispositionValue> {
  let content_disposition_value: MimeContentDispositionValue =
    new MimeContentDispositionValue(MimeContentDispositionType.Attachment);
  content_disposition_value.filename = attachment.file_name;

  if (attachment instanceof MimeComposerBufferAttachment) {
    content_disposition_value.size = attachment.buffer.length;
    content_disposition_value.creation_date = new Date();
    content_disposition_value.modification_date = new Date();
    content_disposition_value.read_date = new Date();
  } else if (attachment instanceof MimeComposerFileAttachment) {
    const stat: fs.Stats = await util.promisify(fs.stat)(attachment.path);
    content_disposition_value.size = stat.size;
    content_disposition_value.creation_date = stat.ctime;
    content_disposition_value.modification_date = stat.mtime;
    content_disposition_value.read_date = new Date(); // Now obviously.
  }

  return content_disposition_value;
}

/**
 * Gets the transfer encoding for the given type.
 * @param type the type.
 * @param utf8_support if the SMTP server supports UTF8 messages.
 * @protected
 */
function get_transfer_encoding_for_type(
  type: MimeContentType,
  utf8_support: boolean
): MimeContentTransferEncoding {
  // Checks if we don't have UTF-8 support, if so we will perform some
  //  encoding of the chars.
  if (!utf8_support) {
    // If plain text, just do quoted printable, the easiest one.
    if (PLAIN_TEXT_MIME_CONTENT_TYPES.includes(type)) {
      return MimeContentTransferEncoding.QuotedPrintable;
    }

    // Since it's not plain text use Base64 encoding.
    return MimeContentTransferEncoding.Base64;
  }

  // Since we have UTF-8 support, check if we're dealing with text based types
  //  if so use text.
  if (PLAIN_TEXT_MIME_CONTENT_TYPES.includes(type)) {
    return MimeContentTransferEncoding._8Bit;
  }

  // We're not dealing with text, simply perform base64 encoding.
  return MimeContentTransferEncoding.Base64;
}

async function* mime_compose_generator(
  composition: MimeComposition,
  utf8_support: boolean,
  max_line_length: number = 76
) {
  // Generates the start and end boundaries.
  const boundary_start = Buffer.from(`\r\n--${composition.boundary}\r\n`);
  const boundary_end = Buffer.from(`\r\n--${composition.boundary}--\r\n`);

  /**
   * Local function that encodes headers.
   * @param headers the headers encoded.
   * @return the buffers of each header.
   */
  function* _write_headers(headers: MimeHeaders): Generator<Buffer> {
    for (const [key, value] of headers.pairs()) {
      const buffer: Buffer = Buffer.from(
        mime_header_encode(key, value, {
          max_line_length,
        })
      );
      yield buffer;
    }
  }

  /////////////////////////////////////////////////////////
  // [[ HEADERS ]]
  /////////////////////////////////////////////////////////

  // Writes the initial headers, of the root mime document.
  for (const buffer of _write_headers(composition.headers)) {
    yield buffer;
  }

  /////////////////////////////////////////////////////////
  // [[ ATTACHMENTS ]]
  /////////////////////////////////////////////////////////

  for (const attachment of composition.attachments) {
    // Writes the start.
    yield boundary_start;

    // Gets the content transfer encoding.
    const transfer_encoding: MimeContentTransferEncoding =
      get_transfer_encoding_for_type(attachment.type, utf8_support);

    // Creates the headers for the attachment.
    let attachment_headers: MimeHeaders = new MimeHeaders();
    attachment_headers.set("content-type", attachment.type);
    attachment_headers.set("content-transfer-encoding", transfer_encoding);
    attachment_headers.set(
      "content-disposition",
      (await content_disposition_value_from_attachment(attachment)).encode()
    );

    // Writes the headers of the attachment.
    for (const buffer of _write_headers(attachment_headers)) {
      yield buffer;
    }

    // Writes a newline to separate the header from the body.
    yield "\r\n";

    // Checks the type of the attachment, and creates the read stream.
    let read_stream: Readable;
    if (attachment instanceof MimeComposerBufferAttachment) {
      read_stream = Readable.from(attachment.buffer);
    } else if (attachment instanceof MimeComposerFileAttachment) {
      read_stream = fs.createReadStream(attachment.path, {});
    } else {
      throw new Error(
        "Cannot create read stream, not supported type of attachment."
      );
    }

    // Checks how to format the part.
    switch (transfer_encoding) {
      case MimeContentTransferEncoding.Base64: {
        // Creates the Base64 encoding stream.
        const base64_stream: Base64EncoderStream = new Base64EncoderStream({
          max_line_length,
          buffer_output: true,
        });

        // Reads all the chunks of the base64 stream.
        for await (const chunk of read_stream!.pipe(base64_stream)) {
          yield chunk;
        }

        // Breaks.
        break;
      }
      case MimeContentTransferEncoding.QuotedPrintable: {
        // Creates the quoted printable encoding stream.
        const quoted_printable_stream: QuotedPrintableEncodeStream =
          new QuotedPrintableEncodeStream({
            max_line_length,
          });

        // Reads all the chunks of the base64 stream.
        for await (const chunk of read_stream!.pipe(quoted_printable_stream)) {
          yield chunk;
        }

        // Breaks.
        break;
      }
    }
  }

  /////////////////////////////////////////////////////////
  // [[ SECTIONS ]]
  /////////////////////////////////////////////////////////

  // Writes the sections.
  for (const section of composition.sections) {
    yield boundary_start;

    let transfer_encoding: MimeContentTransferEncoding = utf8_support
      ? MimeContentTransferEncoding._8Bit
      : MimeContentTransferEncoding.QuotedPrintable;

    // Generates the section headers.
    let content_type_value: MimeContentTypeValue = new MimeContentTypeValue(
      section.type
    );
    content_type_value.set("charset", "utf-8");

    let section_headers: MimeHeaders = new MimeHeaders();
    section_headers.set("content-type", content_type_value.encode());
    section_headers.set("content-transfer-encoding", transfer_encoding);

    // Writes the headers.
    for (const buffer of _write_headers(section_headers)) {
      yield buffer;
    }

    // Checks the type of the section, and creates the read stream.
    let read_stream: Readable;
    if (section instanceof MimeComposerBufferSection) {
      read_stream = Readable.from(section.buffer);
    } else if (section instanceof MimeComposerPugSection) {
      read_stream = Readable.from(
        Buffer.from(section.compile_template(section.locals), "utf-8")
      );
    } else {
      throw new Error(
        "Cannot create read stream, not supported type of attachment."
      );
    }

    // Checks how to format the part.
    switch (transfer_encoding) {
      case MimeContentTransferEncoding._8Bit: {
        for await (const chunk of read_stream) {
          yield chunk;
        }

        break;
      }
      case MimeContentTransferEncoding.QuotedPrintable: {
        // Creates the quoted printable encoding stream.
        const quoted_printable_stream: QuotedPrintableEncodeStream =
          new QuotedPrintableEncodeStream({
            max_line_length,
          });

        // Reads all the chunks of the base64 stream.
        for await (const chunk of read_stream!.pipe(quoted_printable_stream)) {
          yield chunk;
        }

        // Breaks.
        break;
      }
    }
  }

  /////////////////////////////////////////////////////////
  // [[ END ]]
  /////////////////////////////////////////////////////////

  // Writes the final section end.
  yield boundary_end;
}

export function mime_compose(
  composer: MimeComposition,
  utf8_support: boolean
): Readable {
  return Readable.from(mime_compose_generator(composer, utf8_support));
}
