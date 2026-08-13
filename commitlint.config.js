/**
 * Conventional Commits configuration.
 * Enforces: <type>(<scope>): <subject>
 * Valid types: feat, fix, refactor, perf, test, docs, chore, style, build, ci.
 * Run automatically via the husky commit-msg hook (see .husky/commit-msg).
 * @see DEVELOPER_GUIDE.md §0 (Git Commit Standards)
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
