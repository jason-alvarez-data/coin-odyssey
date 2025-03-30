from PySide6.QtWidgets import (QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
                              QPushButton, QStackedWidget, QFileDialog, QLabel,
                              QLineEdit, QComboBox)
from PySide6.QtCore import Qt, Slot, QPropertyAnimation, QEasingCurve
from PySide6.QtGui import QIcon
import csv

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
        search_box = QLineEdit()
        search_box.setPlaceholderText("Search coins...")
        search_box.setStyleSheet(f"""
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
        search_box.textChanged.connect(self.apply_filters)

        # Add filter dropdowns
        country_filter = QComboBox()
        country_filter.addItem("All Countries")
        country_filter.addItems(sorted(set(coin.country for coin in self.db_manager.get_all_coins() if coin.country)))
        country_filter.currentTextChanged.connect(self.apply_filters)

        type_filter = QComboBox()
        type_filter.addItem("All Types")
        type_filter.addItems(sorted(set(coin.type for coin in self.db_manager.get_all_coins() if coin.type)))
        type_filter.currentTextChanged.connect(self.apply_filters)

        year_filter = QComboBox()
        year_filter.addItem("All Years")
        year_filter.addItems(sorted(set(str(coin.year) for coin in self.db_manager.get_all_coins() if coin.year)))
        year_filter.currentTextChanged.connect(self.apply_filters)

        # Style the dropdowns
        dropdown_style = f"""
            QComboBox {{
                background-color: {self.theme_manager.get_color('background')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                padding: 8px;
                border-radius: 4px;
                min-width: 150px;
            }}
            QComboBox:hover {{
                border: 1px solid {self.theme_manager.get_color('accent')};
            }}
        """
        country_filter.setStyleSheet(dropdown_style)
        type_filter.setStyleSheet(dropdown_style)
        year_filter.setStyleSheet(dropdown_style)

        # Store filter widgets as instance variables
        self.search_box = search_box
        self.country_filter = country_filter
        self.type_filter = type_filter
        self.year_filter = year_filter

        # Add widgets to top bar
        filter_label_style = f"color: {self.theme_manager.get_color('text')};"
        
        search_label = QLabel("Search:")
        search_label.setStyleSheet(filter_label_style)
        country_label = QLabel("Country:")
        country_label.setStyleSheet(filter_label_style)
        type_label = QLabel("Type:")
        type_label.setStyleSheet(filter_label_style)
        year_label = QLabel("Year:")
        year_label.setStyleSheet(filter_label_style)

        top_bar_layout.addWidget(search_label)
        top_bar_layout.addWidget(search_box)
        top_bar_layout.addWidget(country_label)
        top_bar_layout.addWidget(country_filter)
        top_bar_layout.addWidget(type_label)
        top_bar_layout.addWidget(type_filter)
        top_bar_layout.addWidget(year_label)
        top_bar_layout.addWidget(year_filter)
        top_bar_layout.addStretch()

        layout.addWidget(top_bar)

        # Create content layout
        content_layout = QHBoxLayout()
        content_layout.setSpacing(0)

        # Create sidebar container
        self.sidebar_container = QWidget()
        self.sidebar_container.setFixedWidth(250)
        self.sidebar_container_layout = QStackedWidget()
        
        # Create and add main sidebar
        self.sidebar = self.create_sidebar()
        self.sidebar_container_layout.addWidget(self.sidebar)
        
        # Set layout for sidebar container
        sidebar_container_vlayout = QVBoxLayout(self.sidebar_container)
        sidebar_container_vlayout.setContentsMargins(0, 0, 0, 0)
        sidebar_container_vlayout.addWidget(self.sidebar_container_layout)

        # Create main content stacked widget
        self.content_stack = QStackedWidget()
        
        # Create and add main content widgets
        self.home_dashboard = HomeDashboard(self.db_manager, self.theme_manager)
        self.coin_table = CoinTableWidget(self.db_manager, self.theme_manager)
        self.analysis_widget = AnalysisWidget(self.db_manager, self.theme_manager)
        
        self.content_stack.addWidget(self.home_dashboard)
        self.content_stack.addWidget(self.coin_table)
        self.content_stack.addWidget(self.analysis_widget)

        # Add widgets to content layout
        content_layout.addWidget(self.sidebar_container)
        content_layout.addWidget(self.content_stack)
        layout.addLayout(content_layout)

        # Connect theme changes to update all widgets
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

    def hide_add_coin_panel(self):
        # Animate the width change back
        self.width_animation = QPropertyAnimation(self.sidebar_container, b"minimumWidth")
        self.width_animation.setDuration(300)
        self.width_animation.setStartValue(400)
        self.width_animation.setEndValue(250)
        self.width_animation.setEasingCurve(QEasingCurve.OutCubic)
        self.width_animation.start()

        self.sidebar_container_layout.setCurrentWidget(self.sidebar)

    def hide_import_panel(self):
        # Animate the width change back
        self.width_animation = QPropertyAnimation(self.sidebar_container, b"minimumWidth")
        self.width_animation.setDuration(300)
        self.width_animation.setStartValue(400)
        self.width_animation.setEndValue(250)
        self.width_animation.setEasingCurve(QEasingCurve.OutCubic)
        self.width_animation.start()

        self.sidebar_container_layout.setCurrentWidget(self.sidebar)

    @Slot()
    def on_coin_added(self):
        # Refresh the coin table and dashboard data
        self.coin_table.refresh_data()
        self.home_dashboard.refresh_data()
        self.analysis_widget.update_charts()
        
        # Update filters
        self.update_filters()
    
    @Slot()
    def on_import_complete(self):
        # Refresh all data views
        self.coin_table.refresh_data()
        self.home_dashboard.refresh_data()
        self.analysis_widget.update_charts()
        
        # Update filters
        self.update_filters()

    def update_filters(self):
        # Store current selections
        current_country = self.country_filter.currentText()
        current_type = self.type_filter.currentText()
        current_year = self.year_filter.currentText()

        # Update country filter
        self.country_filter.clear()
        self.country_filter.addItem("All Countries")
        self.country_filter.addItems(sorted(set(coin.country for coin in self.db_manager.get_all_coins() if coin.country)))
        
        # Update type filter
        self.type_filter.clear()
        self.type_filter.addItem("All Types")
        self.type_filter.addItems(sorted(set(coin.type for coin in self.db_manager.get_all_coins() if coin.type)))
        
        # Update year filter
        self.year_filter.clear()
        self.year_filter.addItem("All Years")
        self.year_filter.addItems(sorted(set(str(coin.year) for coin in self.db_manager.get_all_coins() if coin.year)))

        # Restore selections if they still exist
        index = self.country_filter.findText(current_country)
        if index >= 0:
            self.country_filter.setCurrentIndex(index)
            
        index = self.type_filter.findText(current_type)
        if index >= 0:
            self.type_filter.setCurrentIndex(index)
            
        index = self.year_filter.findText(current_year)
        if index >= 0:
            self.year_filter.setCurrentIndex(index)

    def apply_filters(self):
        # Get filter values
        search_text = self.search_box.text().lower()
        country = self.country_filter.currentText()
        type_filter = self.type_filter.currentText()
        year = self.year_filter.currentText()

        # Apply filters to coin table
        self.coin_table.model().filtered_coins = [
            coin for coin in self.coin_table.model().coins
            if (search_text in coin.title.lower() or 
                search_text in str(coin.year).lower() or 
                (coin.country and search_text in coin.country.lower()))
            and (country == "All Countries" or coin.country == country)
            and (type_filter == "All Types" or coin.type == type_filter)
            and (year == "All Years" or str(coin.year) == year)
        ]
        
        # Refresh the table view
        self.coin_table.model().layoutChanged.emit()

    def export_data(self):
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
                writer.writerow(['Title', 'Year', 'Country', 'Value', 'Unit',
                               'Mint', 'Mint Mark', 'Type', 'Series', 'Status',
                               'Format', 'Region', 'Storage', 'Quantity'])

            # Write coin data
            for coin in coins:
                writer.writerow([
                    coin.title,
                    coin.year,
                    coin.country,
                    coin.value,
                    coin.unit,
                    coin.mint,
                    coin.mint_mark,
                    coin.type,
                    coin.series,
                    coin.status,
                    coin.format,
                    coin.region,
                    coin.storage,
                    coin.quantity
            ])

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
        
        # Update search and filters
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
        
        dropdown_style = f"""
            QComboBox {{
                background-color: {self.theme_manager.get_color('background')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                padding: 8px;
                border-radius: 4px;
                min-width: 150px;
            }}
            QComboBox:hover {{
                border: 1px solid {self.theme_manager.get_color('accent')};
            }}
        """
        self.country_filter.setStyleSheet(dropdown_style)
        self.type_filter.setStyleSheet(dropdown_style)
        self.year_filter.setStyleSheet(dropdown_style)