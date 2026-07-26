/**
 * Google Apps Script - بوابة الباحثين
 * 
 * 1. رفع ملفات على Google Drive (فولدرات مرتبة)
 * 2. ملف Excel يجمع بيانات الباحثين + إحصائيات + روابط الملفات
 */

var FOLDER_ID = "1H-j6VWD2Hv4O_pqWvrVRzQgPrvLImIxc";
var SPREADSHEET_ID = "1u83B2aBLS6_9513JypLeBGlrBSsF72O9ovvucSQ3TNE";

var ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

var MAX_SIZE = 10 * 1024 * 1024;

var STAGE_FOLDERS = {
  "registration": "التسجيل",
  "formation": "التشكيل",
  "degree": "المنح"
};

var SHEET_NAME = "بيانات الباحثين";
var USERS_SHEET_NAME = "بيانات_المستخدمين";
var MESSAGES_SHEET_NAME = "الرسائل";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    if (action === "upload") return handleUpload(data);
    if (action === "listFiles") return handleListFiles(data);
    if (action === "getFile") return handleGetFile(data);
    if (action === "saveResearcher") return handleSaveResearcher(data);
    if (action === "staffLogin") return handleStaffLogin(data);
    if (action === "addStaff") return handleAddStaff(data);
    if (action === "getStaff") return handleGetStaff(data);
    if (action === "updateStaff") return handleUpdateStaff(data);
    if (action === "deleteStaff") return handleDeleteStaff(data);
    if (action === "exportResearchers") return handleExportResearchers(data);
    if (action === "listAllFiles") return handleListAllFiles(data);
    if (action === "sendMessage") return handleSendMessage(data);
    if (action === "getMessages") return handleGetMessages(data);
    if (action === "replyMessage") return handleReplyMessage(data);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: "إجراء غير معروف" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = e && e.parameter && e.parameter.action;
    if (action === "exportResearchers") {
      var sheet = getOrCreateSheet();
      var allData = sheet.getDataRange().getValues();
      var headers = allData[0];
      var rows = [];
      for (var i = 1; i < allData.length; i++) {
        var row = [];
        for (var j = 0; j < allData[i].length; j++) {
          row.push(String(allData[i][j]));
        }
        rows.push(row);
      }
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, headers: headers, rows: rows })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "listAllFiles") {
      var mainFolder = DriveApp.getFolderById(FOLDER_ID);
      var researcherFolders = mainFolder.getFolders();
      var allFiles = [];

      while (researcherFolders.hasNext()) {
        var rFolder = researcherFolders.next();
        var folderName = rFolder.getName();
        var parts = folderName.split("_");
        var nationalId = parts.length > 1 ? parts[parts.length - 1] : "";
        var researcherDisplayName = parts.length > 1 ? parts.slice(0, -1).join("_") : folderName;

        for (var stageKey in STAGE_FOLDERS) {
          var stageName = STAGE_FOLDERS[stageKey];
          var stageFolders = rFolder.getFoldersByName(stageName);
          if (stageFolders.hasNext()) {
            var stageFolder = stageFolders.next();
            var files = stageFolder.getFiles();
            while (files.hasNext()) {
              var file = files.next();
              var mimeType = file.getBlob().getContentType() || "";
              var icon = "fa-file";
              if (mimeType.indexOf("pdf") !== -1) icon = "fa-file-pdf";
              else if (mimeType.indexOf("image") !== -1) icon = "fa-file-image";
              else if (mimeType.indexOf("word") !== -1 || mimeType.indexOf("document") !== -1) icon = "fa-file-word";
              else if (mimeType.indexOf("spreadsheet") !== -1 || mimeType.indexOf("excel") !== -1) icon = "fa-file-excel";

              allFiles.push({
                id: file.getId(),
                name: file.getName(),
                researcherName: researcherDisplayName,
                nationalId: nationalId,
                stage: stageName,
                stageKey: stageKey,
                size: file.getSize(),
                mimeType: mimeType,
                icon: icon,
                dateCreated: file.getDateCreated().toISOString(),
                lastUpdated: file.getLastUpdated().toISOString(),
                viewUrl: "https://drive.google.com/file/d/" + file.getId() + "/preview",
                directUrl: "https://drive.google.com/uc?export=download&id=" + file.getId()
              });
            }
          }
        }
      }

      allFiles.sort(function (a, b) {
        return new Date(b.lastUpdated) - new Date(a.lastUpdated);
      });

      return ContentService.createTextOutput(
        JSON.stringify({ success: true, files: allFiles, total: allFiles.length })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "getMessages") {
      var natId = e.parameter.nationalId || "";
      var fakeData = { nationalId: natId };
      return handleGetMessages(fakeData);
    }
    var sheet = getOrCreateSheet();
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: "تم التحقق بنجاح", spreadsheetUrl: ss.getUrl() })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/* ===== GOOGLE SHEET ===== */

function getOrCreateSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "رقم الطلب", "الاسم الكامل", "الرقم القومي", "البريد الإلكتروني",
      "رقم الجوال", "الكلية / الجامعة", "الدرجة الحالية", "التخصص",
      "نوع الدرجة", "عنوان البحث (عربي)", "عنوان البحث (إنجليزي)",
      "المشرف الأول", "المشرف الثاني", "ملخص البحث",
      "تاريخ التقديم", "حالة الطلب",
      "مستندات التسجيل", "مستندات التشكيل", "مستندات المنح",
      "روابط الملفات"
    ]);
    var headerRange = sheet.getRange(1, 1, 1, 20);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4a86c8");
    headerRange.setFontColor("#ffffff");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRowByNationalId(sheet, nationalId) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]) === String(nationalId)) {
      return i + 1;
    }
  }
  return -1;
}

function handleSaveResearcher(data) {
  saveResearcherToSheet(data);

  return ContentService.createTextOutput(
    JSON.stringify({ success: true, message: "تم حفظ بيانات الباحث" })
  ).setMimeType(ContentService.MimeType.JSON);
}

function saveResearcherToSheet(data) {
  var sheet = getOrCreateSheet();
  var nationalId = data.nationalId || "";
  var row = findRowByNationalId(sheet, nationalId);

  var degreeTypeAr = data.degreeType === "phd" ? "دكتوراه" : "ماجستير";
  var currentDegreeAr = "";
  if (data.currentDegree === "bachelor") currentDegreeAr = "بكالوريوس";
  else if (data.currentDegree === "master") currentDegreeAr = "ماجستير";

  var statusAr = "بانتظار التقديم";
  if (data.status === "registration") statusAr = "مرحلة التسجيل";
  else if (data.status === "formation") statusAr = "مرحلة التشكيل";
  else if (data.status === "degree") statusAr = "مرحلة منح الدرجة";

  var values = [
    data.applicationNumber || "",
    data.fullNameAr || "",
    nationalId,
    data.email || "",
    data.phone || "",
    data.college || "",
    currentDegreeAr,
    data.specialization || "",
    degreeTypeAr,
    data.titleAr || "",
    data.titleEn || "",
    data.supervisor1 || "",
    data.supervisor2 || "",
    data.abstract || "",
    data.submittedAt || new Date().toISOString(),
    statusAr,
    data.regDocsCount || "0/10",
    data.formDocsCount || "0/5",
    data.degDocsCount || "0/4",
    data.fileLinks || ""
  ];

  if (row > 0) {
    sheet.getRange(row, 1, 1, 20).setValues([values]);
  } else {
    sheet.appendRow(values);
  }
}

/* ===== FILE UPLOAD ===== */

