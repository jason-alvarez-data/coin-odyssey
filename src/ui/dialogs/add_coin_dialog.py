from PySide6.QtWidgets import (QDialog, QVBoxLayout, QFormLayout, 
                              QLineEdit, QDateEdit, QDoubleSpinBox,
                              QPushButton, QComboBox, QSpinBox,
                              QGroupBox, QHBoxLayout, QLabel,
                              QFileDialog)
from PySide6.QtCore import Qt, QDate
from PySide6.QtGui import QPixmap
import os
import shutil

class AddCoinDialog(QDialog):
    def __init__(self, db_manager, parent=None):
        super().__init__(parent)
        self.db_manager = db_manager
        self.setup_ui()
        
    def setup_ui(self):
        self.setWindowTitle("Add New Coin")
        self.setMinimumWidth(400)
        
        layout = QVBoxLayout(self)
        form_layout = QFormLayout()
        
        # Create input fields
        self.title_edit = QLineEdit()
        self.year_spin = QSpinBox()
        self.year_spin.setRange(1, 9999)
        self.year_spin.setValue(2024)
        
        self.country_edit = QLineEdit()
        self.denomination_edit = QLineEdit()
        self.mint_mark_edit = QLineEdit()
        
        self.condition_combo = QComboBox()
        self.condition_combo.addItems([
            "Mint State (MS)",
            "About Uncirculated (AU)",
            "Extremely Fine (XF)",
            "Very Fine (VF)",
            "Fine (F)",
            "Very Good (VG)",
            "Good (G)",
            "Fair"
        ])
        
        self.grading_edit = QLineEdit()
        
        self.purchase_date = QDateEdit()
        self.purchase_date.setDate(QDate.currentDate())
        self.purchase_date.setCalendarPopup(True)
        
        self.purchase_price = QDoubleSpinBox()
        self.purchase_price.setRange(0, 1000000)
        self.purchase_price.setPrefix("$")
        self.purchase_price.setDecimals(2)
        
        self.current_value = QDoubleSpinBox()
        self.current_value.setRange(0, 1000000)
        self.current_value.setPrefix("$")
        self.current_value.setDecimals(2)

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
        
        # Add form layout to main layout
        layout.addLayout(form_layout)

        # Create image section
        image_group = QGroupBox("Coin Images")
        image_layout = QHBoxLayout(image_group)

        # Obverse (front) image section
        obverse_layout = QVBoxLayout()
        self.obverse_label = QLabel("No Image")
        self.obverse_label.setFixedSize(200, 200)
        self.obverse_label.setStyleSheet("border: 2px dashed #cccccc;")
        self.obverse_label.setAlignment(Qt.AlignCenter)
        btn_add_obverse = QPushButton("Add Obverse")
        btn_add_obverse.clicked.connect(lambda: self.add_image('obverse'))
        obverse_layout.addWidget(QLabel("Obverse (Front)"))
        obverse_layout.addWidget(self.obverse_label)
        obverse_layout.addWidget(btn_add_obverse)

        # Reverse (back) image section
        reverse_layout = QVBoxLayout()
        self.reverse_label = QLabel("No Image")
        self.reverse_label.setFixedSize(200, 200)
        self.reverse_label.setStyleSheet("border: 2px dashed #cccccc;")
        self.reverse_label.setAlignment(Qt.AlignCenter)
        btn_add_reverse = QPushButton("Add Reverse")
        btn_add_reverse.clicked.connect(lambda: self.add_image('reverse'))
        reverse_layout.addWidget(QLabel("Reverse (Back)"))
        reverse_layout.addWidget(self.reverse_label)
        reverse_layout.addWidget(btn_add_reverse)

        # Add both sections to image group
        image_layout.addLayout(obverse_layout)
        image_layout.addLayout(reverse_layout)

        # Add image group to main layout after form
        layout.addWidget(image_group)
        
        # Add buttons
        button_layout = QVBoxLayout()
        save_button = QPushButton("Save")
        save_button.clicked.connect(self.save_coin)
        button_layout.addWidget(save_button)
        
        layout.addLayout(button_layout)
    
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

            # Update label with image
            label = self.obverse_label if image_type == 'obverse' else self.reverse_label
            pixmap = QPixmap(destination)
            label.setPixmap(pixmap.scaled(200, 200, Qt.KeepAspectRatio, Qt.SmoothTransformation))

            # Store image path
            if not hasattr(self, 'image_paths'):
                self.image_paths = {}
            self.image_paths[image_type] = new_file_name
    
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
        coin_id = self.db_manager.add_coin(coin_data)  # Capture the returned id

        # Save images if they exist
        if hasattr(self, 'image_paths'):
            for image_type, image_path in self.image_paths.items():
                image_data = {
                    'coin_id': coin_id,
                    'image_path': image_path,
                    'image_type': image_type
                }
                self.db_manager.add_coin_image(image_data)

        self.accept()