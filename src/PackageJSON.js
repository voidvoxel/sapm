const {
    existsSync,
    readFileSync,
    writeFileSync
} = require("fs");

const path = require("path");


/**
 * The `PackageJSON` class represents a `package.json` file.
 * Query and manipulate `package.json` files with convinient methods.
 *
 * To load an existing `package.json` file, perhaps try the following code:
 *
 * ```js
 * // The path to either the package directory or to the `package.json` file.
 * const filePath = "path/to/the/package/";
 * // Read and parse the file into a `PackageJSON` instance.
 * const packageJSON = PackageJSON.readFileSync(filePath);
 * // Remove a dependency from `package.json` without removing it from
 * // the `node_modules/` directory.
 * packageJSON.dependencies["moment"];
 * // Save our changes to the file.
 * PackageJSON.writeFileSync(filePath);
 * ```
 *
 * To create a new `PackageJSON` from scratch is just as easy:
 *
 * ```js
 * // Create a new `package.json` for a package named `foo`.
 * const packageJSON = new PackageJSON('foo');
 * // Set the version of the new `foo` package to '1.0.0'.
 * packageJSON.version = "1.0.0";
 * // Add `moment@2.29.4` as a package dependency.
 * const dependency = { name: 'moment', version: '2.29.4' };
 * packageJSON.dependencies.push(dependency);
 * // Save our changes to the file.
 * PackageJSON.writeFileSync(packageJSON);
 * ```
 *
 * @since v0.1.0-alpha
 * @version 0.1.0
 */
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


    /**
     * If a `package.json` file exists at the given package path,
     * then return `true`.
     * Otherwise return `false` in all other situations.
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @param {import("fs").PathLike} packagePath
     * @returns {boolean}
     * Whether or not the `package.json` file exists.
     */
    static existsSync (packagePath) {
        packagePath = PackageJSON.resolve(packagePath);

        return existsSync(packagePath);
    }


    /**
     * Convert a JSON object into an `PackageJSON` instance.
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @param {*} json
     * The JSON object to clone.
     * @returns
     */
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


    /**
     * Parse the output of `PackageJSON#stringify` or `JSON#stringify` into an
     * instance of `PackageJSON`.
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @param {string} jsonString
     * A stringified `PackageJSON`.
     * This is the same as if you had read the text contents of a
     * `package.json` file.
     * @returns
     */
    static parse (jsonString) {
        const json = JSON.parse(jsonString);

        return PackageJSON.from(json);
    }


    /**
     * Read a local `package.json` file (synchronously).
     * @since v0.1.0-alpha
     * @version 0.1.0
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
     * @since v0.1.0-alpha
     * @version 0.1.1
     * @param {string} packagePath
     * The `package.json` path to resolve.
     * @returns {string} The resolved path.
     */
    static resolve (packagePath) {
        packagePath = path.resolve(packagePath);

        return this.resolveShallow(packagePath);
    }


    /**
     * Resolve a path to a `package.json` file.
     * @since v0.1.0
     * @version 0.1.0
     * @param {string} packagePath
     * The `package.json` path to resolve.
     * @returns {string} The resolved path.
     */
    static resolveShallow (packagePath) {
        const fileName = "package.json";

        if (!packagePath.endsWith(fileName)) {
            packagePath = path.join(
                packagePath,
                fileName
            )
        }

        return packagePath;
    }


    /**
     * Returns undefined.
     * The mode option only affects the newly created file.
     * See open for more details.
     * For detailed information,
     * see the documentation of the asynchronous version of this API:
     * `SAPM#writeFile`.
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @param {string} packagePath
     * The path to the package to write the `package.json` to.
     * @param {PackageJSON} packageJSON
     * // The contents to write to `package.json`.
     */
    static writeFileSync (
        packagePath,
        packageJSON
    ) {
        packagePath = PackageJSON.resolve(packagePath);

        writeFileSync(
            packagePath,
            PackageJSON.stringify(packageJSON) + '\n',
            'utf-8'
        );
    }


    /**
     * Convert a `PackageJSON` instance into a JSON string.
     * Almost identical in function to `JSON::stringify`.
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @param {PackageJSON} packageJSON
     * The `PackageJSON` to stringify.
     * @returns {string}
     * This `PackageJSON` encoded as a string.
     */
    static stringify (packageJSON) {
        if (typeof packageJSON.stringify === 'function') {
            return packageJSON.stringify();
        } else {
            return JSON.stringify(packageJSON);
        }
    }


    /**
     * Create a new `PackageJSON` instance.
     * To create a new `package.json` file,
     * simply write your modified `PackageJSON`
     * back to your `package.json` file by using
     *
     * ```js
     * const packageJSON = new PackageJSON('hello-world');
     * packageJSON.version = "4.2.0";
     * PackageJSON.writeFileSync(packageJSON);
     * ```
     *
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @param {string} name
     * The name of the package (i.e. `foo-bar` or `@you/your-own-app`).
     * @param {IPackageJSON} options
     */
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


    /**
     * Add a new dependency to the `PackageJSON` without downloading or
     * installing any packages.
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @param {string} packageName
     * The name of the package to add.
     * @param {string} version
     * The version requirement the added dependency should meet.
     */
    addDependency (
        packageName,
        version
    ) {
        this.dependencies[packageName] = version;
    }


    /**
     * Get the name of this package.
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @returns {string}
     * The name of this package.
     */
    getName () {
        return this.name;
    }


    /**
     * Get the version of this package.
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @returns {string}
     * The version of this package.
     */
    getVersion () {
        return this.version;
    }


    /**
     * Remove a package from the dependencies list.
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @param {string} packageName
     * The name of the package to remove.
     */
    removeDependency (packageName) {
        delete this.dependencies[packageName];
    }


    /**
     * Stringify this `PackageJSON`.
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @param {((this: any, key: string, value: any) => any)} replacer
     * @param {number | string} space
     * @returns
     */
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