function handleUpload(data) {
  var fileName = data.fileName;
  var fileData = data.fileData;
  var mimeType = data.mimeType;
  var researcherName = data.researcherName || "غير محدد";
  var nationalId = data.nationalId || "غير محدد";
  var stage = data.stage || "registration";
  var docKey = data.docKey || "";
  var oldFileName = data.oldFileName || "";

  if (ALLOWED_TYPES.indexOf(mimeType) === -1) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: "نوع الملف غير مسموح" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var decoded = Utilities.base64Decode(fileData);
  if (decoded.length > MAX_SIZE) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: "حجم الملف يتجاوز 10MB" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var mainFolder = DriveApp.getFolderById(FOLDER_ID);
  var safeName = researcherName.replace(/[\\\/\:\*\?\"\<\>\|]/g, "_");
  var folderName = safeName + "_" + nationalId;
  var researcherFolder = getSubFolder(mainFolder, folderName);

  var stageFolderName = STAGE_FOLDERS[stage] || "أخرى";
  var stageFolder = getSubFolder(researcherFolder, stageFolderName);

  if (oldFileName) {
    var oldFiles = stageFolder.getFilesByName(oldFileName);
    while (oldFiles.hasNext()) {
      oldFiles.next().setTrashed(true);
    }
  }

  var blob = Utilities.newBlob(decoded, mimeType, fileName);
  var file = stageFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileViewUrl = "https://drive.google.com/file/d/" + file.getId() + "/view";

  /* Save/update researcher data + file link in sheet */
  try {
    var researcherData = {
      applicationNumber: data.applicationNumber || "",
      fullNameAr: researcherName,
      nationalId: nationalId,
      email: data.email || "",
      phone: data.phone || "",
      college: data.college || "",
      currentDegree: data.currentDegree || "",
      specialization: data.specialization || "",
      degreeType: data.degreeType || "",
      titleAr: data.titleAr || "",
      titleEn: data.titleEn || "",
      supervisor1: data.supervisor1 || "",
      supervisor2: data.supervisor2 || "",
      abstract: data.abstractText || "",
      submittedAt: data.submittedAt || new Date().toISOString(),
      status: "registration"
    };
    saveResearcherToSheet(researcherData);
    updateFileLinksInSheet(nationalId, docKey, fileName, fileViewUrl, stage);
  } catch (e) {
    Logger.log("Sheet error: " + e.toString());
  }

  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      message: "تم رفع الملف بنجاح",
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      fileViewUrl: fileViewUrl,
      fileName: fileName,
      docKey: docKey,
      stage: stage,
      stageFolder: stageFolderName
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function updateFileLinksInSheet(nationalId, docKey, fileName, fileViewUrl, stage) {
  var sheet = getOrCreateSheet();
  var row = findRowByNationalId(sheet, nationalId);

  if (row <= 0) {
    var stageAr = STAGE_FOLDERS[stage] || stage;
    var newEntry = stageAr + " | " + fileName + ": " + fileViewUrl;
    sheet.appendRow([
      "", "", nationalId, "", "", "", "", "",
      "", "", "", "", "", "",
      new Date().toISOString(), "بانتظار التقديم",
      "", "", "", newEntry
    ]);
    return;
  }

  var linksCol = 20;
  var existing = sheet.getRange(row, linksCol).getValue() || "";
  var stageAr = STAGE_FOLDERS[stage] || stage;
  var newEntry = stageAr + " | " + fileName + ": " + fileViewUrl;
  var updated = existing ? existing + "\n" + newEntry : newEntry;
  sheet.getRange(row, linksCol).setValue(updated);

  /* Update doc counts */
  var mainFolder = DriveApp.getFolderById(FOLDER_ID);
  var nameVal = sheet.getRange(row, 2).getValue() || "";
  var safeName = nameVal.replace(/[\\\/\:\*\?\"\<\>\|]/g, "_");
  var folderName = safeName + "_" + nationalId;
  var folders = mainFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    var rFolder = folders.next();
    sheet.getRange(row, 17).setValue(countFilesInStage(rFolder, "التسجيل") + "/10");
    sheet.getRange(row, 18).setValue(countFilesInStage(rFolder, "التشكيل") + "/5");
    sheet.getRange(row, 19).setValue(countFilesInStage(rFolder, "المنح") + "/4");
  }
}

function countFilesInStage(researcherFolder, stageName) {
  var sf = researcherFolder.getFoldersByName(stageName);
  if (!sf.hasNext()) return 0;
  var files = sf.next().getFiles();
  var count = 0;
  while (files.hasNext()) { files.next(); count++; }
  return count;
}

/* ===== LIST FILES ===== */

function handleListFiles(data) {
  var nationalId = data.nationalId || "";
  var researcherName = data.researcherName || "";
  var mainFolder = DriveApp.getFolderById(FOLDER_ID);
  var safeName = researcherName.replace(/[\\\/\:\*\?\"\<\>\|]/g, "_");
  var folderName = safeName + "_" + nationalId;

  var folders = mainFolder.getFoldersByName(folderName);
  if (!folders.hasNext()) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, files: {} })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var researcherFolder = folders.next();
  var result = {};

  for (var stageKey in STAGE_FOLDERS) {
    var stageName = STAGE_FOLDERS[stageKey];
    var stageFolders = researcherFolder.getFoldersByName(stageName);
    if (stageFolders.hasNext()) {
      var stageFolder = stageFolders.next();
      var files = stageFolder.getFiles();
      var fileList = [];
      while (files.hasNext()) {
        var file = files.next();
        fileList.push({
          id: file.getId(),
          name: file.getName(),
          url: file.getUrl(),
          viewUrl: "https://drive.google.com/file/d/" + file.getId() + "/view",
          size: file.getSize(),
          dateCreated: file.getDateCreated().toISOString(),
          lastUpdated: file.getLastUpdated().toISOString()
        });
      }
      result[stageKey] = fileList;
    } else {
      result[stageKey] = [];
    }
  }

  return ContentService.createTextOutput(
    JSON.stringify({ success: true, files: result })
  ).setMimeType(ContentService.MimeType.JSON);
}

/* ===== GET FILE ===== */

function handleGetFile(data) {
  var fileId = data.fileId || "";
  if (!fileId) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: "missing fileId" })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  try {
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    var base64 = Utilities.base64Encode(blob.getBytes());
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        fileName: file.getName(),
        mimeType: blob.getContentType(),
        fileData: base64
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function getSubFolder(parent, folderName) {
  var folders = parent.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(folderName);
}

/* ===== USERS / STAFF MANAGEMENT ===== */

function getUsersSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(USERS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(USERS_SHEET_NAME);
    sheet.appendRow(["الاسم", "البريد الإلكتروني", "كلمة المرور", "اسم الصلاحية", "الصلاحيات"]);
    var headerRange = sheet.getRange(1, 1, 1, 5);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4a86c8");
    headerRange.setFontColor("#ffffff");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  } else {
    var lastCol = sheet.getLastColumn();
    if (lastCol === 4) {
      sheet.getRange(1, 5).setValue("الصلاحيات");
      sheet.getRange(1, 5).setFontWeight("bold").setBackground("#4a86c8").setFontColor("#ffffff").setHorizontalAlignment("center");
    }
  }
  return sheet;
}

function simpleHash(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return String(Math.abs(hash));
}

function handleStaffLogin(data) {
  var sheet = getUsersSheet();
  var email = (data.email || "").trim().toLowerCase();
  var password = data.password || "";
  var hash = simpleHash(password);
  var allData = sheet.getDataRange().getValues();
  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][1]).trim().toLowerCase() === email) {
      var storedPass = String(allData[i][2]);
      if (storedPass === hash || storedPass === password) {
        var roleName = allData[i][3] || "";
        var permissions = allData[i][4] || "[]";
        if ((!permissions || permissions === "[]") && (roleName === "مدير النظام" || roleName === "admin")) {
          permissions = '["upload_pdfs","download_excel","view_excel","view_pdfs","view_messages","reply_messages","generate_reports","manage_users"]';
        }
        return ContentService.createTextOutput(
          JSON.stringify({
            success: true,
            user: {
              name: allData[i][0],
              email: allData[i][1],
              role: allData[i][3],
              roleName: allData[i][3],
              permissions: permissions
            }
          })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }
  return ContentService.createTextOutput(
    JSON.stringify({ success: false, message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" })
  ).setMimeType(ContentService.MimeType.JSON);
}

function handleAddStaff(data) {
  var sheet = getUsersSheet();
  var email = (data.email || "").trim().toLowerCase();
  var allData = sheet.getDataRange().getValues();
  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][1]).trim().toLowerCase() === email) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, message: "البريد الإلكتروني موجود بالفعل" })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }
  var hash = simpleHash(data.password || "123456");
  var roleName = data.roleName || data.role || "موظف";
  var permissions = data.permissions || "[]";
  sheet.appendRow([data.name || "", email, hash, roleName, permissions]);
  return ContentService.createTextOutput(
    JSON.stringify({ success: true, message: "تم إضافة المستخدم بنجاح" })
  ).setMimeType(ContentService.MimeType.JSON);
}

