import torch
from ultralytics import YOLO

# Разрешаем полную загрузку (может быть небезопасно, если файл чужой!)
model = YOLO(torch.load("Yolov8-fintuned-on-potholes.pt", weights_only=False))
