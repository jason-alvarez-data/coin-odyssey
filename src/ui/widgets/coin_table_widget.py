from PySide6.QtWidgets import QTableView
from PySide6.QtCore import Qt, QAbstractTableModel, QModelIndex
from PySide6.QtGui import QColor

class CoinTableModel(QAbstractTableModel):
    def __init__(self, db_manager):
        super().__init__()
        self.db_manager = db_manager
        self.coins = []
        self.filtered_coins = []
        self.headers = ['Title', 'Year', 'Country', 'Denomination', 
                       'Mint Mark', 'Condition', 'Purchase Price', 'Current Value']
        self.refresh_data()
    
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
            elif col == 3: return coin.denomination
            elif col == 4: return coin.mint_mark
            elif col == 5: return coin.condition
            elif col == 6: return f"${coin.purchase_price:.2f}"
            elif col == 7: return f"${coin.current_value:.2f}"
        
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

class CoinTableWidget(QTableView):
    def __init__(self, db_manager):
        super().__init__()
        self.db_manager = db_manager
        self.setup_ui()
    
    def setup_ui(self):
        # Set up the model
        self.model = CoinTableModel(self.db_manager)
        self.setModel(self.model)
        
        # Configure the table
        self.setAlternatingRowColors(True)
        self.setSelectionBehavior(QTableView.SelectRows)
        self.setSelectionMode(QTableView.SingleSelection)
        self.setSortingEnabled(True)
        
        # Set column widths
        self.horizontalHeader().setStretchLastSection(True)
        for i in range(self.model.columnCount()):
            self.setColumnWidth(i, 120)
    
    def refresh_data(self):
        self.model.refresh_data()

    def apply_filters(self, search_text, search_field, condition, value_range):
        """Pass filter parameters to the model"""
        self.model.apply_filters(search_text, search_field, condition, value_range)