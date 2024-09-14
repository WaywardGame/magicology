import { AttackType, EntityType } from "@wayward/game/game/entity/IEntity";
import { Action } from "@wayward/game/game/entity/action/Action";
import { ActionArgument, ActionDisplayLevel, IActionUsable } from "@wayward/game/game/entity/action/IAction";
import Attack from "@wayward/game/game/entity/action/actions/Attack";

import { SfxType } from "@wayward/game/audio/IAudio";
import { Delay } from "@wayward/game/game/entity/IHuman";
import { Stat } from "@wayward/game/game/entity/IStats";
import { NotUsableMessage, NotUsableMessageItem } from "@wayward/game/game/entity/action/actions/helper/NotUsableMessage";
import Creature from "@wayward/game/game/entity/creature/Creature";
import { TileGroup } from "@wayward/game/game/entity/creature/ICreature";
import { MessageType, Source } from "@wayward/game/game/entity/player/IMessageManager";
import { ItemTypeGroup } from "@wayward/game/game/item/IItem";
import Item from "@wayward/game/game/item/Item";
import Tile from "@wayward/game/game/tile/Tile";
import Translation from "@wayward/game/language/Translation";
import Message from "@wayward/game/language/dictionary/Message";
import Magicology from "./Magicology";

export const createAttackAction = (requiredMana: number) => new Action(ActionArgument.ItemInventory)
	.setUsableBy(EntityType.Human)
	.setCanUse((action, item) => {
		const mana = action.executor.stat.get(Magicology.INSTANCE.statMana);
		if (!mana || mana.value < requiredMana) {
			return {
				usable: false,
				sources: [Source.Equipment, Source.Item],
				errorDisplayLevel: ActionDisplayLevel.Always,
				message: NotUsableMessage.simple(Magicology.INSTANCE.messageNotEnoughMana,
					() => requiredMana),
			};
		}

		return Attack.canUse(action, item, AttackType.RangedWeapon);
	})
	.setHandler((action, item) => {
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
				sources: [Source.Equipment, Source.Item],
				errorDisplayLevel: ActionDisplayLevel.Always,
				message: NotUsableMessage.simple(Magicology.INSTANCE.messageNotEnoughMana,
					() => requiredMana),
			};
		}

		return {
			usable: true,
		};
	})
	.setHandler((action, item) => {
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

const CannotUseSomethingInTheWay = NotUsableMessageItem({ message: Message.SomethingInTheWayOfSummoning });

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
				sources: [Source.Equipment, Source.Item],
				errorDisplayLevel: ActionDisplayLevel.Always,
				message: NotUsableMessage.simple(Magicology.INSTANCE.messageNotEnoughMana,
					() => requiredMana),
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
				...CannotUseSomethingInTheWay(item),
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

		const { tile } = action.use;

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
			renderers.notifier.suspend((creature) => {
				creature.tame(action.executor, Number.MAX_SAFE_INTEGER);
			}, creature);

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

		const { creatures } = action.use;

		for (const creature of creatures) {
			Magicology.INSTANCE.dematerialize(creature);
		}

		action.executor.messages.source(Source.Action, Source.Allies, Source.Creature)
			.send(Magicology.INSTANCE.messageYouHaveDematerialized, Translation.formatList(creatures.map(creature => creature.getName())));

		action.setPassTurn();
	});