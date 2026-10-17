// ===== بيانات عامة =====
const TEACHER = {
    name: "عمرو عبدالعال",
    nameEn: "Mr. Amr Abdelaal",
    grade: "الرياضيات - الصف التاسع",
    phone: "77404038",
    wa: "96877404038"
};

// تعريف الألعاب المتاحة
const GAME_DEFS = {
    mcq:     { title: "الاختيار من متعدد", sub: "15 سؤالًا لاختبار معلوماتك", icon: "fa-list-check", color: "grad-mcq" },
    bubbles: { title: "الفقاعات المتساقطة", sub: "المس الفقاعة الصحيحة", icon: "fa-droplet", color: "grad-bubbles" },
    shoot:   { title: "التنشين المتحرك", sub: "صِد الهدف الصحيح المتحرك", icon: "fa-bullseye", color: "grad-shoot" },
    tug:     { title: "شد الحبل", sub: "أجب صح واسحب الحبل لفريقك", icon: "fa-people-pulling", color: "grad-tug" },
    goal:    { title: "تسجيل الأهداف", sub: "اختر الزاوية الصحيحة وسجّل", icon: "fa-futbol", color: "grad-goal" },
    tf:      { title: "صح أم خطأ", sub: "حدد صحة العبارات", icon: "fa-check-double", color: "grad-tf" },
    match:   { title: "لعبة التوصيل", sub: "اربط بين العبارة وما يناسبها", icon: "fa-link", color: "grad-match" },
    millionaire: { title: "من سيربح المليون؟", sub: "إجابة خاطئة واحدة تُنهي المسابقة!", icon: "fa-trophy", color: "grad-mil" },
    fill:    { title: "أكمل الفراغ", sub: "اختر ما يكمل العبارة", icon: "fa-puzzle-piece", color: "grad-fill" }
};

const LESSONS = {
    "1": {
        title: "المثلثات", order: "الدرس الأول (٤-٤)", color: "grad-l1", icon: "", iconText: "△",
        games: ["goal", "tug", "tf", "match", "millionaire", "shoot"],
        tips: [
            "المثلث شكل مستوٍ له ثلاثة أضلاع وثلاث زوايا.",
            "حسب الأضلاع: مختلف الأضلاع ، متطابق الضلعين ، متطابق الأضلاع.",
            "حسب الزوايا: حاد الزوايا (كل زواياه أقل من 90°) ، قائم الزاوية (زاوية 90°) ، منفرج الزاوية (زاوية أكبر من 90°).",
            "مجموع قياسات زوايا المثلث الداخلية = 180°",
            "قياس الزاوية الخارجية للمثلث = مجموع قياسي الزاويتين الداخليتين المقابلتين لها.",
            "في المثلث المتطابق الضلعين زاويتا القاعدة متساويتان ، وفي المتطابق الأضلاع كل زاوية = 60°"
        ]
    },
    "2": {
        title: "الأشكال الرباعية", order: "الدرس الثاني (٤-٥)", color: "grad-l2", icon: "", iconText: "▱",
        games: ["goal", "tug", "tf", "match", "millionaire", "shoot"],
        tips: [
            "الشكل الرباعي شكل مستوٍ له أربعة أضلاع وأربع زوايا داخلية.",
            "مجموع قياسات زوايا الشكل الرباعي الداخلية = 360° (مثلثان: 180° + 180°)",
            "متوازي الأضلاع: الأضلاع المتقابلة متوازية ومتساوية ، والزوايا المتقابلة متساوية ، والزاويتان المتجاورتان مجموعهما 180°",
            "المستطيل: كل زاوية = 90° ، وقطراه متساويان وينصّف كل منهما الآخر.",
            "المربع: أضلاعه متساوية وزواياه قوائم ، وقطراه متساويان ومتعامدان.",
            "المعيّن: أضلاعه متساوية ، وقطراه متعامدان وينصّفان الزوايا.",
            "شبه المنحرف: زوج واحد من الأضلاع المتوازية. الطائرة الورقية: زوجان من الأضلاع المتجاورة متساويان."
        ]
    }
};

// ===== تنسيق النصوص الرياضية =====
// $...$  => معادلة تُكتب من اليمين لليسار كما في الكتاب
// {a/b}  => كسر رأسي (بسط فوق مقام)
// [[fig:f1]] => رسم هندسي من بيانات الدرس ، [[img:img/x.png]] => صورة
// الأرقام تُعرض بالأرقام العربية (٠١٢٣٤٥٦٧٨٩)
function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function fracify(s) {
    return s.replace(/\{([^{}\/]+)\/([^{}]+)\}/g, '<span class="frac"><span class="num">$1</span><span class="den">$2</span></span>');
}
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
function toAr(s) {
    return String(s).replace(/(\d)\.(\d)/g, "$1٫$2").replace(/[0-9]/g, d => AR_DIGITS[d]);
}
function figSvg(id) {
    const D0 = window.LESSON_DATA;
    return (D0 && D0.figs && D0.figs[id]) || '';
}
function fmt(raw) {
    const media = [];
    let s = String(raw).replace(/\[\[(fig|img):([^\]]+)\]\]/g, (m, k, v) => {
        media.push(k === 'fig' ? '<span class="m-fig">' + figSvg(v) + '</span>' : '<img class="m-img" src="' + escapeHtml(v) + '" alt="">');
        return '\u0001' + (media.length - 1) + '\u0002';
    });
    s = escapeHtml(s);
    s = s.replace(/\$([^$]+)\$/g, (m, inner) => '<span class="eq">' + fracify(inner) + '</span>');
    s = toAr(s);
    return s.replace(/\u0001([٠-٩]+)\u0002/g, (m, n) => media[+n.replace(/[٠-٩]/g, d => AR_DIGITS.indexOf(d))]);
}
