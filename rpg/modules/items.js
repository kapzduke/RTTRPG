/**
 * @callback consume
 * @param {User} user 아이템을 소모할 유저 객체
 * @param {Message} msg reply용 메시지 객체
 */

/**
 * @typedef Buff
 * @type {object}
 * @property {number} health 버프할 체력 수치
 * @property {number} energy 버프할 기력 수치
 */
/**
 * 소모 아이템 클래스, 무조건 Item을 상속해야 하지만 유닛을 소모하지 말란 법은 없다.
 * @constructor
 * @param {consume} callback 소모 시 호출되는 콜백함수
 * @param {number} amount 아이템 소모량, 어차피 Item 상속할거라 item 인자는 없음
 */
function Consumable(callback, amount) {
  this.amount = Number(amount || 1);
  this.callback = callback;
  this.consume = function (user, msg) {
    let entity = user.items.items.find((e) => e.item == this.id);
    if (entity && entity.amount >= this.amount) {
      entity.amount -= this.amount;
      if (entity.amount == 0) {
        user.items.items.splice(user.items.items.indexOf(entity), 1);
        save();
      }
      this.callback(user, msg);
    } else msg.reply(this.name + "가 없습니다.");
  };
}

/**
 * 콘텐츠 클래스, 모든 콘텐츠는 이 클래스를 상속해야 한다.
 * @constructor
 * @param {string} name 이 콘텐츠의 이름, 여러 엑션과 상태창, 도감에 표시됨
 * @param {string} description 이 콘텐츠의 설명, 상태창, 도감에 표시됨
 * @param {string} details 이 콘텐츠의 세부설명, 도감에만 표시됨
 */
function Content(name, description, details) {
  this.name = name;
  this.description = description;
  this.details = details;
}
/**
 * 아이템 클래스, 모든 아이템은 이 클래스를 상속해야 한다.
 * @constructor
 * @extends Content
 * @param {string} name 이 콘텐츠의 이름, 여러 엑션과 상태창, 도감에 표시됨
 * @param {string} description 이 콘텐츠의 설명, 상태창, 도감에 표시됨
 * @param {string} [details] 이 콘텐츠의 세부설명, 도감에만 표시됨
 * @param {number} [health=-1] 내구도, 없으면 영구
 * @param {number} [rare] 이 아이템의 가치, 드랍률과 거래 가격에 영향을 끼침
 * @param {boolean} [dropable=true] 참이면 !돌아다니기 또는 전투 결과로 드랍 가능
 */
function Item(name, description, details, health, rare, dropable) {
  Object.assign(this, new Content(name, description, details));
  this.health = Number(health || -1); //infinity
  this.id = items.length;
  this.dropable = dropable;
  this.rare = rare;
}

/**
 * 포션 소모 아이템 클래스
 * @constructor
 * @extends Item
 * @extends Consumable
 * @param {string} name 이 콘텐츠의 이름, 여러 엑션과 상태창, 도감에 표시됨
 * @param {string} description 이 콘텐츠의 설명, 상태창, 도감에 표시됨
 * @param {string} [details] 이 콘텐츠의 세부설명, 도감에만 표시됨
 * @param {number} [health=-1] 내구도, 없으면 영구
 * @param {number} [rare] 이 아이템의 가치, 드랍률과 거래 가격에 영향을 끼침
 * @param {Buff} buff 버프 객체, 착용자의 스탯을 증폭시켜준다.
 * @param {boolean} [dropable=true] 참이면 !돌아다니기 또는 전투 결과로 드랍 가능
 **/
function Potion(name, description, details, health, rare, buff, dropable) {
  Object.assign(
    this,
    new Item(name, description, details, health, rare, dropable),
    new Consumable((user, msg) => {
      let str = "";
      if (buff.energy) {
        user.energy = Math.min(user.stats.energy, user.energy + buff.energy);
        str += (str ? ", " : "") + "기력이 " + buff.energy + "만큼";
      }
      if (buff.health) {
        user.health = Math.min(user.stats.health, user.helath + buff.health);
        str += (str ? ", " : "") + "체력이 " + buff.health + "만큼";
      }
      if (str) msg.reply(str + " 회복되었다!");
    })
  );

  this.buff = buff;
  this.description =
    this.description +
    "\n   " +
    Object.keys(buff)
      .map((k) => {
        if (k == "health") return "* 체력 회복: +" + buff[k];
        else if (k == "energy") return "* 기력 회복: +" + buff[k];
      })
      .join("\n");
}

/**
 * 무기 클래스
 * @constructor
 * @extends Item
 * @param {string} name 이 콘텐츠의 이름, 여러 엑션과 상태창, 도감에 표시됨
 * @param {string} description 이 콘텐츠의 설명, 상태창, 도감에 표시됨
 * @param {string} [details] 이 콘텐츠의 세부설명, 도감에만 표시됨
 * @param {number} [health=-1] 내구도, 없으면 영구
 * @param {number} [rare] 이 아이템의 가치, 드랍률과 거래 가격에 영향을 끼침
 * @param {number} damage 무기 데미지
 * @param {number} cooldown 쿨다운, 초 단위
 * @param {number} critical_ratio 크리티컬 비율, 기본 데미지에 비례함
 * @param {number} critical_chance 크리티컬 확률, 0~1
 */
function Weapon(
  name,
  description,
  details,
  health,
  rare,
  damage,
  cooldown,
  critical_ratio,
  critical_chance,
  dropable
) {
  Object.assign(
    this,
    new Item(name, description, details, health, rare, dropable)
  );
  this.damage = Number(damage);
  this.cooldown = Number(cooldown);
  this.critical_ratio = Number(critical_ratio);
  this.critical_chance = Number(critical_chance);
  this.type = "weapon";
}

