import requests

url = "http://localhost:8000/api/search/public/events-by-face"
try:
    # Use any valid image file as dummy selfie.
    # The server might return "No face detected" or actually hang.
    with open("c:/Users/KRUPESH/Desktop/photo-event-platform/frontend/public/sunset-bg.png", "rb") as f:
        files = {'file': ('selfie.jpg', f, 'image/jpeg')}
        response = requests.post(url, files=files, timeout=30)
    print("Status Code:", response.status_code)
    print("Response:", response.text)
except requests.exceptions.Timeout:
    print("Timeout! The server hung.")
except Exception as e:
    print("Error:", e)
