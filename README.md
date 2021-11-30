# Glossary

## Framework: _(Phase 0)_
- A plugin-powered task runner
- Exposes a CLI using yargs
- Provides a project structure for smart contract & dapp developers
- Provides configuration, environment information, and i18n messages to plugins via stdin

## Configuration: _(Phase 0)_
- Settings which are global to the project, and stored in a configuration file
- Default location is .taq/config.json (configurable)
- Settings serve as implict values for non-explicit inputs
- **NOTE**: Construct exists in Phase 0, but with a limited number of settings)

## Environment Information: _(Phase 0)_
- System information, such as the OS and language localization
- Environment variables
- Parsed arguments and options

## i18n messages: _(Phase 0)_
- A map between an input string (often referred to as a message) and a collection of output strings that serve as available transactions in support languages
- **NOTE**: only the construct exists in Phase 0

## Plugin: _(Phase 0)_
- Provides tasks, scaffolds, and hooks
- Different types exist: NPM, Deno, and Binary
- Installable and uninstallable
- Consume information from the framework, such as global configuration settings, environment information (parsed options and arguments, env variables, system info), and i18n strings
- Have build dependencies (software required to build the plugin)
- Have runtime dependencies (software required to run the plugin - e.g. ligo's CLI)
- **NOTE**: Runtime dependencies will be ignored and assumed to be available in the environment in Phase 0

## Runtime Dependency:
- Software required by a plugin to perform its tasks
- Software that is installable using the environment's native package manager (apt, rpm, brew, chocolatey, etc)
- **NOTE**: Runtime dependencies will be ignored and assumed to be available in the environment in Phase 0

## Task: _(Phase 0)_
- Provides information to the framework/CLI about a named action that can be proxied to a plugin. E.g. "compile contract" is a task that is provided by the LIGO plugin.
- Expose what options and arguments the CLI should accept
- Tasks may be public or private
- Can be executed using the CLI
- Public tasks appear in the --help command of th CLI. Private tasks do not.

## Task Execution: _(Phase 0)_
- A task which is executed using the CLI
- Accept options, arguments, and the current project snapshot as input
- Produce the following: output, errors, and artifacts
- Can be extended using hooks
- Can be part of a workflow

# Workflow
- A list of tasks (or other workflows) to be executed in serial or parallel
- Could be implemented using hooks, but exposed as a simpler and alternative construct to hooks
- **Blocker** A workflow becomes dependent on tasks which could be provided by another plugin, and therefore a dependency resolution system is needed, which is complex

# Workflow (alternative)
- A list of tasks (or other workflows) to be executed in serial or parallel
- Defined in the .taq/workflows directory
- Each workflow is available as a task in the CLI
- Aside from plugins, workflows could be installable using the CLI
- A workflow is a simple construct that might have plugins as dependencies. We just install the latest versions.

## Snapshot:
- A model representing the collection  of artifacts
- Can be in memory or persisted to a file (perhaps called state.json or artifacts.json)

## Output: _(Phase 0)_
- A response emitted from the success execution of a task

## Error: _(Phase 0)_
- A response emitted from the execution of a task which failed

## Artifact:
- A result or product of a task.
- Has a type: "contract", "test", and maybe others
- Has a checksum
- Has a state - changed or unchanged
- May optionally depend on other  

## Scaffold
- Provides information to the framework/CLI about a project that can be generated by a plugin.
- A project could have one or more files
- Files could be of different types, such as a contract, test, and potentially others.

## Hook
- Provided by a plugin, which informs the task runner that a callback should be executed when a given task is executing
- Triggered pre or post execution of the given task
- When triggered, another task is executed.
- Can suggest a priority, specified by an integer
- Can flag whether the hook supports running in parallel to other hooks

## CLI: _(Phase 0)_
- An interface for the framework / task runner
- Provides information about the tasks available to the end-user AND other software, such as a VSCode plugin

## VSCode Plugin: _(Phase 0)_
- Executes and consumes the output of a private task (perhaps called "expose"), which allows introspection for the list of tasks available
- Provides an interface for executing public tasks

# Phase 0 Scope

Defined below is a list of tasks along with the name of the plugin which provides that task.
- sandbox `[start|stop]` (flextesa)
- compile `[contract] (ligo)
- compile `[contract]` (smartpy)
- test (jest)
- originate `[contract]` (taquito)
- deploy `[env]` (built-in)
- install `[plugin]` (built-in)
- uninstall `[plugin]` (built-in)