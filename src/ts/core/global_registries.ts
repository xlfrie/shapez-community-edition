import { SingletonFactory } from "./singleton_factory";
import { Factory } from "./factory";

import type { BaseGameSpeed } from "../game/time/base_game_speed";

import type { Component } from "../game/component";

import type { BaseItem } from "../game/base_item";

import type { GameMode } from "../game/game_mode";

import type { MetaBuilding } from "../game/meta_building";

export let gMetaBuildingRegistry: SingletonFactory<MetaBuilding> = new SingletonFactory();

export let gBuildingsByCategory: {
    [idx: string]: Array<Class<MetaBuilding>>;
} = null;

export let gComponentRegistry: Factory<Component> = new Factory("component");

export let gGameModeRegistry: Factory<GameMode> = new Factory("gameMode");

export let gGameSpeedRegistry: Factory<BaseGameSpeed> = new Factory("gamespeed");

export let gItemRegistry: Factory<BaseItem> = new Factory("item");

// Helpers

export function initBuildingsByCategory(buildings: { [idx: string]: Array<Class<MetaBuilding>> }) {
    gBuildingsByCategory = buildings;
}
