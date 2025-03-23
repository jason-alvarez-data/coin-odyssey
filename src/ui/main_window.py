from PySide6.QtWidgets import (QMainWindow, QWidget, QVBoxLayout,
                               QHBoxLayout, QPushButton, QTableView, QLabel,
                               QLineEdit, QComboBox, QFrame, QStackedWidget)
from PySide6.QtCore import Qt, Slot
from PySide6.QtGui import QFont, QIcon
from .dialogs.add_coin_dialog import AddCoinDialog
from .dialogs.analysis_dialog import AnalysisDialog
from .widgets.coin_table_widget import CoinTableWidget
from .widgets.home_dashboard import HomeDashboard

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
                background-color: #f5f5f5;
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
            QFrame#SearchFrame {
                background-color: white;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                margin: 8px;
            }
            QLineEdit, QComboBox {
                padding: 6px;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                background-color: white;
            }
            QComboBox:hover, QLineEdit:focus {
                border: 1px solid @2196F3;
            }
        """)

        # Create central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QHBoxLayout(central_widget)

        # Create sidebar
        sidebar = self.create_sidebar()

        # Create main content
        main_content = QWidget()
        main_layout = QVBoxLayout(main_content)

        # Create stacked widget for switching between views
        self.main_stack = QStackedWidget()

        # Create dashboard and coin table
        self.dashboard = HomeDashboard(self.db_manager)
        self.coin_table_container = QWidget()
        coin_table_layout = QVBoxLayout(self.coin_table_container)

        # Add search frame and coin table to container
        search_frame = self.create_search_frame()
        self.coin_table = CoinTableWidget(self.db_manager)
        coin_table_layout.addWidget(search_frame)
        coin_table_layout.addWidget(self.coin_table)

        # Add both views to stack
        self.main_stack.addWidget(self.dashboard)
        self.main_stack.addWidget(self.coin_table_container)

        # Add Stack to main layout
        main_layout.addWidget(self.main_stack)

        # Add widgets to layout
        layout.addWidget(sidebar)
        layout.addWidget(main_content, stretch=1)

    def create_search_frame(self):
        frame = QFrame()
        frame.setObjectName("searchFrame")
        layout = QVBoxLayout(frame)

        # Create search controls
        search_layout = QHBoxLayout()

        # Search input
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search coins...")
        self.search_input.textChanged.connect(self.apply_filters)

        # Search field selector
        self.search_field = QComboBox()
        self.search_field.addItems(['All Fields', 'Title', 'Country', 'Year', 'Denomination'])
        self.search_field.currentTextChanged.connect(self.apply_filters)

        # Condition filter
        self.condition_filter = QComboBox()
        self.condition_filter.addItem('All Conditions')
        self.condition_filter.addItems([
            "Mint State (MS)",
            "About Uncirculated (AU)",
            "Extremely Fine (XF)",
            "Very Fine (VF)",
            "Fine (F)",
            "Very Good (VG)",
            "Good (G)",
            "Fair"
        ])
        self.condition_filter.currentTextChanged.connect(self.apply_filters)

        # Value range filter
        self.value_filter = QComboBox()
        self.value_filter.addItems([
            'All Values',
            'Under $10',
            '$10 - $50',
            '$50 - $100',
            '$100 - $500',
            'Over $500'
        ])
        self.value_filter.currentTextChanged.connect(self.apply_filters)

        # Add widgets to search layout
        search_layout.addWidget(QLabel("Search:"))
        search_layout.addWidget(self.search_input)
        search_layout.addWidget(self.search_field)
        search_layout.addWidget(QLabel("Condition:"))
        search_layout.addWidget(self.condition_filter)
        search_layout.addWidget(QLabel("Value:"))
        search_layout.addWidget(self.value_filter)
        search_layout.addStretch()

        layout.addLayout(search_layout)
        return frame

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
        btn_home = QPushButton("Home")
        btn_add = QPushButton("Add Coin")
        btn_analysis = QPushButton("Analysis")
        btn_export = QPushButton("Export")

        # Connect signals
        btn_home.clicked.connect(self.show_dashboard)
        btn_add.clicked.connect(self.show_add_dialog)
        btn_analysis.clicked.connect(self.show_analysis)
        btn_export.clicked.connect(self.export_data)

        # Add buttons to layout
        layout.addWidget(btn_home)
        layout.addWidget(btn_add)
        layout.addWidget(btn_analysis)
        layout.addWidget(btn_export)
        layout.addStretch()

        return sidebar
    
    @Slot()
    def apply_filters(self):
        search_text = self.search_input.text()
        search_field = self.search_field.currentText()
        condition = self.condition_filter.currentText()
        value_range = self.value_filter.currentText()

        self.coin_table.apply_filters(
            search_text=search_text,
            search_field=search_field,
            condition=condition if condition != 'All Conditions' else None,
            value_range=value_range if value_range != 'All Values' else None
        )
    
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

    @Slot()
    def show_dashboard(self):
        self.main_stack.setCurrentWidget(self.dashboard)

    @Slot()
    def show_coin_table(self):
        self.main_stack.setCurrentWidget(self.coin_table_container)