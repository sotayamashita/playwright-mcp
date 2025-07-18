#!/bin/bash
# validate-patches.sh - カスタムパッチを検証
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
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] 情報:${NC} $1"
}

detail() {
    echo -e "${CYAN}$1${NC}"
}

# プロジェクトルートに移動
cd "$PROJECT_ROOT"

log "カスタムパッチを検証中..."

# 現在のブランチを確認
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    warn "mainブランチではありません。現在のブランチ: $CURRENT_BRANCH"
    echo -n "続行しますか？ (y/N): "
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# upstreamブランチが存在するかチェック
if ! git show-ref --verify --quiet refs/heads/upstream; then
    error "upstreamブランチが見つかりません。最初に sync-upstream.sh を実行してください。"
fi

# カスタムコミットを取得
log "カスタムパッチを分析中..."
CUSTOM_COMMITS=$(git log --oneline upstream..HEAD)

if [ -z "$CUSTOM_COMMITS" ]; then
    log "カスタムパッチが見つかりません"
    exit 0
fi

echo ""
info "カスタムパッチが見つかりました:"
echo "$CUSTOM_COMMITS"
echo ""

# 統計情報の初期化
TOTAL_PATCHES=0
NEW_FILES=0
MODIFIED_FILES=0
DELETED_FILES=0
RISKY_FILES=0
CONFLICT_POTENTIAL=0

# パッチの詳細分析
info "各コミットを分析中..."
echo ""

while IFS= read -r commit; do
    COMMIT_HASH=${commit%% *}
    COMMIT_MSG=${commit#* }
    
    detail "📝 コミット: $COMMIT_HASH - $COMMIT_MSG"
    
    # 変更されたファイルを取得
    FILES_CHANGED=$(git diff --name-status $COMMIT_HASH^ $COMMIT_HASH 2>/dev/null || git diff --name-status $(git hash-object -t tree /dev/null) $COMMIT_HASH)
    
    while IFS=$'\t' read -r status file; do
        case $status in
            A)
                echo "  ✨ 新規: $file"
                NEW_FILES=$((NEW_FILES + 1))
                ;;
            M)
                echo "  📝 変更: $file"
                MODIFIED_FILES=$((MODIFIED_FILES + 1))
                
                # リスクの高いファイルかチェック
                if [[ $file =~ ^(src/|lib/|index\.) ]]; then
                    echo "  ⚠️  リスク: $file (コア機能)"
                    RISKY_FILES=$((RISKY_FILES + 1))
                fi
                ;;
            D)
                echo "  🗑️  削除: $file"
                DELETED_FILES=$((DELETED_FILES + 1))
                ;;
            R*)
                echo "  🔄 リネーム: $file"
                ;;
        esac
    done <<< "$FILES_CHANGED"
    
    TOTAL_PATCHES=$((TOTAL_PATCHES + 1))
    echo ""
done <<< "$CUSTOM_COMMITS"

# 統計情報の表示
echo ""
log "パッチ検証サマリー:"
echo "  パッチ総数: $TOTAL_PATCHES"
echo "  新規ファイル: $NEW_FILES"
echo "  変更ファイル: $MODIFIED_FILES"
echo "  削除ファイル: $DELETED_FILES"
echo "  リスクの高い変更: $RISKY_FILES"

if [ $RISKY_FILES -gt 0 ]; then
    warn "$RISKY_FILES 個のリスクの高いファイル変更が見つかりました"
    warn "これらは上流同期時に競合を引き起こす可能性があります"
fi

# 潜在的な競合をチェック
log "潜在的な競合をチェック中..."

# マージツリーを使用して競合をチェック
MERGE_BASE=$(git merge-base upstream HEAD)
CONFLICTS=$(git merge-tree $MERGE_BASE upstream HEAD 2>/dev/null | grep -c "<<<<<<< " || echo "0")

if [ $CONFLICTS -gt 0 ]; then
    error "潜在的なマージ競合が検出されました: $CONFLICTS 箇所"
    warn "上流同期前に競合の解決を検討してください"
else
    log "マージ競合は検出されませんでした"
fi

# パッチファイルの生成（オプション）
echo ""
echo -n "パッチファイルを生成しますか？ (y/N): "
read -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "パッチファイルを生成中..."
    
    # パッチディレクトリを作成
    PATCH_DIR="patches/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$PATCH_DIR"
    
    # パッチファイルを生成
    git format-patch upstream --output-directory "$PATCH_DIR"
    
    # パッチのインデックスを作成
    echo "# カスタムパッチ" > "$PATCH_DIR/README.md"
    echo "" >> "$PATCH_DIR/README.md"
    echo "生成日時: $(date)" >> "$PATCH_DIR/README.md"
    echo "" >> "$PATCH_DIR/README.md"
    echo "## パッチ一覧" >> "$PATCH_DIR/README.md"
    echo "" >> "$PATCH_DIR/README.md"
    
    for patch in "$PATCH_DIR"/*.patch; do
        if [ -f "$patch" ]; then
            subject=$(grep "^Subject:" "$patch" | sed 's/Subject: \[PATCH[^]]*\] //')
            echo "- $(basename "$patch"): $subject" >> "$PATCH_DIR/README.md"
        fi
    done
    
    log "パッチファイルを $PATCH_DIR に生成しました"
fi

# 推奨事項
echo ""
log "推奨事項:"
if [ $RISKY_FILES -gt 0 ]; then
    echo "  - リスクの高い変更を確認し、必要に応じてリファクタリングを検討"
fi
if [ $CONFLICTS -gt 0 ]; then
    echo "  - 潜在的な競合を事前に解決"
fi
echo "  - すべてのパッチに適切なテストがあることを確認"
echo "  - 上流への貢献可能なパッチがないか検討"

log "パッチ検証が完了しました"