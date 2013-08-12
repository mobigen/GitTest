var buf = new Buffer(256);
var len =  buf.write('abcde',4,'utf8');
console.log("길이 : "+len);
console.log(buf.toString('utf8',0,len));
