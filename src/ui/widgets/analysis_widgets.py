from PySide6.QtWidgets import (QWidget, QVBoxLayout, QLabel, QFrame,
                               QComboBox, QHBoxLayout)
from PySide6.QtCore import Qt
from PySide6.QtGui import QFont
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
import pandas as pd
from datetime import datetime, timedelta

class AnalysisWidget(QWidget):
    def __init__(self, db_manager, theme_manager):
        super().__init__()
        self.db_manager = db_manager
        self.theme_manager = theme_manager
        self.setup_ui()

        # Connect theme changes
        self.theme_manager.theme_changed.connect(self.update_theme)
        self.theme_manager.theme_changed.connect(self.update_charts)

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(20)

        # Date filter
        filter_layout = QHBoxLayout()
        filter_label = QLabel("Time Range:")
        filter_label.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")
        self.date_range = QComboBox()
        self.date_range.addItems([
            "All Time",
            "This Year",
            "Last 12 Months",
            "Last 6 Months",
            "Last 30 Days"
        ])
        self.date_range.currentTextChanged.connect(self.update_charts)
        filter_layout.addWidget(filter_label)
        filter_layout.addWidget(self.date_range)
        filter_layout.addStretch()
        layout.addLayout(filter_layout)

        # Create analysis sections
        self.value_analysis = self.create_value_analysis_frame()
        self.country_analysis = self.create_country_analysis_frame()
        self.condition_analysis = self.create_condition_analysis_frame()

        # Add to layout
        layout.addWidget(self.value_analysis)
        layout.addWidget(self.country_analysis)
        layout.addWidget(self.condition_analysis)
        layout.addStretch()

    def create_value_analysis_frame(self):
        frame = QFrame()
        frame.setObjectName("value_analysis_frame")
        frame.setStyleSheet(f"QFrame#{frame.objectName()} {{{self.theme_manager.get_stylesheet('frame')}}}")
        
        layout = QVBoxLayout(frame)
        
        # Header
        header = QLabel("Value Analysis")
        header.setFont(QFont("", 14, QFont.Bold))
        header.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")
        layout.addWidget(header)

        # Create figure for value analysis
        self.value_figure, self.value_canvas = self.create_figure()
        layout.addWidget(self.value_canvas)
        
        return frame

    def create_country_analysis_frame(self):
        frame = QFrame()
        frame.setObjectName("country_analysis_frame")
        frame.setStyleSheet(f"QFrame#{frame.objectName()} {{{self.theme_manager.get_stylesheet('frame')}}}")
        
        layout = QVBoxLayout(frame)
        
        # Header
        header = QLabel("Country Distribution")
        header.setFont(QFont("", 14, QFont.Bold))
        header.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")
        layout.addWidget(header)

        # Create figure for country distribution
        self.country_figure, self.country_canvas = self.create_figure()
        layout.addWidget(self.country_canvas)
        
        return frame

    def create_condition_analysis_frame(self):
        frame = QFrame()
        frame.setObjectName("condition_analysis_frame")
        frame.setStyleSheet(f"QFrame#{frame.objectName()} {{{self.theme_manager.get_stylesheet('frame')}}}")
        
        layout = QVBoxLayout(frame)
        
        # Header
        header = QLabel("Condition Distribution")
        header.setFont(QFont("", 14, QFont.Bold))
        header.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")
        layout.addWidget(header)

        # Create figure for condition distribution
        self.condition_figure, self.condition_canvas = self.create_figure()
        layout.addWidget(self.condition_canvas)
        
        return frame

    def create_figure(self):
        figure = plt.figure(figsize=(6, 4))
        canvas = FigureCanvas(figure)
        return figure, canvas

    def update_charts(self):
        # Get filtered data
        df = self.get_filtered_data()
        if df.empty:
            return

        # Update value analysis chart
        self.update_value_chart(df)
        
        # Update country distribution chart
        self.update_country_chart(df)
        
        # Update condition distribution chart
        self.update_condition_chart(df)

    def update_value_chart(self, df):
        self.value_figure.clear()
        ax = self.value_figure.add_subplot(111)
        
        # Calculate total value over time
        df['cumulative_value'] = df.sort_values('purchase_date')['value'].cumsum()
        
        # Plot the line
        ax.plot(df['purchase_date'], df['cumulative_value'], 
                color=self.theme_manager.get_color('accent'))
        
        # Customize the chart
        ax.set_facecolor(self.theme_manager.get_color('surface'))
        self.value_figure.patch.set_facecolor(self.theme_manager.get_color('surface'))
        ax.tick_params(colors=self.theme_manager.get_color('text'))
        ax.set_title('Collection Value Growth', color=self.theme_manager.get_color('text'))
        
        self.value_figure.autofmt_xdate()  # Rotate and align the tick labels
        self.value_canvas.draw()

    def update_country_chart(self, df):
        self.country_figure.clear()
        ax = self.country_figure.add_subplot(111)
        
        # Get country distribution
        country_counts = df['country'].value_counts().head(10)
        
        # Create bar chart
        bars = ax.bar(country_counts.index, country_counts.values,
                     color=self.theme_manager.get_color('accent'))
        
        # Customize the chart
        ax.set_facecolor(self.theme_manager.get_color('surface'))
        self.country_figure.patch.set_facecolor(self.theme_manager.get_color('surface'))
        ax.tick_params(colors=self.theme_manager.get_color('text'))
        ax.set_title('Top 10 Countries', color=self.theme_manager.get_color('text'))
        
        plt.xticks(rotation=45, ha='right')
        self.country_figure.tight_layout()
        self.country_canvas.draw()

    def update_condition_chart(self, df):
        self.condition_figure.clear()
        ax = self.condition_figure.add_subplot(111)
        
        # Get condition distribution
        condition_counts = df['condition'].value_counts()
        
        # Create pie chart
        ax.pie(condition_counts.values, labels=condition_counts.index, autopct='%1.1f%%',
               colors=[self.theme_manager.get_color('accent'),
                      self.theme_manager.get_color('progress_bar'),
                      self.theme_manager.get_color('border')])
        
        # Customize the chart
        ax.set_facecolor(self.theme_manager.get_color('surface'))
        self.condition_figure.patch.set_facecolor(self.theme_manager.get_color('surface'))
        ax.set_title('Condition Distribution', color=self.theme_manager.get_color('text'))
        
        self.condition_figure.tight_layout()
        self.condition_canvas.draw()

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

    def update_theme(self):
        # Update frames
        for frame in self.findChildren(QFrame):
            frame.setStyleSheet(f"QFrame#{frame.objectName()} {{{self.theme_manager.get_stylesheet('frame')}}}")
        
        # Update labels
        for label in self.findChildren(QLabel):
            label.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")

        # Update charts with new theme colors
        self.update_charts()