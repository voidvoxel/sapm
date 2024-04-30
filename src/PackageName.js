class PackageName {
    /**
     * The name of the dependency.
     * @type {string}
     */
    #name

    /**
     * The version requirement of the dependency.
     */
    #scope


    static parse (packageNameString) {
        return new PackageName().fromString(packageNameString);
    }


    static stringify (packageDependency) {
        return packageDependency.toString();
    }


    constructor (
        name,
        scope = null
    ) {
        this.setName(name);

        if (scope) {
            this.setScope(scope);
        }
    }


    fromString (string) {
        if (string.includes('/')) {
            let split = string.split('/');

            this.setName(split[1]);
            this.setScope(split[0]);
        } else {
            this.setName(string);
            this.setScope(null);
        }

        return this;
    }


    getName () {
        return this.#name;
    }


    getScope () {
        return this.#scope;
    }


    setName (name) {
        this.#name = name;
    }


    setScope (scope) {
        this.#scope = scope;
    }


    toJSON () {
        return {
            name: this.getName(),
            scope: this.getScope()
        };
    }


    toString () {
        return `${this.getScope()}/${this.getName()}`;
    }
}


const packageName = PackageName.parse("@voidvoxel/position-3d");

console.log(packageName.toString());


module.exports = PackageName;