/**
 * 장비 클래스
 * @constructor
 * @extends Item
 * @param {string} name 이 콘텐츠의 이름, 여러 엑션과 상태창, 도감에 표시됨
 * @param {string} description 이 콘텐츠의 설명, 상태창, 도감에 표시됨
 * @param {string} [details] 이 콘텐츠의 세부설명, 도감에만 표시됨
 * @param {number} [health=-1] 내구도, 없으면 영구
 * @param {number} [rare] 이 아이템의 가치, 드랍률과 거래 가격에 영향을 끼침
 * @param {string} armor 방어력, 적 데미지 차감
 * @param {string} type 유형, 장갑 | 신발 | 흉갑 | 헬멧 | 악세서리 | 방패
 */
function Armor(name, description, details, health, rare, armor, type) {
  Object.assign(this, new Item(name, description, details, health, rare));
  this.armor = Number(armor);
  this.type = "armor - " + (type || "others");
}

/**
 * 악세서리 장비 클래스
 * @constructor
 * @extends Armor
 * @param {string} name 이 콘텐츠의 이름, 여러 엑션과 상태창, 도감에 표시됨
 * @param {string} description 이 콘텐츠의 설명, 상태창, 도감에 표시됨
 * @param {string} [details] 이 콘텐츠의 세부설명, 도감에만 표시됨
 * @param {number} [health=-1] 내구도, 없으면 영구
 * @param {number} [rare] 이 아이템의 가치, 드랍률과 거래 가격에 영향을 끼침
 * @param {string} armor 방어력, 적 데미지 차감
 * @param {Buff} buff 버프 객체, 착용자의 스탯을 증폭시켜준다.
 **/
function Accessory(name, description, details, health, rare, armor, buff) {
  Object.assign(
    this,
    new Armor(name, description, details, health, rare, armor, "accessory")
  );
  this.buff = buff;

  this.addBuff = (name, amount) => {
    this.buff[name] = Number(amount);
    return this;
  };
}

/**
 * 유닛 클래스, 모든 유닛은 이 클래스를 상속해야 한다.
 * @constructor
 * @extends Content
 * @param {string} name 이 콘텐츠의 이름, 여러 엑션과 상태창, 도감에 표시됨
 * @param {string} description 이 콘텐츠의 설명, 상태창, 도감에 표시됨
 * @param {string} details 이 콘텐츠의 세부설명, 도감에만 표시됨
 * @param {number} health 내구도, 없으면 영구
 * @param {number} [health=5] 체력, 기본값 5 //TODO: 기력 추가
 * @param {number} [rare=0.1] 희귀도, 기본값 0.1, 0~1 높을수록 드뭄
 * @param {number} [level=1] 레벨, 강함의 척도, 유닛의 데미지나 체력은 희귀도와 레벨에 의해 증폭된다.
 * @param {Item[]} [items=[]] 아이템 인벤토리. //TODO: Items 객체 클래스화
 */
function Unit(name, description, details, health, rare, level, items) {
  Object.assign(this, new Content(name, description, details));
  this.health = Number(health || 5);
  this.level = Number(level || 1);
  this.items = items || [];
  this.rare = Number(rare || 0.1);
  this.id = units.length;
}

//아이템 배열 위치를 바꾸지 않는 한 업데이트가 가능합니다. 절대로 배열을 바꾸지 마세요.
//TODO: 아이템 더 많이 만들기
/**
 * @type {Item[]}
 */
const items = [];
items.push(
  new Weapon(
    "짱돌",
    "길바닥에 돌아다니는 흔한 돌맹이다.",
    "밟으면 아프니 지뢰의 기능을 하고, 던져도 아프니 탄환의 기능을 하며, 크기가 된다면 둔기의 기능으로도 되므로 이것이 바로 모든 무기의 시초로다.\n  =아리스토텔링",
    1,
    0.5,
    1.25,
    0.75,
    1.15,
    0.1,
    true
  )
);
items.push(new Item("조각", "손까락 크기의 정말 작은 조각이다.", "", -1, 0.5));
items.push(
  new Potion("에너지 바", "누군가가 흘린 한입 크기의 에너지 바.", "", -1, 0.1, {
    energy: 10,
  })
);
items.push(
  new Weapon(
    "알루미늄 검",
    "날카롭고 가벼우나 내구성이 매우 약합니다.",
    "",
    20,
    10,
    2,
    1,
    1.15,
    0.25
  )
);
items.push(
  new Weapon(
    "나무 검",
    "내구성이 매우 강한 대신 전혀 날카롭지 않습니다.",
    "",
    80,
    10,
    1.5,
    1.5,
    1.1,
    0.15
  )
);
items.push(
  new Weapon(
    "주먹",
    "인간 병기인 당신은 맨손 주먹을 무기로 선택했다!",
    "",
    -1,
    -1,
    1,
    0.5,
    1.1,
    0.75
  )
);
/**
 * @type {Unit[]}
 */
const units = [];
units.push(
  new Unit(
    "장애물",
    "누가 이런 거대한 장애물을 길바닥에 버려둔 걸까요?",
    "한밤중, 가끔 이 장애물에서 반짝거림을 느낀다.",
    5,
    0.1,
    1
  ),
  new Unit(
    "고블린",
    "저런, 이 잠자는 고블린은 곧 봉변을 맞이할 것입니다.",
    "쿨...",
    2,
    0.3,
    1
  )
);
module.exports = {
  items: items,
  units: units,
};