function handleGetStaff(data) {
  var sheet = getUsersSheet();
  var allData = sheet.getDataRange().getValues();
  var users = [];
  for (var i = 1; i < allData.length; i++) {
    users.push({
      name: allData[i][0],
      email: allData[i][1],
      role: allData[i][3],
      roleName: allData[i][3],
      permissions: allData[i][4] || "[]"
    });
  }
  return ContentService.createTextOutput(
    JSON.stringify({ success: true, users: users })
  ).setMimeType(ContentService.MimeType.JSON);
}

function handleUpdateStaff(data) {
  var sheet = getUsersSheet();
  var email = (data.email || "").trim().toLowerCase();
  var allData = sheet.getDataRange().getValues();
  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][1]).trim().toLowerCase() === email) {
      if (data.name) sheet.getRange(i + 1, 1).setValue(data.name);
      if (data.roleName) sheet.getRange(i + 1, 4).setValue(data.roleName);
      if (data.permissions) sheet.getRange(i + 1, 5).setValue(data.permissions);
      if (data.password) sheet.getRange(i + 1, 3).setValue(simpleHash(data.password));
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, message: "تم تحديث بيانات المستخدم" })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(
    JSON.stringify({ success: false, message: "المستخدم غير موجود" })
  ).setMimeType(ContentService.MimeType.JSON);
}

