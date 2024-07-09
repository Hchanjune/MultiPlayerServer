# 경로 설정
$sourceDir = "src"
$outputDir = "encoded"

# 출력 디렉토리 생성 (존재하지 않으면)
if (-Not (Test-Path -Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir
}

# 모든 xxxState.ts 파일에 대해 루프 실행
Get-ChildItem -Path $sourceDir -Filter "*State.ts" -Recurse | ForEach-Object {
    $file = $_.FullName
    $filename = [System.IO.Path]::GetFileNameWithoutExtension($file)
    schema-codegen $file --output "$outputDir\$filename.cs" --csharp
}
