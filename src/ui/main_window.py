from PySide6.QtWidgets import (QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
                              QPushButton, QStackedWidget, QFileDialog, QLabel,
                              QLineEdit, QComboBox)
from PySide6.QtCore import Qt, Slot, QPropertyAnimation, QEasingCurve
from PySide6.QtGui import QIcon
import csv

from .widgets.coin_table_widget import CoinTableWidget
from .widgets.home_dashboard import HomeDashboard
from .widgets.analysis_widgets import AnalysisWidget
from .widgets.goals_widget import GoalsWidget
from .dialogs.add_coin_dialog import AddCoinPanel
from .dialogs.import_panel import ImportPanel
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
        
        # Create central widget and main layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # Create top bar with search and filters
        top_bar = QWidget()
        top_bar.setStyleSheet(f"background-color: {self.theme_manager.get_color('surface')};")
        top_bar_layout = QHBoxLayout(top_bar)
        top_bar_layout.setContentsMargins(20, 10, 20, 10)

        # Add search box
        self.search_box = QLineEdit()
        self.search_box.setPlaceholderText("Search coins...")
        self.search_box.setStyleSheet(f"""
            QLineEdit {{
                background-color: {self.theme_manager.get_color('background')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                padding: 8px;
                border-radius: 4px;
                min-width: 200px;
            }}
            QLineEdit:focus {{
                border: 1px solid {self.theme_manager.get_color('accent')};
            }}
        """)
        self.search_box.textChanged.connect(self.filter_coins)
        top_bar_layout.addWidget(self.search_box)

        # Create main content area
        content_area = QWidget()
        content_layout = QHBoxLayout(content_area)
        content_layout.setContentsMargins(0, 0, 0, 0)
        content_layout.setSpacing(0)

        # Create sidebar container with stacked widget for sliding panels
        self.sidebar_container = QWidget()
        self.sidebar_container.setFixedWidth(250)
        self.sidebar_container_layout = QStackedWidget()
        container_layout = QHBoxLayout(self.sidebar_container)
        container_layout.setContentsMargins(0, 0, 0, 0)
        container_layout.addWidget(self.sidebar_container_layout)

        # Create and add sidebar
        self.sidebar = self.create_sidebar()
        self.sidebar_container_layout.addWidget(self.sidebar)

        # Create main content stack
        self.content_stack = QStackedWidget()
        
        # Create and add main content widgets
        self.home_dashboard = HomeDashboard(self.db_manager, self.theme_manager)
        self.coin_table = CoinTableWidget(self.db_manager, self.theme_manager)
        self.analysis_widget = AnalysisWidget(self.db_manager, self.theme_manager)
        self.goals_widget = GoalsWidget(self.db_manager, self.theme_manager)

        self.content_stack.addWidget(self.home_dashboard)
        self.content_stack.addWidget(self.coin_table)
        self.content_stack.addWidget(self.analysis_widget)
        self.content_stack.addWidget(self.goals_widget)

        # Add widgets to layouts
        content_layout.addWidget(self.sidebar_container)
        content_layout.addWidget(self.content_stack)

        layout.addWidget(top_bar)
        layout.addWidget(content_area)

        # Connect theme change signal
        self.theme_manager.theme_changed.connect(self.update_theme)

    def create_sidebar(self):
        sidebar = QWidget()
        sidebar.setStyleSheet(f"""
            background-color: {self.theme_manager.get_color('surface')};
            border-right: 1px solid {self.theme_manager.get_color('border')};
        """)
        
        layout = QVBoxLayout(sidebar)
        layout.setContentsMargins(10, 20, 10, 20)
        layout.setSpacing(10)

        # Create navigation buttons
        button_style = f"""
            QPushButton {{
                background-color: {self.theme_manager.get_color('surface')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                padding: 12px;
                border-radius: 4px;
                text-align: left;
            }}
            QPushButton:hover {{
                background-color: {self.theme_manager.get_color('border')};
            }}
        """

        dashboard_btn = QPushButton("Dashboard")
        dashboard_btn.setIcon(QIcon("./src/assets/icons/dashboard.png"))
        dashboard_btn.clicked.connect(lambda: self.content_stack.setCurrentWidget(self.home_dashboard))
        dashboard_btn.setStyleSheet(button_style)

        collection_btn = QPushButton("Collection")
        collection_btn.setIcon(QIcon("./src/assets/icons/collection.png"))
        collection_btn.clicked.connect(lambda: self.content_stack.setCurrentWidget(self.coin_table))
        collection_btn.setStyleSheet(button_style)

        add_coin_btn = QPushButton("Add Coin")
        add_coin_btn.setIcon(QIcon("./src/assets/icons/add.png"))
        add_coin_btn.clicked.connect(self.show_add_panel)
        add_coin_btn.setStyleSheet(button_style)

        analysis_btn = QPushButton("Analysis")
        analysis_btn.setIcon(QIcon("./src/assets/icons/analysis.png"))
        analysis_btn.clicked.connect(lambda: self.content_stack.setCurrentWidget(self.analysis_widget))
        analysis_btn.setStyleSheet(button_style)

        goals_btn = QPushButton("Goals")
        goals_btn.setIcon(QIcon("./src/assets/icons/goals.png"))
        goals_btn.clicked.connect(lambda: self.content_stack.setCurrentWidget(self.goals_widget))
        goals_btn.setStyleSheet(button_style)

        import_btn = QPushButton("Import")
        import_btn.setIcon(QIcon("./src/assets/icons/import.png"))
        import_btn.clicked.connect(self.show_import_panel)
        import_btn.setStyleSheet(button_style)

        export_btn = QPushButton("Export")
        export_btn.setIcon(QIcon("./src/assets/icons/export.png"))
        export_btn.clicked.connect(self.export_data)
        export_btn.setStyleSheet(button_style)

        # Add buttons to layout
        layout.addWidget(dashboard_btn)
        layout.addWidget(collection_btn)
        layout.addWidget(add_coin_btn)
        layout.addWidget(analysis_btn)
        layout.addWidget(goals_btn)
        layout.addWidget(import_btn)
        layout.addWidget(export_btn)
        layout.addStretch()

        # Add theme toggle at bottom
        theme_toggle = QPushButton("Toggle Theme")
        theme_toggle.setIcon(QIcon("./src/assets/icons/theme.png"))
        theme_toggle.clicked.connect(self.toggle_theme)
        theme_toggle.setStyleSheet(button_style)
        layout.addWidget(theme_toggle)

        return sidebar

    def show_add_panel(self):
        if not hasattr(self, 'add_coin_panel'):
            self.add_coin_panel = AddCoinPanel(self.db_manager, self.theme_manager)
            self.add_coin_panel.coinAdded.connect(self.on_coin_added)
            self.add_coin_panel.closeRequested.connect(self.hide_add_coin_panel)
            self.sidebar_container_layout.addWidget(self.add_coin_panel)

        # Animate the width change
        self.width_animation = QPropertyAnimation(self.sidebar_container, b"minimumWidth")
        self.width_animation.setDuration(300)
        self.width_animation.setStartValue(250)
        self.width_animation.setEndValue(400)
        self.width_animation.setEasingCurve(QEasingCurve.OutCubic)
        self.width_animation.start()

        self.sidebar_container_layout.setCurrentWidget(self.add_coin_panel)

    def hide_add_coin_panel(self):
        # Animate the width change
        self.width_animation = QPropertyAnimation(self.sidebar_container, b"minimumWidth")
        self.width_animation.setDuration(300)
        self.width_animation.setStartValue(400)
        self.width_animation.setEndValue(250)
        self.width_animation.setEasingCurve(QEasingCurve.OutCubic)
        self.width_animation.finished.connect(lambda: self.sidebar_container_layout.setCurrentWidget(self.sidebar))
        self.width_animation.start()

    def show_import_panel(self):
        if not hasattr(self, 'import_panel'):
            self.import_panel = ImportPanel(self.db_manager, self.theme_manager)
            self.import_panel.importComplete.connect(self.on_import_complete)
            self.import_panel.closeRequested.connect(self.hide_import_panel)
            self.sidebar_container_layout.addWidget(self.import_panel)

        # Animate the width change
        self.width_animation = QPropertyAnimation(self.sidebar_container, b"minimumWidth")
        self.width_animation.setDuration(300)
        self.width_animation.setStartValue(250)
        self.width_animation.setEndValue(400)
        self.width_animation.setEasingCurve(QEasingCurve.OutCubic)
        self.width_animation.start()

        self.sidebar_container_layout.setCurrentWidget(self.import_panel)

    def hide_import_panel(self):
        # Animate the width change
        self.width_animation = QPropertyAnimation(self.sidebar_container, b"minimumWidth")
        self.width_animation.setDuration(300)
        self.width_animation.setStartValue(400)
        self.width_animation.setEndValue(250)
        self.width_animation.setEasingCurve(QEasingCurve.OutCubic)
        self.width_animation.finished.connect(lambda: self.sidebar_container_layout.setCurrentWidget(self.sidebar))
        self.width_animation.start()

    def on_coin_added(self):
        self.coin_table.refresh_data()
        self.home_dashboard.refresh_data()
        self.analysis_widget.update_charts()
        self.hide_add_coin_panel()

    def on_import_complete(self):
        self.coin_table.refresh_data()
        self.home_dashboard.refresh_data()
        self.analysis_widget.update_charts()
        self.hide_import_panel()

    def export_data(self):
        file_name, _ = QFileDialog.getSaveFileName(
            self,
            "Export Collection",
            "",
            "CSV Files (*.csv);;All Files (*)"
        )
        
        if file_name:
            if not file_name.endswith('.csv'):
                file_name += '.csv'
            
            coins = self.db_manager.get_all_coins()
            
            with open(file_name, 'w', newline='') as file:
                writer = csv.writer(file)
                writer.writerow(['Title', 'Year', 'Country', 'Value', 'Unit',
                               'Mint', 'Mint Mark', 'Type', 'Series', 'Status',
                               'Format', 'Region', 'Storage', 'Quantity'])
                
                for coin in coins:
                    writer.writerow([
                        coin.title, coin.year, coin.country,
                        coin.value, coin.unit, coin.mint,
                        coin.mint_mark, coin.type, coin.series,
                        coin.status, coin.format, coin.region,
                        coin.storage, coin.quantity
                    ])

    def filter_coins(self, search_text):
        """Filter coins based on search text"""
        if hasattr(self, 'coin_table'):
            coins = self.db_manager.get_all_coins()
            self.coin_table.model.filtered_coins = [
                coin for coin in coins
                if search_text.lower() in coin.title.lower() or
                   (coin.country and search_text.lower() in coin.country.lower()) or
                   (coin.year and search_text.lower() in str(coin.year)) or
                   (coin.type and search_text.lower() in coin.type.lower())
            ]
            self.coin_table.model.layoutChanged.emit()

    def toggle_theme(self):
        self.theme_manager.toggle_theme()

    def update_theme(self):
        # Update sidebar styling
        self.sidebar.setStyleSheet(f"""
            background-color: {self.theme_manager.get_color('surface')};
            border-right: 1px solid {self.theme_manager.get_color('border')};
        """)
        
        # Update all widgets
        self.home_dashboard.update_theme()
        self.coin_table.update_theme()
        self.analysis_widget.update_theme()
        self.goals_widget.update_theme()
        
        if hasattr(self, 'add_coin_panel'):
            self.add_coin_panel.update_theme()
        if hasattr(self, 'import_panel'):
            self.import_panel.update_theme()
        
        # Update buttons
        for button in self.sidebar.findChildren(QPushButton):
            button.setStyleSheet(f"""
                QPushButton {{
                    background-color: {self.theme_manager.get_color('surface')};
                    color: {self.theme_manager.get_color('text')};
                    border: 1px solid {self.theme_manager.get_color('border')};
                    padding: 12px;
                    border-radius: 4px;
                    text-align: left;
                }}
                QPushButton:hover {{
                    background-color: {self.theme_manager.get_color('border')};
                }}
            """)
        
        # Update search box
        self.search_box.setStyleSheet(f"""
            QLineEdit {{
                background-color: {self.theme_manager.get_color('background')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                padding: 8px;
                border-radius: 4px;
                min-width: 200px;
            }}
            QLineEdit:focus {{
                border: 1px solid {self.theme_manager.get_color('accent')};
            }}
        """)