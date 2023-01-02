import { globalConfig } from "./config";

export type GameRoot = import("../game/root").GameRoot;

export type Rectangle = import("./rectangle").Rectangle;

export class DrawParameters {
    public context: CanvasRenderingContext2D;
    public visibleRect: Rectangle;
    public desiredAtlasScale: string;
    public zoomLevel: number;
    public root: GameRoot;

    constructor({ context, visibleRect, desiredAtlasScale, zoomLevel, root }: {
        context: CanvasRenderingContext2D,
        visibleRect: Rectangle,
        desiredAtlasScale: string,
        zoomLevel: number,
        root: GameRoot
    }) {
        this.context = context;
        this.visibleRect = visibleRect;
        this.desiredAtlasScale = desiredAtlasScale;
        this.zoomLevel = zoomLevel
        this.root = root
    }
}
