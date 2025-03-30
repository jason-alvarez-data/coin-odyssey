from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QFrame, 
                              QLabel, QComboBox, QPushButton)
from PySide6.QtCore import Qt
import pandas as pd
from datetime import datetime, timedelta
from matplotlib.figure import Figure
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas

class AnalysisWidget(QWidget):
    def __init__(self, db_manager, theme_manager):
        super().__init__()
        self.db_manager = db_manager
        self.theme_manager = theme_manager
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(20)

        # Create a more compact controls section
        controls_frame = QFrame()
        controls_frame.setObjectName("controlsFrame")
        controls_frame.setMaximumHeight(60)  # Limit the height
        controls_frame.setStyleSheet(f"""
            QFrame#controlsFrame {{
                background-color: {self.theme_manager.get_color('surface')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 4px;
                padding: 5px;
            }}
        """)
        
        controls_layout = QHBoxLayout(controls_frame)
        controls_layout.setContentsMargins(10, 5, 10, 5)  # Reduced margins
        controls_layout.setSpacing(10)

        # Add filter controls with more compact styling
        filter_label = QLabel("Time Period:")
        filter_label.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")
        
        self.date_range = QComboBox()
        self.date_range.addItems(["All Time", "This Year", "Last 12 Months", "Last 6 Months", "Last 30 Days"])
        self.date_range.setFixedWidth(150)  # Set fixed width
        self.date_range.setStyleSheet(f"""
            QComboBox {{
                background-color: {self.theme_manager.get_color('surface')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                padding: 5px;
                border-radius: 4px;
            }}
            QComboBox:hover {{
                border: 1px solid {self.theme_manager.get_color('accent')};
            }}
            QComboBox::drop-down {{
                border: none;
            }}
            QComboBox::down-arrow {{
                image: url(src/assets/icons/dropdown.png);
                width: 12px;
                height: 12px;
            }}
        """)

        update_btn = QPushButton("Update Analysis")
        update_btn.setFixedWidth(120)  # Set fixed width
        update_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {self.theme_manager.get_color('accent')};
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
            }}
            QPushButton:hover {{
                background-color: {self.theme_manager.get_color('accent')}dd;
            }}
        """)
        update_btn.clicked.connect(self.update_charts)

        controls_layout.addWidget(filter_label)
        controls_layout.addWidget(self.date_range)
        controls_layout.addWidget(update_btn)
        controls_layout.addStretch()

        layout.addWidget(controls_frame)

        # Create charts container with grid layout
        charts_frame = QFrame()
        charts_frame.setObjectName("chartsFrame")
        charts_frame.setStyleSheet(f"""
            QFrame#chartsFrame {{
                background-color: {self.theme_manager.get_color('surface')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 4px;
                padding: 10px;
            }}
        """)
        
        # Use grid layout for better chart organization
        from PySide6.QtWidgets import QGridLayout
        self.charts_layout = QGridLayout(charts_frame)
        self.charts_layout.setSpacing(20)
        layout.addWidget(charts_frame)

        # Initial chart creation
        self.update_charts()

    def get_filtered_data(self):
        coins = self.db_manager.get_all_coins()
        df = pd.DataFrame([{
            'year': coin.year,
            'country': coin.country,
            'value': coin.value,
            'unit': coin.unit,
            'type': coin.type,
            'series': coin.series,
            'mint': coin.mint,
            'quantity': coin.quantity,
            'region': coin.region
        } for coin in coins])
        
        return df

    def update_charts(self):
        df = self.get_filtered_data()
        
        # Clear existing charts
        for i in reversed(range(self.charts_layout.count())): 
            self.charts_layout.itemAt(i).widget().setParent(None)
        
        # Create new charts
        if not df.empty:
            # Distribution by Country (top left)
            country_fig = Figure(figsize=(8, 5))  # Increased figure size
            country_ax = country_fig.add_subplot(111)
            country_counts = df['country'].value_counts().head(10)
            country_ax.bar(country_counts.index, country_counts.values)
            country_ax.set_title('Top 10 Countries')
            country_ax.tick_params(axis='x', rotation=45)
            country_canvas = FigureCanvas(country_fig)
            self.charts_layout.addWidget(country_canvas, 0, 0)

            # Distribution by Type (top right)
            type_fig = Figure(figsize=(8, 5))
            type_ax = type_fig.add_subplot(111)
            type_counts = df['type'].value_counts()
            type_ax.pie(type_counts.values, labels=type_counts.index, autopct='%1.1f%%')
            type_ax.set_title('Distribution by Type')
            type_canvas = FigureCanvas(type_fig)
            self.charts_layout.addWidget(type_canvas, 0, 1)

            # Distribution by Year (middle left)
            year_fig = Figure(figsize=(8, 5))
            year_ax = year_fig.add_subplot(111)
            df['year'].value_counts().sort_index().plot(kind='line', ax=year_ax)
            year_ax.set_title('Coins by Year')
            year_ax.set_xlabel('Year')
            year_ax.set_ylabel('Count')
            year_canvas = FigureCanvas(year_fig)
            self.charts_layout.addWidget(year_canvas, 1, 0)

            # Distribution by Region (middle right)
            region_fig = Figure(figsize=(8, 5))
            region_ax = region_fig.add_subplot(111)
            region_counts = df['region'].value_counts()
            region_ax.pie(region_counts.values, labels=region_counts.index, autopct='%1.1f%%')
            region_ax.set_title('Distribution by Region')
            region_canvas = FigureCanvas(region_fig)
            self.charts_layout.addWidget(region_canvas, 1, 1)

            # Distribution by Series (bottom center)
            series_fig = Figure(figsize=(12, 5))  # Wider figure for series
            series_ax = series_fig.add_subplot(111)
            series_counts = df['series'].value_counts().head(10)
            series_ax.bar(series_counts.index, series_counts.values)
            series_ax.set_title('Top 10 Series')
            series_ax.tick_params(axis='x', rotation=45)
            series_canvas = FigureCanvas(series_fig)
            self.charts_layout.addWidget(series_canvas, 2, 0, 1, 2)  # Span both columns

            # Apply theme colors to all charts
            for i in range(self.charts_layout.count()):
                canvas = self.charts_layout.itemAt(i).widget()
                fig = canvas.figure
                fig.tight_layout()  # Add tight layout to prevent label cutoff
                fig.patch.set_facecolor(self.theme_manager.get_color('background'))
                for ax in fig.get_axes():
                    ax.set_facecolor(self.theme_manager.get_color('surface'))
                    ax.tick_params(colors=self.theme_manager.get_color('text'))
                    ax.title.set_color(self.theme_manager.get_color('text'))
                    ax.xaxis.label.set_color(self.theme_manager.get_color('text'))
                    ax.yaxis.label.set_color(self.theme_manager.get_color('text'))
                    if hasattr(ax, 'spines'):
                        for spine in ax.spines.values():
                            spine.set_color(self.theme_manager.get_color('border'))
                canvas.draw()

    def update_theme(self):
        # Update frames
        for frame in self.findChildren(QFrame):
            frame.setStyleSheet(f"QFrame#{frame.objectName()} {{{self.theme_manager.get_stylesheet('frame')}}}")
        
        # Update labels
        for label in self.findChildren(QLabel):
            label.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")

        # Update combobox
        self.date_range.setStyleSheet(f"""
            QComboBox {{
                background-color: {self.theme_manager.get_color('surface')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                padding: 5px;
                border-radius: 4px;
            }}
            QComboBox:hover {{
                border: 1px solid {self.theme_manager.get_color('accent')};
            }}
            QComboBox::drop-down {{
                border: none;
            }}
            QComboBox::down-arrow {{
                image: url(src/assets/icons/dropdown.png);
                width: 12px;
                height: 12px;
            }}
        """)

        # Update charts with new theme colors
        self.update_charts()