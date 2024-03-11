import { RuleNames } from 'react-password-checklist';
import * as react from 'react';
import { ReactElement, Component, ErrorInfo, ReactNode } from 'react';
import { ButtonProps } from '@mui/material/Button';
import { SliderProps } from '@mui/material/Slider';
import { TextFieldProps } from '@mui/material/TextField';
import * as _mui_material from '@mui/material';
import { SxProps, BreakpointsOptions } from '@mui/material';
import { SelectProps, SelectChangeEvent } from '@mui/material/Select';
import * as react_dropzone from 'react-dropzone';
import { FileWithPath, DropzoneOptions } from 'react-dropzone';
import { IconButtonProps } from '@mui/material/IconButton';

type AuthLoginProps = {
    title: string;
    error?: string;
    providers: string[];
    callbackUrl: string;
    onPasswordSignIn?: (email: string, password: string, callbackUrl: string) => Promise<any>;
    onOAuthSignIn?: (provider: string, callbackUrl: string) => Promise<any>;
    onSignUp?: (email: string, password: string, callbackUrl: string) => Promise<any>;
    onForgotPassword?: () => Promise<any>;
    renderLogo?: React.ReactElement;
    passwordChecklistSettings?: {
        rules: RuleNames[];
        messages?: Partial<Record<RuleNames, string>>;
        minLength?: number;
        maxLength?: number;
    };
};
declare const AuthLogin: ({ title, error, providers, callbackUrl, onPasswordSignIn, onOAuthSignIn, onForgotPassword, onSignUp, renderLogo, passwordChecklistSettings }: AuthLoginProps) => JSX.Element;

interface AuthForgotPasswordProps {
    onGoBack: () => void;
    onContinue: (value: string) => Promise<void>;
}
declare const AuthForgotPassword: ({ onGoBack, onContinue }: AuthForgotPasswordProps) => JSX.Element;

interface AuthResetPasswordProps {
    callbackUrl: string;
    onResetPassword: (email: string, token: string, callbackUrl: string) => Promise<any>;
    renderLogo?: ReactElement;
    title: string;
    token: string;
}
declare const AuthResetPassword: ({ callbackUrl, onResetPassword, renderLogo, title, token }: AuthResetPasswordProps) => JSX.Element;

interface AuthVerifyEmailProps {
    email: string;
    onGoBack: () => void;
    onResend: (value: string) => Promise<void>;
}
declare const AuthVerifyEmail: ({ email, onGoBack, onResend }: AuthVerifyEmailProps) => JSX.Element;

declare const GreyButton: ({ sx, ...props }: ButtonProps) => JSX.Element;

interface Props$i extends ButtonProps {
    component?: any;
    to?: any;
}
declare const RegularButton: ({ children, ...props }: Props$i) => JSX.Element;

declare function AccentButton({ children, ...props }: ButtonProps & {
    target?: string;
}): JSX.Element;

type NotificationCountProps = {
    count?: number | string;
    inputProps?: {
        id: string;
        max?: number;
        min?: number;
        onChange: (event: any) => void;
        step?: number;
    };
};

interface IInput {
    className?: string;
    description?: string;
    disabled?: boolean;
    hasError?: boolean;
    id: string;
    label?: string;
    notificationsProps?: NotificationCountProps;
    size?: 'small' | 'medium';
    sx?: any;
    tooltip?: string;
}

interface ToggleProps extends IInput {
    items: string[];
    onChange: (newValue: string) => void;
    value: string;
}
declare const Toggle: (props: ToggleProps) => JSX.Element;

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
type IMessageElement = IImageElement | ITextElement | IPdfElement | IAudioElement | IVideoElement | IFileElement | IPlotlyElement;
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

