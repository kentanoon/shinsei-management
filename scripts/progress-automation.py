#!/usr/bin/env python3
"""
申請管理システム 進捗レポート自動化スクリプト

このスクリプトは以下の機能を提供します：
1. GitHubからの進捗データ自動収集
2. システムメトリクスの取得
3. 週次進捗レポートの自動生成
4. Slackへの進捗通知

使用方法:
python scripts/progress-automation.py --action generate_report --period weekly
"""

import os
import json
import datetime
from typing import Dict, List, Any, Optional
import argparse
import requests
from dataclasses import dataclass, asdict
from pathlib import Path
import subprocess

@dataclass
class ProjectMetrics:
    """プロジェクトメトリクスデータクラス"""
    period: str
    phase_progress: Dict[str, float]
    completed_tasks: List[str] 
    upcoming_tasks: List[str]
    kpi_metrics: Dict[str, Any]
    risks: List[Dict[str, str]]
    team_velocity: float
    test_coverage: float
    deployment_frequency: int

class ProgressDataCollector:
    """進捗データ収集クラス"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.github_token = os.getenv('GITHUB_TOKEN')
        self.repo_owner = config.get('repo_owner', 'your-org')
        self.repo_name = config.get('repo_name', 'shinsei-management')
        
    def collect_github_metrics(self) -> Dict[str, Any]:
        """GitHub APIから開発メトリクスを収集"""
        headers = {
            'Authorization': f'token {self.github_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        base_url = f'https://api.github.com/repos/{self.repo_owner}/{self.repo_name}'
        
        metrics = {}
        
        try:
            # コミット数（過去1週間）
            since = (datetime.datetime.now() - datetime.timedelta(days=7)).isoformat()
            commits_url = f'{base_url}/commits?since={since}'
            commits_response = requests.get(commits_url, headers=headers)
            metrics['commits_last_week'] = len(commits_response.json()) if commits_response.ok else 0
            
            # プルリクエスト統計
            prs_url = f'{base_url}/pulls?state=all&per_page=100'
            prs_response = requests.get(prs_url, headers=headers)
            if prs_response.ok:
                prs = prs_response.json()
                metrics['open_prs'] = len([pr for pr in prs if pr['state'] == 'open'])
                metrics['merged_prs_last_week'] = len([
                    pr for pr in prs 
                    if pr['merged_at'] and 
                    datetime.datetime.fromisoformat(pr['merged_at'].replace('Z', '+00:00')) > 
                    datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)
                ])
            
            # イシュー統計
            issues_url = f'{base_url}/issues?state=all&per_page=100'
            issues_response = requests.get(issues_url, headers=headers)
            if issues_response.ok:
                issues = issues_response.json()
                metrics['open_issues'] = len([issue for issue in issues if issue['state'] == 'open'])
                metrics['closed_issues_last_week'] = len([
                    issue for issue in issues
                    if issue['closed_at'] and 
                    datetime.datetime.fromisoformat(issue['closed_at'].replace('Z', '+00:00')) >
                    datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)
                ])
                
        except Exception as e:
            print(f"GitHub API エラー: {e}")
            
        return metrics
    
    def collect_test_metrics(self) -> Dict[str, Any]:
        """テストメトリクスを収集"""
        metrics = {}
        
        try:
            # フロントエンドテストカバレッジ
            frontend_coverage_path = Path('frontend/coverage/coverage-summary.json')
            if frontend_coverage_path.exists():
                with open(frontend_coverage_path, 'r') as f:
                    coverage_data = json.load(f)
                    metrics['frontend_coverage'] = coverage_data['total']['lines']['pct']
            
            # バックエンドテストカバレッジ 
            backend_coverage_path = Path('backend/htmlcov/index.html')
            if backend_coverage_path.exists():
                # HTMLパースして数値抽出（簡易版）
                with open(backend_coverage_path, 'r') as f:
                    content = f.read()
                    # 正規表現でカバレッジ率を抽出
                    import re
                    match = re.search(r'(\d+)%</span>', content)
                    if match:
                        metrics['backend_coverage'] = int(match.group(1))
                        
        except Exception as e:
            print(f"テストメトリクス収集エラー: {e}")
            
        return metrics
    
    def collect_system_metrics(self) -> Dict[str, Any]:
        """システムメトリクスを収集（ローカル環境用）"""
        metrics = {}
        
        try:
            # Dockerコンテナ状況
            result = subprocess.run(['docker', 'ps'], capture_output=True, text=True)
            if result.returncode == 0:
                running_containers = len([line for line in result.stdout.split('\n') if 'shinsei' in line])
                metrics['running_containers'] = running_containers
            
            # データベースサイズ（PostgreSQL）
            # 本番環境では適切な接続情報を使用
            if os.getenv('DATABASE_URL'):
                try:
                    import psycopg2
                    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
                    cursor = conn.cursor()
                    cursor.execute("SELECT pg_size_pretty(pg_database_size(current_database()));")
                    db_size = cursor.fetchone()[0]
                    metrics['database_size'] = db_size
                    conn.close()
                except ImportError:
                    pass  # psycopg2がインストールされていない場合
                    
        except Exception as e:
            print(f"システムメトリクス収集エラー: {e}")
            
        return metrics

class ProgressReportGenerator:
    """進捗レポート生成クラス"""
    
    def __init__(self, metrics: ProjectMetrics):
        self.metrics = metrics
        
    def generate_weekly_report(self) -> str:
        """週次進捗レポートを生成"""
        report = f"""
