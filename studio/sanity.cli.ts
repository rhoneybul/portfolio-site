import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '9q3oqv8p',
    dataset: 'production',
  },
  studioHost: 'fohm',
  deployment: {
    appId: 'ss9ynq6j9irimzmwvvw80dmo',
    autoUpdates: true,
  },
  typegen: {
    enabled: true,
    path: '../web/src/**/*.{ts,tsx,js,jsx}',
    schema: 'schema.json',
    generates: '../web/sanity.types.ts',
    overloadClientMethods: true,
  },
})
