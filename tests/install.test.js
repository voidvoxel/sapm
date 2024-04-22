const { existsSync, rmdirSync } = require('fs');

const {
    rm,
    mkdir
} = require('fs').promises;

const path = require('path');


const SAPM = require("../src");
const { rmdir } = require('fs/promises');
const PackageJSON = require('../src/PackageJSON');


const TEST_INSTALL_PATH = path.resolve(
    path.join(
        "tmp",
        "test",
        "install",
    )
);


async function initialize () {
    if (!existsSync(TEST_INSTALL_PATH)) {
        await mkdir(
            TEST_INSTALL_PATH,
            {
                recursive: true
            }
        );
    }
}


async function finalize () {
    await rm(
        TEST_INSTALL_PATH,
        {
            recursive: true
        }
    );
}


test(
    "install a package",
    async () => {
        await initialize();

        const sapm = new SAPM(TEST_INSTALL_PATH);

        const packageName = 'moment';
        const version = '2.29.4';

        const versionSplit = version.split('.');

        const versionMajor = Number.parseInt(versionSplit[0]);
        const versionMinor = Number.parseInt(versionSplit[1]);;

        await sapm.install(packageName);

        const installSuccessful = sapm.alreadyInstalled(packageName)

        expect(installSuccessful).toBe(true);

        const packageJSON = PackageJSON.readFileSync(
            path.resolve(
                path.join(
                    TEST_INSTALL_PATH,
                    "node_modules",
                    "moment"
                )
            )
        );

        expect(packageJSON.hasOwnProperty('name')).toBe(true);
        expect(packageJSON.hasOwnProperty('version')).toBe(true);

        expect(packageJSON.name).toBe(packageName);

        const installedVersionSplit = packageJSON.version.split('.');

        const installedVersionMajor = Number.parseInt(installedVersionSplit[0]);
        const installedVersionMinor = Number.parseInt(installedVersionSplit[1]);

        expect(installedVersionMajor).toBe(versionMajor);
        expect(installedVersionMinor).toBeGreaterThanOrEqual(versionMinor);
    }
);


test(
    "install a local package with a relative path",
    async () => {
        await initialize();

        const sapm = new SAPM(TEST_INSTALL_PATH);

        const sapmPackageJSON = PackageJSON.readFileSync('.');

        const packageName = '.';
        const version = sapmPackageJSON.version;

        const versionSplit = version.split('.');

        const versionMajor = Number.parseInt(versionSplit[0]);
        const versionMinor = Number.parseInt(versionSplit[1]);

        await sapm.install(packageName);

        const installSuccessful = sapm.alreadyInstalled(packageName)

        expect(installSuccessful).toBe(true);

        const packageJSON = PackageJSON.readFileSync(
            path.resolve(
                path.join(
                    TEST_INSTALL_PATH,
                    "node_modules",
                    "moment"
                )
            )
        );

        expect(packageJSON.hasOwnProperty('name')).toBe(true);
        expect(packageJSON.hasOwnProperty('version')).toBe(true);

        expect(packageJSON.name).toBe(packageName);

        const installedVersionSplit = packageJSON.version.split('.');

        const installedVersionMajor = Number.parseInt(installedVersionSplit[0]);
        const installedVersionMinor = Number.parseInt(installedVersionSplit[1]);

        expect(installedVersionMajor).toBe(versionMajor);
        expect(installedVersionMinor).toBeGreaterThanOrEqual(versionMinor);
    }
);
