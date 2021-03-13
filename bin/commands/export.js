const p = require('path')

const cliProgress = require('cli-progress')
const { flags } = require('@oclif/command')

const DDriveServiceCommand = require('../../lib/cli')

class ExportCommand extends DDriveServiceCommand {
  static usage = 'export [key] [dir]'
  static description = 'Export a DDrive into a directory.'
  static args = [
    DDriveServiceCommand.keyArg({
      description: 'The drive key.',
      required: false
    }),
    {
      name: 'dir',
      description: 'The target directory to export into.',
      required: false,
      parse: dir => {
        if (!dir) return null
        return p.resolve(dir)
      }
    }
  ]
  static flags = {
    recursive: flags.boolean({
      description: 'Recursively export drive mounts.',
      default: false
    }),
    watch: flags.boolean({
      description: 'Stay running and continue exporting new changes.',
      default: false
    })
  }

  async run () {
    const { args, flags } = this.parse(ExportCommand)
    await super.run()

    const { progress, drive, dir, cleanup } = await this.client.export(args.key, args.dir, flags)

    process.on('SIGINT', onend)
    process.on('SIGTERM', onend)

    let total = 0
    let finished = 0
    let peers = drive.metadata.peers.length
    drive.drive.on('peer-open', () => {
      peers++
    })
    drive.drive.on('peer-remove', () => {
      peers--
    })

    const bar = new cliProgress.SingleBar({
      format: `Exporting | {bar} | {percentage}% | {value}/{total} Content Blocks | {peers} Peers`
    })
    console.log(`Exporting ${drive.key.toString('hex')} into ${dir} (Ctrl+c to exit)...`)
    console.log()
    bar.start(1, 0)
    bar.update(0, { peers })
    progress.on('put', src => {
      total += src.stat.size
    })
    progress.on('put-end', src => {
      finished += src.stat.size
    })

    const timer = setInterval(() => {
      bar.setTotal(total)
      bar.update(finished, { peers })
    })
    progress.on('end', onend)

    async function onend () {
      // Make sure the events are fully processed.
      await new Promise(resolve => setTimeout(resolve, 500))
      if (timer) clearInterval(timer)
      await cleanup()
      console.log('\nExport completed or stopped by user. Exiting...')
      process.exit(0)
    }
  }
}

module.exports = ExportCommand
