import { globalConfig, IS_MOBILE } from "../../core/config";
import { createLogger } from "../../core/logging";
import { queryParamOptions } from "../../core/query_parameters";
import { WEB_STEAM_SSO_AUTHENTICATED } from "../../core/steam_sso";
import { clamp } from "../../core/utils";
import { SteamAchievementProvider } from "../electron/steam_achievement_provider";
import { PlatformWrapperInterface } from "../wrapper";
import { NoAchievementProvider } from "./no_achievement_provider";
import { StorageImplBrowser } from "./storage";
import { StorageImplBrowserIndexedDB } from "./storage_indexed_db";

const logger = createLogger("platform/browser");

export class PlatformWrapperImplBrowser extends PlatformWrapperInterface {
    initialize() {
        this.recaptchaTokenCallback = null;

        this.embedProvider = {
            id: "shapezio-website",
            iframed: false,
            externalLinks: true,
        };

        if (!G_IS_STANDALONE && !WEB_STEAM_SSO_AUTHENTICATED && queryParamOptions.embedProvider) {
            const providerId = queryParamOptions.embedProvider;
            this.embedProvider.iframed = true;

            switch (providerId) {
                case "armorgames": {
                    this.embedProvider.id = "armorgames";
                    break;
                }

                case "iogames.space": {
                    this.embedProvider.id = "iogames.space";
                    break;
                }

                case "miniclip": {
                    this.embedProvider.id = "miniclip";
                    break;
                }

                case "gamedistribution": {
                    this.embedProvider.id = "gamedistribution";
                    this.embedProvider.externalLinks = false;
                    break;
                }

                case "kongregate": {
                    this.embedProvider.id = "kongregate";
                    break;
                }

                case "crazygames": {
                    this.embedProvider.id = "crazygames";
                    break;
                }

                default: {
                    logger.error("Got unsupported embed provider:", providerId);
                }
            }
        }

        logger.log("Embed provider:", this.embedProvider.id);

        return this.detectStorageImplementation()
            .then(() => this.initializeAchievementProvider())
            .then(() => super.initialize());
    }

    detectStorageImplementation() {
        return new Promise(resolve => {
            logger.log("Detecting storage");

            if (!window.indexedDB) {
                logger.log("Indexed DB not supported");
                this.app.storage = new StorageImplBrowser(this.app);
                resolve();
                return;
            }

            // Try accessing the indexedb
            let request;
            try {
                request = window.indexedDB.open("indexeddb_feature_detection", 1);
            } catch (ex) {
                logger.warn("Error while opening indexed db:", ex);
                this.app.storage = new StorageImplBrowser(this.app);
                resolve();
                return;
            }
            request.onerror = err => {
                logger.log("Indexed DB can *not* be accessed: ", err);
                logger.log("Using fallback to local storage");
                this.app.storage = new StorageImplBrowser(this.app);
                resolve();
            };
            request.onsuccess = () => {
                logger.log("Indexed DB *can* be accessed");
                this.app.storage = new StorageImplBrowserIndexedDB(this.app);
                resolve();
            };
        });
    }

    getId() {
        return "browser@" + this.embedProvider.id;
    }

    getUiScale() {
        if (IS_MOBILE) {
            return 1;
        }

        const avgDims = Math.min(this.app.screenWidth, this.app.screenHeight);
        return clamp((avgDims / 1000.0) * 1.9, 0.1, 10);
    }

    getSupportsRestart() {
        return true;
    }

    getTouchPanStrength() {
        return IS_MOBILE ? 1 : 0.5;
    }

    openExternalLink(url, force = false) {
        logger.log("Opening external:", url);
        window.open(url);
    }

    performRestart() {
        logger.log("Performing restart");
        window.location.reload(true);
    }

    initializeAchievementProvider() {
        if (G_IS_DEV && globalConfig.debug.testAchievements) {
            this.app.achievementProvider = new SteamAchievementProvider(this.app);

            return this.app.achievementProvider.initialize().catch(err => {
                logger.error("Failed to initialize achievement provider, disabling:", err);

                this.app.achievementProvider = new NoAchievementProvider(this.app);
            });
        }

        return this.app.achievementProvider.initialize();
    }

    exitApp() {
        // Can not exit app
    }
}
