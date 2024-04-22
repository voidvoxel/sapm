const SAPM = require("../src");


async function main () {
    // Create a new package.
    // Equivalent command:
    // cd tmp/app && npm init -y
    const sapm = new SAPM("tmp/app");

    // Install `moment`, `block-stream`, and `@voidvoxel/position-3d`.
    // Equivalent command:
    // sapm install moment block-stream @voidvoxel/position-3d
    await sapm.install(
        'moment',
        'block-stream',
        '@voidvoxel/position-3d'
    );
}


main();
