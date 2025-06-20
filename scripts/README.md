# 進捗レポート自動化スクリプト

## 概要

申請管理システムプロジェクトの進捗を自動的に追跡・レポート生成・通知するためのスクリプト群です。

## 機能

- **GitHub APIからの開発メトリクス収集**
  - コミット数、プルリクエスト、イシュー統計
  - チームベロシティの計算
  - 開発アクティビティの追跡

- **テスト・品質メトリクス収集**
  - フロントエンド・バックエンドのテストカバレッジ
  - CI/CDパイプラインの成功率
  - セキュリティスキャン結果

- **システムメトリクス収集**
  - Dockerコンテナ状況
  - データベースサイズ
  - パフォーマンス指標

- **自動レポート生成**
  - 週次進捗レポート
  - KPI達成状況
  - リスク・課題の特定

- **Slack通知**
  - 自動進捗レポート配信
  - アラート通知
  - チーム向け定期更新

## セットアップ

### 1. 依存関係のインストール

```bash
pip install requests psycopg2-binary python-dotenv
```

### 2. 環境変数の設定

`.env`ファイルを作成して以下を設定：

```bash
# GitHub API
GITHUB_TOKEN=your_github_personal_access_token

# Slack通知
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# データベース（本番環境）
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Prometheus（監視環境）
PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3001
```

### 3. 設定ファイルの調整

`scripts/config.json`を編集してプロジェクト固有の設定を調整：

- リポジトリ情報
- KPI目標値
- チーム情報
- 自動化設定

## 使用方法

### データ収集のテスト

```bash
python scripts/progress-automation.py --action collect
```

### 週次レポート生成

```bash
python scripts/progress-automation.py --action generate_report --period weekly
```

### Slack通知テスト

```bash
python scripts/progress-automation.py --action notify
```

## 自動化設定

### GitHub Actions（推奨）

`.github/workflows/weekly-report.yml`を作成：

```yaml
name: Weekly Progress Report

on:
  schedule:
    # 毎週金曜日 17:00 JST (08:00 UTC)
    - cron: '0 8 * * 5'
  workflow_dispatch:

jobs:
  generate-report:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
        
    - name: Install dependencies
      run: |
        pip install requests psycopg2-binary python-dotenv
        
    - name: Generate report
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      run: |
        python scripts/progress-automation.py --action generate_report
        python scripts/progress-automation.py --action notify
        
    - name: Commit report
      run: |
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git add docs/reports/
        git commit -m "📊 週次進捗レポート自動生成" || exit 0
        git push
```

### Cron設定（サーバー環境）

```bash
# crontab -e で以下を追加
# 毎週金曜日 17:00 に週次レポート生成
0 17 * * 5 cd /path/to/shinsei-management && python scripts/progress-automation.py --action generate_report && python scripts/progress-automation.py --action notify

# 毎日 9:00 にメトリクス収集
0 9 * * * cd /path/to/shinsei-management && python scripts/progress-automation.py --action collect
```

## 出力例

### 生成されるレポート

```markdown
# 週次進捗レポート - 2025年6月第3週

## 📊 進捗サマリー

### フェーズ別進捗
- ✅ **Phase 1: 基盤強化**: 100%
- 🔄 **Phase 2: データ活用**: 80%
- 📋 **Phase 3: 拡張・最適化**: 15%

### 今週の主要成果
- ✅ GitHub Actions CI/CD設定完了
- ✅ Playwright E2Eテスト環境構築
- ✅ Prometheus監視システム基盤設計

## 📈 KPI メトリクス

| 指標 | 現在値 | 目標値 | ステータス |
|------|--------|--------|------------|
| テストカバレッジ | 85% | 90% | ⚠️ |
| API応答時間 | 0.7秒 | 0.5秒 | ⚠️ |
| エラー率 | 1.2% | 1.0% | ⚠️ |
```

### Slack通知

![Slack通知の例](slack-notification-example.png)

## カスタマイズ

### メトリクスの追加

`ProgressDataCollector`クラスに新しいメトリクス収集メソッドを追加：

```python
def collect_custom_metrics(self) -> Dict[str, Any]:
    """カスタムメトリクスの収集"""
    metrics = {}
    
    # 独自の指標を追加
    metrics['feature_usage'] = self.get_feature_usage_stats()
    metrics['user_satisfaction'] = self.get_user_satisfaction_score()
    
    return metrics
```

### レポートテンプレートのカスタマイズ

`ProgressReportGenerator`クラスの`generate_weekly_report`メソッドを編集してレポート形式を変更できます。

### 通知チャンネルの追加

`SlackNotifier`クラスを拡張して複数チャンネルへの通知や、Discord、Teams等への対応も可能です。

## トラブルシューティング

### GitHub API レート制限

```bash
# レート制限確認
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/rate_limit
```

GitHub Enterprise や有料プランの使用を検討してください。

### Slack Webhook エラー

- Webhook URLが正しいか確認
- Slackアプリの権限設定を確認
- レート制限（1メッセージ/秒）に注意

### データベース接続エラー

- DATABASE_URL環境変数の確認
- ネットワーク接続とファイアウォール設定
- PostgreSQLサービスの稼働状況

## 今後の拡張予定

- [ ] Prometheus/Grafanaからのメトリクス取得
- [ ] JIRAやAsanaとの連携
- [ ] Web UIでの設定・閲覧機能
- [ ] 機械学習による予測分析
- [ ] モバイルアプリでの通知対応

## ライセンス

このスクリプトは申請管理システムプロジェクトの一部として、同じライセンス条件で提供されます。

## 問い合わせ

技術的な質問や改善提案は、GitHubのIssueまたはプロジェクトチームまでお問い合わせください。