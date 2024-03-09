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
    api_key="sk-wo0dUHqciCSIALiSSCI3Q4ZQ40TQEogFA7r390pisJUCjA5X",
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
    cl.user_session.set("score", 0)
    cl.user_session.set("total_score", 0)
    await cl.Message(content="你好 请介绍下你自己").send()

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
    if(message.type == "init_message"):

        prompt = determine_prompt(message.scene,message.difficulty)
        grade_prompt = determine_grade_prompt(message.scene,message.difficulty)
        cl.user_session.set("current_prompt", prompt)
        cl.user_session.set("grade_prompt", grade_prompt)
    else:
        if(message.type == "user_message"):
            counter = cl.user_session.get("counter") + 1
            cl.user_session.set("counter", counter)

        user_input = message.content

        msg = cl.Message(content="")
        await msg.set_round(counter)
        await msg.send()
        stream = await client.chat.completions.create(
            model="moonshot-v1-8k",
            messages=[
                {"role": "system", "content": cl.user_session.get("current_prompt")},
                {"role": "user", "content": user_input}
            ],
            temperature=0,
            stream = True,
        )
        async for part in stream:
            if token := part.choices[0].delta.content :  # Assuming `.text` or similar attribute holds the response part
                await msg.stream_token(token)
        
        
        
        await msg.update()

        grade = await client.chat.completions.create(
            model="moonshot-v1-128k",
            messages=[
                {"role": "system", "content": cl.user_session.get("grade_prompt")},
                {"role": "user", "content": user_input}
            ],
            temperature=0,
            stream = False,
        )
        print(grade.choices[0].message.content)
        score,result = extract_last_bracket_number_and_preceding_text(grade.choices[0].message.content)
        
        score_msg = cl.Message(content="")
        cl.user_session.set("total_score", cl.user_session.get("total_score") + score )
        await score_msg.set_score(cl.user_session.get("total_score"))
        await score_msg.set_round(cl.user_session.get("counter"))
        score_msg.type = "score_message"
        await score_msg.send()
        
        


def switch_difficulty(difficulty):
    if difficulty == "easy":
        return "初级"
    elif difficulty == "medium":
        return "中级"
    elif difficulty == "hard":
        return "高级"
    return "初级"

def determine_prompt(id,difficulty_value):

    """Determine the message prompt based on route information."""
    # Example logic to determine the prompt
    difficulty = switch_difficulty(difficulty_value)

    
    if id == "1":
        return f'''你是一个高级面试机器人，专为评估潜在的{difficulty}GoLang工程师的技术能力、编程经验以及对待工作的态度而设计。
            你的主要任务是通过一系列设计精良的问题，深入了解候选人的技术背景、解决问题的能力、以往的项目经验以及他们对于这个职位的兴趣和热情。
            此外，每次回答之后，你需要根据候选人的回答内容和质量，提出一个新的、更深入的问题，以进一步评估候选人的能力。'''
    else:
        return "Default prompt"

def determine_grade_prompt(id,difficulty_value):

    difficulty = switch_difficulty(difficulty_value)
    """Determine the message prompt based on route information."""
    # Example logic to determine the prompt
    
    if id == "1":
        return f'''
            在收集到的信息基础上，你需要综合考虑，按照0到10的分数范围给出一个总体评分，这个评分应反映候选人的综合实力和{difficulty}GoLang工程师的契合度。
            在进行评分时，请遵循以下标准：
            - 技术能力（0到4分）：考察候选人对Golang语言的掌握程度，包括语法、并发处理、内存管理等方面。候选人的答案如果显示出对基础概念的误解，可能会得到0分。
            - 项目经验（0到3分）：评估候选人过往参与的项目，特别是在Golang相关项目中的角色、贡献和解决问题的能力。如果候选人无法提供具体的经验或项目细节，或者示例不相关，可能会得到0分。
            - 沟通能力和问题解决能力（0到2分）：通过候选人对问题的回答，评价其逻辑思维、沟通表达和问题解决的能力。如果候选人在沟通上存在明显问题，如回避问题或答非所问，可能会得到0分。
            - 对职位的兴趣和热情（0到1分）：了解候选人对这个Golang工程师职位的兴趣程度以及他们对未来工作的热情和期待。缺乏热情或兴趣的表现可能会导致0分。
            - 如果没有任何信息或者信息不相关 回答[0]
            请在完成一系列问答后，根据上述评分标准，综合候选人的回答内容，仅仅给出一个总体评分，以 [分数] 的形式放到答复的末尾。例如，如果总分为5分，则仅仅回答[5]，不要回答除分数以外的任何话。'''
    else:
        return "Default prompt"