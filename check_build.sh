#!/bin/bash
cd src-tauri
cargo check 2> build_error.log
cat build_error.log
