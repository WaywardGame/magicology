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
        onPlayerSpawn(player) {
            if (!player.stat.has(this.statMana)) {
                player.stat.set(this.statMana, 100);
                player.stat.setMax(this.statMana, 100);
                player.stat.setChangeTimer(this.statMana, 1, t => t.setCurrentTimer(StatFactory_1.StatChangeCurrentTimerStrategy.Reset).setAmount(1));
            }
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
            durability: 500,
            equipEffect: [IItem_1.EquipEffect.LightSource, 2],
            attack: 10,
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
                    (0, ItemDescriptions_1.RecipeComponent)(IItem_1.ItemType.MagicalBinding, 1, 1),
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
            durability: 100,
            recipe: {
                baseComponent: IItem_1.ItemTypeGroup.Cookware,
                components: [
                    (0, ItemDescriptions_1.RecipeComponent)(IItem_1.ItemType.MagicalBinding, 1, 1),
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
                    (0, ItemDescriptions_1.RecipeComponent)(IItem_1.ItemType.MagicalBinding, 1, 1),
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
                    (0, ItemDescriptions_1.RecipeComponent)(IItem_1.ItemType.MagicalBinding, 1, 1),
                ],
                skill: (0, ModRegistry_1.Registry)().get("skillMagicology"),
                level: IItem_1.RecipeLevel.Advanced,
                reputation: 100,
            },
            flammable: true,
            worth: 1100,
            durability: 50,
            burnsLike: [IItem_1.ItemType.Log, IItem_1.ItemType.Log, IItem_1.ItemType.Log, IItem_1.ItemType.Log, IItem_1.ItemType.Log, IItem_1.ItemType.Log, IItem_1.ItemType.Amber],
            group: [IItem_1.ItemTypeGroup.Golem, IItem_1.ItemTypeGroup.NotForSale],
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
        (0, EventManager_1.EventHandler)(Player_1.default, "spawn")
    ], Magicology.prototype, "onPlayerSpawn", null);
    __decorate([
        (0, EventManager_1.EventHandler)(Player_1.default, "tickStart")
    ], Magicology.prototype, "onPlayerTickStart", null);
    __decorate([
        Mod_1.default.instance("Magicology")
    ], Magicology, "INSTANCE", void 0);
    exports.default = Magicology;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFnaWNvbG9neS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9NYWdpY29sb2d5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztJQTRCQSxNQUFxQixVQUFXLFNBQVEsYUFBRztRQWdWaEMsYUFBYSxDQUFDLE1BQWM7WUFDckMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDcEMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDcEMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDdkMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLDRDQUE4QixDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3hIO1lBRUQsTUFBTSxTQUFTLEdBQUc7Z0JBQ2pCLElBQUksQ0FBQyx3QkFBd0I7Z0JBQzdCLElBQUksQ0FBQyxjQUFjO2dCQUNuQixJQUFJLENBQUMsdUJBQXVCO2dCQUM1QixJQUFJLENBQUMsd0JBQXdCO2dCQUM3QixJQUFJLENBQUMsd0JBQXdCO2FBQzdCLENBQUM7WUFFRixLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRTtnQkFFakMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQzlCLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztpQkFD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