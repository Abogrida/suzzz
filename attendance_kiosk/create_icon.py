from PIL import Image
import os

def create_ico():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    img_path = os.path.join(base_dir, 'static', 'logo.jpg')
    ico_path = os.path.join(base_dir, 'app_icon.ico')
    
    if os.path.exists(img_path):
        img = Image.open(img_path)
        # Resize to standard icon sizes
        img.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
        print(f"Created icon at {ico_path}")
    else:
        print(f"Logo not found at {img_path}")

if __name__ == "__main__":
    create_ico()
