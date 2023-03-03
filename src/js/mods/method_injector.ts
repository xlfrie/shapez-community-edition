import { OrganizeImportsMode } from "typescript";
import { ExplainedResult } from "../core/explained_result.js";

export type Class<T = any> = {
    new (...args: any): T;
    prototype: any;
};

export type returnAny<T extends (...args: any) => any> = (...args: Parameters<T>) => any;

type SingleMethodMap = Map<Class, Map<string, (...args: any[]) => any>>;
type MultiMethodMap = Map<Class, Map<string, Set<(...args: any[]) => any>>>;

declare global {
    interface Map<K, V> {
        getOrCreate(key: K, defaultValue: V): V;
    }

    interface Function {
        [OVERRIDES_RETURN]: boolean;
    }
}

const OVERRIDES_RETURN = Symbol("Overrides return");

Map.prototype.getOrCreate = function (key, val) {
    if (!this.has(key)) this.set(key, val);
    return this.get(key);
};

export class MethodInjector {
    // Keep track of what has been touched
    private originals: SingleMethodMap = new Map();
    private patched = new Set<string>();
    private haveOverriddenReturns = new Set<string>();

    // Replacements
    private replacements: SingleMethodMap = new Map();
    private runBeforeReplacements: MultiMethodMap = new Map();
    private runAfterReplacements: MultiMethodMap = new Map();

    private getReplacement(classHandle: Class, method: string) {
        return this.replacements.getOrCreate(classHandle, new Map()).get(method);
    }

    private getRunBeforeReplacements(classHandle: Class, method: string) {
        return this.runBeforeReplacements.getOrCreate(classHandle, new Map()).getOrCreate(method, new Set());
    }

    private getRunAfterReplacements(classHandle: Class, method: string) {
        return this.runAfterReplacements.getOrCreate(classHandle, new Map()).getOrCreate(method, new Set());
    }

    private getMethodPath(classHandle: Class, method: string) {
        return classHandle.name + "-" + method;
    }

    private markMethodIfNeeded(classHandle: Class, method: string) {
        const path = this.getMethodPath(classHandle, method);
        if (this.patched.has(path)) return;

        const original = classHandle.prototype[method];
        this.originals.getOrCreate(classHandle, new Map()).set(method, original);

        const injector = this;
        classHandle.prototype[method] = function (...args) {
            for (const rbm of injector.getRunBeforeReplacements(classHandle, method)) {
                rbm(...args);
            }

            let returnVal;
            if (injector.getReplacement(classHandle, method)) {
                returnVal = injector.getReplacement(classHandle, method).apply(this, args);
            } else {
                returnVal = original.apply(this, args);
            }

            for (const ram of injector.getRunAfterReplacements(classHandle, method)) {
                if (ram[OVERRIDES_RETURN]) returnVal = ram.apply(this, args);
            }

            return returnVal;
        };

        this.patched.add(path);
    }

    private checkIfCanRevert(classHandle: Class, methodName: string) {
        if (this.getRunBeforeReplacements(classHandle, methodName).size > 0) return;
        if (this.getRunAfterReplacements(classHandle, methodName).size > 0) return;
        if (this.getReplacement(classHandle, methodName)) return;

        const path = this.getMethodPath(classHandle, methodName);
        this.patched.delete(path);
        classHandle.prototype[methodName] = this.originals.get(classHandle)!.get(methodName);
    }

    runBeforeMethod<C extends Class<any>, M extends keyof C["prototype"]>(
        classHandle: C,
        methodName: M,
        runBefore: returnAny<C["prototype"][M]>
    ): ExplainedResult {
        this.markMethodIfNeeded(classHandle, methodName as string);
        this.getRunBeforeReplacements(classHandle, methodName as string).add(runBefore);
        return ExplainedResult.good();
    }

    removeRunBeforeMethod(classHandle: Class, method: string, runBefore: any) {
        this.getRunBeforeReplacements(classHandle, method).delete(runBefore);
        this.checkIfCanRevert(classHandle, method);
        return ExplainedResult.good();
    }

    runAfterMethod<C extends Class<any>, M extends keyof C["prototype"]>(
        classHandle: C,
        methodName: M,
        runAfter: returnAny<C["prototype"][M]>,
        options?: {
            overrideReturn?: boolean;
        }
    ): ExplainedResult {
        if (options?.overrideReturn) {
            const path = this.getMethodPath(classHandle, methodName as string);

            if (this.haveOverriddenReturns.has(path)) {
                return ExplainedResult.bad(`Can not override return of function ${path} twice`);
            }

            runAfter[OVERRIDES_RETURN] = true;
            this.haveOverriddenReturns.add(path);
        }

        this.markMethodIfNeeded(classHandle, methodName as string);
        this.getRunAfterReplacements(classHandle, methodName as string).add(runAfter);

        return ExplainedResult.good();
    }

    removeRunAfter(
        classHandle: Class,
        methodName: string,
        runAfter: any,
        options?: {
            overrideReturn?: boolean;
        }
    ) {
        if (options?.overrideReturn) {
            const path = this.getMethodPath(classHandle, methodName as string);

            this.haveOverriddenReturns.delete(path);
        }

        this.getRunAfterReplacements(classHandle, methodName).delete(runAfter);
        this.checkIfCanRevert(classHandle, methodName);
        return ExplainedResult.good();
    }

    replaceMethod<C extends Class<any>, M extends keyof C["prototype"]>(
        classHandle: C,
        methodName: M,
        replacement: returnAny<C["prototype"][M]>,
        options?: {
            allowOthersToOverrideReturn?: boolean;
        }
    ): ExplainedResult {
        if (!options?.allowOthersToOverrideReturn) {
            const path = this.getMethodPath(classHandle, methodName as string);

            if (this.haveOverriddenReturns.has(path)) {
                return ExplainedResult.bad(`Can not override return of function ${path} twice`);
            }

            this.haveOverriddenReturns.add(path);
        }

        this.markMethodIfNeeded(classHandle, methodName as string);
        this.replacements.getOrCreate(classHandle, new Map()).set(methodName as string, replacement);
        return ExplainedResult.good();
    }

    removeReplacement(classHandle: Class, methodName: string, replacement: any, options: any) {
        if (!options?.allowOthersToOverrideReturn) {
            const path = this.getMethodPath(classHandle, methodName as string);
            this.haveOverriddenReturns.delete(path);
        }

        this.replacements.getOrCreate(classHandle, new Map()).delete(methodName);
        this.checkIfCanRevert(classHandle, methodName);
        return ExplainedResult.good();
    }
}
