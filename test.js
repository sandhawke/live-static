/* eslint-env jest */
import * as my from '.'
import Debug from 'debug'

const debug = new Debug('live-static/test')

test('first test', async () => {
  expect(2 + 2).toBe(4)            
})
