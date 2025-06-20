# 実装テンプレート・チェックリスト集

## 🎯 このファイルの目的

開発チームが効率的に改善計画を実行できるよう、すぐに使える実装テンプレート、設定ファイル、チェックリストを提供します。

---

## 🧪 テスト体制強化テンプレート

### GitHub Actions CI/CD設定

#### `.github/workflows/ci.yml`
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  frontend-test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
        
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
        
    - name: Run linting
      run: |
        cd frontend
        npm run lint
        
    - name: Run unit tests
      run: |
        cd frontend
        npm run test:coverage
        
    - name: Run E2E tests
      run: |
        cd frontend
        npm run test:e2e
        
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        directory: frontend/coverage

  backend-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
        
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest-cov pytest-asyncio
        
    - name: Run tests with coverage
      env:
        DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db
      run: |
        cd backend
        pytest --cov=app --cov-report=xml --cov-report=html
        
    - name: Run security checks
      run: |
        cd backend
        pip install safety bandit
        safety check
        bandit -r app/
        
  build-and-deploy:
    needs: [frontend-test, backend-test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Build Docker images
      run: |
        docker-compose build
        
    - name: Deploy to staging
      # 本番環境の場合はここでデプロイ処理
      run: echo "Deploy to staging environment"
```

#### Playwright E2Eテスト設定

##### `frontend/playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

##### `frontend/e2e/project-workflow.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('プロジェクト管理ワークフロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // ログイン処理があればここに追加
  });

  test('新規プロジェクト作成フロー', async ({ page }) => {
    // プロジェクト作成ページへ移動
    await page.click('text=新規プロジェクト');
    await expect(page).toHaveURL('/projects/create');

    // フォーム入力
    await page.fill('[data-testid="project-name"]', 'テストプロジェクト');
    await page.fill('[data-testid="postal-code"]', '1234567');
    
    // 郵便番号自動入力の確認
    await page.waitForSelector('[data-testid="address"]');
    const address = await page.inputValue('[data-testid="address"]');
    expect(address).toBeTruthy();

    // 保存
    await page.click('[data-testid="save-button"]');
    
    // 成功メッセージの確認
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('申請ワークフロー実行', async ({ page }) => {
    // 既存プロジェクトを開く
    await page.goto('/projects/1');
    
    // 申請作成
    await page.click('[data-testid="create-application"]');
    await page.selectOption('[data-testid="application-type"]', 'building_permit');
    
    // ワークフローアクション実行
    await page.click('[data-testid="submit-application"]');
    
    // ステータス確認
    await expect(page.locator('[data-testid="application-status"]'))
      .toHaveText('レビュー中');
  });

  test('ダッシュボードインタラクション', async ({ page }) => {
    await page.goto('/dashboard');
    
    // ウィジェットの存在確認
    await expect(page.locator('[data-testid="project-summary-widget"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-chart-widget"]')).toBeVisible();
    
    // ドラッグ&ドロップ機能テスト（簡単な移動確認）
    const widget = page.locator('[data-testid="project-summary-widget"]');
    const targetArea = page.locator('[data-testid="dashboard-grid"]');
    
    await widget.dragTo(targetArea);
    
    // レイアウト保存
    await page.click('[data-testid="save-layout"]');
    await expect(page.locator('[data-testid="layout-saved-message"]')).toBeVisible();
  });
});
```

### テストカバレッジ設定

#### `frontend/jest.config.js`
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
};
```

#### `backend/pytest.ini`
```ini
[tool:pytest]
testpaths = app/tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --cov=app
    --cov-report=html:htmlcov
    --cov-report=xml
    --cov-report=term-missing
    --cov-fail-under=90
    --strict-markers
    --disable-warnings
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
    unit: marks tests as unit tests
```

---

## 📊 監視システム設定テンプレート

### Prometheus設定

#### `monitoring/prometheus.yml`
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'shinsei-management-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 10s
    
  - job_name: 'shinsei-management-frontend'
    static_configs:
      - targets: ['frontend:3000']
    metrics_path: '/metrics'
    
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
    
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

