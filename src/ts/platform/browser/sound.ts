import { MusicInstanceInterface, SoundInstanceInterface, SoundInterface, MUSIC, SOUNDS } from "../sound";
import { cachebust } from "../../core/cachebust";
import { createLogger } from "../../core/logging";
import { globalConfig } from "../../core/config";

import { Howl, Howler } from "howler";

const logger = createLogger("sound/browser");

// @ts-ignore
import sprites from "../../built-temp/sfx.json";

class SoundSpritesContainer {
    public howl = null;

    public loadingPromise = null;

    constructor() {}

    load() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }
        return (this.loadingPromise = new Promise<void>(resolve => {
            this.howl = new Howl({
                src: cachebust("res/sounds/sfx.mp3"),
                sprite: sprites.sprite,
                autoplay: false,
                loop: false,
                volume: 0,
                preload: true,
                pool: 20,
                onload: () => {
                    resolve();
                },
                onloaderror: (id, err) => {
                    logger.warn("SFX failed to load:", id, err);
                    this.howl = null;
                    resolve();
                },
                onplayerror: (id, err) => {
                    logger.warn("SFX failed to play:", id, err);
                },
            });
        }));
    }

    play(volume, key) {
        if (this.howl) {
            const instance = this.howl.play(key);
            this.howl.volume(volume, instance);
        }
    }

    deinitialize() {
        if (this.howl) {
            this.howl.unload();
            this.howl = null;
        }
    }
}

class WrappedSoundInstance extends SoundInstanceInterface {
    constructor(public spriteContainer: SoundSpritesContainer, key) {
        super(key, "sfx.mp3");
    }

    load(): Promise<void> {
        return this.spriteContainer.load();
    }

    play(volume) {
        this.spriteContainer.play(volume, this.key);
    }

    deinitialize() {
        return this.spriteContainer.deinitialize();
    }
}

class MusicInstance extends MusicInstanceInterface {
    public howl = null;
    public instance = null;
    public playing = false;

    constructor(key, url) {
        super(key, url);
    }
    load() {
        return new Promise<void>((resolve, reject) => {
            this.howl = new Howl({
                src: cachebust("res/sounds/music/" + this.url + ".mp3"),
                autoplay: false,
                loop: true,
                html5: true,
                volume: 1,
                preload: true,
                pool: 2,

                onunlock: () => {
                    if (this.playing) {
                        logger.log("Playing music after manual unlock");
                        this.play();
                    }
                },

                onload: () => {
                    resolve();
                },
                onloaderror: (id, err) => {
                    logger.warn(this, "Music", this.url, "failed to load:", id, err);
                    this.howl = null;
                    resolve();
                },

                onplayerror: (id, err) => {
                    logger.warn(this, "Music", this.url, "failed to play:", id, err);
                },
            });
        });
    }

    stop() {
        if (this.howl && this.instance) {
            this.playing = false;
            this.howl.pause(this.instance);
        }
    }

    isPlaying() {
        return this.playing;
    }

    play(volume?: number) {
        if (this.howl) {
            this.playing = true;
            this.howl.volume(volume);
            if (this.instance) {
                this.howl.play(this.instance);
            } else {
                this.instance = this.howl.play();
            }
        }
    }

    setVolume(volume) {
        if (this.howl) {
            this.howl.volume(volume);
        }
    }

    deinitialize() {
        if (this.howl) {
            this.howl.unload();
            this.howl = null;
            this.instance = null;
        }
    }
}

export class SoundImplBrowser extends SoundInterface {
    public sfxHandle: SoundSpritesContainer;

    constructor(app) {
        Howler.mobileAutoEnable = true;
        Howler.autoUnlock = true;
        Howler.autoSuspend = false;
        Howler.html5PoolSize = 20;
        Howler.pos(0, 0, 0);

        super(app, WrappedSoundInstance, MusicInstance);
    }

    initialize() {
        // NOTICE: We override the initialize() method here with custom logic because
        // we have a sound sprites instance

        this.sfxHandle = new SoundSpritesContainer();

        // @ts-ignore
        const keys = Object.values(SOUNDS);
        keys.forEach(key => {
            this.sounds[key] = new WrappedSoundInstance(this.sfxHandle, key);
        });
        for (const musicKey in MUSIC) {
            const musicPath = MUSIC[musicKey];
            const music = new this.musicClass(musicKey, musicPath);
            this.music[musicPath] = music;
        }

        this.musicVolume = this.app.settings.getAllSettings().musicVolume;
        this.soundVolume = this.app.settings.getAllSettings().soundVolume;

        if (G_IS_DEV && globalConfig.debug.disableMusic) {
            this.musicVolume = 0.0;
        }

        return Promise.resolve();
    }

    deinitialize() {
        return super.deinitialize().then(() => Howler.unload());
    }
}
