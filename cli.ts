import type {EnvKey, EnvVars, DenoArgs, RawInitArgs, SanitizedInitArgs, i18n, Task, Command, CommandArgs} from './types.ts'
import type {Arguments} from 'https://deno.land/x/yargs/deno-types.ts'
import yargs from 'https://deno.land/x/yargs/deno.ts'
import {map, coalesce, resolve, reject, fork} from 'https://cdn.skypack.dev/fluture';
import {pipe, identity} from "https://deno.land/x/fun@v1.0.0/fns.ts"
import {match, __} from 'https://cdn.skypack.dev/ts-pattern'
import {getConfig, loadPlugins, getDefaultMaxConcurrency} from './taqueria-config.ts'
import type {SanitizedPath} from './taqueria-utils/sanitized-path.ts'
import Path from './taqueria-utils/sanitized-path.ts'

type CLIConfig = ReturnType<typeof yargs>


/**
 * Parsing arguments is done in two different stages.
 * 
 * In the first stage, we try to determine if the "init" command is being run,
 * which initializes a project. During this phase, plugins aren't available as
 * there's no configuration for them in the taq configuration file
 * 
 * The second phase assumes a configuration file exists, and will try to load it
 * using any args found in phase in the "init phase" above. This configuration file
 * is then used to determine what plugins to load, which will add additional configuration
 * for parsing CLI arguments.
 */

// TODO: Integrate https://deno.land/x/omelette@v0.4.17

const getFromEnv = <T>(key: EnvKey, defaultValue:T, env: EnvVars) => 
    env.get(key) || defaultValue


const commonCLI = (env:EnvVars, args:DenoArgs, i18n: i18n) => 
    yargs(args)
    .scriptName(i18n.__('appName').toLowerCase())
    .option('maxConcurrency', {
        describe: i18n.__('maxConcurrencyDesc'),
        default: getFromEnv('TAQ_MAX_CONCURRENCY', getDefaultMaxConcurrency(), env),
    })
    .hide('maxConcurrency')
    .option('p', {
        alias: 'projectDir',
        default: './',
        describe: i18n.__('initPathDesc')
    })
    .hide('projectDir')
    .option('d', {
        alias: 'configDir',
        default: getFromEnv("TAQ_CONFIG_DIR", "./.taq", env),
        describe: i18n.__('configDirDesc')
    })
    .wrap(null)
    .epilogue(i18n.__('betaWarning'))
    .command(
        'init [projectDir]',
            i18n.__('initDesc'),
            (yargs: Arguments) => {
                yargs.positional('projectDir', {
                    describe: i18n.__('initPathDesc'),
                    type: 'string',
                    default: getFromEnv("TAQ_PROJECT_DIR", ".", env),
                })
            },
            (args: RawInitArgs) => pipe(
                sanitizeArgs(args), 
                ({projectDir, configDir}) => initProject(projectDir, configDir, i18n),
                fork (console.error) (console.log)
            )
    )


const initCLI = (env: EnvVars, args: DenoArgs, i18n: i18n) => pipe(
    commonCLI(env, args, i18n).help(false)
)

const postInitCLI = (env: EnvVars, args: DenoArgs, parsedArgs: SanitizedInitArgs, i18n: i18n) => pipe(
    commonCLI(env, args, i18n)
    .help()
    .completion()
    .demandCommand(),
    extendCLI(env, parsedArgs, i18n)
)

const initProject = (projectDir: SanitizedPath, configDir: SanitizedPath, i18n: i18n) => pipe(
    getConfig(projectDir, configDir, i18n, true),
    map (() => i18n.__("bootstrapMsg"))
)