#### `monitoring/alert_rules.yml`
```yaml
groups:
  - name: shinsei-management-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "高いエラー率を検出"
          description: "5分間で5%以上のエラー率: {{ $value }}"
          
      - alert: SlowApiResponse
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API応答時間が遅い"
          description: "95%ile応答時間: {{ $value }}秒"
          
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "メモリ使用率が高い"
          description: "メモリ使用率: {{ $value | humanizePercentage }}"
          
      - alert: DatabaseConnectionHigh
        expr: pg_stat_activity_count > 40
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "データベース接続数が多い"
          description: "アクティブ接続数: {{ $value }}"
```

### Grafanaダッシュボード設定

#### `monitoring/grafana/dashboard.json`
```json
{
  "dashboard": {
    "title": "申請管理システム監視",
    "tags": ["shinsei-management"],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "panels": [
      {
        "title": "API応答時間",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95%ile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50%ile"
          }
        ]
      },
      {
        "title": "リクエスト率",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "エラー率",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m])",
            "legendFormat": "Error Rate"
          }
        ]
      }
    ]
  }
}
```

### アプリケーション監視コード

#### `backend/app/middleware/monitoring.py`
```python
import time
from typing import Callable
from fastapi import Request, Response
from prometheus_client import Counter, Histogram, Gauge, generate_latest
import psutil

# メトリクス定義
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

ACTIVE_CONNECTIONS = Gauge(
    'websocket_connections_active',
    'Active WebSocket connections'
)

MEMORY_USAGE = Gauge(
    'process_memory_usage_bytes',
    'Process memory usage in bytes'
)

CPU_USAGE = Gauge(
    'process_cpu_usage_percentage',
    'Process CPU usage percentage'
)

async def monitoring_middleware(request: Request, call_next: Callable) -> Response:
    """監視メトリクス収集ミドルウェア"""
    start_time = time.time()
    
    # リクエスト処理
    response = await call_next(request)
    
    # メトリクス記録
    duration = time.time() - start_time
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_DURATION.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response

def update_system_metrics():
    """システムメトリクス更新"""
    process = psutil.Process()
    
    MEMORY_USAGE.set(process.memory_info().rss)
    CPU_USAGE.set(process.cpu_percent())

async def metrics_endpoint():
    """Prometheusメトリクスエンドポイント"""
    update_system_metrics()
    return Response(
        content=generate_latest(),
        media_type="text/plain"
    )
```

#### `frontend/src/utils/monitoring.ts`
```typescript
// フロントエンド監視用ユーティリティ
export class FrontendMonitoring {
  private static instance: FrontendMonitoring;
  private performanceEntries: PerformanceEntry[] = [];

  static getInstance(): FrontendMonitoring {
    if (!FrontendMonitoring.instance) {
      FrontendMonitoring.instance = new FrontendMonitoring();
    }
    return FrontendMonitoring.instance;
  }

  // ページロード時間測定
  trackPageLoad(pageName: string): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const metrics = {
      page: pageName,
      loadTime: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      firstContentfulPaint: this.getFirstContentfulPaint(),
      timestamp: new Date().toISOString()
    };

    this.sendMetrics('page_load', metrics);
  }

  // API呼び出し時間測定
  trackApiCall(endpoint: string, duration: number, status: number): void {
    const metrics = {
      endpoint,
      duration,
      status,
      timestamp: new Date().toISOString()
    };

    this.sendMetrics('api_call', metrics);
  }

  // ユーザーアクション追跡
  trackUserAction(action: string, details?: any): void {
    const metrics = {
      action,
      details,
      timestamp: new Date().toISOString(),
      url: window.location.pathname
    };

    this.sendMetrics('user_action', metrics);
  }

  private getFirstContentfulPaint(): number | null {
    const entries = performance.getEntriesByType('paint');
    const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : null;
  }

  private sendMetrics(type: string, data: any): void {
    // 本番環境では実際の監視サービスに送信
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Monitoring] ${type}:`, data);
    } else {
      // Prometheus pushgateway or APM service
      fetch('/api/v1/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data })
      }).catch(error => console.error('Metrics送信エラー:', error));
    }
  }
}
```

---

## 🔒 セキュリティ強化テンプレート

### セキュリティヘッダー設定

#### `backend/app/middleware/security.py`
```python
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # セキュリティヘッダー設定
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' wss://localhost:8000"
        )
        
        return response
```

### CSRF保護強化

#### `backend/app/core/csrf.py`
```python
from fastapi import HTTPException, Request
from fastapi_csrf_protect import CsrfProtect
from fastapi_csrf_protect.exceptions import CsrfProtectError
import secrets

