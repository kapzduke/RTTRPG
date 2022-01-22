import { BotManager } from "RTTRPG/@type/";
import { UserSecure, Contents, Utils, Entity } from "RTTRPG/modules";

type Message = BotManager.Message;
type User = UserSecure.User;
type Unit = Contents.Unit;
type Item = Contents.Item;
type UnitEntity = Entity.UnitEntity;

const UnitEntity = Entity.UnitEntity;
const Strings = Utils.Strings;
const Mathf = Utils.Mathf;
const bot = BotManager.getCurrentBot();
const Database = BotManager.Database;
const prefix: string = "!";
const perm: number[] = [-2072057940];
const rooms: string[] = [
  "Sharlotted Bot Test",
  "[Main] 데브로봇스 커뮤니티 | Devlobots",
  "카카오톡 봇 커뮤니티",
  "밥풀이의 코딩&프로그래밍 소통방",
];
let users: UserSecure.User[] = Database.readObject("user_data");

type EventSelection = {
  desc: string,
  func: (msg: Message, user: User, target: UnitEntity)=>void;
};

class EventData {
  ratio: number;
  func: (msg: Message, user: User, target: Unit) => void;
  selection?: EventSelection[];

  constructor(ratio: number, callback: (msg: Message, user: User, target: Unit) => void, selections?: EventSelection[]) {
    this.ratio = ratio;
    this.func = callback;
    this.selection = selections;
  }
}

function makeSelection(user: User, entity: UnitEntity, selections: EventSelection[]) {
  user.status.name = "selecting";
  user.status.callback = (m, u) => {
    let select =
      selections[parseInt(m.content.split(/\s/)[0].replace(/\D/g, ""))];
    if (select) {
      u.status.clearSelection();
      select.func(m, u, entity);
    }
  };
  return selections.map((e, i) => i + ". " + e.desc).join("\n");
}

function battle(msg: Message, user: User, unit: Unit) {
  msg.reply(Utils.Strings.format("전투 발생!\n{0} vs {1}", [user.id, unit.name]));
  msg.reply(makeSelection(user, new UnitEntity(unit), battleSelection));
}

function battlewin(msg: Message, user: User, unit: Unit) {
  let items = [];
  for (let i = 0; i < Math.floor(Mathf.range(unit.level, unit.level + 2)); i++) {
    let item = getOne(
      Contents.Items.getItems().filter((i) => i.dropableOnBattle()),
      "rare"
    );
    if (item) {
      let obj = items.find((i) => i.item == item);
      if (obj) obj.amount++;
      else items.push({ item: item, amount: 1 });
    }
  }
  msg.reply(
    Strings.format("전투 보상\n-----------\n경험치: {0}exp -> {1}exp{2}", [
      user.exp,
      (user.exp += unit.level * (1 + unit.rare) * 10),
      items.length > 0
        ? Strings.format("\n\n얻은 아이템: \n{0}", 
            items
              .map((i) => Strings.format("+{0} {1}개", [i.item.name, i.amount]))
              .join("\n")
          ) + "\n"
        : ""
        ])
  );
  msg.reply(items.map((i) => giveItem(user, i.item)).filter(e=>e).join("\n"));
  save();
}

function giveItem(user: User, item: Item, amount: number=1) {
  let returnstr = "";

  if (item.founders.indexOf(user.hash)<0) {
    returnstr = item.name+" 첫 발견! 도감에 수록되었습니다.";
    item.founders.push(user.hash);
  }
  let exist = user.inventory.items.find((i) => i.equals(item));
  if (exist) exist.add(amount);
  else user.inventory.items.push(new Contents.ItemStack(item.id, amount));
  save();
  return returnstr;
}

