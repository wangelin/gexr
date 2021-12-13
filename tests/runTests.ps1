function Run-Test($TestName, $Output, $ExpectedOutput, $Loud) {
	if (!$Output) {
		Write-Output "🛑 $($TestName) Failed, no output."
		return
	}
	if (($Output.GetType().Name -ne "String") -and ($ExpectedOutput.GetType().Name -eq "String")) {
		$ExpectedOutput = $ExpectedOutput.Split("`n")
	}

	$Diff = Compare-Object -ReferenceObject $Output -DifferenceObject $ExpectedOutput -PassThru
	if (!$Diff) {
		Write-Output "✅ $($TestName) OK"
	} else {
		Write-Output "🛑 $($TestName) Failed"
		if ($Loud) {
			Write-Output "Diff"
			Write-Output $Diff
			Write-Output "------"
			Write-Output "Output"
			Write-Output $Output
			Write-Output "------"
			Write-Output "ExpectedOutput"
			Write-Output $ExpectedOutput
			Write-Output "------"
		}
	}
}

Run-Test "Remove empty lines" ("row1`n`n`n`nrow3`n" | gexr -e) "row1`nrow3`n"
Run-Test "Simple replace" ("peter" | gexr '/peter/ \"wangan\"') "wangan"
Run-Test "Multiline replace" ("pater`npatar`npater`n" | gexr '/a/g \"e\"' '/(?<=.+)$/ \" wangelin\"') "peter wangelin`npeter wangelin`npeter wangelin"
Run-Test "Remove line" ("peter`npatar`npeter`n" | gexr 'x/patar/') "peter`npeter`n"
Run-Test "Remove other lines" ("peter`npatar`npeter`n" | gexr 'x!/patar/') "patar" $true
Run-Test "File" (gexr 'x!/patar/' file.txt) "patar" $true

