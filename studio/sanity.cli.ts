import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '9q3oqv8p',
    dataset: 'production',
  },
  studioHost: 'rob-honeybul',
  deployment: {
    appId: 'ybp5h36sln7zk7q84y9ovlkh',
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
