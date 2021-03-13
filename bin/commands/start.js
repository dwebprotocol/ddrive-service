const p = require('path')
const { Command, flags } = require('@oclif/command')

const DDriveService = require('../..')
const DDriveServiceCommand = require('../../lib/cli')

class StartCommand extends Command {
  static usage = 'start'
  static description = 'Start the DDrive service.'
  static flags = {
    'disable-fuse': flags.boolean({
      description: 'Disable FUSE mounting.',
      default: false
    }),
    host: flags.string({
      description: 'The dHub service host.',
      required: false
    }),
    key: DDriveServiceCommand.keyFlag({
      description: 'The root drive key.',
      required: false
    }),
    mnt: flags.string({
      description: 'The root drive mountpoint.',
      required: false
    })
  }

  async run () {
    const { flags } = this.parse(StartCommand)
    flags.disableFuse = flags['disable-fuse']
    if (flags.mnt) flags.mnt = p.resolve(flags.mnt)
    const service = new DDriveService({
      ...flags
    })
    process.on('SIGINT', () => {
      service.close()
    })
    process.on('SIGTERM', () => {
      service.close()
    })
    try {
      await service.open()
      console.log('DDrive service is running (Ctrl+c to stop)...')
    } catch (err) {
      console.error('Could not start the DDrive service. Is dHub running?')
      console.error('Error:', err)
    }
  }
}

module.exports = StartCommand
