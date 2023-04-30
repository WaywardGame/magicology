var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "event/EventManager", "game/entity/action/IAction", "game/entity/IEntity", "game/entity/IHuman", "game/entity/IStats", "game/item/IItem", "game/item/ItemDescriptions", "mod/Mod", "mod/ModRegistry", "ui/screen/screens/game/static/stats/StatDisplayDescriptions", "language/Translation", "game/entity/player/Player", "game/entity/StatFactory", "renderer/particle/Particles", "renderer/particle/IParticle", "game/tile/ITileEvent", "game/doodad/IDoodad", "game/entity/creature/ICreature", "./MagicologyActions", "./IMagicology", "audio/IAudio", "game/entity/player/IMessageManager"], function (require, exports, EventManager_1, IAction_1, IEntity_1, IHuman_1, IStats_1, IItem_1, ItemDescriptions_1, Mod_1, ModRegistry_1, StatDisplayDescriptions_1, Translation_1, Player_1, StatFactory_1, Particles_1, IParticle_1, ITileEvent_1, IDoodad_1, ICreature_1, MagicologyActions_1, IMagicology_1, IAudio_1, IMessageManager_1) {
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
            color: "darkblue",
            rgbColor: "var(--color-stat-thirst-rgb)",
            darkColor: "var(--color-stat-thirst-dark)",
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