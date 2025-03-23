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
                background-color: #f8f9fc;
            }
            
            /* Sidebar Styling */
            QWidget#sidebar {
                background-color: #4157DC;
                min-width: 225px;
                max-width: 225px;
                padding: 0;
            }
            
            QWidget#sidebar QLabel {
                color: white;
                font-size: 16px;
                font-weight: bold;
                padding: 24px 20px;
            }
            
            QWidget#sidebar QPushButton {
                background-color: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                text-align: left;
                padding: 12px 24px;
                font-size: 13px
                font-weight: 500;
                margin: 4px 12px;
                border-radius: 6px;
            }
                           
            QWidget#sidebar QPushButton:hover {
                background-color: rgba(255, 255, 255, 0.1);
                color: white;
            }
                           
            QWidget#sidebar QPushButton:checked {
                background-color: rgba(255, 255, 255, 0.15);
                color: white;
            }
                           
            /* Main Content Styling */
            QFrame {
                background-color: white;
                border-radius: 8px;
                border: 1px solid #e3e6f0;
            }
                           
            QWindow {
                background-color: #F7F8FC;
            }
                           
            /* Search Bar Styling and Filters */
            QFrame#searchFrame {
                background-color: white;
                padding: 16px 24px;
                margin: 24px;
                border-radius: 8px;
            }
                           
            QLineEdit {
                padding: 10px 15px;
                border: 1px solid #e3e6f0;
                border-radius: 4px;
                background-color: #f8f9fc;
                font-size: 13px;
                min-width: 300px;
            }
                           
            QComboBox {
                padding: 10px 15px;
                border: 1px solid #e3e6f0;
                border-radius: 4px;
                background-color: #f8f9fc;
                font-size: 13px;
                min-width: 150px;
            }
                           
            /* Table Styling */
            QTableView {
                border: none;
                background-color: white;
                margin: 0 24px;
                border-radius: 8px;
                gridline-color: #F0F2F8;
            }
                           
            QTableView:item {
                padding: 12px;
                border-bottom: 1px solid #F0F2F8;
            }
                           
            QHeaderView:section {
                background-color: #f8f9fc;
                padding: 16px 12px;
                border: none;
                border-bottom: 1px solid #E2E8F0;
                font-weight: 600;
                color: #4e73df;
                font-size: 12px;
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

        # Header
        header_layout = QHBoxLayout()
        header = QLabel("Collection")
        header.setStyleSheet("""
            QLabel {
                font-size: 20px;
                font-weight: bold;
                color: #5a5c69;
            }
        """)

        # Search section
        search_layout = QHBoxLayout()
        search_layout.setSpacing(15)
        
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search for category, name, company, etc")
        
        self.search_field = QComboBox()
        self.search_field.addItems(['All Fields', 'Title', 'Country', 'Year', 'Denomination'])
        self.search_field.setStyleSheet("min-width: 120px;")
        
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
        
        btn_search = QPushButton("Search")
        btn_search.setStyleSheet("""
            QPushButton {
                background-color: #4e73df;
                min-width: 100px;
            }
        """)
        
        search_layout.addWidget(self.search_input, stretch=2)
        search_layout.addWidget(self.search_field)
        search_layout.addWidget(self.condition_filter)
        search_layout.addWidget(btn_search)
        
        layout.addLayout(header_layout)
        layout.addLayout(search_layout)
        
        return frame

    def create_sidebar(self):
        sidebar = QWidget()
        sidebar.setObjectName("sidebar")
        layout = QVBoxLayout(sidebar)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(12)

        # Add title label
        title_label = QLabel("Coin Odyssey")
        title_label.setAlignment(Qt.AlignLeft)

        # Create button with icons
        btn_home = QPushButton(" Dashboard")
        btn_home.setIcon(QIcon("assets/icons/home.png"))
        
        btn_collection = QPushButton(" Collection")
        btn_collection.setIcon(QIcon("assets/icons/collection.png"))

        btn_add = QPushButton(" Add Coin")
        btn_add.setIcon(QIcon("assets/icons/add.png"))

        btn_analysis = QPushButton(" Analysis")
        btn_analysis.setIcon(QIcon("assets/icons/analysis.png"))

        btn_export = QPushButton(" Export")
        btn_export.setIcon(QIcon("assets/icons/export.png"))

        # Connect signals
        btn_home.clicked.connect(self.show_dashboard)
        btn_collection.clicked.connect(self.show_coin_table)
        btn_add.clicked.connect(self.show_add_dialog)
        btn_analysis.clicked.connect(self.show_analysis)
        btn_export.clicked.connect(self.export_data)

        # Add buttons to layout
        layout.addWidget(title_label)
        layout.addSpacing(20)
        layout.addWidget(btn_home)
        layout.addWidget(btn_collection)
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