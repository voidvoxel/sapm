const { PluginManager } = require('live-plugin-manager');


class SAPM extends PluginManager {
    constructor (options = {}) {
        options.cwd ??= process.cwd();

        options.nodeModulesPath &&= options.cwd;
        options.pluginsPath = options.nodeModulesPath ?? "node_modules";

        super(options);
    }


    install (...packageNames) {
        for (let packageName of packageNames) {
            this._installPackage(packageName);
        }
    }


    _installPackage (
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
            super.install(
                packageName,
                version
            );
        } else {
            super.install(packageName);
        }
    }
}


module.exports = SAPM;
