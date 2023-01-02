import { SingletonFactory } from "./singleton_factory";
import { Factory } from "./factory";

export type BaseGameSpeed = import("../game/time/base_game_speed").BaseGameSpeed;

export type Component = import("../game/component").Component;

export type BaseItem = import("../game/base_item").BaseItem;

export type GameMode = import("../game/game_mode").GameMode;

export type MetaBuilding = import("../game/meta_building").MetaBuilding;

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
