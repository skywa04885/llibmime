import {mime_header_encode, MimeHeaders} from "../mime-headers";
import {Readable} from "stream";
import * as fs from "fs";

let contents = fs.readFileSync('./eml/original_msg_headers.eml').toString('utf-8');

console.log(MimeHeaders.decode(contents))
