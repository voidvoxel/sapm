const { existsSync, rmdirSync } = require('fs');

const {
    rm,
    mkdir
} = require('fs').promises;

const path = require('path');


const SAPM = require("../src");
const { rmdir } = require('fs/promises');


const TEST_UNINSTALL_PATH = path.resolve(
    path.join(
        "tmp",
        "test",
        "uninstall",
    )
);


async function initialize () {
    if (!existsSync(TEST_UNINSTALL_PATH)) {
        await mkdir(
            TEST_UNINSTALL_PATH,
            {
                recursive: true
            }
        );
    }
}


async function finalize () {
    await rm(
        TEST_UNINSTALL_PATH,
        {
            recursive: true
        }
    );
}


test(
    "uninstall a package",
    async () => {
        await initialize();

        const sapm = new SAPM(TEST_UNINSTALL_PATH);

        const packageName = 'moment';

        await sapm.install(packageName);

        const installSuccessful = sapm.alreadyInstalled(packageName);

        expect(installSuccessful).toBe(true);

        await sapm.uninstall(packageName);

        const uninstallSuccessful = installSuccessful && !sapm.alreadyInstalled(packageName);

        expect(uninstallSuccessful).toBe(true);

        finalize();
    }
);
