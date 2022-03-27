import { MimeContentType } from "../headers/mime-content-type";
import { MimeComposer } from "../mime-composer";
import { MimeContentTransferEncoding } from "../headers/mime-content-transfer-encoding";
import pug from "pug";

const data = `Test 123\r
Another test line\r
this\r
works\r
pretty\r
sweet`;

const composer = new MimeComposer();
composer.add_pug_section(MimeContentType.TextHTML, MimeContentTransferEncoding.QuotedPrintable, pug.compileFile('templates/test.pug'), {
    title: 'asd'
});
console.log(composer);
// const parser: MimeDecoder = new MimeDecoder();
//
// fs.createReadStream('./eml/original_msg.eml', {
//     highWaterMark: 1000
// }).pipe(parser);
