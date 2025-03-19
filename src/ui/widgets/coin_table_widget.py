from PySide6.QtWidgets import QTableView
from PySide6.QtCore import Qt, QAbstractTableModel, QModelIndex
from PySide6.QtGui import QColor

class CoinTableModel(QAbstractTableModel):
    def __init__(self, db_manager):
        super().__init__()
        self.db_manager = db_manager
        self.coins = []
        self.headers = ['Title', 'Year', 'Country', 'Denomination', 
                       'Mint Mark', 'Condition', 'Purchase Price', 'Current Value']
        self.refresh_data()
    
    def refresh_data(self):
        self.coins = self.db_manager.get_all_coins()
        self.layoutChanged.emit()
    
    def rowCount(self, parent=QModelIndex()):
        return len(self.coins)
    
    def columnCount(self, parent=QModelIndex()):
        return len(self.headers)
    
    def data(self, index, role=Qt.DisplayRole):
        if not index.isValid():
            return None
            
        if role == Qt.DisplayRole:
            coin = self.coins[index.row()]
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