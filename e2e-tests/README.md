# Wire Desktop E2E Tests

This readme serves as documentation for the E2E tests which are part of this repository. All necessary setup instructions as well as architecture decisions will be documented in here.

## Getting started

Make sure you already followed the instructions of the [README.md](../README.md) in the root of this repository e.g. for installing dependencies.

### Installing dependencies

1. Install JS dependencies: `yarn --immutable`
2. Install Playwright browsers (needed for some tests): `yarn playwright install --only-shell --with-deps chromium`

_Note: If in doubt, refer to test jobs in [git actions workflows folder](/.github/workflows)._

### Setting up environment variables

The E2E tests depend on configs / secrets which need to be provided as environment variables in order to run them. These secrets are stored within 1Password. To create a `.env` file containing the actual values follow these steps:

1. Make sure you have the [1Password CLI](https://www.1password.dev/cli/get-started) installed and set up with the 1PW desktop app
2. Run `op inject -i e2e-tests/.env.tpl -o e2e-tests/.env` to create the .env file within the `e2e-tests` folder
3. Re-run the command in case the `.env.tpl` file was updated or the secrets changed

### Running the E2E tests

Before attempting to execute the E2E tests make sure to run the script `yarn run prestart` once. It will generate the outputs needed for launching the application within the tests.

To then execute the e2e tests run `yarn run test:e2e` which will execute all of them. To only run specific tests you can pass the file containing them e.g. `yarn run test:e2e e2e-tests/specs/example.spec.ts`.

## Architecture

### Directory structure

```
/e2e-tests
  /actions
    Directory containing re-usable actions to be used by multiple test suites.
    Actions in here use the POMs stored in `e2e-tests/poms` and group them to semantic actions e.g. `loginUser()`.

    An action is just a functions accepting dependencies like typically the page to execute the action on. It should not do any assertions.
    Only create an action if it is needed by multiple test suites, very test specific actions should stay within the test suite they're used in.
    Try to apply the [Rule of three](https://en.wikipedia.org/wiki/Rule_of_three_(computer_programming)) before abstracting to early.
  /backend
    All logic for interacting with backends.
    Within the tests we need to make calls to different backends, to do so we use auto generated api clients.
    The generated code is stored within `/backend/generated` while custom clients wrapping the raw api calls, to e.g. provide auth centrally, are placed in the root of the "backend" directory.
  /poms
    The tests follow the [Page Object Model](https://martinfowler.com/bliki/PageObject.html) pattern.
    This means that locators for elements should be placed within re-usable objects to avoid duplication of locators making maintenance easier should any of them change.

    Since Wire doesn't have many "Pages" in the sense of routes to navigate to but many highly interactive components per page some of the objects in here may also be referred to as "COMs" (Component Object Models). However for familiarity and to not introduce to much custom wording, the folder is simply named "poms".

    From an implementation point of view a POM is just a factory function accepting a page / app and returning an object containing locators and actions to interact with the component / page and do assertions on it within tests.

    The "poms" directory is separated into POMs for the Wire Desktop app itself and POMs for Wire Web running inside of it.
    App POMs accept the type `App` as dependency to interact with e.g. locate the accounts in the accounts sidebar. While the webapp POMs accept a `Page` to e.g. send a message inside a chat. This split is intentional as the POMs for webapp can be used to interact with both, the app instance as well as web pages serving as additional instances to e.g. test communication between multiple users.
  /scripts
    Holds custom scripts used in CI to e.g. aggregate and upload the test results to our QA Platform
  /specs
    The directory containing the tests. Each test suite is it's own file grouping multiple tests for the same topic.
    There's no need to wrap such a file in an identically named folder.
  fixtures.ts
    The central file containing all setup for the tests. In here the instance of the App is created so it can be used within tests.
    It also provides fixtures e.g. for user creation and instances for the API clients.
```

## Api Clients

The E2E tests use a generated, type-safe clients for internal API calls.

The generated clients live at: `e2e-tests/backend/generated/`. Do not update these files manually, they is generated from the OpenAPI specifications with [oazapfts](https://github.com/oazapfts/oazapfts).

### Updating

To regenerate the clients, run all or only selected commands from the following code block:

```bash
yarn oazapfts --argumentStyle=object --optimistic --useUnknown --futureStripLegacyMethods https://staging-nginz-https.zinfra.io/api-internal/swagger-ui/brig-swagger.json e2e-tests/backend/generated/brigApi.ts
yarn oazapfts --argumentStyle=object --optimistic --useUnknown --futureStripLegacyMethods https://staging-nginz-https.zinfra.io/api-internal/swagger-ui/galley-swagger.json e2e-tests/backend/generated/galleyApi.ts
yarn oazapfts --argumentStyle=object --useUnknown --futureStripLegacyMethods https://staging-nginz-https.zinfra.io/v15/api/swagger.json e2e-tests/backend/generated/publicApi.ts
```

If the operation names or parameters changed, update the respective wrapper in: `e2e-tests/backend/*ApiClient.ts`. Also make sure to commit the changes made to the generated files, since some of the APIs are not versioned we don't want to rely on automatic generation e.g. within postinstall.
