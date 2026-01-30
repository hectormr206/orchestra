---
name: wasm
description: >
  WebAssembly patterns: compilation, JS interop, optimization,
  debugging, multi-language support (Rust, C++, AssemblyScript).
  Trigger: When building WASM modules or integrating compiled code.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Compiling code to WebAssembly"
    - "Building WASM modules"
    - "Optimizing WASM performance"
    - "Integrating WASM with JavaScript"
    - "Using Rust/C++ in browser"
    - "Performance-critical computations"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Building performance-critical web applications
- Porting desktop applications to web
- Implementing computationally intensive algorithms
- Creating WebAssembly modules from Rust/C++/AssemblyScript
- Optimizing existing JavaScript code paths
- Building real-time audio/video processing
- Creating game engines or physics simulations
- Implementing cryptographic operations
- Building image/video processing pipelines
- Creating portable CLI applications (with WASI)
- Server-side compute of untrusted code
- IoT and embedded applications
- Platform simulation/emulation (DOSBox, QEMU, MAME)
- Remote desktop, VPN, encryption
- Language interpreters and virtual machines

---

## Supported Languages

WebAssembly supports **30+ programming languages**. The most common:

### Production-Ready
| Language | Tooling | Best For |
|----------|---------|----------|
| **Rust** | wasm-pack, wasm-bindgen | Best overall, safe, modern |
| **C/C++** | Emscripten | Existing codebases, mature ecosystem |
| **AssemblyScript** | asc/assemblyscript | TypeScript developers, simple syntax |
| **Go** | TinyGo, Go WASM | Simple apps, note: limited stdlib |
| **C#** | Blazor, Uno Platform | .NET developers |
| **Java** | TeaVM, j2wasm | Enterprise applications |
| **Kotlin** | Kotlin/Wasm | Android developers |
| **Python** | Pyodide, Nuitka | Data science, ML |

### Experimental
- **Dart** (via Flutter)
- **F#**, **Haskell** (GHC backend, Asterius)
- **Lua**, **Ruby**, **PHP**, **R**
- **Swift**, **Scala.js**, **Zig**
- **Ada**, **Cobol**, **D**, **Pascal**, **Scheme**
- **Grain**, **Moonbit**, **RemObjects Elements**

