import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const LANGS = [
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
] as const;

const fr = {
  nav: { home: "Accueil", games: "Jeux", myGames: "Mes jeux", leaderboard: "Classement", help: "Aide" },
  auth: { signIn: "Se connecter", createAccount: "Créer un compte", dashboard: "Tableau de bord", logout: "Déconnexion" },
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
    placeholder: "Entrez le code ici", cta: "Rejoindre la partie",
    unique: "Code unique à 5 chiffres", validity: "Valide uniquement pour une partie en cours",
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
    title: "Créer votre compte", chooseRole: "Vous êtes :",
    student: "Élève", teacher: "Enseignant",
    studentDesc: "Rejoignez des parties avec un code", teacherDesc: "Créez et animez vos parties",
    fullName: "Nom complet", email: "Adresse e-mail", password: "Mot de passe (min. 6 caractères)",
    submit: "Créer mon compte", back: "Retour",
    success: "Compte créé avec succès !",
    errorEmail: "E-mail invalide", errorPassword: "Le mot de passe doit contenir au moins 6 caractères",
    errorEmpty: "Veuillez remplir tous les champs", errorGeneric: "Une erreur est survenue, réessayez.",
  },
  games: {
    title: "Bibliothèque de quiz", subtitle: "Découvrez et jouez aux quiz créés par la communauté.",
    empty: "Aucun quiz public pour le moment.", by: "Par",
    questions: "questions", play: "Jouer ce quiz", login: "Connectez-vous pour héberger ce quiz",
    players: "joueurs", lesson: "Leçon", level: "Niveau",
  },
  categories: {
    all: "Tout", arabic: "Langue arabe", english: "Langue anglaise", social: "Études sociales",
    french: "Langue française", math: "Mathématiques", physics: "Physique", science: "Science", islamic: "Éducation islamique",
  },
  mygames: {
    title: "Mes quiz", subtitle: "Créez, modifiez et lancez vos quiz en direct.",
    create: "Créer un quiz", empty: "Vous n'avez pas encore de quiz.",
    edit: "Modifier", delete: "Supprimer", launch: "Lancer en direct",
    confirmDelete: "Supprimer ce quiz définitivement ?",
  },
  quizForm: {
    titleNew: "Nouveau quiz", titleEdit: "Modifier le quiz",
    name: "Titre du quiz", desc: "Description (facultatif)", category: "Catégorie",
    public: "Public (visible dans la bibliothèque)",
    addQuestion: "Ajouter une question", question: "Question",
    timeLimit: "Temps (s)", points: "Points", correct: "Bonne réponse",
    choice: "Choix", save: "Enregistrer", saving: "Enregistrement…",
    saved: "Quiz enregistré", needTitle: "Donnez un titre au quiz",
    needQuestion: "Ajoutez au moins une question", needCorrect: "Chaque question doit avoir une bonne réponse",
  },
  ranking: {
    title: "Classement", subtitle: "Les meilleurs joueurs et quiz de la semaine.",
    topPlayers: "Meilleurs joueurs", topQuizzes: "Quiz les plus joués",
    empty: "Aucune donnée pour l'instant.", xp: "XP",
  },
  help: {
    title: "Aide & À propos",
    subtitle: "Tout ce qu'il faut savoir pour bien démarrer avec SPARK.",
    missionTitle: "Notre mission",
    mission: "SPARK transforme l'apprentissage en jeu. Nous aidons enseignants et élèves à apprendre ensemble, plus vite et avec le sourire.",
    teacherTitle: "Pour les enseignants",
    teacher: "Créez vos quiz, animez des parties en direct, et suivez la progression de votre classe en temps réel.",
    studentTitle: "Pour les élèves",
    student: "Rejoignez une partie en un clic avec un code à 5 chiffres, gagnez des points et grimpez au classement.",
    guideTitle: "Guide rapide",
    g1: "L'enseignant crée un quiz et lance une partie.", g2: "Un code à 5 chiffres apparaît à l'écran.",
    g3: "Les élèves entrent le code sur la page d'accueil.", g4: "Tout le monde répond en temps réel !",
    faqTitle: "Questions fréquentes",
    q1: "Le code est-il vraiment unique ?", a1: "Oui. Chaque partie active a un code unique généré automatiquement.",
    q2: "Combien de joueurs par partie ?", a2: "Jusqu'à 100 joueurs simultanés selon le mode choisi.",
    q3: "L'élève doit-il créer un compte ?", a3: "Non, un simple pseudo suffit pour rejoindre une partie.",
  },
  play: {
    waitingTitle: "Salle d'attente", waitingFor: "En attente du lancement par l'enseignant…",
    playersConnected: "Joueurs connectés", leave: "Quitter la partie",
    choosePseudo: "Choisissez votre pseudo", visible: "Il sera visible des autres joueurs.",
    pseudoLen: "Pseudo entre 2 et 20 caractères", pseudoTaken: "Ce pseudo est déjà pris dans cette partie",
    joined: "Vous avez rejoint la partie !",
    invalidCode: "Code invalide", noRoom: "Aucune partie active n'a été trouvée pour le code",
    backHome: "Retour à l'accueil",
    started: "La partie a commencé !", getReady: "Préparez-vous, le quiz arrive…",
    question: "Question", correct: "Bonne réponse !", wrong: "Mauvaise réponse",
    timeLeft: "secondes", waitingNext: "En attente de la prochaine question…",
    leaderboard: "Classement", finalRanking: "Classement final", gameEnded: "Partie terminée",
    you: "Vous", points: "pts",
  },
  teacher: {
    selectQuiz: "Sélectionnez un quiz", noQuiz: "Aucun quiz disponible — créez-en un d'abord.",
    create: "Créer une partie", noActive: "Aucune partie en cours",
    pitch: "Lancez une nouvelle session de quiz en un clic.",
    gameCode: "Code de la partie", copy: "Copier le code",
    status: "Statut", waiting: "En attente", live: "En direct",
    start: "Lancer", end: "Terminer la partie", next: "Question suivante", showResults: "Voir les résultats", finish: "Terminer",
    players: "Joueurs", waitingPlayers: "En attente de joueurs…",
    needPlayers: "Ajoutez au moins un joueur pour lancer", roomCreated: "Partie créée — code",
    started: "Partie lancée !", ended: "Partie terminée",
  },
};

