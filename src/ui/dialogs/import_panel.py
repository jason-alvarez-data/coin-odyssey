from PySide6.QtWidgets import (QWidget, QVBoxLayout, QLabel, QPushButton,
                              QFileDialog, QProgressBar, QTextEdit, QHBoxLayout)
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
        self.setFixedWidth(400)
        self.setStyleSheet(f"""
            background-color: {self.theme_manager.get_color('surface')};
            border-right: 1px solid {self.theme_manager.get_color('border')};
        """)
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(20)
        
        # Header
        header_layout = QHBoxLayout()
        title_label = QLabel("Import Collection")
        title_label.setFont(QFont("", 16, QFont.Bold))
        title_label.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")
        
        close_btn = QPushButton("×")
        close_btn.setFixedSize(30, 30)
        close_btn.clicked.connect(self.closeRequested.emit)
        close_btn.setStyleSheet(f"""
            QPushButton {{
                border: none;
                color: {self.theme_manager.get_color('text')};
                font-size: 20px;
            }}
            QPushButton:hover {{
                background-color: {self.theme_manager.get_color('border')};
                border-radius: 15px;
            }}
        """)
        
        header_layout.addWidget(title_label)
        header_layout.addWidget(close_btn)
        layout.addLayout(header_layout)
        
        # Instructions
        instructions = QLabel(
            "Import your coin collection from a CSV file.\n\n"
            "Required columns:\n"
            "- Title\n"
            "- Year\n"
            "Optional columns:\n"
            "- Country\n"
            "- Denomination\n"
            "- Mint Mark\n"
            "- Condition\n"
            "- Purchase Price\n"
            "- Current Value\n"
            "- Purchase Date"
        )
        instructions.setWordWrap(True)
        instructions.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")
        layout.addWidget(instructions)
        
        # Select file button
        self.select_file_btn = QPushButton("Select CSV File")
        self.select_file_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {self.theme_manager.get_color('accent')};
                color: white;
                border: none;
                padding: 12px;
                border-radius: 4px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                background-color: {self.theme_manager.get_color('accent')}dd;
            }}
        """)
        self.select_file_btn.clicked.connect(self.select_file)
        layout.addWidget(self.select_file_btn)
        
        # Progress bar
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        self.progress_bar.setStyleSheet(f"""
            QProgressBar {{
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 4px;
                text-align: center;
            }}
            QProgressBar::chunk {{
                background-color: {self.theme_manager.get_color('accent')};
            }}
        """)
        layout.addWidget(self.progress_bar)
        
        # Status text
        self.status_text = QTextEdit()
        self.status_text.setReadOnly(True)
        self.status_text.setVisible(False)
        self.status_text.setStyleSheet(f"""
            QTextEdit {{
                background-color: {self.theme_manager.get_color('background')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 4px;
            }}
        """)
        layout.addWidget(self.status_text)
        
        layout.addStretch()
    
    def select_file(self):
        file_name, _ = QFileDialog.getOpenFileName(
            self,
            "Select Collection CSV File",
            "",
            "CSV Files (*.csv);;All Files (*)"
        )
        
        if file_name:
            self.import_collection(file_name)
    
    def import_collection(self, file_path):
        try:
            with open(file_path, 'r', newline='') as file:
                reader = csv.DictReader(file)
                coins_data = list(reader)
                
                self.progress_bar.setVisible(True)
                self.progress_bar.setMaximum(len(coins_data))
                self.progress_bar.setValue(0)
                
                self.status_text.setVisible(True)
                self.status_text.clear()
                
                success_count, error_count, error_messages = self.db_manager.import_coins(coins_data)
                
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