> **Note**: This list is alphabetical. Check [webassembly.org](https://webassembly.org/getting-started/developers-guide/) for the complete list.

---

## Critical Patterns

### > **ALWAYS**

1. **Choose the right language for WASM**
   ```
   ┌─────────────────────────────────────────┐
   │ WASM LANGUAGE GUIDE                     │
   │                                         │
   │ Rust: Best overall                      │
   │ → Modern, safe, excellent tooling       │
   │ → wasm-pack, wasm-bindgen               │
   │                                         │
   │ C/C++: Best for existing codebases      │
   │ → Emscripten, mature ecosystem          │
   │                                         │
   │ AssemblyScript: Best for TypeScript devs│
   │ → TypeScript-like syntax                │
   │                                         │
   │ Go: Experimental support                │
   │ → SmallWasm, not production-ready       │
   └─────────────────────────────────────────┘
   ```

2. **Optimize WASM file size**
   ```bash
   # Rust: Optimize for size
   cargo build --release
   wasm-opt -Oz -o output.wasm input.wasm

   # Strip symbols
   wasm-strip output.wasm

   # Enable LTO (Link Time Optimization)
   # In .cargo/config
   [profile.release]
   lto = true
   opt-level = "z"  # Optimize for size
   codegen-units = 1
   ```

3. **Use proper memory management**
   ```rust
   // Rust: Use wasm-bindgen for safe memory management
   use wasm_bindgen::prelude::*;

   #[wasm_bindgen]
   pub fn process_data(data: &[u8]) -> Vec<u8> {
       // Data is automatically converted from JS
       // Return value is automatically converted to JS
       data.iter().map(|b| b * 2).collect()
   }

   // For large data, use memory directly
   #[wasm_bindgen]
   pub unsafe fn process_buffer(ptr: *mut u8, len: usize) {
       // Manually manage memory - DANGEROUS!
       // Only use when performance is critical
       let slice = std::slice::from_raw_parts_mut(ptr, len);
       for byte in slice.iter_mut() {
           *byte = byte.wrapping_add(1);
       }
   }
   ```

4. **Implement proper error handling**
   ```rust
   use wasm_bindgen::prelude::*;

   #[wasm_bindgen]
   pub fn safe_operation(input: i32) -> Result<String, JsValue> {
       if input < 0 {
           return Err(JsValue::from_str("Input must be positive"));
       }

       // Perform operation
       Ok(format!("Result: {}", input * 2))
   }

   // JavaScript side
   const result = Module.safe_operation(42);
   if (result.ok) {
       console.log(result.val);
   } else {
       console.error(result.err);
   }
   ```

5. **Use streaming instantiation for faster loading**
   ```javascript
   // ❌ Don't: Wait for entire download
   const response = await fetch('module.wasm');
   const buffer = await response.arrayBuffer();
   const module = await WebAssembly.instantiate(buffer);

   // ✅ Do: Stream compile while downloading
   const response = await fetch('module.wasm');
   const module = await WebAssembly.instantiateStreaming(response, importObject);
   ```

6. **Implement shared memory for multi-threading**
   ```rust
   // Rust: Enable threads in Cargo.toml
   [dependencies]
   wasm-bindgen = "0.2"
   web-sys = { version = "0.3", features = ["Worker", "WorkerGlobalScope"] }

   // Use rayon for parallelism
   use rayon::prelude::*;

   #[wasm_bindgen]
   pub fn parallel_process(data: Vec<i32>) -> Vec<i32> {
       data.par_iter()
           .map(|x| x * 2)
           .collect()
   }
   ```

7. **Enable SIMD for performance-critical code**
   ```rust
   // Nightly Rust required for SIMD
   #![feature(target_feature, stdsimd)]

   #[cfg(target_arch = "wasm32")]
   use std::arch::wasm32::*;

   #[wasm_bindgen]
   pub fn simd_process(a: &[f32], b: &[f32]) -> Vec<f32> {
       a.iter()
           .zip(b.iter())
           .map(|(x, y)| x * y)
           .collect()
   }

   // Enable SIMD in compilation
   // RUSTFLAGS="-C target-feature=+simd128" cargo build --release
   ```

### > **NEVER**

1. **Copy large data structures between JS and WASM unnecessarily** (use pointers)
2. **Ignore WASM linear memory limits** (max 4GB, use memory management)
3. **Use synchronous operations from WASM** (blocks main thread)
4. **Forget to enable optimizations in release builds**
5. **Ignore browser support** (check WebAssembly support first)
6. **Hardcode memory offsets** (use proper abstractions)
7. **Use panic=abort without proper error handling** (crashes browser tab)

---

## WebAssembly System Interface (WASI)

### What is WASI?

**WASI** (WebAssembly System Interface) is a system-level API for WebAssembly outside the browser. It provides POSIX-like APIs for file system access, networking, and other system resources.

### Key Features

```
┌─────────────────────────────────────────┐
│ WASI CAPABILITIES                       │
│                                         │
│ ✓ File system access                    │
│ ✓ Network sockets                       │
│ ✓ Environment variables                 │
│ ✓ Clock/time                            │
│ ✓ Random number generation              │
│ ✓ Multi-threading                       │
│ ✓ POSIX compatibility layer             │
└─────────────────────────────────────────┘
```

### Using WASI with Rust

```toml
# Cargo.toml
[dependencies]
wasi = "0.11"
```

```rust
// main.rs
use std::fs::File;
use std::io::prelude::*;

fn main() {
    // File I/O with WASI
    let mut file = File::create("output.txt").unwrap();
    file.write_all(b"Hello from WASI!").unwrap();

    // Read environment variables
    println!("PATH: {:?}", std::env::var("PATH"));
}
```

```bash
# Build for WASI
cargo build --target wasm32-wasi

# Run with WASI runtime
wasmtime target/wasm32-wasi/debug/my_app.wasm
wasmedge target/wasm32-wasi/debug/my_app.wasm
```

### WASI Runtimes

| Runtime | Language | Best For |
|---------|----------|----------|
| **wasmtime** | Rust | General-purpose, fast |
| **wasmedge** | C++ | Edge computing, small |
| **wasm3** | C | Embedded, minimal |
| **wavm** | C++ | Advanced features |
| **wasm-micro-runtime** | C | IoT, embedded |

### Example: CLI Application with WASI

```rust
use std::env;
use std::fs;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: {} <filename>", args[0]);
        std::process::exit(1);
    }

    let filename = &args[1];
    match fs::read_to_string(filename) {
        Ok(content) => {
            let lines: usize = content.lines().count();
            println!("{} lines in {}", lines, filename);
        }
        Err(e) => {
            eprintln!("Error reading {}: {}", filename, e);
            std::process::exit(1);
        }
    }
}
```

```bash
# Build
cargo build --release --target wasm32-wasi

# Run
wasmtime target/wasm32-wasi/release/my_cli.wasm input.txt
```

---

## Feature Detection

### Detecting WebAssembly Support

```javascript
// Check if WebAssembly is available
if (typeof WebAssembly === 'object') {
    console.log('WebAssembly is supported');
}

// Check for specific features
async function checkWasmFeatures() {
    const features = {
        // Basic support
        wasm: typeof WebAssembly === 'object',

        // SIMD (128-bit)
        simd: await WebAssembly.validate(
            new Uint8Array([
                0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
                0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7f,
                0x03, 0x02, 0x01, 0x00,
                0x0a, 0x09, 0x01, 0x07, 0x00, 0x20, 0x00,
                0xfd, 0x01, 0x0b
            ])
        ),

        // Threads (SharedArrayBuffer)
        threads: typeof SharedArrayBuffer !== 'undefined',

        // Bulk memory operations
        bulkMemory: await WebAssembly.validate(
            new Uint8Array([
                0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
                0x05, 0x03, 0x01, 0x00, 0x02,
                0x0b, 0x07, 0x01, 0x05, 0x00, 0xfd, 0x00, 0xfd, 0x0b
            ])
        ),

        // Reference types
        referenceTypes: await WebAssembly.validate(
            new Uint8Array([
                0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
                0x01, 0x04, 0x01, 0x60, 0x00, 0x6f,
                0x03, 0x02, 0x01, 0x00,
                0x0a, 0x05, 0x01, 0x03, 0x00, 0xd0, 0x0b
            ])
        ),

        // Exception handling
        exceptions: await WebAssembly.validate(
            new Uint8Array([
                0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
                0x01, 0x05, 0x01, 0x60, 0x00, 0x7f,
                0x01, 0x05, 0x01, 0x00, 0x00, 0x00, 0x00,
                0x0a, 0x04, 0x01, 0x02, 0x00, 0x0b
            ])
        ),

        // Multi-value
        multiValue: await WebAssembly.validate(
            new Uint8Array([
                0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
                0x01, 0x06, 0x01, 0x60, 0x00, 0x01, 0x7f, 0x7f,
                0x03, 0x02, 0x01, 0x00,
                0x0a, 0x05, 0x01, 0x03, 0x00, 0x0b
            ])
        ),
    };

    console.table(features);
    return features;
}

checkWasmFeatures();
```

### Conditional Feature Usage

```javascript
// Use SIMD if available
async function processWithSIMD(data) {
    const features = await checkWasmFeatures();

    if (features.simd) {
        const module = await import('./simd-processor.wasm');
        return module.processSIMD(data);
    } else {
        const module = await import('./scalar-processor.wasm');
        return module.processScalar(data);
    }
}
```

---

## View Source and Text Format (WAT)

### WebAssembly Text Format (WAT)

WebAssembly defines a **human-readable text format** that can be converted to/from binary:

```wat
;; simple.wat - WebAssembly Text Format
(module
  ;; Import a function from JavaScript
  (func $log (import "imports" "log") (param i32))

  ;; Define a function that doubles a number
  (func (export "double") (param $value i32) (result i32)
    local.get $value
    i32.const 2
    i32.mul)

  ;; Export another function
  (func (export "triple") (param $value i32) (result i32)
    local.get $value
    i32.const 3
    i32.mul

    ;; Call the imported log function
    call $log)
)
```

### Converting Between Formats

```bash
# Install WebAssembly Binary Toolkit
# https://github.com/WebAssembly/wabt
sudo apt install wabt  # Linux
brew install wabt      # macOS

# Convert WAT to WASM
wat2wasm simple.wat -o simple.wasm

# Convert WASM to WAT (disassemble)
wasm2wat simple.wasm -o simple.wat

# Pretty print WASM
wasm2wat simple.wasm

# Validate WASM
wat2wasm simple.wat --validate

# Generate spec test
spec2json test.spec.json
```

### Reading WAT

```wat
;; Comments start with semicolons

;; Module declaration
(module
  ;; Memory: 1 page (64KB)
  (memory (export "memory") 1)

  ;; Global variable (mutable)
  (global $counter (mut i32) (i32.const 0))

  ;; Function that adds two numbers
  (func $add (param $a i32) (param $b i32) (result i32)
    local.get $a    ;; Push $a onto stack
    local.get $b    ;; Push $b onto stack
    i32.add)        ;; Add top two values

  ;; Function with local variables
  (func $sumArray (param $ptr i32) (param $len i32) (result i32)
    (local $i i32)
    (local $sum i32)

    (local.set $sum (i32.const 0))
    (local.set $i (i32.const 0))

    (block $break (loop $continue
      ;; if i >= len, break
      local.get $i
      local.get $len
      i32.ge_u
      br_if $break

      ;; sum += memory[ptr + i * 4]
      local.get $sum
      local.get $ptr
      local.get $i
      i32.const 4
      i32.mul
      i32.add
      i32.load
      i32.add
      local.set $sum

      ;; i++
      local.get $i
      i32.const 1
      i32.add
      local.set $i

      br $continue
    ))

    local.get $sum)

  ;; Export the function
  (export "add" (func $add))
  (export "sumArray" (func $sumArray))
)
```

### Using View Source in Browser

```javascript
// WebAssembly modules can be viewed in DevTools
// Chrome/Edge: DevTools > Sources > .wasm files
// Firefox: DevTools > Debugger > .wasm files

// The text format is automatically rendered
// enabling "View Source" functionality
```

---

## wasm32 vs wasm64

### Understanding Address Spaces

```
┌─────────────────────────────────────────┐
│ WASM ADDRESS SPACE                      │
│                                         │
│ wasm32: 32-bit pointers                 │
│ → Max 4 GiB linear memory               │
│ → Smaller pointers (4 bytes)            │
│ → Better cache utilization              │
│ → Default for most applications         │
│                                         │
│ wasm64: 64-bit pointers                 │
│ → >4 GiB linear memory                  │
│ → Larger pointers (8 bytes)             │
│ → For memory-intensive applications     │
│ → Requires OS support                   │
└─────────────────────────────────────────┘
```

### When to Use wasm64

```bash
# Use wasm64 when:
# - Processing large datasets (>4GB)
# - Running scientific simulations
# - Working with large media files
# - Database applications

# Rust: Build for wasm32-unknown-unknown (default)
cargo build --target wasm32-unknown-unknown

# Build for wasm64-unknown-unknown (experimental)
cargo build --target wasm64-unknown-unknown
```

### Pointer Size Considerations

```rust
// wasm32: 4-byte pointers
// wasm64: 8-byte pointers

#[wasm_bindgen]
pub fn pointer_size() -> usize {
    std::mem::size_of::<*const ()>()
    // wasm32: 4
    // wasm64: 8
}

#[wasm_bindgen]
pub fn max_memory() -> usize {
    // wasm32: 4 GiB max
    // wasm64: Much larger (OS-dependent)
    4 * 1024 * 1024 * 1024
}
```

---

## Dynamic Linking

### Shared Memory Between Instances

```javascript
// Create a shared memory instance
const memory = new WebAssembly.Memory({
    initial: 10,
    maximum: 100,
    shared: true  // Requires SharedArrayBuffer
});

// Import into multiple instances
const importObject1 = {
    env: { memory }
};

const importObject2 = {
    env: { memory }
};

// Both instances share the same memory
const instance1 = await WebAssembly.instantiate(wasmBytes1, importObject1);
const instance2 = await WebAssembly.instantiate(wasmBytes2, importObject2);

// Changes in instance1 are visible in instance2
instance1.exports.writeToMemory(0, 42);
console.log(instance2.exports.readFromMemory(0)); // 42
```

### COOP/COEP Headers Required

```http
# Required for shared memory to work
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

```javascript
// Check if shared memory is available
if (typeof SharedArrayBuffer !== 'undefined') {
    // SharedArrayBuffer is available
    const sharedMemory = new WebAssembly.Memory({
        initial: 1,
        maximum: 10,
        shared: true
    });
} else {
    console.warn('SharedArrayBuffer not available');
    console.warn('Ensure COOP/COEP headers are set');
}
```

---

## Control-Flow Integrity (CFI)

### What is CFI?

**Control-Flow Integrity (CFI)** prevents code reuse attacks by ensuring that indirect function calls only target valid functions at compile time.

### WebAssembly Built-in CFI

WebAssembly **automatically** provides:
- **Forward-edge CFI**: Indirect calls must match declared type signatures
- **Back-edge CFI**: Protected call stack prevents return address corruption

```javascript
// Indirect call with type checking
(module
  (table 0 funcref)
  (func $foo)
  (func $bar)

  ;; Type signature is checked at runtime
  (func (export "call_indirect")
    (param $idx i32)
    i32.const 0
    local.get $idx
    call_indirect (type 0)  ;; Must match function type
  )
)
```

### Clang/LLVM CFI for WebAssembly

```bash
# Enable fine-grained CFI with Emscripten
emcc -O2 -fsanitize=cfi file.c -o output.wasm

# This provides:
# - Function-level granularity (better than default)
# - C/C++ type-level checks (richer than WASM types)
# - Better defense against code reuse attacks
```

### CFI Best Practices

```c
// Good: Function pointers with explicit types
typedef void (*handler_func)(int);

void handle_error(int code) { /* ... */ }
void handle_warning(int code) { /* ... */ }

// CFI ensures only handlers can be called
void dispatch(int type, handler_func handler) {
    handler(type);
}

// Bad: Void function pointers (bypasses type checking)
typedef void (*void_func)(void);

void unsafe_dispatch(void_func func) {
    func();  // CFI can't verify as well
}
```

---

## Advanced Security

### Memory Safety in WebAssembly

```
┌─────────────────────────────────────────┐
│ WASM MEMORY SAFETY GUARANTEES            │
│                                         │
│ ✓ Bounds checking (region-level)        │
│ ✓ Protected call stack                  │
│ ✓ Type-safe indirect calls              │
│ ✓ No undefined behavior in core spec    │
│                                         │
│ ✗ Not protected:                        │
│ → Data-only attacks                     │
│ → Race conditions (TOCTOU)              │
│ → Side-channel attacks                  │
│ → Linear memory overwrites               │
└─────────────────────────────────────────┘
```

### Mitigations NOT Needed in WASM

```c
// These mitigations are NOT needed in WebAssembly:

// ❌ Data Execution Prevention (DEP)
// → Not applicable: code and data are separate

// ❌ Stack Smashing Protection (SSP/canaries)
// → Protected call stack prevents this

// ✅ Still useful:
// → ASLR (Address Space Layout Randomization)
// → Code diversification
// → Memory randomization
```

### Side-Channel Considerations

```rust
// WebAssembly is vulnerable to side-channel attacks
// like timing attacks:

// Bad: Timing-dependent comparison
#[wasm_bindgen]
pub fn compare_passwords(a: &str, b: &str) -> bool {
    if a.len() != b.len() {
        return false;  // Timing leak
    }

    for i in 0..a.len() {
        if a.as_bytes()[i] != b.as_bytes()[i] {
            return false;  // Early exit = timing leak
        }
    }

    true
}

// Good: Constant-time comparison
#[wasm_bindgen]
pub fn compare_passwords_ct(a: &str, b: &str) -> bool {
    if a.len() != b.len() {
        // Still need to handle length mismatch carefully
        return false;
    }

    let mut result = 0u8;
    let a_bytes = a.as_bytes();
    let b_bytes = b.as_bytes();

    for i in 0..a_bytes.len() {
        result |= a_bytes[i] ^ b_bytes[i];
    }

    result == 0
}
```

---

## Non-Web Embeddings

### WASI Runtimes

```bash
# Install wasmtime (most popular)
curl https://wasmtime.dev/install.sh -sSf | sh

# Install wasmedge (for edge/IoT)
curl -sSf https://raw.githubusercontent.com/WasmEdge/WasmEdge/master/utils/install.sh | bash

# Install wasm3 (minimal, embedded)
git clone https://github.com/wasm3/wasm3.git
cd wasm3
make
```

### Server-Side WebAssembly

```rust
// main.rs - Run on server with wasmtime
use wasmtime::*;

fn main() -> Result<()> {
    let engine = Engine::default();
    let module = Module::from_file(&engine, "module.wasm")?;

    let store = Store::new(&engine);
    let instance = Instance::new(&store, &module, &[])?;

    let run = instance.get_typed_func::<(), i32>("run")?;
    let result = run.call(())?;

    println!("Result: {}", result);
    Ok(())
}
```

### Node.js WebAssembly

```javascript
// Node.js has native WASM support
const fs = require('fs');
const wasmBytes = fs.readFileSync('./module.wasm');

(async () => {
    const module = await WebAssembly.compile(wasmBytes);
    const instance = await WebAssembly.instantiate(module, {
        env: {
            memory: new WebAssembly.Memory({ initial: 1 }),
            log: (value) => console.log('WASM log:', value)
        }
    });

    const result = instance.exports.compute(42);
    console.log('Result:', result);
})();
```

### Embedded Systems

```c
// Use wasm3 for embedded systems
#include "wasm3.h"

#define STACK_SIZE 1024

void run_wasm() {
    M3Result result = m3Err_none;

    // Create runtime
    IM3Runtime runtime = m3_NewRuntime(8 * 1024, NULL);

    // Load WASM module
    IM3Module module;
    result = m3_ParseModule(&module, wasm_bytes, wasm_size);

    // Load into runtime
    result = m3_LoadModule(runtime, module);

    // Find and run function
    IM3Function func;
    result = m3_FindFunction(&func, runtime, "main");

    result = m3_CallV(func);
}
```

---

## Tooling Ecosystem

### Binary Toolkit (WABT)

```bash
# Install WABT
sudo apt install wabt

# Tools included:
wat2wasm  # WAT → WASM
wasm2wat  # WASM → WAT
wasm-objdump  # Disassemble WASM
wasm-strip  # Remove debug info
wasm-validate  # Validate WASM
wasm2json  # WASM → JSON
spectest  # Spec test interpreter
```

### Binaryen Optimizer

```bash
# Install Binaryen
npm install -g binaryen

# Optimize WASM
wasm-opt input.wasm -o output.wasm
wasm-opt -O3 input.wasm -o output.wasm  # Speed
wasm-opt -Oz input.wasm -o output.wasm  # Size

# Specific optimizations
wasm-opt --strip-debug input.wasm -o output.wasm
wasm-opt --dce input.wasm -o output.wasm  # Dead code elimination
wasm-opt --Inlining input.wasm -o output.wasm  # Inline functions
```

### Analysis Tools

```bash
# Size analysis
twiggy top 100 module.wasm  # Top 100 functions by size
wasm-objdump -h module.wasm  # Section headers

# Performance analysis
# Use browser DevTools Performance tab
# or Chrome's wasm profiler
```

---

## Rust + WASM

### Project Setup

```bash
# Install wasm-pack
cargo install wasm-pack

# Create new project
cargo new --lib my-wasm-project
cd my-wasm-project

# Configure Cargo.toml
cat > Cargo.toml << 'EOF'
[package]
name = "my-wasm-project"
version = "0.1.0"
edition = "2021"
crate-type = ["cdylib"]

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"

[dependencies.web-sys]
version = "0.3"
features = [
  "console",
  "Window",
  "Document",
]

# Optimize for size
[profile.release]
lto = true
opt-level = "z"
codegen-units = 1
panic = "abort"
EOF
```

### Basic WASM Module

```rust
// src/lib.rs
use wasm_bindgen::prelude::*;

// Call JavaScript console.log
macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

// Simple function
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

// Work with numbers
#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// Work with arrays
#[wasm_bindgen]
pub fn sum_array(numbers: &[i32]) -> i32 {
    numbers.iter().sum()
}

// Return an array
#[wasm_bindgen]
pub fn fibonacci(n: usize) -> Vec<i32> {
    let mut result = vec![0, 1];

    for i in 2..n {
        let next = result[i - 1] + result[i - 2];
        result.push(next);
    }

    result
}

// Handle errors
#[wasm_bindgen]
pub fn divide(a: f64, b: f64) -> Result<f64, JsValue> {
    if b == 0.0 {
        return Err(JsValue::from_str("Cannot divide by zero"));
    }
    Ok(a / b)
}

// Use JavaScript types
#[wasm_bindgen]
pub fn process_js_array(array: &js_sys::Array) -> Vec<f64> {
    array.iter()
        .filter_map(|v| v.as_f64())
        .collect()
}
```

### Advanced Patterns

```rust
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement};