function handleDeleteStaff(data) {
  var sheet = getUsersSheet();
  var email = (data.email || "").trim().toLowerCase();
  var allData = sheet.getDataRange().getValues();
  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][1]).trim().toLowerCase() === email) {
      sheet.deleteRow(i + 1);
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, message: "تم حذف المستخدم" })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(
    JSON.stringify({ success: false, message: "المستخدم غير موجود" })
  ).setMimeType(ContentService.MimeType.JSON);
}

function handleExportResearchers(data) {
  var sheet = getOrCreateSheet();
  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var rows = [];
  for (var i = 1; i < allData.length; i++) {
    var row = [];
    for (var j = 0; j < allData[i].length; j++) {
      row.push(String(allData[i][j]));
    }
    rows.push(row);
  }
  return ContentService.createTextOutput(
    JSON.stringify({ success: true, headers: headers, rows: rows })
  ).setMimeType(ContentService.MimeType.JSON);
}

function handleListAllFiles(data) {
  var mainFolder = DriveApp.getFolderById(FOLDER_ID);
  var researcherFolders = mainFolder.getFolders();
  var allFiles = [];

  while (researcherFolders.hasNext()) {
    var rFolder = researcherFolders.next();
    var folderName = rFolder.getName();
    var parts = folderName.split("_");
    var nationalId = parts.length > 1 ? parts[parts.length - 1] : "";
    var researcherDisplayName = parts.length > 1 ? parts.slice(0, -1).join("_") : folderName;

    for (var stageKey in STAGE_FOLDERS) {
      var stageName = STAGE_FOLDERS[stageKey];
      var stageFolders = rFolder.getFoldersByName(stageName);
      if (stageFolders.hasNext()) {
        var stageFolder = stageFolders.next();
        var files = stageFolder.getFiles();
        while (files.hasNext()) {
          var file = files.next();
          var mimeType = file.getBlob().getContentType() || "";
          var icon = "fa-file";
          if (mimeType.indexOf("pdf") !== -1) icon = "fa-file-pdf";
          else if (mimeType.indexOf("image") !== -1) icon = "fa-file-image";
          else if (mimeType.indexOf("word") !== -1 || mimeType.indexOf("document") !== -1) icon = "fa-file-word";
          else if (mimeType.indexOf("spreadsheet") !== -1 || mimeType.indexOf("excel") !== -1) icon = "fa-file-excel";

          allFiles.push({
            id: file.getId(),
            name: file.getName(),
            researcherName: researcherDisplayName,
            nationalId: nationalId,
            stage: stageName,
            stageKey: stageKey,
            size: file.getSize(),
            mimeType: mimeType,
            icon: icon,
            dateCreated: file.getDateCreated().toISOString(),
            lastUpdated: file.getLastUpdated().toISOString(),
            viewUrl: "https://drive.google.com/file/d/" + file.getId() + "/preview",
            directUrl: "https://drive.google.com/uc?export=download&id=" + file.getId()
          });
        }
      }
    }
  }

  allFiles.sort(function (a, b) {
    return new Date(b.lastUpdated) - new Date(a.lastUpdated);
  });

  return ContentService.createTextOutput(
    JSON.stringify({ success: true, files: allFiles, total: allFiles.length })
  ).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateMessagesSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(MESSAGES_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(MESSAGES_SHEET_NAME);
    sheet.appendRow(["رقم الرسالة", "اسم المرسل", "الرقم القومي", "البريد الإلكتروني", "العنوان", "الرسالة", "التاريخ", "الحالة", "رد الموظف", "تاريخ الرد", "الرد من"]);
    sheet.getRange("1:1").setFontWeight("bold").setBackground("#1a73e8").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 120);
    sheet.setColumnWidth(5, 200);
    sheet.setColumnWidth(6, 350);
    sheet.setColumnWidth(9, 350);
  }
  return sheet;
}

