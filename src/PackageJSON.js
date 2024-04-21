const {
    existsSync,
    readFileSync,
    writeFileSync
} = require("fs");

const path = require("path");


class PackageJSON {
    static default () {
        if (this.packageJSON) {
            return this.packageJSON;
        }

        const packageJSON = {
            name: 'example',
            version: '0.0.0',
            main: "src/index.js",
            dependencies: {},
            devDependencies: {}
        };

        Object.setPrototypeOf(
            packageJSON,
            PackageJSON
        );

        return packageJSON;
    }


    static existsSync (packagePath) {
        packagePath = PackageJSON.resolve(packagePath);

        return existsSync(packagePath);
    }


    static from (json) {
        const packageJSON = new PackageJSON();

        for (let key in json) {
            let value = json[key];

            if (typeof value === 'object') {
                if (value !== null) {
                    value = structuredClone(value);
                }
            }

            packageJSON[key] = value;
        }

        return packageJSON;
    }


    static parse (jsonString) {
        const json = JSON.parse(jsonString);

        return PackageJSON.from(json);
    }


    /**
     * Read a local `package.json` file (synchronously).
     * @param {import('fs').PathLike} packagePath
     * The path to the `package.json` file.
     * @returns {PackageJSON}
     * The read `package.json` file.
     */
    static readFileSync (packagePath) {
        packagePath = PackageJSON.resolve(packagePath);

        const jsonString = readFileSync(
            packagePath,
            'utf-8'
        );

        return PackageJSON.parse(jsonString);
    }


    /**
     * Resolve a path to a `package.json` file.
     * @param {string} packagePath
     * The `package.json` path to resolve.
     * @returns {string} The resolved path.
     */
    static resolve (packagePath) {
        const fileName = "package.json";

        if (
            !existsSync(packagePath)
                || !packagePath.endsWith(fileName)
        ) {
            packagePath = path.resolve(
                path.join(
                    packagePath,
                    fileName
                )
            );
        }

        return packagePath;
    }


    static writeFileSync (
        packagePath,
        packageJSON
    ) {
        packagePath = PackageJSON.resolve(packagePath);

        return writeFileSync(
            packagePath,
            PackageJSON.stringify(packageJSON) + '\n',
            'utf-8'
        );
    }


    static stringify (packageJSON) {
        if (typeof packageJSON.stringify === 'function') {
            return packageJSON.stringify();
        } else {
            return JSON.stringify(packageJSON);
        }
    }


    constructor (
        name,
        options = {}
    ) {
        this.name = name;
        this.main = options.main ?? PackageJSON.default().main;
        this.version = options.version ?? PackageJSON.default().version;
        this.dependencies = options.dependencies ?? PackageJSON.default().dependencies;
        this.devDependencies = options.devDependencies ?? PackageJSON.default().devDependencies;
    }


    addDependency (
        packageName,
        version
    ) {
        this.dependencies[packageName] = version;
    }


    getName () {
        return this.name;
    }


    getVersion () {
        return this.version;
    }


    removeDependency (packageName) {
        delete this.dependencies[packageName];
    }


    stringify (
        replacer = null,
        space = 2
    ) {
        return JSON.stringify(
            this,
            replacer,
            space
        );
    }
}


module.exports = PackageJSON;
