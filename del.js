import Debug from 'debug'
import fsprom from 'fs/promises'
import { loadConfig } from '../config-state/index.js'
import { createClient } from '../datapages-client/index.js'
// import { DateTime } from 'luxon'

const debug = new Debug('live-static')

main()

async function main () {
  const pac = await createClient(loadConfig({appName: 'site'}))
  pac.user = { active: '/u/sandhawke'}

  await pac.rawDelete('/u/sandhawke/hello')
  pac.stop()
}
