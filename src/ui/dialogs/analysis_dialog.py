from PySide6.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QComboBox,
                               QPushButton, QWidget, QLabel, QFrame, QGridLayout,
                               QDateEdit)
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure
import matplotlib.pyplot as plt
import pandas as pd
from datetime import datetime, timedelta
from PySide6.QtCore import Qt

class AnalysisDialog(QDialog):
    def __init__(self, db_manager, parent=None):
        super().__init__(parent)
        self.db_manager = db_manager
        self.setup_ui()

    def setup_ui(self):
        self.setWindowTitle("Collection Analysis")
        self.setMinimumSize(1200, 800)

        layout = QVBoxLayout(self)

        # Create filter controls
        filter_frame = self.create_filter_frame()
        layout.addWidget(filter_frame)

        # Create grid for charts
        charts_grid = QGridLayout()

        # Value Analysis Chart
        value_frame = self.create_chart_frame("Value Analysis")
        self.value_figure = Figure(figsize=(6, 4))
        self.value_canvas = FigureCanvas(self.value_figure)
        value_frame.layout().addWidget(self.value_canvas)
        charts_grid.addWidget(value_frame, 0, 0)

        # Collection Composition Chart
        composition_frame = self.create_chart_frame("Collection Composition")
        self.composition_figure = Figure(figsize=(6, 4))
        self.composition_canvas = FigureCanvas(self.composition_figure)
        composition_frame.layout().addWidget(self.composition_canvas)
        charts_grid.addWidget(composition_frame, 0, 1)

        # Timeline Chart
        timeline_frame = self.create_chart_frame("Acquisition Timeline")
        self.timeline_figure = Figure(figsize=(6, 4))
        self.timeline_canvas = FigureCanvas(self.timeline_figure)
        timeline_frame.layout().addWidget(self.timeline_canvas)
        charts_grid.addWidget(timeline_frame, 1, 0)

        # Condition Analysis Chart
        condition_frame = self.create_chart_frame("Condition Distribution")
        self.condition_figure = Figure(figsize=(6, 4))
        self.condition_canvas = FigureCanvas(self.condition_figure)
        condition_frame.layout().addWidget(self.condition_canvas)
        charts_grid.addWidget(condition_frame, 1, 1)

        layout.addLayout(charts_grid)

        # Initial update
        self.update_all_charts()

    def create_filter_frame(self):
        frame = QFrame()
        frame.setStyleSheet("""
            QFrame {
                background-color: white;
                border-radius: 8px;
                padding: 10px;
            }
        """)

        layout = QHBoxLayout(frame)

        # Date range filter
        date_layout = QHBoxLayout()
        date_layout.addWidget(QLabel("Date Range:"))

        self.date_range = QComboBox()
        self.date_range.addItems([
            "All Time",
            "This Year",
            "Last 12 Months",
            "Last 6 Months",
            "Last 30 Days"
        ])
        self.date_range.currentTextChanged.connect(self.update_all_charts)
        date_layout.addWidget(self.date_range)

        # Custom date range
        self.start_date = QDateEdit()
        self.start_date.setDate(datetime.now().date() - timedelta(days=365))
        self.end_date = QDateEdit()
        self.end_date.setDate(datetime.now().date())

        date_layout.addWidget(QLabel("From:"))
        date_layout.addWidget(self.start_date)
        date_layout.addWidget(QLabel("To:"))
        date_layout.addWidget(self.end_date)

        layout.addLayout(date_layout)
        layout.addStretch()

        # Update button
        btn_update = QPushButton("Update Charts")
        btn_update.clicked.connect(self.update_all_charts)
        layout.addWidget(btn_update)

        return frame
    
    def create_chart_frame(self, title):
        frame = QFrame()
        frame.setStyleSheet("""
            QFrame {
                background-color: white;
                border-radius: 8px;
                padding: 10px;
                margin: 5px;
            }
        """)

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

    def update_all_charts(self):
        df = self.get_filtered_data()

        # Update Value Analysis
        self.value_figure.clear()
        ax = self.value_figure.add_subplot(111)
        if not df.empty:
            ax.hist(df['value'].dropna(), bins=20)
        ax.set_title("Value Distribution")
        ax.set_xlabel("Value ($)")
        ax.set_ylabel("Count")
        self.value_canvas.draw()

        # Update Composition Analysis
        self.composition_figure.clear()
        ax = self.composition_figure.add_subplot(111)
        if not df.empty:
            country_counts = df['country'].value_counts()
            ax.pie(country_counts.values, labels=country_counts.index, autopct='%1.1f%%')
        ax.set_title("Distribution by Country")
        self.composition_canvas.draw()

        # Update Timeline
        self.timeline_figure.clear()
        ax = self.timeline_figure.add_subplot(111)
        if not df.empty:
            timeline_data = df.groupby('purchase_date')['value'].sum().cumsum()
            ax.plot(timeline_data.index, timeline_data.values)
        ax.set_title("Collection Growth Over Time")
        ax.set_xlabel("Date")
        ax.set_ylabel("Total Value ($)")
        self.timeline_canvas.draw()

        # Update Condition Analysis
        self.condition_figure.clear()
        ax = self.condition_figure.add_subplot(111)
        if not df.empty:
            condition_counts = df['condition'].value_counts()
            ax.bar(condition_counts.index, condition_counts.values)
        ax.set_title("Condition Distribution")
        ax.set_xlabel("Condition")
        ax.set_ylabel("Count")
        ax.tick_params(axis='x', rotation=45)
        self.condition_canvas.draw()