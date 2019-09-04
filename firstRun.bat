@echo off

set Single=%cd%\single\single.exe
set BatchExe=%cd%\batch\batch.exe
set ProgramFile=%BatchExe%

set LnkName=BATCH
 
set WorkDir=%cd%

pause

if not defined WorkDir call:GetWorkDir "%ProgramFile%"
(echo Set WshShell=CreateObject("WScript.Shell"^)
echo strDesKtop=WshShell.SpecialFolders("."^)
echo Set oShellLink=WshShell.CreateShortcut("%LnkName%.lnk"^)
echo oShellLink.TargetPath="%ProgramFile%"
echo oShellLink.WorkingDirectory="%WorkDir%"
echo oShellLink.WindowStyle=1
echo oShellLink.Description="%Desc%"
echo oShellLink.Save)>makelnk.vbs
makelnk.vbs
del /f /q makelnk.vbs


set ProgramFile=%Single%
set LnkName=SINGLE
 
set WorkDir=%cd%
 
if not defined WorkDir call:GetWorkDir "%ProgramFile%"
(echo Set WshShell=CreateObject("WScript.Shell"^)
echo strDesKtop=WshShell.SpecialFolders("."^)
echo Set oShellLink=WshShell.CreateShortcut("%LnkName%.lnk"^)
echo oShellLink.TargetPath="%ProgramFile%"
echo oShellLink.WorkingDirectory="%WorkDir%"
echo oShellLink.WindowStyle=1
echo oShellLink.Description="%Desc%"
echo oShellLink.Save)>makelnk.vbs
makelnk.vbs
del /f /q makelnk.vbs
::exit
goto :eof
:GetWorkDir
set WorkDir=%~dp1
set WorkDir=%WorkDir:~,-1%
goto :eof

pause