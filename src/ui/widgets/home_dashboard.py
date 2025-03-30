from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, 
                              QFrame, QLabel, QSizePolicy)
from PySide6.QtCore import Qt
from PySide6.QtGui import QPixmap
from .map_widget import CollectionMapWidget

class HomeDashboard(QWidget):
    def __init__(self, db_manager, theme_manager):
        super().__init__()
        self.db_manager = db_manager
        self.theme_manager = theme_manager
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(20)

        # Add title
        title = QLabel("Collection Dashboard")
        title.setStyleSheet(f"""
            color: {self.theme_manager.get_color('text')};
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
        """)
        layout.addWidget(title)

        # Add overview frame
        layout.addWidget(self.create_overview_frame())

        # Add map widget with title
        map_title = QLabel("Collection Geography")
        map_title.setStyleSheet(f"""
            color: {self.theme_manager.get_color('text')};
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
        """)
        layout.addWidget(map_title)

        map_frame = QFrame()
        map_frame.setObjectName("mapFrame")
        map_frame.setStyleSheet(f"""
            QFrame#mapFrame {{
                background-color: {self.theme_manager.get_color('surface')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 8px;
                padding: 10px;
            }}
        """)
        map_layout = QVBoxLayout(map_frame)
        self.map_widget = CollectionMapWidget(self.db_manager, self.theme_manager)
        map_layout.addWidget(self.map_widget)
        layout.addWidget(map_frame)

        # Add stretch to push everything up
        layout.addStretch()

    def create_overview_frame(self):
        frame = QFrame()
        frame.setObjectName("overviewFrame")
        frame.setStyleSheet(f"""
            QFrame#overviewFrame {{
                background-color: {self.theme_manager.get_color('surface')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 8px;
                padding: 15px;
            }}
        """)

        layout = QHBoxLayout(frame)
        layout.setSpacing(20)

        # Get collection statistics
        coins = self.db_manager.get_all_coins()
        total_quantity = sum(coin.quantity for coin in coins)
        unique_coins = len(coins)
        countries = len(set(coin.country for coin in coins if coin.country))
        types = len(set(coin.type for coin in coins if coin.type))

        # Create stat widgets
        total_coins = self.create_stat_widget(
            "Total Coins",
            str(total_quantity),
            "src/assets/icons/coins.png"
        )

        unique_types = self.create_stat_widget(
            "Unique Coins",
            str(unique_coins),
            "src/assets/icons/stack.png"
        )

        countries_widget = self.create_stat_widget(
            "Countries",
            str(countries),
            "src/assets/icons/globe.png"
        )

        types_widget = self.create_stat_widget(
            "Types",
            str(types),
            "src/assets/icons/type.png"
        )

        layout.addWidget(total_coins)
        layout.addWidget(unique_types)
        layout.addWidget(countries_widget)
        layout.addWidget(types_widget)

        return frame

    def create_stat_widget(self, title, value, icon_path):
        widget = QFrame()
        widget.setObjectName("statWidget")
        widget.setStyleSheet(f"""
            QFrame#statWidget {{
                background-color: {self.theme_manager.get_color('background')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 4px;
                padding: 15px;
            }}
        """)

        layout = QHBoxLayout(widget)
        layout.setSpacing(15)

        # Icon
        icon_label = QLabel()
        icon_pixmap = QPixmap(icon_path)
        icon_label.setPixmap(icon_pixmap.scaled(32, 32, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        layout.addWidget(icon_label)

        # Text container
        text_container = QWidget()
        text_layout = QVBoxLayout(text_container)
        text_layout.setSpacing(5)

        # Title
        title_label = QLabel(title)
        title_label.setStyleSheet(f"""
            color: {self.theme_manager.get_color('text_secondary')};
            font-size: 14px;
        """)
        text_layout.addWidget(title_label)

        # Value
        value_label = QLabel(value)
        value_label.setStyleSheet(f"""
            color: {self.theme_manager.get_color('text')};
            font-size: 24px;
            font-weight: bold;
        """)
        text_layout.addWidget(value_label)

        layout.addWidget(text_container)
        layout.addStretch()

        # Set size policy
        widget.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
        return widget

    def refresh_data(self):
        """Refresh all dashboard data"""
        # Remove existing overview frame and map
        for i in reversed(range(self.layout().count())):
            widget = self.layout().itemAt(i).widget()
            if widget is not None:
                widget.deleteLater()

        # Rebuild the UI with fresh data
        self.setup_ui()

    def update_theme(self):
        """Update theme colors for all widgets"""
        # Update title
        self.findChild(QLabel, "").setStyleSheet(f"""
            color: {self.theme_manager.get_color('text')};
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
        """)

        # Update overview frame
        overview_frame = self.findChild(QFrame, "overviewFrame")
        if overview_frame:
            overview_frame.setStyleSheet(f"""
                QFrame#overviewFrame {{
                    background-color: {self.theme_manager.get_color('surface')};
                    border: 1px solid {self.theme_manager.get_color('border')};
                    border-radius: 8px;
                    padding: 15px;
                }}
            """)

        # Update stat widgets
        for stat_widget in self.findChildren(QFrame, "statWidget"):
            stat_widget.setStyleSheet(f"""
                QFrame#statWidget {{
                    background-color: {self.theme_manager.get_color('background')};
                    border: 1px solid {self.theme_manager.get_color('border')};
                    border-radius: 4px;
                    padding: 15px;
                }}
            """)

        # Update text colors
        for label in self.findChildren(QLabel):
            if "font-size: 14px" in label.styleSheet():
                label.setStyleSheet(f"""
                    color: {self.theme_manager.get_color('text_secondary')};
                    font-size: 14px;
                """)
            elif "font-size: 24px" in label.styleSheet():
                label.setStyleSheet(f"""
                    color: {self.theme_manager.get_color('text')};
                    font-size: 24px;
                    font-weight: bold;
                """)

        # Update map frame
        map_frame = self.findChild(QFrame, "mapFrame")
        if map_frame:
            map_frame.setStyleSheet(f"""
                QFrame#mapFrame {{
                    background-color: {self.theme_manager.get_color('surface')};
                    border: 1px solid {self.theme_manager.get_color('border')};
                    border-radius: 8px;
                    padding: 10px;
                }}
            """)

        # Update map
        if hasattr(self, 'map_widget'):
            self.map_widget.update_theme()