"use client";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    icon: "📈",
    title: "הגרף במרכז",
    body: "כל נר מייצג יום מסחר. ירוק = המחיר עלה באותו יום, אדום = ירד. אפשר לגלול ולהתקרב/להתרחק עם הגלגלת.",
  },
  {
    icon: "🎛️",
    title: "אינדיקטורים (בצד שמאל)",
    body: "כלים שעוזרים לקרוא את הגרף. לא בטוח מה לבחור? יש למטה \"תבניות מוכנות\" — פשוט תלחץ על אחת ותתחיל. ליד כל אחד יש כפתור \"?\" עם הסבר.",
  },
  {
    icon: "💡",
    title: "תובנות אוטומטיות (בצד ימין)",
    body: "האפליקציה בודקת את הגרף לבד ומסכמת בשפה פשוטה מה בולט בו כרגע — לא צריך לדעת לפרש את זה בעצמך.",
  },
  {
    icon: "🤖",
    title: "עוזר AI",
    body: "כפתור בסרגל הכלים למעלה. אפשר לשאול אותו כל שאלה על מה שרואים בגרף, גם אם אתה לא יודע איך לנסח אותה טכנית — יש הצעות שאלות מוכנות בפנים.",
  },
  {
    icon: "🔔",
    title: "התראות",
    body: "בקש מהאפליקציה להודיע לך כשמחיר עובר רמה מסוימת, במקום לבדוק כל הזמן בעצמך.",
  },
];

export default function OnboardingModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-gray-900 p-5 shadow-2xl"
      >
        <h1 className="mb-1 text-lg font-bold text-gray-100">
          ברוך הבא 👋
        </h1>
        <p className="mb-4 text-sm text-gray-400">
          זו פלטפורמה אישית למעקב וניתוח מניות — לא לביצוע עסקאות. הנה
          מדריך קצר של מה יש כאן:
        </p>

        <div className="flex flex-col gap-3">
          {SECTIONS.map((s) => (
            <div key={s.title} className="flex gap-3 rounded bg-gray-950 p-3">
              <span className="text-xl">{s.icon}</span>
              <div>
                <div className="text-sm font-semibold text-gray-200">
                  {s.title}
                </div>
                <div className="mt-0.5 text-xs leading-relaxed text-gray-400">
                  {s.body}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-gray-600">
          לא ייעוץ השקעות — כלי חינוכי וניתוחי בלבד. אפשר לחזור למדריך הזה
          בכל רגע עם כפתור &quot;❓ מדריך&quot; למעלה.
        </p>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          הבנתי, בואו נתחיל
        </button>
      </div>
    </div>
  );
}