// Access DOM elements
#[wasm_bindgen(start)]
pub fn start() {
    let window = web_sys::window().expect("no global window");
    let document = window.document().expect("no document");

    // Get canvas
    let canvas = document
        .get_element_by_id("my-canvas")
        .unwrap()
        .dyn_into::<HtmlCanvasElement>()
        .unwrap();

    let context = canvas
        .get_context("2d")
        .unwrap()
        .unwrap()
        .dyn_into::<CanvasRenderingContext2d>()
        .unwrap();

    // Draw on canvas
    context.fill_rect(10.0, 10.0, 100.0, 100.0);
}

// Export closures to JavaScript
use wasm_bindgen::JsCast;
use std::time::Duration;

#[wasm_bindgen]
pub struct Game {
    interval_id: Option<i32>,
}

#[wasm_bindgen]
impl Game {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Game {
        Game { interval_id: None }
    }

    pub fn start(&mut self) {
        let closure = Closure::wrap(Box::new(move || {
            // Game loop logic here
            log!("Game tick");
        }) as Box<dyn FnMut()>);

        let window = web_sys::window().unwrap();
        self.interval_id = Some(
            window.set_interval_with_callback_and_timeout_and_arguments_0(
                closure.as_ref().unchecked_ref(),
                16, // ~60 FPS
            ).unwrap()
        );

        // Don't drop the closure
        closure.forget();
    }

