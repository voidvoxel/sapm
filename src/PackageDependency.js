const semver = require('semver');
const { SemVer } = semver;
const PackageName = require('./PackageName');


class PackageDependency {
    /**
     * The name of the dependency.
     * @type {string|PackageName}
     */
    #name

    /**
     * The version requirement of the dependency.
     * @type {string|SemVer}
     */
    #version


    static parse (versionString) {
        return new PackageDependency().fromString(versionString);
    }


    static stringify (packageDependency) {
        return packageDependency.toString();
    }


    constructor (
        name,
        version
    ) {
        if (name) {
            this.setName(name);
        } else {
            this.setName('example');
        }

        if (version) {
            this.setVersion(version);
        } else {
            this.setVersion("0.0.0");
        }
    }


    fromString (versionString) {
        let splitVersionString = versionString.split('@');

        if (splitVersionString[0] === '') {
            splitVersionString = [
                '@' + splitVersionString[1],
                splitVersionString[1] = splitVersionString[2]
            ];
        }

        this.setName(splitVersionString[0]);
        this.setVersion(splitVersionString[1]);

        return this;
    }


    getName () {
        return this.#name;
    }


    getVersion () {
        return this.#version;
    }


    setName (name) {
        if (typeof name === 'string') {
            name = PackageName.parse(name);
        }
        console.log('name:', name.getName().toString());

        if (name instanceof PackageName) {
            this.#name = name;
        } else {
            throw new Error(`Invalid name '${name}'`)
        }
    }


    setVersion (version) {
        if (typeof version === 'string') {
            version = semver.parse(version);
        }

        this.#version = version;
    }


    toJSON () {
        return {
            name: this.getName(),
            version: this.getVersion().toString()
        };
    }


    toString () {
        return `${this.getName()}@${this.getVersion()}`;
    }
}


module.exports = PackageDependency;
