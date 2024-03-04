import asyncio
import json
import uuid
from datetime import datetime
from typing import Any, Dict, Literal

from chainlit.action import Action
from chainlit.auth import get_current_user, require_login
from chainlit.config import config
from chainlit.context import init_ws_context
from chainlit.data import get_data_layer
from chainlit.logger import logger
from chainlit.message import ErrorMessage, Message
from chainlit.server import socket
from chainlit.session import WebsocketSession
from chainlit.telemetry import trace_event
from chainlit.types import UIMessagePayload
from chainlit.user_session import user_sessions


def restore_existing_session(sid, session_id, emit_fn, emit_call_fn):
    """Restore a session from the sessionId provided by the client."""
    if session := WebsocketSession.get_by_id(session_id):
        session.restore(new_socket_id=sid)
        session.emit = emit_fn
        session.emit_call = emit_call_fn
        trace_event("session_restored")
        return True
    return False


async def persist_user_session(thread_id: str, metadata: Dict):
    if data_layer := get_data_layer():
        await data_layer.update_thread(thread_id=thread_id, metadata=metadata)


async def resume_thread(session: WebsocketSession):
    data_layer = get_data_layer()
    if not data_layer or not session.user or not session.thread_id_to_resume:
        return
    thread = await data_layer.get_thread(thread_id=session.thread_id_to_resume)
    if not thread:
        return

    author = thread.get("user").get("identifier") if thread["user"] else None
    user_is_author = author == session.user.identifier

    if user_is_author:
        metadata = thread.get("metadata", {})
        user_sessions[session.id] = metadata.copy()
        if chat_profile := metadata.get("chat_profile"):
            session.chat_profile = chat_profile
        if chat_settings := metadata.get("chat_settings"):
            session.chat_settings = chat_settings

        trace_event("thread_resumed")

        return thread


def load_user_env(user_env):
    # Check user env
    if config.project.user_env:
        # Check if requested user environment variables are provided
        if user_env:
            user_env = json.loads(user_env)
            for key in config.project.user_env:
                if key not in user_env:
                    trace_event("missing_user_env")
                    raise ConnectionRefusedError(
                        "Missing user environment variable: " + key
                    )
        else:
            raise ConnectionRefusedError("Missing user environment variables")
    return user_env


def build_anon_user_identifier(environ):
    scope = environ.get("asgi.scope", {})
    client_ip, _ = scope.get("client")
    ip = environ.get("HTTP_X_FORWARDED_FOR", client_ip)

    try:
        headers = scope.get("headers", {})
        user_agent = next(
            (v.decode("utf-8") for k, v in headers if k.decode("utf-8") == "user-agent")
        )
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, user_agent + ip))

    except StopIteration:
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, ip))


@socket.on("connect")
async def connect(sid, environ, auth):
    if not config.code.on_chat_start and not config.code.on_message:
        logger.warning(
            "You need to configure at least an on_chat_start or an on_message callback"
        )
        return False
    user = None
    token = None
    login_required = require_login()
    try:
        # Check if the authentication is required
        if login_required:
            authorization_header = environ.get("HTTP_AUTHORIZATION")
            token = authorization_header.split(" ")[1] if authorization_header else None
            user = await get_current_user(token=token)
    except Exception as e:
        logger.info("Authentication failed")
        return False

    # Session scoped function to emit to the client
    def emit_fn(event, data):
        if session := WebsocketSession.get(sid):
            if session.should_stop:
                session.should_stop = False
                raise InterruptedError("Task stopped by user")
        return socket.emit(event, data, to=sid)

    # Session scoped function to emit to the client and wait for a response
    def emit_call_fn(event: Literal["ask", "call_fn"], data, timeout):
        if session := WebsocketSession.get(sid):
            if session.should_stop:
                session.should_stop = False
                raise InterruptedError("Task stopped by user")
        return socket.call(event, data, timeout=timeout, to=sid)

    session_id = environ.get("HTTP_X_CHAINLIT_SESSION_ID")
    if restore_existing_session(sid, session_id, emit_fn, emit_call_fn):
        return True

    user_env_string = environ.get("HTTP_USER_ENV")
    user_env = load_user_env(user_env_string)

    client_type = environ.get("HTTP_X_CHAINLIT_CLIENT_TYPE")

    ws_session = WebsocketSession(
        id=session_id,
        socket_id=sid,
        emit=emit_fn,
        emit_call=emit_call_fn,
        client_type=client_type,
        user_env=user_env,
        user=user,
        token=token,
        chat_profile=environ.get("HTTP_X_CHAINLIT_CHAT_PROFILE"),
        thread_id=environ.get("HTTP_X_CHAINLIT_THREAD_ID"),
    )


    trace_event("connection_successful")
    return True


@socket.on("connection_successful")
async def connection_successful(sid):
    context = init_ws_context(sid)

    if context.session.restored:
        return

    await context.emitter.task_end()
    await context.emitter.clear("clear_ask")
    await context.emitter.clear("clear_call_fn")

    if context.session.thread_id_to_resume and config.code.on_chat_resume:
        thread = await resume_thread(context.session)
        if thread:
            context.session.has_first_interaction = True
            await context.emitter.emit("first_interaction", "resume")
            await context.emitter.resume_thread(thread)
            await config.code.on_chat_resume(thread)
            return

    if config.code.on_chat_start:
        await config.code.on_chat_start()


@socket.on("clear_session")
async def clean_session(sid):
    await disconnect(sid, force_clear=True)


