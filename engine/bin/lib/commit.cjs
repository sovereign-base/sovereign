// @ts-check
'use strict';

/**
 * commit — the gated, sanitized `.sovereign/` commit command.
 *
 * Mirrors GSD's cmdCommit, retargeted from `.planning/` to `.sovereign/`:
 *   1. require a message; sanitize it (it gets read back into agent context).
 *   2. bail when config.commit_docs is false  → {committed:false, reason:'skipped_commit_docs_false'}.
 *   3. bail when .sovereign/ is gitignored     → {committed:false, reason:'skipped_gitignored'}.
 *   4. stage the given files (default ['.sovereign/']); git commit -m; return the short hash.
 *
 * `.sovereign/` is committed to git by default (ADR-003); the engine skips the
 * commit (never errors) when the team has gitignored it or disabled commit_docs.
 */

const path = require('node:path');
const fs = require('node:fs');
const { output, error, loadConfig, execGit, isGitIgnored } = require('./core.cjs');
const { sanitizeForPrompt } = require('./security.cjs');

/**
 * Stage the given files (or all of `.sovereign/`), commit, and return the short
 * hash — gated on commit_docs and a non-gitignored `.sovereign/`.
 *
 * @param {string} cwd - project root
 * @param {string} message - commit message (sanitized before it lands)
 * @param {string[] | null} files - paths to stage; defaults to ['.sovereign/']
 * @param {boolean} [raw] - emit the raw hash/scalar instead of JSON
 * @returns {void}
 */
function cmdCommit(cwd, message, files, raw) {
  if (!message) {
    error('commit message required');
  }

  // Sanitize: the message is read back into agent context, so strip invisible
  // chars and instruction-mimicking markers before it lands in git history.
  message = sanitizeForPrompt(message);

  const config = loadConfig(cwd);

  // Gate 1: commit_docs disabled — caller opted out of engine-managed commits.
  if (!config.commit_docs) {
    output({ committed: false, hash: null, reason: 'skipped_commit_docs_false' }, raw, 'skipped');
    return;
  }

  // Gate 2: .sovereign/ gitignored — the team chose not to track engine state.
  if (isGitIgnored(cwd, '.sovereign')) {
    output({ committed: false, hash: null, reason: 'skipped_gitignored' }, raw, 'skipped');
    return;
  }

  // Stage files (default: the whole .sovereign/ tree). Stage deletions for paths
  // that no longer exist so moved/removed docs are captured too.
  const filesToStage = files && files.length > 0 ? files : ['.sovereign/'];
  for (const file of filesToStage) {
    const fullPath = path.join(cwd, file);
    if (!fs.existsSync(fullPath)) {
      execGit(cwd, ['rm', '--cached', '--ignore-unmatch', file]);
    } else {
      execGit(cwd, ['add', file]);
    }
  }

  const commitResult = execGit(cwd, ['commit', '-m', message]);
  if (commitResult.exitCode !== 0) {
    const nothing = commitResult.stdout.includes('nothing to commit') ||
      commitResult.stderr.includes('nothing to commit');
    output(
      nothing
        ? { committed: false, hash: null, reason: 'nothing_to_commit' }
        : { committed: false, hash: null, reason: 'commit_failed', error: commitResult.stderr },
      raw,
      'nothing'
    );
    return;
  }

  const hashResult = execGit(cwd, ['rev-parse', '--short', 'HEAD']);
  const hash = hashResult.exitCode === 0 ? hashResult.stdout : null;
  output({ committed: true, hash, reason: 'committed' }, raw, hash || 'committed');
}

module.exports = {
  cmdCommit,
};
