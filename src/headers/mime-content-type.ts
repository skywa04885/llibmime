export enum MimeContentType {
    TextPlain = 'text/plain',
    TextHTML = 'text/html',
    TextCSV = 'text/csv',
    MultipartAlternative = 'multipart/alternative',
    MultipartMixed = 'multipart/mixed',
    ApplicationOctetStream = 'application/octet-stream',
    ApplicationPDF = 'application/pdf',
    ImagePNG = 'image/png',
    ImageJPEG = 'image/jpeg',
    ImageGIF = 'image/gif',
    ApplicationMsWord = 'application/msword',
    AudioMPEG = 'audio/mpeg',
    ApplicationXTar = 'application/x-tar',
    ApplicationZIP = 'application/zip',
    Application7Z = 'application/x-7z-compressed',
    ApplicationGZIP = 'application/gzip',
}

const MIME_CONTENT_TYPE_FROM_FILE_EXTENSION_MAP: {[key: string]: MimeContentType} = {
    'txt': MimeContentType.TextPlain,
    'html': MimeContentType.TextHTML,
    'htm': MimeContentType.TextHTML,
    'bin': MimeContentType.ApplicationOctetStream,
    'pdf': MimeContentType.ApplicationPDF,
    'png': MimeContentType.ImagePNG,
    'jpeg': MimeContentType.ImageJPEG,
    'jpg': MimeContentType.ImageJPEG,
    'doc': MimeContentType.ApplicationMsWord,
    'csv': MimeContentType.TextCSV,
    'mp3': MimeContentType.AudioMPEG,
    'tar': MimeContentType.ApplicationXTar,
    'zip': MimeContentType.ApplicationZIP,
    '7z': MimeContentType.Application7Z,
    'gif': MimeContentType.ImageGIF,
    'gz': MimeContentType.ApplicationGZIP,
}

/**
 * Gets the mime content type from the given file extension.
 * @param extension the extension.
 */
export function mime_content_type_from_file_extension(extension: string): MimeContentType | null {

    // Strips the dot of the extension (if there).
    if (extension.startsWith('.')) {
        extension = extension.substring(1);
    }

    // Makes the extension lower case.
    extension = extension.toLowerCase();

    // Gets the content type.
    return MIME_CONTENT_TYPE_FROM_FILE_EXTENSION_MAP[extension] ?? null;
}