function handleSendMessage(data) {
  var sheet = getOrCreateMessagesSheet();
  var msgId = "MSG-" + new Date().getTime();
  var now = new Date().toISOString();
  sheet.appendRow([
    msgId,
    data.senderName || "",
    data.nationalId || "",
    data.email || "",
    data.subject || "",
    data.message || "",
    now,
    "جديدة",
    "",
    "",
    ""
  ]);
  return ContentService.createTextOutput(
    JSON.stringify({ success: true, messageId: msgId })
  ).setMimeType(ContentService.MimeType.JSON);
}

function handleGetMessages(data) {
  var sheet = getOrCreateMessagesSheet();
  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var rows = [];
  for (var i = 1; i < allData.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = String(allData[i][j]);
    }
    row.rowIndex = i + 1;
    rows.push(row);
  }
  if (data.nationalId) {
    rows = rows.filter(function(r) { return r["الرقم القومي"] === data.nationalId; });
  }
  rows.reverse();
  return ContentService.createTextOutput(
    JSON.stringify({ success: true, messages: rows, total: rows.length })
  ).setMimeType(ContentService.MimeType.JSON);
}

function handleReplyMessage(data) {
  var sheet = getOrCreateMessagesSheet();
  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var msgIdIdx = headers.indexOf("رقم الرسالة");
  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][msgIdIdx]) === data.messageId) {
      var replyIdx = headers.indexOf("رد الموظف");
      var replyDateIdx = headers.indexOf("تاريخ الرد");
      var replyByIdx = headers.indexOf("الرد من");
      var statusIdx = headers.indexOf("الحالة");
      sheet.getRange(i + 1, replyIdx + 1).setValue(data.reply || "");
      sheet.getRange(i + 1, replyDateIdx + 1).setValue(new Date().toISOString());
      sheet.getRange(i + 1, replyByIdx + 1).setValue(data.replyBy || "الموظف");
      sheet.getRange(i + 1, statusIdx + 1).setValue("تم الرد");
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, message: "تم إرسال الرد بنجاح" })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(
    JSON.stringify({ success: false, message: "الرسالة غير موجودة" })
  ).setMimeType(ContentService.MimeType.JSON);
}
