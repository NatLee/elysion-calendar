from bs4 import BeautifulSoup
from typing import List

def parse_room_schedule(html_content: str) -> List:
    """
    解析包廂預約資訊
    
    Args:
        html_content (str): HTML原始碼
        
    Returns:
        List: 包含所有包廂預約資訊的List
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    rooms = []
    
    # 找出所有包廂區塊
    room_divs = soup.find_all('div', class_='book-room col-xs-12')
    
    for idx, room_div in enumerate(room_divs):
        # 獲取包廂資訊
        room_info = room_div.find('span', class_='book-number-en')
        if not room_info:
            continue
            
        room_name = room_info.text.strip()

        # 找出預約資訊
        bookings = []
        table = room_div.find('table')
        if table:
            # 第一行包含預約資訊
            booking_row = table.find_all('tr')[0]
            cells = booking_row.find_all('td')

            start_hour = 9  # 預設開始時間為9點
            
            for i, cell in enumerate(cells):
                if cell.get('colspan') and cell.get('style') and 'background' in cell.get('style'):
                    # 找到一個預約
                    text = cell.text.strip()
                    colspan = int(cell.get('colspan', 1))
       
                    # 計算時間
                    duration = colspan / 2  # 每個colspan代表半小時
                    end_hour = start_hour + (duration if duration < 15 else duration - 24)
                    
                    # 處理跨日的情況
                    if end_hour < start_hour:
                        end_hour += 24
                    
                    # 處理時長資訊（使用結束時間跟開始時間計算）
                    duration_info = f"{int(duration)}小時" if duration >= 1 else f"{int(duration*60)}分鐘"
                    
                    booking = {
                        "customer": text.split(' (')[0] if ' (' in text else text,
                        "start_time": f"{int(start_hour):02d}:{(int(start_hour*60)%60):02d}",
                        "end_time": f"{int(end_hour):02d}:{(int(end_hour*60)%60):02d}",
                        "duration": duration_info,
                    }
                    bookings.append(booking)
                
                # 更新開始時間
                if not cell.get('colspan'):
                    start_hour += 0.5
                else:
                    start_hour += int(cell.get('colspan', 1)) / 2
                    
                if start_hour >= 24:
                    start_hour -= 24
        
        # 儲存包廂資訊
        rooms.append({
            "id": idx,
            "name": room_name,
            "bookings": bookings
        })
    
    return rooms