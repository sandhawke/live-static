import Debug from 'debug'
import fsprom from 'fs/promises'
import { loadConfig } from '../config-state/index.js'
import { createClient } from '../datapages-client/index.js'
import mime from 'mime-types'
import { dirname } from 'path'
import { utimes } from 'utimes'
import { DateTime } from 'luxon'

const debug = new Debug('live-static')

main()

async function main () {
  const pac = await createClient(loadConfig({appName: 'site'}))
  pac.user = { active: 'anon'}

  const v = pac.view({})

  v.on('appear', async ({path, data}) => {
    if (!path.startsWith('/u/sandhawke')) return
    console.log('APPEAR', {path, data})
    await set(path, data)
    console.log('done', path)
  })
  v.on('replace', async ({path, data}) => {
    console.log('REPLACE', {path, data})
    await set(path, data)
    console.log('done', path)
  })
  v.on('disappear', async ({path, data}) => {
    console.log('DISAPPEAR', {path, data})
    await set(path, {delete: true})
    console.log('done', path)
  })
  v.on('stable', async () => { console.log('\nStable.  Watching...') } )
}

const root = '/tmp/live-static'

async function set (path, data) {
  if (!path.startsWith('/')) return
  if (path.includes('..')) throw Error('dangerous path detectect: '+JSON.stringify(path))
  if (path.includes('//')) throw Error('dangerous path detectect: '+JSON.stringify(path))
  
  const ext = mime.extension(data.contentType) || 'bin'
  let filename
  let outchars

  if (data.text && data.contentType === 'text/markdown') {
    filename = root + path + '.' + ext
    if (filename.includes('//')) throw Error('found a slash slash - dont end root with a shash?')
    outchars = data.text // TEMP
  }

  if (!filename) return
  if (!outchars) return
    // console.log({filename})

  let mtime
  if (data.lastModified) {
    // CRAZY?!
    const date = DateTime.fromJSDate(data.lastModified, { zone: 'UTC' })
    mtime = date.toMillis()
    // console.log({date, mtime})
  }

  let stat
  try {
    stat = await fsprom.stat(filename)
  } catch (e) {
    if (e.code === 'ENOENT') {
      stat = null
    } else {
      throw e
    }
  }
  if (!stat) {
    const parent = dirname(filename)
    console.log({filename, parent})
    await fsprom.mkdir(parent, {recursive: true})
    console.log('made dir', parent)
  }

  if (stat.mtimeMs === mtime) {
    console.log('nmod', path)
    return
  }
  console.log({stat, f: '   ' + stat.mtimeMs,  mtime}) 

  if (typeof outchars === 'string') {
    await fsprom.writeFile(filename, outchars, 'utf8')
    if (mtime) {
      await utimes(filename, {mtime})
    }
  }
}