type StepType = 'init_message' | 'score_message' | 'assistant_message' | 'user_message' | 'system_message' | 'run' | 'tool' | 'llm' | 'embedding' | 'retrieval' | 'rerank' | 'undefined';
interface IStep {
    id: string;
    name: string;
    type: StepType;
    threadId?: string;
    parentId?: string;
    isError?: boolean;
    showInput?: boolean | string;
    waitForAnswer?: boolean;
    scene?: string;
    level?: string;
    score?: number;
    round?: number;
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

declare const AudioElement: ({ element }: {
    element: IAudioElement;
}) => JSX.Element | null;

interface Props$h {
    author: string;
    bgColor?: string;
    element?: IAvatarElement;
}
declare const AvatarElement: ({ element, author, bgColor }: Props$h) => JSX.Element;

interface ElementProps {
    element?: IMessageElement;
}
declare const Element: ({ element }: ElementProps) => JSX.Element | null;

interface SideViewProps {
    children: React.ReactNode;
    element?: IMessageElement;
    isOpen: boolean;
    onClose: () => void;
}
declare const ElementSideView: ({ children, element, isOpen, onClose }: SideViewProps) => JSX.Element;

interface ElementViewProps {
    element: IMessageElement;
    onGoBack?: () => void;
}
declare const ElementView: ({ element, onGoBack }: ElementViewProps) => JSX.Element;

declare const FileElement: ({ element }: {
    element: IFileElement;
}) => JSX.Element | null;

declare const FrameElement: ({ children }: {
    children: React.ReactNode;
}) => JSX.Element;

interface Props$g {
    element: IImageElement;
}
declare const ImageElement: ({ element }: Props$g) => JSX.Element | null;

interface Props$f {
    element: IPdfElement;
}
declare const PDFElement: ({ element }: Props$f) => JSX.Element | null;

interface Props$e {
    element: IPlotlyElement;
}
declare const PlotlyElement: (props: Props$e) => JSX.Element;

interface Props$d {
    element: ITextElement;
}
declare const TextElement: ({ element }: Props$d) => JSX.Element;

declare const VideoElement: ({ element }: {
    element: IVideoElement;
}) => JSX.Element | null;

interface Props$c {
    items: IAudioElement[];
}
declare const InlinedAudioList: ({ items }: Props$c) => JSX.Element;

interface Props$b {
    elements: IMessageElement[];
}
declare const InlinedElements: ({ elements }: Props$b) => JSX.Element | null;

interface Props$a {
    items: IFileElement[];
}
declare const InlinedFileList: ({ items }: Props$a) => JSX.Element;

interface Props$9 {
    items: IImageElement[];
}
declare const InlinedImageList: ({ items }: Props$9) => JSX.Element;

interface Props$8 {
    items: IPdfElement[];
}
declare const InlinedPDFList: ({ items }: Props$8) => JSX.Element;

interface Props$7 {
    items: IPlotlyElement[];
}
declare const InlinedPlotlyList: ({ items }: Props$7) => JSX.Element;

interface Props$6 {
    items: ITextElement[];
}
declare const InlinedTextList: ({ items }: Props$6) => JSX.Element;

interface Props$5 {
    items: IVideoElement[];
}
declare const InlinedVideoList: ({ items }: Props$5) => JSX.Element;

type SliderInputProps = IInput & SliderProps & {
    setField?(field: string, value: number, shouldValidate?: boolean): void;
};
declare const SliderInput: ({ description, hasError, id, label, tooltip, setField, ...sliderProps }: SliderInputProps) => JSX.Element;

type SwitchInputProps = IInput & {
    checked: boolean;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    onChange: (event?: React.ChangeEvent<HTMLInputElement>, checked?: boolean) => void;
};
declare const SwitchInput: (props: SwitchInputProps) => JSX.Element;

type TagsInputProps = {
    placeholder?: string;
    value?: string[];
    setField?(field: string, value: string[], shouldValidate?: boolean): void;
} & IInput & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'color'>;
declare const TagsInput: ({ description, hasError, id, label, size, tooltip, setField, ...rest }: TagsInputProps) => JSX.Element;

type TextInputProps = {
    value?: string;
    placeholder?: string;
    endAdornment?: React.ReactNode;
} & IInput & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & Pick<TextFieldProps, 'multiline'>;
declare const TextInput: ({ description, disabled, hasError, id, label, size, tooltip, multiline, endAdornment, ...rest }: TextInputProps) => JSX.Element;

type SelectItem = {
    label: string;
    icon?: JSX.Element;
    notificationCount?: number;
    value: string | number;
};
type SelectInputProps = IInput & Omit<SelectProps<string>, 'value' | 'onChange'> & {
    children?: React.ReactNode;
    items?: SelectItem[];
    name?: string;
    onChange: (e: SelectChangeEvent) => void;
    placeholder?: string;
    renderLabel?: () => string;
    value?: string | number;
    iconSx?: SxProps;
};
declare const SelectInput: ({ children, description, disabled, hasError, id, items, label, name, onChange, size, tooltip, value, placeholder, renderLabel, onClose, sx, iconSx, ...rest }: SelectInputProps) => JSX.Element;

type TFormInputValue = string | number | boolean | string[] | undefined;
interface IFormInput<T, V extends TFormInputValue> extends IInput {
    type: T;
    value?: V;
    initial?: V;
    setField?(field: string, value: V, shouldValidate?: boolean): void;
}
type TFormInput = (Omit<SwitchInputProps, 'checked'> & IFormInput<'switch', boolean>) | (Omit<SliderInputProps, 'value'> & IFormInput<'slider', number>) | (Omit<TagsInputProps, 'value'> & IFormInput<'tags', string[]>) | (Omit<SelectInputProps, 'value'> & IFormInput<'select', string>) | (Omit<TextInputProps, 'value'> & IFormInput<'textinput', string>) | (Omit<TextInputProps, 'value'> & IFormInput<'numberinput', number>);
declare const FormInput: ({ element }: {
    element: TFormInput;
}) => JSX.Element;

type InputLabelProps = {
    id?: string;
    label: string | number;
    tooltip?: string;
    notificationsProps?: NotificationCountProps;
};
declare const InputLabel: ({ id, label, tooltip, notificationsProps }: InputLabelProps) => JSX.Element;

type InputStateHandlerProps = {
    children: React.ReactNode;
    sx?: SxProps;
} & IInput;
declare const InputStateHandler: (props: InputStateHandlerProps) => JSX.Element;

type CategoryItem = {
    header: string;
    items: SelectItem[];
};
type SelectCategoryProps = {
    items: CategoryItem[];
} & Omit<SelectInputProps, 'items'>;
declare const SelectCategoryInput: ({ items, value, ...rest }: SelectCategoryProps) => JSX.Element;

interface IMessageContext {
    uploadFile?: (file: File, onProgress: (progress: number) => void) => {
        xhr: XMLHttpRequest;
        promise: Promise<IFileRef>;
    };
    askUser?: IAsk;
    avatars: IAvatarElement[];
    defaultCollapseContent: boolean;
    expandAll: boolean;
    hideCot: boolean;
    highlightedMessage: string | null;
    loading: boolean;
    showFeedbackButtons: boolean;
    uiName: string;
    allowHtml?: boolean;
    latex?: boolean;
    onPlaygroundButtonClick?: (step: IStep) => void;
    onElementRefClick?: (element: IMessageElement) => void;
    onFeedbackUpdated?: (message: IStep, onSuccess: () => void, feedback: IFeedback) => void;
    onError: (error: string) => void;
}

interface Props$4 {
    actions: IAction[];
    autoScroll?: boolean;
    context: IMessageContext;
    elements: IMessageElement[];
    messages: IStep[];
    setAutoScroll?: (autoScroll: boolean) => void;
}
declare const MessageContainer: react.MemoExoticComponent<({ actions, autoScroll, context, elements, messages, setAutoScroll }: Props$4) => JSX.Element>;

interface ILLMProvider {
    id: string;
    inputs: TFormInput[];
    name: string;
    settings: ILLMProviderSettings;
    is_chat: boolean;
}
interface ILLMProviderSettings {
    settings: {
        $schema: string;
        $ref: string;
        definitions: {
            settingsSchema: {
                type: string;
                Properties: Record<string, any>;
            };
        };
    };
}
type PromptMode = 'Formatted';
interface IPlayground {
    providers?: ILLMProvider[];
    generation?: IGeneration;
    originalGeneration?: IGeneration;
}

interface IPlaygroundContext {
    variableName?: string;
    setVariableName: (name?: string | ((name?: string) => string | undefined)) => void;
    functionIndex?: number;
    setFunctionIndex: (index?: number | ((index?: number) => number | undefined)) => void;
    promptMode: PromptMode;
    setPromptMode: (mode: PromptMode | ((mode: PromptMode) => PromptMode)) => void;
    setPlayground: (playground?: IPlayground | ((playground?: IPlayground) => IPlayground | undefined)) => void;
    playground?: IPlayground;
    onNotification: (type: 'success' | 'error', content: string) => void;
    createCompletion?: (generation: IGeneration, controller: AbortController, cb: (done: boolean, token: string) => void) => Promise<unknown>;
}

interface Props$3 {
    context: IPlaygroundContext;
}
declare const PromptPlayground: ({ context }: Props$3) => JSX.Element;

declare const white = "#FFFFFF";
declare const grey: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    850: string;
    900: string;
};
declare const primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
};
declare const green: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
};
declare const yellow: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
};

