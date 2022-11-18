/* typehints:start */
import type { GameRoot } from "../root";
import type { MetaBuilding } from "../meta_building";
/* typehints:end */
import { findNiceIntegerValue } from "../../core/utils";
import { MetaConstantProducerBuilding } from "../buildings/constant_producer";
import { MetaGoalAcceptorBuilding } from "../buildings/goal_acceptor";
import { enumGameModeIds, enumGameModeTypes, GameMode } from "../game_mode";
import { ShapeDefinition } from "../shape_definition";
import { enumHubGoalRewards } from "../tutorial_goals";
import { HUDWiresToolbar } from "../hud/parts/wires_toolbar";
import { HUDUnlockNotification } from "../hud/parts/unlock_notification";
import { HUDMassSelector } from "../hud/parts/mass_selector";
import { HUDShop } from "../hud/parts/shop";
import { HUDWaypoints } from "../hud/parts/waypoints";
import { HUDStatistics } from "../hud/parts/statistics";
import { HUDWireInfo } from "../hud/parts/wire_info";
import { HUDLeverToggle } from "../hud/parts/lever_toggle";
import { HUDPinnedShapes } from "../hud/parts/pinned_shapes";
import { HUDNotifications } from "../hud/parts/notifications";
import { HUDScreenshotExporter } from "../hud/parts/screenshot_exporter";
import { HUDWiresOverlay } from "../hud/parts/wires_overlay";
import { HUDShapeViewer } from "../hud/parts/shape_viewer";
import { HUDLayerPreview } from "../hud/parts/layer_preview";
import { HUDTutorialVideoOffer } from "../hud/parts/tutorial_video_offer";
import { HUDMinerHighlight } from "../hud/parts/miner_highlight";
import { HUDGameMenu } from "../hud/parts/game_menu";
import { HUDConstantSignalEdit } from "../hud/parts/constant_signal_edit";
import { IS_MOBILE } from "../../core/config";
import { HUDKeybindingOverlay } from "../hud/parts/keybinding_overlay";
import { HUDWatermark } from "../hud/parts/watermark";
import { HUDStandaloneAdvantages } from "../hud/parts/standalone_advantages";
import { HUDPartTutorialHints } from "../hud/parts/tutorial_hints";
import { HUDInteractiveTutorial } from "../hud/parts/interactive_tutorial";
import { MetaBlockBuilding } from "../buildings/block";
import { MetaItemProducerBuilding } from "../buildings/item_producer";
import { MOD_SIGNALS } from "../../mods/mod_signals";
import { finalGameShape, generateLevelsForVariant } from "./levels";
import { WEB_STEAM_SSO_AUTHENTICATED } from "../../core/steam_sso";
export type UpgradeRequirement = {
    shape: string;
    amount: number;
};
export type TierRequirement = {
    required: Array<UpgradeRequirement>;
    improvement?: number;
    excludePrevious?: boolean;
};
export type UpgradeTiers = Array<TierRequirement>;
export type LevelDefinition = {
    shape: string;
    required: number;
    reward: enumHubGoalRewards;
    throughputOnly?: boolean;
};




export const rocketShape: any = "CbCuCbCu:Sr------:--CrSrCr:CwCwCwCw";
const preparementShape: any = "CpRpCp--:SwSwSwSw";
// Tiers need % of the previous tier as requirement too
const tierGrowth: any = 2.5;
const upgradesCache: any = {};
/**
 * Generates all upgrades
 * {} */