    pub fn stop(&mut self) {
        if let Some(id) = self.interval_id {
            let window = web_sys::window().unwrap();
            window.clear_interval_with_handle(id);
            self.interval_id = None;
        }
    }
}
```

### Build and Use

```bash
# Build WASM package
wasm-pack build --dev          # Development
wasm-pack build --release      # Production

# Build with specific target
wasm-pack build --target web
wasm-pack build --target bundler
wasm-pack build --target nodejs

# Test in browser
wasm-pack test --chrome
wasm-pack test --firefox
```

```javascript
// JavaScript usage
import init, { greet, add, sum_array, fibonacci, divide, Game } from './pkg/my_wasm_project.js';

async function run() {
    // Initialize WASM
    await init();

    // Call functions
    console.log(greet("World"));
    console.log(add(5, 3));

    // Work with arrays
    console.log(sum_array([1, 2, 3, 4, 5]));
    console.log(fibonacci(10));

    // Handle errors
    const result = divide(10, 2);
    if (result.ok) {
        console.log("Result:", result.val);
    } else {
        console.error("Error:", result.err);
    }

    // Use exported class
    const game = new Game();
    game.start();
    // Later...
    game.stop();
}

run();
```

---

## C/C++ + WASM (Emscripten)

### Setup

```bash
# Install Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Verify installation
emcc --version
```

### Simple C Module

```c
// simple.c
#include <emscripten.h>
#include <stdio.h>

// Simple function
EMSCRIPTEN_KEEPALIVE
int add(int a, int b) {
    return a + b;
}

// Work with arrays
EMSCRIPTEN_KEEPALIVE
int sum_array(int* arr, int length) {
    int sum = 0;
    for (int i = 0; i < length; i++) {
        sum += arr[i];
    }
    return sum;
}

// String manipulation
EMSCRIPTEN_KEEPALIVE
char* greet(char* name) {
    static char buffer[100];
    sprintf(buffer, "Hello, %s!", name);
    return buffer;
}

// Export memory to JavaScript
EMSCRIPTEN_KEEPALIVE
void* allocate_memory(int size) {
    return malloc(size);
}

EMSCRIPTEN_KEEPALIVE
void free_memory(void* ptr) {
    free(ptr);
}
```

### Compile

```bash
# Compile to WASM
emcc simple.c -o simple.html
emcc simple.c -o simple.js        # Just JS glue
emcc simple.c -o simple.wasm      # Just WASM

# Optimize
emcc -O3 simple.c -o simple.wasm
emcc -Oz simple.c -o simple.wasm  # Optimize for size

# Enable specific features
emcc -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 simple.c -o simple.js
emcc -s USE_PTHREADS=1 simple.c -o simple.js  # Enable threads

# Export specific functions
emcc -s EXPORTED_FUNCTIONS='["add","sum_array"]' simple.c -o simple.js

# Export runtime functions
emcc -s EXPORTED_RUNTIME_METHODS='["cwrap","getValue","setValue"]' simple.c -o simple.js
```

### JavaScript Integration

```javascript
// Load WASM module
const Module = await createModule();

// Call C functions
const add = Module.cwrap('add', 'number', ['number', 'number']);
const sum_array = Module.cwrap('sum_array', 'number', ['array', 'number']);
const greet = Module.cwrap('greet', 'string', ['string']);

