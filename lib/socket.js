"use strict";

const Promise = require("bluebird");
const net = Promise.promisifyAll(require("net"));
const fs = Promise.promisifyAll(require("fs"));
var unix = require('unix-dgram');
const EventEmitter = require('events');

const emitter = new EventEmitter();
function Socket(path) {
 


  const server = unix.createSocket('unix_dgram', function (buf) {
    // conver to hex
    // console.log(buf.toString('hex'));
    // // console.log(
    emitter.emit('data', buf);
  });
  server.bind(path);
  fs.chmodAsync(path, 0o777)
  // return fs.statAsync(path)
  //   .then(cleanup.bind(this, path))
  //   .catch( err => {
  //     if (err.code == "ENOENT") {
  //       return;
  //     } else {
  //       throw err;
  //     }
  //   })
  //   .then(() => listen(server, path))
  //   .then(() => fs.chmodAsync(path, 0o777))
  //   .then(() => server);
  emitter.server = server;

  return emitter;
}

function listen(server, path) {
  return new Promise((resolve, reject) => {
    server.once("error", err => {
      reject(err);
    });
    // server.listen(path, resolve);
    server.bind(path, resolve);
  });
}

function cleanup(path) {
  return new Promise((resolve, reject) => {
    let client = new net.Socket();
    client.once("error", e => {
      if (e.code == "ENOTSOCK" || e.code == "ECONNREFUSED") {
        resolve(fs.unlinkAsync(path));
      } else {
        reject(e);
      }
    });
    client.once("connect", () => {
      client.end();
      reject(new Error("Path in use"));
    });
    client.connect({ path });
  });
}

function convertBufferToSigned(buffer) {
  const signedBuffer = Buffer.alloc(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    const unsignedByte = buffer.readUInt8(i);
    const signedByte = unsignedByte < 128 ? unsignedByte : unsignedByte - 256;
    signedBuffer.writeInt8(signedByte, i);
  }
  return signedBuffer;
}



module.exports = Socket;