@socket.on("disconnect")
async def disconnect(sid, force_clear=False):
    session = WebsocketSession.get(sid)
    if session:
        init_ws_context(session)

    if config.code.on_chat_end and session:
        await config.code.on_chat_end()

    if session and session.thread_id and session.has_first_interaction:
        await persist_user_session(session.thread_id, session.to_persistable())

    def clear():
        if session := WebsocketSession.get(sid):
            # Clean up the user session
            if session.id in user_sessions:
                user_sessions.pop(session.id)
            # Clean up the session
            session.delete()

    async def clear_on_timeout(sid):
        await asyncio.sleep(config.project.session_timeout)
        clear()

    if force_clear:
        clear()
    else:
        asyncio.ensure_future(clear_on_timeout(sid))


@socket.on("stop")
async def stop(sid):
    if session := WebsocketSession.get(sid):
        trace_event("stop_task")

        init_ws_context(session)
        await Message(
            author="System", content="Task stopped by the user.", disable_feedback=True
        ).send()

        session.should_stop = True

        if config.code.on_stop:
            await config.code.on_stop()


async def process_message(session: WebsocketSession, payload: UIMessagePayload):
    """Process a message from the user."""
    try:
        context = init_ws_context(session)
        await context.emitter.task_start()
        message = await context.emitter.process_user_message(payload)

        if config.code.on_message:
            await config.code.on_message(message)
    except InterruptedError:
        pass
    except Exception as e:
        logger.exception(e)
        await ErrorMessage(
            author="Error", content=str(e) or e.__class__.__name__
        ).send()
    finally:
        await context.emitter.task_end()

@socket.on('select_senario')
async def handle_route_change(self, sid, id,career,difficulty):
    """Handle select senario events and set up the prompt based on the route."""
    # Example: Determine the prompt based on route_info['route'] or route_info['context']

    context = init_ws_context(sid)

    if context.session.restored:
        return
    
    prompt = self.determine_prompt(id,career,difficulty)
    session = WebsocketSession.require(sid)

    session.career = career
    
    # Store the prompt in the session or pass it to the message handling logic
    session.current_prompt = prompt
    
    logger.info(f"Route changed to {id}. Prompt set to: {prompt}")

def switch_difficulty(difficulty):
    if difficulty == "easy":
        return 40
    elif difficulty == "medium":
        return 30
    elif difficulty == "hard":
        return 20
    return 40

def determine_prompt(self, id,career,difficulty_value):

    """Determine the message prompt based on route information."""
    # Example logic to determine the prompt
    difficulty = switch_difficulty(difficulty_value)
    difficulty_v1 = difficulty * 0.4
    difficulty_v2 = difficulty * 0.3
    difficulty_v3 = difficulty * 0.2
    difficulty_v4 = difficulty * 0.1
    
    if id == 1:
        return '''你是一个高级面试机器人，专为评估潜在的{career}的技术能力、编程经验以及对待工作的态度而设计。
            你的主要任务是通过一系列设计精良的问题，深入了解候选人的技术背景、解决问题的能力、以往的项目经验以及他们对于这个职位的兴趣和热情。
            在收集到的信息基础上，你需要综合考虑，按照0到{difficulty}的分数范围给出一个总体评分，这个评分应反映候选人的综合实力和这个职位的契合度。
            此外，每次回答之后，你需要根据候选人的回答内容和质量，提出一个新的、更深入的问题，以进一步评估候选人的能力。
            在进行评分时，请遵循以下标准：
            - 技术能力（0到{difficulty_v1}分）：考察候选人对Golang语言的掌握程度，包括语法、并发处理、内存管理等方面。候选人的答案如果显示出对基础概念的误解，可能会得到负分。
            - 项目经验（0到{difficulty_v2}分）：评估候选人过往参与的项目，特别是在Golang相关项目中的角色、贡献和解决问题的能力。如果候选人无法提供具体的经验或项目细节，或者示例不相关，可能会得到负分。
            - 沟通能力和问题解决能力（0到{difficulty_v3}分）：通过候选人对问题的回答，评价其逻辑思维、沟通表达和问题解决的能力。如果候选人在沟通上存在明显问题，如回避问题或答非所问，可能会得到负分。
            - 对职位的兴趣和热情（0到{difficulty_v4}分）：了解候选人对这个Golang工程师职位的兴趣程度以及他们对未来工作的热情和期待。缺乏热情或兴趣的表现可能会导致负分。

            请在完成一系列问答后，根据上述评分标准，综合候选人的回答内容，给出一个总体评分，以 [分数] 的形式放到答复的末尾。例如，如果总分为5分，则在回答结束后添加 [5]。同时，请提出下一个问题，以持续评估候选人的能力。'''
    else:
        return "Default prompt"

@socket.on("ui_message")
async def message(sid, payload: UIMessagePayload):
    """Handle a message sent by the User."""
    session = WebsocketSession.require(sid)
    session.should_stop = False

    await process_message(session, payload)



async def process_action(action: Action):
    callback = config.code.action_callbacks.get(action.name)
    if callback:
        res = await callback(action)
        return res
    else:
        logger.warning("No callback found for action %s", action.name)


@socket.on("action_call")
async def call_action(sid, action):
    """Handle an action call from the UI."""
    context = init_ws_context(sid)

    action = Action(**action)

    try:
        res = await process_action(action)
        await context.emitter.send_action_response(
            id=action.id, status=True, response=res if isinstance(res, str) else None
        )

    except InterruptedError:
        await context.emitter.send_action_response(
            id=action.id, status=False, response="Action interrupted by the user"
        )
    except Exception as e:
        logger.exception(e)
        await context.emitter.send_action_response(
            id=action.id, status=False, response="An error occured"
        )


@socket.on("chat_settings_change")
async def change_settings(sid, settings: Dict[str, Any]):
    """Handle change settings submit from the UI."""
    context = init_ws_context(sid)

    for key, value in settings.items():
        context.session.chat_settings[key] = value

    if config.code.on_settings_update:
        await config.code.on_settings_update(settings)
