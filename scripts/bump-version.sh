#!/bin/bash
# bump-version.sh - フォークバージョンをインクリメント
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

# プロジェクトルートに移動
cd "$PROJECT_ROOT"

# 現在のバージョンを取得
CURRENT_VERSION=$(node -p "require('./package.json').version")
log "現在のバージョン: $CURRENT_VERSION"

# バージョン形式を検証
if [[ ! $CURRENT_VERSION =~ ^([0-9]+\.[0-9]+\.[0-9]+)(-[a-zA-Z0-9]+(\.[0-9]+)?)?-fork\.([0-9]+)$ ]]; then
    error "無効なバージョン形式: $CURRENT_VERSION"
fi

# コンポーネントを抽出
BASE_VERSION=${BASH_REMATCH[1]}
PRERELEASE=${BASH_REMATCH[2]}
FORK_NUMBER=${BASH_REMATCH[4]}

info "ベースバージョン: $BASE_VERSION"
info "プレリリース: ${PRERELEASE:-なし}"
info "フォーク番号: $FORK_NUMBER"

# フォーク番号をインクリメント
NEW_FORK_NUMBER=$((FORK_NUMBER + 1))
NEW_VERSION="$BASE_VERSION${PRERELEASE}-fork.$NEW_FORK_NUMBER"

log "新しいバージョン: $NEW_VERSION"

# 確認
echo -n "バージョンを $NEW_VERSION にバンプしますか？ (y/N): "
read -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "バージョンバンプをキャンセルしました"
    exit 0
fi

# 作業ディレクトリがクリーンかチェック
if ! git diff-index --quiet HEAD --; then
    warn "未コミットの変更があります"
    echo -n "続行しますか？ (y/N): "
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "バージョンバンプをキャンセルしました"
        exit 0
    fi
fi

# バージョンを更新
log "package.jsonを更新中..."
npm version $NEW_VERSION --no-git-tag-version

# テストを実行
log "テストを実行中..."
npm test

if [ $? -eq 0 ]; then
    log "テストが合格しました！"
else
    error "テストが失敗しました。バージョンバンプをキャンセルしました。"
fi

# リンティングを実行
log "リンティングを実行中..."
npm run lint

if [ $? -eq 0 ]; then
    log "リンティングが合格しました！"
else
    error "リンティングが失敗しました。バージョンバンプをキャンセルしました。"
fi

# 変更をコミット
if git diff-index --quiet HEAD --; then
    log "変更がありません"
else
    log "変更をコミット中..."
    git add package.json package-lock.json
    git commit -m "chore: bump version to $NEW_VERSION"
    log "コミットが完了しました"
fi

log "バージョンバンプが正常に完了しました！"
log "新しいバージョン: $NEW_VERSION"
log ""
log "次のステップ:"
log "1. 変更をプッシュ: git push origin main"
log "2. タグを作成: git tag v$NEW_VERSION"
log "3. タグをプッシュ: git push origin v$NEW_VERSION"