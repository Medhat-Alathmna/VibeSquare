/**
 * Analysis Tips - displayed during PRD generation
 * Tips rotate every 7 seconds to keep users engaged during waiting
 */

export const ANALYSIS_TIPS = [
  '💡 يمكنك تحميل PRD بصيغة Markdown للمشاركة مع فريقك',
  '🎯 استخدم detail level "Comprehensive" للمشاريع الكبيرة',
  '⚡ النتائج المخزنة مؤقتاً تظهر فوراً لتوفير الوقت',
  '📊 تحقق من confidence scores لمعرفة جودة التحليل',
  '🔍 النوع "Both" يعطي أكمل تحليل لواجهة وخلفية التطبيق',
  '💾 يمكنك الوصول لجميع تحليلاتك السابقة من صفحة History',
  '🎨 Visual pipeline مثالي لمشاريع التصميم والواجهات',
  '🏗️ Technical pipeline يركز على Architecture والبنية التقنية',
  '✨ نظام QA المدمج يراجع جودة المواصفات تلقائياً',
  '📝 يمكنك نسخ أجزاء محددة من PRD مباشرة',
  '🚀 التحليل الشامل يوفر وقت فريقك في مرحلة التخطيط',
  '🔐 جميع تحليلاتك محفوظة بشكل آمن في حسابك'
];

/**
 * Get a random tip from the tips array
 */
export function getRandomTip(): string {
  return ANALYSIS_TIPS[Math.floor(Math.random() * ANALYSIS_TIPS.length)];
}

/**
 * Tip rotation interval in milliseconds (7 seconds)
 */
export const TIP_ROTATION_INTERVAL = 7000;