# 週次進捗レポート - {self.metrics.period}

## 📊 進捗サマリー

### フェーズ別進捗
"""
        
        for phase, progress in self.metrics.phase_progress.items():
            status_emoji = "✅" if progress >= 100 else "🔄" if progress >= 50 else "📋"
            report += f"- {status_emoji} **{phase}**: {progress}%\n"
        
        report += f"""
### 今週の主要成果
"""
        for task in self.metrics.completed_tasks:
            report += f"- ✅ {task}\n"
            
        report += f"""
## 📈 KPI メトリクス

| 指標 | 現在値 | 目標値 | ステータス |
|------|--------|--------|------------|
"""
        
        for metric_name, metric_data in self.metrics.kpi_metrics.items():
            current = metric_data.get('current', 'N/A')
            target = metric_data.get('target', 'N/A')
            status = "✅" if self._is_metric_on_track(metric_data) else "⚠️"
            report += f"| {metric_name} | {current} | {target} | {status} |\n"
            
        report += f"""
## 🎯 来週の予定
"""
        for task in self.metrics.upcoming_tasks:
            report += f"- 📋 {task}\n"
            
        if self.metrics.risks:
            report += f"""
## 🚨 リスク・課題
"""
            for risk in self.metrics.risks:
                severity_emoji = "🔴" if risk['severity'] == 'high' else "🟡" if risk['severity'] == 'medium' else "🟢"
                report += f"- {severity_emoji} **{risk['title']}**: {risk['description']}\n"
                
        report += f"""
## 📊 開発メトリクス

- **チームベロシティ**: {self.metrics.team_velocity}
- **テストカバレッジ**: {self.metrics.test_coverage}%
- **デプロイ頻度**: 週{self.metrics.deployment_frequency}回

