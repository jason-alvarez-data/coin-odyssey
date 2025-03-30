from sqlalchemy import create_engine, Column, Integer, String, Float, Date, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime

Base = declarative_base()

class Coin(Base):
    __tablename__ = 'coins'

    id = Column(Integer, primary_key=True)
    title = Column(String)
    year = Column(Integer)
    country = Column(String)
    value = Column(Float)  # New: separate numeric value (25, 1, etc.)
    unit = Column(String)  # New: separate unit (Cent, Euro, Peso, etc.)
    mint = Column(String)  # New: mint location
    mint_mark = Column(String)
    status = Column(String)  # Changed: owned/not owned status
    condition = Column(String)  # Kept separate from status
    type = Column(String)  # New: Regular Issue, Commemorative, Bullion, etc.
    series = Column(String)  # New: State Collection, American Women, etc.
    storage = Column(String)  # New: Clear Coin Bin, Album, etc.
    format = Column(String)  # New: Single, Proof, etc.
    region = Column(String)  # New: Americas, Europe, etc.
    quantity = Column(Integer, default=1)  # New: number of copies owned
    purchase_date = Column(Date, default=datetime.now().date())
    purchase_price = Column(Float)
    current_value = Column(Float)
    notes = Column(String)  # Keep for additional comments

    images = relationship("CoinImage", back_populates="coin", cascade="all, delete-orphan")

class CoinImage(Base):
    __tablename__ = 'coin_images'
    
    id = Column(Integer, primary_key=True)
    coin_id = Column(Integer, ForeignKey('coins.id'))
    image_path = Column(String, nullable=False)
    image_type = Column(String)  # 'obverse', 'reverse'
    
    coin = relationship("Coin", back_populates="images")