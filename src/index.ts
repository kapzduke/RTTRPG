namespace RTTRPG {
    export type Message = {
    discordobj: Discord.Message | null,
    room: string
    content: string
    sender: {
        name: string
        hash: any
    },
    isGroupChat: boolean,
    replyText: (msg: any, room?:string)=>void
    }
}

export default RTTRPG;

import { Server } from '@remote-kakao/core';
import onMessage from './rpg_';
import Discord, { Intents } from "discord.js";
import fs from "fs";
import { Utils } from "./util";

const Strings = Utils.Strings;
const secret = fs.readFileSync("./secret.json").toString();
const config = JSON.parse(secret);
const server = new Server({ useKakaoLink: true });
const client = new Discord.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

server.on('ready', () => console.log(`remote-kakao server is ready!`));
server.on('message', (message) => {
  onMessage({
      discordobj: null,
      room: message.room,
      content: message.content,
      sender: {
          name: message.sender.name,
          hash: Strings.hashCode(message.sender.getProfileImage())
      },
      isGroupChat: message.isGroupChat,
      replyText: (string: any, room?:string) => message.replyText(string, room)
  });
});
client.on("ready", () => console.log(`Logged in as ${client.user?.tag}!`));
client.on("messageCreate", (message) => {
  if (message.author.bot) return; //not botself
  onMessage({
      discordobj: message,
      room: "",
      content: message.content,
      sender: {
          name: message.author.username,
          hash: message.author.id
      },
      isGroupChat: false,
      replyText: (string: any) => message.channel.send(string)
  });
});
server.start(3000, config);
client.login(config.discord);
console.log("server started");
