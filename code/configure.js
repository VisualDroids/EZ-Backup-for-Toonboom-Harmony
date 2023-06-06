/**
 * @file EZ Backup for Toonboom Harmony
 * @copyright Visual Droids < www.visualdroids.com >
 * @author miwgel < github.com/miwgel >
 */

function fetchData(absFilePath) {
  var readFile = new QFile(absFilePath);
  try {
    if (!readFile.open(QIODevice.ReadOnly)) {
      throw new Error("Unable to open file.");
    }
    var data = readFile.readAll();
    return data;
  } catch (err) {
    MessageLog.trace(err);
  } finally {
    readFile.close();
  }
}

const packageFolder = __file__
  .split("\\")
  .join("/")
  .split("/")
  .slice(0, -1)
  .join("/");

var vdPackage = JSON.parse(fetchData(packageFolder + "/vdpackage.json"));

const packageInfo = {
  packagePublisher: vdPackage.packagePublisher,
  packageName: vdPackage.packageName,
  packageShortName: vdPackage.packageShortName,
  packageFullName: vdPackage.packageFullName,
  packageID: vdPackage.packageID,
  packageFolder: packageFolder,
  packageVersion: vdPackage.packageVersion,
  packageApiURL: vdPackage.packageApiURL,
};

function configure(packageFolder, packageName) {
  if (about.isPaintMode()) return;

  // Keyboard Shortcuts
  ScriptManager.addShortcut({
    id: "com.visualdroids.ezbackup.keybind1",
    text: "EZ Backup: Create a backup of the scene",
    action: "triggerBackupFromKeyboard in " + packageFolder + "/ezbackup.js",
    longDesc: "Triggers a backup right away",
    categoryId: "Visual Droids",
    categoryText: packageInfo.packageShortName,
  });

  var toolbar = new ScriptToolbarDef({
    id: packageInfo.packageID,
    text: packageInfo.packageFullName,
    customizable: false,
  });

  // toolbar.addButton({
  //   text: packageInfo.packageShortName + " Debuging",
  //   icon: "",
  //   checkable: false,
  //   action: "debugging in " + packageFolder + "/ezbackup.js",
  // });

  ScriptManager.addToolbar(toolbar);

  try {
    // Create an updater instance
    var Updater = require(packageFolder + "/lib/Updater/updater.js").Updater;
    new Updater(packageInfo, false);
  } catch (error) {
    MessageLog.trace(error);
  }
  try {
    // Create an EZ Backup instance
    var ezBackup = require(packageFolder + "/ezbackup.js").init;
    ezBackup(packageInfo, false);
  } catch (error) {
    MessageLog.trace(error);
  }
}

exports.packageInfo = packageInfo;
exports.configure = configure;