function generateUpgrades(limitedVersion: any = false, difficulty: any = 1): Object<string, UpgradeTiers> {
    if (upgradesCache[limitedVersion]) {
        return upgradesCache[limitedVersion];
    }
    const fixedImprovements: any = [0.5, 0.5, 1, 1, 2, 1, 1];
    const numEndgameUpgrades: any = limitedVersion ? 0 : 1000 - fixedImprovements.length - 1;
    function generateInfiniteUnlocks(): any {
        return new Array(numEndgameUpgrades).fill(null).map((_: any, i: any): any => ({
            required: [
                { shape: preparementShape, amount: 30000 + i * 10000 },
                { shape: finalGameShape, amount: 20000 + i * 5000 },
                { shape: rocketShape, amount: 20000 + i * 5000 },
            ],
            excludePrevious: true,
        }));
    }
    // Fill in endgame upgrades
    for (let i: any = 0; i < numEndgameUpgrades; ++i) {
        if (i < 20) {
            fixedImprovements.push(0.1);
        }
        else if (i < 50) {
            fixedImprovements.push(0.05);
        }
        else if (i < 100) {
            fixedImprovements.push(0.025);
        }
        else {
            fixedImprovements.push(0.0125);
        }
    }
    const upgrades: any = {
        belt: [
            {
                required: [{ shape: "CuCuCuCu", amount: 30 }],
            },
            {
                required: [{ shape: "--CuCu--", amount: 500 }],
            },
            {
                required: [{ shape: "CpCpCpCp", amount: 1000 }],
            },
            {
                required: [{ shape: "SrSrSrSr:CyCyCyCy", amount: 6000 }],
            },
            {
                required: [{ shape: "SrSrSrSr:CyCyCyCy:SwSwSwSw", amount: 25000 }],
            },
            {
                required: [{ shape: preparementShape, amount: 25000 }],
                excludePrevious: true,
            },
            {
                required: [
                    { shape: preparementShape, amount: 25000 },
                    { shape: finalGameShape, amount: 50000 },
                ],
                excludePrevious: true,
            },
            ...generateInfiniteUnlocks(),
        ],
        miner: [
            {
                required: [{ shape: "RuRuRuRu", amount: 300 }],
            },
            {
                required: [{ shape: "Cu------", amount: 800 }],
            },
            {
                required: [{ shape: "ScScScSc", amount: 3500 }],
            },
            {
                required: [{ shape: "CwCwCwCw:WbWbWbWb", amount: 23000 }],
            },
            {
                required: [
                    {
                        shape: "CbRbRbCb:CwCwCwCw:WbWbWbWb",
                        amount: 50000,
                    },
                ],
            },
            {
                required: [{ shape: preparementShape, amount: 25000 }],
                excludePrevious: true,
            },
            {
                required: [
                    { shape: preparementShape, amount: 25000 },
                    { shape: finalGameShape, amount: 50000 },
                ],
                excludePrevious: true,
            },
            ...generateInfiniteUnlocks(),
        ],
        processors: [
            {
                required: [{ shape: "SuSuSuSu", amount: 500 }],
            },
            {
                required: [{ shape: "RuRu----", amount: 600 }],
            },
            {
                required: [{ shape: "CgScScCg", amount: 3500 }],
            },
            {
                required: [{ shape: "CwCrCwCr:SgSgSgSg", amount: 25000 }],
            },
            {
                required: [{ shape: "WrRgWrRg:CwCrCwCr:SgSgSgSg", amount: 50000 }],
            },
            {
                required: [{ shape: preparementShape, amount: 25000 }],
                excludePrevious: true,
            },
            {
                required: [
                    { shape: preparementShape, amount: 25000 },
                    { shape: finalGameShape, amount: 50000 },
                ],
                excludePrevious: true,
            },
            ...generateInfiniteUnlocks(),
        ],
        painting: [
            {
                required: [{ shape: "RbRb----", amount: 600 }],
            },
            {
                required: [{ shape: "WrWrWrWr", amount: 3800 }],
            },
            {
                required: [
                    {
                        shape: "RpRpRpRp:CwCwCwCw",
                        amount: 6500,
                    },
                ],
            },
            {
                required: [{ shape: "WpWpWpWp:CwCwCwCw:WpWpWpWp", amount: 25000 }],
            },
            {
                required: [{ shape: "WpWpWpWp:CwCwCwCw:WpWpWpWp:CwCwCwCw", amount: 50000 }],
            },
            {
                required: [{ shape: preparementShape, amount: 25000 }],
                excludePrevious: true,
            },
            {
                required: [
                    { shape: preparementShape, amount: 25000 },
                    { shape: finalGameShape, amount: 50000 },
                ],
                excludePrevious: true,
            },
            ...generateInfiniteUnlocks(),
        ],
    };
    // Automatically generate tier levels
    for (const upgradeId: any in upgrades) {
        const upgradeTiers: any = upgrades[upgradeId];
        let currentTierRequirements: any = [];
        for (let i: any = 0; i < upgradeTiers.length; ++i) {
            const tierHandle: any = upgradeTiers[i];
            tierHandle.improvement = fixedImprovements[i];
            tierHandle.required.forEach((required: any): any => {
                required.amount = Math.round(required.amount * difficulty);
            });
            const originalRequired: any = tierHandle.required.slice();
            for (let k: any = currentTierRequirements.length - 1; k >= 0; --k) {
                const oldTierRequirement: any = currentTierRequirements[k];
                if (!tierHandle.excludePrevious) {
                    tierHandle.required.unshift({
                        shape: oldTierRequirement.shape,
                        amount: oldTierRequirement.amount,
                    });
                }
            }
            currentTierRequirements.push(...originalRequired.map((req: any): any => ({
                amount: req.amount,
                shape: req.shape,
            })));
            currentTierRequirements.forEach((tier: any): any => {
                tier.amount = findNiceIntegerValue(tier.amount * tierGrowth);
            });
        }
    }
    MOD_SIGNALS.modifyUpgrades.dispatch(upgrades);
    // VALIDATE
    if (G_IS_DEV) {
        for (const upgradeId: any in upgrades) {
            upgrades[upgradeId].forEach((tier: any): any => {
                tier.required.forEach(({ shape }: any): any => {
                    try {
                        ShapeDefinition.fromShortKey(shape);
                    }
                    catch (ex: any) {
                        throw new Error("Invalid upgrade goal: '" + ex + "' for shape" + shape);
                    }
                });
            });
        }
    }
    upgradesCache[limitedVersion] = upgrades;
    return upgrades;
}
let levelDefinitionsCache: any = null;
/**
 * Generates the level definitions
 */
