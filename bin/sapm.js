#!/usr/bin/env node


const { execSync } = require('child_process');
const { parseArgs } = require('util');


const SAPM = require('..');


let sapm = null;


const PARSE_ARGS_OPTIONS = {
    'package-lock-only': {
        type: 'boolean',
        default: false
    },
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
    logSubcommandUsage('uninstall');
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

        case 'i':
        case 'install':
            console.log("sapm install           Install all of the dependencies in your project.");
            console.log("sapm install <foo>     Add the dependency <foo> to your project.");
            break;

        case 'un':
        case 'uninstall':
            console.log("sapm uninstall         Uninstall all of the dependencies in your project.");
            console.log("sapm uninstall <foo>   Remove the dependency <foo> from your project.");
            break;

        case 'test':
            console.log("sapm test              Run any tests for this project.");
            break;

        case 'run':
            console.log("sapm run <foo>         Run the script named <foo>,");
            break;
    }
}


async function install (
    options = {},
    ...packageNames
) {
    const packageLockOnly = options['package-lock-only'];

    // If `sapm i --package-lock-only` was called,
    // then update `package-lock.json` and exit early.
    if (packageLockOnly) {
        updatePackageLockJSON();
        exit();
    }

    const packagePath = options.cwd ?? process.cwd();

    sapm = new SAPM(
        packagePath,
        {
            installPath: options.installPath ?? null
        }
    );

    await sapm.install(...packageNames);
}


async function uninstall (
    options = {},
    ...packageNames
) {
    const packagePath = options.cwd ?? process.cwd();

    sapm = new SAPM(
        packagePath,
        {
            installPath: options.installPath ?? null
        }
    );

    await sapm.uninstall(...packageNames);
}


async function runSubcommand (
    subcommand,
    args
) {
    switch (subcommand) {
        default: {
            logUsage();

            return;
        }

        case 'i':
        case 'install': {
            const options = args.values;
            const packageNames = args.positionals;

            await install(
                options,
                ...packageNames
            );

            return;
        }

        case 'un':
        case 'uninstall': {
            const options = args.values;
            const packageNames = args.positionals;

            await uninstall(
                options,
                ...packageNames
            );

            return;
        }
    }
}


async function exit (code = 0) {
    updatePackageLockJSON();

    process.exit(code);
}


async function updatePackageLockJSON () {
    try {
        execSync("npm i --package-lock-only");
    } catch {
        execSync("sapm i --package-lock-only");
    }
}


async function main (args) {
    if (args.positionals.length === 0) {
        logUsage();

        return;
    }

    const subcommand = args.positionals[0];

    args.positionals = args.positionals.splice(1);

    await runSubcommand(
        subcommand,
        args
    );

    exit();
}


main(parseArguments());
