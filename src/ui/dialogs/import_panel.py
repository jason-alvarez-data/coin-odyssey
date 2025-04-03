from PySide6.QtWidgets import (QWidget, QVBoxLayout, QLabel, QPushButton,
                              QFileDialog, QProgressBar, QTextEdit, QHBoxLayout, 
                              QScrollArea, QSizePolicy)
from PySide6.QtCore import Signal, Qt
from PySide6.QtGui import QFont
import csv
import os

class ImportPanel(QWidget):
    importComplete = Signal()  # Signal to emit when import is done
    closeRequested = Signal()  # Signal to emit when panel should close
    
    def __init__(self, db_manager, theme_manager, parent=None):
        super().__init__(parent)
        self.db_manager = db_manager
        self.theme_manager = theme_manager
        self.setup_ui()
    
    def setup_ui(self):
        self.setFixedWidth(250)  # Match sidebar width
        self.setSizePolicy(QSizePolicy.Fixed, QSizePolicy.Expanding)  # Make it expand vertically
        
        # Main layout for the panel
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        
        # Create a scroll area to handle overflow
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)  # Disable horizontal scrolling
        scroll.setStyleSheet("""
            QScrollArea {
                border: none;
                background: transparent;
            }
            QScrollArea > QWidget > QWidget {
                background: transparent;
            }
        """)
        
        # Create main container widget
        container = QWidget()
        container.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        layout = QVBoxLayout(container)
        layout.setContentsMargins(15, 15, 15, 15)
        layout.setSpacing(10)
        
        # Title
        title = QLabel("Import Collection")
        title.setFont(QFont("", 16, QFont.Bold))
        title.setStyleSheet(f"color: {self.theme_manager.get_color('text')};")
        layout.addWidget(title)
        
        # Description
        description = QLabel("Import your coin collection from a CSV file.")
        description.setWordWrap(True)
        description.setStyleSheet(f"color: {self.theme_manager.get_color('text')};")
        layout.addWidget(description)
        
        # Required columns section
        required_label = QLabel("Required columns:")
        required_label.setStyleSheet(f"""
            color: {self.theme_manager.get_color('text')};
            font-weight: bold;
            margin-top: 10px;
        """)
        layout.addWidget(required_label)
        
        required_columns = QLabel("• Title\n• Year")
        required_columns.setStyleSheet(f"color: {self.theme_manager.get_color('text')};")
        layout.addWidget(required_columns)
        
        # Optional columns section
        optional_label = QLabel("Optional columns:")
        optional_label.setStyleSheet(f"""
            color: {self.theme_manager.get_color('text')};
            font-weight: bold;
            margin-top: 5px;
        """)
        layout.addWidget(optional_label)
        
        optional_columns = QLabel(
            "• Country\n"
            "• Denomination\n"
            "• Mint Mark\n"
            "• Condition\n"
            "• Purchase Price\n"
            "• Current Value\n"
            "• Purchase Date"
        )
        optional_columns.setStyleSheet(f"color: {self.theme_manager.get_color('text')};")
        layout.addWidget(optional_columns)
        
        # Add stretch before buttons to push them to the bottom
        layout.addStretch()
        
        # Select file button
        self.select_file_btn = QPushButton("Select CSV File")
        self.select_file_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {self.theme_manager.get_color('accent')};
                color: white;
                border: none;
                padding: 10px;
                border-radius: 4px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                background-color: {self.theme_manager.get_color('accent')}dd;
            }}
        """)
        self.select_file_btn.clicked.connect(self.select_file)
        layout.addWidget(self.select_file_btn)
        
        # Cancel button
        self.cancel_btn = QPushButton("Cancel")
        self.cancel_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: transparent;
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                padding: 10px;
                border-radius: 4px;
                margin-top: 8px;
            }}
            QPushButton:hover {{
                background-color: {self.theme_manager.get_color('border')};
            }}
        """)
        self.cancel_btn.clicked.connect(self.handle_cancel)
        layout.addWidget(self.cancel_btn)
        
        # Progress bar (initially hidden)
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        self.progress_bar.setStyleSheet(f"""
            QProgressBar {{
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 4px;
                text-align: center;
                height: 20px;
                margin-top: 8px;
            }}
            QProgressBar::chunk {{
                background-color: {self.theme_manager.get_color('accent')};
            }}
        """)
        layout.addWidget(self.progress_bar)
        
        # Status text (initially hidden)
        self.status_text = QTextEdit()
        self.status_text.setReadOnly(True)
        self.status_text.setVisible(False)
        self.status_text.setStyleSheet(f"""
            QTextEdit {{
                background-color: {self.theme_manager.get_color('background')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 4px;
                padding: 5px;
                margin-top: 8px;
                max-height: 100px;
            }}
        """)
        layout.addWidget(self.status_text)
        
        # Set the container as the scroll area widget
        scroll.setWidget(container)
        
        # Add scroll area to main layout with stretch factor
        main_layout.addWidget(scroll, 1)

    def select_file(self):
        """Open file dialog and select CSV file for import"""
        file_name, _ = QFileDialog.getOpenFileName(
            self,
            "Select Collection CSV File",
            "",
            "CSV Files (*.csv);;All Files (*)"
        )
        
        if file_name:
            self.import_collection(file_name)
    
    def import_collection(self, file_path):
        """Import collection from CSV file"""
        try:
            with open(file_path, 'r', newline='') as file:
                reader = csv.DictReader(file)
                coins_data = list(reader)
                
                # Show progress bar
                self.progress_bar.setVisible(True)
                self.progress_bar.setMaximum(len(coins_data))
                self.progress_bar.setValue(0)
                
                # Show status text
                self.status_text.setVisible(True)
                self.status_text.clear()
                
                # Import coins
                success_count, error_count, error_messages = self.db_manager.import_coins(coins_data)
                
                # Update progress bar
                self.progress_bar.setValue(len(coins_data))
                
                # Show results
                status = f"Import complete!\n\n"
                status += f"Successfully imported: {success_count} coins\n"
                if error_count > 0:
                    status += f"Errors: {error_count} coins\n\nError details:\n"
                    status += "\n".join(error_messages)
                
                self.status_text.setText(status)
                self.importComplete.emit()
                
        except Exception as e:
            self.status_text.setVisible(True)
            self.status_text.setText(f"Error reading file: {str(e)}")
    
    def update_theme(self):
        """Update the theme of the widget"""
        self.setStyleSheet(f"background-color: {self.theme_manager.get_color('surface')};")
        
        # Update all labels
        for label in self.findChildren(QLabel):
            label.setStyleSheet(f"color: {self.theme_manager.get_color('text')};")
        
        # Update select file button
        self.select_file_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {self.theme_manager.get_color('accent')};
                color: white;
                border: none;
                padding: 10px;
                border-radius: 4px;
                font-weight: bold;
                margin-top: 10px;
            }}
            QPushButton:hover {{
                background-color: {self.theme_manager.get_color('accent')}dd;
            }}
        """)
        
        # Update progress bar
        self.progress_bar.setStyleSheet(f"""
            QProgressBar {{
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 4px;
                text-align: center;
                height: 20px;
            }}
            QProgressBar::chunk {{
                background-color: {self.theme_manager.get_color('accent')};
            }}
        """)
        
        # Update status text
        self.status_text.setStyleSheet(f"""
            QTextEdit {{
                background-color: {self.theme_manager.get_color('background')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 4px;
                padding: 5px;
                max-height: 100px;
            }}
        """)

    def handle_cancel(self):
        """Handle cancel button click"""
        self.closeRequested.emit()  # Emit signal to restore sidebar
        self.deleteLater()  # Schedule this widget for deletion

    def select_file(self):
        """Open file dialog and select CSV file for import"""
        file_name, _ = QFileDialog.getOpenFileName(
            self,
            "Select Collection CSV File",
            "",
            "CSV Files (*.csv);;All Files (*)"
        )
        
        if file_name:
            self.import_collection(file_name)
    
    def import_collection(self, file_path):
        """Import collection from CSV file"""
        try:
            with open(file_path, 'r', newline='') as file:
                reader = csv.DictReader(file)
                coins_data = list(reader)
                
                # Show progress bar
                self.progress_bar.setVisible(True)
                self.progress_bar.setMaximum(len(coins_data))
                self.progress_bar.setValue(0)
                
                # Show status text
                self.status_text.setVisible(True)
                self.status_text.clear()
                
                # Import coins
                success_count, error_count, error_messages = self.db_manager.import_coins(coins_data)
                
                # Update progress bar
                self.progress_bar.setValue(len(coins_data))
                
                # Show results
                status = f"Import complete!\n\n"
                status += f"Successfully imported: {success_count} coins\n"
                if error_count > 0:
                    status += f"Errors: {error_count} coins\n\nError details:\n"
                    status += "\n".join(error_messages)
                
                self.status_text.setText(status)
                self.importComplete.emit()
                
        except Exception as e:
            self.status_text.setVisible(True)
            self.status_text.setText(f"Error reading file: {str(e)}")
    
    def update_theme(self):
        """Update the theme of the widget"""
        self.setStyleSheet(f"background-color: {self.theme_manager.get_color('surface')};")
        
        # Update all labels
        for label in self.findChildren(QLabel):
            label.setStyleSheet(f"color: {self.theme_manager.get_color('text')};")
        
        # Update select file button
        self.select_file_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {self.theme_manager.get_color('accent')};
                color: white;
                border: none;
                padding: 10px;
                border-radius: 4px;
                font-weight: bold;
                margin-top: 10px;
            }}
            QPushButton:hover {{
                background-color: {self.theme_manager.get_color('accent')}dd;
            }}
        """)
        
        # Update progress bar
        self.progress_bar.setStyleSheet(f"""
            QProgressBar {{
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 4px;
                text-align: center;
                height: 20px;
            }}
            QProgressBar::chunk {{
                background-color: {self.theme_manager.get_color('accent')};
            }}
        """)
        
        # Update status text
        self.status_text.setStyleSheet(f"""
            QTextEdit {{
                background-color: {self.theme_manager.get_color('background')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 4px;
                padding: 5px;
                max-height: 100px;
            }}
        """)

    def handle_cancel(self):
        """Handle cancel button click"""
        self.closeRequested.emit()  # Emit signal to restore sidebar
        self.deleteLater()  # Schedule this widget for deletion