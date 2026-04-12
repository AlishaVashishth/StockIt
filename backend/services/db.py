import json
import os
from typing import Union, Dict, List

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

def read_json(filename: str) -> Union[Dict, List]:
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        return {}  # Could also return [] based on context, but empty dict is a safe default
    with open(filepath, "r") as f:
        return json.load(f)

def write_json(filename: str, data: Union[Dict, List]) -> None:
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)
