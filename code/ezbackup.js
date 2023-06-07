/**
 * @file EZ Backup for Toonboom Harmony
 * @copyright Visual Droids < www.visualdroids.com >
 * @author miwgel < github.com/miwgel >
 */

function init(packageInfo, debug) {
  this.__proto__.ezbackup = new EzBackup(packageInfo, debug);
}

function EzBackup(packageInfo, debug) {
  if (typeof debug === "undefined") var debug = false;

  this.packageInfo = packageInfo;
  this.debug = debug;

  this.sevenZip = require(this.packageInfo.packageFolder +
    "/lib/FileArchiver/sevenzip.js").SevenZip;

  this.isBackupRunning = false;

  // Audio Beeps
  this.beep = {
    win: new (require(this.packageInfo.packageFolder +
      "/lib/AudioPlayer/audioplayer.js").AudioPlayer)(
      this.packageInfo.packageFolder + "/sound/win.wav"
    ),
  };

  // Init sequence
  this.setupToolbarUI(); // Setup Toolbar UI
  this.hookToolbar(); // Hook Toolbar UI to the Toonboom Harmony toolbar
}

// Toolbar user interface functions
EzBackup.prototype.hookToolbar = function () {
  this.hook = new (require(this.packageInfo.packageFolder +
    "/lib/ToolbarHook/toolbarhook.js").ToolbarHook)(
    this.packageInfo,
    this.setupToolbarUI(),
    true,
    this.debug
  );
};

EzBackup.prototype.setupToolbarUI = function () {
  this.toolbarui = UiLoader.load(
    this.packageInfo.packageFolder + "/toolbar.ui"
  );

  this.toolbarui.progressBar.setVisible(false);

  this.toolbarui.zipButton.clicked.connect(this, function () {
    this.backup.call(this);
  });
  this.toolbarui.success.clicked.connect(this, function () {
    this.openFolder.call(this, scene.currentProjectPathRemapped() + "/backups");
  });

  // Add Icons to Buttons
  this.toolbarui.zipButton.icon = new QIcon(
    this.packageInfo.packageFolder + "/icons/ezbackup.png"
  );
  this.toolbarui.success.setVisible(false);

  this.toolbarui.zipButton.setStyleSheet("color: white; border-radius: 5px;");

  return this.toolbarui;
};

EzBackup.prototype.getCurrentDateTime = function () {
  var now = new Date();
  return (
    now.getFullYear() +
    "" +
    ("0" + (now.getMonth() + 1)).slice(-2) +
    "" +
    ("0" + now.getDate()).slice(-2) +
    "-" +
    ("0" + now.getHours()).slice(-2) +
    "" +
    ("0" + now.getMinutes()).slice(-2) +
    "" +
    ("0" + now.getSeconds()).slice(-2)
  );
};

EzBackup.prototype.backup = function () {
  try {
    // Avoid running backup if another backup is running
    if (this.isBackupRunning) {
      return;
    }
    this.isBackupRunning = true;

    this.toolbarui.zipButton.setEnabled(false);
    this.toolbarui.success.setVisible(false);

    if (scene.isDirty()) {
      this.toolbarui.progressBar.setRange(0, 0);
      this.toolbarui.progressBar.setVisible(true);

      var dialog = new QMessageBox(this);
      dialog.setWindowFlags(dialog.windowFlags() | Qt.WindowStaysOnTopHint);
      dialog.text = "Save Scene?";
      dialog.informativeText =
        "Do you want to save the current scene before backup?\n";
      dialog.standardButtons = new QMessageBox.StandardButtons(
        QMessageBox.Save | QMessageBox.No | MessageBox.Cancel
      );
      dialog.escapeButton = undefined;

      dialog.raise();
      var answer = dialog.exec();

      if (answer == QMessageBox.Save) {
        scene.saveAll();
      } else if (answer == QMessageBox.No) {
      } else if (answer == QMessageBox.Cancel) {
        this.toolbarui.zipButton.setEnabled(true);
        this.toolbarui.progressBar.setVisible(false);
        this.isBackupRunning = false;
        return;
      }
    }

    var zipSource = scene.currentProjectPathRemapped().split("\\").join("/");

    var zipDestination = (
      scene.currentProjectPathRemapped() +
      "/backups/" +
      scene.currentScene() +
      "-" +
      this.getCurrentDateTime() +
      ".zip"
    )
      .split("\\")
      .join("/");

    var processStartCallback = function () {
      try {
        this.toolbarui.progressBar.setRange(0, 100);
        this.toolbarui.progressBar.setValue(0);
        this.toolbarui.progressBar.setVisible(true);
      } catch (error) {
        MessageLog.trace(error);
      }
    };

    var progressCallback = function (progressValue) {
      try {
        // MessageLog.trace("Progress > " + progressValue);
        this.toolbarui.progressBar.setValue(progressValue);
      } catch (error) {
        MessageLog.trace(error);
      }
    };

    var processEndCallback = function (result) {
      try {
        if (result) {
          this.beep.win.play();
          var timer = new QTimer();
          timer.singleShot = true;
          timer.timeout.connect(this, function () {
            this.toolbarui.success.setVisible(false);
          });
          timer.start(7000);
          this.toolbarui.success.setVisible(true);
        }

        this.toolbarui.zipButton.setEnabled(true);
        this.toolbarui.progressBar.setVisible(false);
        this.isBackupRunning = false;
      } catch (error) {
        MessageLog.trace(error);
      }
    };

    var zipper = new this.sevenZip(
      (parentContext = this),
      (source = zipSource),
      (destination = zipDestination),
      (processStartCallback = processStartCallback),
      (progressCallback = progressCallback),
      (processEndCallback = processEndCallback),
      (filter = "backups"),
      (debug = this.debug)
    );
    zipper.zipAsync();
  } catch (error) {
    MessageLog.trace(error);
    // this.log(error);
  }
};

EzBackup.prototype.openFolder = function (folderPath) {
  QDesktopServices.openUrl(QUrl.fromLocalFile(folderPath));
};

EzBackup.prototype.log = function (stuff) {
  if (this.debug) {
    if (typeof stuff === "object" || typeof stuff === "array") {
      stuff = JSON.stringify(stuff);
    }
    MessageLog.trace(
      "[ " + this.packageInfo.packageFullName + " ] > " + string
    );
  }
};

function triggerBackupFromKeyboard() {
  // var packageInfo = require("./configure.js").packageInfo;
  // var ui = new EzBackup(packageInfo, true);
  // ui.backup();
  this.__proto__.ezbackup.backup();
}

function debugging() {
  // For quick debuging
  // var packageInfo = require("./configure.js").packageInfo;
  MessageLog.clearLog();
  // MessageLog.trace(typeof QSoundEffect);
  // var sfx = new QSoundEffect();

  // sfx.setSource(
  //   QUrl.fromLocalFile(packageInfo.packageFolder + "/sound/win.wav")
  // );
  // sfx.play();
  // MessageLog.trace(packageInfo + "/sound/win.wav");
  // var packageInfo = require("./configure.js").packageInfo;
  // var ui = new EzBackup(packageInfo, true);
  // ui.backup();
  //   ui.toolbarui.show(); // Remember to unhook commenting this.hookToolbar() in main class

  try {
  } catch (error) {
    MessageLog.trace(error);
  }
  // dialog.exec;
  // dialog.raise;
}

exports.init = init;
// exports.EzBackup = EzBackup;
