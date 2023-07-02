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
define(["require", "exports", "event/EventManager", "game/doodad/IDoodad", "game/entity/IEntity", "game/entity/IHuman", "game/entity/IStats", "game/entity/StatFactory", "game/entity/action/IAction", "game/entity/creature/ICreature", "game/entity/player/Player", "game/item/IItem", "game/item/ItemDescriptions", "game/tile/ITileEvent", "language/Translation", "mod/Mod", "mod/ModRegistry", "renderer/particle/IParticle", "renderer/particle/Particles", "ui/screen/screens/game/static/stats/StatDisplayDescriptions", "utilities/Color", "audio/IAudio", "game/entity/player/IMessageManager", "./IMagicology", "./MagicologyActions"], function (require, exports, EventManager_1, IDoodad_1, IEntity_1, IHuman_1, IStats_1, StatFactory_1, IAction_1, ICreature_1, Player_1, IItem_1, ItemDescriptions_1, ITileEvent_1, Translation_1, Mod_1, ModRegistry_1, IParticle_1, Particles_1, StatDisplayDescriptions_1, Color_1, IAudio_1, IMessageManager_1, IMagicology_1, MagicologyActions_1) {
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
                            return (0, Color_1.default)(12, 128, 247);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFnaWNvbG9neS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9NYWdpY29sb2d5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7R0FTRzs7Ozs7Ozs7OztJQStCSCxNQUFxQixVQUFXLFNBQVEsYUFBRztRQWdWaEMsc0JBQXNCLENBQUMsTUFBYztZQUc5QyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxFQUFFO2dCQUMvQixJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQzNCO1FBQ0YsQ0FBQztRQUdTLGFBQWEsQ0FBQyxNQUFjO1lBQ3JDLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUNuQyxPQUFPO2FBQ1A7WUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLDRDQUE4QixDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXhILE1BQU0sU0FBUyxHQUFHO2dCQUNqQixJQUFJLENBQUMsd0JBQXdCO2dCQUM3QixJQUFJLENBQUMsY0FBYztnQkFDbkIsSUFBSSxDQUFDLHVCQUF1QjtnQkFDNUIsSUFBSSxDQUFDLHdCQUF3QjtnQkFDN0IsSUFBSSxDQUFDLHdCQUF3QjthQUM3QixDQUFDO1lBRUYsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUU7Z0JBRWpDLElBQUksQ0FBQyxNQUFN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