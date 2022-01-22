import { Contents, Bundle } from "RTTRPG/modules";
import { BotManager } from "RTTRPG/@type/";

type Message = BotManager.Message;
type ItemStack = Contents.ItemStack;

const ItemStack = Contents.ItemStack;
const Database = BotManager.Database;

function login(users: UserSecure.User[], target: UserSecure.User, msg: Message) {
  const hash = BotManager.JavaPackage.java.lang.String(msg.author.avatar.getBase64()).hashCode();
  const others = users.filter((u) => u !== target && u.hash == hash);
  if (others.length) {
    users = users.map((u) => {
      if (u == target || u.hash !== hash) return u;
      u.hash = 0;
      return u;
    });
    msg.reply(Bundle.find(target.lang, "auto_logout"));
  }
  target.hash = hash;
  Database.writeObject("user_data", users);
  msg.reply(Bundle.find(target.lang, "login_success"));
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
    public readonly stats: Stat = defaultStat;
    public readonly status: Status = new Status();
    public readonly inventory: Inventory = defaultInven; 
    public lang: string = "ko";
    public countover: number = 0;

    constructor(id: string, password: string, hash: number) {
      this.id = id;
      this.password = password;
      this.hash = hash;
      this.money = 0;
      this.energy = 50;
      this.level = 1;
      this.exp = 0;
    }
  }

  
  export function create(msg: Message) {
    const users: UserSecure.User[] = Database.readObject("user_data");
    const hash = BotManager.JavaPackage.java.lang.String(msg.author.avatar.getBase64()).hashCode();
    const [id, pw] = msg.content.slice(4).split(/\s/);
    const user = users.find((u) => u.id == id);
    if (!id || !pw) msg.reply(Bundle.find("ko", "create_help"));
    else if (user)
      msg.reply(Bundle.find(user.lang, "account_exist").format(id));
    else {
      const target = new UserSecure.User(id, pw, hash);
      users.push(target);
      login(users, target, msg);
      msg.reply(Bundle.find(target.lang, "create_success"));
    }
  };

  export function remove(msg: Message) {
    const users: User[] = Database.readObject("user_data");
    const hash = BotManager.JavaPackage.java.lang.String(msg.author.avatar.getBase64()).hashCode();
    const [id, pw] = msg.content.slice(4).split(/\s/);
    const user = users.find((u) => u.id == id);
    if (!id || !pw) msg.reply(Bundle.find("ko", "remove_help"));
    else if (!user) msg.reply(Bundle.find("ko", "account_notFound"));
    else if (user.password !== pw)
      msg.reply(Bundle.find(user.lang, "account_incorrect"));
    else if (user.hash !== hash)
      msg.reply(Bundle.find(user.lang, "account_notLogin"));
    else {
      users.splice(users.indexOf(user), 1);
      Database.writeObject("user_data", users);
      msg.reply(Bundle.find(user.lang, "remove_success"));
    }
  };

  export function signin(msg: Message) {
    const users: User[] = Database.readObject("user_data");
    const hash = BotManager.JavaPackage.java.lang.String(msg.author.avatar.getBase64()).hashCode();
    const [id, pw] = msg.content.slice(4).split(/\s/);
    const user = users.find((u) => u.id == id);
    if (!id || !pw) msg.reply(Bundle.find("ko", "login_help"));
    else if (!user) msg.reply(Bundle.find("ko", "account_notFound"));
    else if (user.password !== pw)
      msg.reply(Bundle.find(user.lang, "account_incorrect"));
    else if (user.hash)
      msg.reply(
        user.hash == hash
          ? Bundle.find(user.lang, "account_have")
          : Bundle.find(user.lang, "account_has")
      );
    else login(users, user, msg);
  };

  export function signout(msg: Message) {
    const users: User[] = Database.readObject("user_data");
    const hash = BotManager.JavaPackage.java.lang.String(msg.author.avatar.getBase64()).hashCode();
    const user = users.find((u) => u.hash == hash);
    if (!user) msg.reply(Bundle.find("ko", "account_notLogin"));
    else {
      user.hash = 0;
      msg.reply(Bundle.find(user.lang, "logout_success"));
      Database.writeObject("user_data", users);
    }
  };

  export function change(msg: Message) {
    const users: User[] = Database.readObject("user_data");
    const [, type, id, pw, changeto] = msg.content.split(/\s/);
    const user = users.find((u) => u.id == id);
    if (
      !id ||
      !pw ||
      !type ||
      !(type.toLowerCase() == "id" || type.toLowerCase() == "pw") ||
      !changeto
    )
      msg.reply(Bundle.find("ko", "change_help"));
    else if (!user) {
      msg.reply(Bundle.find("ko", "account_notFound"));
    } else if (type.toLowerCase() == "pw") {
      if (users.find((u) => u.id == changeto))
        msg.reply(Bundle.find(user.lang, "account_exist").format(id));
      else {
        msg.reply(
          Bundle.find(user.lang, "change_id").format(user.id, changeto)
        );
        user.id = changeto;
      }
    } else if (type.toLowerCase() == "id") {
      msg.reply(
        Bundle.find(user.lang, "change_pw").format(user.id, changeto)
      );
      user.password = changeto;
    }

    Database.writeObject("user_data", users);
  };

  export function setLang(msg: Message) {
    const users: User[] = Database.readObject("user_data");
    const hash = BotManager.JavaPackage.java.lang.String(msg.author.avatar.getBase64()).hashCode();
    const [, langto] = msg.content.split(/\s/);
    const user = users.find((u) => u.hash == hash);

    if (!user) return msg.reply(Bundle.find("ko", "account_notLogin"));
    if (!langto || Bundle.langs.indexOf(langto)<0)
      return msg.reply(
        Bundle.find(user.lang, "lang_help").format(Bundle.langs.join(" | "))
      );

    msg.reply(Bundle.find(user.lang, "lang_success").format(user.lang, langto));
    user.lang = langto;
    Database.writeObject("user_data", users);
  };
}

export default UserSecure;
