import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const LANGS = [
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
] as const;

const resources = {
  fr: {
    translation: {
      nav: { home: "Accueil", games: "Jeux", myGames: "Mes jeux", leaderboard: "Classement", help: "Aide" },
      auth: {
        signIn: "Se connecter", createAccount: "Créer un compte", dashboard: "Tableau de bord", logout: "Déconnexion",
      },
      hero: {
        badge: "Nouvelle saison disponible",
        title1: "Apprenez. Jouez.",
        title2: "Gagnez ensemble !",
        subtitle: "Rejoignez des millions de joueurs dans le monde entier et vivez une expérience d'apprentissage amusante et interactive.",
        players: "+2M joueurs actifs",
      },
      join: {
        title: "Entrez le code de la partie donné par votre enseignant",
        subtitle: "Tapez le code à 5 chiffres pour rejoindre la salle en direct.",
        placeholder: "Entrez le code ici",
        cta: "Rejoindre la partie",
        unique: "Code unique à 5 chiffres",
        validity: "Valide uniquement pour une partie en cours",
      },
      modes: {
        title: "Modes de jeu disponibles", viewAll: "Voir tout",
        classic: { t: "Quiz Classique", d: "Répondez correctement et gagnez des points", p: "2 – 50 joueurs" },
        duel: { t: "Duel en direct", d: "Affrontez vos amis en temps réel", p: "2 joueurs" },
        race: { t: "Course contre la montre", d: "Répondez vite, gagnez plus !", p: "2 – 30 joueurs" },
        puzzle: { t: "Puzzle Quiz", d: "Répondez et complétez le puzzle", p: "2 – 20 joueurs" },
        tf: { t: "Vrai ou Faux", d: "Répondez vrai ou faux le plus rapidement", p: "2 – 50 joueurs" },
        survival: { t: "Survie", d: "Restez jusqu'à la dernière question", p: "2 – 100 joueurs" },
      },
      footer: { tag: "Apprendre en jouant" },
      signup: {
        title: "Créer votre compte",
        chooseRole: "Vous êtes :",
        student: "Élève",
        teacher: "Enseignant",
        studentDesc: "Rejoignez des parties avec un code",
        teacherDesc: "Créez et animez vos parties",
        fullName: "Nom complet",
        email: "Adresse e-mail",
        password: "Mot de passe (min. 6 caractères)",
        submit: "Créer mon compte",
        back: "Retour",
        success: "Compte créé avec succès !",
        errorEmail: "E-mail invalide",
        errorPassword: "Le mot de passe doit contenir au moins 6 caractères",
        errorEmpty: "Veuillez remplir tous les champs",
        errorGeneric: "Une erreur est survenue, réessayez.",
      },
    },
  },
  en: {
    translation: {
      nav: { home: "Home", games: "Games", myGames: "My games", leaderboard: "Leaderboard", help: "Help" },
      auth: { signIn: "Sign in", createAccount: "Create account", dashboard: "Dashboard", logout: "Log out" },
      hero: {
        badge: "New season available",
        title1: "Learn. Play.",
        title2: "Win together!",
        subtitle: "Join millions of players around the world for a fun, interactive learning experience.",
        players: "+2M active players",
      },
      join: {
        title: "Enter the game code from your teacher",
        subtitle: "Type the 5-digit code to join the live room.",
        placeholder: "Enter the code here",
        cta: "Join the game",
        unique: "Unique 5-digit code",
        validity: "Valid only for an ongoing game",
      },
      modes: {
        title: "Available game modes", viewAll: "View all",
        classic: { t: "Classic Quiz", d: "Answer correctly and earn points", p: "2 – 50 players" },
        duel: { t: "Live Duel", d: "Challenge your friends in real time", p: "2 players" },
        race: { t: "Time Race", d: "Answer fast, earn more!", p: "2 – 30 players" },
        puzzle: { t: "Puzzle Quiz", d: "Answer and complete the puzzle", p: "2 – 20 players" },
        tf: { t: "True or False", d: "Answer true or false the fastest", p: "2 – 50 players" },
        survival: { t: "Survival", d: "Stay until the last question", p: "2 – 100 players" },
      },
      footer: { tag: "Learn by playing" },
      signup: {
        title: "Create your account",
        chooseRole: "You are:",
        student: "Student",
        teacher: "Teacher",
        studentDesc: "Join games with a code",
        teacherDesc: "Create and host games",
        fullName: "Full name",
        email: "Email address",
        password: "Password (min. 6 characters)",
        submit: "Create my account",
        back: "Back",
        success: "Account created successfully!",
        errorEmail: "Invalid email",
        errorPassword: "Password must be at least 6 characters",
        errorEmpty: "Please fill in all fields",
        errorGeneric: "Something went wrong, please try again.",
      },
    },
  },
  ar: {
    translation: {
      nav: { home: "الرئيسية", games: "الألعاب", myGames: "ألعابي", leaderboard: "التصنيف", help: "المساعدة" },
      auth: { signIn: "تسجيل الدخول", createAccount: "إنشاء حساب", dashboard: "لوحة التحكم", logout: "تسجيل الخروج" },
      hero: {
        badge: "موسم جديد متاح",
        title1: "تعلّم. العب.",
        title2: "اربحوا معًا!",
        subtitle: "انضم إلى ملايين اللاعبين حول العالم وعش تجربة تعليمية ممتعة وتفاعلية.",
        players: "+2 مليون لاعب نشط",
      },
      join: {
        title: "أدخل رمز اللعبة من معلمك",
        subtitle: "اكتب الرمز المكون من 5 أرقام للانضمام إلى الغرفة المباشرة.",
        placeholder: "أدخل الرمز هنا",
        cta: "انضم إلى اللعبة",
        unique: "رمز فريد من 5 أرقام",
        validity: "صالح فقط للعبة جارية",
      },
      modes: {
        title: "أوضاع اللعب المتاحة", viewAll: "عرض الكل",
        classic: { t: "اختبار كلاسيكي", d: "أجب بشكل صحيح واكسب النقاط", p: "2 – 50 لاعبًا" },
        duel: { t: "مبارزة مباشرة", d: "تحدَّ أصدقاءك في الوقت الفعلي", p: "2 لاعبين" },
        race: { t: "سباق مع الوقت", d: "أجب بسرعة، اربح أكثر!", p: "2 – 30 لاعبًا" },
        puzzle: { t: "اختبار الأحجية", d: "أجب وأكمل الأحجية", p: "2 – 20 لاعبًا" },
        tf: { t: "صح أم خطأ", d: "أجب بصح أو خطأ بأسرع وقت", p: "2 – 50 لاعبًا" },
        survival: { t: "البقاء", d: "ابقَ حتى السؤال الأخير", p: "2 – 100 لاعب" },
      },
      footer: { tag: "تعلّم باللعب" },
      signup: {
        title: "أنشئ حسابك",
        chooseRole: "أنت:",
        student: "طالب",
        teacher: "معلم",
        studentDesc: "انضم إلى الألعاب باستخدام رمز",
        teacherDesc: "أنشئ وأدِر الألعاب",
        fullName: "الاسم الكامل",
        email: "البريد الإلكتروني",
        password: "كلمة المرور (6 أحرف على الأقل)",
        submit: "أنشئ حسابي",
        back: "رجوع",
        success: "تم إنشاء الحساب بنجاح!",
        errorEmail: "بريد إلكتروني غير صالح",
        errorPassword: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل",
        errorEmpty: "يرجى ملء جميع الحقول",
        errorGeneric: "حدث خطأ، يرجى المحاولة مرة أخرى.",
      },
    },
  },
};

const stored = typeof window !== "undefined" ? localStorage.getItem("spark_lang") : null;
const initialLang = stored && LANGS.some((l) => l.code === stored) ? stored : "fr";

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
});

export function setLang(code: string) {
  i18n.changeLanguage(code);
  if (typeof window !== "undefined") {
    localStorage.setItem("spark_lang", code);
    const lang = LANGS.find((l) => l.code === code);
    document.documentElement.lang = code;
    document.documentElement.dir = lang?.dir ?? "ltr";
  }
}

if (typeof window !== "undefined") {
  const lang = LANGS.find((l) => l.code === initialLang);
  document.documentElement.lang = initialLang;
  document.documentElement.dir = lang?.dir ?? "ltr";
}

export default i18n;
