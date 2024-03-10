import * as recoil from 'recoil';
import { Socket } from 'socket.io-client';
export { Socket } from 'socket.io-client';
import * as lodash from 'lodash';
import * as swr__internal from 'swr/_internal';
import { SWRConfiguration } from 'swr';

interface IAction {
    description?: string;
    forId: string;
    id: string;
    label?: string;
    name: string;
    onClick: () => void;
    value: string;
    collapsed: boolean;
}
interface ICallFn {
    callback: (payload: Record<string, any>) => void;
    name: string;
    args: Record<string, any>;
}

type IElement = IImageElement | ITextElement | IPdfElement | IAvatarElement | ITasklistElement | IAudioElement | IVideoElement | IFileElement | IPlotlyElement;
type IMessageElement = IImageElement | ITextElement | IPdfElement | IAudioElement | IVideoElement | IFileElement | IPlotlyElement;
type ElementType = IElement['type'];
type IElementSize = 'small' | 'medium' | 'large';
interface TElement<T> {
    id: string;
    type: T;
    threadId?: string;
    forId: string;
    mime?: string;
    url?: string;
    chainlitKey?: string;
}
interface TMessageElement<T> extends TElement<T> {
    name: string;
    display: 'inline' | 'side' | 'page';
}
interface IImageElement extends TMessageElement<'image'> {
    size?: IElementSize;
}
interface IAvatarElement extends TElement<'avatar'> {
    name: string;
}
interface ITextElement extends TMessageElement<'text'> {
    language?: string;
}
interface IPdfElement extends TMessageElement<'pdf'> {
    page?: number;
}
interface IAudioElement extends TMessageElement<'audio'> {
}
interface IVideoElement extends TMessageElement<'video'> {
    size?: IElementSize;
}
interface IFileElement extends TMessageElement<'file'> {
    type: 'file';
}
interface IPlotlyElement extends TMessageElement<'plotly'> {
}
interface ITasklistElement extends TElement<'tasklist'> {
}

interface IFeedback {
    id?: string;
    forId?: string;
    comment?: string;
    strategy: 'BINARY';
    value: number;
}

type GenerationMessageRole = 'system' | 'assistant' | 'user' | 'function' | 'tool';
type ILLMSettings = Record<string, string | string[] | number | boolean>;
interface IGenerationMessage {
    content: string;
    role: GenerationMessageRole;
    name?: string;
}
interface IFunction {
    name: string;
    description: string;
    parameters: {
        required: string[];
        properties: Record<string, {
            title: string;
            type: string;
        }>;
    };
}
interface ITool {
    type: string;
    function: IFunction;
}
interface IBaseGeneration {
    provider: string;
    model?: string;
    error?: string;
    id?: string;
    variables?: Record<string, string>;
    tags?: string[];
    settings?: ILLMSettings;
    tools?: ITool[];
    tokenCount?: number;
}
interface ICompletionGeneration extends IBaseGeneration {
    type: 'COMPLETION';
    prompt?: string;
    completion?: string;
}
interface IChatGeneration extends IBaseGeneration {
    type: 'CHAT';
    messages?: IGenerationMessage[];
    messageCompletion?: IGenerationMessage;
}
type IGeneration = ICompletionGeneration | IChatGeneration;

type StepType = 'assistant_message' | 'user_message' | 'system_message' | 'run' | 'tool' | 'llm' | 'embedding' | 'retrieval' | 'rerank' | 'undefined';
interface IStep {
    id: string;
    name: string;
    type: StepType;
    threadId?: string;
    parentId?: string;
    isError?: boolean;
    showInput?: boolean | string;
    waitForAnswer?: boolean;
    input?: string;
    output: string;
    createdAt: number | string;
    start?: number | string;
    end?: number | string;
    disableFeedback?: boolean;
    feedback?: IFeedback;
    language?: string;
    streaming?: boolean;
    generation?: IGeneration;
    steps?: IStep[];
    indent?: number;
}

interface FileSpec {
    accept?: string[] | Record<string, string[]>;
    max_size_mb?: number;
    max_files?: number;
}
interface ActionSpec {
    keys?: string[];
}
interface IFileRef {
    id: string;
}
interface IAsk {
    callback: (payload: IStep | IFileRef[] | IAction) => void;
    spec: {
        type: 'text' | 'file' | 'action';
        timeout: number;
    } & FileSpec & ActionSpec;
}

type AuthProvider = 'credentials' | 'header' | 'github' | 'google' | 'azure-ad';
interface IUserMetadata extends Record<string, any> {
    tags?: string[];
    image?: string;
    provider?: AuthProvider;
}
interface IUser {
    id: string;
    identifier: string;
    metadata: IUserMetadata;
}

