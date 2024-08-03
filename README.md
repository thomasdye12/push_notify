# push notify

Apple Mail (iOS) Push support.

Handles registration of devices and sending of push notifications when mail is
received.

Is built from other code that has made it work with mac os server, requers you to bring a valid certificate and key to work. 
The other repo that this is from is [here](https://github.com/argon/push_notify) credit to argon for the original code.

would recommend using the original code as this is a work in progress and may not work as intended, that has a Dovecot plugin 

the code for making the cert can be found [here](https://github.com/scintill/macos-server-apns-certs)

## Requirements

- Mail server
   - Dovecot, using apples built in mail push notify plugin

- Mail server push certificates from macOS Server
- node-v6.3+
- redis

`push_notify` must be run on the same machine as the mail server as it
communicates via a UNIX socket.

## Caveat

This software requires credentials which can only be obtained through
macOS Server. As such it should only be run on Macintosh hardware. No other
configurations are supported or endorsed.

## Environment Variables

- `REDIS_URL`
- `REDIS_PREFIX` default: `pn:`
- `POST_API` just a key for me to disable or enable some code that will run some php 
- `APN_TOPIC` the topic of the push notification
