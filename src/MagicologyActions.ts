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

import { EntityType, AttackType } from "game/entity/IEntity";
import { Action } from "game/entity/action/Action";
import { ActionArgument, ActionDisplayLevel, IActionUsable } from "game/entity/action/IAction";
import Attack from "game/entity/action/actions/Attack";

import Magicology from "./Magicology";
import { MessageType, Source } from "game/entity/player/IMessageManager";
import Message from "language/dictionary/Message";
import { ItemTypeGroup } from "game/item/IItem";
import { SfxType } from "audio/IAudio";
import { Stat } from "game/entity/IStats";
import Item from "game/item/Item";
import Tile from "game/tile/Tile";
import { Delay } from "game/entity/IHuman";
import { TileGroup } from "game/entity/creature/ICreature";
import Creature from "game/entity/creature/Creature";
import Translation from "language/Translation";

export const createAttackAction = (requiredMana: number) => new Action(ActionArgument.ItemInventory)
    .setUsableBy(EntityType.Human)
    .setCanUse((action, item) => {
        const mana = action.executor.stat.get(Magicology.INSTANCE.statMana);
        if (!mana || mana.value < requiredMana) {
            return {
                usable: false,
                message: Magicology.INSTANCE.messageNotEnoughMana,
                sources: [Source.Equipment, Source.Item],
                errorDisplayLevel: ActionDisplayLevel.Always,
                args: [requiredMana],
            };
        }

        return Attack.canUse(action, item, AttackType.RangedWeapon);
    })
    .setHandler((action, item) => {
        const canUse = action.canUse();
        if (!canUse.usable) {
            return;
        }

        action.executor.stat.reduce(Magicology.INSTANCE.statMana, requiredMana);

        Attack.execute(action, item, AttackType.RangedWeapon);
    });

export const createConjureAction = (requiredMana: number) => new Action(ActionArgument.ItemInventory)
    .setUsableBy(EntityType.Human)
    .setPreExecutionHandler((action, item) => action.addItems(item))
    .setCanUse((action, item) => {
        const description = item.description;
        if (!description?.use?.some(a => a === Magicology.INSTANCE.actionConjureFood || a === Magicology.INSTANCE.actionConjureWater)) {
            return {
                usable: false,
            };
        }

        const mana = action.executor.stat.get(Magicology.INSTANCE.statMana);
        if (!mana || mana.value < requiredMana) {
            return {
                usable: false,
                message: Magicology.INSTANCE.messageNotEnoughMana,
                sources: [Source.Equipment, Source.Item],
                errorDisplayLevel: ActionDisplayLevel.Always,
                args: [requiredMana],
            };
        }

        return {
            usable: true,
        };
    })
    .setHandler((action, item) => {
        const canUse = action.canUse();
        if (!canUse.usable) {
            return;
        }

        action.executor.stat.reduce(Magicology.INSTANCE.statMana, requiredMana);

        let conjuredItem: Item;

        switch (item.type) {

            case Magicology.INSTANCE.itemElementalBakingTray:
                conjuredItem = action.executor.createItemInInventory(ItemTypeGroup.CookedFood, item.quality);

                action.setItemsUsed();
                action.setSoundEffect(SfxType.Craft);
                action.executor.messages.source(Source.Action, Source.Item)
                    .send(Magicology.INSTANCE.messageYouConjured, conjuredItem.getName());

                break;

            case Magicology.INSTANCE.itemElementalGlassBottle:
                conjuredItem = item;

                item.changeInto(Magicology.INSTANCE.itemElementalGlassBottleOfPurifiedFreshWater);

                // note: not calling setItemsUsed now - the durability will decrease when using the fresh water
                action.setSoundEffect(SfxType.Craft);
                action.executor.messages.source(Source.Action, Source.Item)
                    .send(Message.Filled, conjuredItem.getName());

                break;

            default:
                return;
        }

        action.executor.stat.reduce(Stat.Stamina, Math.max(Math.floor(conjuredItem.getTotalWeight(true)), 1));

        action.addSkillGains(Magicology.INSTANCE.skillMagicology);

        action.setPassTurn();
        action.setUpdateTablesAndWeight();
    });

interface IMaterializeCanUse extends IActionUsable {
    tile: Tile;
}