interface IThread {
    id: string;
    createdAt: number | string;
    name?: string;
    user?: IUser;
    metadata?: Record<string, any>;
    steps: IStep[];
    elements?: IElement[];
}

type UserInput = {
    content: string;
    createdAt: number;
};
type ThreadHistory = {
    threads?: IThread[];
    currentThreadId?: string;
    timeGroupedThreads?: {
        [key: string]: IThread[];
    };
    pageInfo?: IPageInfo;
};

interface IToken {
    id: number | string;
    token: string;
    isSequence: boolean;
}
declare const useChatData: () => {
    actions: IAction[];
    askUser: IAsk | undefined;
    avatars: IAvatarElement[];
    chatSettingsDefaultValue: any;
    chatSettingsInputs: any;
    chatSettingsValue: any;
    connected: boolean | undefined;
    disabled: boolean;
    elements: IMessageElement[];
    error: boolean | undefined;
    loading: boolean;
    tasklists: ITasklistElement[];
};

declare const useAuth: (apiClient: ChainlitAPI) => {
    data: {
        requireLogin: boolean;
        passwordAuth: boolean;
        headerAuth: boolean;
        oauthProviders: string[];
    };
    user: null;
    isReady: boolean;
    isAuthenticated: boolean;
    accessToken: string;
    logout: () => void;
    setAccessToken: () => void;
} | {
    data: {
        requireLogin: boolean;
        passwordAuth: boolean;
        headerAuth: boolean;
        oauthProviders: string[];
    } | undefined;
    user: IUser | null;
    isAuthenticated: boolean;
    isReady: boolean;
    accessToken: string | undefined;
    logout: () => Promise<void>;
    setAccessToken: (token: string | null | undefined) => void;
};

declare const fetcher: (client: ChainlitAPI, endpoint: string, token?: string) => Promise<any>;
declare function useApi<T>(client: ChainlitAPI, path?: string | null, options?: SWRConfiguration): swr__internal.SWRResponse<T, Error, Partial<swr__internal.PublicConfiguration<T, Error, swr__internal.BareFetcher<T>>> | undefined>;

interface IThreadFilters {
    search?: string;
    feedback?: number;
}
interface IPageInfo {
    hasNextPage: boolean;
    endCursor?: string;
}
interface IPagination {
    first: number;
    cursor?: string | number;
}
declare class ClientError extends Error {
    detail?: string;
    constructor(message: string, detail?: string);
    toString(): string;
}
type Payload = FormData | any;
declare class APIBase {
    httpEndpoint: string;
    type: 'app' | 'copilot' | 'teams' | 'slack';
    on401?: (() => void) | undefined;
    onError?: ((error: ClientError) => void) | undefined;
    constructor(httpEndpoint: string, type: 'app' | 'copilot' | 'teams' | 'slack', on401?: (() => void) | undefined, onError?: ((error: ClientError) => void) | undefined);
    buildEndpoint(path: string): string;
    checkToken(token: string): string;
    fetch(method: string, path: string, token?: string, data?: Payload, signal?: AbortSignal): Promise<Response>;
    get(endpoint: string, token?: string): Promise<Response>;
    post(endpoint: string, data: Payload, token?: string, signal?: AbortSignal): Promise<Response>;
    put(endpoint: string, data: Payload, token?: string): Promise<Response>;
    patch(endpoint: string, data: Payload, token?: string): Promise<Response>;
    delete(endpoint: string, data: Payload, token?: string): Promise<Response>;
}
declare class ChainlitAPI extends APIBase {
    headerAuth(): Promise<any>;
    passwordAuth(data: FormData): Promise<any>;
    logout(): Promise<any>;
    getGeneration(generation: IGeneration, userEnv: {} | undefined, controller: AbortController, accessToken?: string, tokenCb?: (done: boolean, token: string) => void): Promise<ReadableStream<any>>;
    setFeedback(feedback: IFeedback, accessToken?: string): Promise<{
        success: boolean;
        feedbackId: string;
    }>;
    listThreads(pagination: IPagination, filter: IThreadFilters, accessToken?: string): Promise<{
        pageInfo: IPageInfo;
        data: IThread[];
    }>;
    deleteThread(threadId: string, accessToken?: string): Promise<any>;
    uploadFile(file: File, onProgress: (progress: number) => void, sessionId: string, token?: string): {
        xhr: XMLHttpRequest;
        promise: Promise<{
            id: string;
        }>;
    };
    getElementUrl(id: string, sessionId: string): string;
    getLogoEndpoint(theme: string): string;
    getOAuthEndpoint(provider: string): string;
}

