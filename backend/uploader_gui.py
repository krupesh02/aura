"""
Aura Auto-Sync Desktop Uploader GUI
Photographer ke liye desktop app — folders monitor kare, auto-create kare, photos upload kare.

Usage: python uploader_gui.py
"""
import sys
import os

# Add backend to path so uploader package is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QLineEdit, QPushButton, QTextEdit, QFileDialog,
    QGroupBox, QTableWidget, QTableWidgetItem, QHeaderView,
    QMessageBox, QStatusBar, QSplitter, QFrame, QStackedWidget
)
from PyQt5.QtCore import Qt, QThread, pyqtSignal, QTimer
from PyQt5.QtGui import QFont, QColor, QPalette, QIcon

from uploader.config import load_config, save_config
from uploader.sync_engine import SyncEngine


# ═══════════════════════════════════════════════════════════════════════════════
# DARK THEME STYLESHEET
# ═══════════════════════════════════════════════════════════════════════════════

DARK_STYLE = """
QMainWindow {
    background-color: #111111;
}
QWidget {
    background-color: #111111;
    color: #F0EDE8;
    font-family: 'Inter', 'Segoe UI', sans-serif;
}

/* Login Page Styles */
#loginCard {
    background-color: #1c1c1c;
    border: 1px solid #2a2a2a;
    border-radius: 20px;
}
#logoLabel {
    font-size: 42px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: -2px;
}
#taglineLabel {
    color: #666666;
    font-size: 14px;
    margin-bottom: 20px;
}

/* Dashboard Styles */
#navbar {
    background-color: #1a1a1a;
    border-bottom: 1px solid #2a2a4a;
}
#navTitle {
    font-size: 18px;
    font-weight: 800;
    color: #D4915A;
}
#userPill {
    background-color: #252525;
    border-radius: 15px;
    padding: 5px 15px;
    color: #F0EDE8;
    font-weight: 600;
    font-size: 12px;
    border: 1px solid #333;
}

/* Section Labels */
QLabel#sectionHeader {
    color: #666666;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 8px;
}

/* Inputs */
QLineEdit {
    background-color: #161616;
    border: 1px solid #2a2a2a;
    border-radius: 10px;
    padding: 12px 16px;
    color: #ffffff;
    font-size: 14px;
}
QLineEdit:focus {
    border: 1px solid #D4915A;
}

/* Buttons */
QPushButton {
    background-color: #D4915A;
    color: #000000;
    border: none;
    border-radius: 10px;
    padding: 12px 24px;
    font-weight: 800;
    font-size: 13px;
}
QPushButton:hover {
    background-color: #E6A36C;
}
QPushButton#stopBtn {
    background-color: #2a1a1a;
    color: #ef4444;
    border: 1px solid #442222;
}
QPushButton#stopBtn:hover {
    background-color: #3d1a1a;
}
QPushButton#ghostBtn {
    background-color: transparent;
    color: #666666;
    border: 1px solid #333333;
}
QPushButton#ghostBtn:hover {
    background-color: #222;
    color: #eee;
}

/* Table & Log */
QTableWidget {
    background-color: #111111;
    border: none;
    gridline-color: transparent;
    outline: none;
}
QHeaderView::section {
    background-color: #111111;
    color: #555555;
    padding: 12px;
    border: none;
    border-bottom: 1px solid #2a2a2a;
    font-weight: 800;
    font-size: 10px;
    text-transform: uppercase;
}
QTextEdit {
    background-color: #0c0c0c;
    border: 1px solid #222222;
    border-radius: 12px;
    padding: 15px;
    color: #888888;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
}

QStatusBar {
    background-color: #0c0c0c;
    color: #666666;
    border-top: 1px solid #1a1a1a;
    font-size: 10px;
}
"""


class LogSignal(QThread):
    """Thread-safe signal emitter for log messages from background threads."""
    log_signal = pyqtSignal(str)
    status_signal = pyqtSignal(dict)
    progress_signal = pyqtSignal(str, bool, str)


