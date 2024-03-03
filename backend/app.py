import chainlit as cl

from fastapi import FastAPI
from pydantic import BaseModel
import sqlite3
from typing import List, Dict
# Assuming OpenAI and hypothetical Chainlit imports are correct
from openai import AsyncOpenAI
from chainlit.server import app
from chainlit.input_widget import Select, Slider, Switch
import re
from chainlit.context import init_http_context
from chainlit.context import init_ws_context
from chainlit.session import WebsocketSession
from fastapi import Request
from fastapi.responses import JSONResponse

client = AsyncOpenAI(
    api_key="",
    base_url="https://api.moonshot.cn/v1",
)


def get_db_connection():
    conn = sqlite3.connect('app.db')
    conn.row_factory = sqlite3.Row
    return conn


class Scenario(BaseModel):
    id: int
    title: str
    description: str
    finished: bool
    progress: int
    tags: str
    total_click_times: int
    winning_chance: float


@app.get("/api/scenarios", response_model=List[Scenario])
async def get_scenarios():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM scenarios")
    scenarios_rows = cur.fetchall()
    conn.close()

    # Convert rows to Scenario model instances
    scenarios = [Scenario(
        id=row[0],
        title=row[1],
        description=row[2],
        finished=row[3],
        progress=row[4],
        tags=row[5],
        total_click_times=row[6],
        winning_chance=row[7]
    ) for row in scenarios_rows]
    return scenarios


@cl.on_chat_start
async def on_chat_start():
    print("Session id:", cl.user_session.get("id"))
    cl.user_session.set("counter", 0)
    cl.user_session.set("score", 10)
    await cl.Message(content="你好 请介绍下你自己").send()
    result = await cl.AskActionMessage(
        content="请选择难度",
        actions=[
            cl.Action(
                id="easy",
                name="easy",
                value="easy",
                label="简单",
            ),
            cl.Action(
                id="medium",
                name="medium",
                value="medium",
                label="中等",
            ),
            cl.Action(
                id="hard",
                name="hard",
                value="hard",
                label="困难",
            ),
        ],
    ).send()
    cl.user_session.set("difficulty", result['label'])

@cl.set_chat_profiles
async def chat_profile(score=None):
    # Set current_number to score if score is not None, else set it to 10
    current_number = score if score is not None else 10
    return [
        # cl.Progress(
        #     current_number=current_number,
        #     total_number=100,
        # ),
    ]


def extract_last_bracket_number_and_preceding_text(text):
    # 使用正则表达式匹配最后一个[]及其内部的数字
    match = re.search(r'\[(\d+)\](?!.*\[\d+\])', text)
    if match:
        number = match.group(1)  # 获取匹配到的数字
        preceding_text = text[:match.start()]  # 获取数字前的所有内容
        return int(number), preceding_text
    else:
        return None, text  # 如果没有匹配到，返回None和原文本

@cl.on_message
async def on_message(message: cl.Message):
    counter = cl.user_session.get("counter") + 1
    cl.user_session.set("counter", counter)
    user_input = message.content

    msg = cl.Message(content="")
    await msg.set_round(counter)
    await msg.send()

    stream = await client.chat.completions.create(
        model="moonshot-v1-8k",
        messages=[
            {"role": "system", "content": cl.user_session.get("prompt")},
            {"role": "user", "content": user_input}
        ],
        temperature=0,
        stream = True,
    )
    async for part in stream:
        if token := part.choices[0].delta.content :  # Assuming `.text` or similar attribute holds the response part
            await msg.stream_token(token)

    await msg.send_with_score()
    
    score,result = extract_last_bracket_number_and_preceding_text(msg.content)
    await msg.set_score(await msg.get_score()+score - difficulty/2)