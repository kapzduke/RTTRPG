import { UserSecure } from "RTTRPG/modules";
import { Contents } from "RTTRPG/game";

namespace Entity {
  export class UnitEntity {
    id: number;
    health: number;
    items: UserSecure.Inventory;
    constructor(unit: Contents.Unit) {
      this.id = unit.id;
      this.health = unit.health;
      this.items = UserSecure.defaultInven;
    }
  }
}

export default Entity;