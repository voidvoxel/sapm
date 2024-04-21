const { existsSync, rmdirSync } = require('fs');

const {
    rm,
    mkdir
} = require('fs').promises;

const path = require('path');


const SAPM = require("../src");
const { rmdir } = require('fs/promises');


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

        await sapm.install(packageName);

        const installSuccessful = sapm.alreadyInstalled(packageName)

        expect(installSuccessful).toBe(true);

        // expect(installSuccessful.hasOwnProperty('name')).toBe(true);
        // expect(installSuccessful.hasOwnProperty('version')).toBe(true);

        // expect(installSuccessful.name).toBe(packageName);
        // expect(installSuccessful.version).toBe(version);

        finalize();
    }
);