//데이터 동기화
/*
(() => {
  let tamp = new UserSecure.User("", "", "");
  let checkobj = (obj, origin) => {
    Object.keys(origin).forEach((k) => {
      if (obj[k] === undefined) obj[k] = origin[k];
      else if (typeof obj[k] == "object") {
        checkobj(obj[k], origin[k]);
      }
    });
  };
  users.forEach((u) => {
    Object.getOwnPropertyNames(tamp).forEach((k) => {
      if (k == "id" || k == "pw" || k == "hash") return;
      if (u[k] === undefined) u[k] = tamp[k];
      else if (typeof u[k] == "object") {
        checkobj(u[k], tamp[k]);
      }
    });
  });
})();
*/

const exchangeSelection: EventSelection[] = [
  {
    desc: "구매하기",
    func: (msg, user, target) => {
      let repeat = (m: Message, u: UserSecure.User, t: UnitEntity) =>
        m.reply(makeSelection(u, t, Contents.Units.find(t.id).items.map((entity) => {
              let item = entity.getItem();
              let money = item.cost * 35;
              return {
                desc: Strings.format("{0}: {1}원 ({2}개 보유)", [item.name, money, entity.getAmount()]),
                func: (m: Message, u: UserSecure.User, t: UnitEntity) => {
                  let [, a] = m.content.split(/\s/);
                  let amount = Number((a || "1").replace(/\D/g, "") || 1);
                  if (amount > entity.getAmount())
                    m.reply(Strings.format("{0}(을)를 {1}만큼 가지고 있지 않습니다. 보유 수량: {2}", [item.name, amount, entity.getAmount()]));
                  else if (u.money < amount * money)
                    m.reply(Strings.format("돈이 부족합니다. 필요금: {0}원 > 보유금: {1}원", [amount * money, u.money]));
                  else {
                    m.reply(Strings.format("{0}(을)를 {1}개만큼 구매했다.\n보유금 {2}원 -> {3}원", [item.name, amount, u.money, (u.money -= money * amount)]));
                    entity.setAmount(entity.getAmount()-amount);
                    msg.reply(giveItem(u, item, amount));
                    if (!entity.getAmount()) t.items.items.splice(t.items.items.indexOf(entity), 1);
                    save();
                  }

                  repeat(m, u, t);
                },
              };
            })
            .concat({
              desc: "돌아가기",
              func: (m, u, t) => m.reply(makeSelection(u, t, exchangeSelection))
            })
        ));
      repeat(msg, user, target);
    },
  },
  {
    desc: "판매하기",
    func: (msg, user, target) => {
      let repeat = (m: Message, u: UserSecure.User, t: UnitEntity) =>
        m.reply(makeSelection(u, t, u.inventory.items.map((entity) => {
              let item = entity.getItem();
              let money = item.cost * 10;
              return {
                desc: Strings.format("{0}: {1}원 ({2}개 보유)", [item.name, money, entity.getAmount()]),
                func: (m: Message, u: UserSecure.User, t: UnitEntity) => {
                  let [, a] = m.content.split(/\s/);
                  let amount = Number((a || "1").replace(/\D/g, "") || 1);
                  if (amount > entity.getAmount())
                    m.reply(Strings.format("{0}(을)를 {1}만큼 가지고 있지 않습니다. 보유 수량: {2}",[item.name, amount, entity.getAmount()]));
                  else {
                    m.reply(Strings.format("{0}(을)를 {1}개만큼 판매했다.\n보유금 {2}원 -> {3}원", [item.name, amount, u.money, (u.money += money * amount)]));

                    entity.setAmount(entity.getAmount()-amount);
                    if (!entity.getAmount()) u.inventory.items.splice(u.inventory.items.indexOf(entity), 1);
                    save();
                  }

                  repeat(m, u, t);
                },
              };
            })
            .concat({
              desc: "돌아가기",
              func: (m, u, t) => m.reply(makeSelection(u, t, exchangeSelection))
            })
        ));
      repeat(msg, user, target);
    },
  },
  {
    desc: "지나가기",
    func: (msg, user, target) => {
      msg.reply("고블린은 좋은 거래 상대를 만났다며 홀가분하게 떠났다.");
      return;
    },
  },
];
const battleSelection = [
  {
    desc: "공격하기",
    func: (msg: Message, user: User, target: UnitEntity) => {
      if (user.cooldown > 0) {
        msg.reply(Strings.format("무기 쿨타임: {0}s", user.cooldown.toFixed(2)));
        msg.reply(makeSelection(user, target, battleSelection));
        return;
      }

      let weapon: Contents.Weapon = user.inventory.weapon.getItem();
      if (weapon == undefined) return;
      weapon.attack(target);

      if (weapon.getDurability() <= 0) {
          msg.reply(Strings.format("무기 {0}(이)가 파괴되었습니다!", weapon.name));
          user.inventory.weapon.setID(5);
          save();
        
      }

      if (target.health <= 0) {
        msg.reply((target.health < 0 ? "오버킬 " : "") + Strings.format("승리! 상대의 hp가 {0}입니다!", target.health.toFixed(2)));
        battlewin(msg, user, Contents.Units.find(target.id));
      } else msg.reply(makeSelection(user, target, battleSelection));
    },
  },
];

