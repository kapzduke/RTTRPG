//TODO: 각 콘텐츠 파일로 나눠 모듈화. 줄이 너무 길어진다 이러다 다 죽어~

import { UserSecure } from "RTTRPG/modules";
import { Utils } from "RTTRPG/util"
import { Entity } from "RTTRPG/game";

type User = UserSecure.User;
type UnitEntity = Entity.UnitEntity;
const Strings = Utils.Strings;
let itemCount: number = 0;
let unitCount: number = 0;

namespace Contents {
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
    public readonly description: string;
    public readonly details: string;
    public readonly founders: number[]=[];

    constructor(name: string, description: string, details: string) {
      this.name = name;
      this.description = description;
      this.details = details;
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
      description: string,
      details: string,
      rare: number,
      cost: number
    ) {
      super(name, description, details);
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
    public readonly name: string;
    public readonly callback: Function;

    constructor(
      value: number,
      name: string,
      callback: (user: User, amount: number, buff: Buff) => string
    ) {
      this.value = value;
      this.name = name;
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
      description: string,
      details: string,
      rare: number,
      cost: number,
      buffes: Buff[]
    ) {
      super(name, description, details, rare, cost);
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
      description: string,
      details: string,
      rare: number,
      cost: number,
      damage: number,
      cooldown: number,
      critical_ratio: number,
      critical_chance: number,
      durability: number
    ) {
      super(name, description, details, rare, cost);
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

    public attack(target: UnitEntity) {
      let critical = Utils.Mathf.randbool(this.critical_chance);

      this.removeDurability();
      return Strings.format(
        "{0} 명중! 적에게 {1}(으)로 {2}만큼 데미지를 입혔습니다!\n{3}hp -> {4}hp",
        [
          critical ? "치명타" : "",
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
      description: string,
      details: string,
      health: number,
      level: number,
      rare: number,
      items: ItemStack[]
    ) {
      super(name, description, details);

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
    private static readonly items: Item[];

    public static init() {this.items.push(new Weapon(
        "짱돌",
        "길바닥에 돌아다니는 흔한 돌맹이다.",
        "밟으면 아프니 지뢰의 기능을 하고, 던져도 아프니 탄환의 기능을 하며, 크기가 된다면 둔기의 기능으로도 되므로 이것이 바로 모든 무기의 시초로다.\n  =아리스토텔링",
        0.25, 0.25, 1.15, 1.2, 0.2, 1.05, 1
      ));
      this.items.push(new Item("조각", "손까락 크기의 정말 작은 조각이다.", "", 0.5, 0.5));
      this.items.push(new Potion(
        "에너지 바",
        "누군가가 흘린 한입 크기의 에너지 바.",
        "", 
        0.25, 0.25,
        [
          new Buff(10, "기력", (user: User, amount: number, buff: Buff) => {
            user.energy += amount * buff.value;
            return "* 기력 +" + amount * buff.value;
          })
        ] 
      ));
      this.items.push(new Weapon(
        "알루미늄 검",
        "날카롭고 가벼우나 내구성이 매우 약합니다.",
        "",
        -1, 50, 1.5, 1, 1.15, 0.25, 10
      ));
      this.items.push(new Weapon(
        "나무 검",
        "내구성이 매우 강한 대신 전혀 날카롭지 않습니다.",
        "",
        -1, 30, 1.25, 1.5, 1.1, 0.15, 25
      ));
      this.items.push(new Weapon(
        "주먹",
        "인간 병기인 당신은 맨손 주먹을 무기로 선택했다!",
        "",
        -1, -1, 1, 1, 0.1, 1.1, -1
      ));
    }
    public static getItems() {
      return this.items;
    }

    public static find<T extends Item>(id: number): T {
      return this.items[id] as T;
    }
  }

  
  export class Units {
    private static readonly units: Unit[];

    public static init() {
      this.units.push(new Unit(
        "장애물",
        "누가 이런 거대한 장애물을 길바닥에 버려둔 걸까요?",
        "한밤중, 가끔 이 장애물에서 반짝거림을 느낀다.",
        5, 0.1, 1, []
      ));
      this.units.push(new Unit(
        "고블린",
        "저런, 이 잠자는 고블린은 곧 봉변을 맞이할 것입니다.",
        "쿨...",
        2, 0.3, 1, []
      ));
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
