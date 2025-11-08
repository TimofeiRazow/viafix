
import cv2
from PIL import Image
import numpy as np
from pathlib import Path
import logging
import base64
from io import BytesIO
from typing import Tuple, Optional, Dict, Any
import torch
from ultralytics.nn.tasks import DetectionModel
from torch.nn.modules.conv import Conv2d
from ultralytics.nn.modules import Detect
from torch.nn.modules.container import Sequential
from ultralytics.nn.modules.conv import Conv, Concat
from torch.nn.modules.batchnorm import BatchNorm2d
from torch.nn.modules.activation import SiLU
from ultralytics.nn.modules.block import C2f
from torch.nn.modules.container import ModuleList
from ultralytics.nn.modules.block import Bottleneck, DFL
from ultralytics.nn.modules.block import SPPF
from torch.nn.modules.pooling import MaxPool2d
from torch.nn.modules.upsampling import Upsample

torch.serialization.add_safe_globals([DetectionModel, DFL, Concat, Upsample, MaxPool2d, SPPF, Bottleneck, ModuleList, C2f, Conv2d, Detect, Sequential, Conv, BatchNorm2d, SiLU])

from ultralytics import YOLO

log = logging.getLogger(__name__)

class AIPotholeDetector:
    def __init__(self, model_path: str = None):
        """
        Инициализация детектора ям
        
        Args:
            model_path: путь к локальной модели или None для загрузки из HuggingFace
        """
        try:
            if model_path and Path(model_path).exists():
                self.model = YOLO(model_path)
                log.info(f"✅ Локальная модель YOLO загружена: {model_path}")
            else:
                # Загрузка модели из HuggingFace
                self.model = YOLO("Yolov8-fintuned-on-potholes.pt")
                log.info("✅ Модель YOLO загружена из HuggingFace")
        except Exception as e:
            log.exception("❌ Ошибка загрузки модели YOLO")
            raise

    def detect_potholes(self, image_path: str) -> Tuple[bool, float, str, Optional[str]]:
        """
        Обнаружение ям на изображении
        
        Args:
            image_path: путь к изображению
            
        Returns:
            Tuple[has_problem, confidence, category, annotated_image_base64]
        """
        try:
            # Запуск детекции
            results = self.model(image_path)
            
            has_problem = False
            max_confidence = 0.0
            category = "unknown"
            num_detections = 0
            
            # Анализ результатов
            for result in results:
                if result.boxes is not None and len(result.boxes) > 0:
                    has_problem = True
                    num_detections = len(result.boxes)
                    
                    # Находим максимальную уверенность
                    for box in result.boxes:
                        confidence = box.conf[0].item()
                        if confidence > max_confidence:
                            max_confidence = confidence
                    
                    # Определяем категорию на основе количества обнаружений
                    if num_detections >= 3:
                        category = "multiple_potholes"
                    elif max_confidence > 0.8:
                        category = "pothole"
                    else:
                        category = "possible_pothole"
            
            # Создаем аннотированное изображение
            annotated_image_base64 = None
            if has_problem and len(results) > 0:
                annotated_frame = results[0].plot()
                
                # Конвертируем BGR в RGB (OpenCV использует BGR)
                annotated_frame_rgb = cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB)
                
                # Конвертируем в base64
                pil_image = Image.fromarray(annotated_frame_rgb)
                buffered = BytesIO()
                pil_image.save(buffered, format="JPEG", quality=85)
                annotated_image_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                
                log.info(f"✅ Обнаружено {num_detections} ям с максимальной уверенностью {max_confidence:.2f}")
            else:
                # Если проблем не обнаружено, возвращаем исходное изображение
                with open(image_path, "rb") as image_file:
                    annotated_image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
                log.info("ℹ️ Проблемы на изображении не обнаружены")
            
            return has_problem, max_confidence, category, annotated_image_base64
            
        except Exception as e:
            log.exception(f"❌ Ошибка при обработке изображения: {e}")
            # В случае ошибки возвращаем безопасные значения
            return False, 0.0, "error", None

    def get_detection_details(self, image_path: str) -> Dict[str, Any]:
        """
        Получение детальной информации об обнаружениях
        
        Args:
            image_path: путь к изображению
            
        Returns:
            Словарь с детальной информацией
        """
        try:
            results = self.model(image_path)
            
            detections = []
            for result in results:
                if result.boxes is not None:
                    for i, box in enumerate(result.boxes):
                        detection = {
                            "id": i + 1,
                            "confidence": box.conf[0].item(),
                            "bbox": box.xyxy[0].tolist(),  # [x1, y1, x2, y2]
                            "area": float((box.xyxy[0][2] - box.xyxy[0][0]) * 
                                        (box.xyxy[0][3] - box.xyxy[0][1]))
                        }
                        detections.append(detection)
            
            # Сортируем по уверенности
            detections.sort(key=lambda x: x["confidence"], reverse=True)
            
            # Определяем серьезность проблемы
            severity = "none"
            if detections:
                total_area = sum(d["area"] for d in detections)
                if len(detections) >= 5 or total_area > 50000:
                    severity = "critical"
                elif len(detections) >= 3 or total_area > 20000:
                    severity = "high"
                elif len(detections) >= 1:
                    severity = "medium"
            
            return {
                "detections": detections,
                "total_count": len(detections),
                "severity": severity,
                "avg_confidence": np.mean([d["confidence"] for d in detections]) if detections else 0
            }
            
        except Exception as e:
            log.exception(f"❌ Ошибка при получении деталей: {e}")
            return {
                "detections": [],
                "total_count": 0,
                "severity": "error",
                "avg_confidence": 0
            }

_detector = None

def get_ai_detector(model_path: str = None):
    """
    Получение синглтона детектора
    """
    global _detector
    if _detector is None:
        _detector = AIPotholeDetector(model_path)
    return _detector