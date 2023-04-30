import { EventHandler } from "event/EventManager";
import { ActionType } from "game/entity/action/IAction";
import { AiType, DamageType, Defense, MoveType } from "game/entity/IEntity";
import { EquipType, SkillType } from "game/entity/IHuman";
import { Stat, StatDisplayType } from "game/entity/IStats";
import { EquipEffect, ItemType, ItemTypeGroup, RecipeLevel } from "game/item/IItem";
import { RecipeComponent } from "game/item/ItemDescriptions";
import Mod from "mod/Mod";
import Register, { Registry } from "mod/ModRegistry";
import { when, toggleClasses, shake } from "ui/screen/screens/game/static/stats/StatDisplayDescriptions";
import Dictionary from "language/Dictionary";
import Translation from "language/Translation";
import Player from "game/entity/player/Player";
import { StatChangeCurrentTimerStrategy } from "game/entity/StatFactory";
import Message from "language/dictionary/Message";
import particles from "renderer/particle/Particles";
import { ParticleType } from "renderer/particle/IParticle";
import { TileEventType } from "game/tile/ITileEvent";
import { DoodadTypeGroup } from "game/doodad/IDoodad";
import { CreatureType, TileGroup } from "game/entity/creature/ICreature";
import Creature from "game/entity/creature/Creature";

import { createAttackAction, createConjureAction, createDematerializeAction, createMaterializeAction } from "./MagicologyActions";
import { MagicologyTranslation } from "./IMagicology";
import { SfxType } from "audio/IAudio";
import { Source } from "game/entity/player/IMessageManager";
import Human from "game/entity/Human";

export default class Magicology extends Mod {

	@Mod.instance<Magicology>("Magicology")
	public static readonly INSTANCE: Magicology;

	////////////////////////////////////

	@Register.dictionary("Magicology", MagicologyTranslation)
	public readonly dictionary: Dictionary;

	@Register.message("YouConjured")
	public readonly messageYouConjured: Message;

	@Register.message("YouShootMagicalAttack")
	public readonly messageYouShootMagicalAttack: Message;

	@Register.message("NoRoomForMaterialization")
	public readonly messageNoRoomForMaterialization: Message;

	@Register.message("YouHaveMaterialized")
	public readonly messageYouHaveMaterialized: Message;

	@Register.message("YouHaveDematerialized")
	public readonly messageYouHaveDematerialized: Message;

	@Register.message("YouRanOutOfManaMaterializations")
	public readonly messageYouRanOutOfManaMaterializations: Message;

	@Register.message("NotEnoughMana")
	public readonly messageNotEnoughMana: Message;

	////////////////////////////////////

	@Register.stat("Mana", {
		color: "darkblue",
		rgbColor: "var(--color-stat-thirst-rgb)",
		darkColor: "var(--color-stat-thirst-dark)",
		displayType: StatDisplayType.Statbar,
		displayOrder: 5,
		tooltip: (tooltip, entity, stat) => tooltip
			.addBlock(block => block
				.addParagraph(text => text.setText(Magicology.INSTANCE.getTranslation(MagicologyTranslation.GameStatsStatManaTooltip)))),
		onChange: [
			when(stat => stat.percent < 0.1, toggleClasses("flash")),
			when(stat => stat.value < (stat.oldValue ?? 0), shake),
		],
	})
	public readonly statMana: Stat;

	@Register.skill("Magicology", {
		// defaultDamageType: DamageType.True,
		attribute: {
			stat: Registry<Magicology>().get("statMana"),
			gainChanceOffset: -90, // offset based on the default mana pool of 100. starts off with a 1/10 chance for a stat increase
			gainMultiplier: 5, // gain 5 mana per increase
		},
	})
	public readonly skillMagicology: SkillType;

	////////////////////////////////////

	@Register.action("Fireball", createAttackAction(10))
	public readonly actionFireball: ActionType;

	@Register.action("Frostbolt", createAttackAction(10))
	public readonly actionFrostbolt: ActionType;

