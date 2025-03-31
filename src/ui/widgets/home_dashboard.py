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
        layout.setSpacing(15)  # Reduced spacing between sections

        # Add title with reduced margins
        title = QLabel("Collection Dashboard")
        title.setStyleSheet(f"""
            color: {self.theme_manager.get_color('text')};
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
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
            margin-top: 5px;
            margin-bottom: 5px;
        """)
        layout.addWidget(map_title)
        
        # Give the map more vertical space
        map_frame = self.create_map_frame()
        map_frame.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        layout.addWidget(map_frame)

        # Add collection goals section with reduced spacing
        goals_title = QLabel("Collection Goals")
        goals_title.setStyleSheet(f"""
            color: {self.theme_manager.get_color('text')};
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
            margin-bottom: 5px;
        """)
        layout.addWidget(goals_title)
        layout.addWidget(self.create_goals_frame())

    def create_overview_frame(self):
        frame = QFrame()
        frame.setFixedHeight(120)  # Reduced height
        frame.setStyleSheet(f"""
            QFrame {{
                background-color: {self.theme_manager.get_color('surface')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 8px;
                padding: 10px;
            }}
        """)

        layout = QHBoxLayout(frame)
        layout.setSpacing(15)
        layout.setContentsMargins(10, 10, 10, 10)  # Reduced margins

        # Get collection stats
        coins = self.db_manager.get_all_coins()
        total_coins = len(coins)
        
        # Calculate values
        unique_countries = len(set([coin.country for coin in coins if coin.country]))
        unique_years = len(set([coin.year for coin in coins if coin.year]))
        estimated_value = sum([coin.purchase_price for coin in coins if coin.purchase_price])
        
        # Create stat widgets
        layout.addWidget(self.create_stat_widget(
            "Total Coins", 
            f"{total_coins}",
            "coin.png"
        ))
        layout.addWidget(self.create_stat_widget(
            "Countries", 
            f"{unique_countries}",
            "globe.png"
        ))
        layout.addWidget(self.create_stat_widget(
            "Years Span", 
            f"{unique_years}",
            "calendar.png"
        ))
        layout.addWidget(self.create_stat_widget(
            "Estimated Value", 
            f"${estimated_value:.2f}",
            "money.png"
        ))
        
        return frame

    def create_stat_widget(self, label, value, icon_name):
        widget = QFrame()
        widget.setStyleSheet(f"""
            QFrame {{
                background-color: {self.theme_manager.get_color('background')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 4px;
                padding: 8px;
            }}
        """)
        
        layout = QVBoxLayout(widget)
        layout.setSpacing(2)
        layout.setContentsMargins(8, 8, 8, 8)
        
        # Label
        label_widget = QLabel(label)
        label_widget.setStyleSheet(f"""
            color: {self.theme_manager.get_color('text_secondary')};
            font-size: 12px;
        """)
        
        # Value with icon
        value_layout = QHBoxLayout()
        
        try:
            # Try to load icon
            icon = QLabel()
            icon_path = f"src/assets/icons/{icon_name}"
            pixmap = QPixmap(icon_path)
            if not pixmap.isNull():
                icon.setPixmap(pixmap.scaled(16, 16, Qt.KeepAspectRatio, Qt.SmoothTransformation))
                value_layout.addWidget(icon)
            else:
                print(f"Warning: Could not load icon from {icon_path}")
        except Exception as e:
            print(f"Error loading icon {icon_name}: {e}")
        
        value_widget = QLabel(value)
        value_widget.setStyleSheet(f"""
            color: {self.theme_manager.get_color('text')};
            font-size: 16px;
            font-weight: bold;
        """)
        value_layout.addWidget(value_widget)
        value_layout.addStretch()
        
        layout.addWidget(label_widget)
        layout.addLayout(value_layout)
        
        return widget

    def create_map_frame(self):
        frame = QFrame()
        frame.setStyleSheet(f"""
            QFrame {{
                background-color: {self.theme_manager.get_color('surface')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 8px;
                padding: 10px;
            }}
        """)
        
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(10, 10, 10, 10)
        
        # Add map widget
        map_widget = CollectionMapWidget(self.db_manager, self.theme_manager)
        layout.addWidget(map_widget)
        
        return frame

    def create_goals_frame(self):
        frame = QFrame()
        frame.setFixedHeight(130)  # Fixed height for compact display
        frame.setStyleSheet(f"""
            QFrame {{
                background-color: {self.theme_manager.get_color('surface')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 8px;
                padding: 10px;
            }}
        """)

        layout = QHBoxLayout(frame)
        layout.setSpacing(10)
        layout.setContentsMargins(10, 10, 10, 10)

        # Get current collection stats
        coins = self.db_manager.get_all_coins()
        total_coins = len(coins)
        
        # Get goals from database
        goals = self.db_manager.get_goals()
        
        if not goals:
            # Default goals if none exist
            layout.addWidget(self.create_goal_widget(
                "Total Coins",
                "Build your collection",
                f"Progress: {total_coins} coins"
            ))
        else:
            # Display up to 3 goals
            for goal in goals[:3]:
                layout.addWidget(self.create_goal_widget(
                    goal['title'],
                    goal['description'],
                    f"Progress: {total_coins}/{goal['target']} coins"
                ))

        return frame

    def create_goal_widget(self, title, description, progress_text):
        widget = QFrame()
        widget.setStyleSheet(f"""
            QFrame {{
                background-color: {self.theme_manager.get_color('background')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 4px;
                padding: 15px;
            }}
        """)

        layout = QVBoxLayout(widget)
        layout.setSpacing(5)
        layout.setContentsMargins(8, 8, 8, 8)

        # Title
        title_label = QLabel(title)
        title_label.setStyleSheet(f"""
            color: {self.theme_manager.get_color('text')};
            font-size: 16px;
            font-weight: bold;
        """)

        # Description
        desc_label = QLabel(description)
        desc_label.setStyleSheet(f"""
            color: {self.theme_manager.get_color('text_secondary')};
            font-size: 12px;
        """)
        desc_label.setWordWrap(True)

        # Progress
        progress_label = QLabel(progress_text)
        progress_label.setStyleSheet(f"""
            color: {self.theme_manager.get_color('accent')};
            font-size: 14px;
            font-weight: bold;
        """)

        layout.addWidget(title_label)
        layout.addWidget(desc_label)
        layout.addWidget(progress_label)

        return widget

    def refresh_data(self):
        """Refresh all dashboard data"""
        # Remove existing widgets
        for i in reversed(range(self.layout().count())):
            widget = self.layout().itemAt(i).widget()
            if widget is not None:
                widget.deleteLater()

        # Rebuild the UI with fresh data
        self.setup_ui()

    def update_theme(self):
        """Update theme colors for all widgets"""
        self.refresh_data()  # Simplest way to update all widgets with new theme