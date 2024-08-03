"use strict";

const Promise = require("bluebird");
const { exec } = require('child_process');
module.exports = function (dependencies) {

  const Notification = dependencies.Notification;
  const md5 = dependencies.md5

  function Controller(props) {
    this.apn = props.apn;
    this.logger = props.logger;
    this.redis = props.redis;
    this.prefix = props.prefix;
    this.postApi = props.postApi;
    this.apntopic = props.apntopic;
  }

  Controller.prototype.register = function register(username, accountId, deviceToken, subtopic) {
    const prefix = this.prefix;

    this.logger.log("info", "Controller.register", { username });

    this.redis.sadd(`${prefix}${username}:device`, `${deviceToken}:${accountId}`);
    this.redis.del(`${prefix}${username}:${deviceToken}:${accountId}:subscriptions`);
  }

  Controller.prototype.notify = function notify(username, mailbox) {
    const prefix = this.prefix;
    const usernameKey = `${prefix}${username}`
    const mailboxHash = md5(mailbox);

    // if postApi is set, then we will post to the api
    if (this.postApi) {

      const command = `/usr/bin/php /Server/app/PHP-iMAP/Auto_Emails.php ${username}`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing PHP script: ${error}`);
          return;
        }
        if (stderr) {
          console.error(`PHP error: ${stderr}`);
          return;
        }
        console.log(`PHP output: ${stdout}`);
      });
    }



    this.logger.log("info", "Controller.notify", { username, mailbox });




    return this.redis.smembers(`${usernameKey}:device`)
      .then(deviceAccounts => Promise.all(
        deviceAccounts.map(deviceAccount => {

          this.logger.log("info", "Controller.notify.device", { username, device: deviceAccount });

          return this.redis.sismember(`${usernameKey}:${deviceAccount}:subscriptions`, mailboxHash)
            .then(shouldSend => {

              this.logger.log("info", "Controller.notify.shouldSend", { username, device: deviceAccount, shouldSend });

              // if (!shouldSend) {
              //   return null;
              // }
              const [device, accountId] = deviceAccount.split(":", 2);
              const notification = new Notification();


              // {aps: {"AccountId": accountId,
              //  m: [mailboxHash]}
              // }
              notification.topic = this.apntopic;
              notification.expiry = Math.floor(Date.now() / 1000) + 3600;
              notification.priority = 10;
              notification.contentAvailable = true;
              // notification.pus
              notification.aps = {
                "AccountId": accountId,
                "m": mailboxHash
              };
              // notification.payload = {
              //   aps: {
              //     "AccountId": accountId,
              //     "m": mailboxHash
              //   }
              // };
              this.logger.log("info", "Controller.notify.send", { username, device, notification: notification.compile() });
              // log out all the reponses
              this.apn.send(notification, device).then(function (result) {
                console.log(result);
              });



              // return Promise.resolve(this.apn.send(notification, device))




              //   .then( ( { failed } ) => failed)
              //   .filter( ( result ) => {
              //     if (result.response) {
              //       let reason = result.response.reason;
              //       if (reason == "Unregistered") {
              //         this.logger.log("info", "Controller.notify.send.unregistered", { username, device });
              //         return true;
              //       }
              //       this.logger.log("info", "Controller.notify.send.failure", { username, device, reason });
              //     } else if (result.error) {
              //       this.logger.log("error", "Controller.notify.send.error", {username, device, error: result.error });
              //     }
              //     return false
              //   })
              //   .each( failed => Promise.all([
              //     this.redis.srem(`${usernameKey}:device`, `${failed.device}:${accountId}`),
              //     this.redis.del(`${usernameKey}:${deviceAccount}:subscriptions`),
              //   ])
              // );
            });
        })
      )
      );
  }

  Controller.prototype.subscribe = function subscribe(username, accountId, device, mailbox) {
    const prefix = this.prefix;

    this.logger.log("info", "Controller.subscribe", { username, mailbox })

    this.redis.sadd(`${prefix}${username}:${device}:${accountId}:subscriptions`, md5(mailbox));
  }

  return Controller;
};
