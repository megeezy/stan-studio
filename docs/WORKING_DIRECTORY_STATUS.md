# Working Directory Persistence - Implementation Summary

## Problem
When you `cd` into a folder in a terminal and then switch to another terminal or close/reopen, the working directory is lost.

## Root Cause
Each terminal tab spawns an **independent shell process**. When you `cd` in one terminal, that only affects that specific shell's internal state. Other terminals have their own shell processes with their own state.

## Solutions Implemented

### ✅ Solution 1: Start in Project Directory (DONE)
**Status:** Implemented and working

Terminals now start in the current project folder instead of the home directory.

**Changes:**
- Backend (`terminal.rs`): Added `cwd` parameter to `spawn_terminal`
- Frontend (`Terminal.jsx`): Added `cwd` prop
- App (`App.jsx`): Pass `folderHandle.path` to Panel
- Panel (`Panel.jsx`): Pass `workingDirectory` to Terminal instances

**Result:** All new terminals start in your project directory!

### 🔄 Solution 2: Directory Tracking (IN PROGRESS)
**Status:** Partially implemented

Added shell hooks to track directory changes:

**How it works:**
1. When a terminal spawns, we inject a `PROMPT_COMMAND` (bash) or `precmd` hook (zsh)
2. This hook sends the current directory to the terminal title
3. We can parse this to track where the user is
4. When switching terminals, we could restore the directory

**Current Implementation:**
- Injects tracking command after terminal initialization
- Uses escape sequences to report directory: `\\033]0;terminalId:$(pwd)\\007`
- This is a standard terminal title escape sequence

**Limitations:**
- Currently just tracks, doesn't restore yet
- Only works for bash/zsh (not PowerShell/cmd)
- Requires parsing terminal output

## Why This Is Hard

The fundamental issue is that **directory state lives in the shell process**, not in our application. There are only a few ways to handle this:

1. **Track and Restore** (what we're doing)
   - Pro: Works across terminal switches
   - Con: Complex, requires shell integration

2. **Persistent Sessions** (like tmux)
   - Pro: Perfect state preservation
   - Con: Very complex to implement

3. **Single Shell, Multiple Views** (like screen splits)
   - Pro: Natural state sharing
   - Con: Not what users expect from "multiple terminals"

## Current Status

✅ **Working:** Terminals start in project directory
🔄 **In Progress:** Directory tracking via shell hooks
❌ **Not Yet:** Automatic directory restoration

## Next Steps (If Needed)

To fully solve this, we would need to:

1. **Parse terminal output** for the directory escape sequences
2. **Store directory per terminal** in a state map
3. **Inject `cd` command** when switching back to a terminal
4. **Handle edge cases** (directory doesn't exist, permissions, etc.)

## Alternative: User Workflow

The simplest solution might be to just **accept this as normal terminal behavior** (like VS Code does) and:

- Use the project directory as the starting point (✅ done!)
- Keep terminals open instead of closing them
- Use shell history (`cd -` to go back)
- Use absolute paths when needed

## Testing

To test the current implementation:
1. Open a folder in Stan Studio
2. Open a terminal → should start in project folder ✅
3. Type `pwd` → should show project path ✅
4. Type `cd subfolder` → changes directory
5. Open another terminal → starts in project folder (not subfolder)

This is **expected behavior** - each terminal is independent!
