@echo off
cd /d "%~dp0"
title 校园失物招领 - 推送到 GitHub

echo ============================================================
echo   校园失物招领小程序 - 推送到 GitHub
echo   仓库：github.com/emiliaistureangle/school-things-find
echo ============================================================
echo.

git remote set-url origin https://github.com/emiliaistureangle/school-things-find.git
git branch -M main >nul 2>nul
git add .
git commit -m "docs: 更新文档" >nul 2>nul

echo 正在推送 ...
echo.
git push

if errorlevel 1 goto FAIL

echo.
echo ============================================================
echo  [OK] 推送成功！
echo.
echo  在线原型：https://emiliaistureangle.github.io/school-things-find/
echo ============================================================
pause
exit /b 0

:FAIL
echo.
echo ============================================================
echo  [X] 推送失败，常见原因：
echo   1) Authentication failed / 卡住
echo      登录窗口里选 "Sign in with your browser"
echo   2) Failed to connect to github.com:443
echo      代理没开（本机需要 7897 端口有代理）
echo ============================================================
pause