// Use functions
console.log(add(5, 3));  // 8

// Work with arrays
const arr = new Int32Array([1, 2, 3, 4, 5]);
const sum = sum_array(arr, arr.length);
console.log(sum);  // 15

// Work with strings
const greeting = greet("World");
console.log(greeting);  // "Hello, World!"

// Manual memory management
const ptr = Module._allocate_memory(1024);
Module.HEAP8.set(new Uint8Array(1024), ptr);
// ... use memory ...
Module._free_memory(ptr);
```

### Advanced Emscripten

```c
// Use C++ classes
#include <emscripten.h>
#include <vector>
#include <algorithm>

class Calculator {
public:
    int add(int a, int b) { return a + b; }
    int multiply(int a, int b) { return a * b; }

    std::vector<int> process(std::vector<int> input) {
        std::vector<int> result;
        for (int val : input) {
            result.push_back(val * 2);
        }
        return result;
    }
};

// C wrapper for C++
extern "C" {
    Calculator* Calculator_new() {
        return new Calculator();
    }

    void Calculator_delete(Calculator* calc) {
        delete calc;
    }

    int Calculator_add(Calculator* calc, int a, int b) {
        return calc->add(a, b);
    }
}

// Embind example (simpler C++ integration)
#include <emscripten/bind.h>

using namespace emscripten;

int add(int a, int b) {
    return a + b;
}

std::vector<int> double_values(std::vector<int> input) {
    std::vector<int> result;
    for (int val : input) {
        result.push_back(val * 2);
    }
    return result;
}

EMSCRIPTEN_BINDINGS(my_module) {
    function("add", &add);
    function("double_values", &double_values);

    register_vector<int>("vector<int>");
}
```

Compile with Embind:
```bash
emcc --bind -o module.html module.cpp
```

---

## AssemblyScript

### Setup

```bash
# Install AssemblyScript
npm install -D assemblyscript

# Initialize project
npx asinit .

# Directory structure:
# ├── assembly/
# │   └── index.ts
# ├── build/
# ├── assembly.json
# └── package.json
```

### Write AssemblyScript

```typescript
// assembly/index.ts
// Simple types
export function add(a: i32, b: i32): i32 {
  return a + b;
}

// Work with arrays
export function sumArray(numbers: Int32Array): i32 {
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
  }
  return sum;
}

// Memory management
export function allocateBuffer(size: i32): Int32Array {
  return new Int32Array(size);
}

// Export class
export class Calculator {
  value: i32;

  constructor(initialValue: i32) {
    this.value = initialValue;
  }

  add(amount: i32): void {
    this.value += amount;
  }

  getValue(): i32 {
    return this.value;
  }
}

// Work with strings
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

### Compile and Use

```bash
# Compile
npm run asbuild

# Watch mode
npm run asbuild:watch
```

```javascript
// JavaScript usage
import { add, sumArray, Calculator, greet } from './build/release.js';

// Use functions
console.log(add(5, 3));

// Work with arrays
const arr = new Int32Array([1, 2, 3, 4, 5]);
console.log(sumArray(arr));

// Use class
const calc = new Calculator(10);
calc.add(5);
console.log(calc.getValue());

// Strings
console.log(greet("World"));
```

---

## Performance Optimization

### Size Optimization

```toml
# Cargo.toml - Rust
[profile.release]
lto = true              # Link-time optimization
opt-level = "z"         # Optimize for size
codegen-units = 1       # Better optimization
panic = "abort"         # Remove panic code
strip = true            # Remove debug symbols

# Remove unnecessary features
[dependencies]
wasm-bindgen = { version = "0.2", default-features = false }
```

```bash
# Use wasm-opt for additional optimization
npm install -g binaryen
wasm-opt -Oz -o output.wasm input.wasm
wasm-opt -O3 -o output.wasm input.wasm  # Optimize for speed

# Strip debug info
wasm-strip output.wasm

# Analyze size
wasm-objdump -h output.wasm
twiggy --top output.wasm  # Find largest functions
```

### Performance Optimization

```rust
// Use iterators instead of loops
#[wasm_bindgen]
pub fn sum(data: &[i32]) -> i32 {
    data.iter().sum()  // Fast
    // Not: manual loop
}

// Avoid allocations in hot paths
#[wasm_bindgen]
pub fn process(data: &[i32]) -> i32 {
    let mut sum = 0;
    for &value in data {
        sum += value;
    }
    sum
    // Not: collect into Vec
}

// Use appropriate types
#[wasm_bindgen]
pub fn process_f32(data: &[f32]) -> f32 {
    // f32 is faster than f64 in WASM
    data.iter().sum()
}

// Enable SIMD
#![feature(target_feature, stdsimd)]

#[cfg(target_arch = "wasm32")]
use std::arch::wasm32::*;

#[wasm_bindgen]
pub unsafe fn simd_add(a: &[f32], b: &[f32]) -> Vec<f32> {
    let mut result = Vec::with_capacity(a.len());

    for i in (0..a.len()).step_by(4) {
        let va = f32x4::new(a[i], a[i+1], a[i+2], a[i+3]);
        let vb = f32x4::new(b[i], b[i+1], b[i+2], b[i+3]);
        let vr = f32x4_add(va, vb);

        result.push(vr.extract(0));
        result.push(vr.extract(1));
        result.push(vr.extract(2));
        result.push(vr.extract(3));
    }

    result
}
```

### Memory Management

```rust
// Avoid copying large data
#[wasm_bindgen]
pub fn process_large_data(ptr: *mut u8, len: usize) {
    // Work directly with memory
    let slice = unsafe { std::slice::from_raw_parts_mut(ptr, len) };

    for byte in slice.iter_mut() {
        *byte = byte.wrapping_add(1);
    }
}

// Return pointer instead of copying
#[wasm_bindgen]
pub fn generate_data(len: usize) -> *const u8 {
    let data: Vec<u8> = (0..len).map(|i| i as u8).collect();

    // Leak memory to transfer ownership to JavaScript
    let ptr = data.as_ptr();
    std::mem::forget(data);

    ptr
}

// JavaScript must free the memory
#[wasm_bindgen]
pub fn free_data(ptr: *mut u8, len: usize) {
    unsafe {
        let _ = Vec::from_raw_parts(ptr, len, len);
    }
}
```

```javascript
// JavaScript side
const Module = await WebAssembly.instantiateStreaming(...);

// Allocate memory in WASM
const ptr = Module.exports.generate_data(1024);
const mem = new Uint8Array(Module.exports.memory.buffer, ptr, 1024);

// Use data
console.log(mem[0]);

// Free when done
Module.exports.free_data(ptr, 1024);
```

---

## WebAssembly Proposals

### Use Modern Proposals

```javascript
// Check feature support
async function checkWasmFeatures() {
    const supported = {
        simd: WebAssembly.validate(new Uint8Array([
            0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7f,
            0x03, 0x02, 0x01, 0x00,
            0x0a, 0x09, 0x01, 0x07, 0x00, 0x20, 0x00,
            0xfd, 0x01, 0x0b
        ])),
        threads: typeof SharedArrayBuffer !== 'undefined',
        bulkMemory: WebAssembly.validate(/* bulk memory module */),
        referenceTypes: WebAssembly.validate(/* reference types module */),
        tailCall: WebAssembly.validate(/* tail call module */),
    };

    return supported;
}
```

### SIMD (128-bit)

