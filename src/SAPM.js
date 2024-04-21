const { PluginManager } = require('live-plugin-manager');
const PackageJSON = require('./PackageJSON');
const path = require('path');


/**
 * `sapm` (Silver Ant Package Manager) is a package manager designed to allow
 * publishing and sharing code across a decentralized network.
 *
 * The `SAPM` class contains everything needed to use
 * the Silver Ant Package Manager as a drop-in replacement for `npm`,
 * including support for 100% programmatic usage if desired; no CLI necessary.
 *
 * To get started, simply pass the path to the root directory of the JavaScript
 * package that you would like to modify.
 * For example, to modify a package located at
 * `./Documents/GitHub/my-lovely-app/package.json`,
 * run the following code:
 *
 * ```js
 * const sapm = new SAPM("./Documents/GitHub/my-lovely-app");
 * ```
 *
 * or
 *
 * ```js
 * const sapm = new SAPM("./Documents/GitHub/my-lovely-app/package.json");
 * ```
 *
 * Then, to install a few packages, run:
 *
 * ```js
 * await sapm.install('moment', 'block-storage', 'zerda.js');
 * ```
 *
 * or
 *
 * ```js
 * const packageNames = [ 'moment', 'block-storage', 'zerda.js' ];
 *
 * await sapm.install(...packageNames);
 * ```
 *
 * For more information, please refer to
 * [the README file](https://github.com/voidvoxel/sapm)
 * .
 */
class SAPM extends PluginManager {
    /**
     *
     * @param {string} packagePath
     * The path to either the package directory or `package.json` file.
     * @param {*} options
     */
    constructor (
        packagePath,
        options = {}
    ) {
        // If the `package.json` path was given, trim it down to the directory.
        if (packagePath.endsWith('package.json')) {
            packagePath = path.dirname(packagePath);
        }

        // If no package path was provided, use the current working directory.
        options.cwd = packagePath ??= process.cwd();

        const cwd = options.cwd;

        // Resolve the install path
        options.installPath ??= path.resolve(
            path.join(
                cwd,
                'node_modules'
            )
        );

        options.pluginsPath = options.installPath;

        delete options.installPath;

        // Parse the default package name from the package path if none was
        // provided.
        let defaultPackageName = packagePath
            .replace('\\', '/')
            .split('/');

        // Use the name of the current working directory as the package name.
        defaultPackageName = defaultPackageName[defaultPackageName.length - 1];

        // Invoke the super constructor.
        super(options);

        // Update our reference to the current working directory.
        this._cd(cwd);

        // Set the install path (where packages are installed).
        // This is normally set to `node_modules`.
        this._setInstallPath(options.installPath);

        // Initialize the loaded package map.
        this._loaded = {};

        // If the `package.json` file already exists, load it.
        // Otherwise, create a new one from the little knowledge we have.
        if (PackageJSON.existsSync(cwd)) {
            // Load the `package.json` file from the given path.
            // TODO: Call `await PackageJSON.readFile(...)` instead.
            this._packageJSON = PackageJSON.readFileSync(cwd);
        } else {
            // Create a template `package.json` to get the user started if none
            // already exists in the given package directory.
            this._packageJSON = PackageJSON.from(
                {
                    name: defaultPackageName,
                    version: PackageJSON.default().version,
                    main: PackageJSON.default().main
                }
            );
        }
    }


    /**
     * If version `version` of `name` is met, returns `true`.
     * Returns `false` in all other cases.
     * @param {string} name
     * The name of the package that you would like to test for.
     * @param {string} version
     * The version you would like to test for.
     * @param {"satisfies" | "satisfiesOrGreater"} mode
     * Which mode to use when checking if the version requirement is met.
     * @returns {boolean}
     * Whether or not the package is installed.
     */
    alreadyInstalled (
        name,
        version,
        mode
    ) {
        const dependencyNames = Object.keys(this._packageJSON.dependencies);

        if (dependencyNames.includes(name)) {
            // TODO: Ensure the correct symver requirement is met.
            return true;
        }

        return false;
    }


    /**
     * Get the path to the current working directory.
     * @returns {string}
     * The path to the current working directory.
     */
    cwd () {
        return this._cwd;
    }


    /**
     * Get the path to the `node_modules` directory.
     * @returns {string}
     * The path to `node_modules`.
     */
    getInstallPath () {
        return this._nodeModulesPath;
    }


    /**
     * Get the name of the package being modified.
     * @returns {string}
     * The name of the package.
     */
    getPackageName () {
        return this._packageJSON.name;
    }


    /**
     * Install one or more dependencies.
     * @param  {...any} packageNames
     * A list of all dependencies to install.
     */
    async install (...packageNames) {
        for (let packageName of packageNames) {
            await this._installPackage(packageName);
        }
    }


    /**
     * Get a list of all packages currently loaded into memory.
     * @returns {*[]}
     * A list of all loaded packages.
     */
    loaded () {
        return { ...this._loaded };
    }


    /**
     * Get the `package.json` file associated with this package.
     * @returns {PackageJSON}
     * The `package.json` file associated with this package.
     */
    packageJSON () {
        return this._packageJSON;
    }


    /**
     * Add a package as a dependency.
     * @param {string} packageName
     * The name of the package to add as a dependency.
     * @private
     */
    async _addDependency (
        packageName,
        version
    ) {
        if (typeof version !== 'string') {
            const packageInfo = this.getInfo(packageName);

            version ??= packageInfo.version;
        }

        const cwd = this.cwd();

        const packageJSON = this.packageJSON();

        packageJSON.addDependency(
            packageName,
            version
        );

        PackageJSON.writeFileSync(
            this.cwd(),
            packageJSON
        );
    }


    _cd (dir) {
        this._cwd = dir;
    }


    async _installPackage (
        packageName,
        version = null
    ) {
        const isScoped = packageName.startsWith('@');

        let isNameVersioned;

        if (isScoped) {
            isNameVersioned = packageName.substring(1).includes('@');
        } else {
            isNameVersioned = packageName.includes('@');
        }

        if (!version) {
            if (isNameVersioned) {
                [
                    packageName,
                    version
                ] = packageName.split('@');
            }
        }

        if (typeof version === 'string') {

            await super.install(
                packageName,
                version
            );

            await this._addDependency(
                packageName,
                version
            );
        } else {
            await super.install(packageName);

            await this._addDependency(packageName);
        }
    }


    _loadAllDependencies () {
        const dependencyMap = this._packageJSON.dependencies;

        for (let name in dependencyMap) {
            this._loadDependency(name);
        }
    }


    _loadDependency (
        name
    ) {
        if (typeof this._loaded[name] === 'object') {
            return this._loaded[name];
        }

        return this._loaded[name] = super.require(name);
    }


    _setInstallPath (nodeModulesPath) {
        this._nodeModulesPath = nodeModulesPath;
    }
}


module.exports = SAPM;
