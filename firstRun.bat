@echo off
::���ó�����ļ�������·������ѡ��
set Single=%cd%\single\single.exe
set BatchExe=%cd%\batch\batch.exe
set Program=%BatchExe%
::���ÿ�ݷ�ʽ���ƣ���ѡ��
set LnkName=�ɼ���
 
::���ó���Ĺ���·����һ��Ϊ������Ŀ¼�����������գ��ű������з���·��
set WorkDir=%cd%
 
::���ÿ�ݷ�ʽ��ʾ��˵������ѡ��
set Desc=��ľ���͹���ϵͳ
 
if not defined WorkDir call:GetWorkDir "%Program%"
(echo Set WshShell=CreateObject("WScript.Shell"^)
echo strDesKtop=WshShell.SpecialFolders("."^)
echo Set oShellLink=WshShell.CreateShortcut("%LnkName%.lnk"^)
echo oShellLink.TargetPath="%Program%"
echo oShellLink.WorkingDirectory="%WorkDir%"
echo oShellLink.WindowStyle=1
echo oShellLink.Description="%Desc%"
echo oShellLink.Save)>makelnk.vbs
echo �����ݷ�ʽ�����ɹ��� 
makelnk.vbs
del /f /q makelnk.vbs


set Program=%Single%
::���ÿ�ݷ�ʽ���ƣ���ѡ��
set LnkName=���ص����ļ�
 
::���ó���Ĺ���·����һ��Ϊ������Ŀ¼�����������գ��ű������з���·��
set WorkDir=%cd%
 
::���ÿ�ݷ�ʽ��ʾ��˵������ѡ��
set Desc=��ľ���͹���ϵͳ
 
if not defined WorkDir call:GetWorkDir "%Program%"
(echo Set WshShell=CreateObject("WScript.Shell"^)
echo strDesKtop=WshShell.SpecialFolders("."^)
echo Set oShellLink=WshShell.CreateShortcut("%LnkName%.lnk"^)
echo oShellLink.TargetPath="%Program%"
echo oShellLink.WorkingDirectory="%WorkDir%"
echo oShellLink.WindowStyle=1
echo oShellLink.Description="%Desc%"
echo oShellLink.Save)>makelnk.vbs
echo �����ݷ�ʽ�����ɹ��� 
makelnk.vbs
del /f /q makelnk.vbs
::exit
goto :eof
:GetWorkDir
set WorkDir=%~dp1
set WorkDir=%WorkDir:~,-1%
goto :eof

pause