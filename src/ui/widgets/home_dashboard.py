from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout,
                              QLabel, QFrame, QProgressBar)
from PySide6.QtCore import Qt
from PySide6.QtGui import QFont, QPixmap
import pandas as pd

class HomeDashboard(QWidget):
    def __init__(self, db_manager, theme_manager):
        super().__init__()
        self.db_manager = db_manager
        self.theme_manager = theme_manager
        self.theme_manager.theme_changed.connect(self.update_theme)
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(20)

        # Collection Overview Section
        self.overview_frame = self.create_overview_frame()
        layout.addWidget(self.overview_frame)

        # Recent Activity and Map Section
        middle_section = QHBoxLayout()

        # Recent Activity
        self.recent_frame = self.create_recent_frame()
        middle_section.addWidget(self.recent_frame)

        # World Map Placeholder
        self.map_frame = self.create_map_placeholder()
        middle_section.addWidget(self.map_frame)

        layout.addLayout(middle_section)

        # Goals Section
        self.goals_frame = self.create_goals_frame()
        layout.addWidget(self.goals_frame)

    def update_theme(self):
        # Update all frames with new theme
        self.overview_frame.setStyleSheet(f"QFrame#overviewFrame {{{self.theme_manager.get_stylesheet('frame')}}}")
        self.recent_frame.setStyleSheet(f"QFrame#recentFrame {{{self.theme_manager.get_stylesheet('frame')}}}")
        self.map_frame.setStyleSheet(f"QFrame#mapFrame {{{self.theme_manager.get_stylesheet('frame')}}}")
        self.goals_frame.setStyleSheet(f"QFrame#goalsFrame {{{self.theme_manager.get_stylesheet('frame')}}}")
        
        # Update all labels with text color
        for label in self.findChildren(QLabel):
            label.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")
        
        # Update progress bars
        for progress_bar in self.findChildren(QProgressBar):
            progress_bar.setStyleSheet(self.theme_manager.get_stylesheet('progress_bar'))

    def create_overview_frame(self):
        frame = QFrame()
        frame.setObjectName("overviewFrame")
        frame.setStyleSheet(f"QFrame#overviewFrame {{{self.theme_manager.get_stylesheet('frame')}}}")

        layout = QHBoxLayout(frame)

        # Total Coins
        coins_count = len(self.db_manager.get_all_coins())
        total_coins = self.create_stat_widget(
            "Total Coins",
            str(coins_count),
            "src/assets/icons/coins2.png"
        )

        # Total Value
        total_value = sum(coin.current_value or 0 for coin in self.db_manager.get_all_coins())
        value_widget = self.create_stat_widget(
            "Collection Value",
            f"${total_value:,.2f}",
            "src/assets/icons/usd-circle.png"
        )

        # Countries Count
        countries = len(set(coin.country for coin in self.db_manager.get_all_coins()))
        countries_widget = self.create_stat_widget(
            "Countries",
            str(countries),
            "src/assets/icons/globe.png"
        )

        layout.addWidget(total_coins)
        layout.addWidget(value_widget)
        layout.addWidget(countries_widget)

        return frame

    def create_stat_widget(self, title, value, icon_path):
        widget = QFrame()
        layout = QVBoxLayout(widget)

        # Icon and Value in one row
        top_layout = QHBoxLayout()

        # Icon
        icon_label = QLabel()
        icon_pixmap = QPixmap(icon_path)
        icon_label.setPixmap(icon_pixmap.scaled(32, 32, Qt.KeepAspectRatio, Qt.SmoothTransformation))

        # Value
        value_label = QLabel(value)
        value_label.setFont(QFont("", 24, QFont.Bold))
        value_label.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")

        top_layout.addWidget(icon_label)
        top_layout.addWidget(value_label)
        top_layout.addStretch()

        # Title
        title_label = QLabel(title)
        title_label.setFont(QFont("", 12))
        title_label.setStyleSheet(f"color: {self.theme_manager.get_color('text_secondary')}")

        layout.addLayout(top_layout)
        layout.addWidget(title_label)

        return widget

    def create_recent_frame(self):
        frame = QFrame()
        frame.setObjectName("recentFrame")
        frame.setStyleSheet(f"QFrame#recentFrame {{{self.theme_manager.get_stylesheet('frame')}}}")

        layout = QVBoxLayout(frame)

        # Header
        header = QLabel("Recent Additions")
        header.setFont(QFont("", 14, QFont.Bold))
        header.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")
        layout.addWidget(header)

        # Get 5 most recent coins
        recent_coins = sorted(
            self.db_manager.get_all_coins(),
            key=lambda x: x.purchase_date or pd.Timestamp.min,
            reverse=True
        )[:5]

        for coin in recent_coins:
            coin_label = QLabel(f"{coin.title} - {coin.year}")
            coin_label.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")
            layout.addWidget(coin_label)

        return frame

    def create_map_placeholder(self):
        frame = QFrame()
        frame.setObjectName("mapFrame")
        frame.setStyleSheet(f"QFrame#mapFrame {{{self.theme_manager.get_stylesheet('frame')}}}")

        layout = QVBoxLayout(frame)

        # Header
        header = QLabel("Collection Geography")
        header.setFont(QFont("", 14, QFont.Bold))
        header.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")
        layout.addWidget(header)

        # Placeholder for map
        map_label = QLabel("World Map Coming Soon!")
        map_label.setAlignment(Qt.AlignCenter)
        map_label.setStyleSheet(f"color: {self.theme_manager.get_color('text_secondary')}")
        layout.addWidget(map_label)

        return frame

    def create_goals_frame(self):
        frame = QFrame()
        frame.setObjectName("goalsFrame")
        frame.setStyleSheet(f"QFrame#goalsFrame {{{self.theme_manager.get_stylesheet('frame')}}}")

        layout = QVBoxLayout(frame)

        # Header
        header = QLabel("Collection Goals")
        header.setFont(QFont("", 14, QFont.Bold))
        header.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")
        layout.addWidget(header)

        # Example goals
        goals = [
            ("Complete State Quarter Collection", 45, 50),
            ("Acquire Pre-1900 Coins", 3, 10),
            ("Collect World War II Era Coins", 12, 20)
        ]

        for name, current, total in goals:
            goal_layout = QVBoxLayout()

            # Goal name and progress
            label = QLabel(f"{name} ({current}/{total})")
            label.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")
            
            progress = QProgressBar()
            progress.setMaximum(total)
            progress.setValue(current)
            progress.setStyleSheet(self.theme_manager.get_stylesheet('progress_bar'))

            goal_layout.addWidget(label)
            goal_layout.addWidget(progress)
            layout.addLayout(goal_layout)

        return frame
        