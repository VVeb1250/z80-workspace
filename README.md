# Z80 Workspace

เว็บ IDE สำหรับเขียน / คอมไพล์ / จำลอง **Z80 assembly** รันในเบราว์เซอร์ล้วน ไม่ต้องติดตั้งอะไร — ใช้เครื่องมือ DOS ชุด `micro_processor` (Cross-16 assembler + Z80 ET-Board Simulator) ผ่าน DOSBox ที่คอมไพล์เป็น WebAssembly

> โครงหน้าตาแบบ VS Code: sidebar + editor tabs + panel ล่าง

## ดาวน์โหลด Desktop App

ดาวน์โหลดเวอร์ชันล่าสุดได้จาก [GitHub Releases](https://github.com/VVeb1250/z80-workspace/releases/latest) โดยไม่ต้อง clone repository หรือติดตั้ง Node.js

- **Windows** — installer หรือ portable (`x64` / `arm64`)
- **macOS** — universal DMG หรือ ZIP (รองรับ Intel และ Apple Silicon)
- **Linux** — AppImage หรือ DEB (`x64` / `arm64`)

แพ็กเกจปัจจุบันยังไม่ได้เซ็นด้วย code-signing certificate ระบบปฏิบัติการจึงอาจแสดงคำเตือนผู้พัฒนาที่ไม่รู้จักในครั้งแรกที่เปิด

## ฟีเจอร์

- **Editor** — Monaco (ตัวเดียวกับ VS Code) + syntax highlight Z80
- **Assemble** — รัน `C16.EXE` (Cross-16 Meta-Assembler ตัวจริง) ใน DOSBox-WASM → ได้ Intel HEX + listing + สถานะ error
- **z80sim** — จำลอง ET-Board Simulator (กราฟิกจริง) ในหน้าเดียวกัน, split ข้าง editor
- **Bridge compile → sim** — ไฟล์ `.h` ที่คอมไพล์ถูกใส่เข้า z80sim ให้อัตโนมัติ กด **L (Load)** พิมพ์ชื่อไฟล์โหลดเข้า memory ได้เลย
- **หลายไฟล์** — เปิดเป็น editor tab, เก็บใน localStorage
- **สถานะ compile ต่อไฟล์** (จุดสีใน Explorer):
  - ⚪ ยังไม่คอมไพล์
  - 🟢 คอมไพล์แล้ว ตรงกับโค้ดปัจจุบัน
  - 🟡 คอมไพล์แล้วแต่แก้โค้ดหลังจากนั้น (ต้องคอมไพล์ใหม่)
- **Dockable panels** — ลาก panel จัดใหม่ได้ (VS Code-style), maximize/restore, toggle sidebar (Ctrl+B)

## วิธีใช้

1. เขียนโค้ด Z80 ในช่อง editor
2. กด **Assemble (C16)** → ดูผลใน panel Output (Console / Listing / Hex), จุดสถานะไฟล์เป็นเขียว
3. **Export .hex / .lst** โหลดไฟล์ออกได้
4. กด **Run z80sim** → simulator เปิดข้าง editor
5. ใน z80sim กด **L** → Enter → พิมพ์ชื่อไฟล์ hex (เช่น `LAB1.H`) → โค้ดโหลดเข้า memory ตาม ORG

> ชื่อไฟล์ hex = ชื่อไฟล์ (แปลงเป็น DOS 8.3 ตัวใหญ่) + `.H` เช่น `lab1.asm` → `LAB1.H`

## รัน local

```bash
npm install
npm run dev      # dev server
npm run build    # build โปรดักชัน (ออกที่ dist/)
npm run desktop  # build และเปิด Electron app
npm run package  # สร้าง desktop package สำหรับ OS ปัจจุบัน
```

## Stack

- Vite + React + TypeScript
- [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) — editor
- [js-dos / emulators](https://js-dos.com) v8 — DOSBox-WASM (assemble แบบ headless + จำลองกราฟิก)
- [dockview](https://dockview.dev) — VS Code-style dockable layout

## โครงสร้าง

```
src/
├── state/AppState.tsx    ยกสถานะรวม (ไฟล์ / assemble / sim) เป็น context
├── dosbox/
│   ├── assembler.ts      รัน C16 headless (dosboxDirect) → hex/listing
│   └── simulator.ts      รัน z80sim กราฟิก (js-dos Dos()) + scope CSS
├── panels/               EditorPanel / ConsolePanel / SimulatorPanel
├── ExplorerSidebar.tsx   sidebar + inline new/rename + สถานะ compile
├── Dock.tsx              dockview layout
└── editor/z80language.ts syntax highlight Z80

public/
├── emulators/            wdosbox.wasm + emulators.js (assemble engine)
├── jsdos/                js-dos.js/css + wasm (simulator)
└── micro_processor/      C16.EXE, Z80.TBL, z80sim.exe, ตาราง/ข้อมูล
```

## เครดิต

- `C16.EXE` — Cross-16 Meta-Assembler, Universal Cross-Assemblers (1987)
- `z80sim.exe` — Z80 ET-Board Simulator, Dept. of Computer Engineering, Khon Kaen University (1997)