---
*自動生成レポート - {datetime.datetime.now().strftime('%Y年%m月%d日 %H:%M')}*
"""
        
        return report
    
    def _is_metric_on_track(self, metric_data: Dict[str, Any]) -> bool:
        """メトリクスが目標通りかチェック"""
        current = metric_data.get('current')
        target = metric_data.get('target')
        
        if current is None or target is None:
            return True
            
        try:
            current_num = float(str(current).replace('%', '').replace('秒', ''))
            target_num = float(str(target).replace('%', '').replace('秒', ''))
            
            # 向上系（高い方が良い）の指標
            if 'カバレッジ' in str(metric_data) or '効率' in str(metric_data):
                return current_num >= target_num * 0.9  # 90%以上なら OK
            # 削減系（低い方が良い）の指標  
            else:
                return current_num <= target_num * 1.1  # 110%以下なら OK
        except:
            return True

class SlackNotifier:
    """Slack通知クラス"""
    
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
        
    def send_progress_notification(self, report: str) -> bool:
        """進捗レポートをSlackに送信"""
        try:
            # レポートを短縮版に変換
            summary_lines = report.split('\n')[:15]  # 最初の15行のみ
            summary = '\n'.join(summary_lines)
            
            payload = {
                "text": "📊 週次進捗レポート",
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": summary
                        }
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "詳細レポートを見る"
                                },
                                "url": "https://github.com/your-org/shinsei-management/blob/main/docs/progress-tracking.md"
                            }
                        ]
                    }
                ]
            }
            
            response = requests.post(self.webhook_url, json=payload)
            return response.ok
            
        except Exception as e:
            print(f"Slack通知エラー: {e}")
            return False

def main():
    """メイン関数"""
    parser = argparse.ArgumentParser(description='進捗レポート自動化')
    parser.add_argument('--action', choices=['collect', 'generate_report', 'notify'], 
                       required=True, help='実行するアクション')
    parser.add_argument('--period', default='weekly', help='レポート期間')
    parser.add_argument('--config', default='scripts/config.json', help='設定ファイルパス')
    
    args = parser.parse_args()
    
    # 設定ファイル読み込み
    config_path = Path(args.config)
    if config_path.exists():
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
    else:
        config = {
            "repo_owner": "your-org",
            "repo_name": "shinsei-management",
            "slack_webhook": os.getenv('SLACK_WEBHOOK_URL')
        }
    
    if args.action == 'collect':
        # データ収集のみ
        collector = ProgressDataCollector(config)
        github_metrics = collector.collect_github_metrics()
        test_metrics = collector.collect_test_metrics()
        system_metrics = collector.collect_system_metrics()
        
        print("収集したメトリクス:")
        print(f"GitHub: {github_metrics}")
        print(f"テスト: {test_metrics}")
        print(f"システム: {system_metrics}")
        
    elif args.action == 'generate_report':
        # レポート生成
        collector = ProgressDataCollector(config)
        
        # サンプルデータでレポート生成
        metrics = ProjectMetrics(
            period=f"{datetime.datetime.now().strftime('%Y年%m月')}第{(datetime.datetime.now().day-1)//7+1}週",
            phase_progress={
                "Phase 1: 基盤強化": 100.0,
                "Phase 2: データ活用": 80.0,
                "Phase 3: 拡張・最適化": 15.0
            },
            completed_tasks=[
                "GitHub Actions CI/CD設定完了",
                "Playwright E2Eテスト環境構築",
                "Prometheus監視システム基盤設計"
            ],
            upcoming_tasks=[
                "テストカバレッジ90%達成",
                "セキュリティヘッダー実装",
                "パフォーマンス最適化"
            ],
            kpi_metrics={
                "テストカバレッジ": {"current": "85%", "target": "90%"},
                "API応答時間": {"current": "0.7秒", "target": "0.5秒"},
                "エラー率": {"current": "1.2%", "target": "1.0%"}
            },
            risks=[
                {
                    "severity": "medium",
                    "title": "テスト自動化遅延",
                    "description": "CI環境の設定に予想以上の時間がかかっている"
                }
            ],
            team_velocity=8.5,
            test_coverage=85.0,
            deployment_frequency=1
        )
        
        generator = ProgressReportGenerator(metrics)
        report = generator.generate_weekly_report()
        
        # レポートファイル保存
        report_path = Path(f'docs/reports/weekly-report-{datetime.datetime.now().strftime("%Y-%m-%d")}.md')
        report_path.parent.mkdir(exist_ok=True)
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report)
            
        print(f"レポートを生成しました: {report_path}")
        print("\n" + "="*50)
        print(report)
        
    elif args.action == 'notify':
        # Slack通知
        if config.get('slack_webhook'):
            notifier = SlackNotifier(config['slack_webhook'])
            
            # 最新のレポートファイルを読み込み
            reports_dir = Path('docs/reports')
            if reports_dir.exists():
                report_files = list(reports_dir.glob('weekly-report-*.md'))
                if report_files:
                    latest_report = max(report_files, key=lambda p: p.stat().st_mtime)
                    with open(latest_report, 'r', encoding='utf-8') as f:
                        report_content = f.read()
                    
                    success = notifier.send_progress_notification(report_content)
                    print(f"Slack通知: {'成功' if success else '失敗'}")
                else:
                    print("送信するレポートファイルがありません")
            else:
                print("reportsディレクトリが存在しません")
        else:
            print("SLACK_WEBHOOK_URLが設定されていません")

if __name__ == '__main__':
    main()