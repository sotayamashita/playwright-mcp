#!/bin/bash
# prepare-release.sh - リリース準備
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] 警告:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] エラー:${NC} $1"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] 情報:${NC} $1"
}

success() {
    echo -e "${CYAN}✓${NC} $1"
}

# プロジェクトルートに移動
cd "$PROJECT_ROOT"

# バージョンを取得
VERSION=$(node -p "require('./package.json').version")
log "バージョン $VERSION のリリース準備を開始..."

# バージョン形式を検証
if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+(\.[0-9]+)?)?-fork\.[0-9]+$ ]]; then
    error "無効なバージョン形式: $VERSION"
fi

# 現在のブランチを確認
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    error "リリース準備はmainブランチから実行する必要があります。現在: $CURRENT_BRANCH"
fi

# Gitステータスを確認
if ! git diff-index --quiet HEAD --; then
    error "作業ディレクトリがクリーンではありません。変更をコミットまたはスタッシュしてください。"
fi

# リリース前チェックリスト
log "リリース前チェックを実行中..."
echo ""

# 1. テストの実行
info "フルテストスイートを実行中..."
npm test
if [ $? -eq 0 ]; then
    success "テストが合格しました"
else
    error "テストが失敗しました。問題を修正してからリリースしてください。"
fi

# 2. リンティング
info "リンティングを実行中..."
npm run lint
if [ $? -eq 0 ]; then
    success "リンティングが合格しました"
else
    error "リンティングが失敗しました。問題を修正してからリリースしてください。"
fi

# 3. ビルド
info "プロジェクトをビルド中..."
npm run build
if [ $? -eq 0 ]; then
    success "ビルドが成功しました"
else
    error "ビルドが失敗しました。問題を修正してからリリースしてください。"
fi

# 4. 脆弱性チェック
info "脆弱性をチェック中..."
npm audit --audit-level=moderate || warn "脆弱性が検出されました。リリース前に修正を検討してください。"

# 5. パッケージ検証
info "パッケージを検証中..."
npm pack --dry-run > /dev/null 2>&1
if [ $? -eq 0 ]; then
    success "パッケージ検証が成功しました"
else
    error "パッケージ検証が失敗しました"
fi

# CHANGELOGエントリの生成
log "CHANGELOGエントリを生成中..."
CHANGELOG_ENTRY=$(mktemp)

# カスタムコミットを取得
if git show-ref --verify --quiet refs/heads/upstream; then
    CUSTOM_COMMITS=$(git log --oneline upstream..HEAD --pretty=format:"- %s (%h)")
else
    CUSTOM_COMMITS=$(git log --oneline --pretty=format:"- %s (%h)" -10)
fi

cat > "$CHANGELOG_ENTRY" << EOF
## [$VERSION] - $(date +%Y-%m-%d)

### 追加 (カスタム)
- このリリースで追加された新機能をここに記載

### 変更 (上流)
- 上流からの更新内容をここに記載

### 修正 (カスタム)
- このフォーク固有のバグ修正をここに記載

### カスタムパッチ
$CUSTOM_COMMITS

EOF

# CHANGELOG.mdの確認と更新
if [ -f "CHANGELOG.md" ]; then
    log "CHANGELOG.mdを更新中..."
    
    # バックアップを作成
    cp CHANGELOG.md CHANGELOG.md.bak
    
    # 新しいエントリを追加
    (cat "$CHANGELOG_ENTRY"; echo; cat CHANGELOG.md) > CHANGELOG.md.tmp
    mv CHANGELOG.md.tmp CHANGELOG.md
    
    info "CHANGELOGエントリを確認してください:"
    echo ""
    cat "$CHANGELOG_ENTRY"
    echo ""
    
    echo -n "CHANGELOG.mdを編集しますか？ (y/N): "
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} CHANGELOG.md
    fi
else
    log "CHANGELOG.mdを作成中..."
    cat > CHANGELOG.md << EOF
# 変更履歴

すべての注目すべき変更はこのファイルに記録されます。

このフォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づいており、
このプロジェクトは [セマンティックバージョニング](https://semver.org/lang/ja/) に準拠しています。

$(cat "$CHANGELOG_ENTRY")
EOF
fi

# クリーンアップ
rm -f "$CHANGELOG_ENTRY"

# 変更をコミット
if ! git diff-index --quiet HEAD -- CHANGELOG.md; then
    log "CHANGELOGの変更をコミット中..."
    git add CHANGELOG.md
    git commit -m "docs: update changelog for $VERSION"
    success "CHANGELOGをコミットしました"
fi

# Gitタグの作成
log "Gitタグを作成中..."
if git tag -l "v$VERSION" | grep -q "v$VERSION"; then
    warn "タグ v$VERSION はすでに存在します"
else
    git tag -a "v$VERSION" -m "Release $VERSION"
    success "タグ v$VERSION を作成しました"
fi

# パッケージの最終確認
log "パッケージの最終確認を実行中..."
npm pack --dry-run > /dev/null 2>&1

if [ $? -eq 0 ]; then
    success "パッケージの確認が成功しました"
else
    error "パッケージの確認が失敗しました"
fi

# サマリー
echo ""
log "リリース準備が完了しました！"
echo ""
info "リリースサマリー:"
echo "  バージョン: $VERSION"
echo "  タグ: v$VERSION"
echo "  ブランチ: $CURRENT_BRANCH"
echo ""
log "次のステップ:"
echo "  1. 変更をプッシュ: git push origin main"
echo "  2. タグをプッシュ: git push origin v$VERSION"
echo "  3. GitHubでリリースを作成"
echo "     リリースを作成すると、.github/workflows/publish.yml が自動的に実行され、"
echo "     GitHub Packages に npm パッケージが公開されます。"
echo ""
info "注: npm への公開は GitHub Actions により自動化されています。"