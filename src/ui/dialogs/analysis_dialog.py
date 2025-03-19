from PySide6.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout,
                               QComboBox, QPushButton, QWidget)
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure
import pandas as pd

class AnalysisDialog(QDialog):
    def __init__(self, db_manager, parent=None):
        super().__init__(parent)
        self.db_manager = db_manager
        self.setup_ui()

    def setup_ui(self):
        self.setWindowTitle("Collection Analysis")
        self.setMinimumSize(800, 600)

        layout = QVBoxLayout(self)

        # Create controls
        controls = QWidget()
        controls_layout = QHBoxLayout(controls)

        self.chart_type = QComboBox()
        self.chart_type.addItems([
            "Value Distribution",
            "Country Distribution",
            "Timeline",
            "Condition Analysis"
        ])

        btn_update = QPushButton("Update Chart")
        btn_update.clicked.connect(self.update_chart)

        controls_layout.addWidget(self.chart_type)
        controls_layout.addWidget(btn_update)

        # Create matplotlib figure
        self.figure = Figure(figsize=(8, 6))
        self.canvas = FigureCanvas(self.figure)

        # Add widgets to layout
        layout.addWidget(controls)
        layout.addWidget(self.canvas)

        # Initial chart
        self.update_chart()

    def update_chart(self):
        self.figure.clear()
        chart_type = self.chart_type.currentText()

        # Get data
        coins = self.db_manager.get_all_coins()
        df = pd.DataFrame([{
            'year': coin.year,
            'value': coin.current_value,
            'country': coin.country,
            'condition': coin.condition
        } for coin in coins])

        ax = self.figure.add_subplot(111)

        if chart_type == "Value Distribution":
            df['value'].hist(ax=ax, bins=20)
            ax.set_title("Collection Value Distribution")
            ax.set_xlabel("Value")
            ax.set_ylabel("Count")

        elif chart_type == "Country Distribution":
            df['country'].value_counts().plot(kind='pie', ax=ax)
            ax.set_title("Distribution by Country")

        elif chart_type == "Timeline":
            df.groupby('year')['value'].sum().plot(ax=ax)
            ax.set_title("Collection Value Over Time")
            ax.set_xlabel("Year")
            ax.set_ylabel("Total Value")

        elif chart_type == "Condition Analysis":
            df['condition'].value_counts().plot(kind='bar', ax=ax)
            ax.set_title("Condition Distribution")
            ax.set_xlabel("Condition")
            ax.set_ylabel("Count")

        self.canvas.draw()