	@Register.action("ConjureFood", createConjureAction(80))
	public readonly actionConjureFood: ActionType;

	@Register.action("ConjureWater", createConjureAction(80))
	public readonly actionConjureWater: ActionType;

	@Register.action("Materialize", createMaterializeAction(50))
	public readonly actionMaterialize: ActionType;

	@Register.action("Dematerialize", createDematerializeAction())
	public readonly actionDematerialize: ActionType;

	////////////////////////////////////

	@Register.item("elementalWoodenStaff", {
		equip: EquipType.Held,
		durability: 500,
		equipEffect: [EquipEffect.LightSource, 2],
		attack: 10,
		damageType: DamageType.Blunt,
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
						return particles[ParticleType.Fire];

					case Magicology.INSTANCE.actionFrostbolt:
						return particles[ParticleType.Water];
				}

				return undefined;
			},
			skillType: Registry<Magicology>().get("skillMagicology"),
			unlimitedAmmunition: true,
			attackMessage: Registry<Magicology>().get("messageYouShootMagicalAttack"),
		},
		use: [
			Registry<Magicology>().get("actionFireball"),
			Registry<Magicology>().get("actionFrostbolt"),
		],
		recipe: {
			components: [
				RecipeComponent(ItemType.Lens, 1, 1, 1),
				RecipeComponent(ItemType.Log, 1, 1, 1),
				RecipeComponent(ItemType.WoodenPole, 4, 1, 1),
				RecipeComponent(ItemType.String, 1, 1, 1),
				RecipeComponent(ItemTypeGroup.Sharpened, 1, 0),
			],
			skill: Registry<Magicology>().get("skillMagicology"),
			level: RecipeLevel.Advanced,
			reputation: 10,
		},
		flammable: true,
		burnsLike: [ItemType.WoodenPole, ItemType.Sinew],
		group: [ItemTypeGroup.Weapon, ItemTypeGroup.TwoHanded],
	})
	public itemElementalWoodenStaff: ItemType;

	@Register.item("manaPotion", {
		inheritWeight: ItemType.GlassBottle,
		use: [ActionType.DrinkItem],
		onUse: {
			[ActionType.DrinkItem]: [0, 0, 0, 0, [{
				stat: Registry<Magicology>().get("statMana"),
				amount: 50,
			}]],
		},
		recipe: {
			baseComponent: ItemType.GlassBottle,
			components: [
				RecipeComponent(ItemType.MagicalBinding, 1, 1),
			],
			skill: Registry<Magicology>().get("skillMagicology"),
			level: RecipeLevel.Advanced,
			requiresFire: true,
			reputation: 25,
		},
		skillUse: Registry<Magicology>().get("skillMagicology"),
		durability: 15,
		returnOnUseAndDecay: {
			type: ItemType.GlassBottle,
			damaged: true,
			whenCrafted: true,
		},
		keepDurabilityOnCraft: true,
		noCraftingQualityBonus: true,
		repairable: false,
		worth: 50,
		group: [ItemTypeGroup.Medicinal],
	})
	public itemManaPotion: ItemType;

	@Register.item("elementalBakingTray", {
		use: [Registry<Magicology>().get("actionConjureFood")],
		durability: 100,
		recipe: {
			baseComponent: ItemTypeGroup.Cookware,
			components: [
				RecipeComponent(ItemType.MagicalBinding, 1, 1),
			],
			skill: Registry<Magicology>().get("skillMagicology"),
			level: RecipeLevel.Advanced,
			requiredDoodads: [DoodadTypeGroup.Anvil],
			requiresFire: true,
			reputation: 25,
		},
		requiredForDisassembly: [ItemTypeGroup.Hammer, ItemTypeGroup.SandCastFlask],
		worth: 150,
		tier: {
			[ItemTypeGroup.CookingEquipment]: 5,
			[ItemTypeGroup.Cookware]: 3,
		},
		group: [ItemTypeGroup.Cookware, ItemTypeGroup.CookingEquipment],
	})
	public itemElementalBakingTray: ItemType;

	@Register.item("elementalGlassBottle", {
		use: [Registry<Magicology>().get("actionConjureWater")],
		recipe: {
			baseComponent: ItemType.GlassBottle,
			components: [
				RecipeComponent(ItemType.MagicalBinding, 1, 1),
			],
			skill: Registry<Magicology>().get("skillMagicology"),
			level: RecipeLevel.Advanced,
			requiresFire: true,
			reputation: 25,
		},
		durability: 15,
		worth: 50,
		group: [ItemTypeGroup.LiquidContainer],
	})
	public itemElementalGlassBottle: ItemType;

	@Register.item("elementalGlassBottleOfPurifiedFreshWater", {
		inheritWeight: Registry<Magicology>().get("itemElementalGlassBottle"),
		use: [ActionType.DrinkItem, ActionType.Pour, ActionType.PourOnYourself],
		durability: 15,
		returnOnUseAndDecay: {
			type: Registry<Magicology>().get("itemElementalGlassBottle"),
			damaged: true,
			whenCrafted: true,
		},
		keepDurabilityOnCraft: true,
		repairable: false,
		onUse: {
			[ActionType.DrinkItem]: [1, 25, 1, 10],
			[ActionType.Pour]: TileEventType.PuddleOfPurifiedFreshWater,
			[ActionType.PourOnYourself]: TileEventType.PuddleOfPurifiedFreshWater,
		},
		worth: 100,
		tier: {
			[ItemTypeGroup.Liquid]: 2,
		},
		createOnBreak: {
			tileEventType: TileEventType.PuddleOfPurifiedFreshWater,
		},
		createTileEventOnCraft: TileEventType.PuddleOfPurifiedFreshWater,
		noCraftingQualityBonus: true,
		group: [ItemTypeGroup.ContainerWithLiquid, ItemTypeGroup.GlassBottleOfPotableWater, ItemTypeGroup.ContainerOfPurifiedFreshWater, ItemTypeGroup.FireExtinguisher, ItemTypeGroup.Liquid],
	})
	public itemElementalGlassBottleOfPurifiedFreshWater: ItemType;

	@Register.item("elementalGolemFigure", {
		use: [Registry<Magicology>().get("actionMaterialize"), Registry<Magicology>().get("actionDematerialize")],
		recipe: {
			baseComponent: ItemTypeGroup.Golem,
			components: [
				RecipeComponent(ItemType.MagicalBinding, 1, 1),
			],
			skill: Registry<Magicology>().get("skillMagicology"),
			level: RecipeLevel.Advanced,
			reputation: 100,
		},
		flammable: true,
		worth: 1100,
		durability: 50,
		burnsLike: [ItemType.Log, ItemType.Log, ItemType.Log, ItemType.Log, ItemType.Log, ItemType.Log, ItemType.Amber],
		group: [ItemTypeGroup.Golem, ItemTypeGroup.NotForSale],
	})
	public itemElementalGolemFigure: ItemType;

	////////////////////////////////////

	@Register.item("fireball", {
		attack: 5,
		damageType: DamageType.Fire,
		lightSource: true,
		lightColor: { r: 109, g: 0, b: 56 },
	})
	public itemFireball: ItemType;

	@Register.item("frostbolt", {
		attack: 5,
		damageType: DamageType.Cold,
		lightSource: true,
		lightColor: { r: 109, g: 0, b: 56 },
	})
	public itemFrostbolt: ItemType;

	////////////////////////////////////

	@Register.creature("elementalGolem", {
		minhp: 123,
		maxhp: 130,
		minatk: 35,
		maxatk: 44,
		defense: new Defense(12)
			.setResistance(DamageType.Piercing, 8)
			.setResistance(DamageType.Blunt, 6),
		damageType: DamageType.Blunt,
		ai: AiType.Neutral,
		moveType: MoveType.Land | MoveType.ShallowWater | MoveType.BreakDoodads | MoveType.BreakItems,
		spawnTiles: TileGroup.DefaultWithWater,
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
			{ item: ItemType.MagicalEssence, chance: 30 },
			{ item: ItemType.Basalt },
			{ item: ItemType.Sapphire, chance: 30 },
			{ item: ItemType.Basalt },
			{ item: ItemType.Basalt },
			{ item: ItemType.Basalt },
			{ item: ItemType.Basalt },
		],
		aberrantResource: [
			{ item: ItemType.MagicalEssence, chance: 30 },
			{ item: ItemType.Basalt },
			{ item: ItemType.Sapphire, chance: 30 },
			{ item: ItemType.Basalt },
			{ item: ItemType.Sapphire, chance: 30 },
			{ item: ItemType.Basalt },
			{ item: ItemType.Sapphire, chance: 30 },
			{ item: ItemType.Basalt },
			{ item: ItemType.Sapphire, chance: 30 },
			{ item: ItemType.Basalt },
			{ item: ItemType.Sapphire, chance: 30 },
			{ item: ItemType.Basalt },
			{ item: ItemType.Basalt },
			{ item: ItemType.Basalt },
		],
		skill: SkillType.Mining,
	})
	public creatureElementalGolemFigure: CreatureType;

	////////////////////////////////////

	@EventHandler(Player, "spawn")
	protected onPlayerSpawn(player: Player): void {
		if (!player.stat.has(this.statMana)) {
			player.stat.set(this.statMana, 100);
			player.stat.setMax(this.statMana, 100);
			player.stat.setChangeTimer(this.statMana, 1, t => t.setCurrentTimer(StatChangeCurrentTimerStrategy.Reset).setAmount(1));
		}

		const itemTypes = [
			this.itemElementalWoodenStaff,
			this.itemManaPotion,
			this.itemElementalBakingTray,
			this.itemElementalGlassBottle,
			this.itemElementalGolemFigure,
		];

		for (const itemType of itemTypes) {
			// ensure the recipe is unlocked for players
			if (!player.crafted[itemType]) {
				player.crafted[itemType] = { newUnlock: true, unlockTime: Date.now() };
			}

			if (!player.island.items.isItemInContainer(player.inventory, itemType)) {
				player.createItemInInventory(itemType);
			}
		}
	}

	@EventHandler(Player, "tickStart")
	protected onPlayerTickStart(player: Player): void {
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
				player.stat.setChangeTimer(this.statMana, 1, t => t.setCurrentTimer(StatChangeCurrentTimerStrategy.Reset).setAmount(1));
			}

			return;
		}

		if (mana.changeTimer === 1) {
			player.stat.removeChangeTimer(this.statMana);
			return;
		}

		// 2 mana per golem per tick 
		const manaDrain = 2 * elementalGolems.length;

		if (mana.value >= manaDrain) {
			player.stat.reduce(this.statMana, manaDrain);

		} else {
			// reduce to 0 and unmaterialize them
			player.stat.reduce(this.statMana, mana.value);

			for (const creature of elementalGolems) {
				this.dematerialize(creature);
			}

			player.messages.source(Source.Allies, Source.Creature)
				.send(this.messageYouRanOutOfManaMaterializations);
		}
	}

	public getTranslation(translation: MagicologyTranslation) {
		return Translation.get(this.dictionary, translation);
	}

	public getElementalGolems(human: Human): Creature[] {
		const tamedCreatureIds = human.tamedCreatures.get(human.islandId);
		if (!tamedCreatureIds || tamedCreatureIds.size === 0) {
			return [];
		}

		return Array.from(tamedCreatureIds)
			.map(id => human.island.creatures.get(id))
			.filter(creature => creature !== undefined && creature.type === this.creatureElementalGolemFigure) as Creature[];
	}

	public dematerialize(creature: Creature) {
		creature.queueSoundEffect(SfxType.CreatureNoise);
		creature.tile.createParticles(creature.tile.description?.particles);

		renderers.notifier.suspend();
		creature.island.creatures.remove(creature);
		renderers.notifier.resume();
	}
}
