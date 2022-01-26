# RTTRPG
Real-Time Text RPG based on TypeScript(es6)


## Start as Kakao Bot
### Android
1. install MessengerBot on playstore
2. add bot with [this script](https://github.com/remote-kakao/core-client/releases/download/1.0.0-alpha.0/core-client.js).
3. edit json in bot script for UDP connection.
~~~js
var config = {
    address: 'server address',
    port: serve port,
};
~~~

4. run the bot

### Server
1. add secret.json file with
~~~json
{
  "email": "kaling email",
  "password": "kaling password",
  "key": "kakao dev js key",
  "host": "kaling web domain",
  "discord": "put discord bot key if you want"
}
~~~
this json file will be used for sending kakao link and discord login.

2. run `npm i` to install all modules.
3. run `npm run devServer` to start server.

## Start as Discord Bot
1. add secret.json file with
~~~json
{
  "email": "kaling email",
  "password": "kaling password",
  "key": "kakao dev js key",
  "host": "kaling web domain",
  "discord": "put discord bot key if you want"
}
~~~
this json file will be used for sending kakao link and discord login.

2. run `npm i` to install all modules.
3. run `npm run devServer` to start server.