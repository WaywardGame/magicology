import { AttackType, EntityType } from "@wayward/game/game/entity/IEntity";
import { Action } from "@wayward/game/game/entity/action/Action";
import type { IActionUsable } from "@wayward/game/game/entity/action/IAction";
import { ActionArgument, ActionDisplayLevel } from "@wayward/game/game/entity/action/IAction";
import Attack from "@wayward/game/game/entity/action/actions/Attack";

import { SfxType } from "@wayward/game/audio/IAudio";
import { Delay } from "@wayward/game/game/entity/IHuman";
import { Stat } from "@wayward/game/game/entity/IStats";
import { NotUsableMessage, NotUsableMessageItem } from "@wayward/game/game/entity/action/actions/helper/NotUsableMessage";
import type Creature from "@wayward/game/game/entity/creature/Creature";
import { TileGroup } from "@wayward/game/game/entity/creature/ICreature";
import { MessageType, Source } from "@wayward/game/game/entity/player/IMessageManager";
import { ItemTypeGroup } from "@wayward/game/game/item/IItem";
import type Item from "@wayward/game/game/item/Item";
import type Tile from "@wayward/game/game/tile/Tile";
import Translation from "@wayward/game/language/Translation";
import Message from "@wayward/game/language/dictionary/Message";
import type MagicologyMod from "./Magicology";
import Mod from "@wayward/game/mod/Mod";

const Magicology = Mod.get<MagicologyMod>();

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createAttackAction = (requiredMana: number) => new Action(ActionArgument.ItemInventory)
	.setUsableBy(EntityType.Human)
	.setCanUse((action, item) => {
		if (!Magicology?.instance) {
			return { usable: false };
		}

		const mana = action.executor.stat.get(Magicology.instance.statMana);
		if (!mana || mana.value < requiredMana) {
			return {
				usable: false,
				sources: [Source.Equipment, Source.Item],
				errorDisplayLevel: ActionDisplayLevel.Always,
				message: NotUsableMessage.simple(Magicology.instance.messageNotEnoughMana,
					() => requiredMana),
			};
		}

		return Attack.canUse(action, item, AttackType.RangedWeapon);
	})
	.setHandler((action, item) => {
		if (!Magicology?.instance) {
			return;
		}

		action.executor.stat.reduce(Magicology.instance.statMana, requiredMana);

		void Attack.execute(action, item, AttackType.RangedWeapon);
	});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createConjureAction = (requiredMana: number) => new Action(ActionArgument.ItemInventory)
	.setUsableBy(EntityType.Human)
	.setPreExecutionHandler((action, item) => action.addItems(item))
	.setCanUse((action, item) => {
		if (!Magicology?.instance) {
			return { usable: false };
		}

		const description = item.description;
		if (!description?.use?.some(a => a === Magicology.instance.actionConjureFood || a === Magicology.instance.actionConjureWater)) {
			return {
				usable: false,
			};
		}

		const mana = action.executor.stat.get(Magicology.instance.statMana);
		if (!mana || mana.value < requiredMana) {
			return {
				usable: false,
				sources: [Source.Equipment, Source.Item],
				errorDisplayLevel: ActionDisplayLevel.Always,
				message: NotUsableMessage.simple(Magicology.instance.messageNotEnoughMana,
					() => requiredMana),
			};
		}

		return {
			usable: true,
		};
	})
	.setHandler((action, item) => {
		if (!Magicology?.instance) {
			return;
		}

		action.executor.stat.reduce(Magicology.instance.statMana, requiredMana);

		let conjuredItem: Item;

		switch (item.type) {

			case Magicology.instance.itemElementalBakingTray:
				conjuredItem = action.executor.createItemInInventory(ItemTypeGroup.CookedFood, item.quality);

				action.setItemsUsed();
				action.setSoundEffect(SfxType.Craft);
				action.executor.messages.source(Source.Action, Source.Item)
					.send(Magicology.instance.messageYouConjured, conjuredItem.getName());

				break;

			case Magicology.instance.itemElementalGlassBottle:
				conjuredItem = item;

				item.changeInto(Magicology.instance.itemElementalGlassBottleOfPurifiedFreshWater);

				// note: not calling setItemsUsed now - the durability will decrease when using the fresh water
				action.setSoundEffect(SfxType.Craft);
				action.executor.messages.source(Source.Action, Source.Item)
					.send(Message.Filled, conjuredItem.getName());

				break;

			default:
				return;
		}

		action.executor.stat.reduce(Stat.Stamina, Math.max(Math.floor(conjuredItem.getTotalWeight(true)), 1));

		action.addSkillGains(Magicology.instance.skillMagicology);

		action.setPassTurn();
		action.setUpdateTablesAndWeight();
	});

