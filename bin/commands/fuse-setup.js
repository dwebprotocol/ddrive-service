const p = require('path')
const CONFIGURE_FUSE = [process.execPath, p.join(__dirname, '../../scripts/configure.js')]

const fs = require('fs').promises
const { spawn } = require('child_process')
const { Command, flags } = require('@oclif/command')

class SetupCommand extends Command {
  static usage = 'fuse-setup'
  static description = 'Perform a one-time configuration step for FUSE.'
  static flags = {
    user: flags.integer({
      description: `User that should own the mountpoint.`,
      char: 'U',
      default: process.geteuid()
    }),
    group: flags.integer({
      description: `Group that should own the mountpoint.`,
      char: 'G',
      default: process.getegid()
    }),
    force: flags.boolean({
      description: 'Force the setup to execute, even if it\'s already been performed once.',
      char: 'f',
      default: 'false'
    })
  }
  async run () {
    try {
      var dwebfuse = require('@ddrive/fuse')
    } catch (err) {}

    if (!dwebfuse) {
      console.warn('FUSE installation failed. You will be unable to mount your dDrives.')
      return
    }
    const { flags } = this.parse(SetupCommand)

    console.log('Configuring FUSE...')
    try {
      await configureFuse()
      console.log('FUSE successfully configured:')
      console.log('  * Your root drive will be mounted at ~/DDrive when the daemon is next started.')
      console.log('  * If your mountpoint ever becomes unresponsive, try running `ddrive force-unmount`.')
    } catch (err) {
      console.error('Could not configure the FUSE module:')
      console.error(err)
    }

    async function configureFuse (cb) {
      const configured = await new Promise((resolve, reject) => {
        dwebfuse.isConfigured((err, fuseConfigured) => {
          if (err) return reject(err)
          return resolve(fuseConfigured)
        })
      })
      if (configured && !flags.force) {
        console.log('Note: FUSE is already configured.')
      } else {
        return new Promise((resolve, reject) => {
          const child = spawn('sudo', CONFIGURE_FUSE, {
            stdio: 'inherit'
          })
          child.on('error', reject)
          child.on('exit', code => {
            if (code) return reject(new Error(code))
            return resolve()
          })
        })
      }
    }
  }
}

module.exports = SetupCommand
