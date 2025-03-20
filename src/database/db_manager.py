from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base, Coin, CoinImage
import os

class DatabaseManager:
    def __init__(self, db_path="coins.db"):
        self.engine = create_engine(f'sqlite:///{db_path}')
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

    def add_coin(self, coin_data):
        session = self.Session()
        try:
            coin = Coin(**coin_data)
            session.add(coin)
            session.commit()
            return coin.id
        finally:
            session.close()

    def get_all_coins(self):
        session = self.Session()
        try:
            return session.query(Coin).all()
        finally:
            session.close()

    def get_coin_by_id(self, coin_id):
        session = self.Session()
        try:
            return session.query(Coin).filter(Coin.id == coin_id).first()
        finally:
            session.close()

    def add_coin_image(self, image_data):
        """
        Add a coin image to the database

        Args:
            image_data (dict): Dictionary containing:
                - coin_id: ID of the coin
                - image_path: Path to the image file
                - image_type: Type of image('obverse' or 'reverse')
        """
        session = self.Session()
        try:
            image = CoinImage(**image_data)
            session.add(image)
            session.commit()
            return image.id
        finally:
            session.close()