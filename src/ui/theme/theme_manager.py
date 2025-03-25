from PySide6.QtCore import QObject, Signal
from enum import Enum
import json
import os

class Theme(Enum):
    LIGHT = "light"
    DARK = "dark"

class ThemeManager(QObject):
    theme_changed = Signal(str)  # Signal emitted when theme changes

    # Color schemes for light and dark modes
    THEMES = {
        "light": {
            "background": "#f5f5f5",
            "surface": "#ffffff",
            "text": "#000000",
            "text_secondary": "#666666",
            "accent": "#2196F3",
            "border": "#e0e0e0",
            "progress_bar": "#2196F3",
        },
        "dark": {
            "background": "#121212",
            "surface": "#1e1e1e",
            "text": "#ffffff",
            "text_secondary": "#b0b0b0",
            "accent": "#64B5F6",
            "border": "#333333",
            "progress_bar": "#64B5F6",  # Fixed missing # in hex color
        }
    }

    def __init__(self):
        super().__init__()
        self._current_theme = Theme.LIGHT  # Changed from current_theme to _current_theme
        self._load_saved_theme()

    def _load_saved_theme(self):
        # Load theme preference from settings file
        settings_path = os.path.join(os.path.expanduser("~"), ".coin_odyssey", "settings.json")
        try:
            if os.path.exists(settings_path):
                with open(settings_path, "r") as f:
                    settings = json.load(f)
                    saved_theme = settings.get("theme", "light")
                    self._current_theme = Theme(saved_theme)
        except Exception:
            self._current_theme = Theme.LIGHT

    def _save_theme(self):
        # Save theme preference to settings file
        settings_path = os.path.join(os.path.expanduser("~"), ".coin_odyssey", "settings.json")
        os.makedirs(os.path.dirname(settings_path), exist_ok=True)
        
        settings = {}
        if os.path.exists(settings_path):
            with open(settings_path, "r") as f:
                settings = json.load(f)
        
        settings["theme"] = self._current_theme.value
        
        with open(settings_path, "w") as f:
            json.dump(settings, f)

    def get_current_theme(self):
        return self._current_theme

    def toggle_theme(self):
        self._current_theme = Theme.DARK if self._current_theme == Theme.LIGHT else Theme.LIGHT
        self._save_theme()
        self.theme_changed.emit(self._current_theme.value)

    def get_color(self, color_key):
        return self.THEMES[self._current_theme.value][color_key]

    def get_stylesheet(self, widget_name):
        """Generate stylesheet for specific widgets"""
        if widget_name == "frame":
            return f"""
                background-color: {self.get_color('surface')};
                color: {self.get_color('text')};
                border-radius: 10px;
                padding: 15px;
            """
        elif widget_name == "progress_bar":
            return f"""
                QProgressBar {{
                    background-color: {self.get_color('border')};
                    border-radius: 5px;
                    text-align: center;
                }}
                QProgressBar::chunk {{
                    background-color: {self.get_color('progress_bar')};
                    border-radius: 5px;
                }}
            """