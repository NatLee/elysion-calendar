import os

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException

import requests

from parse_room_schedule import parse_room_schedule

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RoomStatus:
    def __init__(self, name: str, system: str):
        self.name = name
        self.system = system
        self.reservations = []

@app.get("/api/daily-schedule/{date}")
async def get_daily_schedule(date: str):
    try:
        # 爬取原始網站
        url = f"http://calendar.elysion.com.tw/bookinfo.aspx?bd={date}"
        response = requests.get(url)
        
        # 解析資料
        rooms = parse_room_schedule(response.text)
        
        return {
            "date": date,
            "rooms": rooms,
            "url": url,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)