declare const makeTheme: (variant: 'dark' | 'light', fontFamily?: string, breakpoints?: BreakpointsOptions) => _mui_material.Theme;
declare const darkGreyButtonTheme: _mui_material.Theme;
declare const lightGreyButtonTheme: _mui_material.Theme;

declare const useColors: (inverted?: boolean) => string[];

declare const useIsDarkMode: () => boolean;

interface useUploadProps {
    onError?: (error: string) => void;
    onResolved: (payloads: FileWithPath[]) => void;
    options?: DropzoneOptions;
    spec: FileSpec;
}
declare const useUpload: ({ onError, onResolved, options, spec }: useUploadProps) => {
    getInputProps: <T extends react_dropzone.DropzoneInputProps>(props?: T | undefined) => T;
    getRootProps: <T_1 extends react_dropzone.DropzoneRootProps>(props?: T_1 | undefined) => T_1;
    isDragActive: boolean;
};

interface Props$2 {
    name: string;
    mime: string;
    children?: React.ReactNode;
}
declare const Attachment: ({ name, mime, children }: Props$2) => JSX.Element;

interface ClipboardCopyProps {
    value: string;
    theme?: 'dark' | 'light';
    edge?: IconButtonProps['edge'];
}
declare const ClipboardCopy: ({ value, edge }: ClipboardCopyProps) => JSX.Element;

