import { makeOffscreenBuffer } from "../core/buffer_utils";
import { globalConfig } from "../core/config";
import { smoothenDpi } from "../core/dpi_manager";
import { DrawParameters } from "../core/draw_parameters";
import { Vector } from "../core/vector";
import { BasicSerializableObject, types } from "../savegame/serialization";
import { enumColors, enumColorsToHexCode, enumColorToShortcode, enumShortcodeToColor } from "./colors";
import { THEME } from "./theme";
export type SubShapeDrawOptions = {
    context: CanvasRenderingContext2D;
    quadrantSize: number;
    layerScale: number;
};

export const MODS_ADDITIONAL_SUB_SHAPE_DRAWERS: {
    [idx: string]: (options: SubShapeDrawOptions) => void;
} = {};
export type ShapeLayerItem = {
    subShape: enumSubShape;
    color: enumColors;
};

export const TOP_RIGHT: any = 0;
export const BOTTOM_RIGHT: any = 1;
export const BOTTOM_LEFT: any = 2;
export const TOP_LEFT: any = 3;
export type ShapeLayer = [
    ShapeLayerItem?,
    ShapeLayerItem?,
    ShapeLayerItem?,
    ShapeLayerItem?
];

const arrayQuadrantIndexToOffset: any = [
    new Vector(1, -1),
    new Vector(1, 1),
    new Vector(-1, 1),
    new Vector(-1, -1), // tl
];
/** @enum {string} */
export const enumSubShape: any = {
    rect: "rect",
    circle: "circle",
    star: "star",
    windmill: "windmill",
};
/** @enum {string} */
export const enumSubShapeToShortcode: any = {
    [enumSubShape.rect]: "R",
    [enumSubShape.circle]: "C",
    [enumSubShape.star]: "S",
    [enumSubShape.windmill]: "W",
};
/** @enum {enumSubShape} */
export const enumShortcodeToSubShape: any = {};
for (const key: any in enumSubShapeToShortcode) {
    enumShortcodeToSubShape[enumSubShapeToShortcode[key]] = key;
}
/**
 * Converts the given parameters to a valid shape definition
 * @returns{}
 *n createSimpleShape(layers: *): Array<ShapeLayer> {
    layers.forEach((layer: any): any => {
        layer.forEach((item: any): any => {
            if (item) {
                item.color = item.color || enumColors.uncolored;
            }
        });
    });
    return layers;
}
/**
 * Cache which shapes are valid short keys and which not
 */