```rust
// Nightly Rust
#![feature(target_feature, stdsimd)]

#[cfg(target_arch = "wasm32")]
use std::arch::wasm32::*;

#[wasm_bindgen]
pub unsafe fn vector_add(a: &[f32], b: &[f32]) -> Vec<f32> {
    let mut result = Vec::with_capacity(a.len());

    for i in (0..a.len()).step_by(4) {
        let va = f32x4::new(a[i], a[i + 1], a[i + 2], a[i + 3]);
        let vb = f32x4::new(b[i], b[i + 1], b[i + 2], b[i + 3]);
        let vr = f32x4_add(va, vb);

        result.push(vr.extract(0));
        result.push(vr.extract(1));
        result.push(vr.extract(2));
        result.push(vr.extract(3));
    }

    result
}
```

### Threads (Shared Memory)

```rust
// Cargo.toml
[dependencies]
rayon = "1.5"
wasm-bindgen-rayon = "1.0"

// Build with
// RUSTFLAGS="-C opt-level=s" wasm-pack build --release --features rayon
```

```javascript
// JavaScript: Enable shared memory
// Use COOP/COEP headers
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

---

## Debugging WASM

### Debug Build

```bash
# Rust: Debug build
wasm-pack build --dev

# Enable debugging
RUSTFLAGS="-g" wasm-pack build --dev

# Use wasm-gdb
cargo install wasm-gdb
wasm-gdb target/wasm32-unknown-unknown/release/my_project.wasm
```

### Browser DevTools

```javascript
// Enable DWARF debugging
// In .cargo/config
[build]
target = "wasm32-unknown-unknown"

[target.wasm32-unknown-unknown]
rustflags = ["-g", "-C", "link-arg=--import-memory"]
```

```javascript
// Chrome DevTools
// 1. Open chrome://inspect
// 2. Select WebAssembly debug mode
// 3. Add source maps

// Add source maps in build
wasm-pack build --dev -- --no-threads
```

### Logging

```rust
// Log to browser console
use wasm_bindgen::prelude::*;
use web_sys::console;

macro_rules! log {
    ($($t:tt)*) => {
        console::log_1(&format_args!($($t)*).to_string().into())
    }
}

#[wasm_bindgen]
pub fn debug_function(x: i32) {
    log!("Called with: {}", x);

    if x > 100 {
        console::warn_1(&"Large value detected".into());
    }

    console::error_1(&"Error occurred".into());
}
```

### WASM Explorers

```bash
# Install tools
cargo install wasm-pack
cargo install wasm-snip
npm install -g wasm-dis

# Disassemble WASM
wasm-dis module.wasm -o module.wat

# Edit WAT (WebAssembly Text format)
wasm-as module.wat -o module.wasm

# View binary structure
wasm-objdump -d module.wasm
```

---

## Testing WASM

### Rust Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn test_sum_array() {
        let input = vec![1, 2, 3, 4, 5];
        assert_eq!(sum_array(&input), 15);
    }
}
```

```bash
# Run tests
cargo test

# Test WASM in browser
wasm-pack test --chrome
wasm-pack test --firefox
wasm-pack test --safari
```

### JavaScript Tests

```javascript
// test.js
import init, { add, sumArray } from './pkg/my_project.js';

describe('WASM Module', () => {
    beforeAll(async () => {
        await init();
    });

    test('add function', () => {
        expect(add(2, 3)).toBe(5);
    });

    test('sumArray function', () => {
        expect(sumArray([1, 2, 3, 4, 5])).toBe(15);
    });
});
```

### Benchmarking

```rust
// Benchmark operations
use wasm_bindgen::prelude::*;
use std::time::{Instant, Duration};

#[wasm_bindgen]
pub struct Benchmark {
    start: Option<Instant>,
}

#[wasm_bindgen]
impl Benchmark {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Benchmark {
        Benchmark { start: None }
    }

    pub fn start(&mut self) {
        self.start = Some(Instant::now());
    }

    pub fn end(&mut self) -> f64 {
        if let Some(start) = self.start {
            let duration = start.elapsed();
            duration.as_secs_f64() * 1000.0  // milliseconds
        } else {
            0.0
        }
    }
}
```

---

## Security Considerations

```
SECURITY CHECKLIST
□ Validate all inputs from JavaScript
□ Sanitize data passed to/from WASM
□ Use safe memory access patterns
□ Avoid exposing internal functions
□ Implement proper error boundaries
□ Never trust client-side WASM for auth
□ Validate WASM module integrity
□ Use SubtleCrypto for sensitive operations
```

### Input Validation

```rust
#[wasm_bindgen]
pub fn process_image(data: &[u8], width: usize, height: usize) -> Result<Vec<u8>, JsValue> {
    // Validate inputs
    if data.len() != width * height * 4 {
        return Err(JsValue::from_str("Invalid image data size"));
    }

    if width > 4096 || height > 4096 {
        return Err(JsValue::from_str("Image dimensions too large"));
    }

    // Process image
    Ok(data.to_vec())
}
```

### Memory Safety

```rust
// Always validate pointer/length
#[wasm_bindgen]
pub unsafe fn process_buffer(ptr: *const u8, len: usize) -> Result<Vec<u8>, JsValue> {
    // Check for null pointer
    if ptr.is_null() {
        return Err(JsValue::from_str("Null pointer"));
    }

    // Check reasonable length
    if len > 10_000_000 {
        return Err(JsValue::from_str("Buffer too large"));
    }

    // Create slice from raw parts
    let slice = std::slice::from_raw_parts(ptr, len);

    Ok(slice.to_vec())
}
```

### Understanding WebAssembly Traps

**Traps** immediately terminate execution when abnormal behavior occurs:

```rust
// Operations that can TRAP:

// 1. Division by zero
let _ = 10i32 / 0;  // TRAP!

// 2. Overflow in signed division
let _ = i32::MIN / -1;  // TRAP!

// 3. Out-of-bounds memory access
let data = vec![0u8; 100];
unsafe {
    let _ = *data.get_unchecked(1000);  // TRAP!
}

// 4. Invalid indirect call (type mismatch)

// 5. Stack overflow (exceeds protected call stack)

// 6. Invalid index in any index space
```

### WebAssembly Memory Safety Model

```
┌─────────────────────────────────────────┐
│ WASM MEMORY SAFETY GUARANTEES            │
│                                         │
│ INDEX SPACE (Fixed-scope variables)     │
│ ✓ Safe from buffer overflows            │
│ ✓ Addressed by index, not pointer       │
│ ✓ Local vars: in protected call stack   │
│ ✓ Global vars: in global index space    │
│                                         │
│ LINEAR MEMORY                            │
│ ⚠ Bounds-checked at REGION level        │
│ ⚠ Can overwrite adjacent objects        │
│ ✓ Protected call stack prevents ROP      │
│ ✓ DEP (Data Execution Prevention)       │
│   not needed                             │
│ ✓ SSP (Stack Smashing Protection)       │
│   not needed                             │
│                                         │
│ POINTER SEMANTICS                        │
│ ✓ No pointers for fixed-scope vars       │
│ ✓ Invalid index = load-time error        │
│   or runtime trap                        │
│ ✓ Linear memory access = runtime trap    │
└─────────────────────────────────────────┘
```

### Protected Call Stack

```c
// In C/C++, traditional stack overflow:
void vulnerable() {
    char buffer[64];
    strcpy(buffer, user_input);  // ❌ Can overwrite return address!
    // Attacker can hijack control flow
}

// In WebAssembly:
// - Protected call stack is SEPARATE from linear memory
// - Buffer overflows CANNOT corrupt return addresses
// - ROP (Return-Oriented Programming) attacks impossible
// - DEP not needed (code and data already separate)
// - SSP not needed (return addresses protected)
```

