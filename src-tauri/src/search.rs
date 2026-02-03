use serde::{Serialize, Deserialize};
use std::path::Path;
use ignore::WalkBuilder;
use std::fs;

#[derive(Serialize, Deserialize, Debug)]
pub struct SearchResult {
    pub file: String,
    pub line: usize,
    pub content: String,
}

#[tauri::command]
pub async fn search_in_files_native(
    path: String,
    query: String,
    case_sensitive: bool,
    whole_word: bool,
    is_regex: bool,
) -> Result<Vec<SearchResult>, String> {
    let mut results = Vec::new();
    let root = Path::new(&path);

    if !root.exists() {
        return Err("Path does not exist".to_string());
    }

    // Build regex if needed
    let pattern = if is_regex {
        query.clone()
    } else {
        // Escape regex special chars if not regex mode
        regex::escape(&query)
    };

    let pattern = if whole_word {
        format!(r"\b{}\b", pattern)
    } else {
        pattern
    };

    let regex = regex::RegexBuilder::new(&pattern)
        .case_insensitive(!case_sensitive)
        .build()
        .map_err(|e| e.to_string())?;

    // Use ignore crate to walk efficiently and respect .gitignore
    let walker = WalkBuilder::new(root)
        .hidden(false) // Show hidden files? Usually yes for IDE search unless specified
        .git_ignore(true)
        .build();

    for result in walker {
        let entry = match result {
            Ok(entry) => entry,
            Err(_) => continue,
        };

        if entry.file_type().map(|f| f.is_file()).unwrap_or(false) {
            let file_path = entry.path();
            
            // Skip large binary files or non-text files optimally
            // For now, simple read
            if let Ok(content) = fs::read_to_string(file_path) {
                for (idx, line) in content.lines().enumerate() {
                    if regex.is_match(line) {
                        results.push(SearchResult {
                            file: file_path.to_string_lossy().to_string(),
                            line: idx + 1,
                            content: line.trim().to_string(),
                        });
                    }
                    
                    // Limit total results for UI performance
                    if results.len() > 2000 {
                        return Ok(results);
                    }
                }
            }
        }
    }

    Ok(results)
}
