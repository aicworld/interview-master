import Page from 'pages/Page';

import { useParams } from 'react-router-dom';
import Chat from 'components/organisms/chat/index';

export default function Home() {
  const { scene, level } = useParams<{ scene: string; level: string }>();
  return (
    <Page>
      {/* 参数后面补充感叹号是一种ts的类型断言，强调元素类型 */}
      <Chat scene={scene!} level={level!}/>  
    </Page>
  );
}
