Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Obter diretório do projeto
strCurrentDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strCurrentDir

' Testar se a porta 3000 responde
Dim http
On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP")
http.open "GET", "http://localhost:3000/api/configuracoes", False
http.send

If Err.Number <> 0 Or http.status <> 200 Then
    ' Matar processos antigos/travados no Node e iniciar o servidor limpo de produção
    WshShell.Run "cmd /c taskkill /f /im node.exe", 0, True
    WshShell.Run "cmd /c npm.cmd start", 0, False
    WScript.Sleep 4000
End If
On Error GoTo 0

' Abrir em modo Aplicativo de Janela Nativa Desktop
strEdgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
strEdgePath64 = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"

If fso.FileExists(strEdgePath64) Then
    WshShell.Run """" & strEdgePath64 & """ --app=http://localhost:3000 --title=""Água Belle — Gestão""", 1, False
ElseIf fso.FileExists(strEdgePath) Then
    WshShell.Run """" & strEdgePath & """ --app=http://localhost:3000 --title=""Água Belle — Gestão""", 1, False
Else
    ' Fallback para o navegador padrão
    WshShell.Run "http://localhost:3000", 1, False
End If
