from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
                              QLabel, QLineEdit, QSpinBox, QFrame, QScrollArea)
from PySide6.QtCore import Signal

class GoalsWidget(QWidget):
    goalsUpdated = Signal()

    def __init__(self, db_manager, theme_manager):
        super().__init__()
        self.db_manager = db_manager
        self.theme_manager = theme_manager
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(20)

        # Header with title and add button
        header_layout = QHBoxLayout()
        title = QLabel("Collection Goals")
        title.setStyleSheet(f"""
            color: {self.theme_manager.get_color('text')};
            font-size: 24px;
            font-weight: bold;
        """)
        
        add_btn = QPushButton("Add New Goal")
        add_btn.setFixedWidth(120)  # Fixed width for consistency
        add_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {self.theme_manager.get_color('accent')};
                color: white;
                border: none;
                padding: 8px;
                border-radius: 4px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                background-color: {self.theme_manager.get_color('accent')}dd;
            }}
        """)
        add_btn.clicked.connect(lambda: self.add_goal_widget())
        
        header_layout.addWidget(title)
        header_layout.addStretch()
        header_layout.addWidget(add_btn)
        layout.addLayout(header_layout)

        # Goals list in a scroll area with proper styling
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet(f"""
            QScrollArea {{
                border: none;
                background-color: {self.theme_manager.get_color('background')};
            }}
            QScrollBar:vertical {{
                border: none;
                background: {self.theme_manager.get_color('background')};
                width: 10px;
                margin: 0;
            }}
            QScrollBar::handle:vertical {{
                background: {self.theme_manager.get_color('border')};
                border-radius: 5px;
                min-height: 20px;
            }}
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
                border: none;
                background: none;
            }}
        """)
        
        goals_widget = QWidget()
        goals_widget.setStyleSheet(f"background-color: {self.theme_manager.get_color('background')};")
        self.goals_layout = QVBoxLayout(goals_widget)
        self.goals_layout.setSpacing(15)
        self.goals_layout.setContentsMargins(0, 0, 0, 0)
        scroll.setWidget(goals_widget)
        layout.addWidget(scroll)

        # Load existing goals
        self.load_goals()

    def add_goal_widget(self, title="", description="", target=0):
        goal_frame = QFrame()
        goal_frame.setStyleSheet(f"""
            QFrame {{
                background-color: {self.theme_manager.get_color('surface')};
                border: 1px solid {self.theme_manager.get_color('border')};
                border-radius: 8px;
            }}
        """)

        goal_layout = QVBoxLayout(goal_frame)
        goal_layout.setSpacing(15)
        goal_layout.setContentsMargins(20, 20, 20, 20)

        # Title input with better styling
        title_edit = QLineEdit(title)
        title_edit.setPlaceholderText("Enter goal title")
        title_edit.setMinimumHeight(35)
        title_edit.setStyleSheet(f"""
            QLineEdit {{
                background-color: {self.theme_manager.get_color('background')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 14px;
            }}
            QLineEdit:focus {{
                border: 2px solid {self.theme_manager.get_color('accent')};
            }}
        """)
        title_edit.textChanged.connect(lambda: self.save_goals())

        # Description input
        desc_edit = QLineEdit(description)
        desc_edit.setPlaceholderText("Enter goal description")
        desc_edit.setMinimumHeight(35)
        desc_edit.setStyleSheet(title_edit.styleSheet())
        desc_edit.textChanged.connect(lambda: self.save_goals())

        # Target input with improved layout
        target_layout = QHBoxLayout()
        target_label = QLabel("Target:")
        target_label.setStyleSheet(f"""
            color: {self.theme_manager.get_color('text')};
            font-size: 14px;
        """)
        target_spin = QSpinBox()
        target_spin.setValue(target)

        target_spin.setMaximum(1000)
        target_spin.setMinimumHeight(35)
        target_spin.setStyleSheet(f"""
            QSpinBox {{
                background-color: {self.theme_manager.get_color('background')};
                color: {self.theme_manager.get_color('text')};
                border: 1px solid {self.theme_manager.get_color('border')};
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 14px;
                min-width: 80px;
            }}
            QSpinBox:focus {{
                border: 2px solid {self.theme_manager.get_color('accent')};
            }}
        """)
        target_spin.valueChanged.connect(lambda: self.save_goals())
        target_layout.addWidget(target_label)
        target_layout.addWidget(target_spin)
        target_layout.addStretch()

        # Buttons layout
        buttons_layout = QHBoxLayout()
        
        # Save button
        save_btn = QPushButton("Save")
        save_btn.setMinimumHeight(35)
        save_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {self.theme_manager.get_color('accent')};
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-weight: bold;
                min-width: 80px;
            }}
            QPushButton:hover {{
                background-color: {self.theme_manager.get_color('accent')}dd;
            }}
        """)
        save_btn.clicked.connect(lambda: self.save_goals())

        # Delete button
        delete_btn = QPushButton("Delete")
        delete_btn.setMinimumHeight(35)
        delete_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: #ff4444;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-weight: bold;
                min-width: 80px;
            }}
            QPushButton:hover {{
                background-color: #ff6666;
            }}
        """)
        delete_btn.clicked.connect(lambda: self.delete_goal(goal_frame))

        buttons_layout.addWidget(save_btn)
        buttons_layout.addWidget(delete_btn)
        buttons_layout.addStretch()

        # Add all widgets to layout
        goal_layout.addWidget(title_edit)
        goal_layout.addWidget(desc_edit)
        goal_layout.addLayout(target_layout)
        goal_layout.addLayout(buttons_layout)

        self.goals_layout.addWidget(goal_frame)
        return goal_frame

    def save_goals(self):
        goals = []
        for i in range(self.goals_layout.count()):
            widget = self.goals_layout.itemAt(i).widget()
            if widget:
                title_edit = widget.findChild(QLineEdit)
                if title_edit and title_edit.text():  # Only save if title is not empty
                    description = widget.findChildren(QLineEdit)[1].text()
                    target = widget.findChild(QSpinBox).value()
                    goals.append({
                        'title': title_edit.text(),
                        'description': description,
                        'target': target
                    })
        
        try:
            self.db_manager.save_goals(goals)
            self.goalsUpdated.emit()
        except Exception as e:
            print(f"Error saving goals: {e}")

    def delete_goal(self, goal_widget):
        """Delete a goal widget and update database"""
        # Remove from layout and delete
        index = self.goals_layout.indexOf(goal_widget)
        if index >= 0:
            item = self.goals_layout.takeAt(index)
            if item.widget():
                item.widget().deleteLater()
            # Update database after removal
            self.save_goals()

    def load_goals(self):
        try:
            goals = self.db_manager.get_goals()
            for goal in goals:
                self.add_goal_widget(
                    title=goal['title'],
                    description=goal['description'],
                    target=goal['target']
                )
        except Exception as e:
            print(f"Error loading goals: {e}")

    def update_theme(self):
        # Update header title
        for label in self.findChildren(QLabel):
            if label.text() == "Collection Goals":
                label.setStyleSheet(f"""
                    color: {self.theme_manager.get_color('text')};
                    font-size: 24px;
                    font-weight: bold;
                """)
            elif label.text() == "Target:":
                label.setStyleSheet(f"""
                    color: {self.theme_manager.get_color('text')};
                    font-size: 14px;
                """)

        # Update add button
        add_btn = self.findChild(QPushButton, "")
        if add_btn and add_btn.text() == "Add New Goal":
            add_btn.setStyleSheet(f"""
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

        # Update existing goal widgets
        for i in range(self.goals_layout.count()):
            widget = self.goals_layout.itemAt(i).widget()
            if widget:
                widget.setStyleSheet(f"""
                    QFrame {{
                        background-color: {self.theme_manager.get_color('background')};
                        border: 1px solid {self.theme_manager.get_color('border')};
                        border-radius: 8px;
                        padding: 15px;
                    }}
                """)
                
                # Update input fields
                for line_edit in widget.findChildren(QLineEdit):
                    line_edit.setStyleSheet(f"""
                        QLineEdit {{
                            background-color: {self.theme_manager.get_color('surface')};
                            color: {self.theme_manager.get_color('text')};
                            border: 1px solid {self.theme_manager.get_color('border')};
                            padding: 8px;
                            border-radius: 4px;
                        }}
                        QLineEdit:focus {{
                            border: 2px solid {self.theme_manager.get_color('accent')};
                        }}
                    """)
                
                for spin_box in widget.findChildren(QSpinBox):
                    spin_box.setStyleSheet(f"""
                        QSpinBox {{
                            background-color: {self.theme_manager.get_color('surface')};
                            color: {self.theme_manager.get_color('text')};
                            border: 1px solid {self.theme_manager.get_color('border')};
                            padding: 8px;
                            border-radius: 4px;
                        }}
                        QSpinBox:focus {{
                            border: 2px solid {self.theme_manager.get_color('accent')};
                        }}
                    """)
                
                # Update buttons
                for btn in widget.findChildren(QPushButton):
                    if btn.text() == "Save":
                        btn.setStyleSheet(f"""
                            QPushButton {{
                                background-color: {self.theme_manager.get_color('accent')};
                                color: white;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 4px;
                                font-weight: bold;
                                min-width: 80px;
                            }}
                            QPushButton:hover {{
                                background-color: {self.theme_manager.get_color('accent')}dd;
                            }}
                        """)
                    elif btn.text() == "Delete":
                        btn.setStyleSheet(f"""
                            QPushButton {{
                                background-color: #ff4444;
                                color: white;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 4px;
                                font-weight: bold;
                                min-width: 80px;
                            }}
                            QPushButton:hover {{
                                background-color: #ff6666;
                            }}
                        """)