-- =============================================================================
-- قاعدة بيانات بوابة الدراسات العليا - كلية علوم الرياضة
-- Graduate Studies Portal - Faculty of Sports Science
-- Version: 1.0.0
-- =============================================================================

DROP DATABASE IF EXISTS graduate_studies;
CREATE DATABASE graduate_studies
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE graduate_studies;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1. جدول الباحثون (applicants)
-- يحتوي على بيانات الباحثين المسجلين في البوابة
-- =============================================================================
CREATE TABLE applicants (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    national_id     VARCHAR(20)  NOT NULL UNIQUE           COMMENT 'رقم الهوية الوطنية - فريد',
    full_name_ar    VARCHAR(150) NOT NULL                  COMMENT 'الاسم الكامل بالعربية',
    full_name_en    VARCHAR(150) NOT NULL                  COMMENT 'الاسم الكامل بالإنجليزية',
    birth_date      DATE         NOT NULL                  COMMENT 'تاريخ الميلاد',
    gender          ENUM('male','female') NOT NULL         COMMENT 'الجنس: ذكر/أنثى',
    nationality     VARCHAR(60)  NOT NULL DEFAULT 'Saudi'  COMMENT 'الجنسية',
    phone           VARCHAR(20)  NOT NULL                  COMMENT 'رقم الهاتف',
    email           VARCHAR(120) NOT NULL UNIQUE           COMMENT 'البريد الإلكتروني - فريد',
    address         TEXT                                  COMMENT 'العنوان الكامل',
    password_hash   VARCHAR(255) NOT NULL                  COMMENT 'كلمة المرور مشفرة (bcrypt)',
    profile_image   VARCHAR(255) DEFAULT NULL              COMMENT 'مسار صورة الملف الشخصي',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_applicants_national_id (national_id),
    INDEX idx_applicants_email (email),
    INDEX idx_applicants_name (full_name_ar)
) ENGINE=InnoDB COMMENT='جدول الباحثون المسجلون في بوابة الدراسات العليا';

