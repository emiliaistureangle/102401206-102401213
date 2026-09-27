@echo off
cd /d "%~dp0"
title 校园失物招领 - 推送到 GitHub

echo ============================================================
echo   校园失物招领小程序 - 推送到 GitHub
echo ============================================================
echo.
echo  [推送前请确认] 你已经在 GitHub 建好了 Public 仓库：
echo     仓库名：campus-lost-and-found
echo     网址：https://github.com/new
echo     注意：建仓库时【不要】勾选 Add a README file
echo.
set /p GHUSER=请输入你的 GitHub 用户名（github.com/ 后面那段）: 

if "%GHUSER%"=="" (
  echo.
  echo [X] 用户名不能为空，已退出。
  pause
  exit /b 1
)

echo.
echo [1/4] 检查仓库是否可以访问 ...
set CODE=000
for /f %%i in ('powershell -NoProfile -Command "try { (Invoke-WebRequest -Uri 'https://github.com/%GHUSER%/campus-lost-and-found' -Method Head -TimeoutSec 15 -UseBasicParsing).StatusCode } catch { '404' }"') do set CODE=%%i
echo       HTTP %CODE%
if not "%CODE%"=="200" (
  echo.
  echo [X] 访问不到这个仓库，请检查：
  echo     1. GitHub 用户名是否拼写正确
  echo     2. 是否已在 https://github.com/new 创建 Public 仓库
  echo     3. 仓库名是否为 campus-lost-and-found
  pause
  exit /b 1
)

echo [2/4] 设置远程地址 ...
git remote remove origin >nul 2>nul
git remote add origin "https://github.com/%GHUSER%/campus-lost-and-found.git"

echo [3/4] 提交本地改动 ...
git branch -M main >nul 2>nul
git add .
git commit -m "feat: 完成需求分析、原型设计与设计文档" >nul 2>nul

echo [4/4] 推送到 GitHub ...
echo      若弹出登录窗口，请选 "Sign in with your browser" 完成授权
echo.
git push -u origin main

if errorlevel 1 goto FAIL

echo.
echo ============================================================
echo  [OK] 推送成功！
echo.
echo  下一步：打开仓库页面 - Settings - Pages
echo    Source : Deploy from a branch
echo    Branch : main   目录选 / (root)
echo    点 Save，等 1-2 分钟
echo.
echo  在线原型链接（填进两份博客）：
echo    https://%GHUSER%.github.io/campus-lost-and-found/
echo ============================================================
pause
exit /b 0

:FAIL
echo.
echo ============================================================
echo  [X] 推送失败，对照下面三种情况：
echo.
echo   1) Repository not found
echo      仓库还没创建，或用户名 / 仓库名写错了
echo.
echo   2) Authentication failed / 程序一直卡住
echo      登录窗口里要选 "Sign in with your browser"
echo      现在 GitHub 已经不能用密码推送
echo.
echo   3) Failed to connect to github.com:443
echo      代理没开。本机需要 7897 端口有代理在运行
echo.
echo  把这里的报错整段发给助手即可。
echo ============================================================
pause
