import json
import random

from flask import Blueprint, jsonify, render_template, session

from backend.decorators import session_required, timing_decorator
from backend.flashcard_app import get_flashcard_app

flashcard_app = get_flashcard_app()

from backend.common import DECKS_INFO
from backend.common import CARDDECKS

puzzles_bp = Blueprint("puzzles", __name__, url_prefix="/puzzles")


QUIZ_Q = {
    "Numbers and Quantities": ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "百", "千", "万", "零", "一百", "二十", "三十", "四十", "五十", "十一", "很多", "一点儿", "第一", "两", "几", "多少", "一些", "每"],
    "People and Relationships": ["爸爸", "妈妈", "儿子", "女儿", "哥哥", "姐姐", "弟弟", "妹妹", "丈夫", "妻子", "朋友", "同学", "老师", "学生", "医生", "服务员", "司机", "老板", "先生", "小姐", "先生", "小姐", "家人", "大家", "孩子", "人"],
    "Daily Activities and Verbs": ["吃", "喝", "说", "看", "听", "写", "读", "学习", "工作", "睡觉", "买", "卖", "开", "关", "坐", "站", "走", "跑步", "游泳", "唱歌", "跳舞", "踢足球", "打篮球", "旅游", "帮助", "洗", "穿", "起床", "休息", "打电话"],
    "Time and Calendar": ["年", "月", "日", "星期", "点", "分钟", "小时", "今天", "明天", "昨天", "去年", "上午", "中午", "下午", "晚上", "现在", "以前", "以后", "早上", "周末", "春", "夏", "秋", "冬", "生日", "岁"],
    "Places and Locations": ["家", "学校", "公司", "医院", "商店", "饭店", "北京", "中国", "电影院", "机场", "火车站", "图书馆", "公园", "银行", "超市", "办公室", "厨房", "卧室", "客厅", "洗手间", "楼上", "楼下", "左边", "右边", "前面", "后面"],
    "Food and Drink": ["米饭", "面条", "菜", "水果", "苹果", "香蕉", "西瓜", "鸡蛋", "牛奶", "茶", "咖啡", "水", "可乐", "面包", "蛋糕", "巧克力", "冰淇淋", "鱼", "肉", "鸡肉", "牛肉", "猪肉", "羊肉", "蔬菜", "汤", "饺子"],
    "Common Adjectives": ["好", "坏", "大", "小", "多", "少", "热", "冷", "高兴", "难过", "漂亮", "丑", "快", "慢", "贵", "便宜", "新", "旧", "干净", "脏", "容易", "难", "胖", "瘦", "高", "矮", "忙", "累", "有趣", "无聊"],
    "Questions and Communication": ["什么", "谁", "哪里", "怎么", "为什么", "是不是", "有没有", "好不好", "可以吗", "真的吗", "怎么样", "多少", "几", "几岁", "多大", "哪个", "哪些", "什么时候", "在哪儿", "怎么办", "为什么", "对不对", "行不行", "够不够", "需要吗"],
    "Transportation and Travel": ["车", "公共汽车", "出租车", "地铁", "火车", "飞机", "自行车", "摩托车", "船", "走路", "开车", "坐车", "骑车", "票", "路", "地图", "旅游", "旅行", "出发", "到达", "回来", "护照", "行李", "酒店", "宾馆", "度假"],
    "Weather and Nature": ["天气", "晴天", "阴天", "下雨", "下雪", "刮风", "冷", "热", "温度", "春天", "夏天", "秋天", "冬天", "太阳", "月亮", "星星", "云", "山", "河", "海", "树", "花", "草", "森林", "沙漠", "空气"],
    "HSK 1": CARDDECKS["hsk1"],
    "HSK 2": CARDDECKS["hsk2"],
    "HSK 3": CARDDECKS["hsk3"],
    "HSK 4": CARDDECKS["hsk4"],
    "HSK 5": CARDDECKS["hsk5"],
    "HSK 6": CARDDECKS["hsk6"],
  }


def get_common_context():
    return {
        "darkmode": session["darkmode"],
        "username": session["username"],
        "decks": CARDDECKS,
        "quiz_q": QUIZ_Q,
        "decksinfos": DECKS_INFO,
        "deck": "hsk1",
    }



@puzzles_bp.route("/")
@session_required
@timing_decorator
def puzzles():
    characters = dict(CARDDECKS[session["deck"]].items())
    context = get_common_context()
    context["characters"] = characters
    return render_template("puzzles.html", **context)


# def hanzitest_pinyin():
#     characters = dict(CARDDECKS[session["deck"]].items())
#     return render_template(
#         "puzzles/hanzitest_pinyin.html",
#         darkmode=session["darkmode"],
#         username=session["username"],
#         characters=characters,
#         decks=flashcard_app.decks,
#         deck=session["deck"],
#     )


@puzzles_bp.route("/hanzitest_pinyin")
@session_required
@timing_decorator
def hanzitest_pinyin():
    characters = dict(CARDDECKS[session["deck"]].items())
    context = get_common_context()
    context["characters"] = characters
    return render_template("puzzles/hanzitest_pinyin.html", **context)


@puzzles_bp.route("/hanzitest_table")
@session_required
@timing_decorator
def hanzitest_table():
    characters = dict(CARDDECKS[session["deck"]].items())
    context = get_common_context()
    context["characters"] = characters
    return render_template("puzzles/hanzitest_table.html", **context)


@puzzles_bp.route("/hanzitest_draw")
@session_required
@timing_decorator
def hanzitest_draw():
    context = get_common_context()
    deck = context["deck"]
    characters_data = [
        {
            "character": char,
            "pinyin": data["pinyin"],
            "english": data["english"],
        }
        for char, data in CARDDECKS[deck].items()
    ]
    context["characters"] = characters_data
    return render_template("puzzles/hanzitest_draw.html", **context)


@puzzles_bp.route("/hanzitest_choices")
@session_required
@timing_decorator
def hanzitest_choices():
    context = get_common_context()
    characters = dict(CARDDECKS[context["deck"]].items())
    context["characters"] = characters
    return render_template("puzzles/hanzitest_choices.html", **context)


@puzzles_bp.route("/hanzitest_choices2")
@session_required
@timing_decorator
def hanzitest_choices2():
    context = get_common_context()
    characters = dict(CARDDECKS[context["deck"]].items())
    context["characters"] = characters
    return render_template("puzzles/hanzitest_choices2.html", **context)


@puzzles_bp.route("/hanzitest_fillin")
@session_required
@timing_decorator
def hanzitest_fillin():
    if "fillin" not in session:
        session["fillin"] = json.load(
            open("data/fillin_puzzles.json", "r", encoding="utf-8")
        )
    klist = session["fillin"]["contextClues"]
    random.shuffle(klist)
    fillin = {k: session["fillin"]["contextClues"][k] for k in range(10)}
    characters = dict(CARDDECKS[session["deck"]].items())

    context = get_common_context()
    context.update(
        {
            "fillin": fillin,
            "characters": characters,
        }
    )
    return render_template("puzzles/hanzitest_fillin.html", **context)
