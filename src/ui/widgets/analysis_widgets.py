from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, 
                              QFrame, QLabel, QPushButton, QComboBox)
from PySide6.QtCore import Qt
import pandas as pd
import matplotlib
matplotlib.use('Qt5Agg')
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure
import mplcursors
import numpy as np

class AnalysisWidget(QWidget):
    def __init__(self, db_manager, theme_manager):
        super().__init__()
        self.db_manager = db_manager
        self.theme_manager = theme_manager
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)

        # Create controls at the top
        controls_frame = QFrame()
        controls_frame.setStyleSheet(f"""
            background-color: {self.theme_manager.get_color('surface')};
            border: 1px solid {self.theme_manager.get_color('border')};
            border-radius: 4px;
            padding: 10px;
        """)
        
        controls_layout = QHBoxLayout(controls_frame)
        controls_layout.setContentsMargins(10, 10, 10, 10)
        
        filter_label = QLabel("Time Range:")
        filter_label.setStyleSheet(f"color: {self.theme_manager.get_color('text')};")
        
        self.date_range = QComboBox()
        self.date_range.addItems(["All Time", "Last Year", "Last 5 Years", "Last 10 Years"])
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

        charts_frame.setStyleSheet(f"""
            QFrame {{
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
        
        # Apply date range filter if selected
        selected_range = self.date_range.currentText()
        if selected_range != "All Time" and not df.empty and 'year' in df.columns:
            import datetime
            current_year = datetime.datetime.now().year
            
            if selected_range == "Last Year":
                df = df[df['year'] >= current_year - 1]
            elif selected_range == "Last 5 Years":
                df = df[df['year'] >= current_year - 5]
            elif selected_range == "Last 10 Years":
                df = df[df['year'] >= current_year - 10]
        
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
            
            # Store country names and values in lists for easier access
            country_names = country_counts.index.tolist()
            country_values = country_counts.values.tolist()
            
            bars = country_ax.bar(range(len(country_names)), country_values)
            country_ax.set_title('Top 10 Countries')
            country_ax.set_xticks(range(len(country_names)))
            country_ax.set_xticklabels(country_names, rotation=45)
            country_canvas = FigureCanvas(country_fig)
            self.charts_layout.addWidget(country_canvas, 0, 0)
            
            # Use a simple hover annotation
            cursor = mplcursors.cursor(bars, hover=True)
            cursor.connect("add", lambda sel: sel.annotation.set_text(
                f"{country_names[sel.index]}: {country_values[sel.index]}"
            ))

            # Distribution by Type (top right)
            type_fig = Figure(figsize=(8, 5))
            type_ax = type_fig.add_subplot(111)
            type_counts = df['type'].value_counts()
            type_names = type_counts.index.tolist()
            type_values = type_counts.values.tolist()
            
            wedges, _ = type_ax.pie(type_values, labels=None, wedgeprops=dict(width=0.5))
            type_ax.set_title('Distribution by Type')
            # Add a legend instead of labels on the pie
            type_ax.legend(wedges, type_names, loc="center left", bbox_to_anchor=(1, 0, 0.5, 1))
            type_canvas = FigureCanvas(type_fig)
            self.charts_layout.addWidget(type_canvas, 0, 1)
            
            # Manually handle hover tooltips for pie chart
            def on_hover(event):
                for i, wedge in enumerate(wedges):
                    if wedge.contains_point([event.x, event.y]):
                        annotation = f"{type_names[i]}: {type_values[i]} ({type_values[i]/sum(type_values)*100:.1f}%)"
                        type_ax.annotate(annotation, xy=(event.x, event.y), xytext=(20, 20),
                                         textcoords='offset points', arrowprops=dict(arrowstyle="->"))
                        break

            type_fig.canvas.mpl_connect("motion_notify_event", on_hover)

            # Distribution by Year (middle left)
            year_fig = Figure(figsize=(8, 5))
            year_ax = year_fig.add_subplot(111)
            year_counts = df['year'].value_counts().sort_index()
            year_indices = year_counts.index.tolist()
            year_values = year_counts.values.tolist()
            
            line, = year_ax.plot(year_indices, year_values)
            year_ax.set_title('Coins by Year')
            year_ax.set_xlabel('Year')
            year_ax.set_ylabel('Count')
            year_canvas = FigureCanvas(year_fig)
            self.charts_layout.addWidget(year_canvas, 1, 0)
            
            # Add hover tooltips to line chart
            cursor = mplcursors.cursor(line, hover=True)
            cursor.connect("add", lambda sel: sel.annotation.set_text(
                f"Year: {year_indices[int(np.round(sel.index))]}\n"
                f"Count: {year_values[int(np.round(sel.index))]}"
            ))

            # Distribution by Region (middle right)
            region_fig = Figure(figsize=(8, 5))
            region_ax = region_fig.add_subplot(111)
            region_counts = df['region'].value_counts()
            region_names = region_counts.index.tolist()
            region_values = region_counts.values.tolist()
            
            wedges, _ = region_ax.pie(region_values, labels=None, wedgeprops=dict(width=0.5))
            region_ax.set_title('Distribution by Region')
            # Add a legend instead of labels on the pie
            region_ax.legend(wedges, region_names, loc="center left", bbox_to_anchor=(1, 0, 0.5, 1))
            region_canvas = FigureCanvas(region_fig)
            self.charts_layout.addWidget(region_canvas, 1, 1)
            
            # Manually handle hover tooltips for region pie chart
            def on_hover_region(event):
                for i, wedge in enumerate(wedges):
                    if wedge.contains_point([event.x, event.y]):
                        annotation = f"{region_names[i]}: {region_values[i]} ({region_values[i]/sum(region_values)*100:.1f}%)"
                        region_ax.annotate(annotation, xy=(event.x, event.y), xytext=(20, 20),
                                           textcoords='offset points', arrowprops=dict(arrowstyle="->"))
                        break

            region_fig.canvas.mpl_connect("motion_notify_event", on_hover_region)

            # Series chart (bottom)
            if 'series' in df.columns:
                series_fig = Figure(figsize=(12, 4))
                series_ax = series_fig.add_subplot(111)
                series_counts = df['series'].value_counts().head(10)
                series_names = series_counts.index.tolist()
                series_values = series_counts.values.tolist()
                
                bars = series_ax.bar(range(len(series_names)), series_values)
                series_ax.set_title('Top 10 Series')
                series_ax.set_xticks(range(len(series_names)))
                series_ax.set_xticklabels(series_names, rotation=45)
                series_canvas = FigureCanvas(series_fig)
                self.charts_layout.addWidget(series_canvas, 2, 0, 1, 2)  # Span two columns
                
                # Add hover tooltips to series bar chart
                cursor = mplcursors.cursor(bars, hover=True)
                cursor.connect("add", lambda sel: sel.annotation.set_text(
                    f"{series_names[sel.index]}: {series_values[sel.index]}"
                ))

    def update_theme(self):
        """Update with new theme"""
        self.update_charts()  # Simplest way to update charts with new theme