### Control-Flow Integrity (CFI)

WebAssembly provides **built-in CFI** protections:

```
┌─────────────────────────────────────────┐
│ CONTROL-FLOW INTEGRITY                   │
│                                         │
│ FORWARD-EDGE (Calls)                    │
│ ✓ Direct calls: compile-time check      │
│ ✓ Indirect calls: runtime type check    │
│                                         │
│ BACK-EDGE (Returns)                     │
│ ✓ Protected call stack                  │
│ ✓ Return addresses cannot be corrupted  │
│                                         │
│ ADDITIONAL PROTECTION:                  │
│ Fine-grained CFI with Clang/LLVM        │
│ emcc -fsanitize=cfi file.c -o out.wasm  │
│ → Function-level granularity            │
│ → C/C++ type-level checks               │
│ → Better than coarse WASM types (4)     │
│                                         │
│ NOT PROTECTED:                          │
│ ✗ Data-only attacks                     │
│ ✗ Race conditions (TOCTOU)              │
│ ✗ Side-channel attacks (timing, etc.)   │
└─────────────────────────────────────────┘
```

### Indirect Call Type Checking

```c
// WebAssembly validates indirect calls at runtime
typedef void (*handler_func)(int);

void handle_error(int code) { /* ... */ }
void handle_warning(int code) { /* ... */ }

handler_func handlers[2] = { handle_error, handle_warning };

// This call is TYPE-CHECKED at runtime
// If type signature doesn't match → TRAP
handlers[0](42);

// Enable Clang/LLVM CFI for additional protection:
// emcc -O2 -fsanitize=cfi file.c -o output.wasm
```

### Enabling CFI with Emscripten

```bash
# Enable fine-grained CFI
emcc -O2 -fsanitize=cfi file.c -o output.wasm

# Benefits:
# - Indirect calls checked at C/C++ type level
# - Better than WASM's coarse type system (only 4 types)
# - Prevents code reuse attacks via indirect calls

# Small performance cost:
# - Integer range check per indirect call
# - May be eliminated with multi-table proposal
```

### Side-Channel Protections

```rust
// WebAssembly is vulnerable to side-channel attacks

// Bad: Timing-dependent comparison
#[wasm_bindgen]
pub fn compare_passwords(a: &str, b: &str) -> bool {
    if a.len() != b.len() {
        return false;  // Timing leak via length check
    }

    for i in 0..a.len() {
        if a.as_bytes()[i] != b.as_bytes()[i] {
            return false;  // Early exit = timing leak
        }
    }
    true
}

// Good: Constant-time comparison
#[wasm_bindgen]
pub fn compare_passwords_ct(a: &str, b: &str) -> bool {
    let mut result = 0u8;

    let a_bytes = a.as_bytes();
    let b_bytes = b.as_bytes();

    // Always process all bytes (constant time)
    let min_len = a_bytes.len().min(b_bytes.len());

    for i in 0..min_len {
        result |= a_bytes[i] ^ b_bytes[i];
    }

    // Also compare lengths
    result |= (a_bytes.len() ^ b_bytes.len()) as u8;

    result == 0
}
```

---

## Real-World Use Cases

### Image Processing

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn grayscale(data: &mut [u8]) {
    for i in (0..data.len()).step_by(4) {
        let r = data[i] as f32;
        let g = data[i + 1] as f32;
        let b = data[i + 2] as f32;

        let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }
}

#[wasm_bindgen]
pub fn apply_filter(data: &mut [u8], filter: &[f32]) {
    let kernel_size = (filter.len() as f32).sqrt() as usize;

    for y in kernel_size..data.len() - kernel_size {
        for x in kernel_size..data.len() - kernel_size {
            // Apply convolution
            // ... implementation
        }
    }
}
```

### Cryptography

```rust
use sha2::{Sha256, Digest};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn hash(data: &[u8]) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().to_vec()
}
```

### Audio Processing

```rust
#[wasm_bindgen]
pub fn process_audio(samples: &mut [f32], gain: f32) {
    for sample in samples.iter_mut() {
        *sample = (*sample * gain).clamp(-1.0, 1.0);
    }
}

#[wasm_bindgen]
pub fn apply_fft(input: &[f32]) -> Vec<f32> {
    // FFT implementation
    // ... or use a library
    vec![]
}
```

### Game Physics

```rust
struct PhysicsObject {
    x: f32,
    y: f32,
    vx: f32,
    vy: f32,
    mass: f32,
}

#[wasm_bindgen]
pub struct PhysicsWorld {
    objects: Vec<PhysicsObject>,
    gravity: f32,
}

#[wasm_bindgen]
impl PhysicsWorld {
    #[wasm_bindgen(constructor)]
    pub fn new() -> PhysicsWorld {
        PhysicsWorld {
            objects: Vec::new(),
            gravity: -9.81,
        }
    }

    pub fn update(&mut self, dt: f32) {
        for obj in &mut self.objects {
            obj.vy += self.gravity * dt;
            obj.x += obj.vx * dt;
            obj.y += obj.vy * dt;
        }
    }

    pub fn add_object(&mut self, x: f32, y: f32, mass: f32) {
        self.objects.push(PhysicsObject {
            x, y, vx: 0.0, vy: 0.0, mass
        });
    }
}
```

---

## WebAssembly High-Level Goals

### Core Design Principles

```
1. PORTABLE BINARY FORMAT
   ✓ Efficient decoding (20× faster than JS parsing)
   ✓ Size-efficient for network transmission
   ✓ Compile to native speed

2. INCREMENTAL EVOLUTION
   ✓ New features as independent proposals
   ✓ Maintain layering (core spec + higher layers)
   ✓ Preserve backwards compatibility
   ✓ Prioritize based on feedback

3. WEB PLATFORM INTEGRATION
   ✓ Versionless, feature-tested evolution
   ✓ Same semantic universe as JavaScript
   ✓ Synchronous calls to/from JavaScript
   ✓ Same security policies (same-origin)
   ✓ Access via Web APIs
   ✓ Human-editable text format (View Source)

4. NON-BROWSER SUPPORT
   ✓ Execute outside browsers
   ✓ WASI for system access
   ✓ Server-side, IoT, embedded

5. GREAT PLATFORM
   ✓ Support multiple compilers
   ✓ Enable useful tooling
   ✓ High determinism
   ✓ Formal semantics specification
```

### Integration with JavaScript

```
┌─────────────────────────────────────────┐
│ WASM + JAVASCRIPT INTEGRATION            │
│                                         │
│ USAGE PATTERNS:                          │
│                                         │
│ 1. Entire WASM app                       │
│    → All code in WASM                    │
│                                         │
│ 2. Main frame WASM, UI in JS/HTML       │
│    → WASM controls canvas                │
│    → JS handles UI/DOM                   │
│                                         │
│ 3. JS app with WASM modules             │
│    → Mostly JS                           │
│    → WASM for compute (audio, video)     │
│                                         │
│ 4. Shared GC objects (future)           │
│    → Direct access to JS/DOM objects    │
│    → No walled garden                    │
└─────────────────────────────────────────┘
```

### Why WebAssembly Instead of LLVM Bitcode?

```
LLVM IR vs WebAssembly:

REQUIREMENT                  │ LLVM IR    │ WebAssembly
────────────────────────────────────────────────────
Portability (same ISA)       │ ❌ No      │ ✅ Yes
Stability over time          │ ❌ Changes  │ ✅ Stable
Small encoding               │ ❌ Verbose  │ ✅ Compact
Fast decoding                │ ❌ Slow     │ ✅ Native
Fast compilation             │ ❌ Complex  │ ✅ Simple
Minimal nondeterminism       │ ❌ UB       │ ✅ Deterministic