export function generateLevelDefinitions(app: any): any {
    if (levelDefinitionsCache) {
        return levelDefinitionsCache;
    }
    const levelDefinitions: any = generateLevelsForVariant(app);
    MOD_SIGNALS.modifyLevelDefinitions.dispatch(levelDefinitions);
    if (G_IS_DEV) {
        levelDefinitions.forEach(({ shape }: any): any => {
            try {
                ShapeDefinition.fromShortKey(shape);
            }
            catch (ex: any) {
                throw new Error("Invalid tutorial goal: '" + ex + "' for shape" + shape);
            }
        });
    }
    levelDefinitionsCache = levelDefinitions;
    return levelDefinitions;
}
export class RegularGameMode extends GameMode {
    static getId(): any {
        return enumGameModeIds.regular;
    }
    static getType(): any {
        return enumGameModeTypes.default;
    }
    public additionalHudParts = {
        wiresToolbar: HUDWiresToolbar,
        unlockNotification: HUDUnlockNotification,
        massSelector: HUDMassSelector,
        shop: HUDShop,
        statistics: HUDStatistics,
        waypoints: HUDWaypoints,
        wireInfo: HUDWireInfo,
        leverToggle: HUDLeverToggle,
        pinnedShapes: HUDPinnedShapes,
        notifications: HUDNotifications,
        screenshotExporter: HUDScreenshotExporter,
        wiresOverlay: HUDWiresOverlay,
        shapeViewer: HUDShapeViewer,
        layerPreview: HUDLayerPreview,
        minerHighlight: HUDMinerHighlight,
        tutorialVideoOffer: HUDTutorialVideoOffer,
        gameMenu: HUDGameMenu,
        constantSignalEdit: HUDConstantSignalEdit,
    };
    public hiddenBuildings: (typeof MetaBuilding)[] = [
        MetaConstantProducerBuilding,
        MetaGoalAcceptorBuilding,
        MetaBlockBuilding,
        MetaItemProducerBuilding,
    ];

        constructor(root) {
        super(root);
        if (!IS_MOBILE) {
            this.additionalHudParts.keybindingOverlay = HUDKeybindingOverlay;
        }
        if (this.root.app.restrictionMgr.getIsStandaloneMarketingActive()) {
            this.additionalHudParts.watermark = HUDWatermark;
            this.additionalHudParts.standaloneAdvantages = HUDStandaloneAdvantages;
        }
        if (this.root.app.settings.getAllSettings().offerHints) {
            this.additionalHudParts.tutorialHints = HUDPartTutorialHints;
            this.additionalHudParts.interactiveTutorial = HUDInteractiveTutorial;
        }
    }
    get difficultyMultiplicator() {
        if (G_IS_STANDALONE || WEB_STEAM_SSO_AUTHENTICATED) {
            return 1;
        }
        return 0.5;
    }
    /**
     * Should return all available upgrades
     * {}
     */
    getUpgrades(): Object<string, UpgradeTiers> {
        return generateUpgrades(!this.root.app.restrictionMgr.getHasExtendedUpgrades(), this.difficultyMultiplicator);
    }
    /**
     * Returns the goals for all levels including their reward
     * {}
     */
    getLevelDefinitions(): Array<LevelDefinition> {
        return generateLevelDefinitions(this.root.app);
    }
    /**
     * Should return whether free play is available or if the game stops
     * after the predefined levels
     * {}
     */
    getIsFreeplayAvailable(): boolean {
        return this.root.app.restrictionMgr.getHasExtendedLevelsAndFreeplay();
    }
    /** {} */
    hasAchievements(): boolean {
        return true;
    }
}
