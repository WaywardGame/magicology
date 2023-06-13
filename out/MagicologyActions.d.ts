/*!
 * Copyright 2011-2023 Unlok
 * https://www.unlok.ca
 *
 * Credits & Thanks:
 * https://www.unlok.ca/credits-thanks/
 *
 * Wayward is a copyrighted and licensed work. Modification and/or distribution of any source files is prohibited. If you wish to modify the game in any way, please refer to the modding guide:
 * https://github.com/WaywardGame/types/wiki
 */
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
