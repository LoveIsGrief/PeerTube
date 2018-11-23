import { exec } from 'child_process'

import { ServerInfo } from '../server/servers'

function getEnvCli (server?: ServerInfo) {
  let envCLI = `NODE_ENV=test NODE_APP_INSTANCE=${server.serverNumber}`

  if (process.env['GITLAB_CI']) {
    // tslint:disable
    envCLI += ' NODE_CONFIG="{ \\\"database\\\": { \\\"hostname\\\": \\\"postgres\\\" }, \\\"redis\\\": { \\\"hostname\\\": \\\"redis\\\" } }"'
  }

  return envCLI
}

async function execCLI (command: string) {
  return new Promise<string>((res, rej) => {
    exec(command, (err, stdout) => {
      if (err) return rej(err)

      return res(stdout)
    })
  })
}

// ---------------------------------------------------------------------------

export {
  execCLI,
  getEnvCli
}