class CSRFProtection:
    def __init__(self):
        self.csrf = CsrfProtect()
        
    def generate_csrf_token(self) -> str:
        """CSRFトークン生成"""
        return secrets.token_urlsafe(32)
    
    def validate_csrf_token(self, request: Request, token: str) -> bool:
        """CSRFトークン検証"""
        try:
            self.csrf.validate_csrf(request, token)
            return True
        except CsrfProtectError:
            raise HTTPException(
                status_code=403,
                detail="CSRF token validation failed"
            )
```

### 入力値サニタイズ

#### `backend/app/utils/sanitizers.py`
```python
import re
import html
from typing import Any, Dict, List, Union

class InputSanitizer:
    @staticmethod
    def sanitize_string(value: str) -> str:
        """文字列のサニタイズ"""
        if not isinstance(value, str):
            return value
            
        # HTMLエスケープ
        value = html.escape(value)
        
        # SQLインジェクション対策（基本的な文字除去）
        dangerous_chars = ["'", '"', ';', '--', '/*', '*/', 'xp_', 'sp_']
        for char in dangerous_chars:
            value = value.replace(char, '')
            
        return value.strip()
    
    @staticmethod
    def sanitize_email(email: str) -> str:
        """メールアドレスのサニタイズと検証"""
        email = email.strip().lower()
        
        # 基本的なメール形式チェック
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise ValueError("Invalid email format")
            
        return email
    
    @staticmethod
    def sanitize_phone(phone: str) -> str:
        """電話番号のサニタイズ"""
        # 数字とハイフンのみ許可
        phone = re.sub(r'[^\d-]', '', phone)
        return phone
    
    @classmethod
    def sanitize_dict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """辞書データの再帰的サニタイズ"""
        sanitized = {}
        
        for key, value in data.items():
            if isinstance(value, str):
                sanitized[key] = cls.sanitize_string(value)
            elif isinstance(value, dict):
                sanitized[key] = cls.sanitize_dict(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    cls.sanitize_string(item) if isinstance(item, str) 
                    else item for item in value
                ]
            else:
                sanitized[key] = value
                
        return sanitized
```

---

## ✅ 実装チェックリスト

### Phase 2 完了チェックリスト
```markdown
#### B3. カスタマイズ可能な通知・アラート
- [ ] メール通知システム実装
  - [ ] SendGrid/AWS SES設定
  - [ ] メールテンプレート作成
  - [ ] 送信キュー実装
- [ ] アプリ内通知システム
  - [ ] NotificationPanel コンポーネント
  - [ ] WebSocket通知配信
  - [ ] 通知履歴管理
- [ ] 通知設定UI
  - [ ] ユーザー設定画面
  - [ ] 通知カテゴリ管理
  - [ ] 通知頻度設定

#### B4. レポーティング機能拡充
- [ ] レポートビルダー
  - [ ] ドラッグ&ドロップUI
  - [ ] 計算フィールド機能
  - [ ] 条件付き書式
- [ ] 自動生成・配信
  - [ ] スケジュール設定
  - [ ] レポート履歴
  - [ ] 配信先管理
```

### システム改善チェックリスト
```markdown
#### テスト体制強化
- [ ] CI/CD構築
  - [ ] GitHub Actions設定
  - [ ] 自動テスト実行
  - [ ] カバレッジレポート
- [ ] E2Eテスト
  - [ ] Playwright環境構築
  - [ ] 主要フロー自動テスト
  - [ ] 視覚回帰テスト
- [ ] セキュリティテスト
  - [ ] OWASP ZAP実行
  - [ ] 依存関係スキャン
  - [ ] セキュリティヘッダー確認

#### 監視システム
- [ ] Prometheus設定
  - [ ] メトリクス収集
  - [ ] アラートルール
  - [ ] カスタムメトリクス
- [ ] Grafanaダッシュボード
  - [ ] システムメトリクス
  - [ ] ビジネスメトリクス
  - [ ] アラート表示
```

---

**ファイル作成日**: 2025年6月19日  
**最終更新**: 2025年6月19日  
**次回更新予定**: 実装進捗に応じて随時更新

*このテンプレート集は、改善計画の確実な実行を支援するために作成されました。各テンプレートは実際のプロジェクト環境に合わせて調整してご利用ください。*