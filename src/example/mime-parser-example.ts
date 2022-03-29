import { MimeContentType } from "../headers/mime-content-type";
import { mime_compose, MimeComposer } from "../mime-composer";
import { MimeEmailValue } from "../headers/mime-email-value";
import { MimeDateValue } from "../headers/mime-date-value";
import {Readable} from "stream";

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
composer.date = new MimeDateValue();
composer.x_mailer = 'LukeMail';

composer.add_buffer_attachment('asd', MimeContentType.ApplicationOctetStream, Buffer.from('<h1>neger</h1>'));
composer.add_file_attachment('eml/test.txt', MimeContentType.ApplicationOctetStream);
composer.add_file_attachment('eml/test2.csv');

composer.add_text_section(MimeContentType.TextPlain, `Hello world
my name is Luke,

this is a test message.`);

composer.add_text_section(MimeContentType.TextHTML, `<p>Hello world</p>
<h1>my name is Luke,</h1>
<br />
<p>this is a test message.</p>`);

let a =mime_compose(composer, false);
a.pipe(process.stdout);
a.on('end', () => console.log('end'))
