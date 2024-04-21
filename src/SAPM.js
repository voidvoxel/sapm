const { PluginManager } = require('live-plugin-manager');
const PackageJSON = require('./PackageJSON');
const path = require('path');


class SAPM extends PluginManager {
    constructor (
        packagePath,
        options = {}
    ) {
        if (packagePath.endsWith('package.json')) {
            packagePath = path.dirname(packagePath);
        }

        options.cwd = packagePath ??= process.cwd();

        const cwd = options.cwd;

        options.installPath ??= path.resolve(
            path.join(
                options.cwd,
                'node_modules'
            )
        );

        options.pluginsPath = options.installPath;

        delete options.installPath;

        let defaultPackageName = packagePath
            .replace('\\', '/')
            .split('/');

        defaultPackageName = defaultPackageName[defaultPackageName.length - 1];

        super(options);

        this.cd(cwd);

        this._setInstallPath(options.installPath);

        this._installed = {};

        if (PackageJSON.existsSync(cwd)) {
            // TODO: Call `await PackageJSON.readFile(...)` instead.
            this._packageJSON = PackageJSON.readFileSync(cwd);
        } else {
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
        return typeof super.alreadyInstalled(
            name,
            version,
            mode
        ) === 'object'
            || this._installed[name] === 'object'
            || false;
    }


    cd (dir) {
        this._cwd = dir;
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


    packageJSON () {
        return this._packageJSON;
    }


    async install (...packageNames) {
        for (let packageName of packageNames) {
            await this._installPackage(packageName);
        }
    }


    installed () {
        return { ...this._installed };
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
        if (typeof this._installed[name] === 'object') {
            return this._installed[name];
        }

        return this._installed[name] = super.require(name);
    }


    _setInstallPath (nodeModulesPath) {
        this._nodeModulesPath = nodeModulesPath;
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
}


module.exports = SAPM;
