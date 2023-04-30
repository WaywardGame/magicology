import { Action } from "game/entity/action/Action";
import { ActionArgument, IActionUsable } from "game/entity/action/IAction";
import Item from "game/item/Item";
import Tile from "game/tile/Tile";
import Creature from "game/entity/creature/Creature";
export declare const createAttackAction: (requiredMana: number) => Action<[ActionArgument.ItemInventory], import("../node_modules/@wayward/types/definitions/game/game/entity/Human").default<number>, void, import("game/entity/action/actions/Attack").IAttackCloseUpCanUse | import("game/entity/action/actions/Attack").IAttackThrowItemCanUse | import("game/entity/action/actions/Attack").IAttackRangedWeaponCanUse, [Item]>;
export declare const createConjureAction: (requiredMana: number) => Action<[ActionArgument.ItemInventory], import("../node_modules/@wayward/types/definitions/game/game/entity/Human").default<number>, void, IActionUsable, [Item]>;
interface IMaterializeCanUse extends IActionUsable {
    tile: Tile;
}
export declare const createMaterializeAction: (requiredMana: number) => Action<[ActionArgument.ItemInventory], import("../node_modules/@wayward/types/definitions/game/game/entity/Human").default<number>, void, IMaterializeCanUse, [Item]>;
interface IDematerializeCanUse extends IActionUsable {
    creatures: Creature[];
}
export declare const createDematerializeAction: () => Action<[ActionArgument.ItemInventory], import("../node_modules/@wayward/types/definitions/game/game/entity/Human").default<number>, void, IDematerializeCanUse, [Item]>;
export {};
