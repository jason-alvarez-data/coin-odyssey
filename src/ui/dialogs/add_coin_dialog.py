from PySide6.QtWidgets import (QDialog, QVBoxLayout, QFormLayout, 
                              QLineEdit, QDateEdit, QDoubleSpinBox,
                              QPushButton, QComboBox, QSpinBox)
from PySide6.QtCore import Qt, QDate

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
        
        # Add buttons
        button_layout = QVBoxLayout()
        save_button = QPushButton("Save")
        save_button.clicked.connect(self.save_coin)
        button_layout.addWidget(save_button)
        
        layout.addLayout(button_layout)
    
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
        
        # Save to database
        self.db_manager.add_coin(coin_data)
        self.accept()