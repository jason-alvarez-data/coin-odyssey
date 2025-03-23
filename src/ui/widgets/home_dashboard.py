from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout,
                                QLabel, QFrame, QProgressBar)
from PySide6.QtCore import Qt
from PySide6.QtGui import QFont

class HomeDashboard(QWidget):
    def __init__(self, db_manager):
        super().__init__()
        self.db_manager = db_manager
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(20)

        # Collection Overview Section
        overview_frame = self.create_overview_frame()
        layout.addWidget(overview_frame)

        # Recent Activity and Map Section
        middle_section = QHBoxLayout()

        # Recent Activity
        recent_frame = self.create_recent_frame()
        middle_section.addWidget(recent_frame)

        # World Map Placeholder (we'll implement the map later)
        map_frame = self.create_map_placeholder()
        middle_section.addWidget(map_frame)

        layout.addLayout(middle_section)

        # Goals Section
        goals_frame = self.create_goals_frame()
        layout.addWidget(goals_frame)

    def create_overview_frame(self):
        frame = QFrame()
        frame.setObjectName("overviewFrame")
        frame.setStyleSheet("""
            QFrame#overviewFrame {
                background-color: white;
                border-radius: 10px;
                padding: 15px;
            }
        """)

        layout = QHBoxLayout(frame)

        # Total Coins
        coins_count = len(self.db_manager.get_all_coins())
        total_coins = self.create_stat_widget(
            "Total Coins",
            str(coins_count),
            "fas fa-coins" # FontAwesome icon as Placeholder
        )

        # Total Value
        total_value = sum(coin.current_value or 0 for coin in self.db_manager.get_all_coins())
        value_widget = self.create_stat_widget(
            "Collection Value",
            f"${total_value:,.2f}",
            "fas fa-dollar-sign" # FontAwesome icon as Placeholder
        )

        # Countries Count
        countries = len(set(coin.country for coin in self.db_manager.get_all_coins()))
        countries_widget = self.create_stat_widget(
            "Countries",
            str(countries),
            "fas fa-globe" # FontAwesome icon as Placeholder
        )

        layout.addWidget(total_coins)
        layout.addWidget(value_widget)
        layout.addWidget(countries_widget)

        return frame
    
    def create_stat_widget(self, title, value, icon):
        widget = QFrame()
        layout = QVBoxLayout(widget)

        # Icone and Value in one row
        top_layout = QHBoxLayout()
        icon_label = QLabel(icon)
        icon_label.setFont(QFont("", 24))
        value_label = QLabel(value)
        value_label.setFont(QFont("", 24, QFont.Bold))

        top_layout.addWidget(icon_label)
        top_layout.addWidget(value_label)
        top_layout.addStretch()

        # Title below
        title_label = QLabel(title)
        title_label.setFont(QFont("", 12))

        layout.addLayout(top_layout)
        layout.addWidget(title_label)

        return widget
    
    def create_recent_frame(self):
        frame = QFrame()
        frame.setObjectName("recentFrame")
        frame.setStyleSheet("""
            QFrame#recentFrame {
                background-color: white;
                border-radius: 10px;
                padding: 15px;
            }
        """)

        layout = QVBoxLayout(frame)

        # Header
        header = QLabel("Recent Additions")
        header.setFont(QFont("", 14, QFont.Bold))
        layout.addWidget(header)

        # Get 5 most recent coins
        recent_coins = sorted(
            self.db_manager.get_all_coins(),
            key=lambda x: x.purchase_date or pd.Timestamp.min,
            reverse=True
        )[:5]

        for coin in recent_coins:
            coin_label = QLabel(f"{coin.title} - {coin.year}")
            layout.addWidget(coin_label)

        return frame
    
    def create_map_placeholder(self):
        frame = QFrame()
        frame.setObjectName("mapFrame")
        frame.setStyleSheet("""
            QFrame#mapFrame {
                background-color: white;
                border-radius: 10px;
                padding: 15px;
            }
        """)

        layout = QVBoxLayout(frame)

        # Header
        header = QLabel("Collection Geography")
        header.setFont(QFont("", 14, QFont.Bold))
        layout.addWidget(header)

        # Placeholder for map
        map_label = QLabel("World Map Coming Soon!")
        map_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(map_label)

        return frame
    
    def create_goals_frame(self):
        frame = QFrame()
        frame.setObjectName("goalsFrame")
        frame.setStyleSheet("""
            QFrame#goalsFrame {
                background-color: white;
                border-radius: 10px;
                padding: 15px;
            }
        """)

        layout = QVBoxLayout(frame)

        # Header
        header = QLabel("Collection Goals")
        header.setFont(QFont("", 14, QFont.Bold))
        layout.addWidget(header)

        # Example goals (you'll need to implement goal tracking in database)
        goals = [
            ("Complete State Quarter Collection", 45, 50),
            ("Acquire Pre-1900 Coins", 3, 10),
            ("Collect World War II Era Coins", 12, 20)
        ]

        for name, current, total in goals:
            goal_layout = QVBoxLayout()

            # Goal name and progress
            label = QLabel(f"{name} ({current}/{total})")
            progress = QProgressBar()
            progress.setMaximum(total)
            progress.setValue(current)

            goal_layout.addWidget(label)
            goal_layout.addWidget(progress)
            layout.addLayout(goal_layout)

        return frame
        