interface IMaterializeCanUse extends IActionUsable {
	tile: Tile;
}

const CannotUseSomethingInTheWay = NotUsableMessageItem({ message: Message.SomethingInTheWayOfSummoning });

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createMaterializeAction = (requiredMana: number) => new Action(ActionArgument.ItemInventory)
	.setUsableBy(EntityType.Human)
	.setPreExecutionHandler((action, item) => action.addItems(item))
	.setCanUse<IMaterializeCanUse>((action, item) => {
		if (!Magicology?.instance) {
			return { usable: false };
		}

		const description = item.description;
		if (!description?.use?.some(a => a === Magicology.instance.actionMaterialize)) {
			return {
				usable: false,
			};
		}

		const mana = action.executor.stat.get(Magicology.instance.statMana);
		if (!mana || mana.value < requiredMana) {
			return {
				usable: false,
				sources: [Source.Equipment, Source.Item],
				errorDisplayLevel: ActionDisplayLevel.Always,
				message: NotUsableMessage.simple(Magicology.instance.messageNotEnoughMana,
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
		if (!Magicology?.instance) {
			return;
		}

		action.setDelay(Delay.LongPause);

		const { tile } = action.use;

		let creature = action.executor.island.creatures.spawn(Magicology.instance.creatureElementalGolemFigure, tile, { forceAberrant: false, bypassCreatureLimit: true });
		if (!creature) {
			// fan out from the tile and try spawning it
			tile.findMatchingTile(searchTile => {
				creature = action.executor.island.creatures.spawn(Magicology.instance.creatureElementalGolemFigure, searchTile, { forceAberrant: false, spawnTiles: TileGroup.Ground, bypassCreatureLimit: true });
				return creature !== undefined;
			}, { maxTilesChecked: 27 });
		}

		if (creature) {
			action.executor.stat.reduce(Magicology.instance.statMana, requiredMana);

			action.addSkillGains(Magicology.instance.skillMagicology);

			creature.tile.createParticles(creature.tile.description?.particles);

			// serve the player forever
			renderers.notifier.suspend(creature => {
				creature.tame(action.executor, Number.MAX_SAFE_INTEGER);
			}, creature);

			creature.queueSoundEffect(SfxType.CreatureNoise);
			creature.skipNextUpdate();

			action.executor.messages.source(Source.Action, Source.Allies, Source.Creature)
				.send(Magicology.instance.messageYouHaveMaterialized, creature.getName());

			action.setItemsUsed();
			action.setPassTurn();
			action.setUpdateWeight();

		} else {
			action.executor.messages.source(Source.Action, Source.Allies, Source.Creature)
				.type(MessageType.Bad)
				.send(Magicology.instance.messageNoRoomForMaterialization, item.getName());
		}
	});

interface IDematerializeCanUse extends IActionUsable {
	creatures: Creature[];
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createDematerializeAction = () => new Action(ActionArgument.ItemInventory)
	.setUsableBy(EntityType.Human)
	.setCanUse<IDematerializeCanUse>((action, item) => {
		if (!Magicology?.instance) {
			return { usable: false };
		}

		const description = item.description;
		if (!description?.use?.some(a => a === Magicology.instance.actionDematerialize)) {
			return {
				usable: false,
			};
		}

		const creatures = Magicology.instance.getElementalGolems(action.executor);
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
		if (!Magicology?.instance) {
			return;
		}

		action.setDelay(Delay.LongPause);

		const { creatures } = action.use;

		for (const creature of creatures) {
			Magicology.instance.dematerialize(creature);
		}

		action.executor.messages.source(Source.Action, Source.Allies, Source.Creature)
			.send(Magicology.instance.messageYouHaveDematerialized, Translation.formatList(creatures.map(creature => creature.getName())));

		action.setPassTurn();
	});
