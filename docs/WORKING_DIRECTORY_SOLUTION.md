# Working Directory Persistence Solution

## Problem
When you `cd` into a folder in a terminal and then switch terminals or close/reopen, the working directory is lost. This happens because:

1. Each terminal is an **independent shell process**
2. The `cd` command only affects **that specific shell's state**
3. When the terminal closes, the shell process dies and its state is lost

## Current Behavior (Expected but Frustrating)
```
Terminal 1: cd /home/user/project/subfolder  → Shell remembers
Switch to Terminal 2                         → Terminal 1's shell still remembers
Close Terminal 1                             → Shell process dies, state lost
Open new Terminal 1                          → New shell, starts fresh
```

## Solutions

### Option 1: Shell History Integration (Recommended)
Use shell's built-in directory history:

**For Bash:**
- Use `PROMPT_COMMAND` to track directory changes
- Save to a file: `~/.terminal_cwd_${TERMINAL_ID}`
- Restore on terminal init

**For Zsh:**
- Use `chpwd` hook
- Similar tracking mechanism

### Option 2: Terminal State Tracking
Track directory changes in the frontend:
- Parse terminal output for `cd` commands
- Maintain a state map of terminal → current directory
- Inject `cd` command when terminal regains focus

### Option 3: Persistent Shell Sessions (tmux/screen-like)
Keep shell processes alive in the background:
- Don't kill shell when terminal UI closes
- Reattach when terminal reopens
- Most complex but most powerful

## Implementation Plan

I'll implement **Option 1** as it's the most reliable and works with the shell's native behavior.

### Steps:
1. Modify terminal spawn to inject initialization script
2. Track directory changes via shell hooks
3. Restore directory on terminal creation
4. Clean up tracking files on terminal close

## Why This Happens

This is actually **normal behavior** for terminals:
- VS Code terminals: Same behavior (each terminal is independent)
- iTerm2/Terminal.app: Same behavior
- Windows Terminal: Same behavior

The difference is that some IDEs offer "workspace" terminals that automatically start in the project directory, which we've now implemented with the `cwd` prop.

## Current Fix Applied

✅ Terminals now **start** in the project directory (via `cwd` prop)
❌ Directory changes within a session are still lost (shell state)

## Next Steps

Would you like me to implement:
1. **Shell history integration** to persist `cd` changes?
2. **Persistent sessions** (tmux-like) to keep shells alive?
3. **Auto-restore** to project root when switching terminals?

Let me know which approach you prefer!
