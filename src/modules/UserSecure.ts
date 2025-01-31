import { Bundle } from 'RTTRPG/assets';
import { Contents } from "RTTRPG/game";
import { Utils } from "RTTRPG/util";
import RTTRPG from 'RTTRPG/index';

type Message = RTTRPG.Message;
type ItemStack = Contents.ItemStack;

const ItemStack = Contents.ItemStack;
const Database = Utils.Database;

function login(users: UserSecure.User[], target: UserSecure.User, msg: Message, lang: string) {
  const hash = msg.sender.hash;
  const others = users.filter((u) => u !== target && u.hash == hash);
  if (others.length) {
    users = users.map((u) => {
      if (u == target || u.hash !== hash) return u;
      u.hash = 0;
      return u;
    });
    msg.replyText(Bundle.find(lang, "account.auto_logout"));
  }
  target.hash = hash;
  Database.writeObject("./Database/user_data", users);
  msg.replyText(Bundle.find(lang, "account.login_success"));
}


namespace UserSecure {
  export const defaultStat: UserSecure.Stat = {
    health: 100,
    health_max: 100,
    health_regen: 0.5,
    energy: 100,
    energy_max: 100,
    energy_regen: 1,
    strength: 0,
    defense: 0,
  };

  export const defaultInven: UserSecure.Inventory = {
    items: [],
    weapon: new ItemStack(5) //주먹 ID
  }

  export type Stat = {
    health: number;
    health_max: number;
    health_regen: number;
    energy: number;
    energy_max: number;
    energy_regen: number;
    strength: number;
    defense: number;
  };

  export type Inventory = {
    items: ItemStack[];
    weapon: ItemStack;
  };


  export class Status {
    name: string | undefined;
    callback: ((msg: Message, user: User) => void) | undefined;

    constructor(name?: string, callback?: (msg: Message, user: User) => void) {
      this.name = name;
      this.callback = callback;
    }

    public clearSelection() {
      this.name = undefined;
      this.callback = undefined;
    }
  }

  export class User {
    public id: string;
    public password: string;
    public hash: number;
    public money: number;
    public energy: number;
    public level: number;
    public exp: number;
    public cooldown: number = 0; //무기 쿨다운
    public stats: Stat = defaultStat;
    public status: Status = new Status();
    public inventory: Inventory = defaultInven; 
    public lang: string = "ko";
    public countover: number = 0;
    public foundItems: number[] = [];

    constructor(id: string, password: string, hash: number, lang: string = "ko") {
      this.id = id;
      this.password = password;
      this.hash = hash;
      this.lang = lang;
      this.money = 0;
      this.energy = 50;
      this.level = 1;
      this.exp = 0;
    }
  }

  
  export function create(msg: Message, users: User[], lang: string = "ko") {
    const hash = msg.sender.hash;
    let [id, pw] = msg.content.split(/\s/).slice(1);
    const user = users.find((u) => u.id == id);
    if(id?.includes("@")) id = id.replace("@", "");
    if (!id || !pw) msg.replyText(Bundle.find(lang, "account.create_help"));
    else if (user)
      msg.replyText(Bundle.format(lang, "account.account_exist", id));
    else {
      const target = new UserSecure.User(id, pw, hash);
      users.push(target);
      login(users, target, msg, lang);
      msg.replyText(Bundle.find(lang, "account.create_success"));
    }
  };

  export function remove(msg: Message, users: User[], lang: string = "ko") {
    const hash = msg.sender.hash;
    const [id, pw] = msg.content.split(/\s/).slice(1);
    const user = users.find((u) => u.id == id);
    if (!id || !pw) msg.replyText(Bundle.find(lang, "account.remove_help"));
    else if (!user) msg.replyText(Bundle.find(lang, "account.account_notFound"));
    else if (user.password !== pw)
      msg.replyText(Bundle.find(lang, "account.account_incorrect"));
    else if (user.hash !== hash)
      msg.replyText(Bundle.find(lang, "account.account_notLogin"));
    else {
      users.splice(users.indexOf(user), 1);
      Database.writeObject("./Database/user_data", users);
      msg.replyText(Bundle.find(lang, "account.remove_success"));
    }
  };

  export function signin(msg: Message, users: User[], lang: string = "ko") {
    const hash = msg.sender.hash;
    const [id, pw] = msg.content.split(/\s/).slice(1);
    const user = users.find((u) => u.id == id);
    if (!id || !pw) msg.replyText(Bundle.find(lang, "account.login_help"));
    else if (!user) msg.replyText(Bundle.find(lang, "account.account_notFound"));
    else if (user.password !== pw)
      msg.replyText(Bundle.find(lang, "account.account_incorrect"));
    else if (user.hash)
      msg.replyText(
        user.hash == hash
          ? Bundle.find(lang, "account.account_have")
          : Bundle.find(lang, "account.account_has")
      );
    else login(users, user, msg, lang);
  };

  export function signout(msg: Message, users: User[], lang: string = "ko") {
    const hash = msg.sender.hash;
    const user = users.find((u) => u.hash == hash);
    if (!user) msg.replyText(Bundle.find(lang, "account.account_notLogin"));
    else {
      user.hash = 0;
      msg.replyText(Bundle.find(lang, "account.logout_success"));
      Database.writeObject("user_data", users);
    }
  };

  export function change(msg: Message, users: User[], lang: string = "ko") {
    const [, type, id, pw, changeto] = msg.content.split(/\s/);
    const user = users.find((u) => u.id == id);
    if (
      !id ||
      !pw ||
      !type ||
      !(type.toLowerCase() == "id" || type.toLowerCase() == "pw") ||
      !changeto
    )
      msg.replyText(Bundle.find(lang, "account.change_help"));
    else if (!user) {
      msg.replyText(Bundle.find(lang, "account.account_notFound"));
    } else if (type.toLowerCase() == "pw") {
      if (users.find((u) => u.id == changeto))
        msg.replyText(Bundle.format(lang, "account.account_exist", id));
      else {
        msg.replyText(
          Bundle.format(lang, "account.change_id", user.id, changeto)
        );
        user.id = changeto;
      }
    } else if (type.toLowerCase() == "id") {
      msg.replyText(
        Bundle.format(lang, "account.change_pw", user.id, changeto)
      );
      user.password = changeto;
    }

    Database.writeObject("./Database/user_data", users);
  };

  export function setLang(msg: Message, users: User[], lang: string = "ko") {
    const hash = msg.sender.hash;
    const langto = msg.content.split(/\s/)[1];
    const user = users.find((u) => u.hash == hash);

    if (!user) return msg.replyText(Bundle.find(lang, "account.account_notLogin"));
    if (!langto || !Bundle.langs.includes(langto))
      return msg.replyText(
        Bundle.format(lang, "account.lang_help", Bundle.langs.join(" | "))
      );

    msg.replyText(Bundle.format(lang, "account.lang_success", lang, langto));
    user.lang = langto;
    Database.writeObject("./Database/user_data", users);
  };
}

export default UserSecure;
