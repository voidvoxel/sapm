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


const VALID_NPM_SUBCOMMANDS = [
    'access', 'adduser', 'audit', 'bugs', 'cache', 'ci', 'completion',
    'config', 'dedupe', 'deprecate', 'diff', 'dist-tag', 'docs', 'doctor',
    'edit', 'exec', 'explain', 'explore', 'find-dupes', 'fund', 'get', 'help',
    'help-search', 'hook', 'init', 'install', 'install-ci-test',
    'install-test', 'link', 'll', 'login', 'logout', 'ls', 'org', 'outdated',
    'owner', 'pack', 'ping', 'pkg', 'prefix', 'profile', 'prune', 'publish',
    'query', 'rebuild', 'repo', 'restart', 'root', 'run-script', 'sbom',
    'search', 'set', 'shrinkwrap', 'star', 'stars', 'start', 'stop', 'team',
    'test', 'token', 'uninstall', 'unpublish', 'unstar', 'update', 'version',
    'view', 'whoami'
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


function isValidSubcommandNpm (subcommand) {
    return VALID_NPM_SUBCOMMANDS.includes(subcommand);
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
    strict: false,
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
        const execOptions = {
            stdio: [
                'ignore',
                'ignore',
                'ignore'
            ]
        };

        await exec(
            `npm version ${v}`,
            execOptions
        );
    } catch (error) {
        error.message = error.message.replaceAll("npm", "sapm");

        console.log("Error:", error.message);
        console.log("    Ensure that your Git repo has no unstaged changes.");
        console.log("    If that doesn't help, installing `npm` may resolve the issue.");
        console.log("    This is because `sapm` stubs are forwarded directly to `npm` as a fallback.");

        await exit(1);
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
    if (!isValidSubcommand(subcommand)) {
        const npmArgs = process.argv.splice(2);

        if (isValidSubcommandNpm(subcommand)) {
            try {
                const command = "npm " + npmArgs.join(' ');

                const execArgs = {
                    stdio: [
                        'inherit',
                        'inherit',
                        'inherit'
                    ]
                };

                await exec(
                    command,
                    execArgs
                );
            } catch (error) {
                logUsage();

                await exit(1);
            }
        }

        logUsage();

        await exit(1);
    }

    switch (subcommand) {
        default: {
            logUsage();

            return;
        }

        case 'h':
        case 'help': {
            logUsage();
            await exit();
        }

        case 'usage': {
            logUsage();
            await exit();
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

            for (let positional of positionals) {
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
        await exec(
            "npm i --package-lock-only",
            {
                stdio: 'ignore'
            }
        );
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
