from sqlalchemy import create_engine, Column, Integer, String, Date, Float, ForeignKey
from sqlalchemy.orm import sessionmaker
try:
    from .models import Base, Coin, CoinImage
except ImportError:
    from models import Base, Coin, CoinImage
from datetime import datetime
import os

class DatabaseManager:
    def __init__(self, db_path="coins.db"):
        # Create database directory if it doesn't exist
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir)
            
        self.engine = create_engine(f'sqlite:///{db_path}')
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

    def add_coin(self, coin_data):
        """
        Add a new coin to the database
        
        Args:
            coin_data (dict): Dictionary containing coin information
        Returns:
            int: ID of the newly created coin
        """
        session = self.Session()
        try:
            # Convert empty strings to None
            for key, value in coin_data.items():
                if isinstance(value, str) and value.strip() == '':
                    coin_data[key] = None
                    
            # Handle purchase date
            if 'purchase_date' in coin_data and isinstance(coin_data['purchase_date'], str):
                try:
                    coin_data['purchase_date'] = datetime.strptime(coin_data['purchase_date'], '%Y-%m-%d').date()
                except ValueError:
                    coin_data['purchase_date'] = None

            coin = Coin(**coin_data)
            session.add(coin)
            session.commit()
            return coin.id
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def get_all_coins(self):
        """Get all coins from the database"""
        session = self.Session()
        try:
            return session.query(Coin).all()
        finally:
            session.close()

    def get_coin_by_id(self, coin_id):
        """
        Retrieve a specific coin by its ID
        
        Args:
            coin_id (int): ID of the coin to retrieve
        Returns:
            Coin: Coin object if found, None otherwise
        """
        session = self.Session()
        try:
            return session.query(Coin).filter(Coin.id == coin_id).first()
        finally:
            session.close()

    def update_coin(self, coin_id, coin_data):
        """
        Update an existing coin's information
        
        Args:
            coin_id (int): ID of the coin to update
            coin_data (dict): Dictionary containing updated coin information
        Returns:
            bool: True if update successful, False otherwise
        """
        session = self.Session()
        try:
            coin = session.query(Coin).filter(Coin.id == coin_id).first()
            if coin:
                for key, value in coin_data.items():
                    setattr(coin, key, value)
                session.commit()
                return True
            return False
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def delete_coin(self, coin_id):
        """
        Delete a coin from the database
        
        Args:
            coin_id (int): ID of the coin to delete
        Returns:
            bool: True if deletion successful, False otherwise
        """
        session = self.Session()
        try:
            coin = session.query(Coin).filter(Coin.id == coin_id).first()
            if coin:
                session.delete(coin)
                session.commit()
                return True
            return False
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def import_coins(self, coins_data):
        """
        Import multiple coins from a list of dictionaries
        
        Args:
            coins_data (list): List of dictionaries containing coin data
        Returns:
            tuple: (success_count, error_count, error_messages)
        """
        session = self.Session()
        success_count = 0
        error_count = 0
        error_messages = []
        
        try:
            for coin_data in coins_data:
                try:
                    # Map the CSV columns exactly as they appear in your file
                    mapped_data = {
                        'title': coin_data.get('title', ''),
                        'year': int(coin_data.get('year', 0)) if coin_data.get('year') else None,
                        'country': coin_data.get('country', ''),
                        'value': float(coin_data.get('value', 0)) if coin_data.get('value') else None,
                        'unit': coin_data.get('unit', ''),
                        'mint': coin_data.get('mint', ''),  # From your 'mint' column
                        'mint_mark': coin_data.get('mintmark', ''),  # Note: your CSV uses 'mintmark'
                        'status': coin_data.get('status', ''),
                        'type': coin_data.get('type', ''),
                        'series': coin_data.get('series', ''),
                        'storage': coin_data.get('storage', ''),
                        'format': coin_data.get('format', ''),
                        'region': coin_data.get('region', ''),
                        'quantity': int(coin_data.get('quantity', 1))
                    }

                    # Print for debugging
                    print(f"Importing coin: {mapped_data['title']}")

                    # Clean up empty strings
                    for key, value in mapped_data.items():
                        if isinstance(value, str) and value.strip() == '':
                            mapped_data[key] = None
                    
                    coin = Coin(**mapped_data)
                    session.add(coin)
                    success_count += 1
                except Exception as e:
                    error_count += 1
                    error_messages.append(f"Error importing coin {coin_data.get('title', 'Unknown')}: {str(e)}")
                    print(f"Error on coin: {str(e)}")  # Print error for debugging
            
            session.commit()
            return success_count, error_count, error_messages
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def get_coin_images(self, coin_id):
        """
        Get all images associated with a coin
        
        Args:
            coin_id (int): ID of the coin
        Returns:
            list: List of CoinImage objects
        """
        session = self.Session()
        try:
            return session.query(CoinImage).filter(CoinImage.coin_id == coin_id).all()
        finally:
            session.close()