const en: typeof fr = {
  nav: { home: "Home", games: "Games", myGames: "My games", leaderboard: "Leaderboard", help: "Help" },
  auth: { signIn: "Sign in", createAccount: "Create account", dashboard: "Dashboard", logout: "Log out" },
  hero: {
    badge: "New season available", title1: "Learn. Play.", title2: "Win together!",
    subtitle: "Join millions of players around the world for a fun, interactive learning experience.",
    players: "+2M active players",
  },
  join: {
    title: "Enter the game code from your teacher", subtitle: "Type the 5-digit code to join the live room.",
    placeholder: "Enter the code here", cta: "Join the game",
    unique: "Unique 5-digit code", validity: "Valid only for an ongoing game",
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
    title: "Create your account", chooseRole: "You are:",
    student: "Student", teacher: "Teacher",
    studentDesc: "Join games with a code", teacherDesc: "Create and host games",
    fullName: "Full name", email: "Email address", password: "Password (min. 6 characters)",
    submit: "Create my account", back: "Back",
    success: "Account created successfully!",
    errorEmail: "Invalid email", errorPassword: "Password must be at least 6 characters",
    errorEmpty: "Please fill in all fields", errorGeneric: "Something went wrong, please try again.",
  },
  games: {
    title: "Quiz library", subtitle: "Discover and play quizzes from the community.",
    empty: "No public quiz yet.", by: "By",
    questions: "questions", play: "Host this quiz", login: "Sign in to host this quiz",
    players: "players", lesson: "Lesson", level: "Level",
  },
  categories: {
    all: "All", arabic: "Arabic Language", english: "English Language", social: "Social Studies",
    french: "French Language", math: "Mathematics", physics: "Physics", science: "Science", islamic: "Islamic Education",
  },
  mygames: {
    title: "My quizzes", subtitle: "Create, edit and launch your quizzes live.",
    create: "Create a quiz", empty: "You don't have any quiz yet.",
    edit: "Edit", delete: "Delete", launch: "Host live",
    confirmDelete: "Delete this quiz permanently?",
  },
  quizForm: {
    titleNew: "New quiz", titleEdit: "Edit quiz",
    name: "Quiz title", desc: "Description (optional)", category: "Category",
    public: "Public (visible in library)",
    addQuestion: "Add a question", question: "Question",
    timeLimit: "Time (s)", points: "Points", correct: "Correct",
    choice: "Choice", save: "Save", saving: "Saving…",
    saved: "Quiz saved", needTitle: "Give your quiz a title",
    needQuestion: "Add at least one question", needCorrect: "Each question must have a correct answer",
  },
  ranking: {
    title: "Leaderboard", subtitle: "Top players and quizzes of the week.",
    topPlayers: "Top players", topQuizzes: "Most played quizzes",
    empty: "No data yet.", xp: "XP",
  },
  help: {
    title: "Help & About", subtitle: "Everything you need to know to get started with SPARK.",
    missionTitle: "Our mission",
    mission: "SPARK turns learning into play. We help teachers and students learn together, faster and with a smile.",
    teacherTitle: "For teachers",
    teacher: "Create quizzes, host live games, and track your class progress in real time.",
    studentTitle: "For students",
    student: "Join a game in one click with a 5-digit code, earn points and climb the leaderboard.",
    guideTitle: "Quick guide",
    g1: "The teacher creates a quiz and launches a game.", g2: "A 5-digit code appears on screen.",
    g3: "Students enter the code on the home page.", g4: "Everyone answers in real time!",
    faqTitle: "Frequently asked questions",
    q1: "Is the code really unique?", a1: "Yes. Each active game has a unique code generated automatically.",
    q2: "How many players per game?", a2: "Up to 100 simultaneous players depending on the chosen mode.",
    q3: "Do students need an account?", a3: "No, a simple nickname is enough to join a game.",
  },
  play: {
    waitingTitle: "Waiting room", waitingFor: "Waiting for the teacher to start…",
    playersConnected: "Connected players", leave: "Leave the game",
    choosePseudo: "Choose your nickname", visible: "It will be visible to other players.",
    pseudoLen: "Nickname between 2 and 20 characters", pseudoTaken: "This nickname is already taken in this game",
    joined: "You joined the game!",
    invalidCode: "Invalid code", noRoom: "No active game found for the code",
    backHome: "Back to home",
    started: "The game has started!", getReady: "Get ready, the quiz is coming…",
    question: "Question", correct: "Correct answer!", wrong: "Wrong answer",
    timeLeft: "seconds", waitingNext: "Waiting for the next question…",
    leaderboard: "Leaderboard", finalRanking: "Final ranking", gameEnded: "Game over",
    you: "You", points: "pts",
  },
  teacher: {
    selectQuiz: "Select a quiz", noQuiz: "No quiz available — create one first.",
    create: "Create a game", noActive: "No game in progress",
    pitch: "Start a new quiz session in one click.",
    gameCode: "Game code", copy: "Copy code",
    status: "Status", waiting: "Waiting", live: "Live",
    start: "Start", end: "End game", next: "Next question", showResults: "Show results", finish: "Finish",
    players: "Players", waitingPlayers: "Waiting for players…",
    needPlayers: "Add at least one player to start", roomCreated: "Game created — code",
    started: "Game started!", ended: "Game ended",
  },
};

