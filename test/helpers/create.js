const tmp = require('tmp-promise')
const { createMany: dhCreate } = require('dhub/test/helpers/create')

const DDriveService = require('../..')
const DDriveServiceClient = require('../../client')

async function create (numMounts, opts = {}) {
  const { clients, cleanup: dhCleanup } = await dhCreate(numMounts, {
    ...opts,
    host: 'dhub-fuse'
  })
  const fuseMnts = []
  const fuseServices = []
  const fuseClients = []

  for (let i = 0; i < numMounts; i++) {
    const fuseMnt = await tmp.dir({ unsafeCleanup: true })
    const store = clients[i].basestore()
    const rootDriveBase = store.get()
    await rootDriveBase.ready()
    const fuseService = new DDriveService({
      key: rootDriveBase.key,
      mnt: fuseMnt.path,
      client: clients[i],
      remember: false
    })
    await fuseService.open()
    const fuseClient = new DDriveServiceClient({
      key: rootDriveBase.key,
      mnt: fuseMnt.path,
      client: clients[i]
    })
    await fuseClient.ready()
    fuseClients.push(fuseClient)
    fuseServices.push(fuseService)
    fuseMnts.push(fuseMnt)
  }

  return { fuseServices, fuseClients, fuseMnts, cleanup }

  async function cleanup () {
    await dhCleanup()
    for (const service of fuseServices) {
      await service.close()
    }
    for (const fuseMnt of fuseMnts) {
      await fuseMnt.cleanup()
    }
  }
}

async function createOne (opts) {
  const { fuseServices, fuseClients, fuseMnts, cleanup } = await create(1, opts)
  return {
    fuseService: fuseServices[0],
    fuseClient: fuseClients[0],
    fuseMnt: fuseMnts[0],
    cleanup
  }
}

module.exports = {
  create,
  createOne
}
