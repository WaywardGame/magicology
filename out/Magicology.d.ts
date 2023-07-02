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
import { SkillType } from "game/entity/IHuman";
import { Stat } from "game/entity/IStats";
import { ActionType } from "game/entity/action/IAction";
import Creature from "game/entity/creature/Creature";
import { CreatureType } from "game/entity/creature/ICreature";
import Player from "game/entity/player/Player";
import { ItemType } from "game/item/IItem";
import Dictionary from "language/Dictionary";
import Message from "language/dictionary/Message";
import Mod from "mod/Mod";
import Human from "game/entity/Human";
import { MagicologyTranslation } from "./IMagicology";
export default class Magicology extends Mod {
    static readonly INSTANCE: Magicology;
    readonly dictionary: Dictionary;
    readonly messageYouConjured: Message;
    readonly messageYouShootMagicalAttack: Message;
    readonly messageNoRoomForMaterialization: Message;
    readonly messageYouHaveMaterialized: Message;
    readonly messageYouHaveDematerialized: Message;
    readonly messageYouRanOutOfManaMaterializations: Message;
    readonly messageNotEnoughMana: Message;
    readonly statMana: Stat;
    readonly skillMagicology: SkillType;
    readonly actionFireball: ActionType;
    readonly actionFrostbolt: ActionType;
    readonly actionConjureFood: ActionType;
    readonly actionConjureWater: ActionType;
    readonly actionMaterialize: ActionType;
    readonly actionDematerialize: ActionType;
    itemElementalWoodenStaff: ItemType;
    itemManaPotion: ItemType;
    itemElementalBakingTray: ItemType;
    itemElementalGlassBottle: ItemType;
    itemElementalGlassBottleOfPurifiedFreshWater: ItemType;
    itemElementalGolemFigure: ItemType;
    itemFireball: ItemType;
    itemFrostbolt: ItemType;
    creatureElementalGolemFigure: CreatureType;
    protected onPlayerLoadedOnIsland(player: Player): void;
    protected onPlayerSpawn(player: Player): void;
    protected onPlayerTickStart(player: Player): void;
    getTranslation(translation: MagicologyTranslation): import("../node_modules/@wayward/types/definitions/game/language/impl/TranslationImpl").default;
    getElementalGolems(human: Human): Creature[];
    dematerialize(creature: Creature): void;
}
