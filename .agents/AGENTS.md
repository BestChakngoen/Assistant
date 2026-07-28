# Workspace Rules

- **Build Frequency Constraint:** If the modification is minor (such as simple text renaming, minor translations, or trivial layout adjustments that do not introduce new Tailwind classes or custom CSS rules), you do NOT need to execute `npm run build` (or equivalent build steps) every time. Save build execution only for major changes or when new CSS utility classes are added.

## 🔄 Code Refactoring Rules (กฎการ Refactor โค้ด)
- **ทำความเข้าใจภาพรวม:** ทำความเข้าใจภาพรวมของโครงสร้างระบบและ Architecture ก่อนเริ่มทำการ Refactor
- **OOP & SOLID Principles:** เขียนโค้ดตามหลักการ OOP และ SOLID Principles อย่างเคร่งครัด
- **หลีกเลี่ยง God Class:** หลีกเลี่ยงการเขียน God Class / God Object ที่รวม Responsibilities ไว้มากเกินไป
- **รักษาพฤติกรรมเดิมของระบบ:** การ Refactor ต้องรักษาฟังก์ชันการทำงานเดิม และทำให้ระบบต่างๆ ทำงานได้ถูกต้องเหมือนเดิมทุกประการ
- **ย่อยไฟล์และโมดูล:** ย่อยไฟล์ให้มีขนาดสั้นลง แยกส่วนการทำงานออกเป็นโมดูลย่อยๆ เพื่อให้ง่ายต่อการอ่าน และกลับมาแก้ไขปรับปรุงในอนาคต
- **ตรวจสอบผลลัพธ์:** ตรวจสอบและทดสอบผลลัพธ์หลังการ Refactor ให้มั่นใจว่าทำงานได้ตรงตามระบบเดิมอย่างแม่นยำ

## 🎨 CSS & Styling Rules (กฎการจัดการ Style และ CSS)
- **รวบรวมไฟล์ CSS:** ไฟล์ CSS ทั้งหมดที่เป็น Source Code ให้จัดเก็บรวบรวมไว้ในโฟลเดอร์ `css/` เดียวกัน
- **แยกไฟล์ Style ใหม่:** เมื่อมีการออกแบบการใช้ Style ใหม่ ให้จัดทำ Style นั้นแยกเป็นไฟล์ `.css` ให้อยู่ในโฟลเดอร์ `css/` แล้วเรียกใช้ (หรือ `@import`) เพื่อให้ง่ายต่อการดูแลและแก้ไขปรับปรุง


