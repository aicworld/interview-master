import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { Alert, Box, LinearProgress,Typography } from '@mui/material';

import {
  threadHistoryState,
  useChatData,
  useChatInteract,
  useChatSession
} from '@chainlit/react-client';
import { ErrorBoundary, useUpload} from '@chainlit/react-components';

import SideView from 'components/atoms/element/sideView';
import { Translator } from 'components/i18n';
import ChatProfiles from 'components/molecules/chatProfiles';
import { TaskList } from 'components/molecules/tasklist/TaskList';

import { apiClientState } from 'state/apiClient';
import { IAttachment, attachmentsState } from 'state/chat';
import { projectSettingsState, sideViewState } from 'state/project';

import Messages from './Messages';
import DropScreen from './dropScreen';
import InputBox from './inputBox';

interface sceneProps {
  name: string
} 
const Chat: React.FC<sceneProps> = ({name}) => {

  const { idToResume } = useChatSession();
  const projectSettings = useRecoilValue(projectSettingsState);
  const setAttachments = useSetRecoilState(attachmentsState);
  const setThreads = useSetRecoilState(threadHistoryState);
  const sideViewElement = useRecoilValue(sideViewState);
  const apiClient = useRecoilValue(apiClientState);

  const [autoScroll, setAutoScroll] = useState(true);
  const { error, disabled } = useChatData();
  const { uploadFile } = useChatInteract();
  const uploadFileRef = useRef(uploadFile);
  const fileSpec = useMemo(() => ({ max_size_mb: 500 }), []);

  const { t } = useTranslation();

  useEffect(() => {
    uploadFileRef.current = uploadFile;
  }, [uploadFile]);

  const onFileUpload = useCallback(
    (payloads: File[]) => {
      const attachements: IAttachment[] = payloads.map((file) => {
        const id = uuidv4();

        const { xhr, promise } = uploadFileRef.current(
          apiClient,
          file,
          (progress) => {
            setAttachments((prev) =>
              prev.map((attachment) => {
                if (attachment.id === id) {
                  return {
                    ...attachment,
                    uploadProgress: progress
                  };
                }
                return attachment;
              })
            );
          }
        );

        promise
          .then((res) => {
            setAttachments((prev) =>
              prev.map((attachment) => {
                if (attachment.id === id) {
                  return {
                    ...attachment,
                    // Update with the server ID
                    serverId: res.id,
                    uploaded: true,
                    uploadProgress: 100,
                    cancel: undefined
                  };
                }
                return attachment;
              })
            );
          })
          .catch((error) => {
            toast.error(
              `${t('components.organisms.chat.index.failedToUpload')} ${
                file.name
              }: ${error.message}`
            );
            setAttachments((prev) =>
              prev.filter((attachment) => attachment.id !== id)
            );
          });

        return {
          id,
          type: file.type,
          name: file.name,
          size: file.size,
          uploadProgress: 0,
          cancel: () => {
            toast.info(
              `${t('components.organisms.chat.index.cancelledUploadOf')} ${
                file.name
              }`
            );
            xhr.abort();
            setAttachments((prev) =>
              prev.filter((attachment) => attachment.id !== id)
            );
          },
          remove: () => {
            setAttachments((prev) =>
              prev.filter((attachment) => attachment.id !== id)
            );
          }
        };
      });
      setAttachments((prev) => prev.concat(attachements));
    },
    [uploadFile]
  );

  const onFileUploadError = useCallback(
    () => (error: string) => toast.error(error),
    []
  );

  const upload = useUpload({
    spec: fileSpec,
    onResolved: onFileUpload,
    onError: onFileUploadError,
    options: { noClick: true }
  });

  useEffect(() => {
    setThreads((prev) => ({
      ...prev,
      currentThreadId: undefined
    }));
  }, []);

  const enableMultiModalUpload =
    !disabled && projectSettings?.features?.multi_modal;

  return (
    <Box
      {...(enableMultiModalUpload
        ? upload?.getRootProps({ className: 'dropzone' })
        : {})}
      // Disable the onFocus and onBlur events in react-dropzone to avoid interfering with child trigger events
      onBlur={undefined}
      onFocus={undefined}
      display="flex"
      width="100%"
      flexGrow={1}
      position="relative"
    >
      {upload ? (
        <>
          <input id="#upload-drop-input" {...upload.getInputProps()} />
          {upload?.isDragActive ? <DropScreen /> : null}
        </>
      ) : null}      
      <SideView>
        {/* 补充面试职位名称 */}
        <Box 
            sx={{
              // display: 'flex', // 使用 Flexbox 布局
              width: '95%',
              maxWidth: '60rem',
              mx: 'auto',
              my: 1,
              height: '9rem', // 添加高度
              border: '1.5px solid red', // 添加边框
              borderRadius: '10px', // 切割圆角
              boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.5)' // 添加阴影
            }} 
        >
            <Box
              sx={{
                flex: 1, // 左侧区域的比例为 1，会占据可用空间的全部宽度
                // backgroundColor: 'lightblue',
                padding: '10px'
              }}
            >

            {/* 职位名称 */}
            <Box
                sx={{
                  flex: 1, // 左侧区域的比例为 1，会占据可用空间的全部宽度
                  // backgroundColor: 'lightblue',
                  // padding: '5px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center', // 垂直方向上的居中对齐
                  justifyContent: 'center' // 水平方向上的居中对齐
                }}
              >
                 <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{name}</span>
              </Box>


              {/* 进度条 */}
              <Box
                sx={{
                  flex: 1, // 右侧区域的比例为 1，会占据可用空间的全部宽度
                  // backgroundColor: 'lightgreen',
                  // padding: '10px'
                }}
              >
                
                {/* 得分值 */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%', // 设置 Flex 容器的宽度为进度条的宽度
                    marginTop: '20px' // 设置底部间距
                  }}
                >
                  <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#6b7280' }}>得分值</Typography> {/* 显示得分 */}
                  <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#6b7280' }}>{80}/100</Typography> {/* 显示总分 */}
                </Box>

                {/* 分数条 */}
                <LinearProgress
                  variant="determinate"
                  value={80} // 计算进度值
                  sx={{ 
                    marginTop: '10px',
                    height: '10px', // 设置进度条的高度为10px
                    borderRadius: '5px', // 设置进度条的圆角
                    backgroundColor: 'lightgray', // 设置进度条的背景颜色
                    '& .MuiLinearProgress-bar': { // 通过类名选择进度条的样式
                      // backgroundColor: 'green', // 设置进度条的颜色为绿色
                      borderRadius: '5px' // 设置进度条的圆角，与父容器相同
                    }
                  }} // 设置进度条与文本之间的间距
                />

                {/* 得分值 */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%', // 设置 Flex 容器的宽度为进度条的宽度
                    marginTop: '10px' // 设置底部间距
                  }}
                >
                  <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#6b7280' }}>面试轮次</Typography> {/* 显示得分 */}
                  <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#6b7280' }}>{10}/20</Typography> {/* 显示总分 */}
                </Box>
              </Box>

            </Box>
           
        </Box> 
        {error ? (
          <Box
            sx={{
              width: '100%',
              maxWidth: '60rem',
              mx: 'auto',
              my: 2
            }}
          >
            <Alert sx={{ mx: 2 }} id="session-error" severity="error">
              <Translator path="components.organisms.chat.index.couldNotReachServer" />
            </Alert>
          </Box>
        ) : null}
        {idToResume ? (
          <Box
            sx={{
              width: '100%',
              maxWidth: '60rem',
              mx: 'auto',
              my: 2
            }}
          >
            <Alert sx={{ mx: 2 }} severity="info">
              <Translator path="components.organisms.chat.index.continuingChat" />
            </Alert>
          </Box>
        ) : null}
        <TaskList isMobile={true} />
        <ErrorBoundary>
          <ChatProfiles />
          <Messages
            autoScroll={autoScroll}
            projectSettings={projectSettings}
            setAutoScroll={setAutoScroll}
          />
          <InputBox
            fileSpec={fileSpec}
            onFileUpload={onFileUpload}
            onFileUploadError={onFileUploadError}
            autoScroll={autoScroll}
            setAutoScroll={setAutoScroll}
            projectSettings={projectSettings}
          />
        </ErrorBoundary>
      </SideView>
      {sideViewElement ? null : <TaskList isMobile={false} />}
    </Box>
  );
};

export default Chat;
