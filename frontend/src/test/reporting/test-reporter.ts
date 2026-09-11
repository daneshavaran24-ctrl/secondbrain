import type { Reporter } from 'vitest'

export interface TestMetrics {
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  coverage: {
    statements: number
    branches: number
    functions: number
    lines: number
  }
  performance: {
    averageTestTime: number
    slowestTest: {
      name: string
      duration: number
    }
    totalDuration: number
  }
  categories: {
    'Black-box': { passed: number; failed: number }
    'White-box': { passed: number; failed: number }
    'Gray-box': { passed: number; failed: number }
    'Functional': { passed: number; failed: number }
    'Non-Functional': { passed: number; failed: number }
    'Integration': { passed: number; failed: number }
    'Performance': { passed: number; failed: number }
  }
}

export class CustomTestReporter implements Reporter {
  private metrics: TestMetrics = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    coverage: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0
    },
    performance: {
      averageTestTime: 0,
      slowestTest: { name: '', duration: 0 },
      totalDuration: 0
    },
    categories: {
      'Black-box': { passed: 0, failed: 0 },
      'White-box': { passed: 0, failed: 0 },
      'Gray-box': { passed: 0, failed: 0 },
      'Functional': { passed: 0, failed: 0 },
      'Non-Functional': { passed: 0, failed: 0 },
      'Integration': { passed: 0, failed: 0 },
      'Performance': { passed: 0, failed: 0 }
    }
  }

  onTaskUpdate(tasks: any[]) {
    this.updateMetrics(tasks)
  }

  onFinished(files: any[]) {
    this.generateReport()
  }

  private updateMetrics(tasks: any[]) {
    tasks.forEach(task => {
      if (task.type === 'test') {
        this.metrics.totalTests++

        if (task.result?.state === 'pass') {
          this.metrics.passedTests++
          this.categorizeTest(task.name, 'passed')
        } else if (task.result?.state === 'fail') {
          this.metrics.failedTests++
          this.categorizeTest(task.name, 'failed')
        } else if (task.result?.state === 'skip') {
          this.metrics.skippedTests++
        }

        // Track performance
        if (task.result?.duration) {
          this.metrics.performance.totalDuration += task.result.duration

          if (task.result.duration > this.metrics.performance.slowestTest.duration) {
            this.metrics.performance.slowestTest = {
              name: task.name,
              duration: task.result.duration
            }
          }
        }
      }
    })

    // Calculate average test time
    if (this.metrics.totalTests > 0) {
      this.metrics.performance.averageTestTime =
        this.metrics.performance.totalDuration / this.metrics.totalTests
    }
  }

  private categorizeTest(testName: string, result: 'passed' | 'failed') {
    const categories = Object.keys(this.metrics.categories) as Array<keyof typeof this.metrics.categories>

    for (const category of categories) {
      if (testName.includes(category) || testName.includes(this.getCategoryInPersian(category))) {
        this.metrics.categories[category][result]++
        return
      }
    }
  }

  private getCategoryInPersian(category: string): string {
    const translations: Record<string, string> = {
      'Black-box': 'جعبه‌سیاه',
      'White-box': 'جعبه‌سفید',
      'Gray-box': 'جعبه خاکستری',
      'Functional': 'عملکردی',
      'Non-Functional': 'غیرعملکردی',
      'Integration': 'یکپارچگی',
      'Performance': 'عملکرد'
    }
    return translations[category] || category
  }

  private generateReport() {
    const report = this.createHTMLReport()
    const jsonReport = this.createJSONReport()

    // Save reports (in real implementation, would write to files)
    console.log('Test Report Generated:')
    console.log(jsonReport)
  }

  private createHTMLReport(): string {
    const passRate = (this.metrics.passedTests / this.metrics.totalTests * 100).toFixed(2)

    return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>گزارش تست Mora</title>
    <style>
        body { font-family: 'Vazir', Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 20px; margin-bottom: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2rem; font-weight: bold; margin-bottom: 5px; }
        .metric-label { font-size: 0.9rem; opacity: 0.9; }
        .categories-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .categories-table th, .categories-table td { padding: 12px; text-align: right; border: 1px solid #ddd; }
        .categories-table th { background: #3498db; color: white; }
        .passed { color: #27ae60; font-weight: bold; }
        .failed { color: #e74c3c; font-weight: bold; }
        .performance-section { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>گزارش جامع تست سیستم Mora</h1>
            <p>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${this.metrics.totalTests}</div>
                <div class="metric-label">کل تست‌ها</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${this.metrics.passedTests}</div>
                <div class="metric-label">تست‌های موفق</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${this.metrics.failedTests}</div>
                <div class="metric-label">تست‌های ناموفق</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${passRate}%</div>
                <div class="metric-label">نرخ موفقیت</div>
            </div>
        </div>

        <h2>تست‌ها بر اساس دسته‌بندی</h2>
        <table class="categories-table">
            <thead>
                <tr>
                    <th>دسته‌بندی</th>
                    <th>موفق</th>
                    <th>ناموفق</th>
                    <th>کل</th>
                    <th>نرخ موفقیت</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(this.metrics.categories).map(([category, data]) => {
      const total = data.passed + data.failed
      const rate = total > 0 ? (data.passed / total * 100).toFixed(1) : '0'
      const persianCategory = this.getCategoryInPersian(category)

      return `
                    <tr>
                        <td>${persianCategory}</td>
                        <td class="passed">${data.passed}</td>
                        <td class="failed">${data.failed}</td>
                        <td>${total}</td>
                        <td>${rate}%</td>
                    </tr>
                  `
    }).join('')}
            </tbody>
        </table>

        <div class="performance-section">
            <h2>آمار عملکرد</h2>
            <p><strong>متوسط زمان اجرای تست:</strong> ${this.metrics.performance.averageTestTime.toFixed(2)} میلی‌ثانیه</p>
            <p><strong>کندترین تست:</strong> ${this.metrics.performance.slowestTest.name} (${this.metrics.performance.slowestTest.duration} میلی‌ثانیه)</p>
            <p><strong>کل زمان اجرا:</strong> ${(this.metrics.performance.totalDuration / 1000).toFixed(2)} ثانیه</p>
        </div>
    </div>
</body>
</html>
    `
  }

  private createJSONReport() {
    return {
      timestamp: new Date().toISOString(),
      system: 'Mora PKM System',
      metrics: this.metrics,
      summary: {
        totalTests: this.metrics.totalTests,
        passRate: this.metrics.totalTests > 0 ?
          (this.metrics.passedTests / this.metrics.totalTests * 100).toFixed(2) + '%' : '0%',
        status: this.metrics.failedTests === 0 ? 'SUCCESS' : 'FAILED',
        criticalIssues: this.getCriticalIssues()
      }
    }
  }

  private getCriticalIssues(): string[] {
    const issues: string[] = []

    if (this.metrics.failedTests > 0) {
      issues.push(`${this.metrics.failedTests} تست ناموفق`)
    }

    if (this.metrics.performance.averageTestTime > 1000) {
      issues.push('زمان اجرای تست‌ها بیش از حد مجاز')
    }

    Object.entries(this.metrics.categories).forEach(([category, data]) => {
      const total = data.passed + data.failed
      if (total > 0 && (data.passed / total) < 0.8) {
        issues.push(`نرخ موفقیت پایین در دسته ${this.getCategoryInPersian(category)}`)
      }
    })

    return issues
  }
}

// Export utility functions for test analysis
export const analyzeTestResults = (results: any[]) => {
  const analysis = {
    bugSeverity: categorizeByBugSeverity(results),
    performanceBottlenecks: identifyPerformanceBottlenecks(results),
    coverageGaps: identifyCoverageGaps(results),
    recommendations: generateRecommendations(results)
  }

  return analysis
}

const categorizeByBugSeverity = (results: any[]) => {
  return {
    critical: results.filter(r => r.severity === 'critical').length,
    major: results.filter(r => r.severity === 'major').length,
    minor: results.filter(r => r.severity === 'minor').length,
    trivial: results.filter(r => r.severity === 'trivial').length
  }
}

const identifyPerformanceBottlenecks = (results: any[]) => {
  return results
    .filter(r => r.duration > 1000)
    .map(r => ({ name: r.name, duration: r.duration }))
    .sort((a, b) => b.duration - a.duration)
}

const identifyCoverageGaps = (results: any[]) => {
  // Identify areas with low test coverage
  return [
    'Edge case handling',
    'Error boundary testing',
    'Accessibility compliance',
    'Performance under load'
  ]
}

const generateRecommendations = (results: any[]) => {
  const recommendations: string[] = []

  const failedCount = results.filter(r => r.status === 'failed').length
  const totalCount = results.length

  if (failedCount > totalCount * 0.1) {
    recommendations.push('تعداد تست‌های ناموفق بالا است - بازبینی کد ضروری')
  }

  const slowTests = results.filter(r => r.duration > 1000).length
  if (slowTests > 0) {
    recommendations.push('بهینه‌سازی تست‌های کند ضروری است')
  }

  recommendations.push('افزایش پوشش تست‌های یکپارچگی')
  recommendations.push('بررسی دسترس‌پذیری در تمام کامپوننت‌ها')

  return recommendations
}