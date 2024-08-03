"use strict";

function Server(dependencies) {
  this.controller = dependencies.controller;
  this.logger = dependencies.logger;
}

function readCString(buf) {
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0) {
      return buf.toString("utf8", 0, i);
    }
  }
  return buf.toString("utf8");
}


function decode(data) {
  return {
    type: data.at(0),
    pid: data.readUInt32LE(4),

    d1: data.slice(8, 135).toString('utf8').replace(/\0/g, ''),
    d2: data.slice(136, 647).toString('utf8').replace(/\0/g, ''),
    d3: data.slice(648, 1159).toString('utf8').replace(/\0/g, ''),
    d4: data.slice(1160, 1671).toString('utf8').replace(/\0/g, '')
  };
}

Server.prototype.receive = function receive(data) {
  // console.log(data.toString());
  const message = decode(data);

  // console.log(message);
  this.logger.log("debug", "message received", message);
  switch (message.type) {
    case 50:
      this.controller.register(message.d1, message.d2, message.d3, message.d4);
      break;

    case 51:
      if (message.d1 === "raw mail user") {
        break;
      }
      this.controller.notify(message.d1, message.d2);
      break;

    case 52:
      this.controller.subscribe(message.d1, message.d2, message.d3, message.d4);
  }
}

module.exports = Server;