-- =============================================================================
-- 2. جدول المؤهلات العلمية (academic_qualifications)
-- يحتوي على الشهادات والمؤهلات لكل باحث
-- =============================================================================
CREATE TABLE academic_qualifications (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    applicant_id        INT UNSIGNED NOT NULL              COMMENT 'معرف الباحث (مرجع لجدول الباحثون)',
    degree_type         ENUM('bachelor','masters','phd') NOT NULL COMMENT 'نوع Degree: بكالوريوس/ماجستير/دكتوراه',
    degree_name         VARCHAR(200) NOT NULL              COMMENT 'اسم الشهادة (مثال: بكالوريوس تربية رياضية)',
    university_name     VARCHAR(200) NOT NULL              COMMENT 'اسم الجامعة التي أ issuingت الشهادة',
    graduation_year     YEAR         NOT NULL              COMMENT 'سنة التخرج',
    gpa                 DECIMAL(4,2) DEFAULT NULL          COMMENT 'المعدل التراكمي (من 5.0 أو 4.0)',
    grade               VARCHAR(10)  DEFAULT NULL          COMMENT 'التقدير: ممتاز/جيد جداً/جيد/مقبول',
    specialization      VARCHAR(150) DEFAULT NULL          COMMENT 'التخصص الدقيق',
    certificate_file_path VARCHAR(500) DEFAULT NULL        COMMENT 'مسار ملف رخصية/شهادة الرقمية',
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (applicant_id) REFERENCES applicants(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_qual_applicant (applicant_id),
    INDEX idx_qual_degree_type (degree_type)
) ENGINE=InnoDB COMMENT='جدول المؤهلات العلمية للباحثين';

-- =============================================================================
-- 3. جدول البرامج الدراسية (programs)
-- البرامج الدراسية المتوفرة في الكلية
-- =============================================================================
CREATE TABLE programs (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name_ar         VARCHAR(200) NOT NULL                  COMMENT 'اسم البرنامج بالعربية',
    name_en         VARCHAR(200) NOT NULL                  COMMENT 'اسم البرنامج بالإنجليزية',
    degree_level    ENUM('masters','phd') NOT NULL         COMMENT 'مستوى الدرجة العلمية: ماجستير/دكتوراه',
    description     TEXT                                  COMMENT 'وصف تفصيلي للبرنامج',
    duration_years  TINYINT UNSIGNED NOT NULL DEFAULT 2    COMMENT 'مدة الدراسة بالسنوات',
    credit_hours    SMALLINT UNSIGNED DEFAULT NULL         COMMENT 'عدد ساعات المعامل',
    max_capacity    SMALLINT UNSIGNED NOT NULL DEFAULT 30  COMMENT 'الحد الأقصى للطلاب في كل دفعة',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE     COMMENT 'هل البرنامج مفتوح للتسجيل؟',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_programs_level (degree_level),
    INDEX idx_programs_active (is_active)
) ENGINE=InnoDB COMMENT='جدول البرامج الدراسية المتوفرة في كلية علوم الرياضة';

-- =============================================================================
-- 4. جدول الطلبات (applications)
-- طلبات التقديم للبرامج الدراسية
-- رقم الطلب يُولَّد تلقائياً بالتنسيق GS-YYYY-NNNN
-- =============================================================================
CREATE TABLE applications (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_number  VARCHAR(20)  NOT NULL UNIQUE       COMMENT 'رقم الطلب الفريد (GS-YYYY-NNNN)',
    applicant_id        INT UNSIGNED NOT NULL              COMMENT 'معرف الباحث المقدم',
    program_id          INT UNSIGNED NOT NULL              COMMENT 'معرف البرنامج المطلوب التقديم إليه',
    semester            ENUM('first','second','summer') NOT NULL DEFAULT 'first' COMMENT 'الفصل الدراسي',
    academic_year       VARCHAR(9)   NOT NULL              COMMENT 'السنة الدراسية (مثال: 2025-2026)',
    status              ENUM('pending','under_review','accepted','rejected','waitlisted')
                        NOT NULL DEFAULT 'pending'         COMMENT 'حالة الطلب',
    submitted_at        TIMESTAMP    DEFAULT NULL          COMMENT 'تاريخ ووقت إرسال الطلب',
    reviewed_at         TIMESTAMP    DEFAULT NULL          COMMENT 'تاريخ مراجعة الطلب',
    notes               TEXT                                  COMMENT 'ملاحظات عامة على الطلب',
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (applicant_id) REFERENCES applicants(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (program_id) REFERENCES programs(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX idx_app_applicant (applicant_id),
    INDEX idx_app_program (program_id),
    INDEX idx_app_status (status),
    INDEX idx_app_number (application_number),
    INDEX idx_app_academic_year (academic_year)
) ENGINE=InnoDB COMMENT='جدول طلبات التقديم للبرامج الدراسية';

-- =============================================================================
-- 5. جدول المستندات (documents)
-- الملفات المرفقة مع كل طلب
-- =============================================================================
CREATE TABLE documents (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_id  INT UNSIGNED NOT NULL                  COMMENT 'معرف الطلب المرجعي',
    document_type   ENUM('national_id_copy','academic_certificates',
                         'transcripts','recommendation_letters',
                         'research_proposal','photo','passport','other')
                    NOT NULL                              COMMENT 'نوع المستند',
    file_name       VARCHAR(255) NOT NULL                  COMMENT 'اسم الملف الأصلي',
    file_path       VARCHAR(500) NOT NULL                  COMMENT 'مسار الملف على الخادم',
    file_size       INT UNSIGNED DEFAULT NULL              COMMENT 'حجم الملف بالبايت',
    upload_date     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ رفع الملف',
    verified        BOOLEAN      NOT NULL DEFAULT FALSE    COMMENT 'هل تم التحقق من المستند؟',
    verified_by     VARCHAR(100) DEFAULT NULL              COMMENT 'اسم/معرف من قام بالتحقق',
    verified_at     TIMESTAMP    DEFAULT NULL              COMMENT 'تاريخ التحقق',

    FOREIGN KEY (application_id) REFERENCES applications(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_doc_application (application_id),
    INDEX idx_doc_type (document_type)
) ENGINE=InnoDB COMMENT='جدول المستندات والملفات المرفقة بالطلب';

-- =============================================================================
-- 6. جدول اللجان (committees)
-- لجان المراجعة والقبول والمنح
-- =============================================================================
CREATE TABLE committees (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name_ar         VARCHAR(150) NOT NULL                  COMMENT 'اسم اللجنة بالعربية',
    name_en         VARCHAR(150) NOT NULL                  COMMENT 'اسم اللجنة بالإنجليزية',
    committee_type  ENUM('admission','academic','scholarship') NOT NULL
                                        COMMENT 'نوع اللجنة: قبول/أكاديمية/منح دراسية',
    description     TEXT                                  COMMENT 'وصف مهام اللجنة',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE     COMMENT 'هل اللجنة نشطة حالياً؟',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_committee_type (committee_type)
) ENGINE=InnoDB COMMENT='جدول اللجان الأكاديمية والإدارية';

-- =============================================================================
-- 7. جدول أعضاء اللجان (committee_members)
-- الأعضاء المُعيَّنون للجان المختلفة
-- =============================================================================
CREATE TABLE committee_members (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    committee_id    INT UNSIGNED NOT NULL                  COMMENT 'معرف اللجنة',
    member_name     VARCHAR(150) NOT NULL                  COMMENT 'اسم العضو الكامل',
    member_title    VARCHAR(100) DEFAULT NULL              COMMENT 'الدرجة العلمية/اللقب (مثال: أستاذ مشارك)',
    member_role     ENUM('chair','member','observer') NOT NULL DEFAULT 'member'
                                        COMMENT 'دور العضو في اللجنة: رئيس/عضو/مراقب',
    email           VARCHAR(120) DEFAULT NULL              COMMENT 'البريد الإلكتروني للعضو',
    department      VARCHAR(150) DEFAULT NULL              COMMENT 'القسم الأكاديمي',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE     COMMENT 'هل العضو نشط في اللجنة؟',

    FOREIGN KEY (committee_id) REFERENCES committees(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_member_committee (committee_id),
    INDEX idx_member_role (member_role)
) ENGINE=InnoDB COMMENT='جدول أعضاء اللجان المختلفة';

-- =============================================================================
-- 8. جدول مراجعات اللجان (committee_reviews)
-- تقييمات وقرارات أعضاء اللجان على الطلبات
-- =============================================================================
CREATE TABLE committee_reviews (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_id  INT UNSIGNED NOT NULL                  COMMENT 'معرف الطلب المُقيَّم',
    committee_id    INT UNSIGNED NOT NULL                  COMMENT 'اللجنة المُقيِّمة',
    reviewer_id     INT UNSIGNED DEFAULT NULL              COMMENT 'معرف العضو المُراجع',
    review_date     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ المراجعة',
    decision        ENUM('pending','approved','rejected','needs_revision')
                    NOT NULL DEFAULT 'pending'             COMMENT 'قرار المراجعة',
    score           DECIMAL(5,2) DEFAULT NULL              COMMENT 'التقييم الرقمي (0-100)',
    comments        TEXT                                  COMMENT 'ملاحظات المراجع',
    recommendation  TEXT                                  COMMENT 'توصيات المراجع',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (application_id) REFERENCES applications(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (committee_id) REFERENCES committees(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES committee_members(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_review_application (application_id),
    INDEX idx_review_committee (committee_id),
    INDEX idx_review_reviewer (reviewer_id),
    INDEX idx_review_decision (decision)
) ENGINE=InnoDB COMMENT='جدول مراجعات وقرارات اللجان على الطلبات';

-- =============================================================================
-- 9. جدول سير عمل المراجعة (review_workflow)
-- تتبع مراحل معالجة كل طلب
-- =============================================================================
CREATE TABLE review_workflow (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_id  INT UNSIGNED NOT NULL                  COMMENT 'معرف الطلب',
    current_stage   VARCHAR(60)  NOT NULL                  COMMENT 'المرحلة الحالية (مثال: documents_check)',
    stage_status    ENUM('pending','in_progress','completed','blocked')
                    NOT NULL DEFAULT 'pending'             COMMENT 'حالة المرحلة',
    assigned_to     VARCHAR(100) DEFAULT NULL              COMMENT 'الشخص المسؤول عن هذه المرحلة',
    due_date        DATE         DEFAULT NULL              COMMENT 'الموعد النهائي لإتمام المرحلة',
    completed_at    TIMESTAMP    DEFAULT NULL              COMMENT 'تاريخ إتمام المرحلة',
    notes           TEXT                                  COMMENT 'ملاحظات على المرحلة',

    FOREIGN KEY (application_id) REFERENCES applications(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_workflow_application (application_id),
    INDEX idx_workflow_stage (current_stage),
    INDEX idx_workflow_status (stage_status)
) ENGINE=InnoDB COMMENT='جدول تتبع سير عمل مراجعة الطلبات';

-- =============================================================================
-- 10. جدول المنح الدراسية (scholarships)
-- المنح الدراسية المتاحة في الكلية
-- =============================================================================
CREATE TABLE scholarships (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name_ar         VARCHAR(200) NOT NULL                  COMMENT 'اسم المنحة بالعربية',
    name_en         VARCHAR(200) NOT NULL                  COMMENT 'اسم المنحة بالإنجليزية',
    scholarship_type ENUM('full','partial','tuition_only','research')
                    NOT NULL                              COMMENT 'نوع المنحة: كاملة/جزئية/رسوم دراسية فقط/بحثية',
    funding_source  VARCHAR(200) DEFAULT NULL              COMMENT 'جهة تمويل المنحة',
    amount          DECIMAL(12,2) DEFAULT NULL             COMMENT 'قيمة المنحة بالعملة المحلية',
    duration_months SMALLINT UNSIGNED DEFAULT NULL         COMMENT 'مدة المنحة بالأشهر',
    conditions      TEXT                                  COMMENT 'شروط ومتطلبات المنحة',
    max_recipients  SMALLINT UNSIGNED NOT NULL DEFAULT 10  COMMENT 'الحد الأقصى لعدد المستفيدين',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE     COMMENT 'هل المنحة مفتوحة للتقديم؟',
    academic_year   VARCHAR(9)   NOT NULL                  COMMENT 'السنة الدراسية للمنحة',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_scholarship_type (scholarship_type),
    INDEX idx_scholarship_active (is_active),
    INDEX idx_scholarship_year (academic_year)
) ENGINE=InnoDB COMMENT='جدول المنح الدراسية المتاحة';

-- =============================================================================
-- 11. جدول طلبات المنح (scholarship_applications)
-- طلبات التقديم على المنح الدراسية
-- =============================================================================
CREATE TABLE scholarship_applications (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scholarship_id  INT UNSIGNED NOT NULL                  COMMENT 'معرف المنحة المطلوبة',
    application_id  INT UNSIGNED NOT NULL                  COMMENT 'معرف طلب الدراسة المرجعي',
    applicant_id    INT UNSIGNED NOT NULL                  COMMENT 'معرف الباحث المقدم',
    applied_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ تقديم طلب المنحة',
    status          ENUM('pending','under_review','accepted','rejected')
                    NOT NULL DEFAULT 'pending'             COMMENT 'حالة طلب المنحة',
    reviewed_by     VARCHAR(100) DEFAULT NULL              COMMENT 'اسم/معرف المراجع',
    reviewed_at     TIMESTAMP    DEFAULT NULL              COMMENT 'تاريخ مراجعة طلب المنحة',
    notes           TEXT                                  COMMENT 'ملاحظات على طلب المنحة',

    FOREIGN KEY (scholarship_id) REFERENCES scholarships(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES applicants(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_sch_app_scholarship (scholarship_id),
    INDEX idx_sch_app_application (application_id),
    INDEX idx_sch_app_applicant (applicant_id),
    INDEX idx_sch_app_status (status)
) ENGINE=InnoDB COMMENT='جدول طلبات التقديم على المنح الدراسية';

-- =============================================================================
-- 12. جدول الإشعارات (notifications)
-- إشعارات موجهة للباحثين
-- =============================================================================
CREATE TABLE notifications (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    applicant_id        INT UNSIGNED NOT NULL              COMMENT 'المستلم: معرف الباحث',
    title               VARCHAR(200) NOT NULL              COMMENT 'عنوان الإشعار',
    message             TEXT         NOT NULL              COMMENT 'نص الإشعار',
    is_read             BOOLEAN      NOT NULL DEFAULT FALSE COMMENT 'هل قرأ الباحث الإشعار؟',
    notification_type   ENUM('info','warning','success','error')
                        NOT NULL DEFAULT 'info'            COMMENT 'نوع الإشعار: معلومات/تحذير/نجاح/خطأ',
    link                VARCHAR(500) DEFAULT NULL           COMMENT 'رابط مرتبط بالإشعار (صفحة مرجعية)',
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (applicant_id) REFERENCES applicants(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_notif_applicant (applicant_id),
    INDEX idx_notif_read (is_read),
    INDEX idx_notif_type (notification_type)
) ENGINE=InnoDB COMMENT='جدول الإشعارات الموجهة للباحثين';

-- =============================================================================
-- 13. جدول الفصول الدراسية (academic_terms)
-- الفصول الدراسية ومواعيدها
-- =============================================================================
CREATE TABLE academic_terms (
    id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name                    VARCHAR(60)  NOT NULL          COMMENT 'اسم الفصل (مثال: الفصل الأول 2025-2026)',
    start_date              DATE         NOT NULL          COMMENT 'تاريخ بدء الفصل',
    end_date                DATE         NOT NULL          COMMENT 'تاريخ انتهاء الفصل',
    is_current              BOOLEAN      NOT NULL DEFAULT FALSE COMMENT 'هل هذا هو الفصل الحالي؟',
    application_deadline    DATE         DEFAULT NULL      COMMENT 'آخر موعد لتقديم الطلبات لهذا الفصل',
    created_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_term_current (is_current),
    INDEX idx_term_dates (start_date, end_date)
) ENGINE=InnoDB COMMENT='جدول الفصول الدراسية ومواعيدها';

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- قيود إضافية (CHECK constraints)
-- =============================================================================
ALTER TABLE academic_qualifications
    ADD CONSTRAINT chk_gpa_range CHECK (gpa IS NULL OR (gpa >= 0 AND gpa <= 5.0)),
    ADD CONSTRAINT chk_graduation_year CHECK (graduation_year >= 1970 AND graduation_year <= 2100);

ALTER TABLE applications
    ADD CONSTRAINT chk_academic_year_format CHECK (academic_year REGEXP '^[0-9]{4}-[0-9]{4}$');

ALTER TABLE scholarships
    ADD CONSTRAINT chk_amount CHECK (amount IS NULL OR amount >= 0),
    ADD CONSTRAINT chk_duration CHECK (duration_months IS NULL OR duration_months > 0),
    ADD CONSTRAINT chk_max_recipients CHECK (max_recipients > 0);

ALTER TABLE documents
    ADD CONSTRAINT chk_file_size CHECK (file_size IS NULL OR file_size > 0);

ALTER TABLE committee_reviews
    ADD CONSTRAINT chk_score_range CHECK (score IS NULL OR (score >= 0 AND score <= 100));

ALTER TABLE academic_terms
    ADD CONSTRAINT chk_term_dates CHECK (end_date > start_date),
    ADD CONSTRAINT chk_deadline_before_start CHECK (
        application_deadline IS NULL OR application_deadline <= start_date
    );

-- =============================================================================
-- بيانات تجريبية
-- =============================================================================

-- --------------- الفصول الدراسية ---------------
INSERT INTO academic_terms (name, start_date, end_date, is_current, application_deadline)
VALUES
    ('الفصل الأول 2025-2026', '2025-09-01', '2026-01-20', TRUE,  '2025-07-15'),
    ('الفصل الثاني 2025-2026', '2026-02-01', '2026-06-15', FALSE, '2025-12-01'),
    ('الفصل الأول 2026-2027', '2026-09-01', '2027-01-20', FALSE, '2026-07-15');

-- --------------- البرامج الدراسية ---------------

-- برامج الماجستير (4 برامج)
INSERT INTO programs (name_ar, name_en, degree_level, description, duration_years, credit_hours, max_capacity, is_active)
VALUES
    (
        'ماجستير التربية الرياضية',
        'Master of Physical Education',
        'masters',
        'برنامج ماجستير التربية الرياضية يهدف إلى إعداد كوادر أكاديمية مؤهلة قادرة على المساهمة في تطوير العملية التعليمية والتدريبية في مجال التربية الرياضية والرياضية.',
        2, 36, 25, TRUE
    ),
    (
        'ماجستير التدريب الرياضي',
        'Master of Sports Coaching',
        'masters',
        'يُركز هذا البرنامج على تأهيل الكوادر التدريبية بأحدث الأساليب العلمية والعملية لتحسين أداء الرياضيين وتخطيط برامج التدريب.',
        2, 36, 20, TRUE
    ),
    (
        'ماجستير إدارة الأنشطة الرياضية',
        'Master of Sports Management',
        'masters',
        'يهدف البرنامج إلى إعداد متخصصين في إدارة الأنشطة الرياضية والتخطيط الاستراتيجي للمؤسسات الرياضية.',
        2, 33, 20, TRUE
    ),
    (
        'ماجستير العلوم الرياضية الصحية',
        'Master of Sports Health Sciences',
        'masters',
        'يُقدم هذا البرنامج تأهيلاً متخصصاً في العلوم الرياضية الصحية تشمل التغذية الرياضية والعلاج الطبيعي والوقاية من الإصابات.',
        2, 36, 15, TRUE
    );

-- برامج الدكتوراه (4 برامج)
INSERT INTO programs (name_ar, name_en, degree_level, description, duration_years, credit_hours, max_capacity, is_active)
VALUES
    (
        'دكتوراه التربية الرياضية',
        'PhD in Physical Education',
        'phd',
        'برنامج doktorاه يهدف إلى إعداد باحثين وأكاديميين على مستوى عالٍ قادرين على إجراء أبحاث مستقلة وإسهامات علمية أصيلة في مجال التربية الرياضية.',
        4, 60, 10, TRUE
    ),
    (
        'دكتوراه التدريب الرياضي',
        'PhD in Sports Coaching',
        'phd',
        'يهدف هذا البرنامج إلى تأهيل باحثين متخصصين في علوم التدريب الرياضي قادرين على تطوير المعرفة العلمية والتطبيقية في هذا المجال.',
        4, 60, 8, TRUE
    ),
    (
        'دكتوراه إدارة الأنشطة الرياضية',
        'PhD in Sports Management',
        'phd',
        'برنامج الدراسات العليا يُ聚焦 على إعداد باحثين في مجال إدارة وتنمية الأنشطة الرياضية على المستوى العالي.',
        4, 57, 8, TRUE
    ),
    (
        'دكتوراه العلوم الرياضية',
        'PhD in Sports Sciences',
        'phd',
        'أعلى درجة علمية في العلوم الرياضية تُ focus على البحث العلمي المتقدم في التخصصات الرياضية المختلفة.',
        4, 60, 6, TRUE
    );

-- --------------- اللجان ---------------
INSERT INTO committees (name_ar, name_en, committee_type, description, is_active)
VALUES
    (
        'لجنة القبول والتسجيل',
        'Admission and Registration Committee',
        'admission',
        'اللجنة المسؤولة عن مراجعة طلبات القبول والتحقق من المستندات واتخاذ قرارات القبول والرفض.',
        TRUE
    ),
    (
        'لجنة المنح الدراسية',
        'Scholarship Committee',
        'scholarship',
        'اللجنة المختصة بمراجعة طلبات المنح الدراسية وتقييم المرشحين وتصنيفهم حسب الأولوية.',
        TRUE
    ),
    (
        'اللجنة الأكاديمية العليا',
        'Supreme Academic Committee',
        'academic',
        'اللجنة الأكاديمية العليا المسؤولة عن مراقبة جودة البرامج الدراسية والبحث العلمي.',
        TRUE
    );

-- --------------- أعضاء اللجان ---------------

-- أعضاء لجنة القبول
INSERT INTO committee_members (committee_id, member_name, member_title, member_role, email, department, is_active)
VALUES
    (1, 'د. عبدالرحمن الحربي',    'أستاذ دكتور',      'chair',   'a.alharbi@university.edu',    'العلوم الرياضية الأساسية', TRUE),
    (1, 'د. فاطمة العتيبي',         'أستاذ مشارك',      'member',  'f.otaibi@university.edu',     'التربية الرياضية',         TRUE),
    (1, 'د. خالد السبيعي',          'أستاذ مشارك',      'member',  'k.alsubaie@university.edu',   'التدريب الرياضي',          TRUE),
    (1, 'د. نورة القحطاني',         'محاضر',            'observer','n.alqahtani@university.edu',  'إدارة الأنشطة الرياضية',   TRUE);

-- أعضاء لجنة المنح
INSERT INTO committee_members (committee_id, member_name, member_title, member_role, email, department, is_active)
VALUES
    (2, 'د. محمد الدوسري',          'أستاذ دكتور',      'chair',   'm.aldosari@university.edu',   'العلوم الرياضية الصحية',   TRUE),
    (2, 'د. سارة الشمري',           'أستاذ مشارك',      'member',  's.alshammar@university.edu',  'التربية الرياضية',         TRUE),
    (2, 'د. عبدالعزيز المطيري',     'أستاذ مساعد',      'member',  'a.almutairi@university.edu',  'التدريب الرياضي',          TRUE);

-- أعضاء اللجنة الأكاديمية
INSERT INTO committee_members (committee_id, member_name, member_title, member_role, email, department, is_active)
VALUES
    (3, 'د. عبدالله الزهراني',      'أستاذ دكتور',      'chair',   'a.alzahrani@university.edu',  'العلوم الرياضية الأساسية', TRUE),
    (3, 'د. ريم العنزي',            'أستاذ مشارك',      'member',  'r.alenazi@university.edu',    'إدارة الأنشطة الرياضية',   TRUE);

-- --------------- المنح الدراسية ---------------
INSERT INTO scholarships (name_ar, name_en, scholarship_type, funding_source, amount, duration_months, conditions, max_recipients, is_active, academic_year)
VALUES
    (
        'المنحة الدراسية الكاملة - كلية علوم الرياضة',
        'Full Scholarship - Faculty of Sports Science',
        'full',
        'وزارة التعليم العالي - المملكة العربية السعودية',
        8000.00,
        48,
        'يجب أن يكون المتقدم حاصل على درجة البكالوريوس بمعدل لا يقل عن 4.0 من 5.0، واجتياز المقابلة الشخصية، وإجراء اختبار التحصيل العلمي.',
        20, TRUE, '2025-2026'
    ),
    (
        'منحة البحث العلمي - كلية علوم الرياضة',
        'Research Scholarship - Faculty of Sports Science',
        'research',
        'جامعة الملك سعود - نائب لشؤون البحث العلمي',
        5000.00,
        24,
        'مخصصة لطلاب الدكتوراه فقط، يجب اقتراح بحث في مجال العلوم الرياضية والموافقة عليه من لجنة البحث العلمي.',
        10, TRUE, '2025-2026'
    ),
    (
        'منحة رسوم الدراسة الجزئية',
        'Partial Tuition Scholarship',
        'tuition_only',
        'مؤسسة الملك عبدالله لبحوث وتطوير التعليم',
        3000.00,
        24,
        'تغطي الرسوم الدراسية فقط، متاحة لطلاب الماجستير بمعدل تراكمي لا يقل عن 3.5 من 5.0.',
        30, TRUE, '2025-2026'
    );
