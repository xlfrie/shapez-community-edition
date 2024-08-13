import { CHANGELOG } from "../changelog";
import { globalConfig } from "../core/config";
import { GameState } from "../core/game_state";
import { createLogger } from "../core/logging";
import { getLogoSprite } from "../core/utils";
import { getRandomHint } from "../game/hints";
import { HUDModalDialogs } from "../game/hud/parts/modal_dialogs";
import { T, autoDetectLanguageId, updateApplicationLanguage } from "../translations";

const logger = createLogger("state/preload");

export class PreloadState extends GameState {
    constructor() {
        super("PreloadState");
    }

    getThemeMusic() {
        return null;
    }

    getHasFadeIn() {
        return false;
    }

    getRemovePreviousContent() {
        return false;
    }

    onEnter() {
        this.dialogs = new HUDModalDialogs(null, this.app);
        const dialogsElement = document.body.querySelector(".modalDialogParent");
        this.dialogs.initializeToElement(dialogsElement);

        /** @type {HTMLElement} */
        this.hintsText = this.htmlElement.querySelector("#preload_ll_text");
        this.lastHintShown = -1000;
        this.nextHintDuration = 0;

        /** @type {HTMLElement} */
        this.statusText = this.htmlElement.querySelector("#ll_preload_status");
        /** @type {HTMLElement} */
        this.progressElement = this.htmlElement.querySelector("#ll_progressbar span");

        this.startLoading();
    }

    async sendBeacon() {
        // TODO: Get rid of this analytics stuff
    }

    onLeave() {
        // this.dialogs.cleanup();
    }

    startLoading() {
        this.setStatus("Booting")
            .then(() => this.setStatus("Creating platform wrapper", 3))
            .then(() => this.app.platformWrapper.initialize())

            .then(() => this.setStatus("Creating storage", 9))
            .then(() => {
                return this.app.storage.initialize();
            })

            .then(() => this.setStatus("Initializing settings", 20))
            .then(() => {
                return this.app.settings.initialize();
            })

            .then(() => {
                // Initialize fullscreen
                if (this.app.platformWrapper.getSupportsFullscreen()) {
                    this.app.platformWrapper.setFullscreen(this.app.settings.getIsFullScreen());
                }
            })

            .then(() => this.setStatus("Initializing language", 25))
            .then(() => {
                if (this.app.settings.getLanguage() === "auto-detect") {
                    const language = autoDetectLanguageId();
                    logger.log("Setting language to", language);
                    return this.app.settings.updateLanguage(language);
                }
            })
            .then(() => {
                document.documentElement.setAttribute("lang", this.app.settings.getLanguage());
            })

            .then(() => {
                const language = this.app.settings.getLanguage();
                updateApplicationLanguage(language);
            })

            .then(() => this.setStatus("Initializing sounds", 30))
            .then(() => {
                return this.app.sound.initialize();
            })

            .then(() => this.setStatus("Initializing savegames", 38))
            .then(() => {
                return this.app.savegameMgr.initialize().catch(err => {
                    logger.error("Failed to initialize savegames:", err);
                    alert(
                        "Your savegames failed to load, it seems your data files got corrupted. I'm so sorry!\n\n(This can happen if your pc crashed while a game was saved).\n\nYou can try re-importing your savegames."
                    );
                    return this.app.savegameMgr.writeAsync();
                });
            })

            .then(() => this.setStatus("Downloading resources", 40))
            .then(() => {
                this.app.backgroundResourceLoader.resourceStateChangedSignal.add(({ progress }) => {
                    this.setStatus(
                        "Downloading resources (" + (progress * 100.0).toFixed(1) + " %)",
                        40 + progress * 50
                    );
                });
                return this.app.backgroundResourceLoader.getMainMenuPromise().catch(err => {
                    logger.error("Failed to load resources:", err);
                    this.app.backgroundResourceLoader.showLoaderError(this.dialogs, err);
                    return new Promise(() => null);
                });
            })
            .then(() => {
                this.app.backgroundResourceLoader.resourceStateChangedSignal.removeAll();
            })

            .then(() => this.setStatus("Checking changelog", 95))
            .then(() => {
                if (G_IS_DEV && globalConfig.debug.disableUpgradeNotification) {
                    return;
                }

                return this.app.storage
                    .readFileAsync("lastversion.bin")
                    .catch(err => {
                        logger.warn("Failed to read lastversion:", err);
                        return G_BUILD_VERSION;
                    })
                    .then(version => {
                        logger.log("Last version:", version, "App version:", G_BUILD_VERSION);
                        this.app.storage.writeFileAsync("lastversion.bin", G_BUILD_VERSION);
                        return version;
                    })
                    .then(version => {
                        let changelogEntries = [];
                        logger.log("Last seen version:", version);

                        for (let i = 0; i < CHANGELOG.length; ++i) {
                            if (CHANGELOG[i].version === version) {
                                break;
                            }
                            changelogEntries.push(CHANGELOG[i]);
                        }
                        if (changelogEntries.length === 0) {
                            return;
                        }

                        let dialogHtml = T.dialogs.updateSummary.desc;
                        for (let i = 0; i < changelogEntries.length; ++i) {
                            const entry = changelogEntries[i];
                            dialogHtml += `
                            <div class="changelogDialogEntry">
                                <span class="version">${entry.version}</span>
                                <span class="date">${entry.date}</span>
                                <ul class="changes">
                                    ${entry.entries.map(text => `<li>${text}</li>`).join("")}
                                </ul>
                            </div>
                        `;
                        }

                        return new /** @type {typeof Promise<void>} */ (Promise)(resolve => {
                            this.dialogs.showInfo(T.dialogs.updateSummary.title, dialogHtml).ok.add(resolve);
                        });
                    });
            })

            .then(() => this.setStatus("Launching", 99))
            .then(
                () => {
                    this.moveToState("MainMenuState");
                },
                err => {
                    this.showFailMessage(err);
                }
            );
    }

