const {
    existsSync,
    readFileSync,
    writeFileSync
} = require("fs");

const path = require("path");


class PackageJSON {
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

        return new PackageJSON(json);
    }


    /**
     * Read a local `package.json` file (synchronously).
     * @param {import('fs').PathLike} packagePath
     * The path to the `package.json` file.
     * @returns {PackageJSON}
     * The read `package.json` file.
     */
    static readFileSync (packagePath) {
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

            return PackageJSON.readFileSync(packagePath);
        }

        const jsonString = readFileSync(
            packagePath,
            'utf-8'
        );

        const json = JSON.parse(jsonString);

        return PackageJSON.from(json);
    }


    static writeFileSync (
        packagePath,
        packageJSON
    ) {
        const fileName = "package.json";

        if (!packagePath.endsWith(fileName)) {
            packagePath = path.resolve(
                path.join(
                    packagePath,
                    "package.json"
                )
            );

            return PackageJSON.writeFileSync(
                packagePath,
                packageJSON
            );
        }

        return writeFileSync(
            packagePath,
            packageJSON.stringify(),
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
