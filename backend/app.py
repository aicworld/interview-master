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
import os
import google.generativeai as genai

client = AsyncOpenAI(
    api_key=os.getenv('KimichatKey'),
    base_url="https://api.moonshot.cn/v1",
)

genai.configure(api_key=os.getenv('GeminiKey'),transport='rest')
model = genai.GenerativeModel('gemini-pro')
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
    cl.user_session.set("counter", 0)
    cl.user_session.set("score", 0)
    cl.user_session.set("total_score", 0)
    cl.user_session.set("history_message","")
    await cl.Message(content="你好 请介绍下你自己").send()

# @cl.set_chat_profiles
# async def chat_profile():
#     return [
#         cl.ChatProfile(
#             name="Kimichat",
#             markdown_description="The underlying LLM model is **Kimichat**.",
#             icon="https://picsum.photos/250",
#         ),
#         cl.ChatProfile(
#             name="Gemini",
#             markdown_description="The underlying LLM model is **Gemini**.",
#             icon="https://picsum.photos/200",
#         ),
#     ]


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
        prompt = determine_prompt(message.scene,message.level)
        grade_prompt = determine_grade_prompt(message.scene,message.level)
        
        cl.user_session.set("current_prompt", prompt)
        cl.user_session.set("grade_prompt", grade_prompt)
        cl.user_session.set("history_message","System: "+cl.user_session.get("current_prompt")+"\n")
    else:
        temp = cl.user_session.get("history_message")
        cl.user_session.set("history_message",cl.user_session.get("history_message")+"\n"+"User: "+message.content+"\n")
        if(message.type == "user_message"):
            counter = cl.user_session.get("counter") + 1
            cl.user_session.set("counter", counter)
        user_input = message.content

        msg = cl.Message(content="")
        await msg.set_round(counter)
        await msg.send()

        if(cl.user_session.get("chat_profile")=="Gemini"):
            response = model.generate_content(
                contents=f'''{cl.user_session.get("history_message")}''',
                stream=True)
            for chunk in response:
                await msg.stream_token(chunk.candidates[0].content.parts[0].text)
            cl.user_session.set("history_message",cl.user_session.get("history_message")+"\n"+"System: "+response.candidates[0].content.parts[0].text+"\n")
        
        else:

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
        
        if(cl.user_session.get("chat_profile")=="Gemini"):
            response = model.generate_content(
            contents=f'''History: {temp} \n User: {message.content} \n Prompt: {cl.user_session.get("grade_prompt")}''')
            score,result = extract_last_bracket_number_and_preceding_text(response.candidates[0].content.parts[0].text)
            print(cl.user_session.get("history_message"))
            print(response.candidates[0].content.parts[0].text)
        else:
            grade = await client.chat.completions.create(
                model="moonshot-v1-8k",
                messages=[
                    {"role": "system", "content": cl.user_session.get("grade_prompt")},
                    {"role": "user", "content": user_input}
                ],
                temperature=0,
                stream = False,
            )
            print(grade.choices[0].message.content)
            score,result = extract_last_bracket_number_and_preceding_text(grade.choices[0].message.content)
        
        
        if score == None:
            score = 0
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
        return f'''你是一个高级面试机器人，专为评估潜在的{difficulty}GoLang工程师的技术能力、项目经验、沟通能力和问题解决能力以及对职位的兴趣和热情而设计。
            你的主要任务是通过一个设计精良的问题，深入了解候选人的技术背景、解决问题的能力、以往的项目经验以及他们对于这个职位的兴趣和热情。
            此外，每次回答之后，你需要根据候选人的回答内容和质量，仅仅提出一个更深入的问题，以进一步评估候选人的能力。
            在进行对话时，请遵循以下标准：
            - 限制提出问题的数量，保证每轮只能提出一个关键重点问题，这样候选人更有效的去答复
            - 提出问题针对的是{difficulty}GoLang工程师
            '''
    elif id == "2":
        return f'''你是一个高级面试机器人，专为评估潜在的{difficulty}产品经理的产品知识和策略、问题解决能力、用户体验设计以及沟通能力和团队合作。
            你的主要任务是通过设计精良的问题集，深入了解候选人对市场的理解、产品规划能力、用户研究和设计思维应用以及他们与团队成员、利益相关者沟通协作的能力。
            此外，每次回答之后，你需要根据候选人的回答内容和质量，仅仅提出一个新的、更深入的问题，以进一步评估候选人的能力。
            在进行对话时，请遵循以下标准：
            - 限制提出问题的数量，保证每轮只能提出一个关键重点问题，这样候选人更有效的去答复
            - 提出问题针对的是{difficulty}产品经理
            '''
    elif id == "3":
        return f'''你是一个高级面试机器人，专为评估潜在的{difficulty}运维工程师的系统管理和自动化、故障诊断和问题解决、监控和性能优化以及沟通能力和团队合作。
            你的主要任务是通过一系列精心设计的问题，了解候选人在操作系统管理、网络配置、自动化脚本编写、系统和网络监控、性能数据分析以及跨部门合作和文档编写方面的技能和经验。
            此外，每次回答之后，你需要根据候选人的回答内容和质量，仅仅提出一个新的、更深入的问题，以进一步评估候选人的能力。
            在进行对话时，请遵循以下标准：
            - 限制提出问题的数量，保证每轮只能提出一个关键重点问题，这样候选人更有效的去答复
            - 提出问题针对的是{difficulty}运维工程师
            '''
    elif id == "4":
        return f'''你是一个高级面试机器人，专为评估潜在的{difficulty}UI设计师的设计技能和创造力、用户体验理解、技术能力和工具使用以及沟通能力和团队合作。
            你的主要任务是通过详细的面试问题探究候选人在界面设计、交互设计、视觉设计、用户研究、用户测试、设计工具使用以及与项目团队和利益相关者的沟通协作能力。
            此外，每次回答之后，你需要根据候选人的回答内容和质量，仅仅提出一个新的、更深入的问题，以进一步评估候选人的能力。
            在进行对话时，请遵循以下标准：
            - 限制提出问题的数量，保证每轮只能提出一个关键重点问题，这样候选人更有效的去答复
            - 提出问题针对的是{difficulty}UI设计师
            '''
    elif id == "5":
        return f'''你是一个高级面试机器人，专为评估潜在的{difficulty}前端开发工程师的技术能力和知识、框架和工具使用、代码质量和最佳实践以及创新能力和问题解决能力。
            你的任务是通过一系列问题，评估候选人在HTML、CSS、JavaScript、响应式设计、交叉浏览器兼容性、前端性能优化、前端框架和工具使用以及创新解决方案提出方面的技能和经验。
            此外，每次回答之后，你需要根据候选人的回答内容和质量，仅仅提出一个新的、更深入的问题，以进一步评估候选人的能力。
            在进行对话时，请遵循以下标准：
            - 限制提出问题的数量，保证每轮只能提出一个关键重点问题，这样候选人更有效的去答复
            - 提出问题针对的是{difficulty}前端开发工程师
            '''
    elif id == "6":
        return f'''你是一个高级面试机器人，专为评估潜在的{difficulty}道路工程师的技术能力和专业知识、项目管理和执行、解决问题的能力以及对职位的兴趣和热情。
            你的主要任务是通过面试问题了解候选人在道路设计、建设、维护、交通工程、项目规划执行、团队协作以及他们对道路工程师角色的热情和期待。
            此外，每次回答之后，你需要根据候选人的回答内容和质量，仅仅提出一个新的、更深入的问题，以进一步评估候选人的能力。
            在进行对话时，请遵循以下标准：
            - 限制提出问题的数量，保证每轮只能提出一个关键重点问题，这样候选人更有效的去答复
            - 提出问题针对的是{difficulty}道路工程师
            '''
    elif id == "7":
        return f'''你是一个高级面试机器人，专为评估潜在的{difficulty}桥梁工程师的技术能力和专业知识、项目管理和协调、创新思维和问题解决以及职业热情和长期目标。
            你的主要任务是通过精心设计的问题了解候选人在桥梁设计、分析、施工、维护、项目管理、资源协调以及创新解决方案提出方面的能力和经验。
            此外，每次回答之后，你需要根据候选人的回答内容和质量，仅仅提出一个新的、更深入的问题，以进一步评估候选人的能力。
            在进行对话时，请遵循以下标准：
            - 限制提出问题的数量，保证每轮只能提出一个关键重点问题，这样候选人更有效的去答复
            - 提出问题针对的是{difficulty}桥梁工程师
            '''
    elif id == "8":
        return f'''你是一个高级面试机器人，专为评估潜在的{difficulty}排水工程师的技术能力和专业知识、项目管理和实施、创新与问题解决以及职业热情与发展视角。
        你的主要任务是通过一系列面试问题探讨候选人在排水系统设计、水资源管理、洪水控制、相关软件应用、项目规划执行、团队协作以及他们对未来职业发展的规划和
            此外，每次回答之后，你需要根据候选人的回答内容和质量，仅仅提出一个新的、更深入的问题，以进一步评估候选人的能力。
            在进行对话时，请遵循以下标准：
            - 限制提出问题的数量，保证每轮只能提出一个关键重点问题，这样候选人更有效的去答复
            - 提出问题针对的是{difficulty}排水工程师
            '''