    update() {
        const now = performance.now();
        if (now - this.lastHintShown > this.nextHintDuration) {
            this.lastHintShown = now;
            const hintText = getRandomHint();

            this.hintsText.innerHTML = hintText;

            /**
             * Compute how long the user will need to read the hint.
             * We calculate with 130 words per minute, with an average of 5 chars
             * that is 650 characters / minute
             */
            this.nextHintDuration = Math.max(2500, (hintText.length / 650) * 60 * 1000);
        }
    }

    onRender() {
        this.update();
    }

    onBackgroundTick() {
        this.update();
    }

    /**
     *
     * @param {string} text
     */
    setStatus(text, progress) {
        logger.log("✅ " + text);

        this.currentStatus = text;
        this.statusText.innerText = text;
        this.progressElement.style.width = 80 + (progress / 100) * 20 + "%";
        return Promise.resolve();
    }

    showFailMessage(text) {
        logger.error("App init failed:", text);

        const email = "bugs@shapez.io";

        const subElement = document.createElement("div");
        subElement.classList.add("failureBox");

        subElement.innerHTML = `
                <div class="logo">
                    <img src="res/${getLogoSprite()}" alt="Shapez.io Logo">
                </div>
                <div class="failureInner">
                    <div class="errorHeader">
                    Failed to initialize application!
                    </div>
                    <div class="errorMessage">
                        ${this.currentStatus} failed:<br/>
                        ${text}
                    </div>
                    <div class="lower">
                        <button class="resetApp styledButton">Reset App</button>
                        <i>Build ${G_BUILD_VERSION} @ ${G_BUILD_COMMIT_HASH}</i>
                    </div>
                </div>
        `;

        this.htmlElement.classList.add("failure");
        this.htmlElement.appendChild(subElement);

        const resetBtn = subElement.querySelector("button.resetApp");
        this.trackClicks(resetBtn, this.showResetConfirm);

        this.hintsText.remove();
    }

    showResetConfirm() {
        if (confirm("Are you sure you want to reset the app? This will delete all your savegames!")) {
            this.resetApp();
        }
    }

    resetApp() {
        this.app.settings
            .resetEverythingAsync()
            .then(() => {
                this.app.savegameMgr.resetEverythingAsync();
            })
            .then(() => {
                this.app.settings.resetEverythingAsync();
            })
            .then(() => {
                window.location.reload();
            });
    }
}
