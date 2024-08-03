"use strict";

const apn = require("apn");
const crypto = require("crypto");
const redis = require("ioredis");
const winston = require("winston");
const fs = require("fs");

const logger = winston;
logger.level = "debug";

const Controller = require("./lib/controller")({
  Notification: apn.Notification,
  md5: (data) => crypto.createHash('md5').update(data).digest("hex"),
});
const Server = require("./lib/server");
const Socket = require("./lib/socket");

//  when loading reemove the file /var/dovecot/push_notify 

fs.unlink('/var/dovecot/push_notify', (err) => {
  if (err) {
    console.error(err)
    return
  }
  //file removed
});


const redisURL = process.env["REDIS_URL"] || "redis://localhost:6121/4";
const redisPrefix = process.env["REDIS_PREFIX"] || "pn:";
const redisClient = new redis(redisURL);
const apnProvider = new apn.Provider({
  cert: process.env["CERT"] || "cert.pem",
  key: process.env["KEY"] || "key.pem",
  production: true
});
const controller = new Controller({
  apn: apnProvider,
  logger,
  prefix: redisPrefix,
  redis: redisClient,
  postApi: process.env["POST_API"] || true,
  apntopic: process.env["APN_TOPIC"] || "",
});


console.log("Starting push_notify server");
console.log(controller)

const socketServer = Socket("/var/dovecot/push_notify")

socketServer.on('data', (message) => {





  const server1 = new Server({ controller, logger });
  server1.receive(message);




});


