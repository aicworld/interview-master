import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

import { Alert, Box, LinearProgress,Typography } from '@mui/material';

import {
  threadHistoryState,
  useChatData,
  useChatInteract,
  useChatSession,
  useChatMessages
} from '@chainlit/react-client';
import { ErrorBoundary, useUpload, AccentButton, RegularButton} from '@chainlit/react-components';

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


import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';


interface sceneProps {
  name: string
} 
const Chat: React.FC<sceneProps> = ({name}) => {

  const { idToResume } = useChatSession();
  const { messages } = useChatMessages();
  const navigate = useNavigate();

  const [score, setInterViewSocre] = useState(0)
  const [round,  setInterViewRound] = useState(0)

  useEffect(() => {
      if (messages.length >= 1) {
        /**
         * 挑战失败
         * 1、完成退出
         * 2、重新开始
        */
        if (round >= 20 && score < 100) {
          handleClickOpen() // 弹出提示：挑战失败
        }
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.type === "score_message" && typeof lastMessage.score === "number" && typeof lastMessage.round === "number") {
          setInterViewSocre(lastMessage.score);
          setInterViewRound(lastMessage.round);
        }

        /**
         * 面试成功
         * 1、完成退出
         * 2、挑战中级
        */
        if (round >= 20 && score > 100) {
          handleClickOpen() // 弹出提示：挑战成功
        }
      }
  }, [messages, round, score]); // 仅在 messages 发生变化时触发副作用


  const projectSettings = useRecoilValue(projectSettingsState);
  const setAttachments = useSetRecoilState(attachmentsState);
  const setThreads = useSetRecoilState(threadHistoryState);
  const sideViewElement = useRecoilValue(sideViewState);
  const apiClient = useRecoilValue(apiClientState);

  const [autoScroll, setAutoScroll] = useState(true);
  const { error, disabled } = useChatData();
  const { uploadFile, clear } = useChatInteract();
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


  // 弹出层
  const [open, setOpen] = useState(false)
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = () => {
    clear();
    navigate('/');
    handleClose();
  };
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
              // display: 'flex',
              width: '95%',
              maxWidth: '60rem',
              mx: 'auto',
              my: 1,
              height: '9rem', 
              border: '1.5px solid red', 
              borderRadius: '10px', 
              boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.5)' 
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
                    width: '100%',
                    marginTop: '20px' 
                  }}
                >
                  <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#6b7280' }}>得分值</Typography> {/* 显示得分 */}
                  <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#6b7280' }}>{score}/100</Typography> {/* 显示总分 */}
                </Box>

                {/* 分数条 */}
                <LinearProgress
                  variant="determinate"
                  value={score} // 计算进度值
                  sx={{ 
                    marginTop: '10px',
                    height: '10px', 
                    borderRadius: '5px', 
                    backgroundColor: 'lightgray', 
                    '& .MuiLinearProgress-bar': { // 通过类名选择进度条的样式
                      // backgroundColor: 'green', 
                      borderRadius: '5px' // 设置进度条的圆角，与父容器相同
                    }
                  }}
                />

                {/* 得分值 */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%', 
                    marginTop: '10px' 
                  }}
                >
                  <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#6b7280' }}>面试轮次</Typography> {/* 显示得分 */}
                  <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#6b7280' }}>{round}/20</Typography> {/* 显示总分 */}
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

      {/* 用作提示 */}
      <Dialog
        open={open}
        onClose={handleClose}
        id="new-chat-dialog"
        PaperProps={{
          sx: {
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle id="alert-dialog-title">
          {<Translator path="components.molecules.newChatDialog.createNewChat" />}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <Translator path="components.molecules.newChatDialog.clearChat" />
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <RegularButton onClick={handleClose}>
            <Translator path="components.molecules.newChatDialog.cancel" />
          </RegularButton>
          <AccentButton
            id="confirm"
            variant="outlined"
            onClick={handleConfirm}
            autoFocus
          >
            <Translator path="components.molecules.newChatDialog.confirm" />
          </AccentButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chat;
