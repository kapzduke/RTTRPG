import { Contents } from "RTTRPG/modules";
import { BotManager } from "RTTRPG/@type/";

type Message = BotManager.Message;
type ItemStack = Contents.ItemStack;
type Weapon = Contents.Weapon;

const defaultStat: UserSecure.Stat = {
  health: 100,
  health_regen: 0.5,
  energy: 100,
  energy_regen: 1,
  strength: 0,
  defense: 0,
};

const defaultInven: UserSecure.Inventory = {
  items: [],
  weapon: 5 //주먹 ID
}

namespace UserSecure {
  export type Stat = {
    health: number;
    health_regen: number;
    energy: number;
    energy_regen: number;
    strength: number;
    defense: number;
  };

  export type Inventory = {
    items: ItemStack[];
    weapon: number;
  };


  export class Status {
    status: string;
    callback: (msg: Message, user: User) => void;

    constructor(status: string, callback: (msg: Message, user: User) => void) {
      this.status = status;
      this.callback = callback;
    }
  }

  export class User {
    public readonly id: string;
    public readonly password: string;
    public readonly hash: string;
    public money: number;
    public energy: number;
    public level: number;
    public exp: number;
    public weaponID: number = 5; //주먹
    public cooldown: number = 0; //무기 쿨다운
    public readonly stats: Stat = defaultStat;
    public readonly inventory: Inventory = defaultInven;

    constructor(id: string, password: string, hash: string) {
      this.id = id;
      this.password = password;
      this.hash = hash;
      this.money = 0;
      this.energy = 50;
      this.level = 1;
      this.exp = 0;
    }
  }
}

export default UserSecure;
