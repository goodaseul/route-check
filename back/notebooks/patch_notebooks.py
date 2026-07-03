import json
import os

MAIN_NB_PATH = "back/notebooks/관광정보_메인_EDA_Pretraining.ipynb"
DETAIL_NB_PATH = "back/notebooks/관광정보_상세_EDA_Pretraining.ipynb"

robust_fetch_code = [
    "import os\n",
    "import time\n",
    "import requests\n",
    "import pandas as pd\n",
    "from dotenv import load_dotenv\n",
    "\n",
    "# .env 파일에서 API 키 로드 (상위 폴더 확인)\n",
    "load_dotenv(dotenv_path=\"../../.env\")\n",
    "API_KEY = os.getenv(\"TOUR_API_DECODE_KEY\")\n",
    "BASE_URL = \"https://apis.data.go.kr/B551011/KorService2\"\n",
    "\n",
    "print(\"API 키 로드 상태:\", \"성공\" if API_KEY else \"실패 (내부 .env 파일과 변수명을 확인하세요)\")\n",
    "\n",
    "def fetch_api_data(endpoint, base_url=BASE_URL, params=None):\n",
    "    url = f\"{base_url}/{endpoint}\"\n",
    "    default_params = {\n",
    "        \"serviceKey\": API_KEY,\n",
    "        \"MobileOS\": \"ETC\",\n",
    "        \"MobileApp\": \"RouteCheck\",\n",
    "        \"_type\": \"json\"\n",
    "    }\n",
    "    if params:\n",
    "        default_params.update(params)\n",
    "    \n",
    "    max_retries = 3\n",
    "    retry_delay = 2  # base delay in seconds\n",
    "    \n",
    "    for attempt in range(max_retries + 1):\n",
    "        try:\n",
    "            response = requests.get(url, params=default_params, timeout=10)\n",
    "            \n",
    "            # 💡 [HTTP 429: Too Many Requests 대응]\n",
    "            if response.status_code == 429:\n",
    "                if attempt < max_retries:\n",
    "                    sleep_time = retry_delay * (2 ** attempt)\n",
    "                    print(f\"⚠️ API 요청 제한(HTTP 429) 발생! {sleep_time}초 대기 후 재시도 ({attempt + 1}/{max_retries})...\")\n",
    "                    time.sleep(sleep_time)\n",
    "                    continue\n",
    "                else:\n",
    "                    print(f\"❌ API 요청 제한(HTTP 429) 초과로 요청 최종 실패 ({endpoint})\")\n",
    "                    return pd.DataFrame()\n",
    "            \n",
    "            if response.status_code == 200:\n",
    "                res_json = response.json()\n",
    "                if 'response' in res_json:\n",
    "                    header = res_json['response'].get('header', {})\n",
    "                    result_code = header.get('resultCode')\n",
    "                    if result_code != '0000':\n",
    "                        # 💡 [공공데이터 포털 서버단 트래픽 제한 에러 대응 (예: '04' 또는 '22')]\n",
    "                        if result_code in ['04', '22'] and attempt < max_retries:\n",
    "                            sleep_time = retry_delay * (2 ** attempt)\n",
    "                            print(f\"⚠️ API 트래픽 초과 에러 [{result_code}] 발생! {sleep_time}초 대기 후 재시도 ({attempt + 1}/{max_retries})...\")\n",
    "                            time.sleep(sleep_time)\n",
    "                            continue\n",
    "                        print(f\"API 자체 에러 [{result_code}]: {header.get('resultMsg')} ({endpoint})\")\n",
    "                        return pd.DataFrame()\n",
    "                    \n",
    "                    body = res_json['response'].get('body', {})\n",
    "                    items = body.get('items', {})\n",
    "                    if not items or items == \"\":\n",
    "                        return pd.DataFrame()\n",
    "                    \n",
    "                    if 'item' in items:\n",
    "                        item_list = items['item']\n",
    "                        if isinstance(item_list, dict):\n",
    "                            item_list = [item_list]\n",
    "                        return pd.DataFrame(item_list)\n",
    "            else:\n",
    "                if attempt < max_retries:\n",
    "                    print(f\"⚠️ HTTP Error Code: {response.status_code} ({url}). {retry_delay}초 대기 후 재시도...\")\n",
    "                    time.sleep(retry_delay)\n",
    "                    continue\n",
    "                else:\n",
    "                    print(f\"HTTP Error Code: {response.status_code} ({url})\")\n",
    "                    return pd.DataFrame()\n",
    "        except Exception as e:\n",
    "            if attempt < max_retries:\n",
    "                print(f\"⚠️ 네트워크 또는 데이터 파싱 실패 ({endpoint}): {e}. {retry_delay}초 대기 후 재시도...\")\n",
    "                time.sleep(retry_delay)\n",
    "                continue\n",
    "            else:\n",
    "                print(f\"네트워크 또는 데이터 파싱 최종 실패 ({endpoint}): {e}\")\n",
    "                return pd.DataFrame()\n",
    "                \n",
    "    return pd.DataFrame()"
]

def patch_notebook(path):
    if not os.path.exists(path):
        print(f"Notebook {path} does not exist, skipping.")
        return
    
    with open(path, 'r', encoding='utf-8') as f:
        nb = json.load(f)
    
    patched = False
    for cell in nb['cells']:
        if cell['cell_type'] == 'code' and cell.get('id') == 'ec1dfdce':
            cell['source'] = robust_fetch_code
            patched = True
            break
            
    if patched:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(nb, f, ensure_ascii=False, indent=1)
        print(f"Successfully patched fetch_api_data in {path}")
    else:
        print(f"Could not find fetch_api_data cell in {path}")

if __name__ == '__main__':
    patch_notebook(MAIN_NB_PATH)
    patch_notebook(DETAIL_NB_PATH)