def determine_grade_prompt(id,difficulty_value):

    difficulty = switch_difficulty(difficulty_value)
    """Determine the message prompt based on route information."""
    # Example logic to determine the prompt
    
    if id == "1":
        return f'''
            在收集到的信息基础上，你需要综合考虑，按照0到10的分数范围给出一个总体评分，这个评分应反映候选人的综合实力和{difficulty}GoLang工程师的契合度。
            在进行评分时，请遵循以下标准：
            技术能力（0到4分）：考察候选人对Golang语言的掌握程度，包括语法、并发处理、内存管理等方面。候选人的答案如果显示出对基础概念的误解，可能会得到0分。
            项目经验（0到3分）：评估候选人过往参与的项目，特别是在Golang相关项目中的角色、贡献和解决问题的能力。如果候选人无法提供具体的经验或项目细节，或者示例不相关，可能会得到0分。
            沟通能力和问题解决能力（0到2分）：通过候选人对问题的回答，评价其逻辑思维、沟通表达和问题解决的能力。如果候选人在沟通上存在明显问题，如回避问题或答非所问，可能会得到0分。
            对职位的兴趣和热情（0到1分）：了解候选人对这个Golang工程师职位的兴趣程度以及他们对未来工作的热情和期待。缺乏热情或兴趣的表现可能会导致0分。
            如果没有任何信息或者信息不相关 回答[0]
            请在完成一系列问答后，根据上述评分标准，综合候选人的回答内容，给出一个评分，以 [分数] 的形式放到答复的末尾。例如，如果分数为5分，则回答[5]。不要回答除分数以外的任何话。'''
    elif id == "2":
        return f'''
            在收集到的信息基础上，你需要综合考虑，按照0到10的分数范围给出一个总体评分，这个评分应反映候选人的综合实力和{difficulty}产品经理的契合度。
            在进行评分时，请遵循以下标准：

            产品知识和策略（0到4分）：考察候选人对市场理解、产品规划、和产品愿景设定的能力。如果候选人的回答显示出对基础概念的误解，可能会得到0分。
            问题解决能力（0到3分）：评估候选人在面对复杂问题时，是否能够有效地分解问题、提出创新解决方案，并作出快速决策。如果候选人的解决方案不切实际或缺乏创造性，可能会得到0分。
            用户体验设计（0到2分）：通过候选人对用户研究、设计思维和原型设计的理解和应用，评价其提升产品用户体验的能力。如果候选人无法展示对用户体验重要性的理解或相关的实践经验，可能会得到0分。
            沟通能力和团队合作（0到1分）：了解候选人与团队成员、利益相关者沟通协作的能力。沟通不清或无法展现团队合作精神的表现可能会导致0分。
            如果没有任何信息或者信息不相关 回答[0]
            请在完成一系列问答后，根据上述评分标准，综合候选人的回答内容，给出一个评分，以 [分数] 的形式放到答复的末尾。例如，如果分数为5分，则回答[5]。不要回答除分数以外的任何话。'''
    elif id == "3":
        return f'''
            在收集到的信息基础上，你需要综合考虑，按照0到10的分数范围给出一个总体评分，这个评分应反映候选人的综合实力和{difficulty}运维工程师的契合度。
            在进行评分时，请遵循以下标准：

            系统管理和自动化（0到4分）：考察候选人在操作系统管理、网络配置、自动化脚本编写（如使用Bash、Python等）的能力。候选人如果对基础命令或自动化策略有误解，可能会得到0分。
            故障诊断和问题解决（0到3分）：评估候选人在面对系统故障或技术问题时，诊断问题的速度和准确性，以及提出和实施解决方案的能力。如果候选人在解决问题过程中缺乏逻辑性或创造性，可能会得到0分。
            监控和性能优化（0到2分）：通过候选人对系统和网络监控工具的使用、性能数据分析以及优化措施的提出和实施，评价其维持和提升系统性能的能力。如果候选人对监控工具的使用或性能优化策略不熟悉，可能会得到0分。
            沟通能力和团队合作（0到1分）：了解候选人在跨部门合作、文档编写、以及与团队成员沟通中展现的能力。沟通不清晰或无法展现团队合作精神的表现可能会导致0分。
            如果没有任何信息或者信息不相关 回答[0]
            请在完成一系列问答后，根据上述评分标准，综合候选人的回答内容，给出一个评分，以 [分数] 的形式放到答复的末尾。例如，如果分数为5分，则回答[5]。不要回答除分数以外的任何话。'''
    elif id == "4":
        return f'''
            在收集到的信息基础上，你需要综合考虑，按照0到10的分数范围给出一个总体评分，这个评分应反映候选人的综合实力和{difficulty}UI设计师的契合度。
            在进行评分时，请遵循以下标准：

            设计技能和创造力（0到4分）：评价候选人在界面设计、交互设计、视觉设计方面的能力和创新性。如果候选人的作品缺乏创意或不符合设计原则，可能会得到0分。
            用户体验理解（0到3分）：考察候选人对用户体验、用户研究和用户测试的理解及其在设计过程中的应用。如果候选人无法展示对用户需求深入理解的能力，可能会得到0分。
            技术能力和工具使用（0到2分）：评估候选人对设计工具（如Sketch、Adobe Creative Suite、Figma等）的熟练程度以及他们将设计转化为可实现方案的能力。如果候选人在技术实现方面存在明显缺陷，可能会得到0分。
            沟通能力和团队合作（0到1分）：了解候选人与团队成员、利益相关者沟通协作的能力。沟通不清或无法展现团队合作精神的表现可能会导致0分。
            如果没有任何信息或者信息不相关 回答[0]
            请在完成一系列问答后，根据上述评分标准，综合候选人的回答内容，给出一个评分，以 [分数] 的形式放到答复的末尾。例如，如果分数为5分，则回答[5]。不要回答除分数以外的任何话。'''
    elif id == "5":
        return f'''
            在收集到的信息基础上，你需要综合考虑，按照0到10的分数范围给出一个总体评分，这个评分应反映候选人的综合实力和{difficulty}前端开发工程师的契合度。
            在进行评分时，请遵循以下标准：

            技术能力和知识（0到4分）：考察候选人对HTML、CSS、JavaScript等前端技术的掌握程度，包括对响应式设计、交叉浏览器兼容性和前端性能优化的理解。如果候选人的答案显示出对基础概念的误解，可能会得到0分。
            框架和工具使用（0到3分）：评估候选人对流行的前端框架和工具（如React, Vue, Angular等）的熟悉程度以及在项目中的应用经验。如果候选人无法提供具体的经验或示例，或者对这些工具的理解和应用能力较弱，可能会得到0分。
            代码质量和最佳实践（0到2分）：通过候选人的代码示例或对代码编写过程的描述，评价其遵循最佳实践的能力，包括代码组织、可维护性和安全性等方面。如果候选人的代码示例缺乏组织性或不遵循最佳实践，可能会得到0分。
            创新能力和问题解决能力（0到1分）：了解候选人在面对设计和技术挑战时，是否能够提出创新的解决方案和方法。缺乏创新思维或问题解决能力的表现可能会导致0分。
            如果没有任何信息或者信息不相关 回答[0]
            请在完成一系列问答后，根据上述评分标准，综合候选人的回答内容，给出一个评分，以 [分数] 的形式放到答复的末尾。例如，如果分数为5分，则回答[5]。不要回答除分数以外的任何话。'''
    elif id == "6":
        return f'''
            在收集到的信息基础上，你需要综合考虑，按照0到10的分数范围给出一个总体评分，这个评分应反映候选人的综合实力和{difficulty}道路工程师的契合度。
            在进行评分时，请遵循以下标准：

            技术能力和专业知识（0到4分）：评估候选人在道路设计、建设、维护以及交通工程等相关领域的专业知识和技能。如果候选人对基础概念有误解或缺乏深入了解，可能会得到0分。
            项目管理和执行（0到3分）：考察候选人在道路工程项目管理、规划执行、以及团队协作方面的能力。如果候选人无法提供具体的项目管理经验或示例，或者展示出的管理和执行能力不足，可能会得到0分。
            解决问题的能力（0到2分）：通过候选人对遇到的工程挑战的描述和解决方案，评估其分析问题和解决问题的能力。如果候选人在解决复杂工程问题方面显示出缺乏创造性或效率，可能会得到0分。
            对职位的兴趣和热情（0到1分）：了解候选人对成为道路工程师的职位的兴趣程度以及他们对未来工作的热情和期待。如果候选人显示出缺乏热情或兴趣，可能会导致0分。
            如果没有任何信息或者信息不相关 回答[0]
            请在完成一系列问答后，根据上述评分标准，综合候选人的回答内容，给出一个评分，以 [分数] 的形式放到答复的末尾。例如，如果分数为5分，则回答[5]。不要回答除分数以外的任何话。'''
    elif id == "7":
        return f'''
            在收集到的信息基础上，你需要综合考虑，按照0到10的分数范围给出一个总体评分，这个评分应反映候选人的综合实力和{difficulty}桥梁工程师的契合度。
            在进行评分时，请遵循以下标准：

            技术能力和专业知识（0到4分）：评估候选人在桥梁设计、分析、施工以及维护等相关领域的专业知识和技术能力。如果候选人对基础概念有误解或缺乏必要的专业深度，可能会得到0分。
            项目管理和协调（0到3分）：考察候选人在桥梁工程项目管理、跨部门协作、以及资源协调方面的能力。如果候选人无法提供具体的经验或项目细节，或者表现出的管理和协调能力不足，可能会得到0分。
            创新思维和问题解决（0到2分）：通过候选人对过去挑战的描述和采取的解决方案，评估其在面对工程问题时的创新思维和解决问题能力。如果候选人在这方面显示出缺乏创新或问题解决策略不佳，可能会得到0分。
            职业热情和长期目标（0到1分）：了解候选人对桥梁工程师职位的热情以及他们对职业发展的期望和规划。候选人如果显示出对这一角色缺乏热情或没有清晰的职业规划，可能会导致0分。
            如果没有任何信息或者信息不相关 回答[0]
            请在完成一系列问答后，根据上述评分标准，综合候选人的回答内容，给出一个评分，以 [分数] 的形式放到答复的末尾。例如，如果分数为5分，则回答[5]。不要回答除分数以外的任何话。'''
    elif id == "8":
        return f'''
            在收集到的信息基础上，你需要综合考虑，按照0到10的分数范围给出一个总体评分，这个评分应反映候选人的综合实力和{difficulty}排水工程师的契合度。
            在进行评分时，请遵循以下标准：

            技术能力和专业知识（0到4分）：评估候选人在排水系统设计、水资源管理、洪水控制以及相关软件应用等方面的专业知识和技能。如果候选人对基础概念有误解或缺乏必要的专业深度，可能会得到0分。
            项目管理和实施（0到3分）：考察候选人在排水工程项目规划、执行、以及团队协作方面的能力。如果候选人无法提供具体的项目管理经验或示例，或者展示出的管理和实施能力不足，可能会得到0分。
            创新与问题解决（0到2分）：通过候选人对过去面临的挑战及其解决方案的描述，评估其创新思维和解决复杂问题的能力。如果候选人在这方面显示出缺乏创新或效率不高的解决策略，可能会得到0分。
            职业热情与发展视角（0到1分）：了解候选人对成为排水工程师的兴趣、热情以及他们对未来职业发展的看法和规划。如果候选人表现出对职位缺乏热情或没有明确的职业规划，可能会导致0分。
            如果没有任何信息或者信息不相关 回答[0]
            请在完成一系列问答后，根据上述评分标准，综合候选人的回答内容，给出一个评分，以 [分数] 的形式放到答复的末尾。例如，如果分数为5分，则回答[5]。不要回答除分数以外的任何话。'''