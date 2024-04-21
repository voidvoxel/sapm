const { PluginManager } = require('live-plugin-manager');
const PackageJSON = require('./PackageJSON');
const path = require('path');


class SAPM extends PluginManager {
    constructor (options = {}) {
        options.cwd ??= process.cwd();

        options.installPath ??= path.resolve(
            path.join(
                options.cwd,
                'node_modules'
            )
        );

        options.pluginsPath
            = options.installPath
                ?? options.cwd + "node_modules";

        super(options);

        this._cwd = options.cwd;

        this._setInstallPath(options.installPath);
    }


    async install (...packageNames) {
        for (let packageName of packageNames) {
            this._installPackage(packageName);
        }
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
        packageName
    ) {
        const packageInfo = this.getInfo(packageName);

        const version = packageInfo.version;

        // TODO: Call `await PackageJSON.readFile(...)` instead.
        const packageJSON = PackageJSON.readFileSync(this.cwd());

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
