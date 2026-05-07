const fs = require('fs')
const path = require('path')

exports.default = async function(context) {
  const localesDir = path.join(context.appOutDir, 'locales')
  if (!fs.existsSync(localesDir)) return

  const keep = ['zh-CN.pak', 'en-US.pak']
  const files = fs.readdirSync(localesDir)
  let removed = 0
  for (const file of files) {
    if (!keep.includes(file)) {
      fs.unlinkSync(path.join(localesDir, file))
      removed++
    }
  }
  console.log(`Cleaned up ${removed} locale files, kept: ${keep.join(', ')}`)
}
