import { MimeContentType } from "../headers/mime-content-type";
import {MimeComposer, MimeComposerReadable} from "../mime-composer";
import { MimeEmailValue } from "../headers/mime-email-value";

const data = `Test 123\r
Another test line\r
this\r
works\r
pretty\r
sweet`;

const composer = new MimeComposer('localhost.local');
composer.subject = "Hello World";
composer.from = new MimeEmailValue([
  { name: null, address: "webmaster@fannst.nl" },
]);
composer.to = new MimeEmailValue([
  { name: "Luke Rieff", address: "luke.rieff@mgail.com" },
  { name: "Sem Rieff", address: "sem.rieff@mgail.com" },
]);

composer.add_file_attachment('eml/test.txt');
composer.add_file_attachment('eml/test2.csv');

composer.add_text_section(MimeContentType.TextPlain, `Hello world
my name is Luke,

this is a test message.`);

composer.add_text_section(MimeContentType.TextHTML, `<p>Hello world</p>
<h1>my name is Luke,</h1>
<br />
<p>this is a test message.</p>`);

console.log(composer)
const readable = new MimeComposerReadable(composer);
readable.pipe(process.stdout);

// const parser: MimeDecoder = new MimeDecoder();
//
// fs.createReadStream('./eml/original_msg.eml', {
//     highWaterMark: 1000
// }).pipe(parser);
