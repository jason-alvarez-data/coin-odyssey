from PySide6.QtWidgets import (QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
                              QPushButton, QStackedWidget, QLabel, QLineEdit)
from PySide6.QtCore import Qt
from PySide6.QtGui import QIcon, QPixmap
from .widgets.coin_table_widget import CoinTableWidget
from .widgets.home_dashboard import HomeDashboard
from .widgets.analysis_widgets import AnalysisWidget
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

        # Create sidebar container
        self.sidebar_container = QWidget()
        self.sidebar_container.setFixedWidth(250)
        self.sidebar_container_layout = QVBoxLayout(self.sidebar_container)
        self.sidebar_container_layout.setContentsMargins(0, 0, 0, 0)
        self.sidebar_container_layout.setSpacing(0)

        # Add logo placeholder at the top of the sidebar
        logo_placeholder = QLabel()
        logo_pixmap = QPixmap("src/assets/CoinOdyssey_Logo_Final.png")
        logo_placeholder.setPixmap(logo_pixmap.scaled(100, 100, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        logo_placeholder.setAlignment(Qt.AlignCenter)
        logo_placeholder.setStyleSheet(f"""
            QLabel {{
                background-color: {self.theme_manager.get_color('surface')};
                border-bottom: 1px solid {self.theme_manager.get_color('border')};
            }}
        """)
        self.sidebar_container_layout.addWidget(logo_placeholder)

        # Add the sidebar container to the main layout
        content_layout.addWidget(self.sidebar_container)
        layout.addWidget(top_bar)
        layout.addWidget(content_area)

        # Create and add sidebar
        self.sidebar = self.create_sidebar()
        self.sidebar_container_layout.addWidget(self.sidebar)

        # Create main content stack
        self.content_stack = QStackedWidget()
        
        # Create and add main content widgets
        self.home_dashboard = HomeDashboard(self.db_manager, self.theme_manager)
        self.coin_table = CoinTableWidget(self.db_manager, self.theme_manager)
        self.analysis_widget = AnalysisWidget(self.db_manager, self.theme_manager)

        self.content_stack.addWidget(self.home_dashboard)
        self.content_stack.addWidget(self.coin_table)
        self.content_stack.addWidget(self.analysis_widget)

        # Add widgets to layouts
        content_layout.addWidget(self.content_stack)

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

        import_btn = QPushButton("Import")
        import_btn.setIcon(QIcon("./src/assets/icons/import.png"))
        import_btn.clicked.connect(self.show_import_panel)
        import_btn.setStyleSheet(button_style)

        analysis_btn = QPushButton("Analysis")
        analysis_btn.setIcon(QIcon("./src/assets/icons/analysis.png"))
        analysis_btn.clicked.connect(lambda: self.content_stack.setCurrentWidget(self.analysis_widget))
        analysis_btn.setStyleSheet(button_style)

        # Add buttons to sidebar
        layout.addWidget(dashboard_btn)
        layout.addWidget(collection_btn)
        layout.addWidget(add_coin_btn)
        layout.addWidget(import_btn)
        layout.addWidget(analysis_btn)
        
        # Add stretch to push buttons to the top
        layout.addStretch()

        return sidebar

    def show_add_panel(self):
        # Check if panel already exists and is visible
        if hasattr(self, 'add_coin_panel') and self.add_coin_panel is not None:
            if self.add_coin_panel.isVisible():
                return
        
        # Create and configure the add coin panel
        self.add_coin_panel = AddCoinPanel(self.db_manager, self.theme_manager, self)
        self.add_coin_panel.coinAdded.connect(self.refresh_data)
        self.add_coin_panel.closeRequested.connect(self.restore_sidebar)
        
        # Store sidebar widgets to restore later
        self.sidebar_widgets = []
        sidebar_layout = self.sidebar.layout()
        for i in range(sidebar_layout.count()):
            widget = sidebar_layout.itemAt(i).widget()
            if widget:
                self.sidebar_widgets.append(widget)
                widget.hide()
        
        # Add panel to sidebar
        sidebar_layout.addWidget(self.add_coin_panel)
        self.add_coin_panel.show()

    def show_import_panel(self):
        """Show the Import panel"""
        # Store sidebar widgets to restore later
        self.sidebar_widgets = []
        sidebar_layout = self.sidebar.layout()
        for i in range(sidebar_layout.count()):
            widget = sidebar_layout.itemAt(i).widget()
            if widget:
                self.sidebar_widgets.append(widget)
                widget.hide()
        
        # Create and show import panel
        self.import_panel = ImportPanel(self.db_manager, self.theme_manager, self)
        self.import_panel.importComplete.connect(self.refresh_data)
        self.import_panel.closeRequested.connect(self.restore_sidebar)
        
        # Add panel to sidebar
        sidebar_layout.addWidget(self.import_panel)
        self.import_panel.show()

    def restore_sidebar(self):
        """Restore the original sidebar content"""
        print("Restoring sidebar")  # Debug print
        
        # Remove import panel if it exists
        if hasattr(self, 'import_panel') and self.import_panel is not None:
            self.sidebar.layout().removeWidget(self.import_panel)
            self.import_panel = None  # Remove the reference
        
        # Restore original sidebar widgets
        if hasattr(self, 'sidebar_widgets'):
            for widget in self.sidebar_widgets:
                widget.show()
            self.sidebar_widgets = []
        
        # Make sure the sidebar is visible
        self.sidebar.setVisible(True)
            
            # Make sure the sidebar is visible
        self.sidebar.setVisible(True)

    def refresh_data(self):
        """Refresh data in all widgets that display coin data"""
        self.home_dashboard.update_stats()
        self.coin_table.refresh_data()
        self.analysis_widget.update_charts()

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