const eventData = [
  new EventData(10, (msg: Message, user: User, target: Unit) => msg.reply("전투가 발생했지만 그들은 당신의 빛나는 머리를 보고 쓰러졌습니다!")),
  new EventData(35, (msg, user) => {
    let money = 2 + Math.floor(Math.random() * 10);
    msg.reply("길바닥에 떨어진 동전을 주웠다!\n돈 +" + money);
    user.money += money;
  }),
  new EventData(
    5,
    (msg, user) => {
      msg.reply("지나가던 고블린을 조우했다!");
      selectionTimeout = setTimeout(
        (msg: Message, user: User) => {
          if (user.status.name == "selecting") {
            let money = Math.floor(Mathf.range(2, 15));
            user.money -= money;
            user.status.clearSelection();

            msg.reply(Strings.format("10초동안 가만히 있는 당신을 본 고블린은 슬그머니 소매치기를 했다.\n돈: -{0}", money));
          }
        },
        10 * 1000,
        [msg, user]
      );
    },
    [
      {
        desc: "도망치기",
        func: (m, u) => {
          if (Mathf.randbool()) {
            let money = Math.floor(Mathf.range(2, 10));
            u.money -= money;
            m.reply(Strings.format("성공적으로 도망쳤...앗, 내 돈주머니!\n돈: -{0}", money));
          } else {
            m.reply("흙먼지로 시선을 돌리고 도망치는데 성공했다!");
          }
        },
      },
      {
        desc: "대화하기",
        func: (m, u) => {
          let money = Math.floor(Mathf.range(2, 5));
          u.money -= money;
          m.reply(Strings.format("...도저히 무슨 언어인지 몰라 주저하던 순간 고블린이 돈주머니를 낚아챘다.\n돈: -{0}", money));
        },
      },
      {
        desc: "거래하기",
        func: (msg, unit) => {
          let goblin = new UnitEntity(Contents.Units.find(1));
          for (let i = 0; i < 20; i++) {
            let item = getOne(Contents.Items.getItems().filter((i) => !i.dropableOnShop()), "rare");
            let exist = goblin.items.items.find((entity) => entity.getItem() == item);
            if (exist) exist.setAmount(exist.getAmount()+1);
            else goblin.items.items.push(new Contents.ItemStack(item));
          }

          let item = getOne(Contents.Items.getItems().filter((i) => !i.dropableOnShop()), "rare");
          goblin.items.items.push(new Contents.ItemStack(item));
          msg.reply("고블린과 거래를 시도한다.");
          msg.reply(makeSelection(unit, goblin, exchangeSelection));
        },
      },
    ]
  ),
  new EventData(50, (msg: Message, user: User) => {
    let item = getOne(Contents.Items.getItems().filter((i) => i.dropableOnWalking()), "rare");
    msg.reply(Strings.format("길바닥에 떨어진 {0}을(를) 주웠다!\n{1}: +1", [item.name, item.name]));
    msg.reply(giveItem(user, item));
  }),
  new EventData(10, (msg: Message, user: User) => msg.reply("불쾌할 정도로 거대한 장애물을 발견했다!"),
    [
      {
        desc: "공격하기",
        func: (m, u) => battle(m, u, Contents.Units.find(0))
      },
      {
        desc: "지나가기",
        func: (m, u) => m.reply("이런 겁쟁이 같으니라고.")
      },
    ]
  ),
];

