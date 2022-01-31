<p align="center">
  <a href="https://taqueria.io">
    <img alt="Taqueria" src="https://user-images.githubusercontent.com/1114943/150659418-e55f1df3-ba4d-4e05-ab26-1f729858c7fb.png" width="" />
  </a>
</p>
<h1 align="center">
  Taqueria - A New Way to Build on Tezos
</h1>

> WARNING: This project has not officially been made public. Congratulations on finding it. Have a look around, but be aware, it's not yet ready for public consumption.! CLIs and APIs are unstable and likely to change.
## Build instructions

- Install [deno](https://deno.land/#installation)
- Run `./bin/build.sh` from the root directory of this project. This will generate a `taqueria` executable.

## Suggestions

I like adding my project directory to the PATH environment variable which allows me to execute `taqueria` from any directory. Do the following to set that up:

1. Run `pwd` from the root directory of this project. This will output a path which you'll need to select and copy.
2. run `echo 'export PATH=$PATH:[paste path here]' >> ~/.bashrc`. 

> E.g. On my computer, this would be: `echo 'export PATH=$PATH:/Users/mweichert/Projects/taqueria' >> ~/.bashrc`

## Create a project
1. Initialize a new project: `taq init test-project`
2. Change directories: `cd test-project`
3. Initialize the project as an NPM project: `npm init -y`
4. Install the LIGO plugin: `taq install ../taqueria-plugin-ligo` if installing from a clone of this repo, otherwise use `taq install @taqueria/plugin-ligo`
6. Continue steps 4-5 for each additional plugin you want to install


## Plugin Instructions

### Create a plugin (inside repo)

The following instructions will create a typescript project with simple configuration.
Note: These are temporary instuctions until the taq cli `taqueria init plugin` is ready.

- clone `taqueria-plugin-boilerplate-typescript`
- setup plugin name:
    - `index.ts` > `Plugin.create` > `name`
    - `package.json` > `name`
- setup plugin tasks:
    - `index.ts` > `Plugin.create` > `tasks`
    - Examine other plugins for example tasks and task arguments

### Using Plugin in an npm project

Note: The following demonstrates using the plugin `taqueria-plugin-contract-type-generator` as an example.

- Run Build Instructions above and setup taqueria in path (i.e. .bashrc)
- Create npm project
    - `mkdir example-taq-project`
    - `cd example-taq-project`
    - `npm init` (answer prompt questions to create npm project)
- Taq'ify the project
    - `taqueria init`
- Add plugin to project
    - Add plugin as npm project reference
        ```json
        "dependencies": {
            "taqueria-plugin-contract-type-generator": "file:../taqueria-plugin-contract-type-generator",
        }
        ```
    - Run npm install
        - `npm i`
    - Add plugin to `.taq/config.json`
        
        ```json
        "plugins": [
            {
                "type": "npm",
                "name": "taqueria-plugin-contract-type-generator"
            }
        ]
        ```
- Build/rebuild plugin after code changes
    - Inside plugin directory
    - `npm run build`
- View plugin tasks
    - `taqueria --help`
- Run plugin task
    - `taqueria typegen --typescriptDir ./types`
