from PySide6.QtWidgets import (QMainWindow, QWidget, QVBoxLayout,
                               QHBoxLayout, QPushButton, QTableView, QLabel)
from PySide6.QtCore import Qt, Slot
from PySide6.QtGui import QFont, QIcon
from .dialogs.add_coin_dialog import AddCoinDialog
from .dialogs.analysis_dialog import AnalysisDialog
from .widgets.coin_table_widget import CoinTableWidget

class MainWindow(QMainWindow):
    def __init__(self, db_manager):
        super().__init__()
        self.db_manager = db_manager
        self.setup_ui()

    def setup_ui(self):
        self.setWindowTitle("Coin Odyssey")
        self.setMinimumSize(1200, 800)

        # Apply modern styling
        self.setStyleSheet("""
            QMainWindow {
                background_color: #f5f5f5;
            }
            QPushButton {
                background-color: #2196F3;
                color: white;
                border: none;
                padding: 10px;
                border-radius: 4px;
                font-size: 14px;
                min-width: 120px;
            }
            QPushButton:hover {
                background-color: #1976D2;
            }
        """)

        # Create central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QHBoxLayout(central_widget)

        # Create sidebar
        sidebar = self.create_sidebar()

        # Create main content
        self.coin_table = CoinTableWidget(self.db_manager)

        # Add widgets to layout
        layout.addWidget(sidebar)
        layout.addWidget(self.coin_table, stretch=1)

    def create_sidebar(self):
        sidebar = QWidget()
        sidebar.setMaximumWidth(200)
        layout = QVBoxLayout(sidebar)

        # Add title label
        title_label = QLabel("Coin Odyssey")
        title_label.setAlignment(Qt.AlignCenter)
        title_label.setStyleSheet("""
            QLabel {
                color: #2196F3;
                font-size: 24px;
                font-weight: bold;
                padding: 20px 0;
                border-bottom: 2px solid #e0e0e0;
                margin-bottom: 20px;
            }
        """)

        # Add title to layout before buttons
        layout.addWidget(title_label)

        # Create buttons
        btn_add = QPushButton("Add Coin")
        btn_analysis = QPushButton("Analysis")
        btn_export = QPushButton("Export")

        # Connect signals
        btn_add.clicked.connect(self.show_add_dialog)
        btn_analysis.clicked.connect(self.show_analysis)
        btn_export.clicked.connect(self.export_data)

        # Add buttons to layout
        layout.addWidget(btn_add)
        layout.addWidget(btn_analysis)
        layout.addWidget(btn_export)
        layout.addStretch()

        return sidebar
    
    @Slot()
    def show_add_dialog(self):
        dialog = AddCoinDialog(self.db_manager, self)
        if dialog.exec():
            self.coin_table.refresh_data()

    @Slot()
    def show_analysis(self):
        dialog = AnalysisDialog(self.db_manager, self)
        dialog.exec()

    @Slot()
    def export_data(self):
        # TODO: Implement export functionality
        pass