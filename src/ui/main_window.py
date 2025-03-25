from PySide6.QtWidgets import (QMainWindow, QWidget, QVBoxLayout,
                             QHBoxLayout, QPushButton, QTableView, QLabel,
                             QLineEdit, QComboBox, QFrame, QStackedWidget,
                             QDockWidget, QSizePolicy, QSpacerItem)
from PySide6.QtCore import Qt, Slot
from PySide6.QtGui import QFont, QIcon, QPixmap
from .dialogs.add_coin_dialog import AddCoinDialog
from .widgets.coin_table_widget import CoinTableWidget
from .widgets.home_dashboard import HomeDashboard
from .widgets.analysis_widgets import AnalysisWidget

class MainWindow(QMainWindow):
    def __init__(self, db_manager):
        super().__init__()
        self.db_manager = db_manager
        self.setup_ui()

    def setup_ui(self):
        self.setWindowTitle("Coin Odyssey")
        self.setMinimumSize(1200, 800)
        
        # Apply modern styling with glass effects
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
                border: none;
            }
            
            /* Top Bar Styling */
            QWidget#topBar {
                background-color: rgba(255, 255, 255, 0.95);
                border-bottom: 1px solid rgba(226, 232, 240, 0.3);
                padding: 16px 24px;
                margin: 0;
            }
            
            QLabel#breadcrumb {
                color: #4A5568;
                font-size: 14px;
                font-weight: 500;
            }
            
            QLabel#profileName {
                color: #2D3748;
                font-size: 14px;
                font-weight: 500;
                margin-left: 8px;
            }
            
            QLabel#profileImage {
                border-radius: 16px;
                border: 2px solid #E2E8F0;
            }
            
            /* Sidebar Elements */
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
                font-size: 13px;
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
            
            /* Glass Effect Content Cards */
            QFrame#contentCard {
                background-color: rgba(255, 255, 255, 0.95);
                border-radius: 12px;
                border: 1px solid rgba(226, 232, 240, 0.4);
                padding: 24px;
                margin: 16px;
            }
            
            QFrame#searchFrame {
                background-color: rgba(255, 255, 255, 0.95);
                border-radius: 12px;
                border: 1px solid rgba(226, 232, 240, 0.4);
                padding: 24px;
                margin: 24px;
            }
            
            QLineEdit {
                padding: 10px 15px;
                border: 1px solid rgba(226, 232, 240, 0.6);
                border-radius: 6px;
                background-color: rgba(248, 249, 252, 0.95);
                font-size: 13px;
                min-width: 300px;
            }
            
            QComboBox {
                padding: 10px 15px;
                border: 1px solid rgba(226, 232, 240, 0.6);
                border-radius: 6px;
                background-color: rgba(248, 249, 252, 0.95);
                font-size: 13px;
                min-width: 150px;
            }
            
            QTableView {
                background-color: rgba(255, 255, 255, 0.95);
                border-radius: 12px;
                border: 1px solid rgba(226, 232, 240, 0.4);
                margin: 0 24px;
                gridline-color: rgba(240, 242, 248, 0.6);
            }
        """)

        # Create main layout container
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # Create and add top bar
        top_bar = self.create_top_bar()
        main_layout.addWidget(top_bar)

        # Create content layout
        content_layout = QHBoxLayout()
        content_layout.setContentsMargins(0, 0, 0, 0)
        content_layout.setSpacing(0)

        # Create and add sidebar
        sidebar = self.create_sidebar()
        
        # Create dock widget for sidebar
        dock = QDockWidget()
        dock.setWidget(sidebar)
        dock.setFeatures(QDockWidget.NoDockWidgetFeatures)
        dock.setTitleBarWidget(QWidget())  # Removes the title bar
        self.addDockWidget(Qt.LeftDockWidgetArea, dock)

        # Create main content area
        main_content = QWidget()
        main_content_layout = QVBoxLayout(main_content)
        main_content_layout.setContentsMargins(24, 24, 24, 24)

        # Create stacked widget
        self.main_stack = QStackedWidget()
        
        # Add dashboard and coin table
        self.dashboard = HomeDashboard(self.db_manager)
        self.coin_table_container = QWidget()
        self.analysis_widget = AnalysisWidget(self.db_manager) # Create analysis widget
        
        # Setup coin table container
        coin_table_layout = QVBoxLayout(self.coin_table_container)
        search_frame = self.create_search_frame()
        self.coin_table = CoinTableWidget(self.db_manager)
        
        coin_table_layout.addWidget(search_frame)
        coin_table_layout.addWidget(self.coin_table)

        # Add all widgets to stack
        self.main_stack.addWidget(self.dashboard)
        self.main_stack.addWidget(self.coin_table_container)
        self.main_stack.addWidget(self.analysis_widget) # Add analysis widget to stack

        main_content_layout.addWidget(self.main_stack)
        content_layout.addWidget(main_content)
        main_layout.addLayout(content_layout)

    def create_top_bar(self):
        top_bar = QWidget()
        top_bar.setObjectName("topBar")
        top_layout = QHBoxLayout(top_bar)
        top_layout.setContentsMargins(24, 0, 24, 0)

        # Add breadcrumb
        breadcrumb = QLabel("Dashboard > Collection")
        breadcrumb.setObjectName("breadcrumb")

        # Add spacer
        spacer = QSpacerItem(40, 20, QSizePolicy.Expanding, QSizePolicy.Minimum)

        # Create profile section
        profile_widget = QWidget()
        profile_layout = QHBoxLayout(profile_widget)
        profile_layout.setContentsMargins(0, 0, 0, 0)

        # Add notification button
        notif_btn = QPushButton()
        notif_btn.setIcon(QIcon("assets/icons/notification.png"))
        notif_btn.setObjectName("headerButton")
        
        # Add profile image
        profile_img = QLabel()
        profile_pixmap = QPixmap("assets/icons/profile.png")
        profile_img.setPixmap(profile_pixmap.scaled(32, 32, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        profile_img.setObjectName("profileImage")

        # Add profile name
        profile_name = QLabel("John Doe")
        profile_name.setObjectName("profileName")

        profile_layout.addWidget(notif_btn)
        profile_layout.addWidget(profile_img)
        profile_layout.addWidget(profile_name)

        top_layout.addWidget(breadcrumb)
        top_layout.addItem(spacer)
        top_layout.addWidget(profile_widget)

        return top_bar

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
        btn_home.setCheckable(True)
        
        btn_collection = QPushButton(" Collection")
        btn_collection.setIcon(QIcon("assets/icons/collection.png"))
        btn_collection.setCheckable(True)

        btn_add = QPushButton(" Add Coin")
        btn_add.setIcon(QIcon("assets/icons/add.png"))

        btn_analysis = QPushButton(" Analysis")
        btn_analysis.setIcon(QIcon("assets/icons/analysis.png"))
        btn_analysis.setCheckable(True)

        btn_export = QPushButton(" Export")
        btn_export.setIcon(QIcon("assets/icons/export.png"))

        # Store buttons for reference
        self.nav_buttons = [btn_home, btn_collection, btn_analysis]

        # Update button states when clicked
        def update_button_states(active_button):
            for btn in self.nav_buttons:
                btn.setChecked(btn == active_button)

        # Connect signals with updated handlers
        btn_home.clicked.connect(lambda: (self.show_dashboard(), update_button_states(btn_home)))
        btn_collection.clicked.connect(lambda: (self.show_coin_table(), update_button_states(btn_collection)))
        btn_analysis.clicked.connect(lambda: (self.show_analysis(), update_button_states(btn_analysis)))

        # Set initial state
        btn_home.setChecked(True)

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
        self.main_stack.setCurrentWidget(self.analysis_widget)

        # Update breadcrumbs
        if hasattr(self, 'breadcrumb_label'):
            self.breadcrumb.setText("Dashboard > Analysis")

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
        if hasattr(self, 'breadcrumb'):
            self.breadcrumb.setText("Dashboard > Home")

    @Slot()
    def show_coin_table(self):
        self.main_stack.setCurrentWidget(self.coin_table_container)
        if hasattr(self, 'breadcrumb'):
            self.breadcrumb.setText("Dashboard > Collection")