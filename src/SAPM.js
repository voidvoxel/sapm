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
 * @since v0.1.0-alpha
 * @version 0.1.0
 */
class SAPM extends PluginManager {
    /**
     * The current working directory of this `SAPM` instance.
     *
     * @type {string}
     * @private
     * @since v0.1.0-alpha
     * @version 0.1.0
     */
    #cwd

    /**
     * The path to install dependencies into.
     * Normally, this is set to `node_modules`.
     *
     * @type {string}
     * @private
     * @since v0.1.0-alpha
     * @version 0.1.0
     */
    #installPath

    /**
     * A list of all currently loaded dependencies.
     *
     * @type {*[]}
     * @private
     * @since v0.1.0-alpha
     * @version 0.1.0
     */
    #loaded

    /**
     * The `PackageJSON` associated with this package.
     *
     * @type {PackageJSON}
     * @private
     * @since v0.1.0-alpha
     * @version 0.1.0
     */
    #packageJSON

    /**
     * Create a new `SAPM` instance.
     *
     * @since v0.1.0-alpha
     * @version 0.1.0
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
        this.#cd(cwd);

        // Set the install path (where packages are installed).
        // This is normally set to `node_modules`.
        this.#setInstallPath(options.installPath);

        // Initialize the loaded package map.
        this.#loaded = {};

        // If the `package.json` file already exists, load it.
        // Otherwise, create a new one from the little knowledge we have.
        if (PackageJSON.existsSync(cwd)) {
            // Load the `package.json` file from the given path.
            // TODO: Call `await PackageJSON.readFile(...)` instead.
            this.#packageJSON = PackageJSON.readFileSync(cwd);
        } else {
            // Create a template `package.json` to get the user started if none
            // already exists in the given package directory.
            this.#packageJSON = PackageJSON.from(
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
     *
     * @since v0.1.0-alpha
     * @version 0.1.0
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
        const dependencyNames = Object.keys(this.#packageJSON.dependencies);

        if (dependencyNames.includes(name)) {
            // TODO: Ensure the correct symver requirement is met.
            return true;
        }

        return false;
    }


    /**
     * Get the path to the current working directory.
     *
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @returns {string}
     * The path to the current working directory.
     */
    cwd () {
        return this.#cwd;
    }


    /**
     * Get the path to the `node_modules` directory.
     *
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @returns {string}
     * The path to `node_modules`.
     */
    getInstallPath () {
        return this.#installPath;
    }


    /**
     * Get the name of the package being modified.
     *
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @returns {string}
     * The name of the package.
     */
    getPackageName () {
        return this.#packageJSON.name;
    }


    /**
     * Install one or more dependencies.
     *
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @param  {...any} packageNames
     * A list of all dependencies to install.
     */
    async install (...packageNames) {
        for (let packageName of packageNames) {
            await this.#installPackage(packageName);
        }
    }


    /**
     * Get a list of all packages currently loaded into memory.
     *
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @returns {*[]}
     * A list of all loaded packages.
     */
    loaded () {
        return { ...this.#loaded };
    }


    /**
     * Get the `package.json` file associated with this package.
     *
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @returns {PackageJSON}
     * The `package.json` file associated with this package.
     */
    packageJSON () {
        return this.#packageJSON;
    }


    /**
     * Add a package as a dependency.
     *
     * @private
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @param {string} packageName
     * The name of the package to add as a dependency.
     * @private
     */
    async #addDependency (
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


    /**
     * Change the current working directory of this `SAPM` instance.
     *
     * @private
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @param {string} dir
     * The directory to change to.
     */
    #cd (dir) {
        this.#cwd = dir;
    }


    /**
     * Install a single package as a dependency.
     *
     * @private
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @param {string} packageName
     * The name of the package.
     * @param {string?} version
     * The earliest required version of the package.
     * The version that this sapm decides on must be compatible with the
     * version that you're trying to install.
     */
    async #installPackage (
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

            await this.#addDependency(
                packageName,
                version
            );
        } else {
            await super.install(packageName);

            await this.#addDependency(packageName);
        }
    }


    /**
     * WARNING: Predicted to cause performance overhead if used at runtime.
     *
     * Load all of the package's dependencies at once.
     *
     * @private
     * @since v0.1.0-alpha
     * @version 0.1.0
     */
    #loadAllDependencies () {
        const dependencyMap = this.#packageJSON.dependencies;

        for (let name in dependencyMap) {
            this.#loadDependency(name);
        }
    }


    /**
     * Load a single installed dependency.
     * The dependency must already be installed,
     * or this method will throw an error.
     *
     * @private
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @param {string} name
     * The name of the dependency to load.
     * @returns
     * The loaded dependency.
     */
    #loadDependency (
        name
    ) {
        if (typeof this.#loaded[name] === 'object') {
            return this.#loaded[name];
        }

        return this.#loaded[name] = super.require(name);
    }


    /**
     * Set the path to install packages into
     * (Usually, this is `node_modules`).
     *
     * @private
     * @since v0.1.0-alpha
     * @version 0.1.0
     * @param {string} installPath
     */
    #setInstallPath (installPath) {
        this.#installPath = installPath;
    }
}


module.exports = SAPM;
