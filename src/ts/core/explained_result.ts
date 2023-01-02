export class ExplainedResult {
    constructor(public result = true, public reason: string = null, additionalProps = {}) {
        // Copy additional props
        for (const key in additionalProps) {
            this[key] = additionalProps[key];
        }
    }

    isGood() {
        return !!this.result;
    }

    isBad() {
        return !this.result;
    }

    static good() {
        return new ExplainedResult(true);
    }

    static bad(reason?: string, additionalProps?: any) {
        return new ExplainedResult(false, reason, additionalProps);
    }

    static requireAll(...args) {
        for (let i = 0; i < args.length; ++i) {
            const subResult = args[i].call();
            if (!subResult.isGood()) {
                return subResult;
            }
        }
        return this.good();
    }
}
