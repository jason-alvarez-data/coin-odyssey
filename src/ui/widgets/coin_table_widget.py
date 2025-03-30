from PySide6.QtWidgets import QTableView, QWidget, QVBoxLayout
from PySide6.QtCore import Qt, QAbstractTableModel, QModelIndex
from PySide6.QtGui import QColor

class CoinTableModel(QAbstractTableModel):
    def __init__(self, db_manager, theme_manager):
        super().__init__()
        self.db_manager = db_manager
        self.theme_manager = theme_manager
        self.coins = self.db_manager.get_all_coins()
        self.filtered_coins = self.coins
        self.headers = ['Title', 'Year', 'Country', 'Value', 'Unit', 
                       'Mint', 'Mint Mark', 'Status', 'Type', 'Series',
                       'Storage', 'Format', 'Region', 'Quantity']
    
    def data(self, index, role):
        if role == Qt.BackgroundRole:
            return QColor(self.theme_manager.get_color('surface'))
        elif role == Qt.ForegroundRole:
            return QColor(self.theme_manager.get_color('text'))
    
    def refresh_data(self):
        self.coins = self.db_manager.get_all_coins()
        self.filtered_coins = self.coins.copy()
        self.layoutChanged.emit()
    
    def rowCount(self, parent=QModelIndex()):
        return len(self.filtered_coins)
    
    def columnCount(self, parent=QModelIndex()):
        return len(self.headers)
    
    def data(self, index, role=Qt.DisplayRole):
        if not index.isValid():
            return None
            
        if role == Qt.DisplayRole:
            coin = self.filtered_coins[index.row()]
            col = index.column()
            
            if col == 0: return coin.title
            elif col == 1: return str(coin.year)
            elif col == 2: return coin.country
            elif col == 3: return str(coin.value)
            elif col == 4: return coin.unit
            elif col == 5: return coin.mint
            elif col == 6: return coin.mint_mark
            elif col == 7: return coin.status
            elif col == 8: return coin.type
            elif col == 9: return coin.series
            elif col == 10: return coin.storage
            elif col == 11: return coin.format
            elif col == 12: return coin.region
            elif col == 13: return str(coin.quantity)
        
        elif role == Qt.BackgroundRole:
            return QColor(self.theme_manager.get_color('surface'))
        elif role == Qt.ForegroundRole:
            return QColor(self.theme_manager.get_color('text'))
            
        return None
    
    def headerData(self, section, orientation, role=Qt.DisplayRole):
        if orientation == Qt.Horizontal and role == Qt.DisplayRole:
            return self.headers[section]
        return None
    
    def apply_filters(self, search_text, search_field, condition, value_range):
        """Apply filters to the coin data"""
        self.filtered_coins = self.coins.copy()

        # Apply search filter
        if search_text:
            search_text = search_text.lower()
            if search_field == 'All Fields':
                self.filtered_coins = [
                    coin for coin in self.filtered_coins
                    if (search_text in str(coin.title).lower() or
                        search_text in str(coin.country).lower() or
                        search_text in str(coin.year).lower() or
                        search_text in str(coin.denomination).lower())
                ]
            else:
                field = search_field.lower()
                self.filtered_coins = [
                    coin for coin in self.filtered_coins
                    if search_text in str(getattr(coin, field)).lower()
                ]
        
        # Apply condition filter
        if condition:
            self.filtered_coins = [
                coin for coin in self.filtered_coins
                if coin.condition == condition
            ]

        # Apply value range filter
        if value_range:
            value_ranges = {
                'Under $10': (0, 10),
                '$10 - $50': (10, 50),
                '$50 - $100': (50, 100),
                '$100 - $500': (100, 500),
                'Over $500': (500, float('inf'))
            }

            if value_range in value_ranges:
                min_val, max_val = value_ranges[value_range]
                self.filtered_coins = [
                    coin for coin in self.filtered_coins
                    if min_val <= (coin.current_value or 0) <= max_val
                ]
        
        # Notify the view that the data has changed
        self.layoutChanged.emit()

class CoinTableWidget(QWidget):
    def __init__(self, db_manager, theme_manager):
        super().__init__()
        self.db_manager = db_manager
        self.theme_manager = theme_manager
        self.setup_ui()

        # Connect theme changes
        self.theme_manager.theme_changed.connect(self.update_theme)
    
    def setup_ui(self):
        layout = QVBoxLayout(self)

        # Create table view
        self.table_view = QTableView()
        self.model = CoinTableModel(self.db_manager, self.theme_manager)
        self.table_view.setModel(self.model)

        # style the table
        self.update_theme()

        # Add to layout
        layout.addWidget(self.table_view)

    def update_theme(self):
        self.table_view.setStyleSheet(f"""
            QTableView {{
                background-color: {self.theme_manager.get_color('surface')};
                color: {self.theme_manager.get_color('text')};
                border: none;
                gridline-color: {self.theme_manager.get_color('border')};
            }}
            QHeaderView::section {{
                background-color: {self.theme_manager.get_color('surface')};
                color: {self.theme_manager.get_color('text')};
                padding: 5pc;
                border: none;
                border-bottom: 1px solid {self.theme_manager.get_color('border')};
            }}
            QTableView::item:selected {{
                background-color: {self.theme_manager.get_color('accent')};
                color: white;
            }}
        """)

        # Force refresh of the table
        self.model.layoutChanged.emit()
    
    def refresh_data(self):
        self.model.coins = self.db_manager.get_all_coins()
        self.model.filtered_coins = self.model.coins
        self.model.layoutChanged.emit()

    def apply_filters(self, search_text=None, search_field=None, condition=None, value_range=None):
        self.model.apply_filters(search_text, search_field, condition, value_range)