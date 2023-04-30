import { ActionType } from "game/entity/action/IAction";
import { SkillType } from "game/entity/IHuman";
import { Stat } from "game/entity/IStats";
import { ItemType } from "game/item/IItem";
import Mod from "mod/Mod";
import Dictionary from "language/Dictionary";
import Player from "game/entity/player/Player";
import Message from "language/dictionary/Message";
import { CreatureType } from "game/entity/creature/ICreature";
import Creature from "game/entity/creature/Creature";
import { MagicologyTranslation } from "./IMagicology";
import Human from "game/entity/Human";
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
    protected onPlayerSpawn(player: Player): void;
    protected onPlayerTickStart(player: Player): void;
    getTranslation(translation: MagicologyTranslation): import("../node_modules/@wayward/types/definitions/game/language/impl/TranslationImpl").default;
    getElementalGolems(human: Human): Creature[];
    dematerialize(creature: Creature): void;
}
