from huggingface_hub import hf_hub_download

model_path = hf_hub_download(
    repo_id="keremberke/yolov8n-pothole-segmentation",
    filename="best.pt"
)

import torch
import io
import zipfile
import pprint

path = "best.pt"

def safe_torch_inspect(path):
    # Читаем файл без десериализации
    with open(path, "rb") as f:
        data = f.read()

    # Проверяем, ZIP ли это (PyTorch с safetensors)
    if zipfile.is_zipfile(io.BytesIO(data)):
        print("✅ Файл в формате ZIP (safetensors или torchscript). Безопасно.")
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            print("Содержимое архива:")
            for name in z.namelist():
                print("  └──", name)
        return

    # Если не ZIP — тогда это обычный pickle
    print("⚠️ Файл в формате pickle (обычный .pt, как у YOLO). Проверим метаданные...")

    # Используем weights_only=True — не исполняет код
    ckpt = torch.load(path, map_location="cpu", weights_only=True)
    if isinstance(ckpt, dict):
        print("Ключи контрольной точки:")
        pprint.pp(ckpt.keys())
    else:
        print("Тип содержимого:", type(ckpt))

safe_torch_inspect(path)
