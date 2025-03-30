from PySide6.QtWidgets import (QWidget, QVBoxLayout, QFormLayout, QLineEdit,
                              QPushButton, QComboBox, QSpinBox, QDoubleSpinBox,
                              QGroupBox, QHBoxLayout, QLabel, QFileDialog, QFrame)
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QPixmap, QFont
import os
import shutil

class AddCoinPanel(QWidget):
    coinAdded = Signal()
    closeRequested = Signal()

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
        
        # Add header with close button
        header_layout = QHBoxLayout()
        title_label = QLabel("Add New Coin")
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
        
        # Create form layout
        form_layout = QFormLayout()
        form_layout.setSpacing(10)
        
        # Style for input widgets
        input_style = f"""
            QLineEdit, QSpinBox, QDoubleSpinBox, QComboBox {{
                background-color: {self.theme_manager.get_color('background')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                padding: 8px;
                border-radius: 4px;
            }}
            QLineEdit:focus, QSpinBox:focus, QDoubleSpinBox:focus, QComboBox:focus {{
                border: 2px solid {self.theme_manager.get_color('accent')};
            }}
        """
        
        # Basic Information
        self.title_edit = QLineEdit()
        self.year_spin = QSpinBox()
        self.year_spin.setRange(1, 9999)
        self.year_spin.setValue(2024)
        self.country_edit = QLineEdit()
        
        # Value and Unit
        self.value_spin = QDoubleSpinBox()
        self.value_spin.setRange(0, 999999.99)
        self.value_spin.setDecimals(2)
        
        self.unit_combo = QComboBox()
        self.unit_combo.addItems(["Cent", "Dollar", "Euro", "Peso", "CAD", "Other"])
        
        # Mint Information
        self.mint_edit = QLineEdit()
        self.mint_mark_edit = QLineEdit()
        
        # Type and Format
        self.type_combo = QComboBox()
        self.type_combo.addItems(["Regular Issue", "Commemorative", "Bullion"])
        
        self.format_combo = QComboBox()
        self.format_combo.addItems(["Single", "Proof", "Set"])
        
        # Additional Details
        self.series_edit = QLineEdit()
        self.region_combo = QComboBox()
        self.region_combo.addItems(["Americas", "Europe", "Asia", "Africa", "Oceania"])
        
        self.storage_combo = QComboBox()
        self.storage_combo.addItems([
            "Clear Coin Bin", 
            "State Collection Volume 1",
            "State Collection Volume 2",
            "American Women Album",
            "America the Beautiful Map",
            "Other"
        ])
        
        self.status_combo = QComboBox()
        self.status_combo.addItems(["owned", "wanted", "ordered"])
        
        self.quantity_spin = QSpinBox()
        self.quantity_spin.setRange(1, 999)
        self.quantity_spin.setValue(1)
        
        # Apply styles to all input widgets
        for widget in [self.title_edit, self.year_spin, self.country_edit,
                      self.value_spin, self.unit_combo, self.mint_edit,
                      self.mint_mark_edit, self.type_combo, self.format_combo,
                      self.series_edit, self.region_combo, self.storage_combo,
                      self.status_combo, self.quantity_spin]:
            widget.setStyleSheet(input_style)
        
        # Add fields to form layout
        form_layout.addRow("Title:", self.title_edit)
        form_layout.addRow("Year:", self.year_spin)
        form_layout.addRow("Country:", self.country_edit)
        form_layout.addRow("Value:", self.value_spin)
        form_layout.addRow("Unit:", self.unit_combo)
        form_layout.addRow("Mint:", self.mint_edit)
        form_layout.addRow("Mint Mark:", self.mint_mark_edit)
        form_layout.addRow("Type:", self.type_combo)
        form_layout.addRow("Format:", self.format_combo)
        form_layout.addRow("Series:", self.series_edit)
        form_layout.addRow("Region:", self.region_combo)
        form_layout.addRow("Storage:", self.storage_combo)
        form_layout.addRow("Status:", self.status_combo)
        form_layout.addRow("Quantity:", self.quantity_spin)
        
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
            label.setStyleSheet("")

    def save_coin(self):
        # Collect data from form
        coin_data = {
            'title': self.title_edit.text(),
            'year': self.year_spin.value(),
            'country': self.country_edit.text(),
            'value': self.value_spin.value(),
            'unit': self.unit_combo.currentText(),
            'mint': self.mint_edit.text(),
            'mint_mark': self.mint_mark_edit.text(),
            'type': self.type_combo.currentText(),
            'format': self.format_combo.currentText(),
            'series': self.series_edit.text(),
            'region': self.region_combo.currentText(),
            'storage': self.storage_combo.currentText(),
            'status': self.status_combo.currentText(),
            'quantity': self.quantity_spin.value()
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