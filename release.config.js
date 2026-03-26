import fs from 'node:fs';

const DRY_RUN = false;
const packageFilePath = `${process.cwd()}/package.json`;
const packageFile = JSON.parse(fs.readFileSync(packageFilePath));
const [_org, scope] = packageFile.name.split('/');

export default {
  dryRun: DRY_RUN,
  tagFormat: `${packageFile.name}-v\${version}`,
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        releaseRules: [
          // catch all filter
          { breaking: true, release: false },
          { type: 'feat', release: false },
          { type: 'fix', release: false },
          { type: 'chore', release: false },
          // scope only matches trigger release
          { breaking: true, scope, release: 'major' },
          { type: 'feat', scope, release: 'minor' },
          { type: 'fix', scope, release: 'patch' }
        ]
      }
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          ignoreCommits: `^(?![^]*\\(${scope}\\))(?![^]*\\[${scope}\\]).*$`
        }
      }
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md'
      }
    ],
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'npm pkg set version=${nextRelease.version}',
        publishCmd: `npm publish --provenance --registry=https://registry.npmjs.org ${DRY_RUN ? '--dry-run' : ''} --access=public`
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'projects/**/package.json', 'projects/**/CHANGELOG.md'],
        message: `chore(release): ${packageFile.name}` + '-v${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ],
    [
      '@semantic-release/github',
      {
        success: '🎉 This issue has been resolved in version ${nextRelease.version} 🎉',
        assets: [
          {
            label: 'linux-arm64',
            path: `dist/webq-linux-arm64`
          },
          {
            label: 'linux-x64',
            path: `dist/webq-linux-x64`
          },
          {
            label: 'macos-arm64',
            path: `dist/webq-macos-arm64`
          },
          {
            label: 'macos-x64',
            path: `dist/webq-macos-x64`
          },
          {
            label: 'windows-x64',
            path: `dist/webq-windows-x64.exe`
          }
        ]
      }
    ]
  ]
};