const getTask = (cliConfig: CLIConfig, task: Task) => {
    const instance = 
        cliConfig
            .getInternalMethods()
            .getCommandInstance()

    const handlers = instance.handlers

    const found =
        Object
            .entries(handlers)
            .reduce(
                (retval: unknown, handler: unknown[]) => {
                    if (retval) return retval
                    if (handler[0] === task.name) return handler
                    const commandName = instance.aliasMap[task.name]
                    const existingCmd = instance.handlers[instance.aliasMap[task.name]]
                    return commandName && existingCmd ? [commandName, existingCmd] : retval
                },
                false
            )

    return found ? resolve(found) : reject({kind: 'E_INVALID_TASK', msg: 'TODO'})
}

const extendCLI = (env: EnvVars, parsedArgs: SanitizedInitArgs, i18n: i18n) => (cliConfig: CLIConfig) => pipe(
    loadPlugins(env, parsedArgs, i18n, addTask(cliConfig, i18n)),
    map(() => pipe(
        cliConfig.parse(),
        sanitizeArgs
    ))
)

const addTask = (cliConfig: CLIConfig, i18n: i18n) => (task: Task, provider: string) =>
    coalesce 
        (()                                             => createTask(cliConfig, i18n, task, provider))
        (([commandName, existing] : [string, Command])  => updateTask(cliConfig, i18n, task, provider, commandName, existing))
        (getTask(cliConfig, task))

// TODO: Split this function into smaller parts        
const updateTask = (cliConfig: CLIConfig, i18n: i18n, task:Task, provider: string, commandName: string, existing: Command) => {
    const existingHandler = existing.handler

    existing.handler = (args: CommandArgs) => {
        if (args.plugin === provider) {
            return console.log(`Handler for ${provider}`)
        }
        return existingHandler(args)
    }

    existing.description = "Need to show better documentation when a task is provided by more than one plugin."

    existing.builder.plugin.choices.push(provider)

    // Update usage information
    const instance = cliConfig.getInternalMethods().getCommandInstance()
    const commands = instance.usage.getCommands().map((commandArr: [string, string, boolean, string[], boolean]) => {
        if (commandArr[0] == commandName) {
            commandArr[1] = i18n.__("Provided by more than one plugin. To learn more try: taqueria compile --help")
            commandArr[3] = task.aliases.reduce(
                (retval, alias) => {
                    if (!retval.includes(alias)) {
                        retval.push(alias)
                        return retval
                    }
                    return retval
                },
                commandArr[3]
            )
        }
        return commandArr
    })
    instance.usage.getCommands = () => commands
    instance.aliasMap = task.aliases.reduce(
        (retval, alias) => {
            retval[alias] = commandName
            return retval
        },
        instance.aliasMap
    )

    return cliConfig
}

const createTask = (cliConfig: CLIConfig, i18n: i18n, task:Task, provider: string) => resolve(
    cliConfig
        .command({
            command: task.name,
            aliases: task.aliases,
            description: task.description,
            builder: {
                plugin: {
                    description: i18n.__('pluginDesc'),
                    default: provider,
                    choices: [provider]
                }
            },
            handler: (yargs: Record<string, unknown>) => {
                console.log(`Handler for ${provider}`)  
            }
        })
)
    
        
export const run = (env: EnvVars, inputArgs: DenoArgs, i18n: i18n) => {
    // Parse the args required for core built-in tasks
    const initArgs = pipe(
        initCLI(env, inputArgs, i18n).parse(),
        sanitizeArgs
    )

    if (initArgs._.includes('init')) return;

    // Create the CLI extended with plugins and the help option enabled
    fork (console.error) (identity) (postInitCLI(env, inputArgs, initArgs, i18n))
}


const sanitizeArgs = (parsedArgs: RawInitArgs) : SanitizedInitArgs => ({
    _: parsedArgs._,
    configDir: Path.make(parsedArgs.configDir),
    projectDir: Path.make(parsedArgs.projectDir),
    maxConcurrency: parsedArgs.maxConcurrency <= 0 ? getDefaultMaxConcurrency() : parsedArgs.maxConcurrency
})

export default {
    run
}