export const createMaterializeAction = (requiredMana: number) => new Action(ActionArgument.ItemInventory)
    .setUsableBy(EntityType.Human)
    .setPreExecutionHandler((action, item) => action.addItems(item))
    .setCanUse<IMaterializeCanUse>((action, item) => {
        const description = item.description;
        if (!description?.use?.some(a => a === Magicology.INSTANCE.actionMaterialize)) {
            return {
                usable: false,
            };
        }

        const mana = action.executor.stat.get(Magicology.INSTANCE.statMana);
        if (!mana || mana.value < requiredMana) {
            return {
                usable: false,
                message: Magicology.INSTANCE.messageNotEnoughMana,
                sources: [Source.Equipment, Source.Item],
                errorDisplayLevel: ActionDisplayLevel.Always,
                args: [requiredMana],
            };
        }

        const tile = action.executor.facingTile;
        if (!tile) {
            return {
                usable: false,
            };
        }

        const canProtectedItemBeUsed = action.canProtectedItemBeUsed({ consumedItems: item });
        if (canProtectedItemBeUsed !== true) {
            return canProtectedItemBeUsed;
        }

        if (action.isCreatureBlocking(tile) || tile.npc !== undefined || tile.isPlayerOnTile()) {
            return {
                usable: false,
                message: Message.SomethingInTheWayOfSummoning,
                sources: Source.Item,
                args: item.getName(),
                mobCheckTile: tile,
            };
        }

        return {
            usable: true,
            tile,
        };
    })
    .setHandler((action, item) => {
        action.setDelay(Delay.LongPause);

        const canUse = action.canUse();
        if (!canUse.usable) {
            return;
        }

        const { tile } = canUse;

        let creature = action.executor.island.creatures.spawn(Magicology.INSTANCE.creatureElementalGolemFigure, tile, false, false, undefined, true);
        if (!creature) {
            // fan out from the tile and try spawning it
            tile.findMatchingTile(searchTile => {
                creature = action.executor.island.creatures.spawn(Magicology.INSTANCE.creatureElementalGolemFigure, searchTile, false, false, TileGroup.Ground, true);
                return creature !== undefined;
            }, { maxTilesChecked: 27 });
        }

        if (creature) {
            action.executor.stat.reduce(Magicology.INSTANCE.statMana, requiredMana);

            action.addSkillGains(Magicology.INSTANCE.skillMagicology);

            creature.tile.createParticles(creature.tile.description?.particles);

            // serve the player forever
            renderers.notifier.suspend();
            creature.tame(action.executor, Number.MAX_SAFE_INTEGER);
            renderers.notifier.resume();

            creature.queueSoundEffect(SfxType.CreatureNoise);
            creature.skipNextUpdate();

            action.executor.messages.source(Source.Action, Source.Allies, Source.Creature)
                .send(Magicology.INSTANCE.messageYouHaveMaterialized, creature.getName());

            action.setItemsUsed();
            action.setPassTurn();
            action.setUpdateWeight();

        } else {
            action.executor.messages.source(Source.Action, Source.Allies, Source.Creature)
                .type(MessageType.Bad)
                .send(Magicology.INSTANCE.messageNoRoomForMaterialization, item.getName());
        }
    });

interface IDematerializeCanUse extends IActionUsable {
    creatures: Creature[];
}

export const createDematerializeAction = () => new Action(ActionArgument.ItemInventory)
    .setUsableBy(EntityType.Human)
    .setCanUse<IDematerializeCanUse>((action, item) => {
        const description = item.description;
        if (!description?.use?.some(a => a === Magicology.INSTANCE.actionDematerialize)) {
            return {
                usable: false,
            };
        }

        const creatures = Magicology.INSTANCE.getElementalGolems(action.executor);
        if (creatures.length === 0) {
            return {
                usable: false,
            };
        }

        return {
            usable: true,
            creatures,
        };
    })
    .setHandler((action, item) => {
        action.setDelay(Delay.LongPause);

        const canUse = action.canUse();
        if (!canUse.usable) {
            return;
        }

        const { creatures } = canUse;

        for (const creature of creatures) {
            Magicology.INSTANCE.dematerialize(creature);
        }

        action.executor.messages.source(Source.Action, Source.Allies, Source.Creature)
            .send(Magicology.INSTANCE.messageYouHaveDematerialized, Translation.formatList(creatures.map(creature => creature.getName())));

        action.setPassTurn();
    });