from PySide6.QtWidgets import (QWidget, QVBoxLayout, QFormLayout, 
                              QLineEdit, QDateEdit, QDoubleSpinBox,
                              QPushButton, QComboBox, QSpinBox,
                              QGroupBox, QHBoxLayout, QLabel,
                              QFileDialog, QFrame)
from PySide6.QtCore import Qt, QDate, Signal, QPropertyAnimation, QEasingCurve
from PySide6.QtGui import QPixmap, QFont
import os
import shutil

class AddCoinPanel(QWidget):
    coinAdded = Signal()  # Signal to emit when a coin is added
    closeRequested = Signal()  # Signal to emit when panel should close

    def __init__(self, db_manager, theme_manager, parent=None):
        super().__init__(parent)
        self.db_manager = db_manager
        self.theme_manager = theme_manager
        self.setup_ui()
        
    def setup_ui(self):
        self.setFixedWidth(400)  # Match the sidebar width
        self.setStyleSheet(f"""
            background-color: {self.theme_manager.get_color('surface')};
            border-right: 1px solid {self.theme_manager.get_color('border')};
        """)
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(20)
        
        # Add header with close button
        header_layout = QHBoxLayout()
        title_label = QLabel("Add New Coin")
        title_label.setFont(QFont("", 16, QFont.Bold))
        title_label.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")
        
        close_btn = QPushButton("×")  # Unicode × symbol
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
        
        # Create form layout
        form_layout = QFormLayout()
        form_layout.setSpacing(10)
        
        # Style for input widgets
        input_style = f"""
            QLineEdit, QSpinBox, QDoubleSpinBox, QDateEdit, QComboBox {{
                background-color: {self.theme_manager.get_color('background')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                padding: 8px;
                border-radius: 4px;
            }}
            QLineEdit:focus, QSpinBox:focus, QDoubleSpinBox:focus, 
            QDateEdit:focus, QComboBox:focus {{
                border: 2px solid {self.theme_manager.get_color('accent')};
            }}
        """
        
        # Create form fields
        self.title_edit = QLineEdit()
        self.year_spin = QSpinBox()
        self.year_spin.setRange(1, 9999)
        self.year_spin.setValue(2024)
        self.country_edit = QLineEdit()
        self.denomination_edit = QLineEdit()
        self.mint_mark_edit = QLineEdit()
        
        self.condition_combo = QComboBox()
        self.condition_combo.addItems(["Uncirculated", "AU", "XF", "VF", "F", "VG", "G", "AG", "Poor"])
        
        self.grading_edit = QLineEdit()
        self.purchase_date = QDateEdit()
        self.purchase_date.setDate(QDate.currentDate())
        self.purchase_date.setCalendarPopup(True)
        
        self.purchase_price = QDoubleSpinBox()
        self.purchase_price.setRange(0, 999999.99)
        self.purchase_price.setPrefix("$")
        self.purchase_price.setDecimals(2)
        
        self.current_value = QDoubleSpinBox()
        self.current_value.setRange(0, 999999.99)
        self.current_value.setPrefix("$")
        self.current_value.setDecimals(2)
        
        # Apply styles to all input widgets
        for widget in [self.title_edit, self.year_spin, self.country_edit,
                      self.denomination_edit, self.mint_mark_edit, self.condition_combo,
                      self.grading_edit, self.purchase_date, self.purchase_price,
                      self.current_value]:
            widget.setStyleSheet(input_style)
        
        # Add fields to form layout
        form_layout.addRow("Title:", self.title_edit)
        form_layout.addRow("Year:", self.year_spin)
        form_layout.addRow("Country:", self.country_edit)
        form_layout.addRow("Denomination:", self.denomination_edit)
        form_layout.addRow("Mint Mark:", self.mint_mark_edit)
        form_layout.addRow("Condition:", self.condition_combo)
        form_layout.addRow("Grading:", self.grading_edit)
        form_layout.addRow("Purchase Date:", self.purchase_date)
        form_layout.addRow("Purchase Price:", self.purchase_price)
        form_layout.addRow("Current Value:", self.current_value)
        
        layout.addLayout(form_layout)

        # Add image upload section
        images_group = QGroupBox("Coin Images")
        images_group.setStyleSheet(f"""
            QGroupBox {{
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 4px;
                margin-top: 1ex;
                padding: 10px;
            }}
            QGroupBox::title {{
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 3px;
            }}
        """)
        
        images_layout = QHBoxLayout(images_group)
        images_layout.setSpacing(10)
        
        # Obverse image container
        obverse_container = QFrame()
        obverse_container.setStyleSheet(f"""
            QFrame {{
                border: 2px dashed {self.theme_manager.get_color('border')};
                border-radius: 4px;
                padding: 8px;
                background-color: {self.theme_manager.get_color('background')};
            }}
        """)
        obverse_layout = QVBoxLayout(obverse_container)
        
        self.obverse_label = QLabel("No image")
        self.obverse_label.setFixedSize(120, 120)
        self.obverse_label.setAlignment(Qt.AlignCenter)
        self.obverse_label.setStyleSheet(f"color: {self.theme_manager.get_color('text_secondary')};")
        
        obverse_btn = QPushButton("Upload Obverse")
        obverse_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {self.theme_manager.get_color('surface')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                padding: 8px;
                border-radius: 4px;
            }}
            QPushButton:hover {{
                background-color: {self.theme_manager.get_color('border')};
            }}
        """)
        obverse_btn.clicked.connect(lambda: self.add_image('obverse'))
        
        obverse_layout.addWidget(self.obverse_label, alignment=Qt.AlignCenter)
        obverse_layout.addWidget(obverse_btn)
        
        # Reverse image container
        reverse_container = QFrame()
        reverse_container.setStyleSheet(f"""
            QFrame {{
                border: 2px dashed {self.theme_manager.get_color('border')};
                border-radius: 4px;
                padding: 8px;
                background-color: {self.theme_manager.get_color('background')};
            }}
        """)
        reverse_layout = QVBoxLayout(reverse_container)
        
        self.reverse_label = QLabel("No image")
        self.reverse_label.setFixedSize(120, 120)
        self.reverse_label.setAlignment(Qt.AlignCenter)
        self.reverse_label.setStyleSheet(f"color: {self.theme_manager.get_color('text_secondary')};")
        
        reverse_btn = QPushButton("Upload Reverse")
        reverse_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {self.theme_manager.get_color('surface')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                padding: 8px;
                border-radius: 4px;
            }}
            QPushButton:hover {{
                background-color: {self.theme_manager.get_color('border')};
            }}
        """)
        reverse_btn.clicked.connect(lambda: self.add_image('reverse'))
        
        reverse_layout.addWidget(self.reverse_label, alignment=Qt.AlignCenter)
        reverse_layout.addWidget(reverse_btn)
        
        # Add both containers to the images layout
        images_layout.addWidget(obverse_container)
        images_layout.addWidget(reverse_container)
        
        layout.addWidget(images_group)
        
        # Add save button
        save_btn = QPushButton("Save Coin")
        save_btn.setStyleSheet(f"""
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
        save_btn.clicked.connect(self.save_coin)
        layout.addWidget(save_btn)
        
        # Add stretch to push everything up
        layout.addStretch()

    def add_image(self, image_type):
        file_name, _ = QFileDialog.getOpenFileName(
            self,
            f"Select {image_type.capitalize()} Image",
            "",
            "Image Files (*.png *.jpg *.jpeg)"
        )
        if file_name:
            # Create images directory if it doesn't exist
            os.makedirs('images', exist_ok=True)

            # Generate new file name and copy image
            new_file_name = f"{image_type}_{os.path.basename(file_name)}"
            destination = os.path.join('images', new_file_name)
            shutil.copy2(file_name, destination)

            # Store image path
            if not hasattr(self, 'image_paths'):
                self.image_paths = {}
            self.image_paths[image_type] = destination

            # Update label with image
            label = self.obverse_label if image_type == 'obverse' else self.reverse_label
            pixmap = QPixmap(destination)
            scaled_pixmap = pixmap.scaled(120, 120, Qt.KeepAspectRatio, Qt.SmoothTransformation)
            label.setPixmap(scaled_pixmap)
            label.setStyleSheet("")  # Remove the "No image" styling

    def save_coin(self):
        # Collect data from form
        coin_data = {
            'title': self.title_edit.text(),
            'year': self.year_spin.value(),
            'country': self.country_edit.text(),
            'denomination': self.denomination_edit.text(),
            'mint_mark': self.mint_mark_edit.text(),
            'condition': self.condition_combo.currentText(),
            'grading': self.grading_edit.text(),
            'purchase_date': self.purchase_date.date().toPython(),
            'purchase_price': self.purchase_price.value(),
            'current_value': self.current_value.value()
        }
        
        # Save to database and get the coin_id
        coin_id = self.db_manager.add_coin(coin_data)

        # Save images if they exist
        if hasattr(self, 'image_paths'):
            for image_type, image_path in self.image_paths.items():
                image_data = {
                    'coin_id': coin_id,
                    'image_path': image_path,
                    'image_type': image_type
                }
                self.db_manager.add_coin_image(image_data)

        self.coinAdded.emit()
        self.closeRequested.emit()