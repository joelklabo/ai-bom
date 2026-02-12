# AI-BOM VS Code Extension - Test Checklist

Use this checklist to verify all extension features before release.

## Pre-Test Setup

- [ ] Dependencies installed: `npm install`
- [ ] TypeScript compiled: `npm run compile`
- [ ] No compilation errors
- [ ] ai-bom CLI installed: `python3 -m pip show ai-bom`
- [ ] Test project ready (e.g., LangChain, AutoGen, or custom AI project)

## Installation Tests

### Test 1: Extension Loads
- [ ] Launch Extension Development Host (F5)
- [ ] Extension appears in Extensions list
- [ ] No errors in Developer Tools console
- [ ] Output channel "AI-BOM Scanner" exists

### Test 2: Commands Available
- [ ] Open Command Palette (Ctrl+Shift+P)
- [ ] "AI-BOM: Scan Workspace" appears
- [ ] "AI-BOM: Scan Current File" appears
- [ ] "AI-BOM: Show Results" appears
- [ ] "AI-BOM: Clear Results" appears
- [ ] "AI-BOM: Install Scanner" appears

### Test 3: Sidebar View
- [ ] AI-BOM shield icon appears in Activity Bar
- [ ] Click opens AI-BOM Explorer
- [ ] "Scan Results" panel visible
- [ ] "Summary" panel visible

## Scanning Tests

### Test 4: Scan Workspace
- [ ] Open test project with AI dependencies
- [ ] Run "AI-BOM: Scan Workspace"
- [ ] Progress notification appears
- [ ] Scan completes without errors
- [ ] Results appear in sidebar
- [ ] Status bar updates with count
- [ ] Success message appears

### Test 5: Scan Current File
- [ ] Open Python file with AI imports (e.g., `import openai`)
- [ ] Run "AI-BOM: Scan Current File"
- [ ] Scan completes
- [ ] OpenAI component detected
- [ ] Results show correct file path

### Test 6: Scan Empty Project
- [ ] Create empty folder
- [ ] Open in Extension Development Host
- [ ] Run "AI-BOM: Scan Workspace"
- [ ] "No AI/ML components detected" message
- [ ] Status bar shows "AI-BOM: Clean"

### Test 7: Scan with No ai-bom
- [ ] Uninstall ai-bom: `pip uninstall ai-bom -y`
- [ ] Run scan
- [ ] Error message appears
- [ ] Offers to install ai-bom
- [ ] Click "Install" installs successfully
- [ ] Retry scan succeeds

## Results Display Tests

### Test 8: Sidebar Results
- [ ] After scan, sidebar shows results
- [ ] Components grouped by severity (Critical > High > Medium > Low)
- [ ] Each severity shows count: "CRITICAL (2)"
- [ ] Click severity group expands components
- [ ] Click component shows details
- [ ] Component details include:
  - [ ] Type
  - [ ] Provider (if applicable)
  - [ ] Model (if applicable)
  - [ ] File path
  - [ ] Risk factors
  - [ ] Flags

### Test 9: Summary Panel
- [ ] Summary shows "Total Components: N"
- [ ] Shows "Highest Risk Score: X/100"
- [ ] Shows "Scan Duration: X.XXs"
- [ ] Shows "Target: [path]"
- [ ] Shows "Scanned: [timestamp]"

### Test 10: Problems Panel
- [ ] Open Problems panel (View > Problems)
- [ ] AI components appear as problems
- [ ] Critical severity = Error icon
- [ ] High severity = Warning icon
- [ ] Medium severity = Info icon
- [ ] Low severity = Hint icon
- [ ] Click problem navigates to file

### Test 11: Inline Decorations
- [ ] Open file with detected components
- [ ] Gutter icons appear on relevant lines
- [ ] Inline risk score annotations visible
- [ ] Hover shows detailed tooltip with:
  - [ ] Component name
  - [ ] Risk score
  - [ ] Provider/model
  - [ ] Risk factors
  - [ ] Flags

