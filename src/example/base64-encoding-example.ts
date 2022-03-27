import {Base64EncodingStream} from "../encoding/base64-encoding-stream";

let stream = new Base64EncodingStream({
    max_line_length: 40
});
stream.pipe(process.stdout)
stream.write('hello worldaaaas asd as dhash diaush iudhasiu dhasu duihas uidhauis hdasuhduiashduiahdsuihsau hduiah sduh uss', 'utf-8');
stream.on('end', console.log)
stream.end()

console.log('')

stream = new Base64EncodingStream({});
stream.pipe(process.stdout)
stream.write('hello worldaaaas asd as dhash diaush iudhasiu dhasu duihas uidhauis hdasuhduiashduiahdsuihsau hduiah sduh u', 'utf-8');
stream.on('end', console.log)
stream.end()