/**
 *
 * @param {array} arr 아이템을 뽑을 아이템 배열
 * @param {string} ratio 아이템 비율 속성이름
 * @returns arr 배열의 인수 중 하나를 랜덤하게 반환
 */
function getOne(arr: any[], ratio: string) {
  let random = Math.random();
  let total = arr.reduce((a, e) => a + e[ratio], 0);
  for (var i in arr) {
    random -= arr[i][ratio] / total;
    if (random < 0) return arr[i];
  }
}

function levelup(user: User) {
  let str = Strings.format("{0} 레벨 업! {1}lv -> {2}lv\n모든 체력 및 기력이 회복됩니다.\n체력: {3}hp -> {4}hp\n기력: {5} -> {6}", [
      user.id,
      user.level,
      user.level + 1,
      user.stats.health_max,
      (user.stats.health_max += Math.pow(user.level, 0.6) * 5),
      user.stats.energy_max,
      (user.stats.energy_max += Math.pow(user.level, 0.4) * 2.5)
  ]);
  rooms.forEach((room) => bot.send(room, str));
  user.stats.health = user.stats.health_max;
  user.stats.energy = user.stats.energy_max;
  user.level++;
  save();
}

function checkusers() {
  users.forEach((user) => {
    if (user.exp > Math.pow(user.level, 2) * 50) {
      levelup(user);
    }
  });
}

const inter = setInterval(() => {
  try {
    if (users)
      users.forEach((u) => {
        if (u.cooldown > 0) u.cooldown -= 1 / 100;
        u.energy = Math.min(
          u.stats.energy,
          u.energy + u.stats.energy_regen / 100
        );
      });
  } catch (e) {
    clearInterval(inter);
  }
}, 10);
let selectionTimeout: number;

function startEvent(event: EventData, msg: Message, user: User) {
  event.func(msg, user, Contents.Units.getUnits()[0]); //dummy unit
  if (event.selection) {
    user.status.name = "selecting";
    user.status.callback = (m, u) => {
      if(!event.selection) return;
      let select = event.selection[parseInt(m.content.replace(/\D/g, ""))];
      if (select) {
        user.status.clearSelection();
        select.func(msg, user, new UnitEntity(Contents.Units.getUnits()[0]));
        if (selectionTimeout) clearTimeout(selectionTimeout);
      }
    };
    msg.reply(event.selection.map((e, i) => i + ". " + e.desc).join("\n"));
  }
}

function search(msg: Message, user: User) {
  let event = getOne(eventData, "ratio");
  if (!event) return msg.reply("매우 평화로운 초원에서 피톤치트를 느낀다.");
  startEvent(event, msg, user);
  user.stats.energy -= 7;
}

function info(user: User, content: Item|Unit) {
  return (
    (content.founders.indexOf(user.hash)>=0 
      ? content.name 
      : content.name.replace(/./g, "?")) +
    "\n" +
    (content.founders.indexOf(user.hash)>=0 
      ? content.description 
      : content.name.replace(/./g, "?")) +
    (content.details 
      ? "\n------------\n  " + (content.founders.indexOf(user.hash)>=0 
        ? content.details 
        : content.name.replace(/./g, "?")) + "\n------------"
      : "")
  );
}

