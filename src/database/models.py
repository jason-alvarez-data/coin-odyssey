from sqlalchemy import create_engine, Column, Integer, String, Float, Date, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime

Base = declarative_base()

class Coin(Base):
    __tablename__ = 'coins'

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    year = Column(Integer)
    country = Column(String)
    denomination = Column(String)
    mint_mark = Column(String)
    condition = Column(String)
    grading = Column(String)
    purchase_date = Column(Date, default=datetime.now().date())
    purchase_price = Column(Float)
    current_value = Column(Float)
    notes = Column(String)
    is_proof = Column(Boolean, default=False)

    images = relationship("CoinImage", back_populates="coin", cascade="all, delete-orphan")

class CoinImage(Base):
    __tablename__ = 'coin_images'
    
    id = Column(Integer, primary_key=True)
    coin_id = Column(Integer, ForeignKey('coins.id'))
    image_path = Column(String, nullable=False)
    image_type = Column(String)  # 'obverse', 'reverse'
    
    coin = relationship("Coin", back_populates="images")