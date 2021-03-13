const p = require('path').posix
const ora = require('ora')
const ddatabaseCrypto = require('@ddatabase/crypto')
const { flags } = require('@oclif/command')

const DDriveServiceCommand = require('../../lib/cli')

class SeedCommand extends DDriveServiceCommand {
  static usage = 'seed [path]'
  static description = 'Stop seeding a DDrive on the network.'
  static args = [
    {
      name: 'path',
      required: false,
      default: process.cwd(),
      description: 'The path to the drive\'s location (must be within the root mountpoint).'
    }
  ]
  static flags = {
    key: DDriveServiceCommand.keyFlag({
      description: 'The drive key to unseed (will override the provided path).'
    }),
    remember: flags.boolean({
      description: 'Save this drive\'s networking configuration across restarts.',
      default: true
    })
  }

  async run () {
    const self = this
    const { flags, args } = this.parse(SeedCommand)
    await super.run()
    if (args.path) args.path = this.parsePath(this.client.mnt, args.path)

    const spinner = ora('Removing the DDrive from the network (might take a while to unannounce)...')
    spinner.start()

    const config = {
      lookup: false,
      announce: false,
      remember: flags.remember
    }

    const discoveryKey = flags.key ? ddatabaseCrypto.discoveryKey(flags.key) : null
    try {
      if (args.path) await this.infoForPath(args.path, flags.root)
      await this.client.unseed(args.path, {
        discoveryKey,
        ...config
      })
      onsuccess(args.path, !!discoveryKey)
      process.exit(0)
    } catch (err) {
      onerror(err)
      process.exit(1)
    }

    function onerror (err) {
      spinner.fail('Could not unseed the drive:')
      console.error(`${err.details || err}`)
      self.exit(1)
    }

    function onsuccess (mnt, isKey) {
      if (isKey) spinner.succeed(`Unseeded the drive with key ${flags.key.toString('hex')}`)
      else spinner.succeed(`Unseeded the drive mounted at ${args.path}`)
    }
  }
}

module.exports = SeedCommand