function getContentInfo(user: User, msg: Message) {
  const [, type] = msg.content.split(/\s/);
  if (type != "아이템" && type != "유닛")
    return msg.reply("!도감 (아이템|유닛) [이름]");

  let str = "";
  let name = msg.content.split(/\s/).slice(2).join(" ");
  if (type == "유닛") {
    if (name && !Contents.Units.getUnits().some((u) => u.name == name))
      return msg.reply(Strings.format("유닛 {0}(을)를 찾을 수 없습니다.", name));
    str = Strings.format("유닛\n===============\n\n{0}\n\n", [name
        ? info(user, Contents.Units.getUnits().find((u) => u.name == name) as Unit)
        : Contents.Units.getUnits().map((c) => info(user, c)).join("\n\n")
    ]);
  } else if (type == "아이템") {
    if (name && !Contents.Items.getItems().some((u) => u.name == name))
      return msg.reply(Strings.format("아이템{0}(을)를 찾을 수 없습니다.", name));
    str = Strings.format("아이템\n===============\n\n{0}\n\n", name 
      ? info(user,Contents.Items.getItems().find((u) => u.name == name) as Item)
      : Contents.Items.getItems().map((c) => info(user, c)).join("\n\n")
    );
  }
  return str;
}

function getInventory(user: User) {
  return Strings.format("인벤토리\n-----------\n{0}{1}", [
    user.inventory.items.length > 3 ? "\u200b".repeat(500) : "",
    user.inventory.items
      .map((i) => {
        let item = i.getItem();
        return Strings.format("• {0} {1}\n   {2}{3}", [
          item.name,
          i.getAmount() > 0 ? Strings.format("({0}개)", i.getAmount()) : "",
          item.description,
          i.durability && item instanceof Contents.Durable
            ? Strings.format(" 내구도: {0}/{1}", [i.durability, item.durability])
            : ""
        ]);
      })
      .join("\n\n")
    ]);
}

function getUserInfo(user: User) {
  let weapon: Contents.Weapon = user.inventory.weapon.getItem();
  if (!weapon) {
    user.inventory.weapon.setID(5);
    weapon = Contents.Items.find(5);
    save();
  }
  
  return Strings.format("{0} {1}lv, {2}exp/{3}exp\n-----------\n돈: {4}원\n기력: {5}/{6} ({7}기력/s)\n체력: {8}/{9} ({10}체력/s)\n\n장비\n-------------\n무기: {11} {12}\n  *쿨다운: {13}s\n  *데미지: {14} ({15}%확률로 데미지의 {16}%만큼 치명타)", [
    user.id,
    user.level,
    user.exp,
    Math.pow(user.level, 2) * 50,
    user.money,
    user.stats.energy.toFixed(1),
    user.stats.energy_max,
    user.stats.energy_regen,
    user.stats.health.toFixed(1),
    user.stats.health_max,
    user.stats.health_regen,
    weapon.name, 
      user.inventory.weapon.durability && weapon.durability
      ? Strings.format(" 내구도: {0}/{1}", [user.inventory.weapon.durability, weapon.durability])
      : "",

    weapon.cooldown,
    weapon.damage,
    (weapon.critical_chance * 100).toFixed(2),
    (weapon.critical_ratio * 100).toFixed(2)
  ]);
}

function switchWeapon(user: User, msg: Message, name: string) {
  let item = Contents.Items.getItems().find((i) => i.name == name);
  if (!item) msg.reply(Strings.format("무기 {0}(을)를 찾을 수 없습니다.", name));
  else {
    let entity = user.inventory.items.find((entity) => entity.getItem() == item);
    if (!entity) msg.reply(Strings.format("무기 {0}(이)가 가방에 없습니다.", name));
    else {
      entity.setAmount(entity.getAmount()-1);
      if (!entity.getAmount()) user.inventory.items.splice(user.inventory.items.indexOf(entity), 1);

      let exist: Item = user.inventory.weapon.getItem();
      if (exist) {
        msg.reply(Strings.format("무기 {0}(을)를 장착하고 무기 {1}(을)를 가방에 넣었습니다.", [name, exist.name]));
        msg.reply(giveItem(user, item));
      } else 
        msg.reply(Strings.format("무기 {0}(을)를 장착했습니다.", name));
      
      
        user.inventory.weapon.setID(item.id);

      save();
    }
  }
}

