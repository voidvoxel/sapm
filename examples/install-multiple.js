const SAPM = require("../src");


async function main () {
    const sapm = new SAPM("tmp/app");

    await sapm.install(
        'moment',
        '@voidvoxel/position-3d',
        'block-stream'
    );
}


main();
