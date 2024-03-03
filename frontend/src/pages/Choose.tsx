import React, { useState } from 'react';
import Page from 'pages/Page';
import { MenuItem, InputLabel, FormControl, Box, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Select,{SelectChangeEvent} from '@mui/material/Select';
import { useNavigate } from 'react-router-dom';
import  '../Choose.css'; // 导入样式文件


export default function Choose() {

  const navigate = useNavigate();  // 用作界面跳转

  const [industrySelectValue, setIndustrySelectValue] = useState<string[]>([]);
  // 用于处理下拉框选择变化的函数
  const handleSetIndustrySelectValue = (event: SelectChangeEvent<typeof industrySelectValue>) => {
    const {
      target: { value }, 
    } = event;
    setIndustrySelectValue(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    );
  };

  // 下拉框选项列表
  const dropdownOptions =  [
    '技术',
    '产品',
    '营销',
    '销售'
  ];



  // 难度选择
  const handleChipClick = () => {
    console.info('You clicked the Chip.');
  };

  const [interviewChooseSelected, setInterviewChooseSelected] = useState(false);
  function handleChooseInterview (event: React.MouseEvent<HTMLButtonElement>) {  // ts语法表示类似event
    // 当前选择面试的按钮
    const curChooseInterviewButton = event.currentTarget.innerText; // 获取按钮的内容
    setInterviewChooseSelected(!interviewChooseSelected)
    console.log("/home/"+curChooseInterviewButton)
    // 传递当前选择的面试场景给后端，并跳转至模拟面试界面
    navigate("home/1"+{curChooseInterviewButton})
  }



  return (
    <Page>
      <div id="main">
        {/* 第一部分 */}
        <main>
                  {/* 首页图片 */}
                  <div style={{ marginTop: '20px', textAlign:'center' }}>
                      <img src="/public/to_peak.jpg" style={{ width: '70%', height: 'auto' }} />  
                  </div>
                  <h1 style={{ fontSize: '1.125rem', lineHeight: '1.75rem'}}>👏 欢迎使用Interview AI</h1>
                  {/* 产品内容介绍 */}
                  <div style={{ textAlign:'center',color:'gray' }}>
                        InterView AI基于AI技术，打造的模拟面试场景，致力于帮助用户轻松求职，该大模型使用 Kimi Chat   
                  </div>

                  {/* 选择面试场景 */}
                  <div className="select-container">
                      <p style={{ fontSize: '1.125rem', lineHeight: '1.75rem'}}>👇选择一个行业，然后开始模拟面试吧</p>
                      <FormControl fullWidth >
                          <InputLabel id="demo-simple-select-label">选择选项</InputLabel>
                          <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            multiple
                            style={{color: 'black', fontSize: '.875rem', lineHeight: '1.25rem' }}
                            value={industrySelectValue}
                            onChange={handleSetIndustrySelectValue}
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                  <Chip key={value} label={value} />
                                ))}
                              </Box>
                            )}
                            label="选择选项"
                          >
                            {dropdownOptions.map((option) => (
                              <MenuItem key={option} value={option}>
                                {option}
                              </MenuItem>
                            ))}
                          </Select>
                      </FormControl>
                  </div>

        
        </main>

        {/* 第二部分 */}
        <main>
              <Stack spacing={1}>
                  {/* 难度等级选择 */}
                  <span style={{fontSize:'0.65rem'}}> 难度选择 </span>
                  <div style={{ display: 'flex', gridTemplateColumns: 'repeat(3, auto)', columnGap: '0.5rem' }}>
                    <Chip style={{ width: '3.5rem' }} label="初级" variant="outlined" onClick={handleChipClick} />
                    <Chip style={{ width: '3.5rem' }} label="中级" variant="outlined" onClick={handleChipClick} />
                    <Chip style={{ width: '3.5rem' }} label="高级" variant="outlined" onClick={handleChipClick} />
                  </div>
                    
                  <Button 
                    variant={interviewChooseSelected ? 'contained' : 'outlined'} // 根据选中状态应用不同的样式
                    onClick={handleChooseInterview} // 添加点击事件
                  >Golang工程师模拟面试</Button>

                  <Button variant="outlined">产品经理模拟面试</Button>
                  <Button variant="outlined">运维工程师模拟面试</Button>
                  <Button variant="outlined">UI模拟面试</Button>
                  <Button variant="outlined">前端模拟面试</Button>

                  <Button variant="outlined">Golang工程师模拟面试</Button>
                  <Button variant="outlined">产品经理模拟面试</Button>
                  <Button variant="outlined">运维工程师模拟面试</Button>
                  <Button variant="outlined">UI模拟面试</Button>
                  <Button variant="outlined" onClick={handleChooseInterview}>前端模拟面试</Button>
              </Stack>
        </main>
      </div>
    </Page>
    
  );
}
