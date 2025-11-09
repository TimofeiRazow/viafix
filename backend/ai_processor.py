import cv2
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from pathlib import Path
import logging
import base64
from io import BytesIO
from typing import Tuple, Optional, Dict, Any
import torch
import urllib.request

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

# Импорт из ultralyticsplus
try:
    from ultralyticsplus import YOLO, load_model
    ULTRALYTICS_PLUS_AVAILABLE = True
except ImportError:
    from ultralytics import YOLO
    ULTRALYTICS_PLUS_AVAILABLE = False
    
torch.serialization.add_safe_globals([DetectionModel, DFL, Concat, Upsample, MaxPool2d, SPPF, Bottleneck, ModuleList, C2f, Conv2d, Detect, Sequential, Conv, BatchNorm2d, SiLU])

log = logging.getLogger(__name__)

class AIPotholeDetector:
    
    DEFAULT_MODEL_ID = "keremberke/yolov8s-pothole-detection"

    LABEL_TRANSLATIONS = {
        'pothole': 'Яма',
        'crack': 'Трещина',
        'manhole': 'Люк',
    }

    def __init__(self, model_path: str = None):
        """
        Инициализация детектора ям.
        
        Args:
            model_path: путь к локальной модели. Если None, загружается модель по умолчанию из HuggingFace.
        """
        try:
            if ULTRALYTICS_PLUS_AVAILABLE:
                if model_path and Path(model_path).exists():
                    self.model = load_model(model_path)
                    log.info(f"✅ Локальная модель загружена с использованием ultralyticsplus: {model_path}")
                else:
                    log.info(f"ℹ️ Загрузка модели по умолчанию из HuggingFace: {self.DEFAULT_MODEL_ID}")
                    self.model = load_model(self.DEFAULT_MODEL_ID)
                    log.info("✅ Модель загружена из HuggingFace с использованием ultralyticsplus")
            else:
                if model_path and Path(model_path).exists():
                    self.model = YOLO(model_path)
                    log.info(f"✅ Локальная модель YOLO загружена: {model_path}")
                else:
                    self.model = YOLO("best.pt")
                    log.info("✅ Модель YOLO загружена (используется чистая ultralytics)")
            
            # НЕ переопределяем model.names, чтобы не сломать plot()
            # if hasattr(self.model, 'names'):
            #     ...
            
            # ⭐ НОВОЕ: Загружаем шрифт для кириллицы
            self.font_path = self._download_cyrillic_font()

        except Exception as e:
            log.exception(f"❌ Ошибка загрузки модели: {e}")
            raise

    def _download_cyrillic_font(self) -> Optional[str]:
        """
        Скачивает шрифт с поддержкой кириллицы если он не найден.
        
        Returns:
            Путь к файлу шрифта или None
        """
        font_paths = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",  # macOS
            "C:\\Windows\\Fonts\\arial.ttf",  # Windows
        ]
        
        for font_path in font_paths:
            if Path(font_path).exists():
                log.info(f"✅ Найден шрифт: {font_path}")
                return font_path
        
        # Если не найден, скачиваем
        fonts_dir = Path("./fonts")
        fonts_dir.mkdir(exist_ok=True)
        font_file = fonts_dir / "DejaVuSans-Bold.ttf"
        
        if not font_file.exists():
            try:
                log.info("📥 Скачиваем шрифт DejaVu Sans...")
                url = "https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans-Bold.ttf"
                urllib.request.urlretrieve(url, str(font_file))
                log.info(f"✅ Шрифт скачан: {font_file}")
            except Exception as e:
                log.error(f"❌ Не удалось скачать шрифт: {e}")
                return None
        
        return str(font_file)

    def replace_labels_with_russian(self, annotated_frame: np.ndarray, results) -> np.ndarray:
        """
        ⭐ КЛЮЧЕВОЙ МЕТОД: Заменяет английские метки на русские в уже отрисованном изображении.
        Текст БЕЗ фона, только с тенью для читаемости.
        
        Args:
            annotated_frame: изображение с отрисованными bbox от YOLO (BGR)
            results: результаты детекции
            
        Returns:
            Изображение с русскими метками (BGR)
        """
        if not self.font_path:
            log.warning("⚠️ Шрифт не найден, возвращаем изображение без изменений")
            return annotated_frame
        
        # Конвертируем в RGB для PIL
        image_rgb = cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(image_rgb)
        draw = ImageDraw.Draw(pil_image)
        
        # Загружаем шрифт
        try:
            font = ImageFont.truetype(self.font_path, 24)  # Размер шрифта
        except Exception as e:
            log.error(f"❌ Не удалось загрузить шрифт: {e}")
            return annotated_frame
        
        # Обрабатываем каждую детекцию
        for result in results:
            if result.boxes is not None:
                for box in result.boxes:
                    # Получаем данные
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    confidence = box.conf[0].item()
                    class_id = int(box.cls[0].item())
                    
                    # Получаем оригинальное имя класса
                    class_name = self.model.names.get(class_id, "unknown")
                    
                    # ⭐ Переводим на русский
                    russian_label = self.LABEL_TRANSLATIONS.get(class_name, class_name)
                    
                    # Формируем полный текст
                    text = f"{russian_label}"
                    
                    # Получаем размер текста
                    bbox = draw.textbbox((0, 0), text, font=font)
                    text_width = bbox[2] - bbox[0]
                    text_height = bbox[3] - bbox[1]
                    
                    # Позиция текста (над bbox)
                    text_x = x1 + 5
                    text_y = y1 - text_height - 10
                    
                    # Если текст выходит за верхнюю границу, помещаем внутрь bbox
                    if text_y < 0:
                        text_y = y1 + 5
                    
                    # ⭐ Рисуем тень (черный текст со смещением)
                    shadow_offset = 2
                    draw.text(
                        (text_x + shadow_offset, text_y + shadow_offset),
                        text,
                        fill=(0, 0, 0),  # Черная тень
                        font=font
                    )
                    
                    # ⭐ Рисуем основной текст (белый)
                    draw.text(
                        (text_x, text_y),
                        text,
                        fill=(255, 255, 255),  # Белый текст
                        font=font
                    )
        
        # Конвертируем обратно в BGR
        result_bgr = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        return result_bgr


    def detect_potholes(
        self, 
        image_path: str,
        annotation_quality: int = 98,
        use_russian_labels: bool = True
    ) -> Tuple[bool, float, str, Optional[str]]:
        """
        Обнаружение ям на изображении.
        """
        try:
            # Запуск детекции
            results = self.model.predict(image_path)
            
            has_problem = False
            max_confidence = 0.0
            category = "unknown"
            num_detections = 0
            
            # Анализ результатов
            for result in results:
                if result.boxes is not None and len(result.boxes) > 0:
                    has_problem = True
                    num_detections = len(result.boxes)
                    
                    for box in result.boxes:
                        confidence = box.conf[0].item()
                        if confidence > max_confidence:
                            max_confidence = confidence
                    
                    if num_detections >= 3:
                        category = "multiple_potholes"
                    elif max_confidence > 0.8:
                        category = "pothole"
                    else:
                        category = "possible_pothole"
            
            # Создаем аннотированное изображение
            annotated_image_base64 = None
            if has_problem and len(results) > 0:
                # ⭐ НОВОЕ: Отрисовываем БЕЗ меток (только bbox)
                annotated_frame = results[0].plot(
                    labels=False,  # ⭐ Отключаем метки!
                    conf=False,    # ⭐ Отключаем confidence!
                    line_width=1,  # Толщина линий bbox
                    boxes=True     # Оставляем bbox
                )
                
                # ⭐ Добавляем русские метки
                if use_russian_labels:
                    annotated_frame = self.replace_labels_with_russian(annotated_frame, results)
                
                # Конвертируем в RGB для PIL
                annotated_frame_rgb = cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(annotated_frame_rgb)
                
                # Сохраняем с высоким качеством
                buffered = BytesIO()
                pil_image.save(
                    buffered, 
                    format="JPEG", 
                    quality=annotation_quality,
                    optimize=False,
                    subsampling=0
                )
                annotated_image_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                
                log.info(f"✅ Обнаружено {num_detections} ям с максимальной уверенностью {max_confidence:.2f}")
                log.info(f"📊 Размер изображения: {len(buffered.getvalue()) / 1024:.2f} KB")
            else:
                # Если проблем не обнаружено, возвращаем исходное изображение
                original_image = Image.open(image_path)
                buffered = BytesIO()
                original_image.save(
                    buffered, 
                    format="JPEG", 
                    quality=annotation_quality,
                    optimize=False,
                    subsampling=0
                )
                annotated_image_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                log.info("ℹ️ Проблемы на изображении не обнаружены")
            
            return has_problem, max_confidence, category, annotated_image_base64
            
        except Exception as e:
            log.exception(f"❌ Ошибка при обработке изображения: {e}")
            return False, 0.0, "error", None


    def get_detection_details(self, image_path: str) -> Dict[str, Any]:
        """
        Получение детальной информации об обнаружениях.
        
        Args:
            image_path: путь к изображению.
            
        Returns:
            Словарь с детальной информацией.
        """
        try:
            results = self.model.predict(image_path)
            
            detections = []
            for result in results:
                if result.boxes is not None:
                    for i, box in enumerate(result.boxes):
                        detection = {
                            "id": i + 1,
                            "confidence": box.conf[0].item(),
                            "bbox": box.xyxy[0].tolist(),
                            "area": float((box.xyxy[0][2] - box.xyxy[0][0]) * (box.xyxy[0][3] - box.xyxy[0][1]))
                        }
                        detections.append(detection)
            
            detections.sort(key=lambda x: x["confidence"], reverse=True)
            
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
    Получение синглтона детектора.
    """
    global _detector
    if _detector is None:
        _detector = AIPotholeDetector(model_path)
    return _detector