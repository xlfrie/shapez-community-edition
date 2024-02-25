// Globals defined by webpack

declare const G_IS_DEV: boolean;
declare function assert(condition: boolean | object | string, ...errorMessage: string[]): asserts condition;
declare function assertAlways(
    condition: boolean | object | string,
    ...errorMessage: string[]
): asserts condition;

declare const abstract: void;

declare const G_APP_ENVIRONMENT: string;
declare const G_HAVE_ASSERT: boolean;
declare const G_BUILD_TIME: number;
declare const G_IS_STANDALONE: boolean;
declare const G_IS_BROWSER: boolean;

declare const G_BUILD_COMMIT_HASH: string;
declare const G_BUILD_VERSION: string;
declare const G_ALL_UI_IMAGES: Array<string>;
declare const G_IS_RELEASE: boolean;

declare const shapez: any;

declare const ipcRenderer: any;

// Polyfills
declare interface String {
    replaceAll(search: string, replacement: string): string;
}

declare interface CanvasRenderingContext2D {
    beginRoundedRect(x: number, y: number, w: number, h: number, r: number): void;
    beginCircle(x: number, y: number, r: number): void;

    msImageSmoothingEnabled: boolean;
    mozImageSmoothingEnabled: boolean;
    webkitImageSmoothingEnabled: boolean;
}

// Just for compatibility with the shared code
declare interface Logger {
    log(...args);
    warn(...args);
    info(...args);
    error(...args);
}

// Cordova
declare interface Device {
    uuid: string;
    platform: string;
    available: boolean;
    version: string;
    cordova: string;
    model: string;
    manufacturer: string;
    isVirtual: boolean;
    serial: string;
}

declare interface MobileAccessibility {
    usePreferredTextZoom(boolean);
}

declare interface Window {
    // Cordova
    device: Device;
    StatusBar: any;
    AndroidFullScreen: any;
    AndroidNotch: any;
    plugins: any;

    // Debugging
    activeClickDetectors: Array<any>;

    // Experimental/Newer apis
    FontFace: any;
    TouchEvent: undefined | TouchEvent;

    // Thirdparty
    XPayStationWidget: any;
    Sentry: any;
    LogRocket: any;
    grecaptcha: any;
    gtag: any;
    cpmstarAPI: any;
    CrazyGames: any;

    // Mods
    $shapez_registerMod: any;
    anyModLoaded: any;

    shapez: any;

    APP_ERROR_OCCURED?: boolean;

    webkitRequestAnimationFrame();

    assert(condition: boolean, failureMessage: string);

    coreThreadLoadedCb();
}

declare interface Navigator {
    app: any;
    device: any;
    splashscreen: any;
}

// FontFace
declare interface Document {
    fonts: any;
}

// Webpack
declare interface WebpackContext {
    keys(): Array<string>;
}

declare interface NodeRequire {
    context(src: string, flag: boolean, regexp: RegExp): WebpackContext;
}

declare interface Object {
    entries(obj: object): Array<[string, any]>;
}

declare interface Math {
    radians(number): number;
    degrees(number): number;
}

declare type Class<T = unknown> = new (...args: any[]) => T;

declare interface String {
    padStart(size: number, fill?: string): string;
    padEnd(size: number, fill: string): string;
}

declare interface SignalTemplate0 {
    add(receiver: () => string | void, scope: null | any);
    dispatch(): string | void;
    remove(receiver: () => string | void);
    removeAll();
}

declare class TypedTrackedState<T> {
    constructor(callbackMethod?: (value: T) => void, callbackScope?: any);

    set(value: T, changeHandler?: (value: T) => void, changeScope?: any): void;

    setSilent(value: any): void;
    get(): T;
}

declare type Layer = "regular" | "wires";
declare type ItemType = "shape" | "color" | "boolean";

declare module "worker-loader?inline=true&fallback=false!*" {
    class WebpackWorker extends Worker {
        constructor();
    }

    export default WebpackWorker;
}

// JSX type support - https://www.typescriptlang.org/docs/handbook/jsx.html
// modified from https://stackoverflow.com/a/68238924
declare namespace JSX {
    /**
     * The return type of a JSX expression.
     *
     * In reality, Fragments can return arbitrary values, but we ignore this for convenience.
     */
    type Element = HTMLElement;
    /**
     * Key-value list of intrinsic element names and their allowed properties.
     *
     * Because children are treated as a property, the Node type cannot be excluded from the index signature.
     */
    type IntrinsicElements = {
        [K in keyof HTMLElementTagNameMap]: {
            children?: Node | Node[];
            [k: string]: Node | Node[] | string | number | boolean;
        };
    };
    /**
     * The property of the attributes object storing the children.
     */
    type ElementChildrenAttribute = { children: unknown };

    // The following do not have special meaning to TypeScript.

    /**
     * An attributes object.
     */
    type Props = { [k: string]: unknown };
    /**
     * A functional component requiring attributes to match `T`.
     */
    type Component<T extends Props> = {
        (props: T): Element;
    };
    /**
     * A child of a JSX element.
     */
    type Node = Element | string | boolean | null | undefined;
}
