const { parseArgs } = require('util');


const PARSE_ARGS_OPTIONS = {
    'save-dev': {
        type: 'boolean',
        short: 'D',
        default: false
    },
    'save-global': {
        type: 'boolean',
        short: 'g',
        default: false
    }
};


const PARSE_ARGS_CONFIG = {
    args: [],
    options: PARSE_ARGS_OPTIONS,
    strict: true,
    allowPositionals: true,
    tokens: false
}


function parseArguments (args = null) {
    const config = structuredClone(PARSE_ARGS_CONFIG);

    args ??= process.argv.splice[2];

    config.args = args;

    return parseArgs(config);
}


function logUsage () {
    console.log("sapm <command>");
    console.log();
    console.log("Usage:");
    console.log();

    logSubcommandUsage('help');
    logSubcommandUsage('install');
    logSubcommandUsage('test');
    logSubcommandUsage('run');

    console.log();
}


function logSubcommandUsage (subcommand) {
    switch (subcommand) {
        default:
            throw new Error(`Invalid subcommand '${subcommand}'.`);

        case 'help':
            console.log("sapm help           help and usage");
            break;

        case 'install':
            console.log("sapm install        Install all of the dependencies in your project.");
            console.log("sapm install <foo>  Add the dependency <foo> to your project.");
            break;

        case 'test':
            console.log("sapm test           Run any tests for this project.");
            break;

        case 'run':
            console.log("sapm run <foo>      Run the script named <foo>,");
            break;
    }
}


async function main (args) {
    if (args.positionals.length === 0) {
        logUsage();

        return;
    }

    const subcommand = args.positionals[0];
}


main(parseArguments());
