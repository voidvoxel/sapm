const SAPM = require("../src");


async function main () {
    const sapm = new SAPM("tmp/app");

    const packageName = 'moment';

    await sapm.install(packageName);

    const package = sapm.require(packageName);

    const time = package.now();

    console.log('time:', time);
}


main();
