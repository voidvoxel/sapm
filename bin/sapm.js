#!/usr/bin/env node


const { execSync } = require('child_process');
const { parseArgs, promisify } = require('util');

const exec = promisify(execSync);


const SAPM = require('..');
const PackageJSON = require('../src/PackageJSON');
const path = require('path');


let sapm = null;


const SAPM_PACKAGE_PATH = path.resolve(
    path.join(
        __dirname,
        ".."
    )
);


const PARSE_ARGS_OPTIONS = {
    'help': {
        type: 'boolean',
        short: 'h',
        default: false
    },
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
    },
    'usage': {
        type: 'boolean',
        default: false
    },
    'version': {
        type: 'boolean',
        short: 'v',
        default: false
    }
};


const VALID_SUBCOMMANDS = [
    'help', '?',
    'install', 'i',
    'shrinkwrap',
    'uninstall', 'un',
    'usage',
    'version'
];


const VALID_OPTIONS = [];

for (let optionName in PARSE_ARGS_OPTIONS) {
    VALID_OPTIONS.push(optionName);

    if (PARSE_ARGS_OPTIONS[optionName].short) {
        const shortOptionName = PARSE_ARGS_OPTIONS[optionName].short;

        VALID_OPTIONS.push(shortOptionName);
    }
}


function isValidSubcommand (subcommand) {
    return VALID_SUBCOMMANDS.includes(subcommand);
}


function sapmInstallDir () {
    if (typeof this._installDir === 'string') {
        return this._installDir;
    }

    this._installDir = path.resolve(
        path.dirname(
            process.argv[1]
        )
    );

    return this._installDir = this._installDir.substring(0, this._installDir.length - 4);
}


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


async function logVersion () {
    const packageJSON = PackageJSON.readFileSync(SAPM_PACKAGE_PATH);

    let installDir = sapmInstallDir();

    console.log(`${packageJSON.name} ${packageJSON.version}`);
    console.log(`${packageJSON.description}`);
    console.log(`sapm install path: ${installDir}`);
}


async function install (
    options = {},
    ...packageNames
) {
    const packageLockOnly = options['package-lock-only'];

    // If `sapm i --package-lock-only` was called,
    // then update `package-lock.json` and exit early.
    if (packageLockOnly) {
        await updatePackageLockJSON();
        await exit();
    }

    if (packageNames.length === 0) {
        logUsage();

        return;
    }

    const packagePath = options.cwd ?? process.cwd();

    sapm = new SAPM(
        packagePath,
        {
            installPath: options.installPath ?? null
        }
    );

    await sapm.install(...packageNames);

    await updatePackageLockJSON();
}


async function shrinkwrap (
    options = {}
) {
    const packagePath = options.cwd ?? process.cwd();

    sapm = new SAPM(
        packagePath,
        {
            installPath: options.installPath ?? null
        }
    );

    await sapm.shrinkwrap();

    await updatePackageLockJSON();
}


async function uninstall (
    options = {},
    ...packageNames
) {
    if (packageNames.length === 0) {
        logUsage();

        return;
    }

    const packagePath = options.cwd ?? process.cwd();

    sapm = new SAPM(
        packagePath,
        {
            installPath: options.installPath ?? null
        }
    );

    await sapm.uninstall(...packageNames);

    await updatePackageLockJSON();
}


/**
 * Update the package's version.
 *
 * @param {'major'|'minor'|'patch'|'premajor'|'preminor'|'prepatch'|
 * 'prerelease'|'from-git'|string
 * } v
 * Either a version number or a string containing the part of the version to
 * increment (e.g. `'major'`, `'patch'`, `'prerelease'`, etc.).
 */
async function version (v) {
    try {
        await exec(`npm version ${v}`);
    } catch {
        throw new Error("Not` yet implemented.");
    }
}


async function runSubcommand (
    subcommand,
    args
) {
    if (args.values['help'] || args.values['h']) {
        subcommand = 'help';
    } else if (args.values['usage']) {
        subcommand = 'usage';
    } else if (args.values['version'] || args.values['v']) {
        await logVersion();
        await exit();
    }

    const noPositionals = args.positionals.length === 0;

    if (noPositionals && !isValidSubcommand(subcommand)) {
        logUsage();

        return;
    }

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

        case 'shrinkwrap': {
            const options = args.values;

            await shrinkwrap(options);

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

        case 'version': {
            const positionals = args.positionals;

            for (let positional in positionals) {
                await version(positional);
            }

            return;
        }
    }
}


async function exit (code = 0) {
    if (code !== 0) {
        await updatePackageLockJSON();
    }

    process.exit(code);
}


async function updatePackageLockJSON () {
    try {
        await exec("npm i --package-lock-only");
    } catch {
        throw new Error("Not yet implemented.");
    }
}


async function main (args) {
    const subcommand = args.positionals[0] ?? 'help';

    args.positionals = args.positionals.splice(1);

    await runSubcommand(
        subcommand,
        args
    );

    exit();
}


main(parseArguments());
