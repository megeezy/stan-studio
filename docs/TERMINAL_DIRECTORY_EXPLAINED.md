# Working Directory Issue - Simple Explanation & Solution

## What's Actually Happening

When you open a terminal in Stan Studio:
1. A **new shell process** (bash/zsh) is spawned
2. The shell starts in the **project directory** (we just added this!)
3. When you type `cd subfolder`, the shell's **internal state** changes
4. This state **only exists in that shell process's memory**

When you switch terminals or close one:
- **The shell process keeps running** (good!)
- **But each terminal tab is a DIFFERENT shell process** (this is the issue!)

## Why You're Losing the Directory

```
Terminal Tab 1 → Shell Process A → cd /home/user/project/subfolder
Terminal Tab 2 → Shell Process B → starts in /home/user/project (different process!)
```

Each terminal tab has its **own independent shell**. This is actually **correct behavior** - it's how all terminals work (VS Code, iTerm, etc.).

## The Real Solution

There are only 2 real solutions:

### Solution 1: Don't Switch Terminals (Current Behavior)
- Each terminal maintains its own directory
- This is **normal terminal behavior**
- Just like VS Code, iTerm2, Windows Terminal

### Solution 2: Use a Single Terminal with Splits
- Use the **Split Terminal** feature (Columns icon)
- This creates **panes within the same terminal**
- All panes share the same shell session
- **This is what you want!**

## How to Use Split Terminal (Recommended)

1. Open a terminal
2. Click the **Columns icon** (⚏) in the terminal sidebar
3. This splits the terminal into panes
4. All panes share the same terminal session
5. `cd` in one pane affects all panes (same shell!)

Wait... actually that's not right either. Let me check how the splits work...

## Actually, Here's What's Happening

Looking at the code, each **pane** also gets its own shell process:
```javascript
terminalId={`${activeTerminalId}-${pane.id}`}
```

So even split panes are independent shells!

## The REAL Fix You Need

You want **persistent working directory across terminal switches**. Here's what I'll implement:

### Smart Directory Restoration
1. When you `cd` in a terminal, we'll track it
2. When you switch back to that terminal, we'll restore the directory
3. This requires parsing the terminal output or using shell hooks

Let me implement this properly...