WebAssembly designed specifically for Web goals.
```

### Why No fast-math Mode?

```
fast-math flags introduce nondeterminism:
- Assume NaNs/infinities don't occur
- Algebraic manipulations
- Replace operators with approximations

Problem in WebAssembly:
- Runs on user side (developer can't test final behavior)
- Different implementations may behave differently

Alternatives:
- Optimize in mid-level compiler before WASM
- Use FMA operator when available
- Select math library implementation
```

### View Source Support

```javascript
// WebAssembly defines a text format (WAT)
// Automatically rendered in DevTools

// Chrome/Edge: DevTools > Sources > .wasm
// Firefox: DevTools > Debugger > .wasm
// Safari: Develop > Web Inspector > .wasm

// Also convert manually:
// wasm2wat module.wasm -o module.wat
```

---

```bash
# Rust + wasm-pack
wasm-pack build --dev
wasm-pack build --release
wasm-pack build --target web
wasm-pack test --chrome

# Emscripten
emcc file.c -o output.html
emcc -O3 file.c -o output.wasm
emcc --bind file.cpp -o output.html

# AssemblyScript
npm run asbuild
npm run asbuild:watch

# Optimization
wasm-opt -Oz -o out.wasm in.wasm
wasm-strip output.wasm
twiggy --top output.wasm

# Analysis
wasm-objdump -d output.wasm
wasm-dis output.wasm -o output.wat
wasm-size output.wasm

# Testing
cargo test
wasm-pack test --node
wasm-pack test --firefox
```

---

## Resources

- **Rust WASM**: [rustwasm.github.io](https://rustwasm.github.io/)
- **wasm-bindgen**: [rustwasm.github.io/wasm-bindgen](https://rustwasm.github.io/wasm-bindgen/)
- **Emscripten**: [emscripten.org](https://emscripten.org/)
- **AssemblyScript**: [assemblyscript.org](https://www.assemblyscript.org/)
- **MDN WebAssembly**: [developer.mozilla.org/en-US/docs/WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly)
- **WebAssembly Proposal**: [github.com/WebAssembly/proposals](https://github.com/WebAssembly/proposals)
- **Wasm Fiddle**: [wasdk.github.io/wasmfiddle](https://wasdk.github.io/wasmfiddle/)

---

## Examples

### Example 1: Complete Rust + WASM Image Processor

```rust
// src/lib.rs
use wasm_bindgen::prelude::*;

// Image filters
#[wasm_bindgen]
pub fn invert_colors(data: &mut [u8]) {
    for i in (0..data.len()).step_by(4) {
        data[i] = 255 - data[i];         // R
        data[i + 1] = 255 - data[i + 1]; // G
        data[i + 2] = 255 - data[i + 2]; // B
        // Alpha unchanged
    }
}

#[wasm_bindgen]
pub fn grayscale(data: &mut [u8]) {
    for i in (0..data.len()).step_by(4) {
        let r = data[i] as f32;
        let g = data[i + 1] as f32;
        let b = data[i + 2] as f32;

        let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }
}

#[wasm_bindgen]
pub fn threshold(data: &mut [u8], threshold: u8) {
    for i in (0..data.len()).step_by(4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        let gray = (0.299 * r as f32 + 0.587 * g as f32 + 0.114 * b as f32) as u8;

        let val = if gray > threshold { 255 } else { 0 };

        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
    }
}

#[wasm_bindgen]
pub fn brightness(data: &mut [u8], adjustment: i32) {
    for i in (0..data.len()).step_by(4) {
        data[i] = clamp(data[i] as i32 + adjustment);
        data[i + 1] = clamp(data[i + 1] as i32 + adjustment);
        data[i + 2] = clamp(data[i + 2] as i32 + adjustment);
    }
}

fn clamp(value: i32) -> u8 {
    if value < 0 { 0 }
    else if value > 255 { 255 }
    else { value as u8 }
}
```

```javascript
// JavaScript usage
import init, { invert_colors, grayscale, threshold, brightness } from './pkg/image_processor.js';

async function processImage(imageData) {
    await init();

    const data = new Uint8ClampedArray(imageData.data);

    // Apply filters
    invert_colors(data);
    grayscale(data);
    threshold(data, 128);
    brightness(data, 50);

    // Update canvas
    imageData.data.set(data);
    ctx.putImageData(imageData, 0, 0);
}
```

### Example 2: High-Performance Calculator

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn calculate_primes(limit: usize) -> Vec<usize> {
    let mut primes = Vec::new();

    for num in 2..=limit {
        let mut is_prime = true;

        for &prime in &primes {
            if prime * prime > num {
                break;
            }

            if num % prime == 0 {
                is_prime = false;
                break;
            }
        }

        if is_prime {
            primes.push(num);
        }
    }

    primes
}

#[wasm_bindgen]
pub fn fibonacci(n: usize) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => {
            let mut a = 0;
            let mut b = 1;

            for _ in 2..=n {
                let temp = a + b;
                a = b;
                b = temp;
            }

            b
        }
    }
}
```

### Example 3: File Hasher

```rust
use sha2::{Sha256, Digest};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn hash_buffer(data: &[u8]) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().to_vec()
}

#[wasm_bindgen]
pub fn hash_string(data: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data.as_bytes());

    let result = hasher.finalize();
    format!("{:x}", result)
}

#[wasm_bindgen]
pub fn hash_file(file_data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(file_data);

    let result = hasher.finalize();
    format!("{:x}", result)
}
```

```javascript
// JavaScript: Hash uploaded file
async function hashFile(file) {
    await init();

    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);
    const hash = hash_file(data);

    console.log(`SHA-256: ${hash}`);
}
```

### Example 4: Data Compression

```rust
use flate2::write::{GzEncoder, DeflateEncoder};
use flate2::Compression;
use wasm_bindgen::prelude::*;
use std::io::prelude::*;

#[wasm_bindgen]
pub fn compress_gzip(data: &[u8]) -> Result<Vec<u8>, JsValue> {
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());

    encoder
        .write_all(data)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    encoder
        .finish()
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn decompress_gzip(data: &[u8]) -> Result<Vec<u8>, JsValue> {
    use flate2::read::GzDecoder;
    use std::io::Read;

    let mut decoder = GzDecoder::new(data);
    let mut decompressed = Vec::new();

    decoder
        .read_to_end(&mut decompressed)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(decompressed)
}
```

### Example 5: JSON Parser in WASM

```rust
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize)]
#[wasm_bindgen]
pub struct User {
    name: String,
    email: String,
    age: u32,
}

#[wasm_bindgen]
impl User {
    #[wasm_bindgen(constructor)]
    pub fn new(name: String, email: String, age: u32) -> User {
        User { name, email, age }
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap()
    }

    pub fn from_json(json: &str) -> Result<User, String> {
        serde_json::from_str(json).map_err(|e| e.to_string())
    }
}
```

---

## Migration Checklist

```
MIGRATING TO WASM
□ Identify performance-critical code
□ Choose appropriate language (Rust recommended)
□ Set up build tooling (wasm-pack/Emscripten)
□ Implement basic functionality
□ Optimize for size (wasm-opt)
□ Add proper error handling
□ Test in target browsers
□ Implement fallback for no-WASM
□ Add loading indicators
□ Optimize memory usage
□ Add source maps for debugging
□ Verify performance improvements
□ Document WASM API
```
