//TODO: 각 콘텐츠 파일로 나눠 모듈화. 줄이 너무 길어진다 이러다 다 죽어~

import { UserSecure } from "RTTRPG/modules";
import { Utils } from "RTTRPG/util"
import { Entity } from "RTTRPG/game";
import { Bundle } from "RTTRPG/assets";

type User = UserSecure.User;
type UnitEntity = Entity.UnitEntity;
const Strings = Utils.Strings;
let itemCount: number = 0;
let unitCount: number = 0;

namespace Contents {
  export abstract class Heathy {
    public abstract health: number;
  }

  export abstract class Consumable {
    public abstract consume(user: User, amount: number): string;

    public static is(target: any): target is Consumable {
      return Object.keys(target).includes("consume");
    }
  }

  export abstract class Durable {
    public abstract durability: number | undefined;
    public abstract getDurability(): number;
    public abstract setDurability(durability: number): void;
    public abstract removeDurability(amount: number): void;
    public abstract isBroken(): boolean;
  }

  export abstract class Dropable {
    public rare: number | undefined;

    public abstract dropableOnBattle(): boolean;
    public abstract dropableOnWalking(): boolean;
    public abstract dropableOnShop(): boolean;
  }

  export class Content {
    public readonly name: string;
    public readonly localName: (user: User)=>string;
    public readonly description: (user: User)=>string;
    public readonly details: (user: User)=>string;
    public readonly founders: number[]=[];

    constructor(name: string, type: string = "other") {
      this.name = name;
      this.localName = (user: User)=>Bundle.find(user.lang, `content.${type}.${name}.name`);
      this.description = (user: User)=>Bundle.find(user.lang, `content.${type}.${name}.description`);
      this.details = (user: User)=>Bundle.find(user.lang, `content.${type}.${name}.description`);
    }
  }

  export class Item extends Content implements Dropable {
    public readonly rare: number;
    public readonly cost: number;
    public readonly id: number;
    private dropOnWalk = true;
    private dropOnBattle = true;
    private dropOnShop = true;

    constructor(
      name: string,
      rare: number,
      cost: number
    ) {
      super(name, "item");
      this.rare = rare;
      this.cost = cost;
      this.id = itemCount++;
    }

    public dropableOnBattle() {
      return this.dropOnBattle;
    }
    public dropableOnWalking() {
      return this.dropOnWalk;
    }
    public dropableOnShop() {
      return this.dropOnShop;
    }

    public dropBattle(bool: boolean) {
      this.dropOnBattle = bool;
      return this;
    }
    public dropWalking(bool: boolean) {
      this.dropOnWalk = bool;
      return this;
    }
    public dropShop(bool: boolean) {
      this.dropOnShop = bool;
      return this;
    }
  }

  export class Buff {
    public readonly value: number;
    public readonly localName: (user: User)=>string;
    public readonly callback: Function;

    constructor(
      value: number,
      name: string,
      callback: (user: User, amount: number, buff: Buff) => string
    ) {
      this.value = value;
      
      this.localName = (user: User)=>Bundle.find(user.lang, `buff.${name}.name`);
      this.callback = callback;
    }

    public buff(user: User, amount: number) {
      this.callback(user, amount, this);
    }
  }

  export class Potion extends Item implements Consumable {
    private readonly buffes: Buff[];

    constructor(
      name: string,
      rare: number,
      cost: number,
      buffes: Buff[]
    ) {
      super(name, rare, cost);
      this.buffes = buffes;
    }

    public consume(user: User, amount: number = 1) {
      return Strings.format("{0}를 {1}만큼 섭취하였다!\n", [
        this.name,
        amount,
        this.buffes.map((b) => b.callback(user, amount, b)).join("\n  "),
      ]);
    }
  }

  export class Weapon extends Item implements Durable {
    public readonly damage: number;
    public readonly cooldown: number;
    public readonly critical_ratio: number;
    public readonly critical_chance: number;
    public durability: number;

    constructor(
      name: string,
      rare: number,
      cost: number,
      damage: number,
      cooldown: number,
      critical_ratio: number,
      critical_chance: number,
      durability: number
    ) {
      super(name, rare, cost);
      this.damage = damage;
      this.cooldown = cooldown;
      this.critical_chance = critical_chance;
      this.critical_ratio = critical_ratio;
      this.durability = durability;
    }

