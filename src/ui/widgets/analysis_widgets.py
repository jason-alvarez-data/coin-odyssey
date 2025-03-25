from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                              QComboBox, QPushButton, QFrame)
from PySide6.QtCore import Qt
import pandas as pd
from datetime import datetime, timedelta

class AnalysisWidget(QWidget):
    def __init__(self, db_manager, parent=None):
        super().__init__(parent)
        self.db_manager = db_manager
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)

        # Add filter frame
        filter_frame = self.create_filter_frame()
        layout.addWidget(filter_frame)

        # Create chart frames
        value_chart = self.create_chart_frame("Collection Value Over Time")
        condition_chart = self.create_chart_frame("Condition Distribution")
        country_chart = self.create_chart_frame("Countries Distribution")

        # Add charts to layout
        charts_layout = QHBoxLayout()
        charts_layout.addWidget(value_chart)
        charts_layout.addWidget(condition_chart)
        charts_layout.addWidget(country_chart)
        layout.addLayout(charts_layout)

    def create_filter_frame(self):
        frame = QFrame()
        frame.setObjectName("contentCard")
        layout = QVBoxLayout(frame)

        # Add date range filter
        filter_layout = QHBoxLayout()
        date_label = QLabel("Time Range:")
        self.date_range = QComboBox()
        self.date_range.addItems([
            "All Time",
            "This Year",
            "Last 12 Months",
            "Last 6 Months",
            "Last 30 Days"
        ])

        btn_update = QPushButton("Update Analysis")
        btn_update.clicked.connect(self.update_analysis)

        filter_layout.addWidget(date_label)
        filter_layout.addWidget(self.date_range)
        filter_layout.addStretch()
        filter_layout.addWidget(btn_update)

        layout.addLayout(filter_layout)
        return frame

    def create_chart_frame(self, title):
        frame = QFrame()
        frame.setObjectName("contentCard")
        layout = QVBoxLayout(frame)

        # Add title
        title_label = QLabel(title)
        title_label.setStyleSheet("""
            QLabel {
                font-size: 14px;
                font-weight: bold;
                color: #2196F3;
            }
        """)
        layout.addWidget(title_label)

        return frame

    def get_filtered_data(self):
        coins = self.db_manager.get_all_coins()
        df = pd.DataFrame([{
            'year': coin.year,
            'value': coin.current_value,
            'purchase_value': coin.purchase_price,
            'country': coin.country,
            'condition': coin.condition,
            'purchase_date': coin.purchase_date
        } for coin in coins])

        # Apply date filter
        date_filter = self.date_range.currentText()
        if date_filter != "All Time":
            end_date = datetime.now().date()
            if date_filter == "This Year":
                start_date = datetime(end_date.year, 1, 1).date()
            elif date_filter == "Last 12 Months":
                start_date = end_date - timedelta(days=365)
            elif date_filter == "Last 6 Months":
                start_date = end_date - timedelta(days=182)
            elif date_filter == "Last 30 Days":
                start_date = end_date - timedelta(days=30)

            df = df[df['purchase_date'].between(start_date, end_date)]

        return df

    def update_analysis(self):
        # Implement your analysis update logic here
        df = self.get_filtered_data()
        # Update your charts based on the filtered data
        pass