### Test 12: Status Bar
- [ ] After scan, status bar updates
- [ ] With critical findings: "$(error) AI-BOM: N critical"
- [ ] With high findings: "$(warning) AI-BOM: N high"
- [ ] With only low/medium: "$(shield) AI-BOM: N found"
- [ ] With no findings: "$(shield) AI-BOM: Clean"
- [ ] Click status bar opens sidebar

## Navigation Tests

### Test 13: Navigate to Component
- [ ] Click component in sidebar
- [ ] File opens in editor
- [ ] Cursor jumps to correct line
- [ ] Line is centered in viewport

### Test 14: Navigate from Problems
- [ ] Click problem in Problems panel
- [ ] File opens
- [ ] Correct line highlighted

## Configuration Tests

### Test 15: Python Path
- [ ] Open Settings > ai-bom.pythonPath
- [ ] Change to absolute path: `/usr/bin/python3`
- [ ] Run scan
- [ ] Scan succeeds with new path

### Test 16: Severity Threshold
- [ ] Set `ai-bom.severityThreshold` to "high"
- [ ] Run scan
- [ ] Sidebar shows only critical and high
- [ ] Medium and low components filtered out

### Test 17: Deep Scan
- [ ] Set `ai-bom.deepScan` to true
- [ ] Scan Python project
- [ ] More components detected (decorators, function calls)
- [ ] Set to false
- [ ] Fewer components detected

### Test 18: Scan On Save
- [ ] Set `ai-bom.scanOnSave` to true
- [ ] Edit file with AI imports
- [ ] Save file (Ctrl+S)
- [ ] Scan automatically triggers
- [ ] Results update

### Test 19: Show Inline Decorations
- [ ] Set `ai-bom.showInlineDecorations` to false
- [ ] Open file with components
- [ ] No inline decorations visible
- [ ] Set to true
- [ ] Decorations reappear

### Test 20: Auto Install
- [ ] Uninstall ai-bom
- [ ] Set `ai-bom.autoInstall` to true
- [ ] Run scan
- [ ] Extension automatically installs ai-bom
- [ ] Scan proceeds without user interaction

## Error Handling Tests

### Test 21: Invalid Python Path
- [ ] Set `ai-bom.pythonPath` to invalid path: `/fake/python`
- [ ] Run scan
- [ ] Clear error message appears
- [ ] Output channel shows details

### Test 22: Non-existent File Scan
- [ ] Try to scan deleted file
- [ ] Appropriate error message
- [ ] Extension doesn't crash

### Test 23: Large Project Scan
- [ ] Scan very large project (1000+ files)
- [ ] Progress indicator works
- [ ] Scan completes (may take time)
- [ ] Results load correctly

### Test 24: Scan Interruption
- [ ] Start scan on large project
- [ ] Close Extension Development Host during scan
- [ ] Relaunch extension
- [ ] No errors, extension works normally

## Clear Results Tests

### Test 25: Clear Results Command
- [ ] Run scan to populate results
- [ ] Run "AI-BOM: Clear Results"
- [ ] Sidebar shows empty
- [ ] Problems panel cleared
- [ ] Inline decorations removed
- [ ] Status bar resets to "$(shield) AI-BOM"

## Context Menu Tests

### Test 26: Explorer Context Menu
- [ ] Right-click file in Explorer
- [ ] "AI-BOM: Scan Current File" appears in menu
- [ ] Click to scan
- [ ] Scan executes correctly

### Test 27: Editor Context Menu
- [ ] Right-click in editor
- [ ] "AI-BOM: Scan Current File" appears
- [ ] Click to scan
- [ ] Scan executes

## Output Channel Tests

### Test 28: Output Messages
- [ ] Open Output panel (View > Output)
- [ ] Select "AI-BOM Scanner" channel
- [ ] Run scan
- [ ] See messages:
  - [ ] "Running: python3 -m ai_bom.cli scan ..."
  - [ ] "Scan completed: N components found"