const SHORT_KEY_CACHE: Map<string, boolean> = new Map();
export class ShapeDefinition extends BasicSerializableObject {
    static getId(): any {
        return "ShapeDefinition";
    }
    static getSchema(): any {
        return {};
    }
    deserialize(data: any): any {
        const errorCode: any = super.deserialize(data);
        if (errorCode) {
            return errorCode;
        }
        const definition: any = ShapeDefinition.fromShortKey(data);
        this.layers = definition.layers as Array<ShapeLayer>);
    }
    serialize(): any {
        return this.getHash();
    }
    public layers: Array<ShapeLayer> = layers;
    public cachedHash: string = null;
    public bufferGenerator = null;

        constructor({ layers = [] }) {
        super();
    }
    /**
     * Generates the definition from the given short key
     * {}
     */
    static fromShortKey(key: string): ShapeDefinition {
        const sourceLayers: any = key.split(":");
        let layers: any = [];
        for (let i: any = 0; i < sourceLayers.length; ++i) {
            const text: any = sourceLayers[i];
            assert(text.length === 8, "Invalid shape short key: " + key);
                        const quads: ShapeLayer = [null, null, null, null];
            for (let quad: any = 0; quad < 4; ++quad) {
                const shapeText: any = text[quad * 2 + 0];
                const subShape: any = enumShortcodeToSubShape[shapeText];
                const color: any = enumShortcodeToColor[text[quad * 2 + 1]];
                if (subShape) {
                    assert(color, "Invalid shape short key:", key);
                    quads[quad] = {
                        subShape,
                        color,
                    };
                }
                else if (shapeText !== "-") {
                    assert(false, "Invalid shape key: " + shapeText);
                }
            }
            layers.push(quads);
        }
        const definition: any = new ShapeDefinition({ layers });
        // We know the hash so save some work
        definition.cachedHash = key;
        return definition;
    }
    /**
     * Checks if a given string is a valid short key
     * {}
     */
    static isValidShortKey(key: string): boolean {
        if (SHORT_KEY_CACHE.has(key)) {
            return SHORT_KEY_CACHE.get(key);
        }
        const result: any = ShapeDefinition.isValidShortKeyInternal(key);
        SHORT_KEY_CACHE.set(key, result);
        return result;
    }
    /**
     * INTERNAL
     * Checks if a given string is a valid short key
     * {}
     */
    static isValidShortKeyInternal(key: string): boolean {
        const sourceLayers: any = key.split(":");
        let layers: any = [];
        for (let i: any = 0; i < sourceLayers.length; ++i) {
            const text: any = sourceLayers[i];
            if (text.length !== 8) {
                return false;
            }
                        const quads: ShapeLayer = [null, null, null, null];
            let anyFilled: any = false;
            for (let quad: any = 0; quad < 4; ++quad) {
                const shapeText: any = text[quad * 2 + 0];
                const colorText: any = text[quad * 2 + 1];
                const subShape: any = enumShortcodeToSubShape[shapeText];
                const color: any = enumShortcodeToColor[colorText];
                // Valid shape
                if (subShape) {
                    if (!color) {
                        // Invalid color
                        return false;
                    }
                    quads[quad] = {
                        subShape,
                        color,
                    };
                    anyFilled = true;
                }
                else if (shapeText === "-") {
                    // Make sure color is empty then, too
                    if (colorText !== "-") {
                        return false;
                    }
                }
                else {
                    // Invalid shape key
                    return false;
                }
            }
            if (!anyFilled) {
                // Empty layer
                return false;
            }
            layers.push(quads);
        }
        if (layers.length === 0 || layers.length > 4) {
            return false;
        }
        return true;
    }
    /**
     * Internal method to clone the shape definition
     * {}
     */
    getClonedLayers(): Array<ShapeLayer> {
        return JSON.parse(JSON.stringify(this.layers));
    }
    /**
     * Returns if the definition is entirely empty^
     * {}
     */
    isEntirelyEmpty(): boolean {
        return this.layers.length === 0;
    }
    /**
     * Returns a unique id for this shape
     * {}
     */
    getHash(): string {
        if (this.cachedHash) {
            return this.cachedHash;
        }
        let id: any = "";
        for (let layerIndex: any = 0; layerIndex < this.layers.length; ++layerIndex) {
            const layer: any = this.layers[layerIndex];
            for (let quadrant: any = 0; quadrant < layer.length; ++quadrant) {
                const item: any = layer[quadrant];
                if (item) {
                    id += enumSubShapeToShortcode[item.subShape] + enumColorToShortcode[item.color];
                }
                else {
                    id += "--";
                }
            }
            if (layerIndex < this.layers.length - 1) {
                id += ":";
            }
        }
        this.cachedHash = id;
        return id;
    }
    /**
     * Draws the shape definition
     */
    drawCentered(x: number, y: number, parameters: DrawParameters, diameter: number= = 20): any {
        const dpi: any = smoothenDpi(globalConfig.shapesSharpness * parameters.zoomLevel);
        if (!this.bufferGenerator) {
            this.bufferGenerator = this.internalGenerateShapeBuffer.bind(this);
        }
        const key: any = diameter + "/" + dpi + "/" + this.cachedHash;
        const canvas: any = parameters.root.buffers.getForKey({
            key: "shapedef",
            subKey: key,
            w: diameter,
            h: diameter,
            dpi,
            redrawMethod: this.bufferGenerator,
        });
        parameters.context.drawImage(canvas, x - diameter / 2, y - diameter / 2, diameter, diameter);
    }
    /**
     * Draws the item to a canvas
     */
    drawFullSizeOnCanvas(context: CanvasRenderingContext2D, size: number): any {
        this.internalGenerateShapeBuffer(null, context, size, size, 1);
    }
    /**
     * Generates this shape as a canvas
     */
    generateAsCanvas(size: number = 120): any {
        const [canvas, context]: any = makeOffscreenBuffer(size, size, {
            smooth: true,
            label: "definition-canvas-cache-" + this.getHash(),
            reusable: false,
        });
        this.internalGenerateShapeBuffer(canvas, context, size, size, 1);
        return canvas;
    }
        internalGenerateShapeBuffer(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, w: number, h: number, dpi: number): any {
        context.translate((w * dpi) / 2, (h * dpi) / 2);
        context.scale((dpi * w) / 23, (dpi * h) / 23);
        context.fillStyle = "#e9ecf7";
        const quadrantSize: any = 10;
        const quadrantHalfSize: any = quadrantSize / 2;
        context.fillStyle = THEME.items.circleBackground;
        context.beginCircle(0, 0, quadrantSize * 1.15);
        context.fill();
        for (let layerIndex: any = 0; layerIndex < this.layers.length; ++layerIndex) {
            const quadrants: any = this.layers[layerIndex];
            const layerScale: any = Math.max(0.1, 0.9 - layerIndex * 0.22);
            for (let quadrantIndex: any = 0; quadrantIndex < 4; ++quadrantIndex) {
                if (!quadrants[quadrantIndex]) {
                    continue;
                }
                const { subShape, color }: any = quadrants[quadrantIndex];
                const quadrantPos: any = arrayQuadrantIndexToOffset[quadrantIndex];
                const centerQuadrantX: any = quadrantPos.x * quadrantHalfSize;
                const centerQuadrantY: any = quadrantPos.y * quadrantHalfSize;
                const rotation: any = Math.radians(quadrantIndex * 90);
                context.translate(centerQuadrantX, centerQuadrantY);
                context.rotate(rotation);
                context.fillStyle = enumColorsToHexCode[color];
                context.strokeStyle = THEME.items.outline;
                context.lineWidth = THEME.items.outlineWidth;
                if (MODS_ADDITIONAL_SUB_SHAPE_DRAWERS[subShape]) {
                    MODS_ADDITIONAL_SUB_SHAPE_DRAWERS[subShape]({
                        context,
                        layerScale,
                        quadrantSize,
                    });
                }
                else {
                    switch (subShape) {
                        case enumSubShape.rect: {
                            context.beginPath();
                            const dims: any = quadrantSize * layerScale;
                            context.rect(-quadrantHalfSize, quadrantHalfSize - dims, dims, dims);
                            context.fill();
                            context.stroke();
                            break;
                        }
                        case enumSubShape.star: {
                            context.beginPath();
                            const dims: any = quadrantSize * layerScale;
                            let originX: any = -quadrantHalfSize;
                            let originY: any = quadrantHalfSize - dims;
                            const moveInwards: any = dims * 0.4;
                            context.moveTo(originX, originY + moveInwards);
                            context.lineTo(originX + dims, originY);
                            context.lineTo(originX + dims - moveInwards, originY + dims);
                            context.lineTo(originX, originY + dims);
                            context.closePath();
                            context.fill();
                            context.stroke();
                            break;
                        }
                        case enumSubShape.windmill: {
                            context.beginPath();
                            const dims: any = quadrantSize * layerScale;
                            let originX: any = -quadrantHalfSize;
                            let originY: any = quadrantHalfSize - dims;
                            const moveInwards: any = dims * 0.4;
                            context.moveTo(originX, originY + moveInwards);
                            context.lineTo(originX + dims, originY);
                            context.lineTo(originX + dims, originY + dims);
                            context.lineTo(originX, originY + dims);
                            context.closePath();
                            context.fill();
                            context.stroke();
                            break;
                        }
                        case enumSubShape.circle: {
                            context.beginPath();
                            context.moveTo(-quadrantHalfSize, quadrantHalfSize);
                            context.arc(-quadrantHalfSize, quadrantHalfSize, quadrantSize * layerScale, -Math.PI * 0.5, 0);
                            context.closePath();
                            context.fill();
                            context.stroke();
                            break;
                        }
                        default: {
                            throw new Error("Unkown sub shape: " + subShape);
                        }
                    }
                }
                context.rotate(-rotation);
                context.translate(-centerQuadrantX, -centerQuadrantY);
            }
        }
    }
    /**
     * Returns a definition with only the given quadrants
     * {}
     */
    cloneFilteredByQuadrants(includeQuadrants: Array<number>): ShapeDefinition {
        const newLayers: any = this.getClonedLayers();
        for (let layerIndex: any = 0; layerIndex < newLayers.length; ++layerIndex) {
            const quadrants: any = newLayers[layerIndex];
            let anyContents: any = false;
            for (let quadrantIndex: any = 0; quadrantIndex < 4; ++quadrantIndex) {
                if (includeQuadrants.indexOf(quadrantIndex) < 0) {
                    quadrants[quadrantIndex] = null;
                }
                else if (quadrants[quadrantIndex]) {
                    anyContents = true;
                }
            }
            // Check if the layer is entirely empty
            if (!anyContents) {
                newLayers.splice(layerIndex, 1);
                layerIndex -= 1;
            }
        }
        return new ShapeDefinition({ layers: newLayers });
    }
    /**
     * Returns a definition which was rotated clockwise
     * {}
     */
    cloneRotateCW(): ShapeDefinition {
        const newLayers: any = this.getClonedLayers();
        for (let layerIndex: any = 0; layerIndex < newLayers.length; ++layerIndex) {
            const quadrants: any = newLayers[layerIndex];
            quadrants.unshift(quadrants[3]);
            quadrants.pop();
        }
        return new ShapeDefinition({ layers: newLayers });
    }
    /**
     * Returns a definition which was rotated counter clockwise
     * {}
     */
    cloneRotateCCW(): ShapeDefinition {
        const newLayers: any = this.getClonedLayers();
        for (let layerIndex: any = 0; layerIndex < newLayers.length; ++layerIndex) {
            const quadrants: any = newLayers[layerIndex];
            quadrants.push(quadrants[0]);
            quadrants.shift();
        }
        return new ShapeDefinition({ layers: newLayers });
    }
    /**
     * Returns a definition which was rotated 180 degrees
     * {}
     */
    cloneRotate180(): ShapeDefinition {
        const newLayers: any = this.getClonedLayers();
        for (let layerIndex: any = 0; layerIndex < newLayers.length; ++layerIndex) {
            const quadrants: any = newLayers[layerIndex];
            quadrants.push(quadrants.shift(), quadrants.shift());
        }
        return new ShapeDefinition({ layers: newLayers });
    }
    /**
     * Stacks the given shape definition on top.
     */
    cloneAndStackWith(definition: ShapeDefinition): any {
        if (this.isEntirelyEmpty() || definition.isEntirelyEmpty()) {
            assert(false, "Can not stack entirely empty definition");
        }
        const bottomShapeLayers: any = this.layers;
        const bottomShapeHighestLayerByQuad: any = [-1, -1, -1, -1];
        for (let layer: any = bottomShapeLayers.length - 1; layer >= 0; --layer) {
            const shapeLayer: any = bottomShapeLayers[layer];
            for (let quad: any = 0; quad < 4; ++quad) {
                const shapeQuad: any = shapeLayer[quad];
                if (shapeQuad !== null && bottomShapeHighestLayerByQuad[quad] < layer) {
                    bottomShapeHighestLayerByQuad[quad] = layer;
                }
            }
        }
        const topShapeLayers: any = definition.layers;
        const topShapeLowestLayerByQuad: any = [4, 4, 4, 4];
        for (let layer: any = 0; layer < topShapeLayers.length; ++layer) {
            const shapeLayer: any = topShapeLayers[layer];
            for (let quad: any = 0; quad < 4; ++quad) {
                const shapeQuad: any = shapeLayer[quad];
                if (shapeQuad !== null && topShapeLowestLayerByQuad[quad] > layer) {
                    topShapeLowestLayerByQuad[quad] = layer;
                }
            }
        }
        /**
         * We want to find the number `layerToMergeAt` such that when the top shape is placed at that
         * layer, the smallest gap between shapes is only 1. Instead of doing a guess-and-check method to
         * find the appropriate layer, we just calculate all the gaps assuming a merge at layer 0, even
         * though they go negative, and calculating the number to add to it so the minimum gap is 1 (ends
         * up being 1 - minimum).
         */
        const gapsBetweenShapes: any = [];
        for (let quad: any = 0; quad < 4; ++quad) {
            gapsBetweenShapes.push(topShapeLowestLayerByQuad[quad] - bottomShapeHighestLayerByQuad[quad]);
        }
        const smallestGapBetweenShapes: any = Math.min(...gapsBetweenShapes);
        // Can't merge at a layer lower than 0
        const layerToMergeAt: any = Math.max(1 - smallestGapBetweenShapes, 0);
        const mergedLayers: any = this.getClonedLayers();
        for (let layer: any = mergedLayers.length; layer < layerToMergeAt + topShapeLayers.length; ++layer) {
            mergedLayers.push([null, null, null, null]);
        }
        for (let layer: any = 0; layer < topShapeLayers.length; ++layer) {
            const layerMergingAt: any = layerToMergeAt + layer;
            const bottomShapeLayer: any = mergedLayers[layerMergingAt];
            const topShapeLayer: any = topShapeLayers[layer];
            for (let quad: any = 0; quad < 4; quad++) {
                assert(!(bottomShapeLayer[quad] && topShapeLayer[quad]), "Shape merge: Sub shape got lost");
                bottomShapeLayer[quad] = bottomShapeLayer[quad] || topShapeLayer[quad];
            }
        }
        // Limit to 4 layers at max
        mergedLayers.splice(4);
        return new ShapeDefinition({ layers: mergedLayers });
    }
    /**
     * Clones the shape and colors everything in the given color
     */
    cloneAndPaintWith(color: enumColors): any {
        const newLayers: any = this.getClonedLayers();
        for (let layerIndex: any = 0; layerIndex < newLayers.length; ++layerIndex) {
            const quadrants: any = newLayers[layerIndex];
            for (let quadrantIndex: any = 0; quadrantIndex < 4; ++quadrantIndex) {
                const item: any = quadrants[quadrantIndex];
                if (item) {
                    item.color = color;
                }
            }
        }
        return new ShapeDefinition({ layers: newLayers });
    }
    /**
     * Clones the shape and colors everything in the given colors
     */
    cloneAndPaintWith4Colors(colors: [
        enumColors,
        enumColors,
        enumColors,
        enumColors
    ]): any {
        const newLayers: any = this.getClonedLayers();
        for (let layerIndex: any = 0; layerIndex < newLayers.length; ++layerIndex) {
            const quadrants: any = newLayers[layerIndex];
            for (let quadrantIndex: any = 0; quadrantIndex < 4; ++quadrantIndex) {
                const item: any = quadrants[quadrantIndex];
                if (item) {
                    item.color = colors[quadrantIndex] || item.color;
                }
            }
        }
        return new ShapeDefinition({ layers: newLayers });
    }
}
