from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image
import os
from typing import Optional, Tuple

class AIPotholeDetector:
    def __init__(self, model_path: str):
        self.model = YOLO(model_path)
    
    def detect_potholes(self, image_path: str) -> Tuple[bool, float, Optional[str]]:
        """
        Detect potholes in an image
        
        Returns:
            - bool: True if pothole detected
            - float: confidence score
            - str: category of problem
        """
        try:
            results = self.model(image_path)
            
            for result in results:
                boxes = result.boxes
                if boxes is not None and len(boxes) > 0:
                    # Get the highest confidence detection
                    confidences = boxes.conf.cpu().numpy()
                    max_conf = float(np.max(confidences))
                    
                    if max_conf > 0.5:  # Confidence threshold
                        return True, max_conf, "pothole"
            
            return False, 0.0, None
            
        except Exception as e:
            print(f"Error in AI detection: {str(e)}")
            return False, 0.0, None

# Global AI detector instance
ai_detector = None

def get_ai_detector():
    global ai_detector
    if ai_detector is None:
        from config import settings
        ai_detector = AIPotholeDetector(settings.AI_MODEL_PATH)
    return ai_detector