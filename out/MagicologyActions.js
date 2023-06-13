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
define(["require", "exports", "game/entity/IEntity", "game/entity/action/Action", "game/entity/action/IAction", "game/entity/action/actions/Attack", "./Magicology", "game/entity/player/IMessageManager", "language/dictionary/Message", "game/item/IItem", "audio/IAudio", "game/entity/IStats", "game/entity/IHuman", "game/entity/creature/ICreature", "language/Translation"], function (require, exports, IEntity_1, Action_1, IAction_1, Attack_1, Magicology_1, IMessageManager_1, Message_1, IItem_1, IAudio_1, IStats_1, IHuman_1, ICreature_1, Translation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createDematerializeAction = exports.createMaterializeAction = exports.createConjureAction = exports.createAttackAction = void 0;
    const createAttackAction = (requiredMana) => new Action_1.Action(IAction_1.ActionArgument.ItemInventory)
        .setUsableBy(IEntity_1.EntityType.Human)
        .setCanUse((action, item) => {
        const mana = action.executor.stat.get(Magicology_1.default.INSTANCE.statMana);
        if (!mana || mana.value < requiredMana) {
            return {
                usable: false,
                message: Magicology_1.default.INSTANCE.messageNotEnoughMana,
                sources: [IMessageManager_1.Source.Equipment, IMessageManager_1.Source.Item],
                errorDisplayLevel: IAction_1.ActionDisplayLevel.Always,
                args: [requiredMana],
            };
        }
        return Attack_1.default.canUse(action, item, IEntity_1.AttackType.RangedWeapon);
    })
        .setHandler((action, item) => {
        const canUse = action.canUse();
        if (!canUse.usable) {
            return;
        }
        action.executor.stat.reduce(Magicology_1.default.INSTANCE.statMana, requiredMana);
        Attack_1.default.execute(action, item, IEntity_1.AttackType.RangedWeapon);
    });
    exports.createAttackAction = createAttackAction;
    const createConjureAction = (requiredMana) => new Action_1.Action(IAction_1.ActionArgument.ItemInventory)
        .setUsableBy(IEntity_1.EntityType.Human)
        .setPreExecutionHandler((action, item) => action.addItems(item))
        .setCanUse((action, item) => {
        const description = item.description;
        if (!description?.use?.some(a => a === Magicology_1.default.INSTANCE.actionConjureFood || a === Magicology_1.default.INSTANCE.actionConjureWater)) {
            return {
                usable: false,
            };
        }
        const mana = action.executor.stat.get(Magicology_1.default.INSTANCE.statMana);
        if (!mana || mana.value < requiredMana) {
            return {
                usable: false,
                message: Magicology_1.default.INSTANCE.messageNotEnoughMana,
                sources: [IMessageManager_1.Source.Equipment, IMessageManager_1.Source.Item],
                errorDisplayLevel: IAction_1.ActionDisplayLevel.Always,
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
        action.executor.stat.reduce(Magicology_1.default.INSTANCE.statMana, requiredMana);
        let conjuredItem;
        switch (item.type) {
            case Magicology_1.default.INSTANCE.itemElementalBakingTray:
                conjuredItem = action.executor.createItemInInventory(IItem_1.ItemTypeGroup.CookedFood, item.quality);
                action.setItemsUsed();
                action.setSoundEffect(IAudio_1.SfxType.Craft);
                action.executor.messages.source(IMessageManager_1.Source.Action, IMessageManager_1.Source.Item)
                    .send(Magicology_1.default.INSTANCE.messageYouConjured, conjuredItem.getName());
                break;
            case Magicology_1.default.INSTANCE.itemElementalGlassBottle:
                conjuredItem = item;
                item.changeInto(Magicology_1.default.INSTANCE.itemElementalGlassBottleOfPurifiedFreshWater);
                action.setSoundEffect(IAudio_1.SfxType.Craft);
                action.executor.messages.source(IMessageManager_1.Source.Action, IMessageManager_1.Source.Item)
                    .send(Message_1.default.Filled, conjuredItem.getName());
                break;
            default:
                return;
        }
        action.executor.stat.reduce(IStats_1.Stat.Stamina, Math.max(Math.floor(conjuredItem.getTotalWeight(true)), 1));
        action.addSkillGains(Magicology_1.default.INSTANCE.skillMagicology);
        action.setPassTurn();
        action.setUpdateTablesAndWeight();
    });
    exports.createConjureAction = createConjureAction;
    const createMaterializeAction = (requiredMana) => new Action_1.Action(IAction_1.ActionArgument.ItemInventory)
        .setUsableBy(IEntity_1.EntityType.Human)
        .setPreExecutionHandler((action, item) => action.addItems(item))
        .setCanUse((action, item) => {
        const description = item.description;
        if (!description?.use?.some(a => a === Magicology_1.default.INSTANCE.actionMaterialize)) {
            return {
                usable: false,
            };
        }
        const mana = action.executor.stat.get(Magicology_1.default.INSTANCE.statMana);
        if (!mana || mana.value < requiredMana) {
            return {
                usable: false,
                message: Magicology_1.default.INSTANCE.messageNotEnoughMana,
                sources: [IMessageManager_1.Source.Equipment, IMessageManager_1.Source.Item],
                errorDisplayLevel: IAction_1.ActionDisplayLevel.Always,
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
                message: Message_1.default.SomethingInTheWayOfSummoning,
                sources: IMessageManager_1.Source.Item,
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
        action.setDelay(IHuman_1.Delay.LongPause);
        const canUse = action.canUse();
        if (!canUse.usable) {
            return;
        }
        const { tile } = canUse;
        let creature = action.executor.island.creatures.spawn(Magicology_1.default.INSTANCE.creatureElementalGolemFigure, tile, false, false, undefined, true);
        if (!creature) {
            tile.findMatchingTile(searchTile => {
                creature = action.executor.island.creatures.spawn(Magicology_1.default.INSTANCE.creatureElementalGolemFigure, searchTile, false, false, ICreature_1.TileGroup.Ground, true);
                return creature !== undefined;
            }, { maxTilesChecked: 27 });
        }
        if (creature) {
            action.executor.stat.reduce(Magicology_1.default.INSTANCE.statMana, requiredMana);
            action.addSkillGains(Magicology_1.default.INSTANCE.skillMagicology);
            creature.tile.createParticles(creature.tile.description?.particles);
            renderers.notifier.suspend();
            creature.tame(action.executor, Number.MAX_SAFE_INTEGER);
            renderers.notifier.resume();
            creature.queueSoundEffect(IAudio_1.SfxType.CreatureNoise);
            creature.skipNextUpdate();
            action.executor.messages.source(IMessageManager_1.Source.Action, IMessageManager_1.Source.Allies, IMessageManager_1.Source.Creature)
                .send(Magicology_1.default.INSTANCE.messageYouHaveMaterialized, creature.getName());
            action.setItemsUsed();
            action.setPassTurn();
            action.setUpdateWeight();
        }
        else {
            action.executor.messages.source(IMessageManager_1.Source.Action, IMessageManager_1.Source.Allies, IMessageManager_1.Source.Creature)
                .type(IMessageManager_1.MessageType.Bad)
                .send(Magicology_1.default.INSTANCE.messageNoRoomForMaterialization, item.getName());
        }
    });
    exports.createMaterializeAction = createMaterializeAction;
    const createDematerializeAction = () => new Action_1.Action(IAction_1.ActionArgument.ItemInventory)
        .setUsableBy(IEntity_1.EntityType.Human)
        .setCanUse((action, item) => {
        const description = item.description;
        if (!description?.use?.some(a => a === Magicology_1.default.INSTANCE.actionDematerialize)) {
            return {
                usable: false,
            };
        }
        const creatures = Magicology_1.default.INSTANCE.getElementalGolems(action.executor);
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
        action.setDelay(IHuman_1.Delay.LongPause);
        const canUse = action.canUse();
        if (!canUse.usable) {
            return;
        }
        const { creatures } = canUse;
        for (const creature of creatures) {
            Magicology_1.default.INSTANCE.dematerialize(creature);
        }
        action.executor.messages.source(IMessageManager_1.Source.Action, IMessageManager_1.Source.Allies, IMessageManager_1.Source.Creature)
            .send(Magicology_1.default.INSTANCE.messageYouHaveDematerialized, Translation_1.default.formatList(creatures.map(creature => creature.getName())));
        action.setPassTurn();
    });
    exports.createDematerializeAction = createDematerializeAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFnaWNvbG9neUFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvTWFnaWNvbG9neUFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OztHQVNHOzs7OztJQW9CSSxNQUFNLGtCQUFrQixHQUFHLENBQUMsWUFBb0IsRUFBRSxFQUFFLENBQUMsSUFBSSxlQUFNLENBQUMsd0JBQWMsQ0FBQyxhQUFhLENBQUM7U0FDL0YsV0FBVyxDQUFDLG9CQUFVLENBQUMsS0FBSyxDQUFDO1NBQzdCLFNBQVMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRTtRQUN4QixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsb0JBQVUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEUsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLFlBQVksRUFBRTtZQUNwQyxPQUFPO2dCQUNILE1BQU0sRUFBRSxLQUFLO2dCQUNiLE9BQU8sRUFBRSxvQkFBVSxDQUFDLFFBQVEsQ0FBQyxvQkFBb0I7Z0JBQ2pELE9BQU8sRUFBRSxDQUFDLHdCQUFNLENBQUMsU0FBUyxFQUFFLHdCQUFNLENBQUMsSUFBSSxDQUFDO2dCQUN4QyxpQkFBaUIsRUFBRSw0QkFBa0IsQ0FBQyxNQUFNO2dCQUM1QyxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUM7YUFDdkIsQ0FBQztTQUNMO1FBRUQsT0FBTyxnQkFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLG9CQUFVLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDaEUsQ0FBQyxDQUFDO1NBQ0QsVUFBVSxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFO1FBQ3pCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUMvQixJQUFJLENBQUMsTUFBTSxDQUFD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