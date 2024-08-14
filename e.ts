 
import fs from 'fs'
const version = 'test'
fs.appendFileSync(process.env.GITHUB_ENV, `version=${version}\n`);
