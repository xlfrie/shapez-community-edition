export class ExplainedResult {
    public result: boolean = result;

    public reason: string = reason;

    constructor(result = true, reason = null, additionalProps = {}) {
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

    static bad(reason, additionalProps) {
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