function read() {
  return Database.readObject("user_data");
}

function save() {
  checkusers();
  Database.writeObject("user_data", users);
}

function onMessage(msg: BotManager.Message) {
  if (msg.isGroupChat && rooms.indexOf(msg.room) < 0) return;
  const hash = BotManager.JavaPackage.java.lang.String(msg.author.avatar.getBase64()).hashCode();
  const user = users.find((u) => u.hash == hash);

  if (perm.indexOf(hash) >= 0 && msg.content.startsWith("de")) {
    try {
      let result = eval(msg.content.slice(2).trim());
      if (typeof result == "string" && result.length < 1)
        result = '[eval] 결과값이 ""입니다.';
      msg.reply(result);
    } catch (e) {
      msg.reply(e + "");
    }
  }

  if (msg.content.startsWith(prefix))
    switch (msg.content.slice(1).split(/\s/)[0]) {
      case "상태창":
        if (!user) return msg.reply("비로그인 상태입니다.");
        var targetid = msg.content.split(/\s/)[1];
        var target = targetid
          ? users.find((u) => u.id == targetid) ||
            msg.reply(Strings.format("계정 {0}(을)를 찾을 수 없습니다.", targetid))
          : user;
        if (!target) return;
        msg.reply(getUserInfo(target));
        break;
      case "인벤토리":
        if (!user) return msg.reply("비로그인 상태입니다.");
        var targetid = msg.content.split(/\s/)[1];
        var target = targetid
          ? users.find((u) => u.id == targetid) ||
            msg.reply(Strings.format("계정 {0}(을)를 찾을 수 없습니다.", targetid))
          : user;
        if (!target) return;
        msg.reply(getInventory(target));
        break;
      case "소모":
        if (!user) return msg.reply("비로그인 상태입니다.");
        let name = msg.content.slice(4);
        if (!name) return msg.reply("!소모 <아이템명>");
        let stack: Contents.ItemStack | undefined = user.inventory.items.find(i=>i.getItem().name==name);
        if (!stack) return msg.reply(name + "을(를) 찾을 수 없습니다.");
        stack.consume(user);
        break;
      case "도감":
        if (!user) return msg.reply("비로그인 상태입니다.");
        msg.reply(getContentInfo(user, msg));
        break;
      case "전환":
        if (!user) return msg.reply("비로그인 상태입니다.");
        let weapon = msg.content.split(/\s/).slice(1).join(" ");
        if (!weapon) msg.reply("!전환 <아이템>");
        else switchWeapon(user, msg, weapon);
        break;
    }

  if (user && user.status.callback && user.status.name == "selecting") {
    return user.status.callback(msg, user);
  }

  if (!msg.content.startsWith(prefix)) return;
  switch (msg.content.slice(1).split(/\s/)[0]) {
    case "돌아다니기":
      if (!user) return msg.reply("비로그인 상태입니다.");
      else if (user.stats.energy < 7) {
        if (user.countover >= 3) {
          msg.reply("게임을 좀 여유롭게 플레이하세요.");
        } else {
          user.countover++;
          msg.reply("기력이 부족합니다. " + user.stats.energy.toFixed(1) + "/7");
        }
      } else {
        user.countover = 0;
        search(msg, user);
      }
      save();
      break;
    case "계정":
      msg.reply(users.map((u) => u.id).join(" | "));
      break;
    case "가입":
      UserSecure.create(msg);
      users = read();
      break;
    case "탈퇴":
      UserSecure.remove(msg);
      users = read();
      break;
    case "로그인":
      UserSecure.signin(msg);
      users = read();
      break;
    case "로그아웃":
      UserSecure.signout(msg);
      users = read();
      break;
    case "변경":
      UserSecure.change(msg);
      users = read();
      break;
    case "언어":
      UserSecure.setLang(msg);
      users = read();
      break;
  }
}

bot.addListener("message", onMessage);