class AuraUploaderGUI(QMainWindow):
    """Main GUI window for the Aura Desktop Uploader."""

    def __init__(self):
        super().__init__()
        self.setWindowTitle("Aura Auto-Sync Uploader")
        self.setMinimumSize(800, 650)
        self.resize(900, 700)

        # Signal bridge for thread-safe GUI updates
        self.signals = LogSignal()
        self.signals.log_signal.connect(self._append_log)
        self.signals.status_signal.connect(self._update_mappings_table)
        self.signals.progress_signal.connect(self._on_upload_done)

        # Sync engine
        self.engine = SyncEngine(
            on_log=lambda msg: self.signals.log_signal.emit(msg),
            on_status_update=lambda m: self.signals.status_signal.emit(m),
            on_upload_progress=lambda f, s, m: self.signals.progress_signal.emit(f, s, m),
        )

        self.config = load_config()
        self._build_ui()
        self.setStyleSheet(DARK_STYLE)
        self._restore_saved_state()

    # ── UI Construction ──────────────────────────────────────────────────────

    def _build_ui(self):
        self.stacked = QStackedWidget()
        self.setCentralWidget(self.stacked)

        # Build Screen 1: Login
        self.login_screen = self._build_login_screen()
        self.stacked.addWidget(self.login_screen)

        # Build Screen 2: Dashboard
        self.dashboard_screen = self._build_dashboard_screen()
        self.stacked.addWidget(self.dashboard_screen)

        self.stacked.setCurrentIndex(0)
        self.statusBar().showMessage("Ready — Please log in")

    def _build_login_screen(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setAlignment(Qt.AlignCenter)

        # Logo Section
        logo_box = QVBoxLayout()
        logo_box.setAlignment(Qt.AlignCenter)
        
        logo = QLabel("AURA")
        logo.setObjectName("logoLabel")
        logo_box.addWidget(logo)
        
        tagline = QLabel("The professional sync engine for modern photography.")
        tagline.setObjectName("taglineLabel")
        logo_box.addWidget(tagline)
        layout.addLayout(logo_box)
        layout.addSpacing(20)

        # Card
        card = QFrame()
        card.setObjectName("loginCard")
        card.setFixedWidth(420)
        card_layout = QVBoxLayout(card)
        card_layout.setContentsMargins(40, 50, 40, 50)
        card_layout.setSpacing(20)

        # Fields
        field_layout = QVBoxLayout()
        field_layout.setSpacing(15)

        self.server_input = QLineEdit(self.config.get("server_url", "http://localhost:8000"))
        self.server_input.setPlaceholderText("Server URL (e.g. http://...)")
        field_layout.addWidget(self.server_input)

        self.email_input = QLineEdit(self.config.get("user_email", ""))
        self.email_input.setPlaceholderText("Email Address")
        field_layout.addWidget(self.email_input)

        self.pass_input = QLineEdit()
        self.pass_input.setEchoMode(QLineEdit.Password)
        self.pass_input.setPlaceholderText("Password")
        field_layout.addWidget(self.pass_input)
        card_layout.addLayout(field_layout)

        self.login_btn = QPushButton("Log In to Aura")
        self.login_btn.setMinimumHeight(50)
        self.login_btn.clicked.connect(self._on_login)
        card_layout.addWidget(self.login_btn)

        self.login_status = QLabel("")
        self.login_status.setAlignment(Qt.AlignCenter)
        self.login_status.setStyleSheet("font-size: 11px; margin-top: 10px;")
        card_layout.addWidget(self.login_status)

        layout.addWidget(card)
        return page

    def _build_dashboard_screen(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # Navbar
        nav = QFrame()
        nav.setObjectName("navbar")
        nav.setFixedHeight(70)
        nav_layout = QHBoxLayout(nav)
        nav_layout.setContentsMargins(30, 0, 30, 0)

        title = QLabel("AURA SYNC")
        title.setObjectName("navTitle")
        nav_layout.addWidget(title)
        nav_layout.addStretch()

        self.user_pill = QLabel("Not Connected")
        self.user_pill.setObjectName("userPill")
        nav_layout.addWidget(self.user_pill)

        logout_btn = QPushButton("Logout")
        logout_btn.setObjectName("ghostBtn")
        logout_btn.setFixedWidth(80)
        logout_btn.clicked.connect(self._on_logout)
        nav_layout.addWidget(logout_btn)
        
        layout.addWidget(nav)

        # Main Content
        content = QWidget()
        content_layout = QVBoxLayout(content)
        content_layout.setContentsMargins(40, 30, 40, 20)
        content_layout.setSpacing(30)

        # Sync Setup
        sync_section = QVBoxLayout()
        sync_label = QLabel("Collection Synchronization")
        sync_label.setObjectName("sectionHeader")
        sync_section.addWidget(sync_label)

        sync_row = QHBoxLayout()
        sync_row.setSpacing(12)

        self.folder_input = QLineEdit(self.config.get("root_folder", ""))
        self.folder_input.setPlaceholderText("Path to root folder...")
        sync_row.addWidget(self.folder_input)

        browse_btn = QPushButton("Browse")
        browse_btn.setObjectName("ghostBtn")
        browse_btn.setFixedWidth(80)
        browse_btn.clicked.connect(self._browse_folder)
        sync_row.addWidget(browse_btn)

        self.price_input = QLineEdit()
        self.price_input.setPlaceholderText("Price")
        self.price_input.setFixedWidth(70)
        sync_row.addWidget(self.price_input)

        self.start_btn = QPushButton("Start Sync")
        self.start_btn.setFixedWidth(110)
        self.start_btn.clicked.connect(self._on_start)
        sync_row.addWidget(self.start_btn)

        self.stop_btn = QPushButton("Stop")
        self.stop_btn.setObjectName("stopBtn")
        self.stop_btn.setFixedWidth(70)
        self.stop_btn.setEnabled(False)
        self.stop_btn.clicked.connect(self._on_stop)
        sync_row.addWidget(self.stop_btn)
        sync_section.addLayout(sync_row)
        content_layout.addLayout(sync_section)

        # Monitoring
        splitter = QSplitter(Qt.Vertical)
        splitter.setHandleWidth(1)

        # Table
        table_box = QVBoxLayout()
        table_lbl = QLabel("Active Gallery Events")
        table_lbl.setObjectName("sectionHeader")
        table_box.addWidget(table_lbl)
        self.mapping_table = QTableWidget(0, 4)
        self.mapping_table.setHorizontalHeaderLabels(["Folder", "Event", "Photos", "Status"])
        self.mapping_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        table_box.addWidget(self.mapping_table)
        table_cont = QWidget()
        table_cont.setLayout(table_box)
        splitter.addWidget(table_cont)

        # Log
        log_box = QVBoxLayout()
        log_lbl = QLabel("System Activity Log")
        log_lbl.setObjectName("sectionHeader")
        log_box.addWidget(log_lbl)
        self.log_area = QTextEdit()
        self.log_area.setReadOnly(True)
        log_box.addWidget(self.log_area)
        log_cont = QWidget()
        log_cont.setLayout(log_box)
        splitter.addWidget(log_cont)

        splitter.setSizes([350, 150])
        content_layout.addWidget(splitter)
        layout.addWidget(content)
        return page

        # Status bar
        self.statusBar().showMessage("Ready to sync.")

    # ── Event Handlers ───────────────────────────────────────────────────────

    def _on_login(self):
        server = self.server_input.text().strip()
        email = self.email_input.text().strip()
        password = self.pass_input.text().strip()

        if not server or not email or not password:
            QMessageBox.warning(self, "Error", "Server URL, Email aur Password bharna zaroori hai!")
            return

        self.login_btn.setEnabled(False)
        self.login_btn.setText("⏳ Logging in...")

        try:
            result = self.engine.login(server, email, password)
            user_name = result.get("user", {}).get("name", email)
            self.user_pill.setText(user_name)
            self.stacked.setCurrentIndex(1)
            self.statusBar().showMessage(f"Connected — {user_name}")
            self._append_log(f"✅ Login successful: {user_name}")
        except Exception as e:
            self.login_status.setText(f"❌ Login failed: {e}")
            self.login_status.setStyleSheet("color: #ef4444;")
            self._append_log(f"❌ Login failed: {e}")
        finally:
            self.login_btn.setEnabled(True)
            self.login_btn.setText("Log In to Aura")

    def _on_logout(self):
        self.engine.stop_watching()
        self.stacked.setCurrentIndex(0)
        self.login_status.setText("Logged out successfully.")
        self.login_status.setStyleSheet("color: #666;")
        self.statusBar().showMessage("Logged out")

    def _browse_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "Select Root Folder")
        if folder:
            self.folder_input.setText(folder)

    def _on_start(self):
        root = self.folder_input.text().strip()
        price_str = self.price_input.text().strip() or "0"
        
        try:
            price = int(price_str)
        except ValueError:
            QMessageBox.warning(self, "Error", "Price sirf numbers mein likhein (e.g. 999)")
            return

        if not root:
            QMessageBox.warning(self, "Error", "Root folder select karein!")
            return
        if not os.path.isdir(root):
            QMessageBox.warning(self, "Error", f"Folder nahi mila: {root}")
            return

        success = self.engine.start_watching(root, price=price)
        if success:
            self.start_btn.setEnabled(False)
            self.stop_btn.setEnabled(True)
            self.statusBar().showMessage(f"🟢 Watching: {root} (Price: ₹{price})")
            self._load_existing_mappings()

    def _on_stop(self):
        self.engine.stop_watching()
        self.start_btn.setEnabled(True)
        self.stop_btn.setEnabled(False)
        self.statusBar().showMessage("⏹️ Stopped")

    # ── GUI Updates (thread-safe via signals) ────────────────────────────────

    def _append_log(self, msg):
        self.log_area.append(msg)
        # Auto-scroll to bottom
        scrollbar = self.log_area.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())

    def _update_mappings_table(self, mappings):
        self.mapping_table.setRowCount(0)
        for path, info in mappings.items():
            row = self.mapping_table.rowCount()
            self.mapping_table.insertRow(row)
            self.mapping_table.setItem(row, 0, QTableWidgetItem(os.path.basename(path)))
            self.mapping_table.setItem(row, 1, QTableWidgetItem(info.get("folder_name", "")))
            uploaded = info.get("uploaded_count", 0)
            self.mapping_table.setItem(row, 2, QTableWidgetItem(str(uploaded)))
            self.mapping_table.setItem(row, 3, QTableWidgetItem("✅ Synced"))

    def _on_upload_done(self, file_path, success, msg):
        # Refresh mappings table to show updated counts
        if self.engine.config.get("mappings"):
            self._update_mappings_table(self.engine.config["mappings"])

    def _load_existing_mappings(self):
        if self.engine.config.get("mappings"):
            self._update_mappings_table(self.engine.config["mappings"])

    # ── Restore Saved State ──────────────────────────────────────────────────

    def _restore_saved_state(self):
        """Try to auto-connect using saved credentials."""
        self._append_log("🚀 Aura Auto-Sync Uploader started")
        if self.engine.restore_session():
            user_email = self.config.get("user_email", "")
            self.user_pill.setText(user_email)
            self.stacked.setCurrentIndex(1)
            self.statusBar().showMessage(f"Connected — {user_email}")

            # Auto-load existing mappings
            if self.config.get("mappings"):
                self._update_mappings_table(self.config["mappings"])

    def closeEvent(self, event):
        """Clean up on window close."""
        self.engine.stop_watching()
        event.accept()


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    app = QApplication(sys.argv)
    app.setApplicationName("Aura Auto-Sync Uploader")
    window = AuraUploaderGUI()
    window.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
