# Wire Desktop E2E Tests

This readme serves as documentation for the E2E tests which are part of this repository. All necessary setup instructions as well as architecture decisions will be documented in here.

## Getting started

Make sure you already followed the instructions of the [README.md](../README.md) in the root of this repository e.g. for installing dependencies.

### Setting up environment variables

The E2E tests depend on configs / secrets which need to be provided as environment variables in order to run them. These secrets are stored within 1Password. To create a `.env` file containing the actual values follow these steps:

1. Make sure you have the [1Password CLI](https://www.1password.dev/cli/get-started) installed and set up with the 1PW desktop app
2. Run `op inject -i e2e-tests/.env.tpl -o e2e-tests/.env` to create the .env file within the `e2e-tests` folder
3. Re-run the command in case the `.env.tpl` file was updated or the secrets changed

### Running the E2E tests

Before attempting to execute the E2E tests make sure to run the script `yarn run prestart` once. It will generate the outputs needed for launching the application within the tests.

To then execute the e2e tests run `yarn run test:e2e` which will execute all of them. To only run specific tests you can pass the file containing them e.g. `yarn run test:e2e e2e-tests/specs/example.spec.ts`.
