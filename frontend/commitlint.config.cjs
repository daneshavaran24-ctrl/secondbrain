module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // نوو فیچر
        'fix',      // رفع باگ
        'docs',     // تغییرات مستندات
        'style',    // تغییرات فرمت (فاصله، نقطه‌گذاری، etc)
        'refactor', // تغییر کد که نه باگ می‌گیره نه فیچر اضافه می‌کنه
        'perf',     // تغییر کد برای بهبود performance
        'test',     // اضافه کردن تست یا تصحیح تست‌های موجود
        'chore',    // تغییرات tooling، dependencies، etc
        'build',    // تغییرات مربوط به build system
        'ci',       // تغییرات مربوط به CI/CD
        'revert'    // برگرداندن کامیت قبلی
      ]
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never']
  }
};