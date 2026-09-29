@echo off
title 个人网站 - 本地启动
cd /d "%~dp0"
echo ============================================
echo   个人网站启动中,请稍等十几秒...
echo.
echo   启动完成后,用浏览器打开  http://localhost:3000
echo   (改了代码会自动生效,刷新网页即可)
echo.
echo   关闭本窗口 = 停止网站
echo ============================================
npm run dev
pause
