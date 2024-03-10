import { IFeedback } from './feedback';
import { IGeneration } from './generation';

type StepType =
  | 'init_message'
  | 'score_message'
  | 'assistant_message'
  | 'user_message'
  | 'system_message'
  | 'run'
  | 'tool'
  | 'llm'
  | 'embedding'
  | 'retrieval'
  | 'rerank'
  | 'undefined';

export interface IStep {
  id: string;
  name: string;
  type: StepType;
  threadId?: string;
  parentId?: string;
  isError?: boolean;
  showInput?: boolean | string;
  waitForAnswer?: boolean;
  scene?:string,
  level?:string,
  score?:number;
  round?:number;
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
  //legacy
  indent?: number;
}