const ar: typeof fr = {
  nav: { home: "الرئيسية", games: "الألعاب", myGames: "ألعابي", leaderboard: "التصنيف", help: "المساعدة" },
  auth: { signIn: "تسجيل الدخول", createAccount: "إنشاء حساب", dashboard: "لوحة التحكم", logout: "تسجيل الخروج" },
  hero: {
    badge: "موسم جديد متاح", title1: "تعلّم. العب.", title2: "اربحوا معًا!",
    subtitle: "انضم إلى ملايين اللاعبين حول العالم وعش تجربة تعليمية ممتعة وتفاعلية.",
    players: "+2 مليون لاعب نشط",
  },
  join: {
    title: "أدخل رمز اللعبة من معلمك", subtitle: "اكتب الرمز المكون من 5 أرقام للانضمام إلى الغرفة المباشرة.",
    placeholder: "أدخل الرمز هنا", cta: "انضم إلى اللعبة",
    unique: "رمز فريد من 5 أرقام", validity: "صالح فقط للعبة جارية",
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
    title: "أنشئ حسابك", chooseRole: "أنت:",
    student: "طالب", teacher: "معلم",
    studentDesc: "انضم إلى الألعاب باستخدام رمز", teacherDesc: "أنشئ وأدِر الألعاب",
    fullName: "الاسم الكامل", email: "البريد الإلكتروني", password: "كلمة المرور (6 أحرف على الأقل)",
    submit: "أنشئ حسابي", back: "رجوع", success: "تم إنشاء الحساب بنجاح!",
    errorEmail: "بريد إلكتروني غير صالح", errorPassword: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل",
    errorEmpty: "يرجى ملء جميع الحقول", errorGeneric: "حدث خطأ، يرجى المحاولة مرة أخرى.",
  },
  games: {
    title: "مكتبة الاختبارات", subtitle: "اكتشف والعب اختبارات المجتمع.",
    empty: "لا يوجد اختبار عام بعد.", by: "بواسطة",
    questions: "أسئلة", play: "استضف هذا الاختبار", login: "سجّل الدخول لاستضافة هذا الاختبار",
    players: "لاعبين", lesson: "الدرس", level: "المستوى",
  },
  categories: {
    all: "الكل", arabic: "اللغة العربية", english: "اللغة الإنجليزية", social: "الدراسات الاجتماعية",
    french: "اللغة الفرنسية", math: "الرياضيات", physics: "الفيزياء", science: "العلوم", islamic: "التربية الإسلامية",
  },
  mygames: {
    title: "اختباراتي", subtitle: "أنشئ، عدّل، وأطلق اختباراتك مباشرة.",
    create: "إنشاء اختبار", empty: "ليس لديك أي اختبار بعد.",
    edit: "تعديل", delete: "حذف", launch: "بث مباشر",
    confirmDelete: "حذف هذا الاختبار نهائيًا؟",
  },
  quizForm: {
    titleNew: "اختبار جديد", titleEdit: "تعديل الاختبار",
    name: "عنوان الاختبار", desc: "الوصف (اختياري)", category: "الفئة",
    public: "عام (مرئي في المكتبة)",
    addQuestion: "إضافة سؤال", question: "سؤال",
    timeLimit: "الوقت (ث)", points: "نقاط", correct: "إجابة صحيحة",
    choice: "خيار", save: "حفظ", saving: "جارٍ الحفظ…",
    saved: "تم حفظ الاختبار", needTitle: "أعطِ الاختبار عنوانًا",
    needQuestion: "أضف سؤالًا واحدًا على الأقل", needCorrect: "يجب أن يحتوي كل سؤال على إجابة صحيحة",
  },
  ranking: {
    title: "التصنيف", subtitle: "أفضل اللاعبين والاختبارات لهذا الأسبوع.",
    topPlayers: "أفضل اللاعبين", topQuizzes: "الاختبارات الأكثر لعبًا",
    empty: "لا توجد بيانات بعد.", xp: "خبرة",
  },
  help: {
    title: "المساعدة وعن المنصة", subtitle: "كل ما تحتاج معرفته للبدء مع SPARK.",
    missionTitle: "مهمتنا",
    mission: "SPARK تحوّل التعلّم إلى لعبة. نساعد المعلمين والطلاب على التعلّم معًا، بشكل أسرع وبابتسامة.",
    teacherTitle: "للمعلمين", teacher: "أنشئ اختبارات، استضف ألعابًا مباشرة، وتابع تقدم صفك في الوقت الفعلي.",
    studentTitle: "للطلاب", student: "انضم إلى لعبة بنقرة واحدة باستخدام رمز من 5 أرقام، اكسب النقاط وتسلّق التصنيف.",
    guideTitle: "دليل سريع",
    g1: "يقوم المعلم بإنشاء اختبار وإطلاق اللعبة.", g2: "يظهر رمز من 5 أرقام على الشاشة.",
    g3: "يدخل الطلاب الرمز في الصفحة الرئيسية.", g4: "يجيب الجميع في الوقت الفعلي!",
    faqTitle: "الأسئلة الشائعة",
    q1: "هل الرمز فريد حقًا؟", a1: "نعم. لكل لعبة نشطة رمز فريد يتم إنشاؤه تلقائيًا.",
    q2: "كم عدد اللاعبين لكل لعبة؟", a2: "حتى 100 لاعب متزامن حسب الوضع المختار.",
    q3: "هل يحتاج الطالب إلى حساب؟", a3: "لا، يكفي اسم مستعار بسيط للانضمام إلى لعبة.",
  },
  play: {
    waitingTitle: "غرفة الانتظار", waitingFor: "في انتظار بدء المعلم…",
    playersConnected: "اللاعبون المتصلون", leave: "مغادرة اللعبة",
    choosePseudo: "اختر اسمك المستعار", visible: "سيكون مرئيًا للاعبين الآخرين.",
    pseudoLen: "الاسم بين 2 و20 حرفًا", pseudoTaken: "هذا الاسم مأخوذ بالفعل في هذه اللعبة",
    joined: "لقد انضممت إلى اللعبة!",
    invalidCode: "رمز غير صالح", noRoom: "لا توجد لعبة نشطة للرمز",
    backHome: "العودة إلى الرئيسية",
    started: "بدأت اللعبة!", getReady: "استعد، الاختبار قادم…",
    question: "سؤال", correct: "إجابة صحيحة!", wrong: "إجابة خاطئة",
    timeLeft: "ثوانٍ", waitingNext: "في انتظار السؤال التالي…",
    leaderboard: "التصنيف", finalRanking: "التصنيف النهائي", gameEnded: "انتهت اللعبة",
    you: "أنت", points: "نقطة",
  },
  teacher: {
    selectQuiz: "اختر اختبارًا", noQuiz: "لا يوجد اختبار — أنشئ واحدًا أولاً.",
    create: "إنشاء لعبة", noActive: "لا توجد لعبة جارية",
    pitch: "ابدأ جلسة اختبار جديدة بنقرة واحدة.",
    gameCode: "رمز اللعبة", copy: "نسخ الرمز",
    status: "الحالة", waiting: "في الانتظار", live: "مباشر",
    start: "بدء", end: "إنهاء اللعبة", next: "السؤال التالي", showResults: "عرض النتائج", finish: "إنهاء",
    players: "اللاعبون", waitingPlayers: "في انتظار اللاعبين…",
    needPlayers: "أضف لاعبًا واحدًا على الأقل للبدء", roomCreated: "تم إنشاء اللعبة — الرمز",
    started: "بدأت اللعبة!", ended: "انتهت اللعبة",
  },
};

const resources = { fr: { translation: fr }, en: { translation: en }, ar: { translation: ar } };

// Always initialize with "fr" to match SSR and prevent hydration mismatch.
i18n.use(initReactI18next).init({ resources, lng: "fr", fallbackLng: "fr", interpolation: { escapeValue: false } });

export function setLang(code: string) {
  i18n.changeLanguage(code);
  if (typeof window !== "undefined") {
    localStorage.setItem("spark_lang", code);
    const lang = LANGS.find((l) => l.code === code);
    document.documentElement.lang = code;
    document.documentElement.dir = lang?.dir ?? "ltr";
  }
}

// Restore stored language — call from a useEffect in the root after hydration.
export function restoreStoredLang() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem("spark_lang");
  if (stored && LANGS.some((l) => l.code === stored) && stored !== i18n.language) {
    setLang(stored);
  }
}

export default i18n;
