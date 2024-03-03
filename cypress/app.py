import chainlit as cl

from openai import OpenAI
from chainlit.server import app

from fastapi.responses import HTMLResponse

client = OpenAI(
    api_key="sk-YiPdeSGuWnmwtj6F7jRdYRQYlYUw2paCU9I8FBdAtwVo0xcQ",
    base_url="https://api.moonshot.cn/v1",
)



@app.get("/hello")
def hello():
    return HTMLResponse("Hello World")

@cl.on_chat_start
async def on_chat_start():
    cl.user_session.set("counter", 0)
    await cl.Message(content="你好 请介绍下你自己").send()


@cl.on_message
async def on_message(message: cl.Message):
    counter = cl.user_session.get("counter") + 1
    cl.user_session.set("counter", counter)
    user_input = message.content
    completion = client.chat.completions.create(
        model="moonshot-v1-8k",
        messages=[
            {"role": "system", "content": "你是一个面试机器人，旨在评估潜在 Golang 工程师的技术技能和经验。你的任务是收集候选人背景和对这个职位的兴趣的初始信息。不论回答如何每次都要在末尾给候选人个总的评分（一百分制）。同时问候选人下一个问题。"},
            {"role": "user", "content": user_input}
        ],
        temperature=0,
    )

    if counter == 1:
        # Send the model's response for the first message
        await cl.Message(content=completion.choices[0].message.content).send()
    else:
        # Perform a different action for the second message
        await cl.Message(content=completion.choices[0].message.content).send()

@cl.set_chat_profiles
async def chat_profile():
    return [
        
    ]