declare const Code: ({ children, ...props }: any) => JSX.Element;

interface Props$1 {
    allowHtml?: boolean;
    latex?: boolean;
    refElements?: IMessageElement[];
    children: string;
}
declare function Markdown({ refElements, allowHtml, latex, children }: Props$1): JSX.Element;

interface CollapseProps {
    children: React.ReactNode;
    defaultExpandAll?: boolean;
}
declare const Collapse: ({ children, defaultExpandAll }: CollapseProps) => JSX.Element;

interface Props {
    prefix?: string;
    children?: ReactNode;
}
interface State {
    hasError: boolean;
    error?: string;
}
declare class ErrorBoundary extends Component<Props, State> {
    state: State;
    static getDerivedStateFromError(err: Error): State;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    render(): string | number | boolean | JSX.Element | react.ReactFragment | null | undefined;
}

declare const NotificationCount: ({ count, inputProps }: NotificationCountProps) => JSX.Element | null;

export { AccentButton, Attachment, AudioElement, AuthForgotPassword, AuthLogin, AuthResetPassword, AuthVerifyEmail, AvatarElement, ClipboardCopy, Code, Collapse, Element, ElementSideView, ElementView, ErrorBoundary, FileElement, FormInput, FrameElement, GreyButton, IFormInput, IInput, ILLMProvider, ILLMProviderSettings, IMessageContext, IPlayground, IPlaygroundContext, ImageElement, InlinedAudioList, InlinedElements, InlinedFileList, InlinedImageList, InlinedPDFList, InlinedPlotlyList, InlinedTextList, InlinedVideoList, InputLabel, InputStateHandler, Markdown, MessageContainer, NotificationCount, NotificationCountProps, PDFElement, PlotlyElement, PromptMode, PromptPlayground, RegularButton, SelectCategoryInput, SelectInput, SelectInputProps, SelectItem, SliderInput, SliderInputProps, SwitchInput, SwitchInputProps, TFormInput, TFormInputValue, TagsInput, TagsInputProps, TextElement, TextInput, TextInputProps, Toggle, VideoElement, darkGreyButtonTheme, green, grey, lightGreyButtonTheme, makeTheme, primary, useColors, useIsDarkMode, useUpload, white, yellow };
