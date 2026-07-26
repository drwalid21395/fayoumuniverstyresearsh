/**
 * ============================================================
 *  Graduate Studies – Faculty of Sports Science
 *  Admin Dashboard JavaScript
 *  Arabic RTL | localStorage as DB
 * ============================================================
 */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     0. CONSTANTS & HELPERS
  ---------------------------------------------------------- */
  const STORAGE_KEYS = {
    applications: "gs_applications",
    documents: "gs_documents",
    theme: "gs_theme",
    notifications: "gs_notifications",
    committees: "gs_committees",
    scholarships: "gs_scholarships",
    staffUser: "gs_staff_user",
  };

  var GSCRIPT_URL = "https://script.google.com/macros/s/AKfycbxGLjz6_BOjM89e-hSvSx5iK9cQjZg6gWvoDXhyztmuewtknXvp3dMJBElnuhho8Wo/exec";

  var ROLE_LABELS = { admin: "مدير النظام", employee: "موظف", vice_dean: "وكيل الكلية" };
  var ROLE_ICONS = { admin: "fas fa-crown", employee: "fas fa-user-tie", vice_dean: "fas fa-user-shield" };
  var ROLE_COLORS = { admin: "background:linear-gradient(135deg,#e53935,#c62828)", employee: "background:linear-gradient(135deg,#1a73e8,#1557b0)", vice_dean: "background:linear-gradient(135deg,#ff6d00,#c43e00)" };

  var PERM_LABELS = {
    upload_pdfs: "تحميل ملفات PDF",
    download_excel: "تحميل ملف Excel",
    view_excel: "عرض ملف Excel",
    view_pdfs: "عرض ملفات PDF",
    view_messages: "عرض الرسائل",
    reply_messages: "الرد على الرسائل",
    generate_reports: "إصدار تقارير",
    manage_users: "إدارة المستخدمين"
  };

  var PERM_ICONS = {
    upload_pdfs: "fas fa-upload",
    download_excel: "fas fa-file-excel",
    view_excel: "fas fa-eye",
    view_pdfs: "fas fa-file-pdf",
    view_messages: "fas fa-envelope",
    reply_messages: "fas fa-reply",
    generate_reports: "fas fa-chart-bar",
    manage_users: "fas fa-user-shield"
  };

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function escapeHTML(str) {
    if (str == null) return "";
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  }

  function formatDateTime(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  /* ----------------------------------------------------------
     1. DATA LAYER (localStorage CRUD)
  ---------------------------------------------------------- */
  function getApplications() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.applications)) || [];
    } catch {
      return [];
    }
  }

  function getApplicationById(id) {
    return getApplications().find(function (a) {
      return a.id === id;
    }) || null;
  }

  function saveApplications(apps) {
    localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(apps));
  }

  function updateApplicationStatus(id, status) {
    var apps = getApplications();
    var app = apps.find(function (a) {
      return a.id === id;
    });
    if (app) {
      app.status = status;
      app.updatedAt = new Date().toISOString();
      saveApplications(apps);
    }
    return app || null;
  }

  function generateApplicationNumber() {
    var apps = getApplications();
    var year = new Date().getFullYear();
    var next = String(apps.length + 1).padStart(4, "0");
    return "GS-" + year + "-" + next;
  }

  function getNotifications() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.notifications)) || [];
    } catch {
      return [];
    }
  }

  function saveNotifications(notifs) {
    localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifs));
  }

  function getCommittees() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.committees));
    } catch {
      return null;
    }
  }

  function saveCommittees(data) {
    localStorage.setItem(STORAGE_KEYS.committees, JSON.stringify(data));
  }

  function getScholarshipsData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.scholarships));
    } catch {
      return null;
    }
  }

  function saveScholarshipsData(data) {
    localStorage.setItem(STORAGE_KEYS.scholarships, JSON.stringify(data));
  }

  /* ----------------------------------------------------------
     2. STATUS HELPERS
  ---------------------------------------------------------- */
  var STATUS_MAP = {
    pending: { label: "قيد الانتظار", color: "pending", icon: "fas fa-clock" },
    registration: { label: "مرحلة التسجيل", color: "registration", icon: "fas fa-file-alt" },
    formation: { label: "مرحلة التشكيل", color: "formation", icon: "fas fa-users" },
    degree: { label: "منح الدرجة", color: "accepted", icon: "fas fa-graduation-cap" },
  };

  var PROGRAM_MAP = {
    masters: "ماجستير",
    phd: "دكتوراه",
  };

  var SPECIALIZATION_MAP = {
    physical_education: "التربية الرياضية",
    sports_coaching: "التدريب الرياضي",
    sports_management: "الإدارة الرياضية",
    sports_health: "العلوم الرياضية الصحية",
    sports_psychology: "علم النفس الرياضي",
    sports_nutrition: "التغذية الرياضية",
    exercise_physiology: "فيزيولوجيا التدريب",
    sports_sociology: "علم الاجتماع الرياضي",
  };

  function getStatusBadge(status) {
    var s = STATUS_MAP[status] || STATUS_MAP.pending;
    return (
      '<span class="admin-status-badge status-' +
      s.color +
      '"><i class="' +
      s.icon +
      '"></i> ' +
      escapeHTML(s.label) +
      "</span>"
    );
  }

  function getProgramLabel(val) {
    return PROGRAM_MAP[val] || val || "—";
  }

  function getSpecializationLabel(val) {
    return SPECIALIZATION_MAP[val] || val || "—";
  }

  /* ----------------------------------------------------------
     3. INITIAL SAMPLE DATA
  ---------------------------------------------------------- */
  function initSampleData() {
    if (getApplications().length > 0) return;

    var sampleApps = [
      {
        id: generateId(),
        applicationNumber: "GS-2026-0001",
        fullNameAr: "عبدالله بن أحمد الراشد",
        fullNameEn: "Abdullah bin Ahmed Al-Rashid",
        nationalId: "1098765432",
        birthDate: "1995-03-15",
        nationality: "SA",
        gender: "male",
        phone: "0551234567",
        email: "abdullah.rashid@email.com",
        address: "الرياض - حي النزهة - شارع الأمير سلطان",
        bachelorDegree: "بكالوريوس التربية الرياضية",
        bachelorUniversity: "جامعة الملك سعود",
        bachelorYear: "2020",
        bachelorGrade: "veryGood",
        hasMasters: "no",
        experience: "عمل كمدرب رياضي في نادي الاتحاد لمدة سنتين",
        publications: "بحث عن تأثير التدريب_INTERVAL على لاعبي كرة القدم",
        programType: "masters",
        programName: "physical_education",
        studyMode: "fulltime",
        semester: "fall",
        researchTopic: "تأثير البرامج التدريبية على اللياقة البدنية ل cầu كرة القدم",
        supervisor: "د. أحمد العلي",
        programNotes: "",
        status: "registration",
        submittedAt: "2026-01-10T09:00:00.000Z",
        updatedAt: null,
      },
      {
        id: generateId(),
        applicationNumber: "GS-2026-0002",
        fullNameAr: "نورة بنت خالد المطيري",
        fullNameEn: "Noura bin Khalid Al-Mutairi",
        nationalId: "1087654321",
        birthDate: "1997-07-22",
        nationality: "SA",
        gender: "female",
        phone: "0567891234",
        email: "noura.mutairi@email.com",
        address: "جدة - حي الروضة",
        bachelorDegree: "بكالوريوس الطب الرياضي",
        bachelorUniversity: "جامعة الملك عبدالعزيز",
        bachelorYear: "2022",
        bachelorGrade: "excellent",
        hasMasters: "yes",
        mastersDegree: "ماجستير العلاج الطبيعي",
        mastersUniversity: "جامعة الملك سعود",
        mastersYear: "2024",
        mastersGrade: "excellent",
        experience: "عملت في العيادة الرياضية بمستشفى الملك فيصل التخصصي لمدة سنة",
        publications: "",
        programType: "phd",
        programName: "sports_health",
        studyMode: "fulltime",
        semester: "fall",
        researchTopic: "فعالية البرامج العلاجية في علاج إصابات الركبة لدى الرياضيين",
        supervisor: "د. فاطمة العتيبي",
        programNotes: "أرغب في التركيز على إصابات المفاصل",
        status: "degree",
        submittedAt: "2026-01-05T14:30:00.000Z",
        updatedAt: "2026-01-20T10:00:00.000Z",
      },
      {
        id: generateId(),
        applicationNumber: "GS-2026-0003",
        fullNameAr: "محمد بن سعيد القحطاني",
        fullNameEn: "Mohammed bin Saeed Al-Qahtani",
        nationalId: "1076543210",
        birthDate: "1993-11-08",
        nationality: "SA",
        gender: "male",
        phone: "0543216789",
        email: "mohammed.qahtani@email.com",
        address: "الدمام - حي الفيصلية",
        bachelorDegree: "بكالوريوس الإدارة الرياضية",
        bachelorUniversity: "جامعة الإمام محمد بن سعود",
        bachelorYear: "2019",
        bachelorGrade: "veryGood",
        hasMasters: "yes",
        mastersDegree: "ماجستير الإدارة الرياضية",
        mastersUniversity: "جامعة الملك سعود",
        mastersYear: "2022",
        mastersGrade: "veryGood",
        experience: "مدير إدارة التدريب في الهيئة العامة للرياضة - 3 سنوات",
        publications: "دراسة عن أثر الإدارة الاستراتيجية على أداء الأندية الرياضية",
        programType: "phd",
        programName: "sports_management",
        studyMode: "parttime",
        semester: "fall",
        researchTopic: "القيادة التحولية في المؤسسات الرياضية وتأثيرها على الأداء",
        supervisor: "د. خالد السبيعي",
        programNotes: "أعمل في الهيئة العامة للرياضة وأريد الاستمرار بالعمل",
        status: "formation",
        submittedAt: "2026-01-15T11:15:00.000Z",
        updatedAt: "2026-01-25T08:30:00.000Z",
      },
      {
        id: generateId(),
        applicationNumber: "GS-2026-0004",
        fullNameAr: "سارة بنت عبدالرحمن العتيبي",
        fullNameEn: "Sara bin Abdulrahman Al-Otaibi",
        nationalId: "1065432109",
        birthDate: "1998-02-14",
        nationality: "SA",
        gender: "female",
        phone: "0532167890",
        email: "sara.otaibi@email.com",
        address: "الرياض - حي الملقا",
        bachelorDegree: "بكالوريوس علم النفس",
        bachelorUniversity: "جامعة الملك سعود",
        bachelorYear: "2023",
        bachelorGrade: "excellent",
        hasMasters: "no",
        experience: "عملت كمرشدة طلابية في جامعة الملك سعود لمدة سنة",
        publications: "",
        programType: "masters",
        programName: "sports_psychology",
        studyMode: "fulltime",
        semester: "fall",
        researchTopic: "الذكاء العاطفي وعلاقته بالأداء الرياضي لدى لاعبي المنتخب",
        supervisor: "",
        programNotes: "",
        status: "formation",
        submittedAt: "2026-01-20T16:45:00.000Z",
        updatedAt: "2026-02-01T09:00:00.000Z",
      },
      {
        id: generateId(),
        applicationNumber: "GS-2026-0005",
        fullNameAr: "خالد بن محمد الزهراني",
        fullNameEn: "Khalid bin Mohammed Al-Zahrani",
        nationalId: "1054321098",
        birthDate: "1994-06-30",
        nationality: "SA",
        gender: "male",
        phone: "0521098765",
        email: "khalid.zahrani@email.com",
        address: "مكة المكرمة - حي العزيزية",
        bachelorDegree: "بكالوريوس التدريب الرياضي",
        bachelorUniversity: "جامعة أم القرى",
        bachelorYear: "2021",
        bachelorGrade: "veryGood",
        hasMasters: "yes",
        mastersDegree: "ماجستير التدريب الرياضي",
        mastersUniversity: "جامعة الملك سعود",
        mastersYear: "2024",
        mastersGrade: "excellent",
        experience: "مدرب فريق كرة قدم في نادي الوحدة - سنتين",
        publications: "بحث عن تأثير التدريب المقاوم على القوة العضلية",
        programType: "phd",
        programName: "sports_coaching",
        studyMode: "fulltime",
        semester: "spring",
        researchTopic: "تطوير برامج التدريب المعاصرة باستخدام تحليل البيانات الضخمة",
        supervisor: "د. عبدالله الزهراني",
        programNotes: "لدي خبرة عملية كبيرة في التدريب",
        status: "registration",
        submittedAt: "2026-02-01T08:00:00.000Z",
        updatedAt: null,
      },
      {
        id: generateId(),
        applicationNumber: "GS-2026-0006",
        fullNameAr: "فاطمة بنت حسين العنزي",
        fullNameEn: "Fatima bin Hussein Al-Enazi",
        nationalId: "1043210987",
        birthDate: "1996-09-12",
        nationality: "KW",
        gender: "female",
        phone: "0510987654",
        email: "fatima.enazi@email.com",
        address: "الرياض - حي الصحافة",
        bachelorDegree: "بكالوريوس التغذية العلاجية",
        bachelorUniversity: "جامعة الكويت",
        bachelorYear: "2022",
        bachelorGrade: "excellent",
        hasMasters: "yes",
        mastersDegree: "ماجستير التغذية الرياضية",
        mastersUniversity: "جامعة الملك سعود",
        mastersYear: "2025",
        mastersGrade: "excellent",
        experience: "أخصائية تغذية في نادي الكويت الرياضي - سنة",
        publications: "دراسة عن تأثير الحمية الغذائية على أداء العدائين",
        programType: "phd",
        programName: "sports_nutrition",
        studyMode: "fulltime",
        semester: "fall",
        researchTopic: "دور التغذية الاستراتيجية في تحسين القدرة الهوائية لدى الرياضيين",
        supervisor: "د. نورة القحطاني",
        programNotes: "أريد التركيز على التغذية الرياضية للمرأة",
        status: "formation",
        submittedAt: "2026-01-25T13:20:00.000Z",
        updatedAt: "2026-02-05T11:00:00.000Z",
      },
      {
        id: generateId(),
        applicationNumber: "GS-2026-0007",
        fullNameAr: "عبدالعزيز بن فهد السبيعي",
        fullNameEn: "Abdulaziz bin Fahd Al-Subaie",
        nationalId: "1032109876",
        birthDate: "1992-04-05",
        nationality: "SA",
        gender: "male",
        phone: "0509876543",
        email: "aziz.subaie@email.com",
        address: "الخبر - حي العليا",
        bachelorDegree: "بكالوريوس التربية الرياضية",
        bachelorUniversity: "جامعة الملك فيصل",
        bachelorYear: "2018",
        bachelorGrade: "good",
        hasMasters: "no",
        experience: "معلم تربية رياضية في مدرسة ثانوية - 5 سنوات",
        publications: "",
        programType: "masters",
        programName: "physical_education",
        studyMode: "evening",
        semester: "fall",
        researchTopic: "تأثير استخدام التكنولوجيا في تعليم التربية الرياضية",
        supervisor: "",
        programNotes: "أعمل معلماً وأريد الدراسة المسائية",
        status: "degree",
        submittedAt: "2026-01-08T10:30:00.000Z",
        updatedAt: "2026-01-28T14:00:00.000Z",
      },
      {
        id: generateId(),
        applicationNumber: "GS-2026-0008",
        fullNameAr: "ريم بنت سعود الحربي",
        fullNameEn: "Reem bin Saud Al-Harbi",
        nationalId: "1021098765",
        birthDate: "1999-12-01",
        nationality: "SA",
        gender: "female",
        phone: "0598765432",
        email: "reem.harbi@email.com",
        address: "المدينة المنورة - حي قباء",
        bachelorDegree: "بكالوريوس علم الاجتماع الرياضي",
        bachelorUniversity: "جامعة طيبة",
        bachelorYear: "2024",
        bachelorGrade: "veryGood",
        hasMasters: "no",
        experience: "تطوعت في إدارة الأنشطة الرياضية بجامعة طيبة",
        publications: "",
        programType: "masters",
        programName: "sports_management",
        studyMode: "fulltime",
        semester: "spring",
        researchTopic: "دور الرياضة في تمكين المرأة في المجتمع السعودي",
        supervisor: "",
        programNotes: "",
        status: "registration",
        submittedAt: "2026-02-10T09:45:00.000Z",
        updatedAt: null,
      },
      {
        id: generateId(),
        applicationNumber: "GS-2026-0009",
        fullNameAr: "ياسر بن ناصر الدوسري",
        fullNameEn: "Yasser bin Nasser Al-Dosari",
        nationalId: "1010987654",
        birthDate: "1991-08-18",
        nationality: "SA",
        gender: "male",
        phone: "0587654321",
        email: "yasser.dosari@email.com",
        address: "الرياض - حي النسيم",
        bachelorDegree: "بكالوريوس فيزيولوجيا التدريب",
        bachelorUniversity: "جامعة الملك سعود",
        bachelorYear: "2017",
        bachelorGrade: "excellent",
        hasMasters: "yes",
        mastersDegree: "ماجستير العلوم الرياضية",
        mastersUniversity: "جامعة ولاية فلوريدا",
        mastersYear: "2020",
        mastersGrade: "excellent",
        experience: "باحث مساعد في مركز البحث العلمي بجامعة الملك سعود - 4 سنوات",
        publications: "5 أبحاث منشورة في مجلات محكمة دولية",
        programType: "phd",
        programName: "sports_sciences",
        studyMode: "fulltime",
        semester: "fall",
        researchTopic: "الgeberetics الرياضية والأداء البدني: دراسة على الرياضيين المحترفين",
        supervisor: "د. عبدالله الزهراني",
        programNotes: "لدي خبرة بحثية واسعة وأبحث عن برنامج يدعم البحث المتقدم",
        status: "degree",
        submittedAt: "2025-12-20T08:00:00.000Z",
        updatedAt: "2026-01-15T12:00:00.000Z",
      },
      {
        id: generateId(),
        applicationNumber: "GS-2026-0010",
        fullNameAr: "هند بنت ماجد الشمري",
        fullNameEn: "Hind bin Majed Al-Shammari",
        nationalId: "1009876543",
        birthDate: "1997-01-25",
        nationality: "SA",
        gender: "female",
        phone: "0576543210",
        email: "hind.shammari@email.com",
        address: "أبها - حي العمرة",
        bachelorDegree: "بكالوريوس التربية الرياضية",
        bachelorUniversity: "جامعة الملك خالد",
        bachelorYear: "2023",
        bachelorGrade: "excellent",
        hasMasters: "no",
        experience: "مدربة كرة سلة في نادي الأمل النسائي",
        publications: "",
        programType: "masters",
        programName: "physical_education",
        studyMode: "fulltime",
        semester: "fall",
        researchTopic: "تأثير البرامج التدريبية على المهارات الأساسية في كرة السلة",
        supervisor: "",
        programNotes: "أريد التخصص في كرة السلة",
        status: "formation",
        submittedAt: "2026-02-05T15:10:00.000Z",
        updatedAt: "2026-02-10T09:00:00.000Z",
      },
    ];

    saveApplications(sampleApps);
    initSampleNotifications(sampleApps);
  }

  function initSampleNotifications(apps) {
    var notifications = [
      {
        id: generateId(),
        title: "طلب جديد",
        message: "تم استلام طلب جديد من عبدالله الراشد برقم " + (apps[0] ? apps[0].applicationNumber : "GS-2026-0001"),
        type: "info",
        read: false,
        createdAt: "2026-01-10T09:00:00.000Z",
      },
      {
        id: generateId(),
        title: "قرار قبول",
        message: "تم قبول طلب نورة المطيري برقم " + (apps[1] ? apps[1].applicationNumber : "GS-2026-0002"),
        type: "success",
        read: false,
        createdAt: "2026-01-20T10:00:00.000Z",
      },
      {
        id: generateId(),
        title: "طلب قيد المراجعة",
        message: "تم تحويل طلب محمد القحطاني إلى المراجعة الأكاديمية",
        type: "info",
        read: true,
        createdAt: "2026-01-25T08:30:00.000Z",
      },
      {
        id: generateId(),
        title: "رفض طلب",
        message: "تم رفض طلب سارة العتيبي - لا يستوفي الشروط المطلوبة",
        type: "warning",
        read: false,
        createdAt: "2026-02-01T09:00:00.000Z",
      },
      {
        id: generateId(),
        title: "تذكير",
        message: "يوجد 3 طلبات بانتظار المراجعة الأولية",
        type: "info",
        read: true,
        createdAt: "2026-02-05T08:00:00.000Z",
      },
    ];
    saveNotifications(notifications);
  }

  /* ----------------------------------------------------------
     4. SIDEBAR TOGGLE
  ---------------------------------------------------------- */
  function initSidebar() {
    var hamburger = $("#sidebarToggle");
    var sidebar = $("#adminSidebar");
    var overlay = $("#sidebarOverlay");

    if (!hamburger || !sidebar) return;

    hamburger.addEventListener("click", function (e) {
      e.stopPropagation();
      sidebar.classList.toggle("mobile-open");
      if (overlay) overlay.classList.toggle("show");
    });

    if (overlay) {
      overlay.addEventListener("click", function () {
        sidebar.classList.remove("mobile-open");
        overlay.classList.remove("show");
      });
    }

    document.addEventListener("click", function (e) {
      if (
        sidebar.classList.contains("mobile-open") &&
        !sidebar.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        sidebar.classList.remove("mobile-open");
        if (overlay) overlay.classList.remove("show");
      }
    });
  }

  /* ----------------------------------------------------------
     5. VIEW SWITCHING
  ---------------------------------------------------------- */
  var currentView = "dashboard";

  function showView(viewName) {
    var views = $$(".view-section");
    var navItems = $$(".sidebar-nav a[data-view]");

    views.forEach(function (v) {
      v.classList.remove("active");
    });

    navItems.forEach(function (item) {
      item.classList.remove("active");
    });

    var target = document.getElementById("view-" + viewName);
    if (target) target.classList.add("active");

    var activeNav = $(".sidebar-nav a[data-view='" + viewName + "']");
    if (activeNav) activeNav.classList.add("active");

    currentView = viewName;

    if (viewName === "documents" && typeof window.loadDocuments === "function") {
      window.loadDocuments();
    }
    if (viewName === "dashboard") loadDashboard();
    if (viewName === "applications") loadApplicationsFromSheet();
    if (viewName === "admin-messages") loadAdminMessages();

    var sidebar = $("#adminSidebar");
    var overlay = $("#sidebarOverlay");
    if (sidebar) sidebar.classList.remove("mobile-open");
    if (overlay) overlay.classList.remove("show");
  }

  window.showView = showView;
  window.switchView = function (viewName, el) {
    showView(viewName);
    if (el) {
      $$(".sidebar-nav a[data-view]").forEach(function(a){a.classList.remove("active")});
      el.classList.add("active");
    }
  };

  function initNavigation() {
    var navItems = $$(".sidebar-nav a[data-view]");
    navItems.forEach(function (item) {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        var view = item.getAttribute("data-view");
        if (view) showView(view);
      });
    });
  }

  /* ----------------------------------------------------------
     6. DASHBOARD STATS
  ---------------------------------------------------------- */
  function renderDashboard() {
    var apps = getApplications();
    var total = apps.length;
    var registration = apps.filter(function (a) {
      return a.status === "registration";
    }).length;
    var formation = apps.filter(function (a) {
      return a.status === "formation";
    }).length;
    var degree = apps.filter(function (a) {
      return a.status === "degree";
    }).length;
    var masters = apps.filter(function (a) {
      return a.programType === "masters";
    }).length;
    var phd = apps.filter(function (a) {
      return a.programType === "phd";
    }).length;

    var totalEl = $("#stat-total");
    var pendingEl = $("#stat-pending");
    var reviewEl = $("#stat-review");
    var acceptedEl = $("#stat-accepted");
    var rejectedEl = $("#stat-rejected");
    var mastersEl = $("#stat-masters");
    var phdEl = $("#stat-phd");

    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = registration;
    if (reviewEl) reviewEl.textContent = formation;
    if (acceptedEl) acceptedEl.textContent = degree;
    if (rejectedEl) rejectedEl.textContent = 0;
    if (mastersEl) mastersEl.textContent = masters;
    if (phdEl) phdEl.textContent = phd;

    renderRecentActivities(apps);
  }

  function renderRecentActivities(apps) {
    var container = $("#recent-activities");
    if (!container) return;

    var sorted = apps
      .slice()
      .sort(function (a, b) {
        return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
      })
      .slice(0, 8);

    if (sorted.length === 0) {
      container.innerHTML = '<div class="admin-empty">لا توجد أنشطة حديثة</div>';
      return;
    }

    container.innerHTML = sorted
      .map(function (app) {
        var icon = "fas fa-file-alt";
        var colorClass = "info";
        var action = "تقديم طلب جديد";

        if (app.status === "degree") {
          icon = "fas fa-check-circle";
          colorClass = "success";
          action = "تم القبول";
        } else if (app.status === "rejected") {
          icon = "fas fa-times-circle";
          colorClass = "danger";
          action = "تم الرفض";
        } else if (app.status === "under_review") {
          icon = "fas fa-search";
          colorClass = "warning";
          action = "قيد المراجعة";
        }

        return (
          '<div class="admin-activity-item">' +
          '<div class="activity-icon ' + colorClass + '"><i class="' + icon + '"></i></div>' +
          '<div class="activity-content">' +
          '<div class="activity-title">' + escapeHTML(app.fullNameAr || "غير محدد") + '</div>' +
          '<div class="activity-desc">' + escapeHTML(action) + " — " + escapeHTML(app.applicationNumber || "") + '</div>' +
          '</div>' +
          '<div class="activity-date">' + formatDate(app.updatedAt || app.submittedAt) + '</div>' +
          '</div>'
        );
      })
      .join("");
  }

  /* ----------------------------------------------------------
     7. APPLICATIONS TABLE
  ---------------------------------------------------------- */
  var appTableState = {
    searchTerm: "",
    statusFilter: "all",
    programFilter: "all",
    sortField: "submittedAt",
    sortDir: "desc",
    currentPage: 1,
    perPage: 10,
  };

  function getFilteredApplications() {
    var apps = getApplications();
    var state = appTableState;

    if (state.statusFilter !== "all") {
      apps = apps.filter(function (a) {
        return a.status === state.statusFilter;
      });
    }

    if (state.programFilter !== "all") {
      apps = apps.filter(function (a) {
        return a.programType === state.programFilter;
      });
    }

    if (state.searchTerm) {
      var term = state.searchTerm.toLowerCase();
      apps = apps.filter(function (a) {
        return (
          (a.fullNameAr && a.fullNameAr.toLowerCase().indexOf(term) !== -1) ||
          (a.fullNameEn && a.fullNameEn.toLowerCase().indexOf(term) !== -1) ||
          (a.applicationNumber && a.applicationNumber.toLowerCase().indexOf(term) !== -1) ||
          (a.nationalId && a.nationalId.indexOf(term) !== -1) ||
          (a.email && a.email.toLowerCase().indexOf(term) !== -1)
        );
      });
    }

    apps.sort(function (a, b) {
      var fieldA = a[state.sortField] || "";
      var fieldB = b[state.sortField] || "";
      if (typeof fieldA === "string") fieldA = fieldA.toLowerCase();
      if (typeof fieldB === "string") fieldB = fieldB.toLowerCase();
      if (fieldA < fieldB) return state.sortDir === "asc" ? -1 : 1;
      if (fieldA > fieldB) return state.sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return apps;
  }

  function renderApplicationsTable() {
    var filtered = getFilteredApplications();
    var state = appTableState;
    var total = filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / state.perPage));

    if (state.currentPage > totalPages) state.currentPage = totalPages;

    var start = (state.currentPage - 1) * state.perPage;
    var pageApps = filtered.slice(start, start + state.perPage);

    var tbody = $("#applications-tbody");
    if (!tbody) return;

    if (pageApps.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="admin-empty-row">لا توجد طلبات مطابقة</td></tr>';
    } else {
      tbody.innerHTML = pageApps
        .map(function (app) {
          return (
            "<tr>" +
            '<td class="td-number">' + escapeHTML(app.applicationNumber || "—") + "</td>" +
            '<td class="td-name">' +
            '<div class="app-name-cell">' +
            '<span class="app-name">' + escapeHTML(app.fullNameAr || "—") + "</span>" +
            '<span class="app-email">' + escapeHTML(app.email || "") + "</span>" +
            "</div>" +
            "</td>" +
            "<td>" + getProgramLabel(app.programType) + "</td>" +
            "<td>" + getSpecializationLabel(app.programName) + "</td>" +
            "<td>" + getStatusBadge(app.status) + "</td>" +
            "<td>" + formatDate(app.submittedAt) + "</td>" +
            '<td class="td-actions">' +
            '<button class="admin-btn-icon view-btn" onclick="showApplicationDetail(\'' + app.id + '\')" title="عرض التفاصيل"><i class="fas fa-eye"></i></button>' +
            '<button class="admin-btn-icon print-btn" onclick="printApplication(\'' + app.id + '\')" title="طباعة"><i class="fas fa-print"></i></button>' +
            "</td>" +
            "</tr>"
          );
        })
        .join("");
    }

    renderPagination(total, totalPages);
    updateSortIndicators();
  }

  function renderPagination(total, totalPages) {
    var container = $("#applications-pagination");
    if (!container) return;

    var state = appTableState;

    var html = '<div class="admin-pagination-info">';
    html += "عرض " + (total === 0 ? 0 : (state.currentPage - 1) * state.perPage + 1);
    html += " - " + Math.min(state.currentPage * state.perPage, total);
    html += " من " + total + " طلب";
    html += "</div>";

    html += '<div class="admin-pagination-controls">';

    html += '<button class="admin-page-btn" onclick="goToPage(1)" ' + (state.currentPage === 1 ? "disabled" : "") + '><i class="fas fa-angle-double-right"></i></button>';
    html += '<button class="admin-page-btn" onclick="goToPage(' + (state.currentPage - 1) + ')" ' + (state.currentPage === 1 ? "disabled" : "") + '><i class="fas fa-angle-right"></i></button>';

    var startPage = Math.max(1, state.currentPage - 2);
    var endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    for (var i = startPage; i <= endPage; i++) {
      html += '<button class="admin-page-btn' + (i === state.currentPage ? " active" : "") + '" onclick="goToPage(' + i + ')">' + i + "</button>";
    }

    html += '<button class="admin-page-btn" onclick="goToPage(' + (state.currentPage + 1) + ')" ' + (state.currentPage === totalPages ? "disabled" : "") + '><i class="fas fa-angle-left"></i></button>';
    html += '<button class="admin-page-btn" onclick="goToPage(' + totalPages + ')" ' + (state.currentPage === totalPages ? "disabled" : "") + '><i class="fas fa-angle-double-left"></i></button>';

    html += "</div>";
    container.innerHTML = html;
  }

  function goToPage(page) {
    var filtered = getFilteredApplications();
    var totalPages = Math.max(1, Math.ceil(filtered.length / appTableState.perPage));
    appTableState.currentPage = Math.max(1, Math.min(page, totalPages));
    renderApplicationsTable();
  }

  window.goToPage = goToPage;

  function updateSortIndicators() {
    var headers = $$(".sortable-header");
    var state = appTableState;
    headers.forEach(function (h) {
      h.classList.remove("sort-asc", "sort-desc");
      if (h.getAttribute("data-sort") === state.sortField) {
        h.classList.add(state.sortDir === "asc" ? "sort-asc" : "sort-desc");
      }
    });
  }

  function initApplicationsFilters() {
    var searchInput = $("#app-search");
    var statusFilter = $("#app-status-filter");
    var programFilter = $("#app-program-filter");

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        appTableState.searchTerm = searchInput.value.trim();
        appTableState.currentPage = 1;
        renderApplicationsTable();
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener("change", function () {
        appTableState.statusFilter = statusFilter.value;
        appTableState.currentPage = 1;
        renderApplicationsTable();
      });
    }

    if (programFilter) {
      programFilter.addEventListener("change", function () {
        appTableState.programFilter = programFilter.value;
        appTableState.currentPage = 1;
        renderApplicationsTable();
      });
    }

    var headers = $$(".sortable-header");
    headers.forEach(function (h) {
      h.addEventListener("click", function () {
        var field = h.getAttribute("data-sort");
        if (!field) return;
        if (appTableState.sortField === field) {
          appTableState.sortDir = appTableState.sortDir === "asc" ? "desc" : "asc";
        } else {
          appTableState.sortField = field;
          appTableState.sortDir = "asc";
        }
        renderApplicationsTable();
      });
    });
  }

  /* ----------------------------------------------------------
     8. APPLICATION DETAIL MODAL
  ---------------------------------------------------------- */
  function showApplicationDetail(appId) {
    var app = getApplicationById(appId);
    if (!app) {
      showToast("الطلب غير موجود", "error");
      return;
    }

    var html = buildApplicationDetailHTML(app);
    openModal(html);
  }

  window.showApplicationDetail = showApplicationDetail;

  function buildApplicationDetailHTML(app) {
    var html = "";

    html += '<div class="admin-modal-header">';
    html += '<h2><i class="fas fa-file-alt"></i> تفاصيل الطلب ' + escapeHTML(app.applicationNumber || "") + "</h2>";
    html += '<button class="admin-modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>';
    html += "</div>";

    html += '<div class="admin-modal-body">';

    html += '<div class="detail-status-bar">';
    html += getStatusBadge(app.status);
    html += '<span class="detail-date">تاريخ التقديم: ' + formatDate(app.submittedAt) + "</span>";
    if (app.updatedAt) {
      html += '<span class="detail-date">آخر تحديث: ' + formatDate(app.updatedAt) + "</span>";
    }
    html += "</div>";

    html += '<div class="detail-section">';
    html += '<h3><i class="fas fa-user"></i> البيانات الشخصية</h3>';
    html += '<div class="detail-grid">';
    html += detailItem("الاسم (عربي)", app.fullNameAr);
    html += detailItem("الاسم (إنجليزي)", app.fullNameEn);
    html += detailItem("رقم الهوية", app.nationalId);
    html += detailItem("تاريخ الميلاد", app.birthDate);
    html += detailItem("الجنسية", app.nationality);
    html += detailItem("الجنس", app.gender === "male" ? "ذكر" : app.gender === "female" ? "أنثى" : app.gender);
    html += detailItem("الجوال", app.phone);
    html += detailItem("البريد الإلكتروني", app.email);
    html += detailItem("العنوان", app.address);
    html += "</div>";
    html += "</div>";

    html += '<div class="detail-section">';
    html += '<h3><i class="fas fa-award"></i> المؤهلات العلمية</h3>';
    html += '<div class="detail-grid">';
    html += detailItem("درجة البكالوريوس", app.bachelorDegree);
    html += detailItem("جامعة البكالوريوس", app.bachelorUniversity);
    html += detailItem("سنة التخرج", app.bachelorYear);
    html += detailItem("التقدير", getGradeLabel(app.bachelorGrade));
    html += detailItem("ماجستير سابقة", app.hasMasters === "yes" ? "نعم" : "لا");
    if (app.hasMasters === "yes") {
      html += detailItem("درجة الماجستير", app.mastersDegree);
      html += detailItem("جامعة الماجستير", app.mastersUniversity);
      html += detailItem("سنة التخرج (ماجستير)", app.mastersYear);
      html += detailItem("تقدير الماجستير", getGradeLabel(app.mastersGrade));
    }
    html += detailItem("الخبرات", app.experience);
    html += detailItem("الأبحاث المنشورة", app.publications);
    html += "</div>";
    html += "</div>";

    html += '<div class="detail-section">';
    html += '<h3><i class="fas fa-book-open"></i> البرنامج المطلوب</h3>';
    html += '<div class="detail-grid">';
    html += detailItem("نوع البرنامج", getProgramLabel(app.programType));
    html += detailItem("البرنامج", getSpecializationLabel(app.programName));
    html += detailItem("mode الدراسة", getStudyModeLabel(app.studyMode));
    html += detailItem("الفصل الدراسي", getSemesterLabel(app.semester));
    html += detailItem("موضوع البحث", app.researchTopic);
    html += detailItem("المشرف المقترح", app.supervisor);
    html += detailItem("ملاحظات", app.programNotes);
    html += "</div>";
    html += "</div>";

    html += '<div class="detail-section">';
    html += '<h3><i class="fas fa-folder-open"></i> المستندات المرفقة</h3>';
    html += '<div class="detail-docs">';
    html += '<div class="doc-check-item"><i class="fas fa-file-pdf"></i> <span>الشهادة الجامعية</span> <i class="fas fa-check-circle doc-uploaded"></i></div>';
    html += '<div class="doc-check-item"><i class="fas fa-file-pdf"></i> <span>صفحة الشهادة</span> <i class="fas fa-check-circle doc-uploaded"></i></div>';
    html += '<div class="doc-check-item"><i class="fas fa-id-card"></i> <span>صورة الهوية</span> <i class="fas fa-check-circle doc-uploaded"></i></div>';
    html += '<div class="doc-check-item"><i class="fas fa-image"></i> <span>الصورة الشخصية</span> <i class="fas fa-check-circle doc-uploaded"></i></div>';
    html += '<div class="doc-check-item"><i class="fas fa-file-alt"></i> <span>السيرة الذاتية</span> <i class="fas fa-check-circle doc-uploaded"></i></div>';
    html += "</div>";
    html += "</div>";

    html += '<div class="detail-section">';
    html += '<h3><i class="fas fa-comments"></i> ملاحظات وتقييم اللجان</h3>';
    html += '<div class="detail-reviews">';
    html += '<div class="review-item">';
    html += '<div class="review-committee">لجنة المراجعة الأولية</div>';
    html += '<div class="review-status">' + getReviewStatusForApp(app.id, "admission") + "</div>";
    html += "</div>";
    html += '<div class="review-item">';
    html += '<div class="review-committee">اللجنة الأكاديمية</div>';
    html += '<div class="review-status">' + getReviewStatusForApp(app.id, "academic") + "</div>";
    html += "</div>";
    html += '<div class="review-item">';
    html += '<div class="review-committee">لجنة المنح الدراسية</div>';
    html += '<div class="review-status">' + getReviewStatusForApp(app.id, "scholarship") + "</div>";
    html += "</div>";
    html += "</div>";
    html += "</div>";

    html += "</div>";

    html += '<div class="admin-modal-footer">';
    html += '<div class="detail-actions">';
    html += '<button class="admin-btn admin-btn-review" onclick="changeAppStatus(\'' + app.id + "', 'formation')\"><i class=\"fas fa-users\"></i> ارسال للتشكيل</button>";
    html += '<button class="admin-btn admin-btn-accept" onclick="changeAppStatus(\'' + app.id + "', 'degree')\"><i class=\"fas fa-graduation-cap\"></i> منح الدرجة</button>";
    html += '<button class="admin-btn admin-btn-print" onclick="printApplication(\'' + app.id + '\')"><i class="fas fa-print"></i> طباعة</button>';
    html += "</div>";
    html += "</div>";

    return html;
  }

  function detailItem(label, value) {
    return (
      '<div class="detail-item">' +
      '<span class="detail-label">' + escapeHTML(label) + "</span>" +
      '<span class="detail-value">' + escapeHTML(value || "—") + "</span>" +
      "</div>"
    );
  }

  function getGradeLabel(grade) {
    var map = {
      excellent: "ممتاز",
      veryGood: "جيد جداً",
      good: "جيد",
      acceptable: "مقبول",
    };
    return map[grade] || grade || "—";
  }

  function getStudyModeLabel(mode) {
    var map = {
      fulltime: "دوام كامل",
      parttime: "دوام جزئي",
      evening: "مسائي",
    };
    return map[mode] || mode || "—";
  }

  function getSemesterLabel(sem) {
    var map = {
      fall: "الفصل الخريف",
      spring: "الفصل الربيعي",
      summer: "الفصل الصيفي",
    };
    return map[sem] || sem || "—";
  }

  function getReviewStatusForApp(appId, committeeType) {
    var committees = getCommittees();
    if (!committees) return '<span class="review-pending">بانتظار التعيين</span>';

    var committee = committees.find(function (c) {
      return c.type === committeeType;
    });
    if (!committee) return '<span class="review-pending">بانتظار التعيين</span>';

    var assigned = committee.assignments ? committee.assignments[appId] : null;
    if (!assigned) return '<span class="review-pending">لم يتم التعيين</span>';

    return '<span class="review-assigned">مُعيَّن لـ ' + escapeHTML(assigned.memberName) + "</span>";
  }

  function changeAppStatus(appId, newStatus) {
    var app = updateApplicationStatus(appId, newStatus);
    if (app) {
      var label = STATUS_MAP[newStatus] ? STATUS_MAP[newStatus].label : newStatus;
      showToast("تم تحديث حالة الطلب إلى: " + label, "success");

      var notifs = getNotifications();
      notifs.unshift({
        id: generateId(),
        title: "تحديث حالة الطلب",
        message: "تم تحديث حالة طلب " + (app.fullNameAr || "") + " إلى " + label,
        type: newStatus === "accepted" ? "success" : newStatus === "rejected" ? "warning" : "info",
        read: false,
        createdAt: new Date().toISOString(),
      });
      saveNotifications(notifs);

      closeModal();
      if (currentView === "applications") renderApplicationsTable();
      if (currentView === "dashboard") renderDashboard();
      renderNotifications();
    } else {
      showToast("خطأ في تحديث الطلب", "error");
    }
  }

  window.changeAppStatus = changeAppStatus;

  /* ----------------------------------------------------------
     9. PRINT APPLICATION
  ---------------------------------------------------------- */
  function printApplication(appId) {
    var app = getApplicationById(appId);
    if (!app) {
      showToast("الطلب غير موجود", "error");
      return;
    }

    var printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      showToast("يرجى السماح بالنوافذ المنبثقة للطباعة", "error");
      return;
    }

    var doc =
      "<!DOCTYPE html>" +
      '<html lang="ar" dir="rtl">' +
      "<head>" +
      '<meta charset="UTF-8">' +
      "<title>طباعة الطلب - " + escapeHTML(app.applicationNumber || "") + "</title>" +
      "<style>" +
      "* { margin: 0; padding: 0; box-sizing: border-box; }" +
      "body { font-family: 'Cairo', 'Tajawal', Arial, sans-serif; direction: rtl; padding: 40px; color: #333; }" +
      ".print-header { text-align: center; border-bottom: 3px solid #1a73e8; padding-bottom: 20px; margin-bottom: 30px; }" +
      ".print-header h1 { color: #1a73e8; font-size: 24px; margin-bottom: 5px; }" +
      ".print-header h2 { color: #555; font-size: 18px; font-weight: normal; }" +
      ".print-header .app-number { font-size: 14px; color: #888; margin-top: 8px; }" +
      ".print-section { margin-bottom: 25px; }" +
      ".print-section h3 { color: #1a73e8; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 12px; }" +
      ".print-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }" +
      ".print-item { display: flex; padding: 6px 0; border-bottom: 1px dotted #eee; }" +
      ".print-label { font-weight: bold; min-width: 140px; color: #555; }" +
      ".print-value { flex: 1; }" +
      ".print-full { grid-column: 1 / -1; }" +
      ".status-badge { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 13px; font-weight: bold; }" +
      ".status-pending { background: #fff3cd; color: #856404; }" +
      ".status-registration { background: #e3f2fd; color: #1565c0; }" +
      ".status-formation { background: #fff3e0; color: #e65100; }" +
      ".status-accepted, .status-degree { background: #d4edda; color: #155724; }" +
      ".print-footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #1a73e8; color: #888; font-size: 12px; }" +
      "@media print { body { padding: 20px; } }" +
      "</style>" +
      "</head>" +
      "<body>" +
      '<div class="print-header">' +
      "<h1>كلية علوم الرياضة - الدراسات العليا</h1>" +
      "<h2>طلب الدراسة العليا</h2>" +
      '<div class="app-number">رقم الطلب: ' + escapeHTML(app.applicationNumber || "—") + "</div>" +
      "</div>";

    doc += '<div class="print-section"><h3>البيانات الشخصية</h3><div class="print-grid">';
    doc += printItem("الاسم الكامل", app.fullNameAr);
    doc += printItem("الاسم بالإنجليزية", app.fullNameEn);
    doc += printItem("رقم الهوية", app.nationalId);
    doc += printItem("تاريخ الميلاد", app.birthDate);
    doc += printItem("الجنسية", app.nationality);
    doc += printItem("الجنس", app.gender === "male" ? "ذكر" : "أنثى");
    doc += printItem("الجوال", app.phone);
    doc += printItem("البريد الإلكتروني", app.email);
    doc += '<div class="print-item print-full"><span class="print-label">العنوان:</span><span class="print-value">' + escapeHTML(app.address || "—") + "</span></div>";
    doc += "</div></div>";

    doc += '<div class="print-section"><h3>المؤهلات العلمية</h3><div class="print-grid">';
    doc += printItem("درجة البكالوريوس", app.bachelorDegree);
    doc += printItem("جامعة البكالوريوس", app.bachelorUniversity);
    doc += printItem("سنة التخرج", app.bachelorYear);
    doc += printItem("التقدير", getGradeLabel(app.bachelorGrade));
    if (app.hasMasters === "yes") {
      doc += printItem("درجة الماجستير", app.mastersDegree);
      doc += printItem("جامعة الماجستير", app.mastersUniversity);
      doc += printItem("سنة التخرج", app.mastersYear);
      doc += printItem("تقدير الماجستير", getGradeLabel(app.mastersGrade));
    }
    doc += "</div></div>";

    doc += '<div class="print-section"><h3>البرنامج المطلوب</h3><div class="print-grid">';
    doc += printItem("نوع البرنامج", getProgramLabel(app.programType));
    doc += printItem("التخصص", getSpecializationLabel(app.programName));
    doc += printItem("mode الدراسة", getStudyModeLabel(app.studyMode));
    doc += printItem("الفصل الدراسي", getSemesterLabel(app.semester));
    doc += '<div class="print-item print-full"><span class="print-label">موضوع البحث:</span><span class="print-value">' + escapeHTML(app.researchTopic || "—") + "</span></div>";
    doc += printItem("المشرف المقترح", app.supervisor);
    doc += "</div></div>";

    doc += '<div class="print-section"><h3>حالة الطلب</h3><div class="print-grid">';
    doc += '<div class="print-item"><span class="print-label">الحالة:</span><span class="print-value"><span class="status-badge status-' + (STATUS_MAP[app.status] ? STATUS_MAP[app.status].color : "pending") + '">' + (STATUS_MAP[app.status] ? STATUS_MAP[app.status].label : app.status) + "</span></span></div>";
    doc += printItem("تاريخ التقديم", formatDate(app.submittedAt));
    doc += "</div></div>";

    doc += '<div class="print-footer">';
    doc += "<p>كلية علوم الرياضة - إدارة الدراسات العليا</p>";
    doc += "<p>تمت الطباعة في: " + new Date().toLocaleDateString("ar-EG") + " " + new Date().toLocaleTimeString("ar-EG") + "</p>";
    doc += "</div>";

    doc += "</body></html>";

    printWindow.document.write(doc);
    printWindow.document.close();

    setTimeout(function () {
      printWindow.print();
    }, 500);
  }

  window.printApplication = printApplication;

  function printItem(label, value) {
    return (
      '<div class="print-item">' +
      '<span class="print-label">' + escapeHTML(label) + ":</span>" +
      '<span class="print-value">' + escapeHTML(value || "—") + "</span>" +
      "</div>"
    );
  }

  /* ----------------------------------------------------------
     10. COMMITTEE MANAGEMENT
  ---------------------------------------------------------- */
  function getDefaultCommittees() {
    return [
      {
        id: "adm",
        name: "لجنة القبول والتسجيل",
        type: "admission",
        description: "مراجعة طلبات القبول والتحقق من المستندات",
        members: [
          { name: "د. عبدالرحمن الحربي", title: "أستاذ دكتور", role: "chair" },
          { name: "د. فاطمة العتيبي", title: "أستاذ مشارك", role: "member" },
          { name: "د. خالد السبيعي", title: "أستاذ مشارك", role: "member" },
        ],
        assignments: {},
      },
      {
        id: "aca",
        name: "اللجنة الأكاديمية",
        type: "academic",
        description: "تقييم المؤهلات العلمية والخبرات البحثية",
        members: [
          { name: "د. عبدالله الزهراني", title: "أستاذ دكتور", role: "chair" },
          { name: "د. ريم العنزي", title: "أستاذ مشارك", role: "member" },
          { name: "د. نورة القحطاني", title: "محاضر", role: "observer" },
        ],
        assignments: {},
      },
      {
        id: "sch",
        name: "لجنة المنح الدراسية",
        type: "scholarship",
        description: "مراجعة طلبات المنح وتقييم المرشحين",
        members: [
          { name: "د. محمد الدوسري", title: "أستاذ دكتور", role: "chair" },
          { name: "د. سارة الشمري", title: "أستاذ مشارك", role: "member" },
          { name: "د. عبدالعزيز المطيري", title: "أستاذ مساعد", role: "member" },
        ],
        assignments: {},
      },
    ];
  }

  function renderCommittees() {
    var committees = getCommittees();
    if (!committees) {
      committees = getDefaultCommittees();
      saveCommittees(committees);
    }

    var container = $("#committees-container");
    if (!container) return;

    var apps = getApplications();

    container.innerHTML = committees
      .map(function (committee) {
        var assignedCount = Object.keys(committee.assignments || {}).length;
        var reviewCount = Object.values(committee.assignments || {}).filter(function (a) {
          return a.reviewed;
        }).length;

        var memberHTML = committee.members
          .map(function (m) {
            var roleLabel = m.role === "chair" ? "رئيس" : m.role === "observer" ? "مراقب" : "عضو";
            var roleClass = m.role === "chair" ? "chair" : "";
            return (
              '<div class="committee-member-item">' +
              '<div class="member-avatar"><i class="fas fa-user-tie"></i></div>' +
              '<div class="member-info">' +
              '<div class="member-name">' + escapeHTML(m.name) + "</div>" +
              '<div class="member-title">' + escapeHTML(m.title) + "</div>" +
              '<span class="member-role ' + roleClass + '">' + escapeHTML(roleLabel) + "</span>" +
              "</div>" +
              "</div>"
            );
          })
          .join("");

        var assignmentHTML = "";
        var assignedApps = Object.entries(committee.assignments || {});
        if (assignedApps.length > 0) {
          assignmentHTML = '<div class="committee-assignments">';
          assignmentHTML += "<h4>الطلبات المُعيَّنة</h4>";
          assignedApps.forEach(function (entry) {
            var appData = getApplicationById(entry[0]);
            var info = entry[1];
            assignmentHTML +=
              '<div class="assignment-row">' +
              '<div class="assignment-app">' +
              '<span class="assignment-number">' + escapeHTML(appData ? appData.applicationNumber : entry[0]) + "</span>" +
              '<span class="assignment-name">' + escapeHTML(appData ? appData.fullNameAr : "—") + "</span>" +
              "</div>" +
              '<div class="assignment-reviewer">' +
              '<i class="fas fa-user"></i> ' + escapeHTML(info.memberName) +
              "</div>" +
              '<div class="assignment-status">' +
              (info.reviewed
                ? '<span class="review-done"><i class="fas fa-check-circle"></i> تم المراجعة</span>'
                : '<span class="review-pending"><i class="fas fa-clock"></i> بانتظار المراجعة</span>') +
              "</div>" +
              "</div>";
          });
          assignmentHTML += "</div>";
        }

        var assignableApps = apps.filter(function (a) {
          return !committee.assignments || !committee.assignments[a.id];
        });

        var assignFormHTML = "";
        if (assignableApps.length > 0) {
          assignFormHTML =
            '<div class="committee-assign-form">' +
            "<h4>تعيين مراجعة جديدة</h4>" +
            '<div class="assign-fields">' +
            '<select class="admin-select assign-app-select" id="assign-app-' + committee.id + '">' +
            '<option value="">اختر الطلب</option>' +
            assignableApps
              .map(function (a) {
                return '<option value="' + a.id + '">' + escapeHTML(a.applicationNumber) + " — " + escapeHTML(a.fullNameAr) + "</option>";
              })
              .join("") +
            "</select>" +
            '<select class="admin-select assign-member-select" id="assign-member-' + committee.id + '">' +
            '<option value="">اختر العضو</option>' +
            committee.members
              .map(function (m) {
                return '<option value="' + escapeHTML(m.name) + '">' + escapeHTML(m.name) + "</option>";
              })
              .join("") +
            "</select>" +
            '<button class="admin-btn admin-btn-primary" onclick="assignReviewer(\'' + committee.id + "')\">تعيين</button>" +
            "</div>" +
            "</div>";
        }

        return (
          '<div class="admin-committee-card">' +
          '<div class="committee-card-header">' +
          '<div class="committee-icon"><i class="fas fa-users"></i></div>' +
          '<div class="committee-header-info">' +
          "<h3>" + escapeHTML(committee.name) + "</h3>" +
          "<p>" + escapeHTML(committee.description) + "</p>" +
          "</div>" +
          '<div class="committee-stats-mini">' +
          '<span class="stat-mini"><i class="fas fa-file-alt"></i> ' + assignedCount + " طلب</span>" +
          '<span class="stat-mini"><i class="fas fa-check-circle"></i> ' + reviewCount + " مراجعة</span>" +
          "</div>" +
          "</div>" +
          '<div class="committee-card-body">' +
          '<div class="committee-members-section">' +
          "<h4>الأعضاء</h4>" +
          '<div class="committee-members-list">' +
          memberHTML +
          "</div>" +
          "</div>" +
          assignmentHTML +
          assignFormHTML +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function assignReviewer(committeeId) {
    var appSelect = $("#assign-app-" + committeeId);
    var memberSelect = $("#assign-member-" + committeeId);

    if (!appSelect || !memberSelect) return;

    var appId = appSelect.value;
    var memberName = memberSelect.value;

    if (!appId || !memberName) {
      showToast("يرجى اختيار الطلب وعضو اللجنة", "error");
      return;
    }

    var committees = getCommittees();
    var committee = committees.find(function (c) {
      return c.id === committeeId;
    });
    if (!committee) return;

    if (!committee.assignments) committee.assignments = {};
    committee.assignments[appId] = {
      memberName: memberName,
      assignedAt: new Date().toISOString(),
      reviewed: false,
    };

    saveCommittees(committees);
    showToast("تم تعيين " + memberName + " لمراجعة الطلب", "success");
    renderCommittees();
  }

  window.assignReviewer = assignReviewer;

  /* ----------------------------------------------------------
     11. SCHOLARSHIP MANAGEMENT
  ---------------------------------------------------------- */
  function getDefaultScholarships() {
    return [
      {
        id: "sch1",
        name: "المنحة الدراسية الكاملة",
        type: "full",
        coverage: "رسوم الدراسة كاملة + مكافأة شهرية 5000 ريال",
        amount: 5000,
        deadline: "2026-09-01",
        maxRecipients: 10,
        status: "open",
        recipients: [],
      },
      {
        id: "sch2",
        name: "منحة نصف الرسوم",
        type: "partial",
        coverage: "50% من الرسوم الدراسية",
        amount: 2500,
        deadline: "2026-08-15",
        maxRecipients: 20,
        status: "open",
        recipients: [],
      },
      {
        id: "sch3",
        name: "منحة البحث العلمي",
        type: "research",
        coverage: "تمويل البحث + مشاركة المؤتمرات",
        amount: 10000,
        deadline: "2026-07-30",
        maxRecipients: 5,
        status: "open",
        recipients: [],
      },
      {
        id: "sch4",
        name: "منحة التميز الأكاديمي",
        type: "merit",
        coverage: "رسوم + مكافأة شهرية + تأمين صحي",
        amount: 7000,
        deadline: "2026-10-01",
        maxRecipients: 8,
        status: "closed",
        recipients: [],
      },
    ];
  }

  function renderScholarships() {
    var scholarships = getScholarshipsData();
    if (!scholarships) {
      scholarships = getDefaultScholarships();
      saveScholarshipsData(scholarships);
    }

    var container = $("#scholarships-container");
    if (!container) return;

    var apps = getApplications();

    container.innerHTML = scholarships
      .map(function (sch) {
        var recipientCount = (sch.recipients || []).length;
        var remaining = sch.maxRecipients - recipientCount;

        var typeLabel = {
          full: "منحة كاملة",
          partial: "منحة جزئية",
          research: "بحثية",
          merit: "تميز أكاديمي",
        };

        var recipientHTML = "";
        if (sch.recipients && sch.recipients.length > 0) {
          recipientHTML = '<div class="sch-recipient-list">';
          recipientHTML += "<h4>المستفيدون (" + sch.recipients.length + ")</h4>";
          sch.recipients.forEach(function (r) {
            var appData = getApplicationById(r.appId);
            recipientHTML +=
              '<div class="sch-recipient-item">' +
              '<i class="fas fa-user-graduate"></i>' +
              "<span>" + escapeHTML(appData ? appData.fullNameAr : r.appId) + "</span>" +
              '<span class="recipient-date">' + formatDate(r.assignedAt) + "</span>" +
              "</div>";
          });
          recipientHTML += "</div>";
        }

        var assignable = apps.filter(function (a) {
          return a.status === "accepted" && !sch.recipients.some(function (r) {
            return r.appId === a.id;
          });
        });

        var assignHTML = "";
        if (sch.status === "open" && assignable.length > 0) {
          assignHTML =
            '<div class="sch-assign-form">' +
            '<select class="admin-select sch-assign-select" id="sch-assign-' + sch.id + '">' +
            '<option value="">اختر متقدماً</option>' +
            assignable
              .map(function (a) {
                return '<option value="' + a.id + '">' + escapeHTML(a.applicationNumber) + " — " + escapeHTML(a.fullNameAr) + "</option>";
              })
              .join("") +
            "</select>" +
            '<button class="admin-btn admin-btn-primary admin-btn-sm" onclick="assignScholarship(\'' + sch.id + "')\">تعيين</button>" +
            "</div>";
        }

        return (
          '<div class="admin-scholarship-card">' +
          '<div class="sch-card-header">' +
          '<div class="sch-type-badge">' + escapeHTML(typeLabel[sch.type] || sch.type) + "</div>" +
          '<span class="sch-status-badge sch-' + sch.status + '">' + (sch.status === "open" ? "مفتوحة" : "مغلقة") + "</span>" +
          "</div>" +
          "<h3>" + escapeHTML(sch.name) + "</h3>" +
          '<div class="sch-card-body">' +
          '<div class="sch-detail"><i class="fas fa-info-circle"></i> ' + escapeHTML(sch.coverage) + "</div>" +
          '<div class="sch-detail"><i class="fas fa-money-bill-wave"></i> ' + escapeHTML(String(sch.amount)) + " ريال/شهرياً</div>" +
          '<div class="sch-detail"><i class="fas fa-calendar"></i> الموعد النهائي: ' + escapeHTML(sch.deadline) + "</div>" +
          '<div class="sch-detail"><i class="fas fa-users"></i> ' + remaining + " مقاعد متاحة من " + sch.maxRecipients + "</div>" +
          '<div class="sch-progress-bar"><div class="sch-progress-fill" style="width:' + ((recipientCount / sch.maxRecipients) * 100) + '%"></div></div>' +
          "</div>" +
          recipientHTML +
          assignHTML +
          "</div>"
        );
      })
      .join("");
  }

  function assignScholarship(schId) {
    var select = $("#sch-assign-" + schId);
    if (!select || !select.value) {
      showToast("يرجى اختيار متقدم", "error");
      return;
    }

    var appId = select.value;
    var scholarships = getScholarshipsData();
    var sch = scholarships.find(function (s) {
      return s.id === schId;
    });

    if (!sch) return;

    if (!sch.recipients) sch.recipients = [];
    if (sch.recipients.length >= sch.maxRecipients) {
      showToast("لا توجد مقاعد متاحة", "error");
      return;
    }

    var exists = sch.recipients.some(function (r) {
      return r.appId === appId;
    });
    if (exists) {
      showToast("هذا المتقدم مستفيد بالفعل من هذه المنحة", "error");
      return;
    }

    sch.recipients.push({
      appId: appId,
      assignedAt: new Date().toISOString(),
    });

    saveScholarshipsData(scholarships);
    var appData = getApplicationById(appId);
    showToast("تم تعيين " + (appData ? appData.fullNameAr : "") + " للمنحة بنجاح", "success");
    renderScholarships();
  }

  window.assignScholarship = assignScholarship;

  /* ----------------------------------------------------------
     12. NOTIFICATIONS
  ---------------------------------------------------------- */
  function renderNotifications() {
    var notifs = getNotifications();
    var badge = $("#notification-badge");
    var list = $("#notification-list");

    var unreadCount = notifs.filter(function (n) {
      return !n.read;
    }).length;

    if (badge) {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? "flex" : "none";
    }

    if (!list) return;

    if (notifs.length === 0) {
      list.innerHTML = '<div class="admin-empty">لا توجد إشعارات</div>';
      return;
    }

    var sorted = notifs
      .slice()
      .sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

    list.innerHTML = sorted
      .map(function (n) {
        var iconMap = {
          info: "fas fa-info-circle",
          success: "fas fa-check-circle",
          warning: "fas fa-exclamation-triangle",
          error: "fas fa-times-circle",
        };
        var icon = iconMap[n.type] || iconMap.info;

        return (
          '<div class="admin-notification-item ' + (n.read ? "" : "unread") + '" onclick="markNotificationRead(\'' + n.id + "')\">" +
          '<div class="notif-icon ' + (n.type || "info") + '"><i class="' + icon + '"></i></div>' +
          '<div class="notif-content">' +
          '<div class="notif-title">' + escapeHTML(n.title) + "</div>" +
          '<div class="notif-message">' + escapeHTML(n.message) + "</div>" +
          '<div class="notif-time">' + formatDateTime(n.createdAt) + "</div>" +
          "</div>" +
          (!n.read ? '<div class="notif-dot"></div>' : "") +
          "</div>"
        );
      })
      .join("");
  }

  function markNotificationRead(notifId) {
    var notifs = getNotifications();
    var notif = notifs.find(function (n) {
      return n.id === notifId;
    });
    if (notif) {
      notif.read = true;
      saveNotifications(notifs);
      renderNotifications();
    }
  }

  window.markNotificationRead = markNotificationRead;

  function toggleNotificationsPanel() {
    var panel = $("#notifications-panel");
    if (panel) {
      panel.classList.toggle("active");
      if (panel.classList.contains("active")) {
        renderNotifications();
      }
    }
  }

  window.toggleNotificationsPanel = toggleNotificationsPanel;

  /* ----------------------------------------------------------
     13. DARK MODE TOGGLE
  ---------------------------------------------------------- */
  function initDarkMode() {
    var toggle = $("#darkModeToggle");
    var track = $("#darkToggleTrack");
    var saved = localStorage.getItem(STORAGE_KEYS.theme);
    if (saved === "dark") {
      document.body.classList.add("dark-mode");
      if (track) track.classList.add("active");
    }
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      document.body.classList.toggle("dark-mode");
      var isDark = document.body.classList.contains("dark-mode");
      localStorage.setItem(STORAGE_KEYS.theme, isDark ? "dark" : "light");
      if (track) track.classList.toggle("active", isDark);
    });
  }

  /* ----------------------------------------------------------
     14. MODAL SYSTEM
  ---------------------------------------------------------- */
  function openModal(modalId) {
    var overlay = document.getElementById(modalId);
    if (overlay) {
      overlay.classList.add("show");
      document.body.style.overflow = "hidden";
    }
  }

  function closeModal(modalId) {
    if (modalId) {
      var overlay = document.getElementById(modalId);
      if (overlay) overlay.classList.remove("show");
    } else {
      $$(".modal-overlay.show").forEach(function (m) { m.classList.remove("show"); });
    }
    document.body.style.overflow = "";
  }

  window.openModal = openModal;
  window.closeModal = closeModal;

  /* ----------------------------------------------------------
     14b. EXPORT & REPORTS
  ---------------------------------------------------------- */
  window.exportToExcel = function () {
    showToast("جاري تحميل البيانات...", "info");
    var exportUrl = GSCRIPT_URL + "?action=exportResearchers";
    fetch(exportUrl)
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.headers || !res.rows || res.rows.length === 0) {
          showToast("لا توجد بيانات للتصدير", "error");
          return;
        }
        if (typeof XLSX === "undefined") {
          var csv = "\uFEFF";
          csv += res.headers.join(",") + "\n";
          res.rows.forEach(function (row) {
            csv += row.map(function (cell) {
              return '"' + String(cell).replace(/"/g, '""') + '"';
            }).join(",") + "\n";
          });
          var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = "باحثين_" + new Date().toISOString().slice(0, 10) + ".csv";
          a.click();
          URL.revokeObjectURL(url);
          showToast("تم التصدير بنجاح (" + res.rows.length + " باحث)", "success");
          return;
        }

        var ws_data = [res.headers].concat(res.rows);
        var ws = XLSX.utils.aoa_to_sheet(ws_data);

        ws["!cols"] = res.headers.map(function (_, i) {
          var maxLen = res.headers[i].length;
          res.rows.forEach(function (row) {
            var len = String(row[i] || "").length;
            if (len > maxLen) maxLen = len;
          });
          return { wch: Math.min(maxLen + 4, 40) };
        });

        ws["!freeze"] = { xSplit: 0, ySplit: 1 };

        var range = XLSX.utils.decode_range(ws["!ref"]);
        for (var C = range.s.c; C <= range.e.c; C++) {
          var addr = XLSX.utils.encode_cell({ r: 0, c: C });
          if (ws[addr]) {
            ws[addr].s = {
              font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
              fill: { fgColor: { rgb: "1A73E8" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          }
        }

        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "الباحثين");

        var wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        var blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "باحثين_" + new Date().toISOString().slice(0, 10) + ".xlsx";
        a.click();
        URL.revokeObjectURL(url);
        showToast("تم التصدير بنجاح (" + res.rows.length + " باحث)", "success");
      })
      .catch(function (err) {
        showToast("خطأ في الاتصال: " + err.message, "error");
      });
  };

  window.printResearcherReport = function () {
    showToast("جاري تحميل التقرير...", "info");
    var exportUrl = GSCRIPT_URL + "?action=exportResearchers";
    fetch(exportUrl)
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.headers || !res.rows || res.rows.length === 0) {
          showToast("لا توجد بيانات للتقرير", "error");
          return;
        }
        var h = res.headers;
        var rows = res.rows;

        var totalResearchers = rows.length;
        var mastersCount = 0;
        var phdCount = 0;
        var regComplete = 0;
        var formComplete = 0;
        var degreeComplete = 0;

        var degIdx = h.indexOf("نوع الدرجة");
        var regIdx = h.indexOf("مستندات التسجيل");
        var formIdx = h.indexOf("مستندات التشكيل");
        var degDocIdx = h.indexOf("مستندات المنح");

        rows.forEach(function (row) {
          if (degIdx !== -1) {
            var deg = row[degIdx] || "";
            if (deg.indexOf("ماجستير") !== -1) mastersCount++;
            if (deg.indexOf("دكتوراه") !== -1) phdCount++;
          }
          if (regIdx !== -1 && row[regIdx] && row[regIdx] !== "") regComplete++;
          if (formIdx !== -1 && row[formIdx] && row[formIdx] !== "") formComplete++;
          if (degDocIdx !== -1 && row[degDocIdx] && row[degDocIdx] !== "") degreeComplete++;
        });

        var reportHTML = '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>تقرير الباحثين</title>';
        reportHTML += '<style>';
        reportHTML += 'body{font-family:Cairo,Tajawal,sans-serif;padding:40px;color:#1a1a2e;line-height:1.8}';
        reportHTML += 'h1{text-align:center;color:#1a73e8;margin-bottom:8px;font-size:24px}';
        reportHTML += 'h2{text-align:center;color:#666;font-size:14px;font-weight:400;margin-bottom:30px}';
        reportHTML += '.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:30px}';
        reportHTML += '.stat-box{background:#f0f4ff;border-radius:12px;padding:20px;text-align:center;border:1px solid #e0e0e0}';
        reportHTML += '.stat-box .num{font-size:32px;font-weight:800;color:#1a73e8;display:block}';
        reportHTML += '.stat-box .lbl{font-size:13px;color:#666;margin-top:4px}';
        reportHTML += 'table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}';
        reportHTML += 'th{background:#1a73e8;color:#fff;padding:10px 8px;text-align:right;font-weight:600}';
        reportHTML += 'td{padding:8px;border-bottom:1px solid #e9ecef;text-align:right}';
        reportHTML += 'tr:nth-child(even){background:#f8f9fa}';
        reportHTML += '.footer{text-align:center;margin-top:30px;font-size:12px;color:#999;border-top:1px solid #e9ecef;padding-top:16px}';
        reportHTML += '</style></head><body>';
        reportHTML += '<h1>تقرير الباحثين والدراسات العليا</h1>';
        reportHTML += '<h2>كلية علوم الرياضة - جامعة الفيوم | ' + new Date().toLocaleDateString("ar-EG") + '</h2>';
        reportHTML += '<div class="stats">';
        reportHTML += '<div class="stat-box"><span class="num">' + totalResearchers + '</span><span class="lbl">إجمالي الباحثين</span></div>';
        reportHTML += '<div class="stat-box"><span class="num">' + mastersCount + '</span><span class="lbl">ماجستير</span></div>';
        reportHTML += '<div class="stat-box"><span class="num">' + phdCount + '</span><span class="lbl">دكتوراه</span></div>';
        reportHTML += '<div class="stat-box"><span class="num">' + regComplete + '</span><span class="lbl">أكملوا التسجيل</span></div>';
        reportHTML += '</div>';
        reportHTML += '<div class="stats">';
        reportHTML += '<div class="stat-box"><span class="num">' + formComplete + '</span><span class="lbl">أكملوا التشكيل</span></div>';
        reportHTML += '<div class="stat-box"><span class="num">' + degreeComplete + '</span><span class="lbl">أكملوا المنح</span></div>';
        reportHTML += '<div class="stat-box"><span class="num">' + (totalResearchers - regComplete) + '</span><span class="lbl">بانتظار التسجيل</span></div>';
        reportHTML += '<div class="stat-box"><span class="num">' + Math.round((regComplete / (totalResearchers || 1)) * 100) + '%</span><span class="lbl">نسبة إتمام التسجيل</span></div>';
        reportHTML += '</div>';

        reportHTML += '<table><thead><tr>';
        reportHTML += '<th>م</th><th>الاسم</th><th>الرقم القومي</th><th>الدرجة</th><th>التخصص</th><th>نوع الدرجة</th><th>حالة التسجيل</th><th>حالة التشكيل</th><th>حالة المنح</th>';
        reportHTML += '</tr></thead><tbody>';
        rows.forEach(function (row, idx) {
          var nameIdx = h.indexOf("الاسم الكامل");
          var natIdx = h.indexOf("الرقم القومي");
          var degLvlIdx = h.indexOf("الدرجة الحالية");
          var specIdx = h.indexOf("التخصص");
          reportHTML += '<tr>';
          reportHTML += '<td>' + (idx + 1) + '</td>';
          reportHTML += '<td>' + (nameIdx !== -1 ? row[nameIdx] : "") + '</td>';
          reportHTML += '<td>' + (natIdx !== -1 ? row[natIdx] : "") + '</td>';
          reportHTML += '<td>' + (degLvlIdx !== -1 ? row[degLvlIdx] : "") + '</td>';
          reportHTML += '<td>' + (specIdx !== -1 ? row[specIdx] : "") + '</td>';
          reportHTML += '<td>' + (degIdx !== -1 ? row[degIdx] : "") + '</td>';
          reportHTML += '<td>' + (regIdx !== -1 && row[regIdx] && row[regIdx] !== "" ? "✓ مكتمل" : "✗ ناقص") + '</td>';
          reportHTML += '<td>' + (formIdx !== -1 && row[formIdx] && row[formIdx] !== "" ? "✓ مكتمل" : "✗ ناقص") + '</td>';
          reportHTML += '<td>' + (degDocIdx !== -1 && row[degDocIdx] && row[degDocIdx] !== "" ? "✓ مكتمل" : "✗ ناقص") + '</td>';
          reportHTML += '</tr>';
        });
        reportHTML += '</tbody></table>';
        reportHTML += '<div class="footer">كلية علوم الرياضة - جامعة الفيوم - الدراسات العليا | تاريخ الإصدار: ' + new Date().toLocaleDateString("ar-EG") + '</div>';
        reportHTML += '</body></html>';

        var win = window.open("", "_blank");
        win.document.write(reportHTML);
        win.document.close();
        setTimeout(function () { win.print(); }, 600);
        showToast("تم فتح التقرير", "success");
      })
      .catch(function (err) {
        showToast("خطأ في الاتصال: " + err.message, "error");
      });
  };

  /* ----------------------------------------------------------
     14c. DOCUMENTS MANAGEMENT
  ---------------------------------------------------------- */
  window.loadDocuments = function () {
    var tbody = document.getElementById("documentsTableBody");
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--ats);"><i class="fas fa-spinner fa-spin" style="margin-left:8px;"></i> جاري تحميل المستندات...</td></tr>';

    var exportUrl = GSCRIPT_URL + "?action=listAllFiles";
    fetch(exportUrl)
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.files) {
          if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--ats);">لا توجد مستندات</td></tr>';
          return;
        }

        var files = res.files;
        var stageFilter = document.getElementById("docFilterStage");
        var filterVal = stageFilter ? stageFilter.value : "";
        if (filterVal) {
          files = files.filter(function (f) { return f.stage === filterVal; });
        }

        var totalEl = document.getElementById("totalFilesCount");
        var pdfEl = document.getElementById("pdfFilesCount");
        var resEl = document.getElementById("researchersFilesCount");
        if (totalEl) totalEl.textContent = res.total || 0;
        if (pdfEl) pdfEl.textContent = res.files.filter(function (f) { return f.icon === "fa-file-pdf"; }).length;
        if (resEl) {
          var uniqueResearchers = {};
          res.files.forEach(function (f) { uniqueResearchers[f.nationalId] = true; });
          resEl.textContent = Object.keys(uniqueResearchers).length;
        }

        if (files.length === 0) {
          if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--ats);">لا توجد مستندات</td></tr>';
          return;
        }

        var stageColors = { "التسجيل": "#1a73e8", "التشكيل": "#ff6d00", "المنح": "#00c853" };
        var iconColors = { "fa-file-pdf": "#e53935", "fa-file-image": "#ff6d00", "fa-file-word": "#1a73e8", "fa-file-excel": "#00c853", "fa-file": "#6c757d" };

        if (tbody) {
          tbody.innerHTML = files.map(function (f) {
            var date = f.lastUpdated ? new Date(f.lastUpdated).toLocaleDateString("ar-EG") : "";
            var sizeKB = Math.round((f.size || 0) / 1024);
            var sizeStr = sizeKB > 1024 ? Math.round(sizeKB / 1024) + " MB" : sizeKB + " KB";
            var iconColor = iconColors[f.icon] || "#6c757d";
            var stageColor = stageColors[f.stage] || "#6c757d";

            return '<tr>' +
              '<td><i class="fas ' + f.icon + '" style="color:' + iconColor + ';margin-left:8px;"></i><strong>' + escapeHTML(f.name) + '</strong></td>' +
              '<td>' + escapeHTML(f.researcherName) + '</td>' +
              '<td><span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;color:#fff;background:' + stageColor + ';">' + escapeHTML(f.stage) + '</span></td>' +
              '<td>' + sizeStr + '</td>' +
              '<td>' + date + '</td>' +
              '<td><div class="btn-group">' +
              '<button class="btn btn-icon btn-outline" title="عرض" onclick="viewFile(\'' + f.id + '\')"><i class="fas fa-eye"></i></button>' +
              '<button class="btn btn-icon btn-outline" title="تحميل" onclick="downloadFile(\'' + f.id + '\',\'' + escapeHTML(f.name).replace(/'/g, "\\'") + '\')"><i class="fas fa-download"></i></button>' +
              '</div></td></tr>';
          }).join("");
        }
      })
      .catch(function (err) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--ad);">خطأ في الاتصال: ' + err.message + '</td></tr>';
      });
  };

  window.viewFile = function (fileId) {
    window.open("https://drive.google.com/file/d/" + fileId + "/preview", "_blank");
  };

  window.downloadFile = function (fileId, fileName) {
    var a = document.createElement("a");
    a.href = "https://drive.google.com/uc?export=download&id=" + fileId;
    a.download = fileName;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  function createModalStructure() {
    var backdrop = document.createElement("div");
    backdrop.id = "admin-modal-backdrop";
    backdrop.className = "admin-modal-backdrop";

    var modal = document.createElement("div");
    modal.id = "admin-modal";
    modal.className = "admin-modal";

    backdrop.appendChild(modal);

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) closeModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });

    document.body.appendChild(backdrop);
  }

  /* ----------------------------------------------------------
     15. TOAST NOTIFICATIONS
  ---------------------------------------------------------- */
  function showToast(message, type) {
    type = type || "info";

    var container = $("#toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.style.cssText =
        "position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;";
      document.body.appendChild(container);
    }

    var toast = document.createElement("div");
    toast.className = "admin-toast toast-" + type;
    toast.style.cssText =
      "pointer-events:auto;padding:14px 28px;border-radius:8px;color:#fff;font-family:inherit;font-size:0.95rem;opacity:0;transition:opacity 0.3s,transform 0.3s;transform:translateY(-10px);box-shadow:0 4px 16px rgba(0,0,0,0.2);display:flex;align-items:center;gap:10px;min-width:280px;justify-content:center;";

    var bgMap = {
      success: "#27ae60",
      error: "#e74c3c",
      info: "#2980b9",
      warning: "#f39c12",
    };
    toast.style.background = bgMap[type] || bgMap.info;

    var iconMap = {
      success: "fas fa-check-circle",
      error: "fas fa-times-circle",
      info: "fas fa-info-circle",
      warning: "fas fa-exclamation-triangle",
    };

    toast.innerHTML =
      '<i class="' + (iconMap[type] || iconMap.info) + '"></i>' +
      "<span>" + escapeHTML(message) + "</span>";

    container.appendChild(toast);

    requestAnimationFrame(function () {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    setTimeout(function () {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(function () {
        toast.remove();
      }, 350);
    }, 3500);
  }

  window.showToast = showToast;

  /* ----------------------------------------------------------
     16. CLOSE SIDEBAR ON OUTSIDE CLICK (Mobile)
  ---------------------------------------------------------- */
  function initMobileClose() {
    var overlay = $("#sidebarOverlay");
    if (overlay) {
      overlay.addEventListener("click", function () {
        var sidebar = $("#adminSidebar");
        if (sidebar) sidebar.classList.remove("mobile-open");
        overlay.classList.remove("show");
      });
    }
  }

  /* ----------------------------------------------------------
     17. BOOT
  ---------------------------------------------------------- */
  /* ----------------------------------------------------------
     STAFF LOGIN / LOGOUT / PERMISSIONS
  ---------------------------------------------------------- */
  function getStaffUser() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.staffUser)); } catch (e) { return null; }
  }

  function staffApiCall(payload) {
    return fetch(GSCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); });
  }

  function showStaffLogin() {
    var loginEl = document.getElementById("staffLoginSection");
    var wrapperEl = document.getElementById("adminWrapper");
    if (loginEl) loginEl.style.display = "flex";
    if (wrapperEl) wrapperEl.style.display = "none";
  }

  function showStaffDashboard() {
    var loginEl = document.getElementById("staffLoginSection");
    var wrapperEl = document.getElementById("adminWrapper");
    if (loginEl) loginEl.style.display = "none";
    if (wrapperEl) wrapperEl.style.display = "flex";
  }

  function applyRolePermissions(roleOrPerms) {
    var perms = [];
    if (Array.isArray(roleOrPerms)) {
      perms = roleOrPerms;
    } else if (typeof roleOrPerms === "string") {
      if (roleOrPerms === "admin") {
        perms = Object.keys(PERM_LABELS);
      }
    }

    var adminOnly = $$(".admin-only");
    adminOnly.forEach(function (el) {
      el.style.display = perms.indexOf("manage_users") !== -1 ? "" : "none";
    });

    var viceDeanOnly = $$(".vice-dean-only");
    viceDeanOnly.forEach(function (el) {
      el.style.display = perms.indexOf("generate_reports") !== -1 ? "" : "none";
    });

    var userNameEl = document.querySelector(".user-name");
    var userRoleEl = document.querySelector(".user-role");
    var avatarEl = document.querySelector(".user-avatar");
    var topbarAvatarName = document.querySelector(".avatar-name");
    var topbarAvatarRole = document.querySelector(".avatar-role");
    var topbarAvatarImg = document.querySelector(".avatar-img");

    var user = getStaffUser();
    if (user) {
      var initials = (user.name || "").split(" ").map(function(w){return w[0]}).join("").substring(0, 2);
      var roleName = user.roleName || ROLE_LABELS[user.role] || user.role || "مستخدم";
      if (userNameEl) userNameEl.textContent = user.name;
      if (userRoleEl) userRoleEl.textContent = roleName;
      if (avatarEl) { avatarEl.textContent = initials; avatarEl.setAttribute("style", "background:linear-gradient(135deg,#1a73e8,#1557b0)"); }
      if (topbarAvatarName) topbarAvatarName.textContent = user.name;
      if (topbarAvatarRole) topbarAvatarRole.textContent = roleName;
      if (topbarAvatarImg) { topbarAvatarImg.textContent = initials; topbarAvatarImg.setAttribute("style", "background:linear-gradient(135deg,#1a73e8,#1557b0)"); }
    }
  }

  /* Staff Login Form */
  var staffLoginForm = document.getElementById("staffLoginForm");
  if (staffLoginForm) {
    staffLoginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("staffLoginEmail").value.trim();
      var password = document.getElementById("staffLoginPassword").value;
      var errorEl = document.getElementById("staffLoginError");

      if (errorEl) errorEl.style.display = "none";

      staffApiCall({ action: "staffLogin", email: email, password: password })
        .then(function (res) {
          if (res.success) {
            localStorage.setItem(STORAGE_KEYS.staffUser, JSON.stringify(res.user));
            showStaffDashboard();
            var loginPerms = res.user.permissions || [];
            if (typeof loginPerms === "string") { try { loginPerms = JSON.parse(loginPerms); } catch(e) { loginPerms = []; } }
            var loginIsAdmin = res.user.role === "admin" || res.user.roleName === "admin" || res.user.role === "مدير النظام" || res.user.roleName === "مدير النظام";
            if (loginIsAdmin && (!loginPerms || loginPerms.length === 0)) loginPerms = Object.keys(PERM_LABELS);
            applyRolePermissions(loginPerms);
            init();
          } else {
            if (errorEl) { errorEl.textContent = res.message; errorEl.style.display = "block"; }
          }
        })
        .catch(function () {
          if (errorEl) { errorEl.textContent = "خطأ في الاتصال بالخادم"; errorEl.style.display = "block"; }
        });
    });
  }

  /* Staff Logout */
  window.staffLogout = function () {
    localStorage.removeItem(STORAGE_KEYS.staffUser);
    showStaffLogin();
  };

  var logoutBtn = document.querySelector(".danger-item");
  if (logoutBtn && logoutBtn.textContent.indexOf("تسجيل الخروج") !== -1) {
    logoutBtn.addEventListener("click", function (e) { e.preventDefault(); staffLogout(); });
  }

  /* Permissions Management */
  function loadStaffList() {
    staffApiCall({ action: "getStaff" })
      .then(function (res) {
        if (!res.success) return;
        var users = res.users || [];
        var tbody = document.getElementById("staffTableBody");
        if (tbody) {
          tbody.innerHTML = users.map(function (u) {
            var initials = (u.name || "").split(" ").map(function(w){return w[0]}).join("").substring(0, 2);
            var perms = [];
            try { perms = JSON.parse(u.permissions || "[]"); } catch(e) { perms = []; }
            var isManageUsers = perms.indexOf("manage_users") !== -1;
            var permBadges = perms.map(function(p) {
              return '<span class="permission-badge"><i class="' + (PERM_ICONS[p] || "") + '" style="margin-left:3px;"></i>' + (PERM_LABELS[p] || p) + '</span>';
            }).join("");
            var roleName = u.roleName || ROLE_LABELS[u.role] || u.role || "مستخدم";
            return '<tr>' +
              '<td><div class="user-cell"><div class="user-avatar-sm" style="' + (isManageUsers ? "background:linear-gradient(135deg,#e53935,#c62828)" : "background:linear-gradient(135deg,#1a73e8,#1557b0)") + '">' + initials + '</div><div><div class="user-name">' + escapeHTML(u.name) + '</div></div></div></td>' +
              '<td>' + escapeHTML(u.email) + '</td>' +
              '<td><span style="font-size:13px;font-weight:600;color:var(--atx);">' + escapeHTML(roleName) + '</span></td>' +
              '<td><div class="permission-badges">' + (permBadges || '<span style="font-size:12px;color:var(--ats);">بدون صلاحيات</span>') + '</div></td>' +
              '<td><div class="btn-group">' +
              '<button class="btn btn-icon btn-outline" title="تعديل" onclick="editStaff(\'' + escapeHTML(u.email) + '\')"><i class="fas fa-pen"></i></button>' +
              '<button class="btn btn-icon btn-outline" title="حذف" style="color:var(--ad);" onclick="deleteStaff(\'' + escapeHTML(u.email) + '\')"><i class="fas fa-trash"></i></button>' +
              '</div></td></tr>';
          }).join("");
        }

        var manageUsersC = users.filter(function(u){
          var p = []; try { p = JSON.parse(u.permissions || "[]"); } catch(e){}
          return p.indexOf("manage_users") !== -1 || u.role === "admin" || u.role === "مدير النظام";
        }).length;
        var totalEl = document.getElementById("totalStaffCount");
        var adminEl = document.getElementById("adminCount");
        if (totalEl) totalEl.textContent = users.length;
        if (adminEl) adminEl.textContent = manageUsersC;
      })
      .catch(function () {});
  }

  var addStaffBtn = document.getElementById("addStaffBtn");
  if (addStaffBtn) {
    addStaffBtn.addEventListener("click", function () {
      document.getElementById("staffModalTitle").textContent = "إضافة مستخدم جديد";
      document.getElementById("staffName").value = "";
      document.getElementById("staffEmail").value = "";
      document.getElementById("staffPassword").value = "";
      document.getElementById("staffEmail").disabled = false;
      document.getElementById("staffRoleName").value = "";
      var permChecks = document.querySelectorAll("#staffModal .permissions-grid input[type=checkbox]");
      permChecks.forEach(function(c){ c.checked = false; });
      document.getElementById("saveStaffBtn").setAttribute("data-mode", "add");
      openModal("staffModal");
    });
  }

  var saveStaffBtn = document.getElementById("saveStaffBtn");
  if (saveStaffBtn) {
    saveStaffBtn.addEventListener("click", function () {
      var mode = saveStaffBtn.getAttribute("data-mode");
      var name = document.getElementById("staffName").value.trim();
      var email = document.getElementById("staffEmail").value.trim();
      var password = document.getElementById("staffPassword").value;
      var roleName = document.getElementById("staffRoleName").value.trim();

      var selectedPerms = [];
      var permChecks = document.querySelectorAll("#staffModal .permissions-grid input[type=checkbox]");
      permChecks.forEach(function(c){ if (c.checked) selectedPerms.push(c.value); });

      if (!name || !email) { alert("يرجى ملء جميع الحقول المطلوبة"); return; }
      if (!roleName) { alert("يرجى إدخال اسم الصلاحية"); return; }

      var payload = { name: name, email: email, roleName: roleName, permissions: JSON.stringify(selectedPerms) };
      if (password) payload.password = password;
      payload.action = (mode === "edit") ? "updateStaff" : "addStaff";

      staffApiCall(payload)
        .then(function (res) {
          if (res.success) {
            closeModal("staffModal");
            loadStaffList();
          } else {
            alert(res.message);
          }
        })
        .catch(function () { alert("خطأ في الاتصال"); });
    });
  }

  window.editStaff = function (email) {
    staffApiCall({ action: "getStaff" })
      .then(function (res) {
        if (!res.success) return;
        var user = res.users.find(function (u) { return u.email === email; });
        if (!user) return;
        document.getElementById("staffModalTitle").textContent = "تعديل بيانات المستخدم";
        document.getElementById("staffName").value = user.name;
        document.getElementById("staffEmail").value = user.email;
        document.getElementById("staffEmail").disabled = true;
        document.getElementById("staffPassword").value = "";
        document.getElementById("staffRoleName").value = user.roleName || "";
        var savedPerms = [];
        try { savedPerms = JSON.parse(user.permissions || "[]"); } catch(e) { savedPerms = []; }
        var permChecks = document.querySelectorAll("#staffModal .permissions-grid input[type=checkbox]");
        permChecks.forEach(function(c){
          c.checked = savedPerms.indexOf(c.value) !== -1;
        });
        document.getElementById("saveStaffBtn").setAttribute("data-mode", "edit");
        openModal("staffModal");
      });
  };

  window.deleteStaff = function (email) {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    staffApiCall({ action: "deleteStaff", email: email })
      .then(function (res) {
        if (res.success) loadStaffList();
        else alert(res.message);
      });
  };

  /* ----------------------------------------------------------
     DYNAMIC DASHBOARD & APPLICATIONS (from Google Sheet)
  ---------------------------------------------------------- */
  var _cachedResearchers = null;

  function fetchResearchersData(callback) {
    if (_cachedResearchers) { callback(_cachedResearchers); return; }
    var url = GSCRIPT_URL + "?action=exportResearchers";
    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (res.success && res.headers && res.rows) {
          _cachedResearchers = { headers: res.headers, rows: res.rows };
          callback(_cachedResearchers);
        } else {
          callback(null);
        }
      })
      .catch(function() { callback(null); });
  }

  function getCellValue(row, headers, colName) {
    var idx = headers.indexOf(colName);
    return idx !== -1 ? (row[idx] || "") : "";
  }

  function loadDashboard() {
    var dashTotal = document.getElementById("dashTotal");
    var dashMasters = document.getElementById("dashMasters");
    var dashPhd = document.getElementById("dashPhd");
    var dashWithDocs = document.getElementById("dashWithDocs");
    var latestBody = document.getElementById("dashLatestBody");

    fetchResearchersData(function(data) {
      if (!data) {
        if (dashTotal) dashTotal.textContent = "0";
        if (dashMasters) dashMasters.textContent = "0";
        if (dashPhd) dashPhd.textContent = "0";
        if (dashWithDocs) dashWithDocs.textContent = "0";
        if (latestBody) latestBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--ats);">لا توجد بيانات</td></tr>';
        return;
      }

      var h = data.headers;
      var rows = data.rows;
      var total = rows.length;
      var masters = 0, phd = 0, withDocs = 0;
      var degTypeIdx = h.indexOf("نوع الدرجة");
      var regDocIdx = h.indexOf("مستندات التسجيل");

      rows.forEach(function(row) {
        if (degTypeIdx !== -1) {
          var deg = row[degTypeIdx] || "";
          if (deg.indexOf("ماجستير") !== -1) masters++;
          if (deg.indexOf("دكتوراه") !== -1) phd++;
        }
        if (regDocIdx !== -1 && row[regDocIdx] && row[regDocIdx] !== "") withDocs++;
      });

      if (dashTotal) dashTotal.textContent = total;
      if (dashMasters) dashMasters.textContent = masters;
      if (dashPhd) dashPhd.textContent = phd;
      if (dashWithDocs) dashWithDocs.textContent = withDocs;

      if (latestBody) {
        if (rows.length === 0) {
          latestBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--ats);">لا توجد بيانات</td></tr>';
          return;
        }
        var recent = rows.slice().reverse().slice(0, 5);
        var nameIdx = h.indexOf("الاسم الكامل");
        var natIdx = h.indexOf("الرقم القومي");
        var degLvlIdx = h.indexOf("الدرجة الحالية");
        var specIdx = h.indexOf("التخصص");
        var dateIdx = h.indexOf("تاريخ التقديم");

        latestBody.innerHTML = recent.map(function(row) {
          var name = nameIdx !== -1 ? row[nameIdx] : "";
          var natId = natIdx !== -1 ? row[natIdx] : "";
          var degLvl = degLvlIdx !== -1 ? row[degLvlIdx] : "";
          var spec = specIdx !== -1 ? row[specIdx] : "";
          var date = dateIdx !== -1 ? row[dateIdx] : "";
          var initials = (name || "").split(" ").map(function(w){return w[0]}).join("").substring(0, 2);
          var colors = ["#1a73e8","#00c853","#ff6d00","#e53935","#9c27b0","#00bcd4","#795548"];
          var color = colors[Math.abs(name.length) % colors.length];
          return '<tr><td><div class="user-cell"><div class="user-avatar-sm" style="background:' + color + ';">' + escapeHTML(initials) + '</div><div><div class="user-name">' + escapeHTML(name) + '</div></div></div></td>'
            + '<td>' + escapeHTML(natId) + '</td>'
            + '<td>' + escapeHTML(degLvl) + '</td>'
            + '<td>' + escapeHTML(spec) + '</td>'
            + '<td>' + escapeHTML(date) + '</td></tr>';
        }).join("");
      }
    });
  }

  function loadApplicationsFromSheet() {
    var tbody = document.getElementById("applicationsBody");
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--ats);"><i class="fas fa-spinner fa-spin" style="margin-left:8px;"></i> جاري تحميل الطلبات...</td></tr>';

    fetchResearchersData(function(data) {
      if (!data || data.rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--ats);">لا توجد طلبات مسجلة بعد</td></tr>';
        return;
      }

      var h = data.headers;
      var rows = data.rows;
      var nameIdx = h.indexOf("الاسم الكامل");
      var natIdx = h.indexOf("الرقم القومي");
      var degLvlIdx = h.indexOf("الدرجة الحالية");
      var specIdx = h.indexOf("التخصص");
      var degTypeIdx = h.indexOf("نوع الدرجة");
      var dateIdx = h.indexOf("تاريخ التقديم");
      var statusIdx = h.indexOf("حالة الطلب");
      var regDocIdx = h.indexOf("مستندات التسجيل");
      var formDocIdx = h.indexOf("مستندات التشكيل");
      var degDocIdx = h.indexOf("مستندات المنح");
      var appNumIdx = h.indexOf("رقم الطلب");

      tbody.innerHTML = rows.map(function(row, i) {
        var name = nameIdx !== -1 ? row[nameIdx] : "";
        var natId = natIdx !== -1 ? row[natIdx] : "";
        var degLvl = degLvlIdx !== -1 ? row[degLvlIdx] : "";
        var spec = specIdx !== -1 ? row[specIdx] : "";
        var degType = degTypeIdx !== -1 ? row[degTypeIdx] : "";
        var date = dateIdx !== -1 ? row[dateIdx] : "";
        var regStatus = regDocIdx !== -1 && row[regDocIdx] && row[regDocIdx] !== "" ? "مكتمل" : "ناقص";
        var formStatus = formDocIdx !== -1 && row[formDocIdx] && row[formDocIdx] !== "" ? "مكتمل" : "ناقص";
        var degStatus = degDocIdx !== -1 && row[degDocIdx] && row[degDocIdx] !== "" ? "مكتمل" : "ناقص";

        function badgeClass(s) { return s === "مكتمل" ? "status-approved" : "status-pending"; }

        return '<tr>'
          + '<td>' + (i + 1) + '</td>'
          + '<td><div class="user-cell"><div class="user-avatar-sm" style="background:linear-gradient(135deg,#1a73e8,#1557b0);">' + escapeHTML((name || "").split(" ").map(function(w){return w[0]}).join("").substring(0, 2)) + '</div><div><div class="user-name">' + escapeHTML(name) + '</div></div></div></td>'
          + '<td>' + escapeHTML(natId) + '</td>'
          + '<td>' + escapeHTML(degLvl) + '</td>'
          + '<td>' + escapeHTML(spec) + '</td>'
          + '<td>' + escapeHTML(degType) + '</td>'
          + '<td>' + escapeHTML(date) + '</td>'
          + '<td><span class="status-badge ' + badgeClass(regStatus) + '"><i class="fas fa-circle"></i> ' + regStatus + '</span></td>'
          + '<td><span class="status-badge ' + badgeClass(formStatus) + '"><i class="fas fa-circle"></i> ' + formStatus + '</span></td>'
          + '<td><span class="status-badge ' + badgeClass(degStatus) + '"><i class="fas fa-circle"></i> ' + degStatus + '</span></td>'
          + '</tr>';
      }).join("");
    });
  }

  /* ----------------------------------------------------------
     ADMIN MESSAGING
  ---------------------------------------------------------- */
  function loadAdminMessages() {
    var tbody = document.getElementById("adminMessagesBody");
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--ats);"><i class="fas fa-spinner fa-spin" style="margin-left:8px;"></i> جاري تحميل الرسائل...</td></tr>';

    var url = GSCRIPT_URL + "?action=getMessages";
    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (!res.success || !res.messages || res.messages.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--ats);">لا توجد رسائل</td></tr>';
          document.getElementById("totalMsgsCount").textContent = "0";
          document.getElementById("unreadMsgsCount").textContent = "0";
          document.getElementById("repliedMsgsCount").textContent = "0";
          return;
        }
        var msgs = res.messages;
        var total = msgs.length;
        var unread = msgs.filter(function(m) { return m["الحالة"] === "جديدة" || m["الحالة"] === "مقروءة"; }).length;
        var replied = msgs.filter(function(m) { return m["الحالة"] === "تم الرد"; }).length;
        document.getElementById("totalMsgsCount").textContent = total;
        document.getElementById("unreadMsgsCount").textContent = unread;
        document.getElementById("repliedMsgsCount").textContent = replied;

        tbody.innerHTML = msgs.map(function(m) {
          var hasReply = m["رد الموظف"] && m["رد الموظف"] !== "";
          var statusBadge = hasReply
            ? '<span class="status-badge status-approved"><i class="fas fa-circle"></i> تم الرد</span>'
            : '<span class="status-badge status-pending"><i class="fas fa-circle"></i> بانتظار الرد</span>';
          var date = (m["التاريخ"] || "").substring(0, 10);
          var msgId = escapeHTML(m["رقم الرسالة"] || "");
          var msgPreview = (m["الرسالة"] || "").substring(0, 80);
          if ((m["الرسالة"] || "").length > 80) msgPreview += "...";

          return '<tr>'
            + '<td><strong>' + escapeHTML(m["اسم المرسل"] || "غير معروف") + '</strong></td>'
            + '<td>' + escapeHTML(m["الرقم القومي"] || "") + '</td>'
            + '<td><strong>' + escapeHTML(m["العنوان"] || "") + '</strong></td>'
            + '<td style="max-width:250px;font-size:12px;color:var(--ats);">' + escapeHTML(msgPreview) + '</td>'
            + '<td>' + date + '</td>'
            + '<td>' + statusBadge + '</td>'
            + '<td><button class="btn btn-sm btn-primary" onclick="openReplyModal(\'' + msgId + '\')" ' + (hasReply ? 'title="عرض الرد"' : 'title="رد على الرسالة"') + '><i class="fas ' + (hasReply ? 'fa-eye' : 'fa-reply') + '"></i></button></td>'
            + '</tr>';
        }).join("");
      }).catch(function() {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--ats);">خطأ في تحميل الرسائل</td></tr>';
      });
  }

  window.openReplyModal = function(msgId) {
    var url = GSCRIPT_URL + "?action=getMessages";
    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (!res.success || !res.messages) return;
        var msg = res.messages.find(function(m) { return m["رقم الرسالة"] === msgId; });
        if (!msg) return;
        document.getElementById("replyFrom").value = msg["اسم المرسل"] || "";
        document.getElementById("replySubject").value = msg["العنوان"] || "";
        document.getElementById("replyOriginal").value = msg["الرسالة"] || "";
        var replyText = document.getElementById("replyText");
        if (msg["رد الموظف"] && msg["رد الموظف"] !== "") {
          replyText.value = msg["رد الموظف"];
          replyText.readOnly = true;
          document.getElementById("sendReplyBtn").style.display = "none";
        } else {
          replyText.value = "";
          replyText.readOnly = false;
          document.getElementById("sendReplyBtn").style.display = "";
        }
        replyText.setAttribute("data-msg-id", msgId);
        openModal("replyMessageModal");
      });
  };

  var sendReplyBtn = document.getElementById("sendReplyBtn");
  if (sendReplyBtn) {
    sendReplyBtn.addEventListener("click", function() {
      var replyText = document.getElementById("replyText");
      var msgId = replyText.getAttribute("data-msg-id");
      var reply = replyText.value.trim();
      if (!reply) {
        alert("يرجى كتابة الرد");
        return;
      }
      var user = getStaffUser();
      staffApiCall({
        action: "replyMessage",
        messageId: msgId,
        reply: reply,
        replyBy: user ? user.name : "الموظف"
      }).then(function(res) {
        if (res.success) {
          closeModal("replyMessageModal");
          loadAdminMessages();
          showToast("تم إرسال الرد بنجاح", "success");
        } else {
          alert(res.message || "حدث خطأ");
        }
      }).catch(function() {
        alert("خطأ في الاتصال بالخادم");
      });
    });
  }

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */
  function init() {
    try { initSidebar(); } catch(e) {}
    try { initNavigation(); } catch(e) {}
    try { initDarkMode(); } catch(e) {}
    try { initMobileClose(); } catch(e) {}
    try { initDropdowns(); } catch(e) {}
    try { initPermissionCheckboxes(); } catch(e) {}
  }

  function initPermissionCheckboxes() {
    var permChecks = document.querySelectorAll("#staffModal .permissions-grid input[type=checkbox]");
    permChecks.forEach(function(c){
      c.addEventListener("change", function(){
        if (c.checked) {
          c.closest(".permission-item").classList.add("checked");
        } else {
          c.closest(".permission-item").classList.remove("checked");
        }
      });
    });

    var overlays = document.querySelectorAll(".modal-overlay");
    overlays.forEach(function(overlay){
      overlay.addEventListener("click", function(e){
        if (e.target === overlay) {
          overlay.classList.remove("show");
          document.body.style.overflow = "";
        }
      });
    });
  }

  function initDropdowns() {
    var notifBtn = document.getElementById("notifBtn");
    var notifDrop = document.getElementById("notifDropdown");
    var userBtn = document.getElementById("userDropdownBtn");
    var userDrop = document.getElementById("userDropdown");

    if (notifBtn && notifDrop) {
      notifBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        notifDrop.classList.toggle("show");
        if (userDrop) userDrop.classList.remove("show");
      });
    }
    if (userBtn && userDrop) {
      userBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        userDrop.classList.toggle("show");
        if (notifDrop) notifDrop.classList.remove("show");
      });
    }
    document.addEventListener("click", function() {
      if (notifDrop) notifDrop.classList.remove("show");
      if (userDrop) userDrop.classList.remove("show");
    });
  }

  /* Boot: check if staff user exists */
  var staffUser = getStaffUser();
  if (staffUser) {
    showStaffDashboard();
    var bootPerms = [];
    try { bootPerms = JSON.parse(staffUser.permissions || "[]"); } catch(e) { bootPerms = []; }
    var isAdmin = staffUser.role === "admin" || staffUser.roleName === "admin" || staffUser.role === "مدير النظام" || staffUser.roleName === "مدير النظام";
    if (isAdmin && bootPerms.length === 0) bootPerms = Object.keys(PERM_LABELS);
    applyRolePermissions(bootPerms);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { init(); loadStaffList(); loadDashboard(); });
    } else {
      init();
      loadStaffList();
      loadDashboard();
    }
  } else {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", showStaffLogin);
    } else {
      showStaffLogin();
    }
  }
})();
