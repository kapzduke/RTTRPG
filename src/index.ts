namespace RTTRPG {}

export default RTTRPG;

import { Server } from '@remote-kakao/core';
import onMessage from './rpg_';
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./secret.json").toString())
const server = new Server({ useKakaoLink: true });

server.on('message', onMessage);
server.start(3000, config);
console.log("server started");