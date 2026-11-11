Option Explicit
Dim fso, sh, appDir, batPath
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = fso.BuildPath(appDir, "START_AGENTS_MANAGER_PLATFORM.bat")
sh.Environment("PROCESS")("QALIX_SILENT") = "1"
sh.Environment("PROCESS")("AUTO_OPEN_BROWSER") = "1"
sh.CurrentDirectory = appDir
sh.Run """" & batPath & """", 0, False
