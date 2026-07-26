/**
 * Graduate Studies – Faculty of Sports Science
 * Main Application JavaScript
 */

(function () {
  "use strict";

  const STORAGE_KEYS = {
    applications: "gs_applications",
    documents: "gs_documents",
    theme: "gs_theme",
    portalUser: "gs_portal_user",
  };

  // ==================== Google Apps Script URL ====================
  // بعد نشر Apps Script، الصق الرابط هنا
  var GSCRIPT_URL = "https://script.google.com/macros/s/AKfycbx-hF1MlFqgIlvWVCD-jr_IEGbD2Khcpj6gD5WoeiMEn_fj0fj3JVnlRrHUhPI-RzZy/exec";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function generateApplicationNumber() {
    const apps = getApplications();
    const year = new Date().getFullYear();
    const next = String(apps.length + 1).padStart(4, "0");
    return "GS-" + year + "-" + next;
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ===== 1. PRELOADER ===== */
  function initPreloader() {
    const preloader = $("#preloader");
    if (!preloader) return;
    preloader.classList.add("hidden");
    setTimeout(function () { preloader.style.display = "none"; }, 600);
  }

  /* ===== 2. NAVIGATION ===== */
  function initNavigation() {
    const navbar = $("#navbar");
    const navMenu = $("#navMenu");
    const hamburger = $("#hamburger");
    const navLinks = $$(".nav-link");
    const pageTransition = $("#pageTransition");

    navLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var href = link.getAttribute("href");
        // If it's an anchor link (#section), scroll smoothly
        if (href && href.startsWith("#")) {
          e.preventDefault();
          var target = $(href);
          if (target) {
            var offset = navbar ? navbar.offsetHeight : 0;
            smoothScrollTo(target.offsetTop - offset, 600);
          }
          if (navMenu) navMenu.classList.remove("active");
          if (hamburger) hamburger.classList.remove("active");
        } else if (href && (href.endsWith(".html") || href.endsWith("/"))) {
          // Navigate immediately
          if (navMenu) navMenu.classList.remove("active");
          if (hamburger) hamburger.classList.remove("active");
          window.location.href = href;
        }
      });
    });

    function highlightActiveLink() {
      var scrollPos = window.scrollY + 150;
      var currentPage = window.location.pathname.split("/").pop() || "index.html";
      navLinks.forEach(function (l) {
        var href = l.getAttribute("href") || "";
        var page = href.split("/").pop();
        if (page === currentPage) {
          l.classList.add("active");
        } else {
          l.classList.remove("active");
        }
      });
    }

    function handleNavbarScroll() {
      if (!navbar) return;
      if (window.scrollY > 100) { navbar.classList.add("scrolled"); }
      else { navbar.classList.remove("scrolled"); }
    }

    if (hamburger && navMenu) {
      hamburger.addEventListener("click", function () {
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");
      });
    }

    window.addEventListener("scroll", function () {
      highlightActiveLink();
      handleNavbarScroll();
      handleBackToTop();
    });

    highlightActiveLink();
    handleNavbarScroll();

    // Handle ALL internal page links (footer, quick-links, etc.)
    document.querySelectorAll('a[href]').forEach(function (link) {
      if (link.classList.contains('nav-link')) return;
      var href = link.getAttribute('href');
      if (href && (href.endsWith('.html') || href.endsWith('/')) && !href.startsWith('http') && !href.startsWith('#')) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          window.location.href = href;
        });
      }
    });
  }

  /* ===== 3. THEME TOGGLE ===== */
  function initTheme() {
    var toggleBtn = $("#themeToggle");
    var saved = localStorage.getItem(STORAGE_KEYS.theme);
    if (saved) document.body.setAttribute("data-theme", saved);

    if (!toggleBtn) return;
    toggleBtn.addEventListener("click", function () {
      var current = document.body.getAttribute("data-theme");
      var next = current === "dark" ? "light" : "dark";
      document.body.setAttribute("data-theme", next);
      localStorage.setItem(STORAGE_KEYS.theme, next);
      var icon = toggleBtn.querySelector("i");
      if (icon) {
        icon.className = next === "dark" ? "fas fa-sun" : "fas fa-moon";
      }
    });
  }

  /* ===== 4. HERO STATS COUNTER ===== */
  function initStatsCounter() {
    var counters = $$(".stat-number");
    if (!counters.length) return;
    var animated = false;

    function animateCount(el) {
      var target = parseInt(el.getAttribute("data-count") || el.textContent, 10);
      var duration = 2000;
      var step = Math.max(1, Math.floor(target / (duration / 16)));
      var current = 0;
      var timer = setInterval(function () {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = current.toLocaleString("ar-EG");
      }, 16);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !animated) {
          animated = true;
          counters.forEach(animateCount);
        }
      });
    }, { threshold: 0.3 });

    var statsSection = $(".hero-stats");
    if (statsSection) observer.observe(statsSection);
  }

  /* ===== 5. PROGRAMS TABS ===== */
  function initTabs() {
    var tabBtns = $$(".tab-btn");
    var tabContents = $$(".tab-content");
    if (!tabBtns.length) return;

    tabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-tab");
        tabBtns.forEach(function (b) { b.classList.remove("active"); });
        tabContents.forEach(function (p) { p.classList.remove("active"); });
        btn.classList.add("active");
        var panel = $("#" + target);
        if (panel) panel.classList.add("active");
      });
    });
  }

  /* ===== 6. MULTI-STEP APPLICATION FORM ===== */
  var currentFormStep = 1;
  var totalFormSteps = 5;

  function showFormStep(step) {
    $$(".form-step").forEach(function (s) { s.classList.remove("active"); });
    var target = $("#formStep" + step);
    if (target) target.classList.add("active");

    $$(".steps-container .step").forEach(function (ind) {
      var s = parseInt(ind.getAttribute("data-step"), 10);
      ind.classList.remove("active", "completed");
      if (s === step) ind.classList.add("active");
      if (s < step) ind.classList.add("completed");
    });

    currentFormStep = step;

    if (step === 5) buildSummary();
  }

  function validateFormStep(step) {
    var stepEl = $("#formStep" + step);
    if (!stepEl) return true;
    var required = $$("[required]", stepEl);
    var valid = true;

    required.forEach(function (field) {
      removeFieldError(field);
      if (!field.value.trim()) {
        showFieldError(field, "هذا الحقل مطلوب");
        valid = false;
      } else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        showFieldError(field, "البريد الإلكتروني غير صحيح");
        valid = false;
      }
    });

    if (!valid) {
      showNotification("يرجى ملء جميع الحقول المطلوبة", "error");
    }
    return valid;
  }

  function showFieldError(field, msg) {
    field.style.borderColor = "#e74c3c";
    var err = field.parentNode.querySelector(".field-error");
    if (!err) {
      err = document.createElement("span");
      err.className = "field-error";
      err.style.cssText = "color:#e74c3c;font-size:0.8rem;margin-top:4px;display:block;";
      field.parentNode.appendChild(err);
    }
    err.textContent = msg;
  }

  function removeFieldError(field) {
    field.style.borderColor = "";
    var err = field.parentNode.querySelector(".field-error");
    if (err) err.remove();
  }

  /* Expose globally for inline onclick */
  window.nextStep = function (current) {
    if (!validateFormStep(current)) return;
    if (current < totalFormSteps) showFormStep(current + 1);
  };

  window.prevStep = function (current) {
    if (current > 1) showFormStep(current - 1);
  };

  window.toggleMastersFields = function (show) {
    var mastersFields = $("#mastersFields");
    if (mastersFields) mastersFields.style.display = show ? "block" : "none";
  };

  window.updateProgramOptions = function () {
    var programType = $("#programType");
    var programName = $("#programName");
    if (!programType || !programName) return;

    var mastersPrograms = ["المناهج وطرق التدريس التربية البدنية", "التدريب الرياضي وعلوم الحركة", "الإدارة الرياضية والترويح", "علوم الصحة"];
    var phdPrograms = ["المناهج وطرق التدريس التربية البدنية", "التدريب الرياضي وعلوم الحركة", "الإدارة الرياضية والترويح", "علوم الصحة"];

    var programs = programType.value === "masters" ? mastersPrograms : phdPrograms;
    programName.innerHTML = '<option value="">اختر البرنامج</option>';
    programs.forEach(function (p) {
      programName.innerHTML += '<option value="' + p + '">' + p + '</option>';
    });
  };

  function buildSummary() {
    var summaryPersonal = $("#summaryPersonal");
    var summaryQualifications = $("#summaryQualifications");
    var summaryProgram = $("#summaryProgram");
    var summaryDocuments = $("#summaryDocuments");

    if (summaryPersonal) {
      summaryPersonal.innerHTML =
        buildSummaryItem("الاسم", ($("#fullNameAr") || {}).value || "—") +
        buildSummaryItem("رقم الهوية", ($("#nationalId") || {}).value || "—") +
        buildSummaryItem("البريد", ($("#email") || {}).value || "—") +
        buildSummaryItem("الجوال", ($("#phone") || {}).value || "—") +
        buildSummaryItem("الجنسية", ($("#nationality") || {}).selectedOptions[0]?.text || "—") +
        buildSummaryItem("الجنس", ($("#gender") || {}).selectedOptions[0]?.text || "—");
    }

    if (summaryQualifications) {
      summaryQualifications.innerHTML =
        buildSummaryItem("البكالوريوس", ($("#bachelorDegree") || {}).value || "—") +
        buildSummaryItem("الجامعة", ($("#bachelorUniversity") || {}).value || "—") +
        buildSummaryItem("سنة التخرج", ($("#bachelorYear") || {}).value || "—") +
        buildSummaryItem("التقدير", ($("#bachelorGrade") || {}).selectedOptions[0]?.text || "—");
    }

    if (summaryProgram) {
      summaryProgram.innerHTML =
        buildSummaryItem("نوع البرنامج", ($("#programType") || {}).selectedOptions[0]?.text || "—") +
        buildSummaryItem("البرنامج", ($("#programName") || {}).value || "—") +
        buildSummaryItem("الفصل", ($("#semester") || {}).selectedOptions[0]?.text || "—");
    }

    if (summaryDocuments) {
      summaryDocuments.innerHTML = '<p style="color:#666;">تم رفع المستندات بنجاح. يمكنك مراجعتها من بوابة الباحث بعد التسجيل.</p>';
    }
  }

  function buildSummaryItem(label, value) {
    return '<div class="summary-item"><span class="summary-label">' + label + ':</span> <span class="summary-value">' + escapeHTML(String(value)) + '</span></div>';
  }

  window.submitForm = function () {
    var agreeTerms = $("#agreeTerms");
    var agreeRules = $("#agreeRules");

    if (!agreeTerms || !agreeTerms.checked) {
      showNotification("يجب الموافقة على البيانات الصحيحة", "error");
      return;
    }
    if (!agreeRules || !agreeRules.checked) {
      showNotification("يجب الالتزام بقواعد الكلية", "error");
      return;
    }

    var data = {
      id: generateId(),
      applicationNumber: generateApplicationNumber(),
      fullNameAr: ($("#fullNameAr") || {}).value || "",
      fullNameEn: ($("#fullNameEn") || {}).value || "",
      nationalId: ($("#nationalId") || {}).value || "",
      birthDate: ($("#birthDate") || {}).value || "",
      nationality: ($("#nationality") || {}).value || "",
      gender: ($("#gender") || {}).value || "",
      phone: ($("#phone") || {}).value || "",
      email: ($("#email") || {}).value || "",
      address: ($("#address") || {}).value || "",
      bachelorDegree: ($("#bachelorDegree") || {}).value || "",
      bachelorUniversity: ($("#bachelorUniversity") || {}).value || "",
      bachelorYear: ($("#bachelorYear") || {}).value || "",
      mastersDegree: ($("#mastersDegree") || {}).value || "",
      mastersUniversity: ($("#mastersUniversity") || {}).value || "",
      experience: ($("#experience") || {}).value || "",
      publications: ($("#publications") || {}).value || "",
      programType: ($("#programType") || {}).value || "",
      programName: ($("#programName") || {}).value || "",
      semester: ($("#semester") || {}).value || "",
      programNotes: ($("#programNotes") || {}).value || "",
      uploadedDocs: window._uploadedDocs || {},
      status: "registration",
      submittedAt: new Date().toISOString(),
    };

    saveApplication(data);

    // Update portal user with application number
    var portalUser = null;
    try { portalUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.portalUser)); } catch (e) { }
    if (portalUser) {
      portalUser.applicationNumber = data.applicationNumber;
      portalUser.fullName = data.fullNameAr;
      portalUser.status = data.status;
      localStorage.setItem(STORAGE_KEYS.portalUser, JSON.stringify(portalUser));
    }

    showNotification("تم تسجيل طلبك بنجاح! رقم الطلب: " + data.applicationNumber, "success");

    setTimeout(function () {
      if (portalUser) {
        // Redirect to portal dashboard
        window.location.href = "portal.html";
      } else {
        showFormStep(1);
        var form = $(".form-container");
        if (form) {
          var inputs = form.querySelectorAll("input, select, textarea");
          inputs.forEach(function (input) {
            if (input.type === "radio" || input.type === "checkbox") { input.checked = false; }
            else { input.value = ""; }
          });
        }
        var mastersFields = $("#mastersFields");
        if (mastersFields) mastersFields.style.display = "none";
      }
    }, 1500);
  };

  function initApplicationForm() {
    showFormStep(1);

    /* Real-time validation on blur */
    $$(".form-container input, .form-container select, .form-container textarea").forEach(function (field) {
      field.addEventListener("blur", function () {
        removeFieldError(field);
        if (field.hasAttribute("required") && !field.value.trim()) {
          showFieldError(field, "هذا الحقل مطلوب");
        }
      });
      field.addEventListener("input", function () {
        if (field.style.borderColor === "rgb(231, 76, 60)" && field.value.trim()) {
          removeFieldError(field);
        }
      });
    });
  }

  /* ===== 7. DOCUMENT UPLOAD ===== */
  function initDocumentUpload() {
    $$(".upload-zone").forEach(function (zone) {
      var input = $("input[type='file']", zone);
      var statusEl = zone.nextElementSibling;

      zone.addEventListener("click", function (e) {
        if (e.target.tagName !== "INPUT" && input) input.click();
      });

      zone.addEventListener("dragover", function (e) {
        e.preventDefault();
        zone.classList.add("drag-over");
      });

      zone.addEventListener("dragleave", function () {
        zone.classList.remove("drag-over");
      });

      zone.addEventListener("drop", function (e) {
        e.preventDefault();
        zone.classList.remove("drag-over");
        if (input && e.dataTransfer.files.length) {
          input.files = e.dataTransfer.files;
          handleUploadFile(input, zone, statusEl);
        }
      });

      if (input) {
        input.addEventListener("change", function () {
          handleUploadFile(input, zone, statusEl);
        });
      }
    });

    function handleUploadFile(input, zone, statusEl) {
      if (!input.files || !input.files.length) return;
      var file = input.files[0];
      var maxSize = 5 * 1024 * 1024;

      if (file.size > maxSize) {
        if (statusEl) {
          statusEl.innerHTML = '<span style="color:#e74c3c;"><i class="fas fa-times-circle"></i> حجم الملف يتجاوز 5MB</span>';
          statusEl.style.display = "block";
        }
        return;
      }

      var sizeMB = (file.size / (1024 * 1024)).toFixed(2);

      // Show uploading state
      zone.innerHTML = '<input type="file" hidden><i class="fas fa-spinner fa-spin" style="color:#f39c12;font-size:1.5rem;"></i><span style="color:#f39c12;font-weight:600;">جاري الرفع...</span>';
      zone.style.borderColor = "#f39c12";
      zone.style.background = "#fffde7";

      if (statusEl) {
        statusEl.innerHTML = '<span style="color:#f39c12;"><i class="fas fa-spinner fa-spin"></i> جاري رفع الملف على Google Drive...</span>';
        statusEl.style.display = "block";
      }

      var docKey = zone.getAttribute("data-doc");

      // Send to Google Apps Script
      if (GSCRIPT_URL) {
        uploadToDrive(file, docKey, zone, statusEl);
      } else {
        // Fallback: local only
        showLocalUpload(zone, statusEl, file, sizeMB, docKey);
      }
    }

    function showLocalUpload(zone, statusEl, file, sizeMB, docKey) {
      zone.innerHTML = '<input type="file" hidden><i class="fas fa-file-check" style="color:#27ae60;font-size:1.5rem;"></i><span style="color:#27ae60;font-weight:600;">' + escapeHTML(file.name) + '</span><span style="color:#666;font-size:0.85rem;">' + sizeMB + ' MB</span>';
      zone.style.borderColor = "#27ae60";
      zone.style.background = "#f0fff4";
      if (statusEl) {
        statusEl.innerHTML = '<span style="color:#27ae60;"><i class="fas fa-check-circle"></i> تم الرفع بنجاح</span>';
        statusEl.style.display = "block";
      }
      if (docKey) {
        if (!window._uploadedDocs) window._uploadedDocs = {};
        window._uploadedDocs[docKey] = true;
      }
    }

    function uploadToDrive(file, docKey, zone, statusEl) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var base64 = e.target.result.split(",")[1];
        var user = null;
        try { user = JSON.parse(localStorage.getItem(STORAGE_KEYS.portalUser)); } catch (err) { }

        var apps = [];
        try { apps = JSON.parse(localStorage.getItem(STORAGE_KEYS.applications)) || []; } catch (err) { }
        var app = null;
        if (user) {
          for (var i = apps.length - 1; i >= 0; i--) {
            if (apps[i].nationalId === user.nationalId) { app = apps[i]; break; }
          }
        }

        var payload = {
          action: "upload",
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
          researcherName: user ? (user.fullName || user.username) : "غير محدد",
          nationalId: user ? user.nationalId : "غير محدد",
          docType: docKey || "عام",
          email: app ? app.email : "",
          phone: app ? app.phone : "",
          college: app ? app.college : "",
          currentDegree: app ? app.currentDegree : "",
          specialization: app ? app.specialization : "",
          degreeType: app ? app.degreeType : "",
          titleAr: app ? app.titleAr : "",
          titleEn: app ? app.titleEn : "",
          supervisor1: app ? app.supervisor1 : "",
          supervisor2: app ? app.supervisor2 : "",
          abstractText: app ? app.abstract : "",
          applicationNumber: app ? app.applicationNumber : "",
          submittedAt: app ? app.submittedAt : ""
        };

        fetch(GSCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
          .then(function (res) {
            showLocalUpload(zone, statusEl, file, (file.size / (1024 * 1024)).toFixed(2), docKey);
            if (statusEl) {
              statusEl.innerHTML = '<span style="color:#27ae60;"><i class="fas fa-check-circle"></i> تم الرفع على Google Drive بنجاح</span>';
            }
          })
          .catch(function (err) {
            showLocalUpload(zone, statusEl, file, (file.size / (1024 * 1024)).toFixed(2), docKey);
            if (statusEl) {
              statusEl.innerHTML = '<span style="color:#f39c12;"><i class="fas fa-exclamation-triangle"></i> تم الحفظ محلياً - سيتم الرفع لاحقاً</span>';
            }
          });
      };
      reader.readAsDataURL(file);
    }
  }

  /* ===== 8. RESEARCHER PORTAL ===== */
  function initPortal() {
    var loginSection = $("#loginForm");
    var registerSection = $("#portalRegister");
    var dashboardSection = $("#portalDashboard");

    /* Show/Hide sections */
    window.showPortalSection = function (sectionId) {
      if (loginSection) loginSection.style.display = "none";
      if (registerSection) registerSection.style.display = "none";
      if (dashboardSection) dashboardSection.style.display = "none";
      var target = $("#" + sectionId);
      if (target) target.style.display = "block";
    };

    window.showRegisterForm = function () { showPortalSection("portalRegister"); };
    window.showLoginForm = function () { showPortalSection("loginForm"); };

    /* Check if already logged in */
    var user = getPortalUser();
    if (user && loginSection && dashboardSection) {
      showPortalSection("portalDashboard");
      showPortalDashboard(user);
    }

    /* Toggle password visibility */
    $$(".toggle-password").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var input = btn.parentElement.querySelector("input");
        if (!input) return;
        var icon = btn.querySelector("i");
        if (input.type === "password") {
          input.type = "text";
          if (icon) icon.className = "fas fa-eye-slash";
        } else {
          input.type = "password";
          if (icon) icon.className = "fas fa-eye";
        }
      });
    });

    /* Register form submit */
    var registerForm = $("#portalRegisterForm");
    if (registerForm) {
      registerForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var firstName = ($("#regFirstName") || {}).value || "";
        var lastName = ($("#regLastName") || {}).value || "";
        var email = ($("#regEmail") || {}).value || "";
        var phone = ($("#regPhone") || {}).value || "";
        var nationalId = ($("#regNationalId") || {}).value || "";
        var password = ($("#regPassword") || {}).value || "";
        var passwordConfirm = ($("#regConfirmPassword") || {}).value || "";

        if (!firstName || !lastName || !email || !password) {
          showNotification("يرجى ملء جميع الحقول", "error");
          return;
        }

        if (nationalId && nationalId.length !== 14) {
          showNotification("رقم الهوية الوطنية يجب أن يكون 14 رقماً", "error");
          return;
        }

        if (password.length < 6) {
          showNotification("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
          return;
        }

        if (password !== passwordConfirm) {
          showNotification("كلمتا المرور غير متطابقتين", "error");
          return;
        }

        var users = getUsers();
        var exists = users.find(function (u) {
          return u.email === email || (nationalId && u.nationalId === nationalId);
        });

        if (exists) {
          showNotification("البريد الإلكتروني أو رقم الهوية مسجل بالفعل", "error");
          return;
        }

        var username = firstName + " " + lastName;
        var newUser = {
          id: generateId(),
          username: username,
          firstName: firstName,
          lastName: lastName,
          nationalId: nationalId,
          email: email,
          phone: phone,
          password: password,
          createdAt: new Date().toISOString(),
        };

        users.push(newUser);
        localStorage.setItem("gs_users", JSON.stringify(users));

        registerForm.reset();

        showNotification("تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن", "success");

        setTimeout(function () {
          showLoginForm();
          var loginEmail = $("#loginEmail");
          if (loginEmail) loginEmail.value = email;
        }, 1500);
      });
    }

    /* Login form submit */
    var loginFormEl = $("#portalLoginForm");
    if (loginFormEl) {
      loginFormEl.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = ($("#loginEmail") || {}).value || "";
        var password = ($("#loginPassword") || {}).value || "";

        if (!email || !password) {
          showNotification("يرجى إدخال البريد الإلكتروني وكلمة المرور", "error");
          return;
        }

        var users = getUsers();
        var user = users.find(function (u) {
          return (u.email === email || u.username === email) && u.password === password;
        });

        if (!user) {
          showNotification("البريد الإلكتروني أو كلمة المرور غير صحيحة", "error");
          return;
        }

        var apps = getApplications();
        var app = apps.find(function (a) {
          return a.nationalId === user.nationalId;
        });

        var portalUser = {
          userId: user.id,
          username: user.username,
          nationalId: user.nationalId,
          email: user.email,
          applicationNumber: app ? app.applicationNumber : null,
          fullName: app ? app.fullNameAr : user.username,
          status: app ? app.status : "no_application",
        };
        localStorage.setItem(STORAGE_KEYS.portalUser, JSON.stringify(portalUser));

        showNotification("مرحباً " + user.username + "! تم تسجيل الدخول بنجاح", "success");

        setTimeout(function () {
          showPortalSection("portalDashboard");
          showPortalDashboard(portalUser);
        }, 500);
      });
    }

    window.handleLogout = function () {
      localStorage.removeItem(STORAGE_KEYS.portalUser);
      showPortalSection("loginForm");
      showNotification("تم تسجيل الخروج", "success");
    };

    /* Forgot Password */
    window.handleForgotPassword = function () {
      var step2 = document.getElementById("forgotStep2");
      var errEl = document.getElementById("forgotError");
      var sucEl = document.getElementById("forgotSuccess");
      var btn = document.getElementById("forgotSubmitBtn");

      if (errEl) errEl.style.display = "none";
      if (sucEl) sucEl.style.display = "none";

      if (!step2 || step2.style.display === "none") {
        var email = (document.getElementById("forgotEmail") || {}).value || "";
        var natId = (document.getElementById("forgotNationalId") || {}).value || "";

        if (!email || !natId) {
          if (errEl) { errEl.textContent = "يرجى إدخال البريد الإلكتروني والرقم القومي"; errEl.style.display = "block"; }
          return;
        }

        var users = getUsers();
        var user = users.find(function (u) {
          return u.email === email && u.nationalId === natId;
        });

        if (!user) {
          if (errEl) { errEl.textContent = "البريد الإلكتروني أو الرقم القومي غير صحيح"; errEl.style.display = "block"; }
          return;
        }

        step2.style.display = "block";
        btn.textContent = "إعادة التعيين";
        return;
      }

      var newPass = (document.getElementById("forgotNewPassword") || {}).value || "";
      var confirmPass = (document.getElementById("forgotConfirmPassword") || {}).value || "";

      if (!newPass || newPass.length < 6) {
        if (errEl) { errEl.textContent = "كلمة المرور يجب أن تكون 6 أحرف على الأقل"; errEl.style.display = "block"; }
        return;
      }

      if (newPass !== confirmPass) {
        if (errEl) { errEl.textContent = "كلمتا المرور غير متطابقتين"; errEl.style.display = "block"; }
        return;
      }

      var email2 = (document.getElementById("forgotEmail") || {}).value || "";
      var natId2 = (document.getElementById("forgotNationalId") || {}).value || "";
      var users2 = getUsers();
      var idx = users2.findIndex(function (u) {
        return u.email === email2 && u.nationalId === natId2;
      });

      if (idx === -1) {
        if (errEl) { errEl.textContent = "حدث خطأ، حاول مرة أخرى"; errEl.style.display = "block"; }
        return;
      }

      users2[idx].password = newPass;
      localStorage.setItem("gs_users", JSON.stringify(users2));

      if (sucEl) { sucEl.textContent = "تم إعادة تعيين كلمة المرور بنجاح! يمكنك تسجيل الدخول الآن"; sucEl.style.display = "block"; }
      btn.style.display = "none";

      setTimeout(function () {
        document.getElementById("forgotPasswordModal").style.display = "none";
        btn.style.display = "";
        btn.textContent = "التحقق";
        step2.style.display = "none";
        (document.getElementById("forgotEmail") || {}).value = "";
        (document.getElementById("forgotNationalId") || {}).value = "";
        (document.getElementById("forgotNewPassword") || {}).value = "";
        (document.getElementById("forgotConfirmPassword") || {}).value = "";
      }, 2500);
    };

    window.handleHeroPortal = function () {
      window.location.href = "pages/portal.html";
    };

    /* Dashboard sidebar tabs */
    $$(".sidebar-item").forEach(function (item) {
      item.addEventListener("click", function () {
        var tabId = item.getAttribute("data-tab");
        $$(".sidebar-item").forEach(function (i) { i.classList.remove("active"); });
        $$(".dashboard-tab").forEach(function (t) { t.classList.remove("active"); });
        item.classList.add("active");
        var tab = $("#" + tabId);
        if (tab) tab.classList.add("active");
        if (tabId === "dashboard-messages") loadStudentMessages();
      });
    });

    function showPortalDashboard(user) {
      var nameEl = $("#dashboardUserName");
      var idEl = $("#dashboardUserId");
      if (nameEl) nameEl.textContent = user.fullName || user.username || "الباحث";
      if (idEl) idEl.textContent = "رقم الطلب: " + (user.applicationNumber || "لم يُقدم بعد");

      /* Get full application data */
      var apps = getApplications();
      var app = apps.find(function (a) {
        return a.nationalId === user.nationalId;
      });

      if (!app) {
        var statusEl = document.querySelector(".dashboard-stats .status-badge");
        if (statusEl) {
          statusEl.textContent = "لم يتم التقديم";
          statusEl.className = "status-badge no-application";
        }
        var messagesEl = $("#portalMessages");
        if (messagesEl) {
          messagesEl.innerHTML = '<div style="text-align:center;padding:30px;color:#888;"><i class="fas fa-info-circle" style="font-size:2rem;margin-bottom:10px;display:block;color:var(--color-primary);"></i>ستظهر الرسائل والإشعارات هنا بعد تقديم الطلب</div>';
        }
      }

      var submittedDate = app && app.submittedAt ? new Date(app.submittedAt).toLocaleDateString("ar-EG") : null;

      /* Update status badge */
      var statusEl = document.querySelector(".dashboard-stats .status-badge");
      if (statusEl) {
        var statusLabels = {
          registration: "مرحلة التسجيل",
          formation: "مرحلة التشكيل",
          degree: "مرحلة منح الدرجة",
        };
        statusEl.textContent = statusLabels[app ? app.status : "registration"] || "بانتظار التقديم";
        statusEl.className = "status-badge " + (app ? app.status : "registration");
      }

      /* Build Apply Form */
      var applyContainer = $("#portalApplyContainer");
      if (applyContainer) {
        if (app) {
          applyContainer.innerHTML = '<div class="dash-box"><div class="dash-box-body" style="text-align:center;padding:30px;"><i class="fas fa-check-circle" style="font-size:2.5rem;color:#27ae60;margin-bottom:12px;display:block;"></i><h3 style="margin-bottom:8px;color:var(--text-primary);">تم تقديم طلبك بنجاح</h3><p style="color:var(--text-secondary);margin-bottom:6px;">رقم الطلب: <strong style="color:var(--color-primary)">' + (app.applicationNumber || "—") + '</strong></p><p style="color:var(--text-secondary);">نوع الطلب: <strong>' + (app.degreeType === "phd" ? "دكتوراه" : "ماجستير") + '</strong></p><p style="color:var(--text-secondary);margin-top:12px;font-size:.85rem;">يمكنك متابعة حالة طلبك من تبويب <strong>تتبع الطلب</strong></p></div></div>';
        } else {
          applyContainer.innerHTML =
            '<form id="portalApplyForm">' +
            '<div class="dash-box" style="margin-bottom:20px">' +
            '<div class="dash-box-header"><i class="fas fa-graduation-cap" style="margin-left:8px;color:var(--color-primary)"></i>نوع الدرجة العلمية</div>' +
            '<div class="dash-box-body">' +
            '<div style="display:flex;gap:16px;flex-wrap:wrap;">' +
            '<label style="flex:1;min-width:200px;display:flex;align-items:center;gap:12px;padding:16px 20px;border:2px solid var(--card-border);border-radius:12px;cursor:pointer;transition:all .2s;background:var(--bg-card);" class="degree-option" data-value="masters">' +
            '<input type="radio" name="degreeType" value="masters" required style="display:none">' +
            '<div style="width:44px;height:44px;border-radius:50%;background:rgba(var(--color-primary-rgb),.1);display:flex;align-items:center;justify-content:center;color:var(--color-primary);font-size:1.2rem;"><i class="fas fa-user-graduate"></i></div>' +
            '<div><div style="font-weight:700;font-size:.95rem;color:var(--text-primary);">ماجستير</div><div style="font-size:.8rem;color:var(--text-secondary);">Master Degree</div></div>' +
            '</label>' +
            '<label style="flex:1;min-width:200px;display:flex;align-items:center;gap:12px;padding:16px 20px;border:2px solid var(--card-border);border-radius:12px;cursor:pointer;transition:all .2s;background:var(--bg-card);" class="degree-option" data-value="phd">' +
            '<input type="radio" name="degreeType" value="phd" style="display:none">' +
            '<div style="width:44px;height:44px;border-radius:50%;background:rgba(39,174,96,.1);display:flex;align-items:center;justify-content:center;color:#27ae60;font-size:1.2rem;"><i class="fas fa-user-graduate"></i></div>' +
            '<div><div style="font-weight:700;font-size:.95rem;color:var(--text-primary);">دكتوراه</div><div style="font-size:.8rem;color:var(--text-secondary);">PhD Degree</div></div>' +
            '</label>' +
            '</div>' +
            '</div></div>' +

            '<div class="dash-box" style="margin-bottom:20px">' +
            '<div class="dash-box-header"><i class="fas fa-user" style="margin-left:8px;color:var(--color-primary)"></i>البيانات الأساسية</div>' +
            '<div class="dash-box-body">' +
            '<div class="form-row">' +
            '<div class="form-group"><label>الاسم بالكامل</label><div class="input-icon"><i class="fas fa-user"></i><input type="text" id="applyFullName" placeholder="الاسم الكامل" required></div></div>' +
            '<div class="form-group"><label>الرقم القومي</label><div class="input-icon"><i class="fas fa-id-card"></i><input type="text" id="applyNationalId" placeholder="14 رقم" maxlength="14" required></div></div>' +
            '</div>' +
            '<div class="form-row">' +
            '<div class="form-group"><label>البريد الإلكتروني</label><div class="input-icon"><i class="fas fa-envelope"></i><input type="email" id="applyEmail" placeholder="البريد الإلكتروني" required></div></div>' +
            '<div class="form-group"><label>رقم الجوال</label><div class="input-icon"><i class="fas fa-phone"></i><input type="tel" id="applyPhone" placeholder="01XXXXXXXXX" required></div></div>' +
            '</div>' +
            '<div class="form-group"><label>الكلية / الجامعة الحالية</label><div class="input-icon"><i class="fas fa-university"></i><input type="text" id="applyCollege" placeholder="اسم الكلية أو الجامعة" required></div></div>' +
            '<div class="form-row">' +
            '<div class="form-group"><label>الدرجة العلمية الحالية</label><div class="input-icon"><i class="fas fa-medal"></i><select id="applyCurrentDegree" required><option value="">اختر...</option><option value="bachelor">بكالوريوس</option><option value="master">ماجستير</option></select></div></div>' +
            '<div class="form-group"><label>التخصص</label><div class="input-icon"><i class="fas fa-book"></i><input type="text" id="applySpecialization" placeholder="التخصص العلمي" required></div></div>' +
            '</div>' +
            '</div></div>' +

            '<div class="dash-box" style="margin-bottom:20px">' +
            '<div class="dash-box-header"><i class="fas fa-pen" style="margin-left:8px;color:var(--color-primary)"></i>بيانات البحث</div>' +
            '<div class="dash-box-body">' +
            '<div class="form-group"><label>عنوان البحث (عربي)</label><div class="input-icon"><i class="fas fa-language"></i><input type="text" id="applyTitleAr" placeholder="عنوان البحث بالعربية" required></div></div>' +
            '<div class="form-group"><label>عنوان البحث (إنجليزي)</label><div class="input-icon"><i class="fas fa-language"></i><input type="text" id="applyTitleEn" placeholder="Research Title in English" required></div></div>' +
            '<div class="form-row">' +
            '<div class="form-group"><label>اسم المشرف الأول</label><div class="input-icon"><i class="fas fa-user-tie"></i><input type="text" id="applySupervisor1" placeholder="اسم المشرف الرئيسي" required></div></div>' +
            '<div class="form-group"><label>اسم المشرف الثاني (إن وجد)</label><div class="input-icon"><i class="fas fa-user-tie"></i><input type="text" id="applySupervisor2" placeholder="اسم المشرف الثاني"></div></div>' +
            '</div>' +
            '<div class="form-group"><label>ملخص البحث</label><div class="input-icon" style="align-items:flex-start"><i class="fas fa-align-right" style="margin-top:10px"></i><textarea id="applyAbstract" rows="4" placeholder="ملخص مختصر عن موضوع البحث وأهميته" required style="width:100%;padding:10px 14px;border:1px solid var(--card-border);border-radius:8px;font-family:inherit;font-size:.9rem;background:var(--bg-card);color:var(--text-primary);resize:vertical;"></textarea></div></div>' +
            '</div></div>' +

            '<div style="text-align:center;padding:10px 0;">' +
            '<button type="submit" class="btn-submit" style="min-width:250px;"><i class="fas fa-paper-plane" style="margin-left:8px;"></i>تقديم الطلب</button>' +
            '</div>' +
            '</form>';
        }

        /* Degree option selection */
        applyContainer.querySelectorAll(".degree-option").forEach(function (opt) {
          opt.addEventListener("click", function () {
            applyContainer.querySelectorAll(".degree-option").forEach(function (o) {
              o.style.borderColor = "var(--card-border)";
              o.style.background = "var(--bg-card)";
            });
            opt.style.borderColor = "var(--color-primary)";
            opt.style.background = "rgba(var(--color-primary-rgb),.05)";
            var radio = opt.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
          });
        });

        /* Form submit */
        var applyForm = $("#portalApplyForm");
        if (applyForm) {
          applyForm.addEventListener("submit", function (e) {
            e.preventDefault();
            var degreeType = (applyForm.querySelector('input[name="degreeType"]:checked') || {}).value;
            if (!degreeType) {
              showNotification("يرجى اختيار نوع الدرجة العلمية", "error");
              return;
            }
            var fullName = ($("#applyFullName") || {}).value || "";
            var nationalId = ($("#applyNationalId") || {}).value || "";
            var email = ($("#applyEmail") || {}).value || "";
            var phone = ($("#applyPhone") || {}).value || "";
            var college = ($("#applyCollege") || {}).value || "";
            var currentDegree = ($("#applyCurrentDegree") || {}).value || "";
            var specialization = ($("#applySpecialization") || {}).value || "";
            var titleAr = ($("#applyTitleAr") || {}).value || "";
            var titleEn = ($("#applyTitleEn") || {}).value || "";
            var supervisor1 = ($("#applySupervisor1") || {}).value || "";
            var supervisor2 = ($("#applySupervisor2") || {}).value || "";
            var abstract_ = ($("#applyAbstract") || {}).value || "";

            if (!fullName || !nationalId || !email || !titleAr || !supervisor1) {
              showNotification("يرجى ملء جميع الحقول المطلوبة", "error");
              return;
            }
            if (nationalId.length !== 14) {
              showNotification("الرقم القومي يجب أن يكون 14 رقماً", "error");
              return;
            }

            var apps = getApplications();
            var exists = apps.find(function (a) { return a.nationalId === nationalId; });
            if (exists) {
              showNotification("لديك طلب مسجل بالفعل برقم " + exists.applicationNumber, "error");
              return;
            }

            var appNumber = "GS-" + new Date().getFullYear() + "-" + String(apps.length + 1).padStart(4, "0");
            var newApp = {
              id: generateId(),
              applicationNumber: appNumber,
              fullNameAr: fullName,
              nationalId: nationalId,
              email: email,
              phone: phone,
              college: college,
              currentDegree: currentDegree,
              specialization: specialization,
              degreeType: degreeType,
              titleAr: titleAr,
              titleEn: titleEn,
              supervisor1: supervisor1,
              supervisor2: supervisor2,
              abstract: abstract_,
              status: "registration",
              submittedAt: new Date().toISOString(),
              uploadedDocs: {}
            };
            apps.push(newApp);
            localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(apps));

            /* Update portal user */
            var portalUser = getPortalUser();
            if (portalUser) {
              portalUser.applicationNumber = appNumber;
              portalUser.fullName = fullName;
              portalUser.status = "registration";
              localStorage.setItem(STORAGE_KEYS.portalUser, JSON.stringify(portalUser));
            }

            showNotification("تم تقديم الطلب بنجاح! رقم الطلب: " + appNumber, "success");

            /* Send data to Google Sheet */
            if (GSCRIPT_URL) {
              var userDocs = getUploadedDocs(user.nationalId);
              var regCount = 0, formCount = 0, degCount = 0;
              var fileLinksArr = [];
              for (var k in userDocs) {
                if (k.indexOf("_") !== -1) continue;
                if (userDocs[k] === true || userDocs[k] === "accepted") {
                  if (k.indexOf("reg_") === 0) regCount++;
                  else if (k.indexOf("form_") === 0) formCount++;
                  else if (k.indexOf("deg_") === 0) degCount++;
                  var fn = userDocs[k + '_name'] || k;
                  var stageLabel = k.indexOf("reg_") === 0 ? "التسجيل" : k.indexOf("form_") === 0 ? "التشكيل" : "المنح";
                  fileLinksArr.push(stageLabel + ": " + fn);
                }
              }
              fetch(GSCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({
                  action: "saveResearcher",
                  applicationNumber: appNumber,
                  fullNameAr: fullName,
                  nationalId: nationalId,
                  email: email,
                  phone: phone,
                  college: college,
                  currentDegree: currentDegree,
                  specialization: specialization,
                  degreeType: degreeType,
                  titleAr: titleAr,
                  titleEn: titleEn,
                  supervisor1: supervisor1,
                  supervisor2: supervisor2,
                  abstract: abstract_,
                  submittedAt: new Date().toISOString(),
                  status: "registration",
                  regDocsCount: String(regCount) + "/10",
                  formDocsCount: String(formCount) + "/5",
                  degDocsCount: String(degCount) + "/4",
                  fileLinks: fileLinksArr.join("\n")
                })
              }).catch(function () {});
            }

            setTimeout(function () {
              var updatedUser = getPortalUser();
              showPortalDashboard(updatedUser || user);
            }, 500);
          });
        }
      }

      var statusOrder = ["registration", "formation", "degree"];
      var currentIdx = app ? statusOrder.indexOf(app.status) : -1;

      /* Build messages based on actual state */
      var messagesEl = $("#portalMessages");
      if (messagesEl && app) {
        var messages = [];
        messages.push({ icon: "fas fa-envelope", title: "تأكيد استلام الطلب", desc: "تم استلام طلبك وتسجيله برقم " + (app.applicationNumber || "-"), date: submittedDate || "-" });

        if (currentIdx >= 1) {
          messages.push({ icon: "fas fa-users", title: "مرحلة التشكيل", desc: "تم تشكيل اللجان ومراجعة ملفك", date: "-" });
        }
        if (currentIdx >= 2) {
          messages.push({ icon: "fas fa-graduation-cap", title: "مرحلة منح الدرجة", desc: "تم اعتماد منح الدرجة العلمية", date: "-" });
        }
        if (app.status === "degree") {
          messages.push({ icon: "fas fa-check-circle", title: "تمت منح الدرجة", desc: "مبروك! تمت منحك الدرجة العلمية بنجاح", date: "-" });
        }

        messagesEl.innerHTML = messages.map(function (m) {
          return '<div class="message-item unread"><div class="message-icon"><i class="' + m.icon + '"></i></div><div class="message-content"><h4>' + m.title + '</h4><p>' + m.desc + '</p><span class="message-date">' + m.date + '</span></div></div>';
        }).join("");
      }

      /* Build documents UI (stepper + docs with PDF upload) */
      var docsContainer = $("#portalDocsContainer");
      if (docsContainer) {
        var uploadedDocs = getUploadedDocs(user.nationalId);
        var docStages = [
          {
            key: "registration",
            title: "أوراق التسجيل",
            icon: "fas fa-clipboard-list",
            color: "var(--color-primary)",
            docs: [
              { key: "reg_translation", label: "ترجمة العنوان من مركز اللغات والترجمة", icon: "fas fa-language" },
              { key: "reg_patent", label: "براءة العنوان من المكتبة المركزية", icon: "fas fa-certificate" },
              { key: "reg_form", label: "استمارة التسجيل من الكلية", icon: "fas fa-file-signature" },
              { key: "reg_toefl", label: "شهادة التوفيل بتقدير 450 فما فوق", icon: "fas fa-graduation-cap" },
              { key: "reg_receipt", label: "إيصال مصاريف الأعوام المتتالية", icon: "fas fa-receipt" },
              { key: "reg_bachelor", label: "صورة شهادة البكالوريوس معتمدة", icon: "fas fa-file-pdf" },
              { key: "reg_master", label: "صور شهادة الماجستير (للدكتوراه)", icon: "fas fa-file-pdf" },
              { key: "reg_id", label: "صورة الهوية الوطنية أو الإقامة", icon: "fas fa-id-card" },
              { key: "reg_photo", label: "صور شخصية حديثة (خلفية بيضاء)", icon: "fas fa-image" },
              { key: "reg_recommendation", label: "خطاب التوصية من جامعتين (للدكتوراه)", icon: "fas fa-file-alt" },
            ]
          },
          {
            key: "formation",
            title: "أوراق التشكيل",
            icon: "fas fa-users-cog",
            color: "var(--color-primary)",
            docs: [
              { key: "form_papers", label: "عدد أبحاث نشر في الماجستير وبحثان في الدكتوراه", icon: "fas fa-flask" },
              { key: "form_citation", label: "الاقتباس من المكتبة المركزية", icon: "fas fa-book" },
              { key: "form_committee", label: "خطاب من القسم بأسماء السادة المشرفين والمناقصين", icon: "fas fa-file-alt" },
              { key: "form_upper", label: "موافقة لجنة الدراسات العليا", icon: "fas fa-stamp" },
              { key: "form_council", label: "موافقة مجلس الكلية", icon: "fas fa-stamp" },
            ]
          },
          {
            key: "degree",
            title: "أوراق منح الدرجة",
            icon: "fas fa-graduation-cap",
            color: "#27ae60",
            docs: [
              { key: "deg_digital", label: "إفادة من المكتبة الرقمية لتسليم الرسالة", icon: "fas fa-database" },
              { key: "deg_copy", label: "نسخة من الرسالة للكلية", icon: "fas fa-copy" },
              { key: "deg_reports", label: "كل تقارير يوم المناقشة", icon: "fas fa-file-contract" },
              { key: "deg_summary", label: "مستخلص عربي وإنجليزي", icon: "fas fa-language" },
            ]
          },
        ];

        var docHtml = '';

        /* Stepper */
        docHtml += '<div class="tracking-app-number">رقم الطلب: <strong>' + (app ? (app.applicationNumber || "—") : "لم يُقدم بعد") + '</strong></div>';
        docHtml += '<div class="tracking-stepper">';
        docStages.forEach(function (stage, idx) {
          var uploadedCount = 0;
          stage.docs.forEach(function (d) { if (uploadedDocs[d.key]) uploadedCount++; });
          var allDone = uploadedCount === stage.docs.length;
          var someDone = uploadedCount > 0;
          var stageClass = allDone ? "completed" : someDone ? "active" : "pending";
          var circleContent = allDone ? '<i class="fas fa-check"></i>' : (idx + 1);
          docHtml += '<div class="stepper-item ' + stageClass + '">';
          docHtml += '<div class="stepper-circle">' + circleContent + '</div>';
          docHtml += '<div class="stepper-label">' + stage.title + '</div>';
          docHtml += '</div>';
          if (idx < docStages.length - 1) {
            var lineClass = allDone ? "completed" : "pending";
            docHtml += '<div class="stepper-line ' + lineClass + '"></div>';
          }
        });
        docHtml += '</div>';

        /* Stage sections with docs + PDF upload */
        docStages.forEach(function (stage) {
          var uploadedCount = 0;
          stage.docs.forEach(function (d) { if (uploadedDocs[d.key]) uploadedCount++; });
          var progressPct = Math.round((uploadedCount / stage.docs.length) * 100);

          docHtml += '<div class="doc-stage-block">';
          docHtml += '<div class="doc-stage-header"><div class="doc-stage-title"><i class="' + stage.icon + '" style="color:' + stage.color + '"></i><span>' + stage.title + '</span></div><span style="font-size:.8rem;font-weight:600;color:var(--text-secondary)">' + uploadedCount + '/' + stage.docs.length + '</span></div>';
          docHtml += '<div class="doc-stage-progress"><div class="doc-stage-progress-fill" style="width:' + progressPct + '%;background:' + stage.color + '"></div></div>';

          stage.docs.forEach(function (doc) {
            var isUploaded = uploadedDocs[doc.key] === true || uploadedDocs[doc.key] === "accepted";
            var fileName = uploadedDocs[doc.key + '_name'] || null;
            var hasFile = uploadedDocs[doc.key + '_data'] ? true : false;
            var fileLink = fileName && hasFile
              ? '<a href="#" class="doc-file-link" data-doc-key="' + doc.key + '" style="color:var(--color-primary);text-decoration:underline;cursor:pointer;font-size:.8rem;">(' + fileName + ')</a>'
              : (fileName ? ' <small style="color:var(--text-secondary)">(' + fileName + ')</small>' : '');
            var statusBadge = isUploaded
              ? '<span class="doc-status done"><i class="fas fa-check-circle"></i> تم الرفع</span>'
              : '<span class="doc-status pending"><i class="fas fa-times-circle"></i> لم يتم الرفع</span>';
            var uploadIcon = isUploaded
              ? '<label class="doc-btn-upload uploaded" for="doc-upload-' + doc.key + '" title="إعادة رفع ملف PDF"><i class="fas fa-sync-alt"></i></label><input type="file" id="doc-upload-' + doc.key + '" data-doc-key="' + doc.key + '" accept=".pdf" style="display:none">'
              : '<label class="doc-btn-upload" for="doc-upload-' + doc.key + '" title="رفع ملف PDF"><i class="fas fa-file-pdf"></i></label><input type="file" id="doc-upload-' + doc.key + '" data-doc-key="' + doc.key + '" accept=".pdf" style="display:none">';

            docHtml += '<div class="doc-row">';
            docHtml += '<div class="doc-row-info"><i class="' + doc.icon + '"></i><span>' + doc.label + ' ' + fileLink + '</span></div>';
            docHtml += '<div class="doc-row-actions">' + statusBadge + uploadIcon + '</div>';
            docHtml += '</div>';
          });

          docHtml += '</div>';
        });

        docsContainer.innerHTML = docHtml;

        function getDocStage(docKey) {
          if (docKey.indexOf("reg_") === 0) return "registration";
          if (docKey.indexOf("form_") === 0) return "formation";
          if (docKey.indexOf("deg_") === 0) return "degree";
          return "registration";
        }

        /* Attach upload listeners */
        docsContainer.querySelectorAll('input[type="file"]').forEach(function (input) {
          input.addEventListener("change", function () {
            var file = input.files[0];
            if (!file) return;
            var docKey = input.getAttribute("data-doc-key");
            if (file.size > 10 * 1024 * 1024) {
              showNotification("حجم الملف يتجاوز 10MB", "error");
              return;
            }
            if (GSCRIPT_URL) {
              showNotification("جاري رفع الملف...", "info");
              var reader = new FileReader();
              reader.onload = function (ev) {
                var base64Full = ev.target.result;
                var base64Data = base64Full.split(",")[1];
                var stage = getDocStage(docKey);
                var oldFileName = uploadedDocs[docKey + '_name'] || "";
              fetch(GSCRIPT_URL, {
                  method: "POST",
                  mode: "no-cors",
                  body: JSON.stringify({
                    action: "upload",
                    fileName: file.name,
                    fileData: base64Data,
                    mimeType: file.type || "application/pdf",
                    researcherName: user.fullName || user.username || "باحث",
                    nationalId: user.nationalId,
                    stage: stage,
                    docKey: docKey,
                    oldFileName: oldFileName
                  })
                }).then(function () {
                  var userDocs = getUploadedDocs(user.nationalId);
                  userDocs[docKey] = true;
                  userDocs[docKey + '_name'] = file.name;
                  userDocs[docKey + '_date'] = new Date().toISOString();
                  userDocs[docKey + '_stage'] = stage;
                  localStorage.setItem("gs_docs_" + user.nationalId, JSON.stringify(userDocs));
                  showNotification("تم رفع '" + file.name + "' بنجاح على Google Drive", "success");
                  showPortalDashboard(user);
                }).catch(function (err) {
                  showNotification("خطأ في رفع الملف: " + err.message, "error");
                });
              };
              reader.readAsDataURL(file);
            } else {
              var reader2 = new FileReader();
              reader2.onload = function (ev2) {
                var userDocs = getUploadedDocs(user.nationalId);
                userDocs[docKey] = true;
                userDocs[docKey + '_name'] = file.name;
                userDocs[docKey + '_date'] = new Date().toISOString();
                userDocs[docKey + '_data'] = ev2.target.result;
                userDocs[docKey + '_stage'] = getDocStage(docKey);
                localStorage.setItem("gs_docs_" + user.nationalId, JSON.stringify(userDocs));
                showNotification("تم رفع '" + file.name + "' بنجاح (محلي)", "success");
                showPortalDashboard(user);
              };
              reader2.readAsDataURL(file);
            }
          });
        });

        /* Attach file view listeners */
        docsContainer.querySelectorAll('.doc-file-link').forEach(function (link) {
          link.addEventListener("click", function (e) {
            e.preventDefault();
            var docKey = link.getAttribute("data-doc-key");
            var gdUrl = uploadedDocs[docKey + '_gdUrl'];
            var data = uploadedDocs[docKey + '_data'];
            if (gdUrl) {
              window.open(gdUrl, '_blank');
            } else if (data) {
              var byteString = atob(data.split(',')[1]);
              var ab = new ArrayBuffer(byteString.length);
              var ia = new Uint8Array(ab);
              for (var i = 0; i < byteString.length; i++) { ia[i] = byteString.charCodeAt(i); }
              var blob = new Blob([ab], { type: 'application/pdf' });
              var url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            }
          });
        });
      }
    }
  }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem("gs_users")) || [];
    } catch (e) {
      return [];
    }
  }

  function getUploadedDocs(nationalId) {
    try {
      return JSON.parse(localStorage.getItem("gs_docs_" + nationalId)) || {};
    } catch (e) {
      return {};
    }
  }

  function getPortalUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.portalUser));
    } catch (e) {
      return null;
    }
  }

  /* ===== 9. BACK TO TOP ===== */
  function handleBackToTop() {
    var btn = $("#backToTop");
    if (!btn) return;
    if (window.scrollY > 400) { btn.classList.add("visible"); }
    else { btn.classList.remove("visible"); }
  }

  function smoothScrollTo(targetY, duration) {
    var startY = window.scrollY;
    var diff = targetY - startY;
    var start = performance.now();
    duration = duration || 800;
    function step(ts) {
      var progress = Math.min((ts - start) / duration, 1);
      var ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      window.scrollTo(0, startY + diff * ease);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initBackToTop() {
    var btn = $("#backToTop");
    if (!btn) return;
    btn.addEventListener("click", function () {
      smoothScrollTo(0, 600);
    });
  }

  /* ===== 10. NOTIFICATION SYSTEM ===== */
  function showNotification(message, type) {
    type = type || "info";
    var container = $("#toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.style.cssText = "position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:10000;display:flex;flex-direction:column;gap:10px;pointer-events:none;";
      document.body.appendChild(container);
    }

    var toast = document.createElement("div");
    toast.className = "toast toast-" + type;
    toast.style.cssText = "pointer-events:auto;padding:16px 32px;border-radius:12px;color:#fff;font-family:Cairo,sans-serif;font-size:0.95rem;opacity:0;transition:all 0.4s;transform:translateY(-15px);box-shadow:0 8px 32px rgba(0,0,0,0.2);display:flex;align-items:center;gap:10px;min-width:300px;justify-content:center;";

    var bgMap = { success: "#27ae60", error: "#e74c3c", info: "#2980b9", warning: "#f39c12" };
    toast.style.background = bgMap[type] || bgMap.info;

    var iconMap = { success: "fas fa-check-circle", error: "fas fa-times-circle", info: "fas fa-info-circle", warning: "fas fa-exclamation-triangle" };
    toast.innerHTML = '<i class="' + (iconMap[type] || iconMap.info) + '"></i><span>' + escapeHTML(message) + '</span>';
    container.appendChild(toast);

    requestAnimationFrame(function () {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    setTimeout(function () {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-15px)";
      setTimeout(function () { toast.remove(); }, 400);
    }, 4000);
  }

  window.showNotification = showNotification;

  /* ===== 11. DATA MANAGEMENT (localStorage) ===== */
  function saveApplication(data) {
    var apps = getApplications();
    var existing = apps.findIndex(function (a) { return a.id === data.id; });
    if (existing >= 0) { apps[existing] = Object.assign({}, apps[existing], data); }
    else { apps.push(data); }
    localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(apps));
    return data;
  }

  function getApplications() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.applications)) || [];
    } catch (e) {
      return [];
    }
  }

  function getApplicationById(id) {
    return getApplications().find(function (a) { return a.id === id; }) || null;
  }

  function updateApplicationStatus(id, status) {
    var apps = getApplications();
    var app = apps.find(function (a) { return a.id === id; });
    if (app) {
      app.status = status;
      app.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(apps));
    }
    return app || null;
  }

  function acceptDocument(appId, docKey) {
    var apps = getApplications();
    var app = apps.find(function (a) { return a.id === appId; });
    if (app) {
      if (!app.uploadedDocs) app.uploadedDocs = {};
      app.uploadedDocs[docKey] = "accepted";
      localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(apps));
      showNotification("تم قبول المستند بنجاح", "success");
      return true;
    }
    return false;
  }

  window.acceptDocument = acceptDocument;

  /* ===== 12. SCROLL ANIMATIONS ===== */
  function initScrollAnimations() {
    var elements = $$(".about-card, .program-card, .scholarship-card, .committee-card, .document-card");
    if (!elements.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    elements.forEach(function (el) {
      el.style.opacity = "0";
      el.style.transform = "translateY(30px)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(el);
    });
  }

  /* ===== 13. REAL-TIME VALIDATION ===== */
  function initRealTimeValidation() {
    var emailFields = $$("input[type='email']");
    emailFields.forEach(function (field) {
      field.addEventListener("blur", function () {
        removeFieldError(field);
        if (field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
          showFieldError(field, "البريد الإلكتروني غير صحيح");
        }
      });
    });

    var phoneFields = $$("input[type='tel']");
    phoneFields.forEach(function (field) {
      field.addEventListener("blur", function () {
        removeFieldError(field);
        if (field.value && !/^\d{7,15}$/.test(field.value.replace(/[\s\-]/g, ""))) {
          showFieldError(field, "رقم الجوال غير صحيح");
        }
      });
    });

    var nationalIdFields = $$("input[maxlength='14']");
    nationalIdFields.forEach(function (field) {
      field.addEventListener("blur", function () {
        removeFieldError(field);
        if (field.value && !/^\d{14}$/.test(field.value.trim())) {
          showFieldError(field, "رقم الهوية يجب أن يكون 14 رقماً");
        }
      });
    });
  }

  /* ===== STUDENT MESSAGING ===== */
  window.sendStudentMessage = function () {
    var subjectEl = document.getElementById("msgSubject");
    var bodyEl = document.getElementById("msgBody");
    if (!subjectEl || !bodyEl) return;
    var subject = subjectEl.value.trim();
    var message = bodyEl.value.trim();
    if (!subject || !message) {
      alert("يرجى ملء العنوان والرسالة");
      return;
    }
    var user = null;
    try { user = JSON.parse(localStorage.getItem(STORAGE_KEYS.portalUser)); } catch (e) {}
    if (!user) {
      alert("يجب تسجيل الدخول أولاً");
      return;
    }
    var payload = {
      action: "sendMessage",
      senderName: user.fullNameAr || user.fullName || user.name || "",
      nationalId: user.nationalId || "",
      email: user.email || "",
      subject: subject,
      message: message
    };
    fetch(GSCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.success) {
          subjectEl.value = "";
          bodyEl.value = "";
          alert("تم إرسال الرسالة بنجاح");
          loadStudentMessages();
        } else {
          alert("خطأ: " + (res.message || "حدث خطأ"));
        }
      }).catch(function () {
        alert("خطأ في الاتصال بالخادم");
      });
  };

  function loadStudentMessages() {
    var listEl = document.getElementById("studentMessagesList");
    var countEl = document.getElementById("dashMsgCount");
    if (!listEl) return;
    var user = null;
    try { user = JSON.parse(localStorage.getItem(STORAGE_KEYS.portalUser)); } catch (e) {}
    if (!user) return;
    var url = GSCRIPT_URL + "?action=getMessages&nationalId=" + encodeURIComponent(user.nationalId || "");
    fetch(url).then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.messages || res.messages.length === 0) {
          listEl.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-secondary);">لا توجد رسائل</div>';
          if (countEl) countEl.textContent = "0";
          return;
        }
        var msgs = res.messages;
        if (countEl) countEl.textContent = msgs.length;
        listEl.innerHTML = msgs.map(function (m) {
          var hasReply = m["رد الموظف"] && m["رد الموظف"] !== "";
          var icon = hasReply ? "fas fa-reply" : "fas fa-envelope";
          var iconColor = hasReply ? "color:#00c853;" : "color:#ff6d00;";
          var date = (m["التاريخ"] || "").substring(0, 10);
          var html = '<div class="msg-item" style="margin-bottom:12px;padding:14px;background:var(--bg-secondary);border-radius:10px;">'
            + '<div class="msg-icon" style="' + iconColor + '"><i class="' + icon + '"></i></div>'
            + '<div style="flex:1"><div class="msg-content"><h5>' + escapeHTML(m["العنوان"] || "") + '</h5><p>' + escapeHTML(m["الرسالة"] || "") + '</p></div>'
            + '<span class="msg-date">' + date + '</span>';
          if (hasReply) {
            html += '<div style="margin-top:10px;padding:10px;background:rgba(0,200,83,0.08);border-radius:8px;border-right:3px solid #00c853;">'
              + '<div style="font-size:12px;font-weight:600;color:#00c853;margin-bottom:4px;"><i class="fas fa-reply" style="margin-left:4px;"></i>رد الموظف:</div>'
              + '<p style="font-size:13px;color:var(--text-primary);margin:0;">' + escapeHTML(m["رد الموظف"] || "") + '</p>'
              + '<span style="font-size:11px;color:var(--text-secondary);">' + (m["تاريخ الرد"] || "").substring(0, 10) + '</span>'
              + '</div>';
          }
          html += '</div></div>';
          return html;
        }).join("");
      }).catch(function () {
        listEl.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-secondary);">خطأ في تحميل الرسائل</div>';
      });
  }

  /* ===== BOOT ===== */
  function init() {
    initPreloader();
    initNavigation();
    initTheme();
    initStatsCounter();
    initTabs();
    initApplicationForm();
    initDocumentUpload();
    initPortal();
    initBackToTop();
    initScrollAnimations();
    initRealTimeValidation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();