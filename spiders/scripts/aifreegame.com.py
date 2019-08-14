import re
import sys, os
import requests
import json
from bs4 import BeautifulSoup

index = "https://www.aifreegame.com/princess-games.html"
js_url = "https://www.aifreegame.com/ajax/index?categoryid={}&type={}&count=33&page={}&ismobile=false"


if len(sys.argv) > 1:
	index = sys.argv[1]
print(index)
catname = ("".join(re.findall("/([a-z0-9\\-]+)\\.html?", index, re.S)))
xlsx = catname + ".xlsx"


jsonfile = "../data/aifreegame.com/{}.json".format(catname)
if os.path.exists(jsonfile):
	with open(jsonfile, 'r') as f:
		jsondata = json.load(f)
else:
	jsondata = {"data":[], "index":{}, "site":"www.aifreegame.com"}

h4399_header = {
	"Host": "www.aifreegame.com",
	"Connection": "keep-alive",
	"Cache-Control": "max-age=0",
	"User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
	"Upgrade-Insecure-Requests": "1",
	"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
	"Accept-Encoding": "gzip, deflate",
	"Accept-Language": "zh-CN,zh;q=0.9"
}

server_dic = {}


def crawl_gamepage(url):
	index = jsondata['index'][url]
	data = jsondata['data'][index]
	try:
		r = requests.get(normalize(url), headers=h4399_header, timeout=10)
		print("crawling game page:...{}, status_code:{}".format(r.url, r.status_code))
		if r.status_code != 200:
			return
		html = r.text
		soup = BeautifulSoup(html, "lxml")
		data['desc'] = soup.find("meta", attrs={"property": "og:description"}).attrs['content']
		data['url'] = soup.find(id="gameframe").attrs['src']
		with open(jsonfile,"w") as f:
			json.dump(jsondata,f)
	except Exception as err:
		print(err)
		
def normalizeImg(url):
	if not url.startswith("http"):
		url = "https://www.aifreegame.com/game/{}.html".format(url)
	return url

def normalize(url):
	if not url.startswith("http"):
		url = "https://www.aifreegame.com{}".format(url)
	return url

def crawler_other_indexs(page, categoryId, type):
	r = None
	real_url = js_url.format(categoryId, type, page)
	try:
		r = requests.get(real_url, headers=h4399_header, timeout=10)
		print("crawling js page:...{}, status_code:{}".format(r.url, r.status_code))
		if r.status_code != 200:
			return
		arr = json.loads(r.text)

		if len(arr) == 0:
			print("[]?")
			return False
			
		for n in arr:
			url = n['url']
			pic = n['img']
			title = n['name']
			'''
			category = n['category']
			categoryid = n['categoryid']
			playlink = n['playlink']
			html5introduce = n['html5introduce']
			wapclicks = n['wapclicks']
			'''
			if url in jsondata['index']:
				continue
			jsondata['index'][url] = len(jsondata['data'])
			jsondata['data'].append({"title":title, "img":normalizeImg(pic), "url":normalize(url), "desc":'', "tags":'', "cat":categoryId,"date":'',"played":'',"gametype":''})
			crawl_gamepage(url)
		with open(jsonfile,"w") as f:
			json.dump(jsondata,f)
		return True

	except Exception as err:
		print(err)
		return False
	finally:
		if r != None:
			r.close()


def crawler_indexs():
	'''
	解析目录
	:return:
	'''
	r = None
	html = ""
	try:
		r = requests.get(index, headers=h4399_header, timeout=10)
		print("crawling....{}, status_code:{}".format(r.url, r.status_code))

		if r.status_code != 200:
			return
		html = r.text

		categoryId = int("".join(re.findall("var\\scategoryId\\s+=\\s+(\\d+);", html, re.S)))
		type = int("".join(re.findall("var\\stype\\s+=\\s*(\\d+);", html, re.S)))

		for i in range(1, 200):
			if not crawler_other_indexs(i, categoryId, type):
				break

	except Exception as err:
		print(err)
		return
	finally:
		if r != None:
			r.close()


crawler_indexs()
