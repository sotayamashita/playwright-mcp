# Release Flow

This document describes the release process for the @sotayamashita/playwright-mcp fork.

## Prerequisites

- Ensure you're on the `main` branch
- Working directory is clean
- All tests are passing
- GitHub CLI (`gh`) is installed and authenticated

## Release Process

### 1. Version Update

Update the version in `package.json`:

```bash
# Example: Update version from 0.0.30-fork.1 to 0.0.30-fork.2
# Edit package.json manually or use npm version command
npm version patch --preid=fork
```

### 2. Build and Test

```bash
# Install dependencies
npm ci

# Build the project
npm run build

# Run linting
npm run lint

# Run tests (Chrome only for quick validation)
npm run ctest
```

### 3. Commit Version Changes

```bash
# Add version changes
git add package.json

# Commit with conventional commit format
git commit -m "chore: bump version to X.X.X-fork.X"

# Push to main branch
git push origin main
```

### 4. Create and Push Tag

```bash
# Create tag (must match package.json version)
git tag v0.0.30-fork.2

# Push tag to origin
git push origin v0.0.30-fork.2
```

### 5. Create GitHub Release

```bash
# Create release using GitHub CLI
gh release create v0.0.30-fork.2 \
  --repo sotayamashita/playwright-mcp \
  --title "v0.0.30-fork.2" \
  --notes "## Fork Release v0.0.30-fork.2

This is a fork of the official Playwright MCP server with additional features and fixes.

### Changes in this release:
- [List your changes here]

### Installation:
\`\`\`bash
npm install @sotayamashita/playwright-mcp
\`\`\`

### Usage:
\`\`\`bash
npx @sotayamashita/playwright-mcp
\`\`\`"
```

### 6. Verify Automatic Publishing

After creating the release, GitHub Actions will automatically:

1. Run the publish workflow (`.github/workflows/publish.yml`)
2. Build and test the project
3. Publish to GitHub Packages with public access

Check the workflow status:

```bash
# Check latest workflow run
gh run list --repo sotayamashita/playwright-mcp --limit 1

# Watch workflow progress
gh run watch --repo sotayamashita/playwright-mcp
```

## Configuration Files

### GitHub Actions Workflow

The publishing is handled by `.github/workflows/publish.yml`:

```yaml
- run: npm publish --provenance --access=public
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Package Configuration

`package.json` includes publishing configuration:

```json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://npm.pkg.github.com"
  }
}
```

## Troubleshooting

### Common Issues

1. **Tag already exists**: Use `git tag -d <tag>` to delete locally, then recreate
2. **Permission denied**: Ensure GITHUB_TOKEN has packages:write permission
3. **Private package error**: Verify `--access=public` flag is set in publish command

### Verification Commands

```bash
# Check if package was published
npm info @sotayamashita/playwright-mcp --registry=https://npm.pkg.github.com

# List all tags
git tag -l

# Check remote tags
git ls-remote --tags origin
```

## Version Naming Convention

This fork uses the following version format:
- `X.Y.Z-fork.N` where:
  - `X.Y.Z` matches the base version from upstream
  - `N` is the fork iteration number

Examples:
- `0.0.30-fork.1` (first fork release of 0.0.30)
- `0.0.30-fork.2` (second fork release of 0.0.30)
- `0.0.31-fork.1` (first fork release of 0.0.31)

## Quick Release Script

For convenience, you can use this one-liner after updating package.json:

```bash
# Replace VERSION with your version (e.g., 0.0.30-fork.2)
VERSION="0.0.30-fork.2" && \
git add package.json && \
git commit -m "chore: bump version to $VERSION" && \
git push origin main && \
git tag v$VERSION && \
git push origin v$VERSION && \
gh release create v$VERSION --repo sotayamashita/playwright-mcp --title "v$VERSION" --notes "Fork release v$VERSION"
```

## Post-Release

After a successful release:

1. Verify the package is available at: https://github.com/sotayamashita/playwright-mcp/packages
2. Test installation: `npm install @sotayamashita/playwright-mcp@$VERSION`
3. Update documentation if needed
4. Consider creating a PR to sync changes back to develop branch if applicable