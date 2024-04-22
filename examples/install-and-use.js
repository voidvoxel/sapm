const SAPM = require("../src");


async function main () {
    // Create a new package.
    // Equivalent command:
    // cd tmp/app && npm init -y
    const sapm = new SAPM("tmp/app");

    // Install dependency `moment`.
    // Equivalent command:
    // sapm install moment
    const packageName = 'moment';
    await sapm.install(packageName);

    // Require and use the module.
    // Equivalent command:
    // node -e "console.log( require('moment').now() );"
    const package = sapm.require(packageName);
    const time = package.now();
    console.log('time:', time);
}


main();
