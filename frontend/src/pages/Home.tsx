import Page from 'pages/Page';

import { useParams } from 'react-router-dom';
import Chat from 'components/organisms/chat/index';
import {
  useChatInteract,
  IStep
} from '@chainlit/react-client';
import { IAttachment } from 'state/chat';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const { scene, level } = useParams<{ scene: string; level: string }>();
  
  //初始化模拟面试场景
  if (scene !== undefined && level !== undefined) {
    const { sendMessage } = useChatInteract();
    const placeholder: IAttachment[] = [];
    const initMessage: IStep = {
      id: uuidv4(),
      name: '系统',
      type: 'init_message',
      scene: scene,
      level: level,
      output: '',
      createdAt: new Date().toISOString()
    };
    sendMessage(initMessage, placeholder);
  }


  return (
    <Page>
      {/* 参数后面补充感叹号是一种ts的类型断言，强调元素类型 */}
      <Chat />  
    </Page>
  );
}
