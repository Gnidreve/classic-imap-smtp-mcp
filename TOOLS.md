# TOOLS.md

- Git-Repository unter /workspace
- SSH-Deploy-Key unter /workspace/.gitsecret/deploy-key
- git push via SSH; core.sshCommand automatisch konfiguriert
- Node.js 20, npm, Python 3, git, OpenSSH im Container

### GitHub CI/Logs
- Actions/CI-Logs: via curl auf die GitHub REST API
- Token: /workspace/.gitsecret/gh-actions-token
- Benutzung: curl -H "Authorization: Bearer $(cat /workspace/.gitsecret/gh-actions-token)" https://api.github.com/repos/OWNER/REPO/actions/runs
- Scope: actions:read (alle Repos, kein Code-Zugriff)
