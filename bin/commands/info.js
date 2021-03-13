const p = require('path').posix
const { flags } = require('@oclif/command')

const DDriveServiceCommand = require('../../lib/cli')

class InfoCommand extends DDriveServiceCommand {
  static usage = 'info [path]'
  static description = 'Display information about the drive mounted at the given mountpoint.'
  static args = [
    {
      name: 'path',
      required: true,
      default: process.cwd(),
      description: 'The path to the drive\'s location (must be within the root mountpoint).'
    }
  ]
  static flags = {
    root: flags.boolean({
      description: 'Show info about your private root drive',
      default: false
    })
  }

  async run () {
    const { args, flags } = this.parse(InfoCommand)
    await super.run()
    if (args.path) args.path = this.parsePath(this.client.mnt, args.path)
    try {
      const info = await this.infoForPath(args.path, flags.root)
      const isMount = !info.mountPath
      const parentMount = !isMount ? args.path.slice(0, args.path.length - info.mountPath.length) : ''
      const parentInfo = !isMount ? `(the parent mount is ${parentMount})` : ''
      console.log('Drive Info:')
      console.log()
      console.log(`  Key:          ${info.key.toString('hex')}`)
      console.log(`  Is Mount:     ${isMount} ${parentInfo}`)
      console.log(`  Writable:     ${info.writable}`)
      console.log(`  Announce:     ${info.announce}`)
      console.log(`  Lookup:       ${info.lookup}`)
      if (info.root) console.log('\nThis is info about your root drive. You probably should not share this.')
    } catch (err) {
      console.error(`Could get info for mountpoint: ${args.path}`)
      console.error(`${err.details || err}`)
      process.exit(1)
    }
    process.exit(0)
  }
}

module.exports = InfoCommand