- [ ] No error messages for successful scan

### Test 29: Error Output
- [ ] Trigger error (e.g., invalid Python path)
- [ ] Check Output channel
- [ ] Detailed error information logged

## Real-World Project Tests

### Test 30: LangChain Project
- [ ] Clone: `git clone https://github.com/langchain-ai/langchain`
- [ ] Open in Extension Development Host
- [ ] Run "AI-BOM: Scan Workspace"
- [ ] Detects LangChain components
- [ ] Detects LLM providers (OpenAI, Anthropic, etc.)
- [ ] Shows multiple severity levels

### Test 31: AutoGen Project
- [ ] Clone: `git clone https://github.com/microsoft/autogen`
- [ ] Scan workspace
- [ ] Detects AutoGen framework
- [ ] Detects OpenAI dependencies

### Test 32: Custom Test Project
- [ ] Create minimal Python file:
  ```python
  import openai
  client = openai.OpenAI(api_key="sk-test123")
  ```
- [ ] Scan file
- [ ] Detects OpenAI SDK
- [ ] Flags hardcoded API key
- [ ] Shows critical/high severity for hardcoded key

## Performance Tests

### Test 33: Scan Speed
- [ ] Scan medium project (100 files)
- [ ] Completes in reasonable time (< 30 seconds)
- [ ] UI remains responsive

### Test 34: Multiple Scans
- [ ] Run 5 scans in sequence
- [ ] No memory leaks
- [ ] Results update correctly each time
- [ ] No performance degradation

## Edge Cases

### Test 35: Special Characters in Path
- [ ] Project with spaces in path: `/path/with spaces/project`
- [ ] Scan succeeds

### Test 36: Unicode in File Names
- [ ] Files with unicode characters
- [ ] Scan handles correctly

### Test 37: Symlinked Directories
- [ ] Project with symlinks
- [ ] Scan follows symlinks or handles gracefully

## Package Tests

### Test 38: Build VSIX
- [ ] Run: `npm run package`
- [ ] .vsix file created: `ai-bom-scanner-0.1.0.vsix`
- [ ] File size reasonable (< 5MB)

### Test 39: Install VSIX
- [ ] Install: `code --install-extension ai-bom-scanner-0.1.0.vsix`
- [ ] Extension appears in Extensions list
- [ ] All features work in regular VS Code (not Extension Development Host)

### Test 40: Uninstall
- [ ] Uninstall extension from VS Code
- [ ] No errors
- [ ] Files cleaned up
- [ ] Reinstall works

## Cross-Platform Tests (if applicable)

### Test 41: Linux
- [ ] All above tests pass on Linux
- [ ] Python path detection works

### Test 42: macOS
- [ ] All tests pass on macOS
- [ ] Python path detection works

### Test 43: Windows
- [ ] All tests pass on Windows
- [ ] Python path detection works (python.exe)
- [ ] File paths use backslashes correctly

## Documentation Tests

### Test 44: README Accuracy
- [ ] All features in README work
- [ ] Configuration examples are correct
- [ ] Screenshots match actual UI (once added)

### Test 45: Quick Start Works
- [ ] Follow GETTING_STARTED.md step by step
- [ ] All instructions work for new user

## Final Checks

- [ ] No console errors in Developer Tools
- [ ] No memory leaks (check Task Manager/Activity Monitor)
- [ ] Extension icon displays correctly (once added)
- [ ] Version number correct in package.json
- [ ] CHANGELOG.md updated
- [ ] All TypeScript files compile with no errors
- [ ] ESLint passes: `npm run lint`
- [ ] No hardcoded paths or credentials in code

## Sign-Off

- [ ] All critical tests pass
- [ ] Known issues documented
- [ ] Ready for release / publishing

**Tester Name**: _________________
**Date**: _________________
**Version Tested**: _________________
**Notes**: _________________
