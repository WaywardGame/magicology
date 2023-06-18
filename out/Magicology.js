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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "event/EventManager", "game/doodad/IDoodad", "game/entity/IEntity", "game/entity/IHuman", "game/entity/IStats", "game/entity/StatFactory", "game/entity/action/IAction", "game/entity/creature/ICreature", "game/entity/player/Player", "game/item/IItem", "game/item/ItemDescriptions", "game/tile/ITileEvent", "language/Translation", "mod/Mod", "mod/ModRegistry", "renderer/particle/IParticle", "renderer/particle/Particles", "ui/screen/screens/game/static/stats/StatDisplayDescriptions", "audio/IAudio", "game/entity/player/IMessageManager", "./IMagicology", "./MagicologyActions"], function (require, exports, EventManager_1, IDoodad_1, IEntity_1, IHuman_1, IStats_1, StatFactory_1, IAction_1, ICreature_1, Player_1, IItem_1, ItemDescriptions_1, ITileEvent_1, Translation_1, Mod_1, ModRegistry_1, IParticle_1, Particles_1, StatDisplayDescriptions_1, IAudio_1, IMessageManager_1, IMagicology_1, MagicologyActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Magicology extends Mod_1.default {
        onPlayerLoadedOnIsland(player) {
            if (!multiplayer.isConnected()) {
                this.onPlayerSpawn(player);
            }
        }
        onPlayerSpawn(player) {
            if (player.stat.has(this.statMana)) {
                return;
            }
            player.stat.set(this.statMana, 100);
            player.stat.setMax(this.statMana, 100);
            player.stat.setChangeTimer(this.statMana, 1, t => t.setCurrentTimer(StatFactory_1.StatChangeCurrentTimerStrategy.Reset).setAmount(1));
            const itemTypes = [
                this.itemElementalWoodenStaff,
                this.itemManaPotion,
                this.itemElementalBakingTray,
                this.itemElementalGlassBottle,
                this.itemElementalGolemFigure,
            ];
            for (const itemType of itemTypes) {
                if (!player.crafted[itemType]) {
                    player.crafted[itemType] = { newUnlock: true, unlockTime: Date.now() };
                }
                if (!player.island.items.isItemInContainer(player.inventory, itemType)) {
                    player.createItemInInventory(itemType);
                }
            }
        }
        onPlayerTickStart(player) {
            if (!player.stat.has(this.statMana)) {
                return;
            }
            const mana = player.stat.get(Magicology.INSTANCE.statMana);
            if (!mana) {
                return;
            }
            const elementalGolems = this.getElementalGolems(player);
            if (elementalGolems.length === 0) {
                if (mana.changeTimer !== 1) {
                    player.stat.setChangeTimer(this.statMana, 1, t => t.setCurrentTimer(StatFactory_1.StatChangeCurrentTimerStrategy.Reset).setAmount(1));
                }
                return;
            }
            if (mana.changeTimer === 1) {
                player.stat.removeChangeTimer(this.statMana);
                return;
            }
            const manaDrain = 2 * elementalGolems.length;
            if (mana.value >= manaDrain) {
                player.stat.reduce(this.statMana, manaDrain);
            }
            else {
                player.stat.reduce(this.statMana, mana.value);
                for (const creature of elementalGolems) {
                    this.dematerialize(creature);
                }
                player.messages.source(IMessageManager_1.Source.Allies, IMessageManager_1.Source.Creature)
                    .send(this.messageYouRanOutOfManaMaterializations);
            }
        }
        getTranslation(translation) {
            return Translation_1.default.get(this.dictionary, translation);
        }
        getElementalGolems(human) {
            const tamedCreatureIds = human.tamedCreatures.get(human.islandId);
            if (!tamedCreatureIds || tamedCreatureIds.size === 0) {
                return [];
            }
            return Array.from(tamedCreatureIds)
                .map(id => human.island.creatures.get(id))
                .filter(creature => creature !== undefined && creature.type === this.creatureElementalGolemFigure);
        }
        dematerialize(creature) {
            creature.queueSoundEffect(IAudio_1.SfxType.CreatureNoise);
            creature.tile.createParticles(creature.tile.description?.particles);
            renderers.notifier.suspend();
            creature.island.creatures.remove(creature);
            renderers.notifier.resume();
        }
    }
    exports.default = Magicology;
    __decorate([
        ModRegistry_1.default.dictionary("Magicology", IMagicology_1.MagicologyTranslation)
    ], Magicology.prototype, "dictionary", void 0);
    __decorate([
        ModRegistry_1.default.message("YouConjured")
    ], Magicology.prototype, "messageYouConjured", void 0);
    __decorate([
        ModRegistry_1.default.message("YouShootMagicalAttack")
    ], Magicology.prototype, "messageYouShootMagicalAttack", void 0);
    __decorate([
        ModRegistry_1.default.message("NoRoomForMaterialization")
    ], Magicology.prototype, "messageNoRoomForMaterialization", void 0);
    __decorate([
        ModRegistry_1.default.message("YouHaveMaterialized")
    ], Magicology.prototype, "messageYouHaveMaterialized", void 0);
    __decorate([
        ModRegistry_1.default.message("YouHaveDematerialized")
    ], Magicology.prototype, "messageYouHaveDematerialized", void 0);
    __decorate([
        ModRegistry_1.default.message("YouRanOutOfManaMaterializations")
    ], Magicology.prototype, "messageYouRanOutOfManaMaterializations", void 0);
    __decorate([
        ModRegistry_1.default.message("NotEnoughMana")
    ], Magicology.prototype, "messageNotEnoughMana", void 0);
    __decorate([
        ModRegistry_1.default.stat("Mana", {
            color: "var(--color-stat-modmagicologymana)",
            rgbColor: "var(--color-stat-modmagicologymana-rgb)",
            darkColor: "var(--color-stat-modmagicologymana-dark)",
            displayType: IStats_1.StatDisplayType.Statbar,
            displayOrder: 5,
            tooltip: (tooltip, entity, stat) => tooltip
                .addBlock(block => block
                .addParagraph(text => text.setText(Magicology.INSTANCE.getTranslation(IMagicology_1.MagicologyTranslation.GameStatsStatManaTooltip)))),
            onChange: [
                (0, StatDisplayDescriptions_1.when)(stat => stat.percent < 0.1, (0, StatDisplayDescriptions_1.toggleClasses)("flash")),
                (0, StatDisplayDescriptions_1.when)(stat => stat.value < (stat.oldValue ?? 0), StatDisplayDescriptions_1.shake),
            ],
        })
    ], Magicology.prototype, "statMana", void 0);
    __decorate([
        ModRegistry_1.default.skill("Magicology", {
            attribute: {
                stat: (0, ModRegistry_1.Registry)().get("statMana"),
                gainChanceOffset: -90,
                gainMultiplier: 5,
            },
        })
    ], Magicology.prototype, "skillMagicology", void 0);
    __decorate([
        ModRegistry_1.default.action("Fireball", (0, MagicologyActions_1.createAttackAction)(10))
    ], Magicology.prototype, "actionFireball", void 0);
    __decorate([
        ModRegistry_1.default.action("Frostbolt", (0, MagicologyActions_1.createAttackAction)(10))
    ], Magicology.prototype, "actionFrostbolt", void 0);
    __decorate([
        ModRegistry_1.default.action("ConjureFood", (0, MagicologyActions_1.createConjureAction)(80))
    ], Magicology.prototype, "actionConjureFood", void 0);
    __decorate([
        ModRegistry_1.default.action("ConjureWater", (0, MagicologyActions_1.createConjureAction)(80))
    ], Magicology.prototype, "actionConjureWater", void 0);
    __decorate([
        ModRegistry_1.default.action("Materialize", (0, MagicologyActions_1.createMaterializeAction)(50))
    ], Magicology.prototype, "actionMaterialize", void 0);
    __decorate([
        ModRegistry_1.default.action("Dematerialize", (0, MagicologyActions_1.createDematerializeAction)())
    ], Magicology.prototype, "actionDematerialize", void 0);
    __decorate([
        ModRegistry_1.default.item("elementalWoodenStaff", {
            equip: IHuman_1.EquipType.Held,
            durability: 25,
            equipEffect: [IItem_1.EquipEffect.LightSource, 2],
            attack: 3,
            damageType: IEntity_1.DamageType.Blunt,
            ranged: {
                range: 8,
                attack: 5,
                ammunitionType: (action) => {
                    switch (action.actionStack[0]) {
                        case Magicology.INSTANCE.actionFireball:
                            return Magicology.INSTANCE.itemFireball;
                        case Magicology.INSTANCE.actionFrostbolt:
                            return Magicology.INSTANCE.itemFrostbolt;
                    }
                    return undefined;
                },
                particles: (action) => {
                    switch (action.actionStack[0]) {
                        case Magicology.INSTANCE.actionFireball:
                            return Particles_1.default[IParticle_1.ParticleType.Fire];
                        case Magicology.INSTANCE.actionFrostbolt:
                            return Particles_1.default[IParticle_1.ParticleType.Water];
                    }
                    return undefined;
                },
                skillType: (0, ModRegistry_1.Registry)().get("skillMagicology"),
                unlimitedAmmunition: true,
                attackMessage: (0, ModRegistry_1.Registry)().get("messageYouShootMagicalAttack"),
            },
            use: [
                (0, ModRegistry_1.Registry)().get("actionFireball"),
                (0, ModRegistry_1.Registry)().get("actionFrostbolt"),
            ],
            recipe: {
                components: [
                    (0, ItemDescriptions_1.RecipeComponent)(IItem_1.ItemType.Lens, 1, 1, 1),
                    (0, ItemDescriptions_1.RecipeComponent)(IItem_1.ItemType.Log, 1, 1, 1),
                    (0, ItemDescriptions_1.RecipeComponent)(IItem_1.ItemType.WoodenPole, 4, 1, 1),
                    (0, ItemDescriptions_1.RecipeComponent)(IItem_1.ItemType.String, 1, 1, 1),
                    (0, ItemDescriptions_1.RecipeComponent)(IItem_1.ItemTypeGroup.Sharpened, 1, 0),
                ],
                skill: (0, ModRegistry_1.Registry)().get("skillMagicology"),
                level: IItem_1.RecipeLevel.Advanced,
                reputation: 10,
            },
            flammable: true,
            burnsLike: [IItem_1.ItemType.WoodenPole, IItem_1.ItemType.Sinew],
            group: [IItem_1.ItemTypeGroup.Weapon, IItem_1.ItemTypeGroup.TwoHanded],
        })
    ], Magicology.prototype, "itemElementalWoodenStaff", void 0);
    __decorate([
        ModRegistry_1.default.item("manaPotion", {
            inheritWeight: IItem_1.ItemType.GlassBottle,
            use: [IAction_1.ActionType.DrinkItem],
            onUse: {
                [IAction_1.ActionType.DrinkItem]: [0, 0, 0, 0, [{
                            stat: (0, ModRegistry_1.Registry)().get("statMana"),
                            amount: 50,
                        }]],
            },
            recipe: {
                baseComponent: IItem_1.ItemType.GlassBottle,
                components: [
                    (0, ItemDescriptions_1.RecipeComponent)(IItem_1.ItemTypeGroup.Fruit, 2, 2),
                ],
                skill: (0, ModRegistry_1.Registry)().get("skillMagicology"),
                level: IItem_1.RecipeLevel.Advanced,
                requiresFire: true,
                reputation: 25,
            },
            skillUse: (0, ModRegistry_1.Registry)().get("skillMagicology"),
            durability: 15,
            returnOnUseAndDecay: {
                type: IItem_1.ItemType.GlassBottle,
                damaged: true,
                whenCrafted: true,
            },
            keepDurabilityOnCraft: true,
            noCraftingQualityBonus: true,
            repairable: false,
            worth: 50,
            group: [IItem_1.ItemTypeGroup.Medicinal],
        })
    ], Magicology.prototype, "itemManaPotion", void 0);
    __decorate([
        ModRegistry_1.default.item("elementalBakingTray", {
            use: [(0, ModRegistry_1.Registry)().get("actionConjureFood")],
            durability: 25,
            recipe: {
                baseComponent: IItem_1.ItemTypeGroup.Cookware,
                components: [
                    (0, ItemDescriptions_1.RecipeComponent)(IItem_1.ItemTypeGroup.Treasure, 1, 1),
                ],
                skill: (0, ModRegistry_1.Registry)().get("skillMagicology"),
                level: IItem_1.RecipeLevel.Advanced,
                requiredDoodads: [IDoodad_1.DoodadTypeGroup.Anvil],
                requiresFire: true,
                reputation: 25,
            },
            requiredForDisassembly: [IItem_1.ItemTypeGroup.Hammer, IItem_1.ItemTypeGroup.SandCastFlask],
            worth: 150,
            tier: {
                [IItem_1.ItemTypeGroup.CookingEquipment]: 5,
                [IItem_1.ItemTypeGroup.Cookware]: 3,
            },
            group: [IItem_1.ItemTypeGroup.Cookware, IItem_1.ItemTypeGroup.CookingEquipment],
        })
    ], Magicology.prototype, "itemElementalBakingTray", void 0);
    __decorate([
        ModRegistry_1.default.item("elementalGlassBottle", {
            use: [(0, ModRegistry_1.Registry)().get("actionConjureWater")],
            recipe: {
                baseComponent: IItem_1.ItemType.GlassBottle,
                components: [
                    (0, ItemDescriptions_1.RecipeComponent)(IItem_1.ItemTypeGroup.WispContainer, 1, 1),
                ],
                skill: (0, ModRegistry_1.Registry)().get("skillMagicology"),
                level: IItem_1.RecipeLevel.Advanced,
                requiresFire: true,
                reputation: 25,
            },
            durability: 15,
            worth: 50,
            group: [IItem_1.ItemTypeGroup.LiquidContainer],
        })
    ], Magicology.prototype, "itemElementalGlassBottle", void 0);
    __decorate([
        ModRegistry_1.default.item("elementalGlassBottleOfPurifiedFreshWater", {
            inheritWeight: (0, ModRegistry_1.Registry)().get("itemElementalGlassBottle"),
            use: [IAction_1.ActionType.DrinkItem, IAction_1.ActionType.Pour, IAction_1.ActionType.PourOnYourself],
            durability: 15,
            returnOnUseAndDecay: {
                type: (0, ModRegistry_1.Registry)().get("itemElementalGlassBottle"),
                damaged: true,
                whenCrafted: true,
            },
            keepDurabilityOnCraft: true,
            repairable: false,
            onUse: {
                [IAction_1.ActionType.DrinkItem]: [1, 25, 1, 10],
                [IAction_1.ActionType.Pour]: ITileEvent_1.TileEventType.PuddleOfPurifiedFreshWater,
                [IAction_1.ActionType.PourOnYourself]: ITileEvent_1.TileEventType.PuddleOfPurifiedFreshWater,
            },
            worth: 100,
            tier: {
                [IItem_1.ItemTypeGroup.Liquid]: 2,
            },
            createOnBreak: {
                tileEventType: ITileEvent_1.TileEventType.PuddleOfPurifiedFreshWater,
            },
            createTileEventOnCraft: ITileEvent_1.TileEventType.PuddleOfPurifiedFreshWater,
            noCraftingQualityBonus: true,
            group: [IItem_1.ItemTypeGroup.ContainerWithLiquid, IItem_1.ItemTypeGroup.GlassBottleOfPotableWater, IItem_1.ItemTypeGroup.ContainerOfPurifiedFreshWater, IItem_1.ItemTypeGroup.FireExtinguisher, IItem_1.ItemTypeGroup.Liquid],
        })
    ], Magicology.prototype, "itemElementalGlassBottleOfPurifiedFreshWater", void 0);
    __decorate([
        ModRegistry_1.default.item("elementalGolemFigure", {
            use: [(0, ModRegistry_1.Registry)().get("actionMaterialize"), (0, ModRegistry_1.Registry)().get("actionDematerialize")],
            recipe: {
                baseComponent: IItem_1.ItemTypeGroup.Golem,
                components: [
                    (0, ItemDescriptions_1.RecipeComponent)(IItem_1.ItemTypeGroup.Treasure, 1, 1),
                ],
                skill: (0, ModRegistry_1.Registry)().get("skillMagicology"),
                level: IItem_1.RecipeLevel.Advanced,
                reputation: 100,
            },
            flammable: true,
            worth: 1100,
            durability: 25,
            burnsLike: [IItem_1.ItemType.Log, IItem_1.ItemType.Log, IItem_1.ItemType.Log, IItem_1.ItemType.Log, IItem_1.ItemType.Log, IItem_1.ItemType.Log, IItem_1.ItemType.Amber],
            group: [IItem_1.ItemTypeGroup.Golem, IItem_1.ItemTypeGroup.NotStockedOnMerchants],
        })
    ], Magicology.prototype, "itemElementalGolemFigure", void 0);
    __decorate([
        ModRegistry_1.default.item("fireball", {
            attack: 5,
            damageType: IEntity_1.DamageType.Fire,
            lightSource: true,
            lightColor: { r: 109, g: 0, b: 56 },
        })
    ], Magicology.prototype, "itemFireball", void 0);
    __decorate([
        ModRegistry_1.default.item("frostbolt", {
            attack: 5,
            damageType: IEntity_1.DamageType.Cold,
            lightSource: true,
            lightColor: { r: 109, g: 0, b: 56 },
        })
    ], Magicology.prototype, "itemFrostbolt", void 0);
    __decorate([
        ModRegistry_1.default.creature("elementalGolem", {
            minhp: 123,
            maxhp: 130,
            minatk: 35,
            maxatk: 44,
            defense: new IEntity_1.Defense(12)
                .setResistance(IEntity_1.DamageType.Piercing, 8)
                .setResistance(IEntity_1.DamageType.Blunt, 6),
            damageType: IEntity_1.DamageType.Blunt,
            ai: IEntity_1.AiType.Neutral,
            moveType: IEntity_1.MoveType.Land | IEntity_1.MoveType.ShallowWater | IEntity_1.MoveType.BreakDoodads | IEntity_1.MoveType.BreakItems,
            spawnTiles: ICreature_1.TileGroup.DefaultWithWater,
            makeNoise: true,
            reputation: 0,
            canTrample: true,
            skipMovementChance: 5,
            weight: 30.8,
            aberrantWeight: 52.3,
            blood: { r: 37, g: 37, b: 39 },
            preventRelease: true,
            alwaysAllowCommands: true,
        }, {
            resource: [
                { item: IItem_1.ItemType.MagicalEssence, chance: 30 },
                { item: IItem_1.ItemType.Basalt },
                { item: IItem_1.ItemType.Sapphire, chance: 30 },
                { item: IItem_1.ItemType.Basalt },
                { item: IItem_1.ItemType.Basalt },
                { item: IItem_1.ItemType.Basalt },
                { item: IItem_1.ItemType.Basalt },
            ],
            aberrantResource: [
                { item: IItem_1.ItemType.MagicalEssence, chance: 30 },
                { item: IItem_1.ItemType.Basalt },
                { item: IItem_1.ItemType.Sapphire, chance: 30 },
                { item: IItem_1.ItemType.Basalt },
                { item: IItem_1.ItemType.Sapphire, chance: 30 },
                { item: IItem_1.ItemType.Basalt },
                { item: IItem_1.ItemType.Sapphire, chance: 30 },
                { item: IItem_1.ItemType.Basalt },
                { item: IItem_1.ItemType.Sapphire, chance: 30 },
                { item: IItem_1.ItemType.Basalt },
                { item: IItem_1.ItemType.Sapphire, chance: 30 },
                { item: IItem_1.ItemType.Basalt },
                { item: IItem_1.ItemType.Basalt },
                { item: IItem_1.ItemType.Basalt },
            ],
            skill: IHuman_1.SkillType.Mining,
        })
    ], Magicology.prototype, "creatureElementalGolemFigure", void 0);
    __decorate([
        (0, EventManager_1.EventHandler)(Player_1.default, "loadedOnIsland")
    ], Magicology.prototype, "onPlayerLoadedOnIsland", null);
    __decorate([
        (0, EventManager_1.EventHandler)(Player_1.default, "spawn")
    ], Magicology.prototype, "onPlayerSpawn", null);
    __decorate([
        (0, EventManager_1.EventHandler)(Player_1.default, "tickStart")
    ], Magicology.prototype, "onPlayerTickStart", null);
    __decorate([
        Mod_1.default.instance("Magicology")
    ], Magicology, "INSTANCE", void 0);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFnaWNvbG9neS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9NYWdpY29sb2d5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7R0FTRzs7Ozs7Ozs7OztJQThCSCxNQUFxQixVQUFXLFNBQVEsYUFBRztRQWdWaEMsc0JBQXNCLENBQUMsTUFBYztZQUc5QyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxFQUFFO2dCQUMvQixJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQzNCO1FBQ0YsQ0FBQztRQUdTLGFBQWEsQ0FBQyxNQUFjO1lBQ3JDLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUNuQyxPQUFPO2FBQ1A7WUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLDRDQUE4QixDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXhILE1BQU0sU0FBUyxHQUFHO2dCQUNqQixJQUFJLENBQUMsd0JBQXdCO2dCQUM3QixJQUFJLENBQUMsY0FBYztnQkFDbkIsSUFBSSxDQUFDLHVCQUF1QjtnQkFDNUIsSUFBSSxDQUFDLHdCQUF3QjtnQkFDN0IsSUFBSSxDQUFDLHdCQUF3QjthQUM3QixDQUFDO1lBRUYsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUU7Z0JBRWpDLElBQUksQ0FBQyxNQUFN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