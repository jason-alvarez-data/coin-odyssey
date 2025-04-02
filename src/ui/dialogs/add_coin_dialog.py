from PySide6.QtWidgets import (QWidget, QVBoxLayout, QFormLayout, QLineEdit,
                              QPushButton, QComboBox, QSpinBox, QDoubleSpinBox,
                              QGroupBox, QHBoxLayout, QLabel, QFileDialog, QFrame,
                              QGridLayout, QScrollArea)
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
        self.setFixedWidth(250)  # Match sidebar width
        self.setStyleSheet(f"""
            background-color: {self.theme_manager.get_color('surface')};
            border-right: 1px solid {self.theme_manager.get_color('border')};
        """)
        
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        
        # Header
        header = QWidget()
        header.setStyleSheet(f"""
            background-color: {self.theme_manager.get_color('surface')};
            border-bottom: 1px solid {self.theme_manager.get_color('border')};
        """)
        header_layout = QHBoxLayout(header)
        header_layout.setContentsMargins(10, 10, 10, 10)
        
        title_label = QLabel("Add New Coin")
        title_label.setFont(QFont("", 14, QFont.Bold))
        title_label.setStyleSheet(f"color: {self.theme_manager.get_color('text')}")
        
        close_btn = QPushButton("×")
        close_btn.setFixedSize(24, 24)
        close_btn.clicked.connect(self.closeRequested.emit)
        close_btn.setStyleSheet(f"""
            QPushButton {{
                border: none;
                color: {self.theme_manager.get_color('text')};
                font-size: 20px;
                background-color: transparent;
            }}
            QPushButton:hover {{
                background-color: {self.theme_manager.get_color('border')};
                border-radius: 12px;
            }}
        """)
        
        header_layout.addWidget(title_label)
        header_layout.addWidget(close_btn)
        main_layout.addWidget(header)

        # Scroll Area for content
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet("""
            QScrollArea {
                border: none;
            }
        """)
        
        content = QWidget()
        content_layout = QVBoxLayout(content)
        content_layout.setContentsMargins(10, 10, 10, 10)
        content_layout.setSpacing(10)
        
        # Style for input widgets
        input_style = f"""
            QLineEdit, QSpinBox, QDoubleSpinBox, QComboBox {{
                background-color: {self.theme_manager.get_color('background')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                padding: 3px;
                border-radius: 4px;
                min-height: 16px;
                max-height: 24px;
            }}
            QLineEdit:focus, QSpinBox:focus, QDoubleSpinBox:focus, QComboBox:focus {{
                border: 2px solid {self.theme_manager.get_color('accent')};
            }}
        """

        # Create form fields
        self.title_edit = QLineEdit()
        self.year_spin = QSpinBox()
        self.year_spin.setRange(1, 9999)
        self.year_spin.setValue(2024)
        self.country_edit = QLineEdit()
        self.value_spin = QDoubleSpinBox()
        self.value_spin.setRange(0, 999999.99)
        self.value_spin.setDecimals(2)
        self.unit_combo = QComboBox()
        self.unit_combo.addItems(["Cent", "Dollar", "Euro", "Peso", "CAD", "Other"])
        self.mint_edit = QLineEdit()
        self.mint_mark_edit = QLineEdit()
        self.type_combo = QComboBox()
        self.type_combo.addItems(["Regular Issue", "Commemorative", "Bullion"])
        self.format_combo = QComboBox()
        self.format_combo.addItems(["Single", "Proof", "Set"])
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

        # Apply styles
        for widget in [self.title_edit, self.year_spin, self.country_edit,
                      self.value_spin, self.unit_combo, self.mint_edit,
                      self.mint_mark_edit, self.type_combo, self.format_combo,
                      self.series_edit, self.region_combo, self.storage_combo,
                      self.status_combo, self.quantity_spin]:
            widget.setStyleSheet(input_style)

        # Create form layout
        form = QFormLayout()
        form.setSpacing(8)
        form.setContentsMargins(0, 0, 0, 0)
        
        # Add fields to form
        field_pairs = [
            ("Title:", self.title_edit),
            ("Year:", self.year_spin),
            ("Country:", self.country_edit),
            ("Value:", self.value_spin),
            ("Unit:", self.unit_combo),
            ("Mint:", self.mint_edit),
            ("Mark:", self.mint_mark_edit),
            ("Type:", self.type_combo),
            ("Format:", self.format_combo),
            ("Series:", self.series_edit),
            ("Region:", self.region_combo),
            ("Storage:", self.storage_combo),
            ("Status:", self.status_combo),
            ("Quantity:", self.quantity_spin)
        ]

        for label_text, widget in field_pairs:
            label = QLabel(label_text)
            label.setStyleSheet(f"color: {self.theme_manager.get_color('text')};")
            form.addRow(label, widget)

        content_layout.addLayout(form)

        # Images section
        images_group = QGroupBox("Coin Images")
        images_group.setStyleSheet(f"""
            QGroupBox {{
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 4px;
                margin-top: 1ex;
                padding: 5px;
            }}
            QGroupBox::title {{
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 3px;
            }}
        """)
        
        images_layout = QHBoxLayout(images_group)
        images_layout.setSpacing(8)
        images_layout.setContentsMargins(5, 5, 5, 5)

        for side in ['obverse', 'reverse']:
            container = QFrame()
            container.setStyleSheet(f"""
                QFrame {{
                    border: 2px dashed {self.theme_manager.get_color('border')};
                    border-radius: 4px;
                    padding: 5px;
                    background-color: {self.theme_manager.get_color('background')};
                }}
            """)
            container_layout = QVBoxLayout(container)
            container_layout.setSpacing(5)
            
            label = QLabel("No image")
            label.setFixedSize(80, 80)
            label.setAlignment(Qt.AlignCenter)
            label.setStyleSheet(f"color: {self.theme_manager.get_color('text_secondary')};")
            setattr(self, f"{side}_label", label)
            
            upload_btn = QPushButton(f"Upload {side.capitalize()}")
            upload_btn.setStyleSheet(f"""
                QPushButton {{
                    background-color: {self.theme_manager.get_color('surface')};
                    color: {self.theme_manager.get_color('text')};
                    border: 1px solid {self.theme_manager.get_color('border')};
                    padding: 4px;
                    border-radius: 4px;
                }}
                QPushButton:hover {{
                    background-color: {self.theme_manager.get_color('border')};
                }}
            """)
            upload_btn.clicked.connect(lambda s, side=side: self.add_image(side))
            
            container_layout.addWidget(label, alignment=Qt.AlignCenter)
            container_layout.addWidget(upload_btn)
            images_layout.addWidget(container)

        content_layout.addWidget(images_group)
        scroll.setWidget(content)
        main_layout.addWidget(scroll)

        # Button bar
        button_bar = QWidget()
        button_bar.setStyleSheet(f"""
            background-color: {self.theme_manager.get_color('surface')};
            border-top: 1px solid {self.theme_manager.get_color('border')};
        """)
        button_layout = QHBoxLayout(button_bar)
        button_layout.setContentsMargins(10, 10, 10, 10)
        button_layout.setSpacing(10)
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.closeRequested.emit)
        cancel_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {self.theme_manager.get_color('surface')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                padding: 6px 12px;
                border-radius: 4px;
            }}
            QPushButton:hover {{
                background-color: {self.theme_manager.get_color('border')};
            }}
        """)
        
        save_btn = QPushButton("Save Coin")
        save_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {self.theme_manager.get_color('accent')};
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                background-color: {self.theme_manager.get_color('accent')}dd;
            }}
        """)
        save_btn.clicked.connect(self.save_coin)
        
        button_layout.addWidget(cancel_btn)
        button_layout.addStretch()
        button_layout.addWidget(save_btn)
        main_layout.addWidget(button_bar)

    def add_image(self, image_type):
        file_name, _ = QFileDialog.getOpenFileName(
            self,
            f"Select {image_type.capitalize()} Image",
            "",
            "Image Files (*.png *.jpg *.jpeg)"
        )
        if file_name:
            os.makedirs('images', exist_ok=True)
            new_file_name = f"{image_type}_{os.path.basename(file_name)}"
            destination = os.path.join('images', new_file_name)
            shutil.copy2(file_name, destination)

            if not hasattr(self, 'image_paths'):
                self.image_paths = {}
            self.image_paths[image_type] = destination

            label = self.obverse_label if image_type == 'obverse' else self.reverse_label
            pixmap = QPixmap(destination)
            scaled_pixmap = pixmap.scaled(80, 80, Qt.KeepAspectRatio, Qt.SmoothTransformation)
            label.setPixmap(scaled_pixmap)
            label.setStyleSheet("")

    def save_coin(self):
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
        
        coin_id = self.db_manager.add_coin(coin_data)

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