from PySide6.QtWidgets import (QMainWindow, QWidget, QVBoxLayout,
                             QHBoxLayout, QPushButton, QTableView, QLabel,
                             QLineEdit, QComboBox, QFrame, QStackedWidget,
                             QDockWidget, QSizePolicy, QSpacerItem)
from PySide6.QtCore import Qt, Slot, QPropertyAnimation, QEasingCurve
from PySide6.QtGui import QFont, QIcon, QPixmap
from .dialogs.add_coin_dialog import AddCoinPanel
from .widgets.coin_table_widget import CoinTableWidget
from .widgets.home_dashboard import HomeDashboard
from .widgets.analysis_widgets import AnalysisWidget
from .theme.theme_manager import ThemeManager

class MainWindow(QMainWindow):
    def __init__(self, db_manager):
        super().__init__()
        self.db_manager = db_manager
        self.theme_manager = ThemeManager()
        self.setup_ui()

    def setup_ui(self):
        self.setWindowTitle("Coin Odyssey")
        self.setMinimumSize(1200, 800)

        # Connect theme changes to update all widgets
        self.theme_manager.theme_changed.connect(self.update_theme)

        # Create main layout container
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # Create and add top bar
        top_bar = self.create_top_bar()
        main_layout.addWidget(top_bar)

        # Create content area
        content_layout = QHBoxLayout()
        
        # Create sidebar container
        self.sidebar_container = QWidget()
        self.sidebar_container_layout = QStackedWidget()
        self.sidebar_container.setFixedWidth(250)  # Set fixed width

        # Add main sidebar
        self.sidebar = self.create_sidebar()
        self.sidebar_container_layout.addWidget(self.sidebar)

        # Create add coin panel
        self.add_coin_panel = AddCoinPanel(self.db_manager, self.theme_manager)
        self.add_coin_panel.coinAdded.connect(self.on_coin_added)
        self.add_coin_panel.closeRequested.connect(self.hide_add_coin_panel)
        self.sidebar_container_layout.addWidget(self.add_coin_panel)

        # Set layout for sidebar container
        self.sidebar_container.setLayout(QVBoxLayout())
        self.sidebar_container.layout().addWidget(self.sidebar_container_layout)
        self.sidebar_container.layout().setContentsMargins(0, 0, 0, 0)

        content_layout.addWidget(self.sidebar_container)

        # Create main stacked widget for different views
        self.main_stack = QStackedWidget()
        
        # Create and add dashboard
        self.dashboard = HomeDashboard(self.db_manager, self.theme_manager)
        self.main_stack.addWidget(self.dashboard)

        # Create and add coin table
        self.coin_table = CoinTableWidget(self.db_manager, self.theme_manager)
        self.main_stack.addWidget(self.coin_table)

        # Create and add analysis widget
        self.analysis_widget = AnalysisWidget(self.db_manager, self.theme_manager)
        self.main_stack.addWidget(self.analysis_widget)

        content_layout.addWidget(self.main_stack)
        main_layout.addLayout(content_layout)

    def create_top_bar(self):
        frame = QFrame()
        frame.setObjectName("topBar")
        layout = QHBoxLayout(frame)
        layout.setContentsMargins(16, 8, 16, 8)

        # Add breadcrumb
        self.breadcrumb = QLabel("Dashboard")
        self.breadcrumb.setFont(QFont("", 12))
        layout.addWidget(self.breadcrumb)

        # Add search section
        search_frame = self.create_search_frame()
        layout.addWidget(search_frame)

        return frame

    def create_search_frame(self):
        frame = QFrame()
        search_layout = QHBoxLayout(frame)
        search_layout.setContentsMargins(0, 0, 0, 0)

        # Search input
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search coins...")
        self.search_input.textChanged.connect(self.apply_filters)

        # Search field dropdown
        self.search_field = QComboBox()
        self.search_field.addItems(['Title', 'Year', 'Country', 'Denomination'])
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

        search_layout.addWidget(self.search_input)
        search_layout.addWidget(self.search_field)
        search_layout.addWidget(self.condition_filter)
        search_layout.addWidget(self.value_filter)
        
        return frame

    def create_sidebar(self):
        sidebar = QWidget()
        sidebar.setObjectName("sidebar")
        layout = QVBoxLayout(sidebar)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(12)

        # Add title label
        title_label = QLabel("Coin Odyssey")
        title_label.setFont(QFont("", 16, QFont.Bold))
        title_label.setAlignment(Qt.AlignLeft)

        # Create navigation buttons
        btn_home = QPushButton(" Dashboard")
        btn_home.setIcon(QIcon("src/assets/icons/home.png"))
        btn_home.setCheckable(True)
        
        btn_collection = QPushButton(" Collection")
        btn_collection.setIcon(QIcon("src/assets/icons/coins.png"))
        btn_collection.setCheckable(True)

        btn_add = QPushButton(" Add Coin")
        btn_add.setIcon(QIcon("src/assets/icons/add.png"))

        btn_analysis = QPushButton(" Analysis")
        btn_analysis.setIcon(QIcon("src/assets/icons/chart-histogram.png"))
        btn_analysis.setCheckable(True)

        btn_export = QPushButton(" Export")
        btn_export.setIcon(QIcon("src/assets/icons/disk.png"))

        # Create theme toggle button
        btn_theme = QPushButton(" Toggle Theme")
        btn_theme.setIcon(QIcon("src/assets/icons/theme.png"))
        btn_theme.clicked.connect(self.toggle_theme)

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
        btn_add.clicked.connect(self.show_add_panel)
        btn_export.clicked.connect(self.export_data)

        # Add buttons to layout
        layout.addWidget(title_label)
        layout.addSpacing(20)
        layout.addWidget(btn_home)
        layout.addWidget(btn_collection)
        layout.addWidget(btn_add)
        layout.addWidget(btn_analysis)
        layout.addWidget(btn_export)

        # Add spacer to push theme button to bottom
        layout.addStretch()
        layout.addWidget(btn_theme)

        return sidebar

    def update_theme(self):
        # Update sidebar
        sidebar_bg = self.theme_manager.get_color('background')
        sidebar_text = self.theme_manager.get_color('text')
        self.sidebar.setStyleSheet(f"""
            QWidget {{
                background-color: {sidebar_bg};
                color: {sidebar_text};
            }}
            QPushButton {{
                background-color: {self.theme_manager.get_color('surface')};
                color: {sidebar_text};
                border: none;
                padding: 8px;
                border-radius: 4px;
                text-align: left;
            }}
            QPushButton:checked {{
                background-color: {self.theme_manager.get_color('accent')};
                color: white;
            }}
            QPushButton:hover {{
                background-color: {self.theme_manager.get_color('border')};
            }}
        """)

        # Update top bar
        top_bar_bg = self.theme_manager.get_color('surface')
        top_bar_text = self.theme_manager.get_color('text')
        self.breadcrumb.setStyleSheet(f"color: {top_bar_text};")
        self.breadcrumb.parent().setStyleSheet(f"background-color: {top_bar_bg};")

    def toggle_theme(self):
        self.theme_manager.toggle_theme()

    @Slot()
    def show_dashboard(self):
        self.main_stack.setCurrentWidget(self.dashboard)
        self.breadcrumb.setText("Dashboard")

    @Slot()
    def show_coin_table(self):
        self.main_stack.setCurrentWidget(self.coin_table)
        self.breadcrumb.setText("Dashboard > Collection")

    @Slot()
    def show_analysis(self):
        self.main_stack.setCurrentWidget(self.analysis_widget)
        self.breadcrumb.setText("Dashboard > Analysis")

    @Slot()
    def show_add_panel(self):
        # Animate the width change
        self.width_animation = QPropertyAnimation(self.sidebar_container, b"minimumWidth")
        self.width_animation.setDuration(300)
        self.width_animation.setStartValue(250)
        self.width_animation.setEndValue(400)
        self.width_animation.setEasingCurve(QEasingCurve.OutCubic)
        
        # Create sliding animation for the stacked widget
        self.slide_animation = QPropertyAnimation(self.sidebar_container_layout, b"currentIndex")
        self.slide_animation.setDuration(300)
        self.slide_animation.setStartValue(0)
        self.slide_animation.setEndValue(1)
        self.slide_animation.setEasingCurve(QEasingCurve.OutCubic)
        
        # Start both animations
        self.width_animation.start()
        self.slide_animation.start()

    def hide_add_coin_panel(self):
        # Animate the width change back
        self.width_animation = QPropertyAnimation(self.sidebar_container, b"minimumWidth")
        self.width_animation.setDuration(300)
        self.width_animation.setStartValue(400)
        self.width_animation.setEndValue(250)
        self.width_animation.setEasingCurve(QEasingCurve.OutCubic)
        
        # Create reverse sliding animation
        self.slide_animation = QPropertyAnimation(self.sidebar_container_layout, b"currentIndex")
        self.slide_animation.setDuration(300)
        self.slide_animation.setStartValue(1)
        self.slide_animation.setEndValue(0)
        self.slide_animation.setEasingCurve(QEasingCurve.OutCubic)
        
        # Start both animations
        self.width_animation.start()
        self.slide_animation.start()

    def on_coin_added(self):
        self.coin_table.refresh_data()
        self.dashboard.refresh_data()  # Make sure to implement this in HomeDashboard
        self.hide_add_coin_panel()

    @Slot()
    def export_data(self):
        from PySide6.QtWidgets import QFileDialog
        import csv
        
        # Open file dialog to choose save location
        file_name, _ = QFileDialog.getSaveFileName(
            self,
            "Export Collection Data",
            "",
            "CSV Files (*.csv);;All Files (*)"
        )
        
        if file_name:
            # If no extension was added, append .csv
            if not file_name.endswith('.csv'):
                file_name += '.csv'
                
            # Get all coins
            coins = self.db_manager.get_all_coins()
            
            # Write to CSV
            with open(file_name, 'w', newline='') as file:
                writer = csv.writer(file)
                # Write headers
                writer.writerow(['Title', 'Year', 'Country', 'Denomination', 
                               'Mint Mark', 'Condition', 'Purchase Price', 
                               'Current Value', 'Purchase Date'])
                
                # Write coin data
                for coin in coins:
                    writer.writerow([
                        coin.title,
                        coin.year,
                        coin.country,
                        coin.denomination,
                        coin.mint_mark,
                        coin.condition,
                        f"${coin.purchase_price:.2f}",
                        f"${coin.current_value:.2f}",
                        coin.purchase_date.strftime('%Y-%m-%d') if coin.purchase_date else ''
                    ])

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