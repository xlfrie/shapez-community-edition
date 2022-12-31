import { TrackedState } from "../../core/tracked_state";
import { GameRoot } from "../root";

// Automatically attaches and detaches elements from the dom
// Also supports detaching elements after a given time, useful if there is a
// hide animation like for the tooltips

// Also attaches a class name if desired

export class DynamicDomAttach {
    public root: GameRoot = root;

    public element: HTMLElement = element;
    public parent = this.element.parentElement;

    public attachClass = attachClass;
    public trackHover = trackHover;

    public timeToKeepSeconds = timeToKeepSeconds;
    public lastVisibleTime = 0;

    //// We start attached, so detach the node first
    public attached = true;

    public internalIsClassAttached = false;
    public classAttachTimeout = null;

    //// Store the last bounds we computed

    public lastComputedBounds: DOMRect = null;
    public lastComputedBoundsTime = -1;

    //// Track the 'hovered' class
    public trackedIsHovered = new TrackedState(this.setIsHoveredClass, this);
    /**
     * @param param2.timeToKeepSeconds How long to keep the element visible (in ms) after it should be hidden.
     * Useful for fade-out effects
     * @param param2.attachClass If set, attaches a class while the element is visible
     * @param param2.trackHover If set, attaches the 'hovered' class if the cursor is above the element. Useful
     * for fading out the element if its below the cursor for example.
     */

    constructor(root, element, { timeToKeepSeconds = 0, attachClass = null, trackHover = false } = {}) {
        assert(this.parent, "Dom attach created without parent");
        this.internalDetach();
    }

    /** Internal method to attach the element */
    internalAttach() {
        if (!this.attached) {
            this.parent.appendChild(this.element);
            assert(this.element.parentElement === this.parent, "Invalid parent #1");
            this.attached = true;
        }
    }

    /** Internal method to detach the element */
    internalDetach() {
        if (this.attached) {
            assert(this.element.parentElement === this.parent, "Invalid parent #2");
            this.element.parentElement.removeChild(this.element);
            this.attached = false;
        }
    }

    /** Returns whether the element is currently attached */
    isAttached() {
        return this.attached;
    }

    /** Actually sets the 'hovered' class */
    setIsHoveredClass(isHovered: boolean) {
        this.element.classList.toggle("hovered", isHovered);
    }

    /**
     * Call this every frame, and the dom attach class will take care of
     * everything else
     * @param isVisible Whether the element should currently be visible or not
     */
    update(isVisible: boolean) {
        if (isVisible) {
            this.lastVisibleTime = this.root ? this.root.time.realtimeNow() : 0;
            this.internalAttach();

            if (this.trackHover && this.root) {
                let bounds = this.lastComputedBounds;

                // Recompute bounds only once in a while
                if (!bounds || this.root.time.realtimeNow() - this.lastComputedBoundsTime > 1.0) {
                    bounds = this.lastComputedBounds = this.element.getBoundingClientRect();
                    this.lastComputedBoundsTime = this.root.time.realtimeNow();
                }

                const mousePos = this.root.app.mousePosition;
                if (mousePos) {
                    this.trackedIsHovered.set(
                        mousePos.x > bounds.left &&
                            mousePos.x < bounds.right &&
                            mousePos.y > bounds.top &&
                            mousePos.y < bounds.bottom
                    );
                }
            }
        } else {
            if (!this.root || this.root.time.realtimeNow() - this.lastVisibleTime >= this.timeToKeepSeconds) {
                this.internalDetach();
            }
        }

        if (this.attachClass && isVisible !== this.internalIsClassAttached) {
            // State changed
            this.internalIsClassAttached = isVisible;

            if (this.classAttachTimeout) {
                clearTimeout(this.classAttachTimeout);
                this.classAttachTimeout = null;
            }

            if (isVisible) {
                this.classAttachTimeout = setTimeout(() => {
                    this.element.classList.add(this.attachClass);
                }, 15);
            } else {
                this.element.classList.remove(this.attachClass);
            }
        }
    }
}