    public isBroken() {
      return this.durability > 0;
    }
    public getDurability() {
      return this.durability;
    }
    public setDurability(durability: number = this.durability) {
      this.durability = durability;
    }

    public removeDurability(amount: number = 1) {
      this.durability -= amount;
    }

    public attack(attacker: User, target: Heathy) {
      let critical = Utils.Mathf.randbool(this.critical_chance);

      this.removeDurability();
      return Strings.format(Bundle.find(attacker.lang, "hit"),
        [
          critical ? Bundle.find(attacker.lang, "critical") : "",
          this.name,
          (this.damage * (critical ? this.critical_ratio : 1)).toFixed(2),
          target.health.toFixed(2),
          (target.health -= this.damage * (critical ? this.critical_ratio : 1)).toFixed(2),
        ]
      );
    }
  }

  export class Unit extends Content {
    public health: number;
    public level: number;
    public rare: number;
    public readonly items: ItemStack[] = [];
    public id: number;

    constructor(
      name: string,
      health: number,
      level: number,
      rare: number,
      items: ItemStack[]
    ) {
      super(name, "unit");

      this.health = health;
      this.level = level;
      this.rare = rare;
      this.items = items;
      this.id = unitCount++;
    }
  }

  export class ItemStack {
    private id: number;
    private amount: number;
    durability: number | undefined;

    constructor(id: number, amount: number=1, durability?: number) {
      this.id = id;
      this.amount = amount;
      this.durability = durability;
    }

    public static from(stack: ItemStack) {
      return new ItemStack(stack.id, stack.amount, stack.durability);
    }

    public static with(items: number[]) {
      var stacks: ItemStack[] = [];
      for (let i = 0; i < items.length; i += 2) {
        stacks[i / 2] = new ItemStack(items[i], items[i + 1]);
      }
      return stacks;
    }

    public add(amount: number = 1) {
      amount += amount;
    }
    
    public remove(amount: number = 1) {
      amount -= amount;
    }

    public getAmount() {
      return this.amount;
    }

    public setAmount(amount: number) {
      return this.amount = amount;
    }

    public setID(id: number) {
      return this.id = id;
    }

    public equals(item: Item, amount?: number) {
      return this.id == item.id && (!amount || this.amount == amount);
    }

    public consume(user: User, amount: number = 1) {
      let item = Contents.Items.find(this.id);
      if (item != undefined) {
        if (item instanceof Consumable) {
          this.remove(amount);
          return item.consume(user, amount);
        } else throw "the item: " + item.name + " is not consumable!";
      }
    }

    public getItem<T extends Item>(): T {
      return Contents.Items.find(this.id) as T;
    }
  }

  export class Items {
    private static readonly items: Item[] = [];

    public static init() {
      this.items.push(new Weapon("stone", 0.25, 0.25, 1.15, 1.2, 0.2, 1.05, 1));
      this.items.push(new Item("fragment", 0.5, 0.5));
      this.items.push(new Potion("energy_bar", 0.25, 0.25,
        [
          new Buff(10, "energy", (user: User, amount: number, buff: Buff) => {
            user.energy += amount * buff.value;
            return `* ${buff.localName(user)} +${amount * buff.value}`;
          })
        ] 
      ));
      this.items.push(new Weapon("aluminum_sword", -1, 50, 1.5, 1, 1.15, 0.25, 10));
      this.items.push(new Weapon("wooden_sword", -1, 30, 1.25, 1.5, 1.1, 0.15, 25));
      this.items.push(new Weapon("punch", -1, -1, 1, 1, 0.1, 1.1, -1));
    }
    public static getItems() {
      return this.items;
    }

    public static find<T extends Item>(id: number): T {
      return this.items[id] as T;
    }
  }

  
  export class Units {
    private static readonly units: Unit[] = [];

    public static init() {
      this.units.push(new Unit("obstruction", 5, 0.1, 1, []));
      this.units.push(new Unit("goblin", 2, 0.3, 1, []));
    }

    public static getUnits() {
      return this.units;
    }

    public static find<T extends Unit>(id: number): T {
      return this.units[id] as T;
    }
  }
}

export default Contents;
