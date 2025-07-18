#!/bin/bash
# sync-upstream.sh - 上流リポジトリとの同期
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
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

# Gitリポジトリかチェック
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    error "Gitリポジトリではありません"
fi

# upstreamリモートが存在するかチェック
if ! git remote get-url upstream > /dev/null 2>&1; then
    warn "upstreamリモートが見つかりません。追加します..."
    git remote add upstream git@github.com:microsoft/playwright-mcp.git
fi

log "上流との同期を開始..."

# 最新の上流変更を取得
log "上流の変更を取得中..."
git fetch upstream

# upstreamブランチが存在するかチェック
if ! git show-ref --verify --quiet refs/heads/upstream; then
    log "upstreamブランチを作成中..."
    git checkout -b upstream upstream/main
else
    git checkout upstream
fi

# 現在の上流コミットを取得
UPSTREAM_COMMIT=$(git rev-parse upstream/main)
CURRENT_COMMIT=$(git rev-parse HEAD)

if [ "$UPSTREAM_COMMIT" = "$CURRENT_COMMIT" ]; then
    log "すでに上流と同期されています"
else
    log "上流の変更をマージ中..."
    git merge upstream/main --ff-only
    
    if [ $? -eq 0 ]; then
        log "上流の変更を正常にマージしました"
    else
        error "マージに失敗しました。手動で競合を解決してください。"
    fi
fi

# 新しい上流バージョンを取得
UPSTREAM_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
log "上流バージョン: $UPSTREAM_VERSION"

# リリースブランチを作成
RELEASE_BRANCH="release/${UPSTREAM_VERSION}-fork.1"
log "リリースブランチを作成: $RELEASE_BRANCH"

if git show-ref --verify --quiet refs/heads/$RELEASE_BRANCH; then
    warn "リリースブランチがすでに存在します。切り替えます..."
    git checkout $RELEASE_BRANCH
else
    git checkout -b $RELEASE_BRANCH
fi

# mainブランチをリベース
log "mainブランチをリベース中..."
git checkout main

# リベースが必要かチェック
if git merge-base --is-ancestor main upstream; then
    log "mainブランチはすでに最新です"
else
    log "mainをupstreamにリベース中..."
    
    # 変更をスタッシュ
    if ! git diff-index --quiet HEAD --; then
        warn "未コミットの変更をスタッシュします..."
        git stash push -m "sync-upstream: 自動スタッシュ"
    fi
    
    git rebase upstream
    
    if [ $? -ne 0 ]; then
        error "リベースに失敗しました。競合を手動で解決し、'git rebase --continue'を実行してください"
    fi
fi

# バージョンを更新
log "バージョンを ${UPSTREAM_VERSION}-fork.1 に更新中..."
npm version ${UPSTREAM_VERSION}-fork.1 --no-git-tag-version

# テストを実行
log "テストを実行中..."
npm test

if [ $? -eq 0 ]; then
    log "すべてのテストが合格しました！"
else
    error "テストが失敗しました。問題を修正してから続行してください。"
fi

# リンティングを実行
log "リンティングを実行中..."
npm run lint

if [ $? -eq 0 ]; then
    log "リンティングが合格しました！"
else
    error "リンティングが失敗しました。問題を修正してから続行してください。"
fi

log "上流との同期が正常に完了しました！"
log "次のステップ:"
log "1. 変更をレビュー: git diff upstream"
log "2. カスタム機能をテスト"
log "3. CHANGELOG.mdを更新"
log "4. 必要に応じてプルリクエストを作成"