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
        from PySide6.QtWidgets import QFileDialog
        import csv
        import datetime

        # Open file dialog to choose save location
        file_name, _ = QFileDialog.getSaveFileName(
            self,
            "Export Coin Data",
            "coin_collection.csv",
            "CSV Files (*.csv);;All Files (*)"
        )

        if file_name:
            try:
                with open(file_name, 'w', newline='', encoding='utf-8') as csvfile:
                    writer = csv.writer(csvfile)

                    # Write headers
                    headers = [
                        'Title', 'Year', 'Country', 'Denomination', 'Mint Mark',
                        'Condition', 'Grading', 'Purchase Date', 'Purchase Price',
                        'Current Value', 'Notes', 'Is Proof'
                    ]
                    writer.writerow(headers)

                    # Get all coins from database
                    coins = self.db_manager.get_all_coins()

                    # Write coin data
                    for coin in coins:
                        row = [
                            coin.title,
                            coin.year,
                            coin.country,
                            coin.denomination,
                            coin.mint_mark,
                            coin.condition,
                            coin.grading,
                            coin.purchase_date.strftime('%Y-%m-%d') if coin.purchase_date else '',
                            f"{coin.purchase_price:.2f}" if coin.purchase_price else '',
                            f"{coin.current_value:.2d}" if coin.current_value else '',
                            coin.notes,
                            'Yes' if coin.is_proof else 'No'
                        ]
                        writer.writerow(row)

                from PySide6.QtWidgets import QMessageBox
                QMessageBox.information(
                    self,
                    "Export Successful",
                    f"Collection data has been exported to {file_name}"
                )
            except Exception as e:
                QMessageBox.critical(
                    self,
                    "Export Failed",
                    f"An error occurred while exporting: {str(e)}"
                )
        pass