declare const useChatInteract: () => {
    uploadFile: (client: ChainlitAPI, file: File, onProgress: (progress: number) => void) => {
        xhr: XMLHttpRequest;
        promise: Promise<{
            id: string;
        }>;
    };
    callAction: (action: IAction) => Promise<{
        id: string;
        status: boolean;
        response?: string | undefined;
    }> | undefined;
    clear: () => void;
    replyMessage: (message: IStep) => void;
    sendMessage: (message: IStep, fileReferences?: IFileRef[]) => void;
    stopTask: () => void;
    setIdToResume: recoil.SetterOrUpdater<string | undefined>;
    updateChatSettings: (values: object) => void;
};

declare const useChatMessages: () => {
    messages: IStep[];
    firstInteraction: string | undefined;
};

interface ISession {
    socket: Socket;
    error?: boolean;
}
declare const threadIdToResumeState: recoil.RecoilState<string | undefined>;
declare const chatProfileState: recoil.RecoilState<string | undefined>;
declare const sessionIdState: recoil.RecoilState<string>;
declare const sessionState: recoil.RecoilState<ISession | undefined>;
declare const actionState: recoil.RecoilState<IAction[]>;
declare const messagesState: recoil.RecoilState<IStep[]>;
declare const tokenCountState: recoil.RecoilState<number>;
declare const loadingState: recoil.RecoilState<boolean>;
declare const askUserState: recoil.RecoilState<IAsk | undefined>;
declare const callFnState: recoil.RecoilState<ICallFn | undefined>;
declare const chatSettingsInputsState: recoil.RecoilState<any>;
declare const chatSettingsDefaultValueSelector: recoil.RecoilValueReadOnly<any>;
declare const chatSettingsValueState: recoil.RecoilState<any>;
declare const elementState: recoil.RecoilState<IMessageElement[]>;
declare const avatarState: recoil.RecoilState<IAvatarElement[]>;
declare const tasklistState: recoil.RecoilState<ITasklistElement[]>;
declare const firstUserInteraction: recoil.RecoilState<string | undefined>;
declare const accessTokenState: recoil.RecoilState<string | undefined>;
declare const userState: recoil.RecoilState<IUser | null>;
declare const threadHistoryState: recoil.RecoilState<ThreadHistory | undefined>;

declare const useChatSession: () => {
    connect: lodash.DebouncedFunc<({ client, userEnv, accessToken }: {
        client: ChainlitAPI;
        userEnv: Record<string, string>;
        accessToken?: string | undefined;
    }) => void>;
    disconnect: () => void;
    session: ISession | undefined;
    chatProfile: string | undefined;
    idToResume: string | undefined;
    setChatProfile: recoil.SetterOrUpdater<string | undefined>;
};

declare const nestMessages: (messages: IStep[]) => IStep[];
declare const isLastMessage: (messages: IStep[], index: number) => boolean;
declare const addMessage: (messages: IStep[], message: IStep) => IStep[];
declare const addMessageToParent: (messages: IStep[], parentId: string, newMessage: IStep) => IStep[];
declare const hasMessageById: (messages: IStep[], messageId: string) => boolean;
declare const updateMessageById: (messages: IStep[], messageId: string, updatedMessage: IStep) => IStep[];
declare const deleteMessageById: (messages: IStep[], messageId: string) => IStep[];
declare const updateMessageContentById: (messages: IStep[], messageId: number | string, updatedContent: string, isSequence: boolean) => IStep[];

export { APIBase, ActionSpec, AuthProvider, ChainlitAPI, ClientError, ElementType, FileSpec, GenerationMessageRole, IAction, IAsk, IAudioElement, IAvatarElement, IBaseGeneration, ICallFn, IChatGeneration, ICompletionGeneration, IElement, IElementSize, IFeedback, IFileElement, IFileRef, IFunction, IGeneration, IGenerationMessage, IImageElement, ILLMSettings, IMessageElement, IPageInfo, IPagination, IPdfElement, IPlotlyElement, ISession, IStep, ITasklistElement, ITextElement, IThread, IThreadFilters, IToken, ITool, IUser, IUserMetadata, IVideoElement, ThreadHistory, UserInput, accessTokenState, actionState, addMessage, addMessageToParent, askUserState, avatarState, callFnState, chatProfileState, chatSettingsDefaultValueSelector, chatSettingsInputsState, chatSettingsValueState, deleteMessageById, elementState, fetcher, firstUserInteraction, hasMessageById, isLastMessage, loadingState, messagesState, nestMessages, sessionIdState, sessionState, tasklistState, threadHistoryState, threadIdToResumeState, tokenCountState, updateMessageById, updateMessageContentById, useApi, useAuth, useChatData, useChatInteract, useChatMessages, useChatSession, userState };
